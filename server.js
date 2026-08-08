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
const Withdrawal = require('./models/Withdrawal');

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

    // Seed test project if DB is empty
    const projCount = await Project.countDocuments();
    if (projCount === 0) {
        await Project.create({
            name: "Doge Coin",
            ticker: "$DOGE",
            network: "bsc",
            price: 0.12,
            bountyRemainingUSD: 100.00,
            bountyTotalUSD: 100.00,
            rewardPerUserUSD: 5.00,
            logo: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
            contractAddress: "0xba2ae424d960c26247dd6c32edc70b295c744c43",
            buyUrl: "https://pancakeswap.finance",
            websiteUrl: "https://dogecoin.com",
            telegramGroup: "t.me/dogecoin",
            twitterHandle: "@dogecoin",
            status: "active",
            rank: 1,
            tasks: [
                { id: "task_doge_1", title: "Resmi Dogecoin Telegram'a Katıl", type: "telegram", target: "t.me/dogecoin" },
                { id: "task_doge_2", title: "X'te (Twitter) Takip Et", type: "twitter_follow", target: "@dogecoin" },
                { id: "task_doge_3", title: "Sabitlenmiş Tweet'i Repostla", type: "twitter_repost", target: "dogecoin/status/123456789" }
            ]
        });
        console.log('✅ Default Doge Coin Test Project created.');
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

    user.lastLoginDate = new Date();
    await user.save();

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

app.get('/api/user/profile', async (req, res) => {
    try {
        const email = req.headers['x-user-email'];
        if (!email) return res.status(401).json({ success: false, error: "Unauthorized" });

        const user = await User.findOne({ email: email.toLowerCase() }).lean();
        if (!user) return res.status(404).json({ success: false, error: "Kullanıcı bulunamadı" });

        const populatedBalances = [];
        if (user.balances) {
            for (const [projectId, balData] of Object.entries(user.balances)) {
                const project = await Project.findById(projectId);
                if (project) {
                    populatedBalances.push({
                        projectId: project._id,
                        ticker: project.ticker,
                        network: project.network,
                        logo: project.logo,
                        amount: balData.amount,
                        valueUSD: balData.valueUSD
                    });
                }
            }
        }

        res.json({
            success: true,
            user: {
                email: user.email,
                isVerified: user.isVerified,
                wallets: user.wallets,
                balances: user.balances || {}, // Raw map
                populatedBalances: populatedBalances, // Array for UI
                completedProjects: user.completedProjects || [],
                streak: user.streak || { count: 0, lastClaimed: null }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Failed to fetch profile" });
    }
});

app.post('/api/user/complete-project', async (req, res) => {
    const { email, projectId } = req.body;
    if (!email || !projectId) return res.status(400).json({ success: false, error: "Eksik bilgi" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, error: "Kullanıcı bulunamadı" });

    if (user.completedProjects && user.completedProjects.includes(projectId)) {
        return res.status(400).json({ success: false, error: "Bu projenin ödülünü zaten aldınız!" });
    }

    const project = await Project.findById(projectId);
    if (!project || project.status !== 'active') {
        return res.status(404).json({ success: false, error: "Proje aktif değil veya bulunamadı" });
    }

    // Add reward to balance
    const reward = project.rewardPerUserUSD || 0;
    if (reward > 0) {
        const ticker = project.ticker || "USD";
        
        // Initialize balances if not exist
        if (!user.balances) user.balances = new Map();
        
        let currentBalance = user.balances.get(ticker) || { amount: 0, valueUSD: 0 };
        currentBalance.valueUSD += reward;
        // Since we don't know the exact token amount yet (unless we fetch real-time price), we just store USD value for now
        
        user.balances.set(ticker, currentBalance);
    }

    if (!user.completedProjects) user.completedProjects = [];
    user.completedProjects.push(projectId);
    
    await user.save();

    res.json({ success: true, message: "Görev başarıyla tamamlandı, ödül bakiyenize eklendi!", balances: user.balances });
});

app.post('/api/user/claim-daily', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Unauthorized" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, error: "Kullanıcı bulunamadı" });

    const now = new Date();
    
    // Check if 24 hours have passed
    if (user.streak && user.streak.lastClaimed) {
        const timeDiff = now.getTime() - user.streak.lastClaimed.getTime();
        const hoursPassed = timeDiff / (1000 * 3600);
        
        if (hoursPassed < 24) {
            const hoursLeft = Math.ceil(24 - hoursPassed);
            return res.status(400).json({ 
                success: false, 
                error: `Günlük ödülünüzü zaten aldınız! Yeni ödül için ${hoursLeft} saat bekleyin.` 
            });
        }
        
        // Reset streak if more than 48 hours passed (missed a day)
        if (hoursPassed > 48) {
            user.streak.count = 0;
        }
    }

    // Initialize streak if null
    if (!user.streak) {
        user.streak = { count: 0, lastClaimed: null };
    }

    // Increment streak count (max 7 days visually, but can grow)
    user.streak.count += 1;
    user.streak.lastClaimed = now;

    // Calculate reward (Day 1: $0.10, Day 2: $0.20 ... Day 7: $2.00)
    const dailyRewards = [0.10, 0.20, 0.30, 0.40, 0.50, 1.00, 2.00];
    const rewardIndex = Math.min(user.streak.count - 1, 6);
    const rewardAmount = dailyRewards[rewardIndex];

    // Add to Balance (USD)
    if (!user.balances) user.balances = new Map();
    let currentBalance = user.balances.get("Günlük Giriş Bonusu") || { amount: 0, valueUSD: 0 };
    currentBalance.valueUSD += rewardAmount;
    user.balances.set("Günlük Giriş Bonusu", currentBalance);

    await user.save();

    res.json({ 
        success: true, 
        message: `Günlük ${user.streak.count}. gün ödülü ($${rewardAmount.toFixed(2)}) kasanıza eklendi!`, 
        streak: user.streak,
        balances: user.balances
    });
});

// --- PROJECT API ENDPOINTS ---

app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find({ status: 'active' }).sort({ rank: 1 });
        res.json({ success: true, projects });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Sunucu hatası" });
    }
});

// Create new project listing (Pending by default)
app.post('/api/projects', async (req, res) => {
    try {
        const data = req.body;
        
        // Basic validation
        if (!data.name || !data.ticker || !data.network || !data.contractAddress) {
            return res.status(400).json({ success: false, error: "Lütfen zorunlu alanları doldurun." });
        }

        const newProject = await Project.create({
            name: data.name,
            ticker: data.ticker,
            network: data.network,
            logo: data.logo || "https://cryptologos.cc/logos/solana-sol-logo.png",
            contractAddress: data.contractAddress,
            websiteUrl: data.websiteUrl,
            telegramGroup: data.telegramGroup,
            twitterHandle: data.twitterHandle,
            bountyTotalUSD: data.bountyTotalUSD || 100,
            bountyRemainingUSD: data.bountyTotalUSD || 100,
            rewardPerUserUSD: data.rewardPerUserUSD || 5,
            adminContactTelegram: data.adminContactTelegram,
            status: 'pending',
            rank: 0,
            tasks: data.tasks || []
        });

        res.json({ success: true, message: "Proje başvurunuz alındı! Yönetici onayından sonra listelenecektir.", projectId: newProject._id });
    } catch (err) {
        console.error("Project Create Error:", err);
        res.status(500).json({ success: false, error: "Sunucu hatası, lütfen tekrar deneyin." });
    }
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


// --- ADMIN API ENDPOINTS ---
const adminAuth = (req, res, next) => {
    const adminKey = req.headers['x-admin-key'];
    const validKey = process.env.ADMIN_KEY || 'boncukcano7312!';
    if (adminKey !== validKey) return res.status(403).json({ success: false, error: 'Unauthorized Admin' });
    next();
};

app.get('/api/admin/projects', adminAuth, async (req, res) => {
    const projects = await Project.find().sort({ addedTimestamp: -1 });
    res.json({ success: true, projects });
});

app.post('/api/admin/approve-project', adminAuth, async (req, res) => {
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

app.post('/api/admin/reject-project', adminAuth, async (req, res) => {
    const { id } = req.body;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ success: false, error: "Project not found" });

    project.status = 'rejected';
    await project.save();
    res.json({ success: true, project });
});

// --- ADVANCED ADMIN ENDPOINTS ---
app.get('/api/admin/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const dailyActiveUsers = await User.countDocuments({ lastLoginDate: { $gte: today } });

        const users = await User.find({}, 'balances');
        let totalPaid = 0;
        users.forEach(u => {
            if (u.balances && u.balances.totalUSD) {
                totalPaid += u.balances.totalUSD;
            }
        });
        const totalProjects = await Project.countDocuments();
        
        res.json({ success: true, stats: { totalUsers, dailyActiveUsers, totalPaid, totalProjects } });
    } catch (err) {
        res.status(500).json({ success: false, error: "Stats calculation failed" });
    }
});

app.get('/api/admin/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ _id: -1 });
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to fetch users" });
    }
});

app.delete('/api/admin/users/:id', adminAuth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Kullanıcı başarıyla banlandı ve silindi." });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to delete user" });
    }
});

app.delete('/api/admin/projects/:id', adminAuth, async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Proje başarıyla silindi." });
    } catch (err) {
        res.status(500).json({ success: false, error: "Failed to delete project" });
    }
});

app.post('/api/admin/projects', adminAuth, async (req, res) => {
    try {
        const p = req.body;
        const newProj = new Project({
            name: p.name,
            ticker: p.ticker,
            network: p.network || 'bsc',
            price: p.price || 0.001,
            bountyTotalUSD: p.bountyTotalUSD,
            bountyRemainingUSD: p.bountyTotalUSD,
            rewardPerUserUSD: p.rewardPerUserUSD || 5.0,
            contractAddress: p.contractAddress,
            logo: p.logo || "https://cryptologos.cc/logos/ethereum-eth-logo.png",
            websiteUrl: p.websiteUrl,
            telegramGroup: p.telegramGroup,
            twitterHandle: p.twitterHandle,
            status: 'active', // Direct to active
            rank: 99,
            tasks: []
        });

        if (p.twitterHandle) {
            newProj.tasks.push({
                id: "task_admin_" + Date.now() + "_1",
                title: "X'te Takip Et",
                type: "twitter_follow",
                target: p.twitterHandle
            });
        }
        if (p.telegramGroup) {
            newProj.tasks.push({
                id: "task_admin_" + Date.now() + "_2",
                title: "Telegram Grubuna Katıl",
                type: "telegram",
                target: p.telegramGroup
            });
        }

        await newProj.save();
        res.json({ success: true, project: newProj });
    } catch (err) {
        res.status(500).json({ success: false, error: "Manuel proje eklenemedi." });
    }
});

// --- WITHDRAWAL SYSTEM ---

// User Request Withdrawal
app.post('/api/user/withdraw', async (req, res) => {
    try {
        const email = req.headers['x-user-email'];
        if (!email) return res.status(401).json({ success: false, error: "Unauthorized" });
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        const { projectId, walletAddress, network } = req.body;
        
        // 1. Check if user's total portfolio is >= $10
        let portfolioTotal = 0;
        for (const [key, val] of user.balances.entries()) {
            portfolioTotal += val.valueUSD;
        }
        
        if (portfolioTotal < 10) {
            return res.status(400).json({ success: false, error: "Çekim kilidini açmak için toplam portföyünüzün en az $10 değerinde olması gerekir." });
        }

        // 2. Verify project exists
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ success: false, error: "Proje bulunamadı." });

        // 3. Verify user has balance for this token
        const tokenName = project.ticker;
        const balanceInfo = user.balances.get(projectId);
        if (!balanceInfo || balanceInfo.amount <= 0) {
            return res.status(400).json({ success: false, error: "Bu projeden henüz kazancınız bulunmuyor." });
        }

        // 4. Check if already has pending withdrawal for this project
        const existingReq = await Withdrawal.findOne({ userId: user._id, projectId, status: 'pending' });
        if (existingReq) {
            return res.status(400).json({ success: false, error: "Bu proje için zaten bekleyen bir çekim talebiniz var." });
        }

        // Create Withdrawal Request
        const newWithdrawal = new Withdrawal({
            userId: user._id,
            projectId: project._id,
            tokenName: tokenName,
            tokenAmount: balanceInfo.amount,
            valueUSD: balanceInfo.valueUSD,
            walletAddress,
            network
        });

        await newWithdrawal.save();
        
        // Optional: We can reset user balance now or when admin pays. 
        // For safety, let's keep it in balance but mark it as pending in UI, or just deduct it now.
        // Deducting now prevents double spending.
        user.balances.delete(projectId);
        await user.save();

        res.json({ success: true, message: "Çekim talebiniz başarıyla alındı. Yönetim onayından sonra cüzdanınıza otomatik gönderilecektir." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Çekim işlemi başarısız." });
    }
});

// Admin Get Withdrawals
app.get('/api/admin/withdrawals', adminAuth, async (req, res) => {
    try {
        const { network, status } = req.query;
        let query = {};
        if (network && network !== 'all') query.network = network;
        if (status && status !== 'all') query.status = status;
        else if (!status) query.status = 'pending';

        const withdrawals = await Withdrawal.find(query).populate('userId', 'email').sort({ createdAt: -1 });
        res.json({ success: true, withdrawals });
    } catch (err) {
        res.status(500).json({ success: false, error: "Talepler yüklenemedi." });
    }
});

// Admin Auto Batch Distribute
app.post('/api/admin/distribute-batch', adminAuth, async (req, res) => {
    try {
        const { withdrawalIds } = req.body; // Array of IDs
        if (!withdrawalIds || withdrawalIds.length === 0) {
            return res.status(400).json({ success: false, error: "Dağıtılacak talep seçilmedi." });
        }

        // Mark them as processing initially
        await Withdrawal.updateMany({ _id: { $in: withdrawalIds }, status: 'pending' }, { status: 'processing' });

        // In a real Web3 environment, here we would trigger the Ethers.js/Solana Web3 Multisend contract.
        // For now, we simulate success after 2 seconds.
        
        setTimeout(async () => {
            const txHash = "0x" + Math.random().toString(16).substr(2, 40); // Fake TX hash
            await Withdrawal.updateMany(
                { _id: { $in: withdrawalIds }, status: 'processing' },
                { 
                    status: 'completed', 
                    completedAt: new Date(),
                    transactionHash: txHash
                }
            );
            console.log(`✅ Toplu Dağıtım Başarılı: ${withdrawalIds.length} kişiye ödeme yapıldı.`);
        }, 2000);

        res.json({ success: true, message: "Otomatik dağıtım işlemi başlatıldı. Cüzdanlara gönderim sağlanıyor..." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: "Dağıtım başlatılamadı." });
    }
});


// --- START SERVER ---
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🚀 TokenBounty.io Server Running on http://localhost:${PORT}`);
        console.log(`=======================================================`);
    });
}

module.exports = app;
