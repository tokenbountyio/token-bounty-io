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
    async connectWallet(walletAddr, type = "Phantom") {
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
