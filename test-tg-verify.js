// Test: getChatMember with real username
require('dotenv').config();
const SocialVerificationService = require('./services/social');

async function test() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Telegram Membership Verification Test');
    console.log('═══════════════════════════════════════════════════════\n');

    const groupTarget = 't.me/TokenBounty_IO';

    // Test 1: A username that IS in the group (you)
    const yourUsername = 'tokenbountyio'; // Change this to your real Telegram username
    console.log(`Test 1: Checking if @${yourUsername} is in ${groupTarget}...`);
    const result1 = await SocialVerificationService.verifyTelegramMember(groupTarget, yourUsername);
    console.log('Result:', JSON.stringify(result1, null, 2));

    console.log('\n───────────────────────────────────────────────────────\n');

    // Test 2: A random username that is NOT in the group
    const fakeUser = 'thispersondoesnotexist99999';
    console.log(`Test 2: Checking if @${fakeUser} is in ${groupTarget}...`);
    const result2 = await SocialVerificationService.verifyTelegramMember(groupTarget, fakeUser);
    console.log('Result:', JSON.stringify(result2, null, 2));

    console.log('\n═══════════════════════════════════════════════════════');
}

test().catch(console.error);
