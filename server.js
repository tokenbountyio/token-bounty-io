require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const BlockchainService = require('./services/blockchain');
const SocialVerificationService = require('./services/social');
const { sendVerificationCodeEmail } = require('./services/email');

// Mongoose Models
const User = require('./models/User');
const Project = require('./models/Project');
const SystemConfig = require('./models/SystemConfig');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
const fs = require('fs');
async function connectDB() {
    let MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
        console.log('⏳ No MONGODB_URI found in .env! Starting Auto-MongoDB embedded engine...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const dbPath = path.join(__dirname, '.mongo_data');
        if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath);
        
        try {
            const mongod = await MongoMemoryServer.create({
                instance: { port: 27017, dbPath: dbPath, storageEngine: 'wiredTiger' }
            });
            MONGODB_URI = mongod.getUri();
            console.log(`✅ Embedded MongoDB is running persistently at ${MONGODB_URI}`);
        } catch (err) {
            console.error('❌ Failed to start auto-mongo engine. Trying local fallback...', err.message);
            MONGODB_URI = 'mongodb://localhost:27017/tokenbounty';
        }
    }

    mongoose.connect(MONGODB_URI)
        .then(() => {
            console.log('✅ Connected to MongoDB successfully!');
            initializeDefaultConfig();
        })
        .catch(err => console.error('❌ MongoDB Connection Error. Please set MONGODB_URI in .env', err));
}
connectDB();

async function initializeDefaultConfig() {
    const config = await SystemConfig.findOne();
    if (!config) {
        await SystemConfig.create({});
        console.log('✅ Default SystemConfig created.');
    }
}

// In-Memory map for short-lived 6-digit codes
const pendingVerifications = new Map(); 

function validatePasswordRules(password) {
    if (!password || password.length < 8) return { valid: false, error: "Şifre en az 8 karakter olmalıdır!" };
    if (!/[A-Z]/.test(password)) return { valid: false, error: "Şifre en az 1 adet BÜYÜK HARF içermelidir!" };
    if (!/[.!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { valid: false, error: "Şifre en az 1 adet özel sembol (. ! @ # $ vb.) içermelidir!" };
    return { valid: true };
}

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, error: "Too many requests from this IP, please try again after 15 minutes." }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: "Çok fazla kayıt/giriş denemesi. Lütfen 15 dakika bekleyin." }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './')));

// --- AUTH API ENDPOINTS ---

app.post('/api/auth/register-send-code', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ success: false, error: "Geçerli bir e-posta adresi giriniz!" });

    const passCheck = validatePasswordRules(password);
    if (!passCheck.valid) return res.status(400).json({ success: false, error: passCheck.error });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ success: false, error: "Bu e-posta adresi zaten kayıtlı!" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    pendingVerifications.set(email.toLowerCase(), {
        code,
        password,
        expiresAt: Date.now() + 10 * 60 * 1000
    });

    console.log(`🔑 [AUTH ENGINE] Verification code generated for ${email}: ${code}`);
    await sendVerificationCodeEmail(email, code);

    res.json({
        success: true,
        message: `${email} adresine 6 haneli doğrulama kodunuz gönderildi!`,
        debugCode: code // Toast for bypassing email delays
    });
});

app.post('/api/auth/verify-code', async (req, res) => {
    const { email, code } = req.body;
    const pending = pendingVerifications.get(email.toLowerCase());

    if (!pending) return res.status(400).json({ success: false, error: "Doğrulama kodu süresi dolmuş veya istek bulunamadı!" });
    if (pending.code !== code.trim()) return res.status(400).json({ success: false, error: "Girdiğiniz 6 haneli doğrulama kodu hatalı!" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pending.password, salt);

    const newUser = await User.create({
        email: email.toLowerCase(),
        password: hashedPassword,
        isVerified: true
    });

    pendingVerifications.delete(email.toLowerCase());

    res.json({
        success: true,
        user: { id: newUser._id, email: newUser.email, isVerified: true, wallets: newUser.wallets },
        token: "tb_jwt_" + Math.random().toString(36).substring(2)
    });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(400).json({ success: false, error: "E-posta veya şifre hatalı!" });
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ success: false, error: "E-posta veya şifre hatalı!" });

    res.json({
        success: true,
        user: { id: user._id, email: user.email, isVerified: user.isVerified, wallets: user.wallets },
        token: "tb_jwt_" + Math.random().toString(36).substring(2)
    });
});

// --- USER WALLET API ---
app.post('/api/user/wallet', async (req, res) => {
    const { email, walletAddress, walletType } = req.body; // In production, email comes from JWT Token!
    if (!email) return res.status(401).json({ success: false, error: "Unauthorized" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    if (walletType === 'phantom') user.wallets.phantom = walletAddress;
    else if (walletType === 'metamask') user.wallets.metamask = walletAddress;
    else if (walletType === 'trust') user.wallets.trust = walletAddress;

    if (!walletAddress) {
        // Disconnect specific or all if null
        user.wallets = { phantom: null, metamask: null, trust: null };
    }

    await user.save();
    res.json({ success: true, wallets: user.wallets });
});

// --- PROJECT API ENDPOINTS ---

app.get('/api/projects', async (req, res) => {
    const projects = await Project.find({ status: 'active' }).sort({ rank: 1, addedTimestamp: -1 });
    res.json({ success: true, count: projects.length, projects });
});

app.get('/api/projects/:id', async (req, res) => {
    try {
        const proj = await Project.findById(req.params.id);
        if (!proj) return res.status(404).json({ success: false, error: "Project not found" });
        res.json({ success: true, project: proj });
    } catch (err) {
        res.status(400).json({ success: false, error: "Invalid Project ID" });
    }
});

app.post('/api/list-project', async (req, res) => {
    const data = req.body;
    if (!data.name || !data.contractAddress) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const newProject = await Project.create({
        name: data.name,
        ticker: data.ticker || "$NEW",
        network: data.network || "solana",
        price: parseFloat(data.price) || 0.001,
        bountyRemainingUSD: parseFloat(data.bountyTotalUSD) || 350,
        bountyTotalUSD: parseFloat(data.bountyTotalUSD) || 350,
        rewardPerUserUSD: parseFloat(data.rewardPerUserUSD) || 3.00,
        logo: data.logo || "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
        contractAddress: data.contractAddress,
        buyUrl: data.buyUrl || "https://raydium.io",
        websiteUrl: data.websiteUrl || "https://website.com",
        telegramGroup: data.telegramGroup || "t.me/chat",
        twitterHandle: data.twitterHandle || "@Twitter",
        status: 'pending', // Requires Admin approval
        tasks: [
            { id: "task_1", title: "Official Telegram Grubuna Katıl", type: "telegram", target: data.telegramGroup || "t.me/chat", reward: `$${((parseFloat(data.rewardPerUserUSD)||3)/2).toFixed(2)}` },
            { id: "task_2", title: "X (Twitter) Hesabını Takip Et", type: "twitter_follow", target: data.twitterHandle || "@Twitter", reward: `$${((parseFloat(data.rewardPerUserUSD)||3)/2).toFixed(2)}` }
        ]
    });

    res.json({ success: true, message: "Project submitted for approval!", project: newProject });
});

// --- ADMIN API ENDPOINTS ---
app.get('/api/admin/pending-projects', async (req, res) => {
    const projects = await Project.find({ status: 'pending' }).sort({ addedTimestamp: -1 });
    res.json({ success: true, projects });
});

app.post('/api/admin/approve-project', async (req, res) => {
    const { id } = req.body;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ success: false, error: "Project not found" });

    project.status = 'active';
    await project.save();

    // Rerank logic - push to top
    await Project.updateMany({ status: 'active', _id: { $ne: project._id } }, { $inc: { rank: 1 } });
    project.rank = 1;
    await project.save();

    res.json({ success: true, project });
});

// --- START SERVER ---
app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 TokenBounty.io Server Running on http://localhost:${PORT}`);
    console.log(`=======================================================`);
});
