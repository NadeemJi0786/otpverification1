// controllers/authController.js
const User = require('../models/User');
const { transporter, emailTemplates, generateOTP } = require('../helpers/emailHelper');

exports.register = async (req, res) => {
    try {
        const { name, email, password, referralCode } = req.body;
        let user = await User.findOne({ email });

        if (user) return res.status(400).json({ message: 'User already exists' });

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        const userReferralCode = generateReferralCode();

        user = new User({ 
            name, 
            email, 
            password, 
            otp, 
            otpExpiry,
            referralCode: userReferralCode,
            referralCount: 0,
            referralEarnings: 0,
            pendingReferrals: [],
            completedReferrals: []
        });

        await user.save();

        // Handle referral if code was provided
        if (referralCode) {
            const referrer = await User.findOne({ referralCode });
            if (referrer) {
                // Create referral record and mark as completed immediately
                const referral = new Referral({
                    referrer: referrer._id,
                    referee: user._id,
                    referralCodeUsed: referralCode,
                    status: 'completed',
                    completedAt: new Date()
                });
                await referral.save();

                // Update referrer's stats immediately
                referrer.referralCount += 1;
                referrer.referralEarnings += 100;
                referrer.completedReferrals.push({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    joinedAt: new Date()
                });
                await referrer.save();

                // Update referee's info
                user.referredBy = referrer._id;
                await user.save();

                // Send email notification to referrer
                await transporter.sendMail({
                    from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
                    to: referrer.email,
                    subject: 'You Earned a Referral Bonus!',
                    html: emailTemplates.referralSuccess(referrer.name, user.name, 100),
                    text: `Congratulations ${referrer.name}! You've earned ₹100 for referring ${user.name} to PaisaPe.`
                });
            }
        }

        await transporter.sendMail({
            from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'OTP Verification - PaisaPe',
            html: emailTemplates.otpVerification(otp, name),
            text: `Your OTP is: ${otp}`
        });

        res.status(201).json({ 
            message: 'User registered. Please verify OTP sent to email.',
            referralCode: userReferralCode 
        });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

        if (user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        await transporter.sendMail({
            from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Welcome to PaisaPe!',
            html: emailTemplates.welcomeEmail(user.name, user.referralCode),
            text: `Welcome to PaisaPe, ${user.name}! Your account has been successfully verified. Your referral code: ${user.referralCode}`
        });

        res.json({ 
            message: 'Email verified successfully. You can now log in.',
            referralCode: user.referralCode
        });
    } catch (error) {
        res.status(500).json({ message: 'Error verifying OTP', error });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.password !== password) return res.status(400).json({ message: 'Incorrect password' });
        if (!user.isVerified) return res.status(400).json({ message: 'Email not verified. Please verify OTP.' });

        req.session.user = { 
            id: user._id, 
            email: user.email, 
            name: user.name,
            referralCode: user.referralCode,
            referralCount: user.referralCount,
            referralEarnings: user.referralEarnings
        };
        
        res.json({ 
            message: 'Login successful',
            user: { 
                name: user.name, 
                email: user.email,
                referralCode: user.referralCode,
                referralCount: user.referralCount,
                referralEarnings: user.referralEarnings,
                referredBy: user.referredBy
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

        const otp = generateOTP();
        user.otp = otp;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        await transporter.sendMail({
            from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'Resend OTP - PaisaPe',
            html: emailTemplates.resendOTP(otp, user.name),
            text: `Your new OTP is: ${otp}`
        });

        res.json({ message: 'OTP resent successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error resending OTP', error });
    }
};

exports.currentUser = (req, res) => {
    if (req.session.user) {
        res.json({ 
            isAuthenticated: true,
            user: req.session.user 
        });
    } else {
        res.json({ 
            isAuthenticated: false 
        });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ message: 'Error logging out' });
        res.json({ message: 'Logged out successfully' });
    });
};