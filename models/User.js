// const mongoose = require('mongoose');

// const UserSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     otp: { type: String },
//     otpExpiry: { type: Date },
//     isVerified: { type: Boolean, default: false },
//     isResetVerified: { type: Boolean, default: false },
//     referralCode: {
//         type: String,
//         unique: true,
//         sparse: true
//     },
//     referralCount: {
//         type: Number,
//         default: 0
//     },
//     referralEarnings: {
//         type: Number,
//         default: 0
//     },
//     referredBy: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User'
//     }
// }, { timestamps: true });

// module.exports = mongoose.model('User', UserSchema);



const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    otp: { type: String },
    otpExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },
    isResetVerified: { type: Boolean, default: false },
    referralCode: { type: String, unique: true, sparse: true },
    referralCount: { type: Number, default: 0 },
    referralEarnings: { type: Number, default: 0 },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Earning fields
    checkInEarnings: { type: Number, default: 0 },
    spinEarnings: { type: Number, default: 0 },
    lastCheckIn: { type: Date },
    checkInStreak: { type: Number, default: 0 }
}, { timestamps: true });

// Virtual for total earnings
UserSchema.virtual('totalEarnings').get(function() {
    return this.checkInEarnings + this.spinEarnings + this.referralEarnings;
});

module.exports = mongoose.model('User', UserSchema);