const User = require('../models/User');

exports.getEarningsSummary = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('checkInEarnings spinEarnings referralEarnings');

        res.json({
            success: true,
            earnings: {
                checkIn: user.checkInEarnings,
                spin: user.spinEarnings,
                referral: user.referralEarnings,
                total: user.totalEarnings
            }
        });
    } catch (error) {
        console.error('Earnings summary error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get earnings summary'
        });
    }
};