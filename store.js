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
            walletType: this.userState.walletType
        }));
    },

    async fetchProjects() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/projects`);
            const data = await res.json();
            if (data && data.success) {
                this.projects = data.projects;
            }
        } catch (err) {
            console.error("Failed to load DB projects:", err);
        }

        // Add 20 Placeholder items if DB is empty to test scroll/theme layout
        if (!this.projects || this.projects.length === 0) {
            this.projects = [];
            for (let i = 1; i <= 20; i++) {
                this.projects.push({
                    _id: 'mock' + i,
                    id: 'mock-coin-' + i,
                    name: 'Placeholder Token ' + i,
                    ticker: 'TK' + i,
                    logo: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
                    network: ['Solana', 'Base', 'Ethereum', 'BNB Chain'][i % 4],
                    price: (Math.random() * 10).toFixed(4),
                    change24h: (Math.random() * 20 - 10).toFixed(2),
                    bountyRemainingUSD: 1000 + (i * 100),
                    bountyTotalUSD: 5000,
                    questCount: 2,
                    addedTimeText: i + " saat önce"
                });
            }
        }
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
