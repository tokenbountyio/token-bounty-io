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
    // Current Wallet & User State
    userState: {
        connectedWallet: null, // e.g. "0x89a...21" or "Phantom: 5K...89"
        walletType: null,      // "phantom", "metamask", "trust"
        streakCount: 3,
        streakClaimedToday: false,
        userBalances: {
            // "KIMCHI": 500, "QUEST": 120
        },
        completedTasks: [
            // "project_1_task_1"
        ]
    },

    // Projects Database (Sorted chronologically - Newest #1 at top)
    projects: [
        {
            id: "proj_1",
            rank: 1,
            name: "Aura Final Boss",
            ticker: "$KIMCHI",
            network: "solana",
            logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
            contractAddress: "K1mch1SolanaTokenAddress999999999999999",
            addedTimeText: "5 dakika önce",
            addedTimestamp: Date.now() - 300000,
            price: 0.00215,
            change24h: 26.5,
            bountyRemainingUSD: 250,
            bountyTotalUSD: 350,
            rewardPerUserUSD: 3.00,
            rewardTokenAmount: 1395, // tokens per $3
            buyUrl: "https://raydium.io/swap/?inputCurrency=sol&outputCurrency=K1mch1SolanaTokenAddress999999999999999",
            dexScreenerUrl: "https://dexscreener.com/solana/K1mch1SolanaTokenAddress999999999999999",
            websiteUrl: "https://kimchiboss.io",
            telegramChannel: "t.me/KimchiFinalBossOfficial",
            telegramGroup: "t.me/KimchiFinalBossChat",
            twitterHandle: "@KimchiBossSol",
            pinnedTweetUrl: "https://x.com/KimchiBossSol/status/182000000000",
            marketCapUSD: "2.10M",
            volume24hUSD: "1.50M",
            totalSupply: "1,000,000,000",
            tasks: [
                { id: "task_1", title: "Official Telegram Grubuna Katıl", type: "telegram", target: "t.me/KimchiFinalBossChat", reward: "$1.00" },
                { id: "task_2", title: "X (Twitter) Hesabını Takip Et", type: "twitter_follow", target: "@KimchiBossSol", reward: "$1.00" },
                { id: "task_3", title: "Sabitlenmiş Reklam Tweet'ini Repost Et", type: "twitter_repost", target: "https://x.com/KimchiBossSol/status/182000000000", reward: "$1.00" }
            ]
        },
        {
            id: "proj_2",
            rank: 2,
            name: "QUEST Token",
            ticker: "$QUEST",
            network: "solana",
            logo: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png",
            contractAddress: "QUESTSolanaTokenAddress88888888888888",
            addedTimeText: "1 saat önce",
            addedTimestamp: Date.now() - 3600000,
            price: 0.0646,
            change24h: -0.2,
            bountyRemainingUSD: 180,
            bountyTotalUSD: 200,
            rewardPerUserUSD: 2.50,
            rewardTokenAmount: 38,
            buyUrl: "https://raydium.io/swap/",
            dexScreenerUrl: "https://dexscreener.com/solana/",
            websiteUrl: "https://questtoken.io",
            telegramChannel: "t.me/QuestTokenOfficial",
            telegramGroup: "t.me/QuestTokenChat",
            twitterHandle: "@QuestTokenSol",
            pinnedTweetUrl: "https://x.com/QuestTokenSol/status/182000000001",
            marketCapUSD: "236.4M",
            volume24hUSD: "85.8K",
            totalSupply: "100,000,000",
            tasks: [
                { id: "task_1", title: "Telegram Duyuru Kanalına Abone Ol", type: "telegram", target: "t.me/QuestTokenOfficial", reward: "$1.25" },
                { id: "task_2", title: "X (Twitter) Hesabını Takip Et", type: "twitter_follow", target: "@QuestTokenSol", reward: "$1.25" }
            ]
        },
        {
            id: "proj_3",
            rank: 3,
            name: "B420 Base",
            ticker: "$B420",
            network: "base",
            logo: "https://raw.githubusercontent.com/ethereum-lists/tokens/master/tokens/eth/assets/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984/logo.png",
            contractAddress: "0x4200000000000000000000000000000000000042",
            addedTimeText: "3 saat önce",
            addedTimestamp: Date.now() - 10800000,
            price: 1.150,
            change24h: 63.5,
            bountyRemainingUSD: 450,
            bountyTotalUSD: 500,
            rewardPerUserUSD: 5.00,
            rewardTokenAmount: 4.3,
            buyUrl: "https://uniswap.org/",
            dexScreenerUrl: "https://dexscreener.com/base/",
            websiteUrl: "https://b420base.com",
            telegramChannel: "t.me/B420BaseOfficial",
            telegramGroup: "t.me/B420BaseChat",
            twitterHandle: "@B420Base",
            pinnedTweetUrl: "https://x.com/B420Base/status/182000000002",
            marketCapUSD: "79.1M",
            volume24hUSD: "14.9K",
            totalSupply: "10,000,000",
            tasks: [
                { id: "task_1", title: "Telegram Grubuna Katıl", type: "telegram", target: "t.me/B420BaseChat", reward: "$2.00" },
                { id: "task_2", title: "X (Twitter) Takip Et", type: "twitter_follow", target: "@B420Base", reward: "$1.50" },
                { id: "task_3", title: "Anons Tweet'ini Repost Et", type: "twitter_repost", target: "https://x.com/B420Base/status/182000000002", reward: "$1.50" }
            ]
        },
        {
            id: "proj_4",
            rank: 4,
            name: "MarsCoin",
            ticker: "$MARS",
            network: "bsc",
            logo: "https://raw.githubusercontent.com/binance-chain/tokens-list/master/assets/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c/logo.png",
            contractAddress: "0xmars111111111111111111111111111111111111",
            addedTimeText: "9 saat önce",
            addedTimestamp: Date.now() - 32400000,
            price: 0.05121,
            change24h: -16.2,
            bountyRemainingUSD: 310,
            bountyTotalUSD: 400,
            rewardPerUserUSD: 4.00,
            rewardTokenAmount: 78,
            buyUrl: "https://pancakeswap.finance/",
            dexScreenerUrl: "https://dexscreener.com/bsc/",
            websiteUrl: "https://marscoinbsc.io",
            telegramChannel: "t.me/MarsCoinOfficial",
            telegramGroup: "t.me/MarsCoinChat",
            twitterHandle: "@MarsCoinBSC",
            pinnedTweetUrl: "https://x.com/MarsCoinBSC/status/182000000003",
            marketCapUSD: "50.5M",
            volume24hUSD: "10.7M",
            totalSupply: "500,000,000",
            tasks: [
                { id: "task_1", title: "Telegram Grubuna Katıl", type: "telegram", target: "t.me/MarsCoinChat", reward: "$2.00" },
                { id: "task_2", title: "X (Twitter) Takip Et & Repost Yap", type: "twitter_repost", target: "https://x.com/MarsCoinBSC/status/182000000003", reward: "$2.00" }
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
        this.userState.connectedWallet = null;
        this.userState.walletType = null;
        localStorage.setItem("TB_UserState", JSON.stringify(this.userState));
        return this.userState;
    },

    // Local Storage Sync
    saveToStorage() {
        localStorage.setItem("TB_Projects", JSON.stringify(this.projects));
        localStorage.setItem("TB_UserState", JSON.stringify(this.userState));
    },

    loadFromStorage() {
        const storedProjects = localStorage.getItem("TB_Projects");
        if (storedProjects) {
            this.projects = JSON.parse(storedProjects);
        }
        const storedUser = localStorage.getItem("TB_UserState");
        if (storedUser) {
            this.userState = JSON.parse(storedUser);
        }
    }
};

// Initialize Storage
TokenBountyStore.loadFromStorage();
