const User = require('../models/User');

exports.dailyCheckIn = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming authMiddleware sets req.user
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (user.lastCheckIn && new Date(user.lastCheckIn) >= today) {
            return res.status(400).json({ success: false, message: 'Already checked in today' });
        }

        // Calculate streak
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        let newStreak = (user.lastCheckIn && new Date(user.lastCheckIn).getTime() === yesterday.getTime()) 
            ? user.checkInStreak + 1 : 1;

        // Calculate reward (5 + streak bonus up to 5)
        const reward = 5 + Math.min(newStreak, 5);

        // Update user
        user.lastCheckIn = now;
        user.checkInStreak = newStreak;
        user.checkInEarnings += reward;
        await user.save();

        res.json({
            success: true,
            message: `Daily check-in successful! Earned ₹${reward}`,
            reward,
            currentStreak: newStreak,
            totalEarnings: user.totalEarnings
        });

    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during check-in',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getCheckInStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('checkInEarnings lastCheckIn checkInStreak');

        res.json({
            success: true,
            checkInEarnings: user.checkInEarnings,
            lastCheckIn: user.lastCheckIn,
            currentStreak: user.checkInStreak
        });
    } catch (error) {
        console.error('Get check-in stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to get check-in stats' });
    }
};