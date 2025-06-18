// controllers/userController.js
const User = require('../models/User');

exports.dashboard = async (req, res) => {
    const user = await User.findById(req.session.user.id)
        .select('-password -otp -otpExpiry');
        
    res.json({ 
        message: `Welcome to the dashboard, ${user.name}`,
        user: user 
    });
};