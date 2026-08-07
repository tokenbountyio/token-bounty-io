const mongoose = require('mongoose');

const WithdrawalSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: String, required: true },
    tokenName: { type: String, required: true },
    tokenAmount: { type: Number, required: true },
    valueUSD: { type: Number, required: true },
    walletAddress: { type: String, required: true },
    network: { type: String, required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'rejected'], default: 'pending' },
    transactionHash: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null }
});

module.exports = mongoose.model('Withdrawal', WithdrawalSchema);
