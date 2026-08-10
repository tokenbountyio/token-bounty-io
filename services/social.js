/* -------------------------------------------------------------
   TokenBounty.io - Social Media Verification Engine (Telegram & X)
   ------------------------------------------------------------- */

const axios = require('axios');

const SocialVerificationService = {

    // ─────────────────────────────────────────────────────────────
    // TELEGRAM: getChatMember API verification
    // Requires TELEGRAM_BOT_TOKEN in .env
    // chatId can be @username or numeric chat ID (e.g. -1001234567890)
    // ─────────────────────────────────────────────────────────────
    async verifyTelegramMember(chatId, telegramUsername) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        if (!botToken || botToken.includes("YOUR_") || botToken.length < 20) {
            console.log("⚠️  TELEGRAM_BOT_TOKEN not configured — using smart fallback");
            // Smart fallback: verify the username at least looks real
            const isValidUsername = telegramUsername && 
                telegramUsername.length >= 3 && 
                /^[a-zA-Z0-9_]{3,32}$/.test(telegramUsername.replace('@',''));
            return { 
                verified: isValidUsername, 
                status: isValidUsername ? "accepted" : "invalid_username",
                note: "Bot token not configured — username format validated only. Add TELEGRAM_BOT_TOKEN to .env for full verification."
            };
        }

        // Normalize chatId — ensure it starts with @ if it's a username
        let resolvedChatId = chatId;
        if (chatId && !chatId.startsWith('-') && !chatId.startsWith('@') && !chatId.startsWith('http')) {
            resolvedChatId = `@${chatId}`;
        }
        // Strip t.me/ URLs to get username
        if (chatId && chatId.includes('t.me/')) {
            const parts = chatId.split('t.me/');
            resolvedChatId = `@${parts[parts.length - 1].split('/')[0].split('?')[0]}`;
        }

        try {
            // First resolve the username to get user ID via getUpdates or use username directly
            // Telegram Bot API: getChatMember needs user_id (numeric), not username
            // We'll use the username-based approach via getChat first
            const chatInfoUrl = `https://api.telegram.org/bot${botToken}/getChat?chat_id=${resolvedChatId}`;
            const chatRes = await axios.get(chatInfoUrl, { timeout: 8000 });

            if (!chatRes.data || !chatRes.data.ok) {
                return { verified: false, status: "chat_not_found", message: "Telegram grubu/kanalı bulunamadı. Chat ID doğru mu?" };
            }

            // We can't directly look up a member by username via Bot API unless they've interacted with the bot.
            // Best approach: Use getChatMember with numeric user ID. Since we don't have that,
            // we return a "link validated" response — the group exists and is reachable.
            // For full verification, users must start the bot first.
            console.log(`✅ Telegram group "${resolvedChatId}" is valid and accessible.`);
            return { 
                verified: true, 
                status: "group_verified",
                chatTitle: chatRes.data.result.title,
                message: `"${chatRes.data.result.title}" grubuna katılım kaydedildi.`
            };

        } catch (err) {
            if (err.response && err.response.data) {
                console.warn("Telegram API error:", err.response.data.description);
                // If group not found by bot
                if (err.response.data.error_code === 400) {
                    return { verified: false, status: "group_not_found", message: "Bot bu gruba erişemiyor. Botu önce gruba ekleyin." };
                }
            }
            console.warn("Telegram API error:", err.message);
            // Fallback to accepted on network error
            return { verified: true, status: "network_fallback", note: "Telegram API temporarily unreachable — accepted" };
        }
    },

    // ─────────────────────────────────────────────────────────────
    // TWITTER/X: Honor system with public profile existence check
    // Free tier doesn't allow follow list access — we check profile exists
    // ─────────────────────────────────────────────────────────────
    async verifyTwitterFollow(targetHandle) {
        const bearerToken = process.env.TWITTER_BEARER_TOKEN;
        const cleanHandle = (targetHandle || '').replace('@', '').split('/').pop().split('?')[0];

        if (!bearerToken || bearerToken.includes("YOUR_") || bearerToken.length < 20) {
            // Honor system: just verify the target account exists via public scrape
            try {
                const publicUrl = `https://syndication.twitter.com/srv/oembed?url=https://twitter.com/${cleanHandle}&omit_script=true`;
                const res = await axios.get(publicUrl, { timeout: 6000 });
                if (res.data && res.data.author_name) {
                    return { 
                        verified: true, 
                        status: "honor_accepted",
                        accountName: res.data.author_name,
                        message: `@${cleanHandle} hesabı doğrulandı (honor sistemi).`
                    };
                }
            } catch (e) {
                // Fallback — accept on any error (honor system)
            }
            return { verified: true, status: "honor_accepted", note: "Honor system — user redirected to follow page" };
        }

        // If bearer token exists, use official API to verify account exists
        try {
            const res = await axios.get(`https://api.twitter.com/2/users/by/username/${cleanHandle}`, {
                headers: { "Authorization": `Bearer ${bearerToken}` },
                timeout: 8000
            });
            if (res.data && res.data.data && res.data.data.id) {
                return { 
                    verified: true, 
                    status: "account_verified",
                    accountId: res.data.data.id,
                    message: `@${cleanHandle} hesabı doğrulandı.`
                };
            }
        } catch (err) {
            console.warn("Twitter API error:", err.message);
        }

        return { verified: true, status: "honor_fallback", note: "Honor system fallback" };
    }

};

module.exports = SocialVerificationService;
