const User = require('../models/User');

exports.dashboard = async (req, res) => {
    try {
        // JWT middleware se user id milti hai req.user.id mein
        const user = await User.findById(req.user.id)
            .select('-password -otp -otpExpiry -__v');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User nahi mila'
            });
        }

        res.json({ 
            success: true,
            message: `Dashboard mein swagat hai, ${user.name}`,
            user: {
                name: user.name,
                email: user.email,
                referralCode: user.referralCode,
                referralCount: user.referralCount,
                referralEarnings: user.referralEarnings,
                createdAt: user.createdAt
                // Aur fields jo display karwani ho
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Dashboard load karne mein error aaya',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};