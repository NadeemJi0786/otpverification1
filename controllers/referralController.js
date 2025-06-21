const User = require('../models/User');

exports.getReferralStats = async (req, res) => {
    try {
        // Ab session ki jagah req.user se userId milega (JWT middleware se)
        const userId = req.user?.id;
        
        if (!userId) {
            return res.status(401).json({ 
                success: false,
                message: "Token nahi mila ya expire ho gaya" 
            });
        }

        const user = await User.findById(userId)
            .populate('referredBy', 'name email')
            .select('-password -otp -otpExpiry');

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User nahi mila' 
            });
        }

        res.json({
            success: true,
            referralCode: user.referralCode,
            referralCount: user.referralCount,
            referralEarnings: user.referralEarnings,
            referredBy: user.referredBy || null
        });
    } catch (error) {
        console.error('Referral stats error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Referral stats fetch karne mein error aaya',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};