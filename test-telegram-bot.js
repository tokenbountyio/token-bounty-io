// Test Telegram Bot API access to @TokenBounty_IO group
require('dotenv').config();
const axios = require('axios');

async function testTelegram() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    console.log('Bot token starts with:', token ? token.substring(0, 10) + '...' : 'NOT FOUND!');

    // 1. Test bot itself
    console.log('\n1. Testing bot identity...');
    try {
        const me = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
        console.log('✅ Bot:', me.data.result.username, '| Name:', me.data.result.first_name);
    } catch(e) {
        console.log('❌ Bot getMe failed:', e.message);
        return;
    }

    // 2. Test group access
    const chatId = '@TokenBounty_IO';
    console.log(`\n2. Testing access to group ${chatId}...`);
    try {
        const chat = await axios.get(`https://api.telegram.org/bot${token}/getChat?chat_id=${chatId}`);
        if (chat.data.ok) {
            console.log('✅ Group found!');
            console.log('   Title   :', chat.data.result.title);
            console.log('   Type    :', chat.data.result.type);
            console.log('   Username:', chat.data.result.username);
        }
    } catch(e) {
        if (e.response && e.response.data) {
            console.log('❌ Group access failed:', e.response.data.description);
            console.log('');
            console.log('⚠️  Bu hatayı çözmek için:');
            console.log('   Botu gruba admin olarak ekleyin:');
            console.log('   1. @TokenBounty_IO grubuna gidin');
            console.log('   2. Grup Ayarları → Yöneticiler → Yönetici Ekle');
            console.log('   3. Botunuzun adını aratın ve ekleyin');
        } else {
            console.log('❌ Error:', e.message);
        }
    }
}

testTelegram().catch(console.error);
