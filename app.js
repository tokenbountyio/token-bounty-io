/* -------------------------------------------------------------
   TokenBounty.io - Core Application Logic
   Handles Table Rendering, Filtering, Search & Web3 Connections
   ------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    renderTokenTable("all");
    setupFilterTabs();
    setupSearchInput();
    updateWalletUI();
    updateStreakUI();
}

// Render CoinGecko-Style Chronological Table
function updateStreakUI() {
    const isConnected = !!TokenBountyStore.userState.connectedWallet;
    const streakBtn = document.getElementById("claimStreakBtn");
    const streakBadge = document.getElementById("streakDaysBadge");

    if (!isConnected) {
        // Gated state when wallet is NOT connected
        if (streakBadge) streakBadge.innerHTML = `<i class="fa-solid fa-lock"></i> Kilitli`;
        if (streakBtn) {
            streakBtn.innerHTML = `<i class="fa-solid fa-wallet"></i> Bonusu Açmak İçin Cüzdan Bağlayın`;
            streakBtn.onclick = openWalletModal;
        }
    } else {
        // Unlocked state when wallet IS connected
        const currentStreak = TokenBountyStore.userState.streakDays || 3;
        if (streakBadge) streakBadge.innerText = `${currentStreak} Gün Seri 🔥`;
        if (streakBtn) {
            streakBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Bugünkü Bonusu Al (+0.50$)`;
            streakBtn.onclick = claimDailyStreak;
        }
    }
}

function renderTokenTable(networkFilter = "all", searchQuery = "") {
    const tableBody = document.getElementById("tokenTableBody");
    if (!tableBody) return;

    let projects = TokenBountyStore.getSortedProjects();

    // Network Filtering
    if (networkFilter !== "all") {
        projects = projects.filter(p => p.network.toLowerCase() === networkFilter.toLowerCase());
    }

    // Search Filtering
    if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        projects = projects.filter(p => 
            p.name.toLowerCase().includes(q) ||
            p.ticker.toLowerCase().includes(q) ||
            p.contractAddress.toLowerCase().includes(q)
        );
    }

    if (projects.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fa-solid fa-search" style="font-size: 32px; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
                    Aradığınız kriterlere uygun token bulunamadı.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = projects.map((proj, index) => {
        const progressPct = Math.round((proj.bountyRemainingUSD / proj.bountyTotalUSD) * 100);
        const changeClass = proj.change24h >= 0 ? "up" : "down";
        const changeIcon = proj.change24h >= 0 ? "fa-caret-up" : "fa-caret-down";
        const formattedPrice = proj.price < 0.01 ? `$${proj.price.toFixed(5)}` : `$${proj.price.toFixed(2)}`;
        
        let rankDisplay = index + 1;
        if (index === 0) rankDisplay = '🥇 1';
        else if (index === 1) rankDisplay = '🥈 2';
        else if (index === 2) rankDisplay = '🥉 3';

        return `
            <tr class="token-row" onclick="openTokenDetail('${proj.id}')">
                <td class="th-rank"><span class="rank-badge">${rankDisplay}</span></td>
                <td class="th-token">
                    <div class="token-meta-cell">
                        <img src="${proj.logo}" alt="${proj.name}" class="token-logo-img" onerror="this.src='https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'">
                        <div class="token-names">
                            <span class="token-title">${proj.name}</span>
                            <span class="token-ticker-text">${proj.ticker}</span>
                        </div>
                    </div>
                </td>
                <td class="th-network">
                    <span class="network-badge ${proj.network}">${proj.network}</span>
                </td>
                <td class="th-time">
                    <span class="time-text"><i class="fa-regular fa-clock"></i> ${proj.addedTimeText}</span>
                </td>
                <td class="th-price">
                    <span class="price-text">${formattedPrice}</span>
                </td>
                <td class="th-change">
                    <span class="change-pill ${changeClass}">
                        <i class="fa-solid ${changeIcon}"></i> ${Math.abs(proj.change24h)}%
                    </span>
                </td>
                <td class="th-bounty">
                    <div class="bounty-pool-box">
                        <span class="bounty-amount">$${proj.bountyRemainingUSD} / $${proj.bountyTotalUSD}</span>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${progressPct}%;"></div>
                        </div>
                    </div>
                </td>
                <td class="th-quests">
                    <span style="font-weight: 700; color: var(--primary-cyan);">${proj.tasks.length} Görev</span>
                </td>
                <td class="th-actions">
                    <div class="action-btns" style="display: flex; gap: 8px; white-space: nowrap;" onclick="event.stopPropagation();">
                        <a href="coin-detail.html?id=${proj.id}" class="btn-table-quest"><i class="fa-solid fa-gift"></i> Görev Yap (${proj.tasks ? proj.tasks.length : 2})</a>
                        <a href="${proj.buyUrl || 'https://raydium.io'}" target="_blank" onclick="event.stopPropagation();" class="btn-table-buy"><i class="fa-solid fa-cart-shopping"></i> Satın Al</a>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// Setup Network Tabs
function setupFilterTabs() {
    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const net = btn.getAttribute("data-network");
            const searchVal = document.getElementById("tokenSearchInput")?.value || "";
            renderTokenTable(net, searchVal);
        });
    });
}

// Setup Search Input
function setupSearchInput() {
    const searchInput = document.getElementById("tokenSearchInput");
    if (!searchInput) return;
    searchInput.addEventListener("input", (e) => {
        const activeTab = document.querySelector(".filter-btn.active")?.getAttribute("data-network") || "all";
        renderTokenTable(activeTab, e.target.value);
    });
}

// Open Token Detail Page
function openTokenDetail(id) {
    window.location.href = `coin-detail.html?id=${id}`;
}

// Wallet Modal Functions
function openWalletModal() {
    const modal = document.getElementById("walletModal");
    if (TokenBountyStore.userState.connectedWallet) {
        // If already connected, show Disconnect / User Menu Modal
        const modalBody = document.querySelector("#walletModal .modal-body");
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 10px 0 20px;">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--gradient-brand); color: #000; display: flex; align-items: center; justify-content: center; font-size: 26px; margin: 0 auto 16px; box-shadow: var(--shadow-glow-cyan);">
                    <i class="fa-solid fa-wallet"></i>
                </div>
                <div style="font-size: 13px; color: var(--text-secondary);">Bağlı Web3 Cüzdanınız</div>
                <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: var(--neon-cyan); margin: 6px 0 20px;">
                    ${TokenBountyStore.userState.connectedWallet}
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <a href="profile.html" class="btn-main" style="justify-content: center; text-decoration: none;">
                        <i class="fa-solid fa-user"></i> Profilim & Cüzdanım'a Git
                    </a>
                    <button class="btn-reject" onclick="handleWalletDisconnect()" style="width: 100%; padding: 14px; border-radius: var(--radius-full); font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="fa-solid fa-right-from-bracket"></i> Hesaptan Çıkış Yap (Cüzdanı Kopar)
                    </button>
                </div>
            </div>
        `;
    }
    if (modal) modal.classList.add("active");
}

function handleWalletDisconnect() {
    TokenBountyStore.disconnectWallet();
    updateWalletUI();
    closeWalletModal();
    showToast("🚪 Cüzdan bağlantısı kesildi ve hesaptan başarıyla çıkış yapıldı!", "info");
    setTimeout(() => window.location.reload(), 800);
}

function closeWalletModal() {
    document.getElementById("walletModal")?.classList.remove("active");
}

function connectPhantom() {
    if (window.solana && window.solana.isPhantom) {
        window.solana.connect().then(res => {
            const pubKey = res.publicKey.toString();
            setWalletState(pubKey.substring(0, 6) + "..." + pubKey.substring(pubKey.length - 4), "phantom");
        }).catch(err => {
            showToast("Phantom bağlantısı reddedildi veya hata oluştu.", "error");
        });
    } else {
        setWalletState("5K9x...89a2", "phantom");
    }
}

function connectMetaMask() {
    if (window.ethereum) {
        window.ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => {
            const acc = accounts[0];
            setWalletState(acc.substring(0, 6) + "..." + acc.substring(acc.length - 4), "metamask");
        }).catch(err => {
            showToast("MetaMask bağlantısı reddedildi.", "error");
        });
    } else {
        setWalletState("0x34f...90ab", "metamask");
    }
}

function connectTrustWallet() {
    setWalletState("0x34f...90ab", "trust");
}

function setWalletState(address, type) {
    TokenBountyStore.userState.connectedWallet = address;
    TokenBountyStore.userState.walletType = type;
    TokenBountyStore.saveToStorage();
    updateWalletUI();
    updateStreakUI();
    closeWalletModal();
    showToast(`🎉 Web3 Cüzdanı Bağlandı! (${type.toUpperCase()}: ${address})`, "success");
}

function claimDailyStreak() {
    if (!TokenBountyStore.userState.connectedWallet) {
        showToast("🔒 Günlük Giriş Bonusunu alabilmek için lütfen önce Web3 cüzdanınızı bağlayın!", "warning");
        openWalletModal();
        return;
    }

    if (TokenBountyStore.userState.claimedToday) {
        showToast("🔥 Bugünkü giriş bonusunuzu zaten aldınız! Yarın tekrar bekleriz.", "info");
        return;
    }

    const current = TokenBountyStore.userState.streakDays || 1;
    TokenBountyStore.userState.streakDays = current + 1;
    updateWalletUI();
    closeWalletModal();
    alert(`Web3 Cüzdanı Bağlandı! (${type.toUpperCase()}: ${address})`);
}

function updateWalletUI() {
    const btnText = document.getElementById("walletBtnText");
    if (!btnText) return;
    if (TokenBountyStore.userState.connectedWallet) {
        btnText.innerText = TokenBountyStore.userState.connectedWallet;
    } else {
        btnText.innerText = "Cüzdan Bağla";
    }
}

// Claim Daily Streak Bonus
function claimDailyStreak() {
    if (TokenBountyStore.userState.streakClaimedToday) {
        alert("Bugünkü giriş bonusunuzu zaten aldınız! Yarın tekrar bekleriz 🔥");
        return;
    }
    TokenBountyStore.userState.streakCount += 1;
    TokenBountyStore.userState.streakClaimedToday = true;
    TokenBountyStore.saveToStorage();
    
    document.getElementById("streakCount").innerText = TokenBountyStore.userState.streakCount;
    alert("🎉 Tebrikler! Bugünkü Günlük Giriş Bonusunuz (+10% Ödül Çarpanı) Hesabınıza Tanımlandı!");
}
