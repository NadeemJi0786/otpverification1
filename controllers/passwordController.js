// controllers/passwordController.js
const User = require('../models/User');
const { transporter, emailTemplates, generateOTP } = require('../helpers/emailHelper');

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