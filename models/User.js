const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    joinedDate: { type: Date, default: Date.now },
    wallets: {
        phantom: { type: String, default: null },
        metamask: { type: String, default: null },
        trust: { type: String, default: null }
    },
    balances: {
        // e.g. { "KIMCHI": { amount: 12500, valueUSD: 3.00 }, "NEW": { amount: 35000, valueUSD: 3.50 } }
        type: Map,
        of: {
            amount: Number,
            valueUSD: Number
        },
        default: {}
    },
    streak: {
        count: { type: Number, default: 0 },
        lastClaimed: { type: Date, default: null }
    },
    completedProjects: [{ type: String }] // Stores project IDs that the user has completed tasks for
});

module.exports = mongoose.model('User', UserSchema);
