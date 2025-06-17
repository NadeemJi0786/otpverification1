const express = require('express');
const {
    register,
    verifyOTP,
    resendOTP,
    login,
    logout,
    dashboard,
    forgotPassword,
    verifyResetOTP,
    resetPassword,
    currentUser,
    completeReferral,
    getReferralStats
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/logout', logout);
router.get('/dashboard', authMiddleware, dashboard);
router.get('/current-user', authMiddleware, currentUser);

// Forgot Password routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

// Referral System routes
router.post('/complete-referral', authMiddleware, completeReferral);
router.get('/referral-stats', authMiddleware, getReferralStats);

module.exports = router;