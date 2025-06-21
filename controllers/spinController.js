const User = require('../models/User');

const rewards = [
    { amount: 5, probability: 0.4 },   // 40%
    { amount: 10, probability: 0.3 },  // 30%
    { amount: 20, probability: 0.15 }, // 15%
    { amount: 50, probability: 0.1 },  // 10%
    { amount: 100, probability: 0.05 } // 5%
];

exports.spinWheel = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Calculate random reward
        const random = Math.random();
        let cumulativeProb = 0;
        let reward = rewards[0].amount;

        for (const r of rewards) {
            cumulativeProb += r.probability;
            if (random <= cumulativeProb) {
                reward = r.amount;
                break;
            }
        }

        user.spinEarnings += reward;
        await user.save();

        res.json({
            success: true,
            message: `You won ₹${reward} from spin wheel!`,
            reward,
            totalEarnings: user.totalEarnings
        });

    } catch (error) {
        console.error('Spin error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during spin',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getSpinStats = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('spinEarnings');
        res.json({ success: true, spinEarnings: user.spinEarnings });
    } catch (error) {
        console.error('Get spin stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to get spin stats' });
    }
};