/* -------------------------------------------------------------
   TokenBounty.io - Data Ledger & State Store
   Includes DexScreener API Integration & Pre-seeded Projects
   ------------------------------------------------------------- */

// Global Web3 Custom Toast Notification Engine (Replaces native browser alerts)
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

const TokenBountyStore = {
    // Global System Configuration (Configurable from Admin Panel)
    systemConfig: {
        dailyStreakRewardsUSD: [0.10, 0.20, 0.30, 0.40, 0.50, 1.00, 2.00] // Day 1 to 7
    },

    // Current Wallet & User State
    userState: {
        connectedWallet: null, 
        walletType: null,      
        streakCount: 1, // Start at day 1
        streakClaimedToday: false,
        userBalances: {},
        completedTasks: []
    },

    // Projects Database (Sorted chronologically - Newest #1 at top)
    projects: [
        {
            id: "proj_doge",
            rank: 1,
            name: "Dogecoin",
            ticker: "$DOGE",
            network: "bnb chain",
            logo: "https://cryptologos.cc/logos/dogecoin-doge-logo.png",
            contractAddress: "0xbA2aE424d960c26247Dd6c32edC70B295c744C43", // Wrapped Doge on BSC
            addedTimeText: "Yayında",
            addedTimestamp: Date.now() - 86400000,
            price: 0.165,
            change24h: 4.2,
            bountyRemainingUSD: 1000,
            bountyTotalUSD: 1000,
            rewardPerUserUSD: 5.00,
            rewardTokenAmount: 30, // tokens per $5
            buyUrl: "https://pancakeswap.finance/",
            dexScreenerUrl: "https://dexscreener.com/bsc/0xbA2aE424d960c26247Dd6c32edC70B295c744C43",
            websiteUrl: "https://dogecoin.com",
            telegramChannel: "t.me/dogecoin",
            telegramGroup: "t.me/dogecoin_chat",
            twitterHandle: "@dogecoin",
            pinnedTweetUrl: "https://x.com/dogecoin",
            marketCapUSD: "23.5B",
            volume24hUSD: "1.2B",
            totalSupply: "140,000,000,000",
            tasks: [
                { id: "task_1", title: "Dogecoin Resmi Telegram Grubuna Katıl", type: "telegram", target: "t.me/dogecoin_chat", reward: "$2.50" },
                { id: "task_2", title: "X (Twitter) Hesabını Takip Et", type: "twitter_follow", target: "@dogecoin", reward: "$2.50" }
            ]
        }
    ],

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
            console.warn("DexScreener API error, using static ticker data:", err);
        }
        return null;
    },

    // Sort projects chronologically (Newest first)
    getSortedProjects() {
        return [...this.projects].sort((a, b) => b.addedTimestamp - a.addedTimestamp);
    },

    // Get Project by ID
    getProjectById(id) {
        return this.projects.find(p => p.id === id);
    },

    // Add New Project Submission (Requires Admin Approval)
    addProject(newProjData) {
        const newProj = {
            id: `proj_${Date.now()}`,
            rank: 1,
            addedTimeText: "Az önce",
            addedTimestamp: Date.now(),
            status: "pending_approval", // Pending admin payment confirmation!
            price: newProjData.price || 0.001,
            change24h: 0.0,
            bountyRemainingUSD: newProjData.bountyTotalUSD,
            bountyTotalUSD: newProjData.bountyTotalUSD,
            rewardPerUserUSD: newProjData.rewardPerUserUSD || 3.00,
            rewardTokenAmount: Math.round((newProjData.rewardPerUserUSD || 3) / (newProjData.price || 0.001)),
            ...newProjData
        };

        // Add to pending projects array in storage
        let pending = JSON.parse(localStorage.getItem("TB_PendingProjects") || "[]");
        pending.unshift(newProj);
        localStorage.setItem("TB_PendingProjects", JSON.stringify(pending));

        return newProj;
    },

    // Admin Approves Project -> Moves to Active Projects Live on Home Table
    approveProjectByAdmin(projId) {
        let pending = JSON.parse(localStorage.getItem("TB_PendingProjects") || "[]");
        const idx = pending.findIndex(p => p.id === projId);
        let approvedProj = null;

        if (idx > -1) {
            approvedProj = pending.splice(idx, 1)[0];
            localStorage.setItem("TB_PendingProjects", JSON.stringify(pending));
        } else {
            // Check if already in pending list
            approvedProj = {
                id: projId,
                rank: 1,
                name: "SOL PEPE",
                ticker: "$SPEPE",
                network: "solana",
                logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
                contractAddress: "5K9xSolana...89a2",
                addedTimeText: "Az önce",
                addedTimestamp: Date.now(),
                status: "active",
                price: 0.0042,
                change24h: 15.4,
                bountyRemainingUSD: 500,
                bountyTotalUSD: 500,
                rewardPerUserUSD: 3.00,
                buyUrl: "https://raydium.io",
                dexScreenerUrl: "https://dexscreener.com",
                websiteUrl: "https://solpepe.io",
                telegramGroup: "t.me/solpepechat",
                telegramChannel: "t.me/solpepenews",
                twitterHandle: "@SolPepeOfficial",
                marketCapUSD: "1.2M",
                volume24hUSD: "300K",
                totalSupply: "1,000,000,000",
                tasks: [
                    { id: "task_1", title: "Official Telegram Grubuna Katıl", type: "telegram", target: "t.me/solpepechat", reward: "$1.50" },
                    { id: "task_2", title: "X (Twitter) Hesabını Takip Et", type: "twitter_follow", target: "@SolPepeOfficial", reward: "$1.50" }
                ]
            };
        }

        approvedProj.status = "active";
        approvedProj.addedTimestamp = Date.now();
        approvedProj.addedTimeText = "Az önce";

        // Add to active live projects at #1 position
        this.projects.unshift(approvedProj);
        this.projects.forEach((p, i) => p.rank = i + 1);
        this.saveToStorage();
        return approvedProj;
        localStorage.removeItem("TB_UserState");
    },

    // Connect Web3 Wallet
    connectWallet(walletAddr, type = "Phantom") {
        this.userState.connectedWallet = walletAddr;
        this.userState.walletType = type;
        localStorage.setItem("TB_UserState", JSON.stringify(this.userState));
        return this.userState;
    },

    // Disconnect Web3 Wallet / Logout
    disconnectWallet() {
        this.resetUserState();
        sessionStorage.removeItem("TB_ADMIN_AUTH");
    },

    // Local Storage Sync
    saveToStorage() {
        localStorage.setItem("TB_UserState", JSON.stringify(this.userState));
        localStorage.setItem("TB_Projects", JSON.stringify(this.projects));
        localStorage.setItem("TB_UserState", JSON.stringify(this.userState));
    },

    loadFromStorage() {
        const VERSION = "1.1.production";
        const currentVersion = localStorage.getItem("TB_Version");
        
        if (currentVersion !== VERSION) {
            // Wipe old demo data
            localStorage.removeItem("TB_Projects");
            localStorage.removeItem("TB_PendingProjects");
            // Do NOT wipe user login state if they already registered legitimately
            localStorage.setItem("TB_Version", VERSION);
        }

        const storedProjects = localStorage.getItem("TB_Projects");
        if (storedProjects) {
            this.projects = JSON.parse(storedProjects);
        }
        const storedUser = localStorage.getItem("TB_UserState");
        if (storedUser) {
            this.userState = JSON.parse(storedUser);
        }
        const storedConfig = localStorage.getItem("TB_SystemConfig");
        if (storedConfig) {
            this.systemConfig = JSON.parse(storedConfig);
        }
    }
};

// Initialize Storage
TokenBountyStore.loadFromStorage();
