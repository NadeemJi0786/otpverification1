const User = require('../models/User');
const { transporter, emailTemplates, generateOTP } = require('../helpers/emailHelper');
const jwt = require('jsonwebtoken');

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ 
            success: false,
            message: 'Ye email wala user nahi mila' 
        });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        user.isResetVerified = false;
        await user.save();

        await transporter.sendMail({
            from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Password Reset OTP - PaisaPe',
            html: emailTemplates.passwordReset(otp, user.name),
            text: `Password reset karne ke liye aapka OTP hai: ${otp}`
        });

        res.json({ 
            success: true,
            message: 'Password reset ka OTP email pe bhej diya gaya' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'OTP bhejne mein error aaya',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Combined endpoint for OTP verification and password reset
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ 
            success: false,
            message: 'User nahi mila' 
        });
        
        // OTP verify karo
        if (user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ 
                success: false,
                message: 'Galat ya expire ho gaya OTP' 
            });
        }

        // Password reset karo
        user.password = newPassword;
        user.isResetVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        // New token generate karo (optional)
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({ 
            success: true,
            message: 'Password reset ho gaya. Ab login kar sakte ho.',
            token // Optional: agar turant login karna hai toh
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Password reset mein error aaya',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Backward compatibility ke liye (optional)
exports.verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ 
            success: false,
            message: 'User nahi mila' 
        });
        
        if (user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ 
                success: false,
                message: 'Galat ya expire ho gaya OTP' 
            });
        }

        user.isResetVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        res.json({ 
            success: true,
            message: 'OTP verify ho gaya. Ab password reset kar sakte ho.' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'OTP verify karne mein error aaya',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};