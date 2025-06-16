const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    otp: { type: String }, // OTP for verification
    otpExpiry: { type: Date }, // Expiry time for OTP
    isVerified: { type: Boolean, default: false } // Email verification status
});

const User = mongoose.model('User', UserSchema);

module.exports = User;

 