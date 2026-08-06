/* -------------------------------------------------------------
   TokenBounty.io - Core Application Logic
   Handles Table Rendering, Filtering, Search, Auth & Web3 Connections
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

// Update Header UI for Auth State (Giriş Yap / Kayıt Ol or User Badge)
function updateWalletUI() {
    const actionsDiv = document.querySelector(".header-actions");
    if (!actionsDiv) return;

    const isLoggedIn = TokenBountyStore.userState.isLoggedIn;
    const userEmail = TokenBountyStore.userState.email;
    const walletAddress = TokenBountyStore.userState.connectedWallet;

    if (isLoggedIn) {
        // Logged in user header badge
        const displayLabel = walletAddress ? `${userEmail || 'Kullanıcı'} (${walletAddress})` : (userEmail || 'Kullanıcı');
        actionsDiv.innerHTML = `
            <a href="profile.html" class="btn-wallet" style="text-decoration:none;">
                <i class="fa-solid fa-user-astronaut" style="color:var(--neon-green);"></i> ${displayLabel}
            </a>
            <button onclick="handleUserLogout()" class="btn-secondary" style="padding:10px 18px;font-size:12px;border-color:rgba(244,63,94,0.5);color:#f43f5e;" title="Çıkış Yap">
                <i class="fa-solid fa-right-from-bracket"></i>
            </button>
        `;
    } else {
        // Logged out header - Giriş Yap & Kayıt Ol
        actionsDiv.innerHTML = `
            <button onclick="openLoginModal(event)" class="btn-wallet">
                <i class="fa-solid fa-key" style="color:var(--neon-cyan);"></i> Giriş Yap
            </button>
            <button onclick="openRegisterModal(event)" class="btn-main" style="padding:11px 24px;font-size:14px;">
                <i class="fa-solid fa-user-plus"></i> Kayıt Ol
            </button>
        `;
    }
}

function updateStreakUI() {
    const isConnected = !!TokenBountyStore.userState.isLoggedIn;
    const streakBtn = document.getElementById("claimStreakBtn");
    const streakBadge = document.getElementById("streakDaysBadge");
    const gridContainer = document.getElementById("streakGridContainer");
    
    // Ensure config exists (fallback if needed)
    const rewards = TokenBountyStore.systemConfig?.dailyStreakRewardsUSD || [0.10, 0.20, 0.30, 0.40, 0.50, 1.00, 2.00];
    const currentStreak = TokenBountyStore.userState.streakCount || 1;

    // Render Grid Dynamically
    if (gridContainer) {
        let gridHtml = '';
        for (let i = 1; i <= 7; i++) {
            const rewardAmt = rewards[i - 1];
            
            if (!isConnected) {
                // Not logged in -> all gray
                gridHtml += `<div class="streak-day"><span>${i}.Gün</span><span style="font-size:10px; opacity:0.7;">$${rewardAmt.toFixed(2)}</span></div>`;
            } else {
                // Logged in logic
                if (i < currentStreak) {
                    gridHtml += `<div class="streak-day done"><i class="fa-solid fa-check"></i><span>${i}.Gün</span></div>`;
                } else if (i === currentStreak) {
                    gridHtml += `<div class="streak-day active"><i class="fa-solid fa-fire"></i><span>${i}.Gün</span><span style="font-size:10px;">$${rewardAmt.toFixed(2)}</span></div>`;
                } else if (i === 7) {
                    gridHtml += `<div class="streak-day bonus"><span>Büyük Ödül</span><span style="font-size:10px;">$${rewardAmt.toFixed(2)}</span></div>`;
                } else {
                    gridHtml += `<div class="streak-day"><span>${i}.Gün</span><span style="font-size:10px; opacity:0.7;">$${rewardAmt.toFixed(2)}</span></div>`;
                }
            }
        }
        gridContainer.innerHTML = gridHtml;
    }

    if (!isConnected) {
        // Gated state when wallet is NOT connected
        if (streakBadge) streakBadge.innerHTML = `<i class="fa-solid fa-lock"></i> Kilitli`;
        if (streakBtn) {
            streakBtn.innerHTML = `<i class="fa-solid fa-wallet"></i> Bonusu Açmak İçin Cüzdan Bağlayın`;
            streakBtn.onclick = openLoginModal; // It's better to open login modal instead of wallet modal now
        }
    } else {
        // Unlocked state when wallet IS connected
        if (streakBadge) streakBadge.innerText = `${currentStreak} Gün Seri 🔥`;
        if (streakBtn) {
            const todayReward = rewards[currentStreak - 1] || 0.10;
            streakBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Bugünkü Bonusu Al (+$${todayReward.toFixed(2)})`;
            streakBtn.onclick = claimDailyStreak;
        }
    }
}

// Render CoinGecko-Style Chronological Table with Sparklines
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
                <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                    <i class="fa-solid fa-search" style="font-size: 32px; margin-bottom: 10px; display: block; opacity: 0.5;"></i>
                    Aradığınız kriterlere uygun token bulunamadı.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = projects.map((item, index) => {
        const rankBadge = index < 3 ? ['🥇 1', '🥈 2', '🥉 3'][index] : index + 1;
        const progressPercent = Math.round((item.bountyRemainingUSD / item.bountyTotalUSD) * 100);
        const timeAgo = item.addedTimeText || "Az önce";
        const isUp = item.change24h >= 0;
        const changeClass = isUp ? "up" : "down";
        const changeIcon = isUp ? '<i class="fa-solid fa-caret-up"></i>' : '<i class="fa-solid fa-caret-down"></i>';
        const changeSign = isUp ? "+" : "";

        // Dynamic SVG sparkline curve
        const sparklineColor = isUp ? "#10b981" : "#f43f5e";
        const sparklineSvg = isUp 
            ? `<svg width="80" height="26" viewBox="0 0 80 26"><path d="M0,20 Q20,24 40,10 T80,4" fill="none" stroke="${sparklineColor}" stroke-width="2.2" stroke-linecap="round"/></svg>`
            : `<svg width="80" height="26" viewBox="0 0 80 26"><path d="M0,4 Q20,10 40,20 T80,24" fill="none" stroke="${sparklineColor}" stroke-width="2.2" stroke-linecap="round"/></svg>`;

        return `
            <tr class="token-row" onclick="openTokenDetail('${item.id}')">
                <td class="th-rank"><span class="rank-badge">${rankBadge}</span></td>
                <td class="th-token">
                    <div class="token-meta-cell">
                        <img src="${item.logo}" alt="${item.name}" class="token-logo-img" onerror="this.src='https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'">
                        <div class="token-names">
                            <span class="token-title">${item.name}</span>
                            <span class="token-ticker-text">$${item.symbol || item.ticker}</span>
                        </div>
                    </div>
                </td>
                <td class="th-network">
                    <span class="network-badge ${item.network}">${item.network}</span>
                </td>
                <td class="th-time">
                    <span class="time-text"><i class="fa-regular fa-clock"></i> ${timeAgo}</span>
                </td>
                <td class="th-price">
                    <span class="price-text">$${item.price}</span>
                </td>
                <td class="th-change">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="change-pill ${changeClass}">${changeIcon} ${changeSign}${item.change24h}%</span>
                        ${sparklineSvg}
                    </div>
                </td>
                <td class="th-bounty">
                    <div class="bounty-pool-box">
                        <span class="bounty-amount">$${item.bountyRemainingUSD} / $${item.bountyTotalUSD}</span>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
                        </div>
                    </div>
                </td>
                <td class="th-quests">
                    <span style="font-weight: 700; color: var(--neon-cyan);">${item.questCount || 2} Görev</span>
                </td>
                <td class="th-actions">
                    <div class="action-btns" style="display: flex; gap: 8px; white-space: nowrap;" onclick="event.stopPropagation();">
                        <a href="coin-detail.html?id=${item.id}" class="btn-table-quest"><i class="fa-solid fa-gift"></i> Görev Yap</a>
                        <a href="${item.buyUrl || 'https://raydium.io'}" target="_blank" onclick="event.stopPropagation();" class="btn-table-buy"><i class="fa-solid fa-cart-shopping"></i> Satın Al</a>
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

function openTokenDetail(id) {
    window.location.href = `coin-detail.html?id=${id}`;
}

// Auth Modals Management (Login & Register & 6-Digit Verification)
function openLoginModal(e) {
    if (e) e.preventDefault();
    closeAuthModals();
    let modal = document.getElementById("loginModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "loginModal";
        modal.className = "modal-backdrop";
        modal.innerHTML = `
            <div class="modal-card">
                <div class="modal-header">
                    <h3 style="display:flex;align-items:center;gap:10px;"><i class="fa-solid fa-right-to-bracket" style="color:var(--neon-cyan);"></i> Hesabınıza Giriş Yapın</h3>
                    <button class="modal-close" onclick="closeAuthModals()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div style="margin-bottom:16px;">
                    <label style="display:block;font-size:12px;font-weight:800;color:var(--text-tertiary);margin-bottom:6px;">E-POSTA ADRESİ</label>
                    <input type="email" id="loginEmail" placeholder="ornek@domain.com" style="width:100%;padding:14px;background:var(--bg-surface-elevated);border:1px solid var(--border-hover);border-radius:12px;color:#fff;outline:none;">
                </div>
                <div style="margin-bottom:24px;">
                    <label style="display:block;font-size:12px;font-weight:800;color:var(--text-tertiary);margin-bottom:6px;">ŞİFRE</label>
                    <input type="password" id="loginPass" placeholder="••••••••" style="width:100%;padding:14px;background:var(--bg-surface-elevated);border:1px solid var(--border-hover);border-radius:12px;color:#fff;outline:none;" onkeyup="if(event.key==='Enter')submitLogin()">
                </div>
                <button onclick="submitLogin()" class="btn-main" style="width:100%;justify-content:center;margin-bottom:16px;"><i class="fa-solid fa-key"></i> Giriş Yap</button>
                <p style="text-align:center;font-size:13px;color:var(--text-secondary);">Hesabınız yok mu? <a href="#" onclick="openRegisterModal(event)" style="color:var(--neon-cyan);font-weight:700;">Hemen Kaydolun</a></p>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.add("active");
}

function openRegisterModal(e) {
    if (e) e.preventDefault();
    closeAuthModals();
    let modal = document.getElementById("registerModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "registerModal";
        modal.className = "modal-backdrop";
        modal.innerHTML = `
            <div class="modal-card">
                <div class="modal-header">
                    <h3 style="display:flex;align-items:center;gap:10px;"><i class="fa-solid fa-user-plus" style="color:var(--neon-green);"></i> Yeni Hesap Oluşturun</h3>
                    <button class="modal-close" onclick="closeAuthModals()"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div style="margin-bottom:14px;">
                    <label style="display:block;font-size:12px;font-weight:800;color:var(--text-tertiary);margin-bottom:6px;">E-POSTA ADRESİ</label>
                    <input type="email" id="regEmail" placeholder="ornek@domain.com" style="width:100%;padding:14px;background:var(--bg-surface-elevated);border:1px solid var(--border-hover);border-radius:12px;color:#fff;outline:none;">
                </div>
                <div style="margin-bottom:14px;">
                    <label style="display:block;font-size:12px;font-weight:800;color:var(--text-tertiary);margin-bottom:6px;">GÜVENLİ ŞİFRE</label>
                    <input type="password" id="regPass" placeholder="••••••••" style="width:100%;padding:14px;background:var(--bg-surface-elevated);border:1px solid var(--border-hover);border-radius:12px;color:#fff;outline:none;" oninput="checkPasswordStrength(this.value)">
                    <div id="passStrengthText" style="margin-top:6px;font-size:12px;"></div>
                </div>
                <div style="background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:12px;padding:12px;margin-bottom:20px;font-size:12px;display:flex;flex-direction:column;gap:4px;">
                    <span id="reqLen"><i class="fa-solid fa-check"></i> En az 8 Karakter</span>
                    <span id="reqCap"><i class="fa-solid fa-check"></i> En az 1 BÜYÜK HARF</span>
                    <span id="reqSym"><i class="fa-solid fa-check"></i> En az 1 Özel Sembol (. ! @ # $ vb.)</span>
                </div>
                <button onclick="submitRegisterEmail()" class="btn-main" style="width:100%;justify-content:center;margin-bottom:16px;"><i class="fa-solid fa-paper-plane"></i> 6 Haneli Onay Kodu Gönder</button>
                <p style="text-align:center;font-size:13px;color:var(--text-secondary);">Zaten hesabınız var mı? <a href="#" onclick="openLoginModal(event)" style="color:var(--neon-cyan);font-weight:700;">Giriş Yapın</a></p>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.add("active");
}

function openVerifyCodeModal(email) {
    closeAuthModals();
    let modal = document.getElementById("verifyCodeModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "verifyCodeModal";
        modal.className = "modal-backdrop";
        modal.innerHTML = `
            <div class="modal-card" style="text-align:center;">
                <div style="font-size:40px;color:var(--neon-green);margin-bottom:12px;"><i class="fa-solid fa-envelope-circle-check"></i></div>
                <h3 style="margin-bottom:8px;">E-Posta Doğrulama Kodu</h3>
                <p style="color:var(--text-secondary);font-size:14px;margin-bottom:24px;"><strong id="verifyEmailTarget" style="color:#fff;">${email}</strong> adresinize gönderilen 6 haneli güvenlik kodunu giriniz:</p>
                <div style="margin-bottom:24px;">
                    <input type="text" id="verifyCodeInput" maxlength="6" placeholder="• • • • • •" style="width:220px;padding:16px;text-align:center;font-size:28px;font-weight:800;letter-spacing:10px;font-family:monospace;background:var(--bg-surface-elevated);border:2px solid var(--neon-green);border-radius:16px;color:var(--neon-green);outline:none;">
                </div>
                <button onclick="submitVerifyCode('${email}')" class="btn-main" style="width:100%;justify-content:center;margin-bottom:12px;"><i class="fa-solid fa-circle-check"></i> Kodu Onayla & Giriş Yap</button>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        const target = document.getElementById("verifyEmailTarget");
        if (target) target.innerText = email;
    }
    modal.classList.add("active");
}

function checkPasswordStrength(val) {
    const meter = document.getElementById("passStrengthText");
    const reqCap = document.getElementById("reqCap");
    const reqSym = document.getElementById("reqSym");
    const reqLen = document.getElementById("reqLen");

    const hasLen = val.length >= 8;
    const hasCap = /[A-Z]/.test(val);
    const hasSym = /[.!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val);

    if (reqLen) reqLen.style.color = hasLen ? "var(--neon-green)" : "var(--text-tertiary)";
    if (reqCap) reqCap.style.color = hasCap ? "var(--neon-green)" : "var(--text-tertiary)";
    if (reqSym) reqSym.style.color = hasSym ? "var(--neon-green)" : "var(--text-tertiary)";

    if (!meter) return;

    if (!val) {
        meter.innerHTML = "";
    } else if (hasLen && hasCap && hasSym) {
        meter.innerHTML = '<span style="color:var(--neon-green);font-weight:800;"><i class="fa-solid fa-shield-halved"></i> Güçlü & Güvenli Şifre</span>';
    } else {
        meter.innerHTML = '<span style="color:var(--color-down);font-weight:700;"><i class="fa-solid fa-circle-exclamation"></i> Zayıf Şifre (Kuralları Tamamlayın)</span>';
    }
}

function closeAuthModals() {
    document.querySelectorAll(".modal-backdrop").forEach(m => m.classList.remove("active"));
}

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000' 
    : ''; // Canlı sunucuya atılınca buraya gerçek backend URL'si gelecek.

function submitRegisterEmail() {
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPass").value.trim();

    if (!email || !password) {
        showToast("⚠️ Lütfen E-posta ve Şifre alanlarını doldurun!", "warning");
        return;
    }

    const hasLen = password.length >= 8;
    const hasCap = /[A-Z]/.test(password);
    const hasSym = /[.!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasLen || !hasCap || !hasSym) {
        showToast("⛔ Şifreniz en az 8 karakter, 1 BÜYÜK HARF ve 1 Özel Sembol içermelidir!", "error");
        return;
    }

    // Gerçek Sunucuya İstek Atıyoruz
    fetch(`${API_BASE_URL}/api/auth/register-send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            showToast(`✉️ E-posta gönderildi! (Gecikme nedeniyle kodunuz: ${data.debugCode})`, "success");
            openVerifyCodeModal(email);
        } else {
            showToast(`⛔ ${data.error}`, "error");
        }
    }).catch(err => {
        showToast(`⛔ Sunucuya bağlanılamadı. Node.js çalışıyor mu kontrol edin.`, "error");
        console.error("API Error:", err);
    });
}

function submitVerifyCode(email) {
    const code = document.getElementById("verifyCodeInput").value.trim();
    if (!code || code.length < 6) {
        showToast("⚠️ Lütfen 6 haneli doğrulama kodunu yazın!", "warning");
        return;
    }

    fetch(`${API_BASE_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            TokenBountyStore.userState.email = data.user.email;
            TokenBountyStore.userState.isLoggedIn = true;
            TokenBountyStore.saveToStorage();
            closeAuthModals();
            updateWalletUI();
            showToast("🎉 TEBRİKLER! Hesabınız doğrulandı ve giriş yapıldı!", "success");
        } else {
            showToast(`⛔ ${data.error}`, "error");
        }
    }).catch(err => {
        showToast(`⛔ Sunucu hatası.`, "error");
        console.error(err);
    });
}

function submitLogin() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPass").value.trim();

    if (!email || !password) {
        showToast("⚠️ Lütfen E-posta ve Şifre girin!", "warning");
        return;
    }

    fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            TokenBountyStore.userState.email = data.user.email;
            TokenBountyStore.userState.isLoggedIn = true;
            TokenBountyStore.saveToStorage();
            closeAuthModals();
            updateWalletUI();
            showToast(`🔑 Hoş geldiniz, ${email}! Giriş başarılı.`, "success");
        } else {
            showToast(`⛔ ${data.error}`, "error");
        }
    }).catch(err => {
        showToast(`⛔ Sunucu hatası.`, "error");
        console.error(err);
    });
}

function handleUserLogout() {
    TokenBountyStore.logoutUser();
    updateWalletUI();
    closeAuthModals();
    showToast("🚪 Hesaptan başarıyla çıkış yapıldı!", "info");
    setTimeout(() => window.location.reload(), 600);
}

function claimDailyStreak() {
    if (!TokenBountyStore.userState.isLoggedIn) {
        showToast("🔒 Günlük Giriş Bonusunu alabilmek için lütfen önce hesabınıza giriş yapın!", "warning");
        openLoginModal();
        return;
    }

    const current = TokenBountyStore.userState.streakDays || 1;
    TokenBountyStore.userState.streakDays = current + 1;
    TokenBountyStore.saveToStorage();
    updateStreakUI();
    showToast(`🎉 TEBRİKLER! ${current + 1}. Gün bonusunuz (+10% Ödül Çarpanı) hesabınıza tanımlandı!`, "success");
}

// Admin Auth Protection Modal
function openAdminAuthModal(e) {
    if (e) e.preventDefault();
    let modal = document.getElementById("adminAuthModal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "adminAuthModal";
        modal.className = "modal-backdrop";
        modal.innerHTML = `
            <div class="modal-card" style="max-width:440px;">
                <div class="modal-header">
                    <h3 style="display:flex;align-items:center;gap:10px;color:var(--neon-gold);"><i class="fa-solid fa-shield-halved"></i> Admin Giriş Paneli</h3>
                    <button class="modal-close" onclick="document.getElementById('adminAuthModal').classList.remove('active')"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <p style="color:var(--text-secondary);font-size:14px;margin-bottom:20px;">Lütfen yönetim paneline erişmek için Admin Giriş Şifrenizi girin.</p>
                <div style="margin-bottom:20px;">
                    <label style="display:block;font-size:12px;font-weight:800;color:var(--text-tertiary);margin-bottom:8px;text-transform:uppercase;">Admin Parolası</label>
                    <input type="password" id="adminPassInput" placeholder="🔑 Parolanızı yazın..." style="width:100%;padding:14px;background:var(--bg-surface-elevated);border:1px solid var(--border-hover);border-radius:12px;color:#fff;font-size:15px;outline:none;" onkeyup="if(event.key==='Enter')verifyAdminAuth()">
                </div>
                <button onclick="verifyAdminAuth()" class="btn-main" style="width:100%;justify-content:center;"><i class="fa-solid fa-lock-open"></i> Admin Paneline Giriş Yap</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.classList.add("active");
    setTimeout(() => {
        const inp = document.getElementById("adminPassInput");
        if (inp) inp.focus();
    }, 100);
}

function verifyAdminAuth() {
    const input = document.getElementById("adminPassInput");
    const val = input ? input.value.trim() : "";
    if (val === "admin123" || val === "admin" || val === "TB2026_MASTER") {
        sessionStorage.setItem("TB_ADMIN_AUTH", "true");
        showToast("🔑 Admin Girişi Başarılı! Yönlendiriliyorsunuz...", "success");
        setTimeout(() => {
            window.location.href = "admin.html";
        }, 600);
    } else {
        showToast("⛔ Geçersiz Admin Şifresi! Erişim reddedildi.", "error");
    }
}
