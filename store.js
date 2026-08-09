/* -------------------------------------------------------------
   TokenBounty.io - Data Ledger & State Store (API Powered)
   ------------------------------------------------------------- */

function showToast(message, type = 'info') {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `web3-toast toast-${type}`;

    let iconHtml = '<i class="fa-solid fa-circle-info"></i>';
    if (type === 'success') iconHtml = '<i class="fa-solid fa-circle-check"></i>';
    else if (type === 'error') iconHtml = '<i class="fa-solid fa-circle-xmark"></i>';
    else if (type === 'warning') iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';

    toast.innerHTML = `
        <div class="web3-toast-icon">${iconHtml}</div>
        <div class="web3-toast-content">${message}</div>
        <button class="web3-toast-close" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("toast-hiding");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000' 
    : '';

const TokenBountyStore = {
    systemConfig: {
        dailyStreakRewardsUSD: [0.10, 0.20, 0.30, 0.40, 0.50, 1.00, 2.00]
    },

    userState: {
        isLoggedIn: false,
        email: null,
        connectedWallet: null, 
        walletType: null,      
        streakCount: 1, 
        streakClaimedToday: false,
        userBalances: {},
        completedTasks: []
    },

    projects: [],

    loadLocalSession() {
        const stored = localStorage.getItem("TB_UserSession");
        if (stored) {
            this.userState = { ...this.userState, ...JSON.parse(stored) };
        }
    },

    saveLocalSession() {
        localStorage.setItem("TB_UserSession", JSON.stringify({
            isLoggedIn: this.userState.isLoggedIn,
            email: this.userState.email,
            connectedWallet: this.userState.connectedWallet,
            walletType: this.userState.walletType,
            streakDays: this.userState.streakDays,
            streakLastClaimed: this.userState.streakLastClaimed
        }));
    },

    populatePlaceholders() {
        if (!this.projects) this.projects = [];
        let currentLen = this.projects.length;
        
        // Define accent colors for Chameleon effect based on Network
        const networks = ['Solana', 'Base', 'Ethereum', 'BNB Chain'];
        const accents = [
            'rgba(168, 85, 247, 0.7)', // Solana (Purple)
            'rgba(59, 130, 246, 0.7)', // Base (Blue)
            'rgba(16, 185, 129, 0.7)', // Ethereum (Greenish/Cyan for contrast)
            'rgba(245, 158, 11, 0.7)'  // BNB (Gold)
        ];

        for (let i = currentLen + 1; i <= 20; i++) {
            const netIdx = i % 4;
            this.projects.push({
                _id: 'mock' + i,
                id: 'mock-coin-' + i,
                name: 'Yükleniyor...',
                ticker: '...',
                logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
                network: networks[netIdx],
                accentColor: accents[netIdx],
                price: "0.00",
                change24h: "0.00",
                bountyRemainingUSD: 1000 + (i * 100),
                bountyTotalUSD: 5000,
                questCount: 2,
                addedTimeText: "Sistem yükleniyor"
            });
        }
    },

    async fetchProjects() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/projects`);
            const data = await res.json();
            if (data && data.success) {
                this.projects = data.projects || [];
                
                // Ensure all projects have an accent color for the Chameleon effect
                this.projects.forEach(p => {
                    if (!p.accentColor) {
                        const net = (p.network || "").toLowerCase();
                        if (net.includes('solana')) p.accentColor = 'rgba(168, 85, 247, 0.7)';
                        else if (net.includes('base')) p.accentColor = 'rgba(59, 130, 246, 0.7)';
                        else if (net.includes('bsc') || net.includes('bnb')) p.accentColor = 'rgba(245, 158, 11, 0.7)';
                        else p.accentColor = 'rgba(16, 185, 129, 0.7)'; // Default Ethereum/Other
                    }
                });
            }
        } catch (err) {
            console.error("Failed to load DB projects:", err);
            this.projects = [];
        }
        
        // Veritabanı boşsa veya az token varsa bile sayfa yapısını bozmamak için dolgu yap
        this.populatePlaceholders();
    },

    async syncUserProfile() {
        if (!this.userState.isLoggedIn || !this.userState.email) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/user/profile`, {
                headers: { 'x-user-email': this.userState.email }
            });
            const data = await res.json();
            if (data && data.success) {
                if (data.user.streak) {
                    this.userState.streakDays = data.user.streak.count || 1;
                    this.userState.streakLastClaimed = data.user.streak.lastClaimed;
                }
            }
        } catch (err) {
            console.error("Failed to sync user profile:", err);
        }
    },

    // DexScreener API live price updater
    async fetchLivePrice(contractAddress) {
        try {
            const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`);
            const data = await res.json();
            if (data && data.pairs && data.pairs.length > 0) {
                const pair = data.pairs[0];
                return {
                    priceUsd: parseFloat(pair.priceUsd) || 0,
                    priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
                    volume24h: pair.volume?.h24 || 0,
                    marketCap: pair.fdv || pair.marketCap || 0
                };
            }
        } catch (err) {
            console.warn("DexScreener API error:", err);
        }
        return null;
    },

    getSortedProjects() {
        return this.projects;
    },

    getProjectById(id) {
        return this.projects.find(p => p.id === id || p._id === id);
    },

    // Connect Web3 Wallet & Sync to DB
    async connectWeb3Wallet(type = "phantom") {
        let walletAddr = null;

        try {
            if (type === 'phantom') {
                if (!window.solana || !window.solana.isPhantom) {
                    showToast("Phantom cüzdanı bulunamadı. Lütfen uzantıyı yükleyin.", "error");
                    return null;
                }
                const response = await window.solana.connect();
                walletAddr = response.publicKey.toString();
            } else if (type === 'metamask') {
                if (!window.ethereum) {
                    showToast("MetaMask cüzdanı bulunamadı. Lütfen uzantıyı yükleyin.", "error");
                    return null;
                }
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                walletAddr = accounts[0];
            }
        } catch (err) {
            console.error("Wallet connection error:", err);
            showToast("Cüzdan bağlama işlemi iptal edildi veya başarısız oldu.", "warning");
            return null;
        }

        if (!walletAddr) return null;

        this.userState.connectedWallet = walletAddr;
        this.userState.walletType = type;
        this.saveLocalSession();
        
        if (this.userState.isLoggedIn) {
            try {
                await fetch(`${API_BASE_URL}/api/user/wallet`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: this.userState.email, walletAddress: walletAddr, walletType: type })
                });
            } catch (err) { console.error("Wallet DB Sync Failed:", err); }
        }
        
        showToast(`🎉 ${type.toUpperCase()} Cüzdanınız Başarıyla Bağlandı!`, "success");
        return this.userState;
    },

    // Disconnect Web3 Wallet & Sync to DB
    async disconnectWallet() {
        this.userState.connectedWallet = null;
        this.userState.walletType = null;
        this.saveLocalSession();

        if (this.userState.isLoggedIn) {
            try {
                await fetch(`${API_BASE_URL}/api/user/wallet`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: this.userState.email, walletAddress: null, walletType: null })
                });
            } catch (err) { console.error("Wallet DB Sync Failed:", err); }
        }
        showToast("🚪 Cüzdan bağlantısı kesildi!", "info");
    },

    // Completely Logout User
    logoutUser() {
        this.userState.isLoggedIn = false;
        this.userState.email = null;
        this.userState.connectedWallet = null;
        this.userState.walletType = null;
        localStorage.removeItem("TB_UserSession");
    }
};

// Initialize Local Auth Session immediately on load
TokenBountyStore.loadLocalSession();
