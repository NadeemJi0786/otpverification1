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
        default: 'completed' // Changed to default 'completed' based on code 3 implementation
    },
    bonusAmount: {
        type: Number,
        default: 100
    },
    completedAt: {
        type: Date,
        default: Date.now // Added default value
    }
}, { timestamps: true });

module.exports = mongoose.model('Referral', referralSchema);