const User = require('../models/User');
const Referral = require('../models/Referral');
const { transporter, emailTemplates, generateOTP } = require('../helpers/emailHelper');

// Generate secure referral code
const generateReferralCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email and password are required' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    // Generate OTP and referral code
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const userReferralCode = generateReferralCode();

    // Create new user
    const user = new User({ 
      name, 
      email, 
      password,
      otp, 
      otpExpiry,
      referralCode: userReferralCode
    });

    // Process referral if code provided
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      
      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code'
        });
      }

      // Prevent self-referral
      if (referrer.email === email) {
        return res.status(400).json({
          success: false,
          message: 'You cannot use your own referral code'
        });
      }

      // Create pending referral record
      const referral = new Referral({
        referrer: referrer._id,
        referee: user._id,
        referralCodeUsed: referralCode,
        status: 'pending', // Set to pending initially
        bonusAmount: 100
      });

      await referral.save();

      // Set referredBy for new user (but don't update counts yet)
      user.referredBy = referrer._id;
    }

    // Save the user
    await user.save();

    // Send OTP email
    await transporter.sendMail({
      from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'OTP Verification - PaisaPe',
      html: emailTemplates.otpVerification(otp, name),
      text: `Your OTP is: ${otp}`
    });

    res.status(201).json({ 
      success: true,
      message: 'User registered. Please verify OTP sent to email.',
      referralCode: userReferralCode,
      email: user.email
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'User already verified' 
      });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OTP' 
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Process referral only after successful verification
    if (user.referredBy) {
      // Update referral status to completed
      await Referral.findOneAndUpdate(
        { referee: user._id },
        { $set: { status: 'completed', completedAt: new Date() } }
      );
      
      // Update referrer's stats
      await User.findByIdAndUpdate(user.referredBy, {
        $inc: { referralCount: 1, referralEarnings: 100 },
        $push: { 
          completedReferrals: {
            userId: user._id,
            name: user.name,
            email: user.email,
            joinedAt: new Date()
          }
        }
      });

      // Get referrer details for email
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        // Send bonus email to referrer
        await transporter.sendMail({
          from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
          to: referrer.email,
          subject: 'Referral Bonus Earned!',
          html: emailTemplates.referralSuccess(referrer.name, user.name, 100),
          text: `Congratulations ${referrer.name}! You earned ₹100 for referring ${user.name}`
        });
      }
    }

    // Send welcome email to new user
    await transporter.sendMail({
      from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Welcome to PaisaPe!',
      html: emailTemplates.welcomeEmail(user.name, user.referralCode),
      text: `Welcome to PaisaPe, ${user.name}! Your referral code: ${user.referralCode}`
    });

    res.json({ 
      success: true,
      message: 'Email verified successfully',
      referralCode: user.referralCode
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ... [rest of the controller methods remain exactly the same as in your original code] ...
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'User already verified' 
      });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired OTP' 
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // If user was referred, update referral status
    if (user.referredBy) {
      await Referral.updateOne(
        { referee: user._id },
        { $set: { status: 'completed' } }
      );
      
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        referrer.referralCount += 1;
        referrer.referralEarnings += 100;
        referrer.completedReferrals.push({
          userId: user._id,
          name: user.name,
          email: user.email,
          joinedAt: new Date()
        });
        await referrer.save();

        // Send bonus email to referrer
        await transporter.sendMail({
          from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
          to: referrer.email,
          subject: 'Referral Bonus Earned!',
          html: emailTemplates.referralSuccess(referrer.name, user.name, 100),
          text: `Congratulations ${referrer.name}! You earned ₹100 for referring ${user.name}`
        });
      }
    }

    await transporter.sendMail({
      from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Welcome to PaisaPe!',
      html: emailTemplates.welcomeEmail(user.name, user.referralCode),
      text: `Welcome to PaisaPe, ${user.name}! Your referral code: ${user.referralCode}`
    });

    res.json({ 
      success: true,
      message: 'Email verified successfully',
      referralCode: user.referralCode
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (user.password !== password) {
      return res.status(401).json({ 
        success: false,
        message: 'Incorrect password' 
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false,
        message: 'Email not verified. Please verify OTP.' 
      });
    }

    req.session.user = { 
      id: user._id, 
      email: user.email, 
      name: user.name,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      referralEarnings: user.referralEarnings
    };
    
    res.json({ 
      success: true,
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
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'User already verified' 
      });
    }

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

    res.json({ 
      success: true,
      message: 'OTP resent successfully.' 
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error resending OTP',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.currentUser = (req, res) => {
  if (req.session.user) {
    res.json({ 
      success: true,
      isAuthenticated: true,
      user: req.session.user 
    });
  } else {
    res.json({ 
      success: true,
      isAuthenticated: false 
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ 
        success: false,
        message: 'Error logging out' 
      });
    }
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  });
};