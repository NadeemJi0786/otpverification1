const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    referee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    referralCodeUsed: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    bonusAmount: {
        type: Number,
        default: 100 // ₹100 per referral
    },
    completedAt: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Referral', referralSchema);