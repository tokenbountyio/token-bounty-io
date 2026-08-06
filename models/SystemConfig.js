const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema({
    dailyStreakRewardsUSD: {
        type: [Number],
        default: [0.10, 0.20, 0.30, 0.40, 0.50, 1.00, 2.00] // Day 1 to 7
    },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);
