// helpers/emailHelper.js
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

// Helper: Generate Referral Code
const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
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

module.exports = {
    transporter,
    emailTemplates,
    generateOTP,
    generateReferralCode
};