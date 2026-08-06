const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    rank: { type: Number, default: 0 },
    name: { type: String, required: true },
    ticker: { type: String, required: true },
    network: { type: String, required: true, enum: ['solana', 'base', 'bsc', 'ethereum'] },
    logo: { type: String, required: true },
    contractAddress: { type: String, required: true },
    addedTimestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'pending', 'rejected'], default: 'pending' },
    price: { type: Number, default: 0 },
    change24h: { type: Number, default: 0 },
    bountyRemainingUSD: { type: Number, default: 0 },
    bountyTotalUSD: { type: Number, default: 0 },
    rewardPerUserUSD: { type: Number, default: 0 },
    buyUrl: { type: String },
    dexScreenerUrl: { type: String },
    websiteUrl: { type: String },
    telegramGroup: { type: String },
    telegramChannel: { type: String },
    twitterHandle: { type: String },
    marketCapUSD: { type: String },
    volume24hUSD: { type: String },
    totalSupply: { type: String },
    tasks: [{
        id: String,
        title: String,
        type: { type: String }, // e.g. 'telegram', 'twitter_follow'
        target: String,
        reward: String
    }]
});

module.exports = mongoose.model('Project', ProjectSchema);
