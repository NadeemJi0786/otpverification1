const express = require('express');
const router = express.Router();

// Controllers import karo (ab alag files mein hai)
const authController = require('../controllers/authController'); // Login, Register, OTP
const passwordController = require('../controllers/passwordController'); // Password Reset (NEW)
const referralController = require('../controllers/referralController'); // Referral system
const userController = require('../controllers/userController'); // Dashboard, Profile
const authMiddleware = require('../middleware/authMiddleware'); // JWT/ Session check

// 🔑 Authentication Routes (No login required)
router.post('/register', authController.register); // ✅ Same as before
router.post('/verify-otp', authController.verifyOTP); // ✅ Same as before
router.post('/resend-otp', authController.resendOTP); // ✅ Same as before
router.post('/login', authController.login); // ✅ Same as before
router.post('/logout', authController.logout); // ✅ Same as before

// 🔄 Password Reset Routes (Now using passwordController)
router.post('/forgot-password', passwordController.forgotPassword); // CHANGED to passwordController
router.post('/verify-reset-otp', passwordController.verifyResetOTP); // CHANGED to passwordController
router.post('/reset-password', passwordController.resetPassword); // CHANGED to passwordController

// 🔒 Protected Routes (Login required)
router.get('/current-user', authMiddleware, authController.currentUser); // ✅ Same as before
router.get('/dashboard', authMiddleware, userController.dashboard); // ✅ Same as before
router.get('/referral-stats', authMiddleware, referralController.getReferralStats); // ✅ Same as before

module.exports = router;