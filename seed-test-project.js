// Test project seeder — adds BountyTest coin with real Telegram & X tasks
require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('./models/Project');

async function seed() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected!');

    // Remove existing test project if any
    await Project.deleteOne({ ticker: 'BTEST' });

    const project = await Project.create({
        name: 'TokenBounty Test Coin',
        ticker: 'BTEST',
        network: 'solana',
        logo: 'https://token-bounty-io.vercel.app/assets/logo.png',
        contractAddress: 'TokenBountyTestCoinSolana1111111111111111',
        websiteUrl: 'https://tokenbounty.io',
        telegramGroup: 't.me/TokenBounty_IO',
        twitterHandle: '@tokenbountyio',
        adminContactTelegram: '@tokenbountyio',
        bountyTotalUSD: 500,
        bountyRemainingUSD: 500,
        rewardPerUserUSD: 2.50,
        marketCapUSD: '1000000',
        volume24hUSD: '50000',
        totalSupply: '1000000000',
        status: 'active',   // ← directly active for testing
        rank: 1,
        tasks: [
            {
                id: 'task_tg_1',
                title: 'TokenBounty Telegram Grubuna Katıl',
                type: 'telegram',
                target: 't.me/TokenBounty_IO',
                reward: '$1.25'
            },
            {
                id: 'task_tw_1',
                title: "X'te TokenBounty'yi Takip Et",
                type: 'twitter_follow',
                target: '@tokenbountyio',
                reward: '$1.25'
            }
        ]
    });

    console.log('');
    console.log('✅ Test project created!');
    console.log('   Name     :', project.name);
    console.log('   ID       :', project._id.toString());
    console.log('   Status   :', project.status);
    console.log('   Tasks    :');
    project.tasks.forEach(t => console.log(`     - [${t.type}] ${t.title} → ${t.target}`));
    console.log('');
    console.log('🔗 Test URL (local):  http://localhost:3000/coin-detail?id=' + project._id);
    console.log('🔗 Test URL (live):   https://token-bounty-io.vercel.app/coin-detail?id=' + project._id);

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed error:', err);
    process.exit(1);
});
