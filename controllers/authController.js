const User = require('../models/User');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
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
    welcomeEmail: (name) => `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { padding: 30px; background-color: #f9f9f9; border-radius: 0 0 8px 8px; }
                .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
                .button { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Welcome to PaisaPe!</h1>
            </div>
            <div class="content">
                <p>Hi ${name},</p>
                <p>Congratulations! Your account has been successfully verified and you're now part of the PaisaPe community.</p>
                <p>We're excited to have you on board. You can now enjoy all the features of our platform.</p>
                
                <a href="#" class="button">Get Started</a>
                
                <p>If you have any questions, feel free to reach out to our support team.</p>
                
                <p>Happy banking!<br>The PaisaPe Team</p>
                
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
        const { name, email, password } = req.body;
        let user = await User.findOne({ email });

        if (user) return res.status(400).json({ message: 'User already exists' });

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user = new User({ name, email, password, otp, otpExpiry });
        await user.save();

        await transporter.sendMail({
            from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'OTP Verification - PaisaPe',
            html: emailTemplates.otpVerification(otp, name),
            text: `Your OTP is: ${otp}`
        });

        res.status(201).json({ message: 'User registered. Please verify OTP sent to email.' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
};

// ------------------ VERIFY OTP ------------------
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

        if (user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        // Send welcome email
        await transporter.sendMail({
            from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Welcome to PaisaPe!',
            html: emailTemplates.welcomeEmail(user.name),
            text: `Welcome to PaisaPe, ${user.name}! Your account has been successfully verified.`
        });

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying OTP', error });
    }
};

// ------------------ RESEND OTP ------------------
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

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

        res.json({ message: 'OTP resent successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error resending OTP', error });
    }
};

// ------------------ LOGIN ------------------
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.password !== password) return res.status(400).json({ message: 'Incorrect password' });

        if (!user.isVerified) {
            return res.status(400).json({ message: 'Email not verified. Please verify OTP.' });
        }

        req.session.user = { id: user._id, email: user.email, name: user.name };
        res.json({ message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

// ------------------ LOGOUT ------------------
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: 'Error logging out' });
        res.json({ message: 'Logged out successfully' });
    });
};

// ------------------ DASHBOARD ------------------
exports.dashboard = async (req, res) => {
    res.json({ message: `Welcome to the dashboard, ${req.session.user.name}` });
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