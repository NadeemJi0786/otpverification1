const User = require('../models/User');

exports.getReferralStats = async (req, res) => {
    try {
        const userId = req.session.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "User session expired" });
        }

        const user = await User.findById(userId)
            .populate('referredBy', 'name email'); // Only populate referredBy if needed

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            referralCode: user.referralCode,
            referralCount: user.referralCount,
            referralEarnings: user.referralEarnings,
            referredBy: user.referredBy || null
        });
    } catch (error) {
        console.error('Referral stats error:', error);
        res.status(500).json({ 
            message: 'Error fetching referral stats',
            error: error.message
        });
    }
};