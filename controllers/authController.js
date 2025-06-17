const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Referral = require('../models/Referral');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Email Transporter Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

// Helper: Generate OTP
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

// Helper: Generate Referral Code
const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Generate JWT Token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user._id, 
            email: user.email, 
            name: user.name,
            referralCode: user.referralCode
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
};

// Email Templates
const emailTemplates = {
    otpVerification: (otp, name) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4a6bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
                .otp-container { background-color: #fff; border: 1px dashed #4a6bff; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; color: #4a6bff; }
                .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
                .button { background-color: #4a6bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Welcome to PaisaPe</h1>
            </div>
            <div class="content">
                <p>Hi ${name},</p>
                <p>Thank you for registering with PaisaPe. To complete your registration, please verify your email address using the OTP below:</p>
                
                <div class="otp-container">
                    ${otp}
                </div>
                
                <p>This OTP is valid for 10 minutes. If you didn't request this, please ignore this email.</p>
                
                <p>Best regards,<br>The PaisaPe Team</p>
                
                <div class="footer">
                    <p>© ${new Date().getFullYear()} PaisaPe. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,
    passwordReset: (otp, name) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #ff6b4a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
                .otp-container { background-color: #fff; border: 1px dashed #ff6b4a; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; color: #ff6b4a; }
                .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
                .button { background-color: #ff6b4a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hi ${name},</p>
                <p>We received a request to reset your PaisaPe account password. Please use the following OTP to proceed:</p>
                
                <div class="otp-container">
                    ${otp}
                </div>
                
                <p>This OTP will expire in 10 minutes. If you didn't request a password reset, please secure your account immediately.</p>
                
                <p>Best regards,<br>The PaisaPe Security Team</p>
                
                <div class="footer">
                    <p>© ${new Date().getFullYear()} PaisaPe. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,
    resendOTP: (otp, name) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #6b4aff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
                .otp-container { background-color: #fff; border: 1px dashed #6b4aff; padding: 15px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; color: #6b4aff; }
                .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>New OTP Request</h1>
            </div>
            <div class="content">
                <p>Hi ${name},</p>
                <p>As requested, here's your new verification code for PaisaPe:</p>
                
                <div class="otp-container">
                    ${otp}
                </div>
                
                <p>This code will expire in 10 minutes. Please use it to complete your verification process.</p>
                
                <p>Best regards,<br>The PaisaPe Team</p>
                
                <div class="footer">
                    <p>© ${new Date().getFullYear()} PaisaPe. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,
    welcomeEmail: (name, referralCode) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
                .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
                .button { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
                .referral-code { background-color: #fff; border: 2px solid #4CAF50; padding: 15px; text-align: center; margin: 20px 0; font-size: 20px; font-weight: bold; color: #4CAF50; }
                .referral-bonus { background-color: #f0fff0; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Welcome to PaisaPe!</h1>
            </div>
            <div class="content">
                <p>Hi ${name},</p>
                <p>Congratulations! Your account has been successfully verified and you're now part of the PaisaPe community.</p>
                
                <div class="referral-bonus">
                    <h3>Your Referral Benefits</h3>
                    <p>Invite friends and earn ₹100 for each successful referral when they sign up using your code and complete their first transaction.</p>
                </div>
                
                <p>Your unique referral code:</p>
                <div class="referral-code">
                    ${referralCode}
                </div>
                
                <p>Share this code with your friends and start earning!</p>
                
                <a href="#" class="button">Get Started</a>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
                
                <p>Happy banking!<br>The PaisaPe Team</p>
                
                <div class="footer">
                    <p>© ${new Date().getFullYear()} PaisaPe. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `,
    referralSuccess: (name, referredName, bonusAmount) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #FFA500; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
                .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
                .bonus-amount { font-size: 24px; color: #4CAF50; font-weight: bold; text-align: center; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>You've Earned a Referral Bonus!</h1>
            </div>
            <div class="content">
                <p>Hi ${name},</p>
                <p>Congratulations! Your friend ${referredName} has successfully joined PaisaPe using your referral code.</p>
                
                <div class="bonus-amount">
                    ₹${bonusAmount} credited to your account!
                </div>
                
                <p>Keep inviting more friends to earn more rewards. There's no limit to how much you can earn!</p>
                
                <p>Thank you for being a valuable part of the PaisaPe community.</p>
                
                <p>Best regards,<br>The PaisaPe Team</p>
                
                <div class="footer">
                    <p>© ${new Date().getFullYear()} PaisaPe. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `
};

// ------------------ REGISTER ------------------
exports.register = async (req, res) => {
    try {
        const { name, email, password, referralCode } = req.body;
        let user = await User.findOne({ email });

        if (user) return res.status(400).json({ 
            success: false,
            message: 'User already exists' 
        });

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        const userReferralCode = generateReferralCode();

        user = new User({ 
            name, 
            email, 
            password, 
            otp, 
            otpExpiry,
            referralCode: userReferralCode,
            referralCount: 0,
            referralEarnings: 0
        });

        await user.save();

        // Handle referral if code was provided
        if (referralCode) {
            const referrer = await User.findOne({ referralCode });
            if (referrer) {
                const referral = new Referral({
                    referrer: referrer._id,
                    referee: user._id,
                    referralCodeUsed: referralCode,
                    status: 'pending'
                });
                await referral.save();

                referrer.pendingReferrals.push(user._id);
                await referrer.save();
            }
        }

        await transporter.sendMail({
            from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'OTP Verification - PaisaPe',
            html: emailTemplates.otpVerification(otp, name),
            text: `Your OTP is: ${otp}`
        });

        res.status(201).json({ 
            success: true,
            message: 'User registered. Please verify OTP sent to email.',
            referralCode: userReferralCode 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error registering user', 
            error: error.message 
        });
    }
};

// ------------------ VERIFY OTP ------------------
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ 
            success: false,
            message: 'User not found' 
        });
        if (user.isVerified) return res.status(400).json({ 
            success: false,
            message: 'User already verified' 
        });

        if (user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid or expired OTP' 
            });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        await transporter.sendMail({
            from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Welcome to PaisaPe!',
            html: emailTemplates.welcomeEmail(user.name, user.referralCode),
            text: `Welcome to PaisaPe, ${user.name}! Your account has been successfully verified. Your referral code: ${user.referralCode}`
        });

        res.json({ 
            success: true,
            message: 'Email verified successfully. You can now log in.',
            referralCode: user.referralCode
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error verifying OTP', 
            error: error.message 
        });
    }
};

// ------------------ LOGIN (JWT Implementation) ------------------
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ 
            success: false,
            message: 'User not found' 
        });
        
        if (user.password !== password) return res.status(400).json({ 
            success: false,
            message: 'Incorrect password' 
        });
        
        if (!user.isVerified) return res.status(400).json({ 
            success: false,
            message: 'Email not verified. Please verify OTP.' 
        });

        const token = generateToken(user);
        
        res.json({ 
            success: true,
            message: 'Login successful',
            token,
            user: { 
                name: user.name, 
                email: user.email,
                referralCode: user.referralCode,
                referralCount: user.referralCount,
                referralEarnings: user.referralEarnings
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error logging in', 
            error: error.message 
        });
    }
};

// ------------------ CURRENT USER (JWT Implementation) ------------------
exports.currentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -otp -otpExpiry');

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true,
            isAuthenticated: true,
            user 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error fetching user data', 
            error: error.message 
        });
    }
};

// ------------------ COMPLETE REFERRAL ------------------
exports.completeReferral = async (req, res) => {
    try {
        const { userId } = req.body;
        const bonusAmount = 100;

        const referral = await Referral.findOne({ 
            referee: userId,
            status: 'pending'
        }).populate('referrer');

        if (!referral) {
            return res.status(400).json({ 
                success: false,
                message: 'No pending referral found' 
            });
        }

        referral.status = 'completed';
        referral.completedAt = new Date();
        await referral.save();

        const referrer = await User.findById(referral.referrer);
        referrer.referralCount += 1;
        referrer.referralEarnings += bonusAmount;
        referrer.pendingReferrals.pull(userId);
        referrer.completedReferrals.push(userId);
        await referrer.save();

        const referee = await User.findById(userId);
        referee.referredBy = referrer._id;
        referee.referralBonusUsed = true;
        await referee.save();

        await transporter.sendMail({
            from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
            to: referrer.email,
            subject: 'You Earned a Referral Bonus!',
            html: emailTemplates.referralSuccess(referrer.name, referee.name, bonusAmount),
            text: `Congratulations ${referrer.name}! You've earned ₹${bonusAmount} for referring ${referee.name} to PaisaPe.`
        });

        res.json({ 
            success: true,
            message: 'Referral completed successfully',
            bonusAmount,
            referrer: referrer.name,
            referee: referee.name
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error completing referral', 
            error: error.message 
        });
    }
};

// ------------------ GET REFERRAL STATS ------------------
exports.getReferralStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('pendingReferrals', 'name email')
            .populate('completedReferrals', 'name email');

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const referralStats = {
            referralCode: user.referralCode,
            referralCount: user.referralCount,
            referralEarnings: user.referralEarnings,
            pendingReferrals: user.pendingReferrals,
            completedReferrals: user.completedReferrals
        };

        res.json({ 
            success: true,
            data: referralStats 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error fetching referral stats', 
            error: error.message 
        });
    }
};

// ------------------ RESEND OTP ------------------
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ 
            success: false,
            message: 'User not found' 
        });
        if (user.isVerified) return res.status(400).json({ 
            success: false,
            message: 'User already verified' 
        });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await transporter.sendMail({
            from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Resend OTP - PaisaPe',
            html: emailTemplates.resendOTP(otp, user.name),
            text: `Your new OTP is: ${otp}`
        });

        res.json({ 
            success: true,
            message: 'OTP resent successfully.' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error resending OTP', 
            error: error.message 
        });
    }
};

// ------------------ DASHBOARD ------------------
exports.dashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password -otp -otpExpiry');
            
        res.json({ 
            success: true,
            message: `Welcome to the dashboard, ${user.name}`,
            user 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error accessing dashboard', 
            error: error.message 
        });
    }
};

// ------------------ FORGOT PASSWORD ------------------
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ 
            success: false,
            message: 'User not found' 
        });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await transporter.sendMail({
            from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Password Reset OTP - PaisaPe',
            html: emailTemplates.passwordReset(otp, user.name),
            text: `Your OTP to reset password is: ${otp}`
        });

        res.json({ 
            success: true,
            message: 'OTP sent to email for password reset' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error sending reset OTP', 
            error: error.message 
        });
    }
};

// ------------------ VERIFY RESET OTP ------------------
exports.verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ 
            success: false,
            message: 'User not found' 
        });
        if (user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid or expired OTP' 
            });
        }

        user.isResetVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ 
            success: true,
            message: 'OTP verified. You can now reset your password.' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error verifying reset OTP', 
            error: error.message 
        });
    }
};

// ------------------ RESET PASSWORD ------------------
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ 
            success: false,
            message: 'User not found' 
        });
        if (!user.isResetVerified) return res.status(403).json({ 
            success: false,
            message: 'OTP verification required' 
        });

        user.password = newPassword;
        user.isResetVerified = false;
        await user.save();

        res.json({ 
            success: true,
            message: 'Password reset successful. You can now log in.' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error resetting password', 
            error: error.message 
        });
    }
};

// ------------------ LOGOUT ------------------
exports.logout = (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    res.json({ 
        success: true,
        message: 'Logout successful.' 
    });
};

// ------------------ DASHBOARD ------------------
exports.dashboard = async (req, res) => {
    const user = await User.findById(req.session.user.id)
        .select('-password -otp -otpExpiry');
        
    res.json({ 
        message: `Welcome to the dashboard, ${user.name}`,
        user: user 
    });
};

// ------------------ FORGOT PASSWORD ------------------
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'User not found' });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await transporter.sendMail({
            from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Password Reset OTP - PaisaPe',
            html: emailTemplates.passwordReset(otp, user.name),
            text: `Your OTP to reset password is: ${otp}`
        });

        res.json({ message: 'OTP sent to email for password reset' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending reset OTP', error });
    }
};

// ------------------ VERIFY RESET OTP ------------------
exports.verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isResetVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ message: 'OTP verified. You can now reset your password.' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying reset OTP', error });
    }
};

// ------------------ RESET PASSWORD ------------------
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'User not found' });
        if (!user.isResetVerified) return res.status(403).json({ message: 'OTP verification required' });

        user.password = newPassword;
        user.isResetVerified = false;
        await user.save();

        res.json({ message: 'Password reset successful. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Error resetting password', error });
    }
};