const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    // Existing fields
    name: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    otp: { 
        type: String 
    },
    otpExpiry: { 
        type: Date 
    },
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    isResetVerified: {
        type: Boolean,
        default: false
    },

    // Referral system fields
    referralCode: {
        type: String,
        unique: true,
        sparse: true // Allows null values while maintaining uniqueness
    },
    referralCount: {
        type: Number,
        default: 0
    },
    referralEarnings: {
        type: Number,
        default: 0
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    referralBonusUsed: {
        type: Boolean,
        default: false
    },
    pendingReferrals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    completedReferrals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { 
    timestamps: true // Adds createdAt and updatedAt fields
});

const User = mongoose.model('User', UserSchema);

module.exports = User;