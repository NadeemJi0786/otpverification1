const User = require('../models/User');
const Referral = require('../models/Referral');
const jwt = require('jsonwebtoken');
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

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      name: user.name,
      referralCode: user.referralCode 
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email aur password required hai' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'Ye user pehle se exist karta hai' 
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

    // Referral process
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      
      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: 'Galat referral code hai'
        });
      }

      if (referrer.email === email) {
        return res.status(400).json({
          success: false,
          message: 'Apna khud ka referral code use nahi kar sakte'
        });
      }

      const referral = new Referral({
        referrer: referrer._id,
        referee: user._id,
        referralCodeUsed: referralCode,
        status: 'pending',
        bonusAmount: 100
      });

      await referral.save();
      user.referredBy = referrer._id;
    }

    await user.save();

    // Send OTP email
    await transporter.sendMail({
      from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'OTP Verification - PaisaPe',
      html: emailTemplates.otpVerification(otp, name),
      text: `Aapka OTP hai: ${otp}`
    });

    res.status(201).json({ 
      success: true,
      message: 'User register ho gaya. OTP verify karo.',
      referralCode: userReferralCode,
      email: user.email
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration fail ho gaya. Phir se try karo.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Email aur OTP dono required hai' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Ye email wala user nahi mila' 
      });
    }
    
    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'Ye account pehle hi verify ho chuka hai' 
      });
    }

    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP nahi mila. Naya OTP mangao'
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Galat OTP code' 
      });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP expire ho gaya. Naya OTP mangao' 
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Process referral
    if (user.referredBy) {
      await Referral.findOneAndUpdate(
        { referee: user._id },
        { $set: { status: 'completed', completedAt: new Date() } }
      );
      
      await User.findByIdAndUpdate(user.referredBy, {
        $inc: { referralCount: 1, referralEarnings: 100 }
      });

      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        await transporter.sendMail({
          from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
          to: referrer.email,
          subject: 'Referral Bonus Mil Gaya!',
          html: emailTemplates.referralSuccess(referrer.name, user.name, 100),
          text: `Badhai ho ${referrer.name}! Aapko ₹100 mila ${user.name} ko refer karne ke liye`
        });
      }
    }

    // Welcome email
    await transporter.sendMail({
      from: `"PaisaPe" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'PaisaPe mein aapka swagat hai!',
      html: emailTemplates.welcomeEmail(user.name, user.referralCode),
      text: `PaisaPe mein aapka swagat hai, ${user.name}!`
    });

    // Generate token after verification
    const token = generateToken(user);

    res.json({ 
      success: true,
      message: 'Email verify ho gaya!',
      token,
      user: {
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        referralEarnings: user.referralEarnings
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'OTP verification fail. Phir se try karo.',
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
        message: 'User nahi mila' 
      });
    }

    if (user.password !== password) {
      return res.status(401).json({ 
        success: false,
        message: 'Password galat hai' 
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false,
        message: 'Email verify nahi hua. OTP verify karo.' 
      });
    }

    // Generate token
    const token = generateToken(user);
    
    res.json({ 
      success: true,
      message: 'Login successful',
      token,
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
      message: 'Login mein error aaya',
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
        message: 'User nahi mila' 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false,
        message: 'User pehle hi verify ho chuka hai' 
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
      text: `Aapka naya OTP hai: ${otp}`
    });

    res.json({ 
      success: true,
      message: 'OTP phir se bhej diya gaya.' 
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'OTP resend mein error aaya',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.currentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.json({ 
        success: true,
        isAuthenticated: false 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -otp -otpExpiry');

    if (!user) {
      return res.json({ 
        success: true,
        isAuthenticated: false 
      });
    }

    res.json({ 
      success: true,
      isAuthenticated: true,
      user 
    });
  } catch (error) {
    res.json({ 
      success: true,
      isAuthenticated: false 
    });
  }
};

exports.logout = (req, res) => {
  // Client side pe token delete karna hoga
  res.json({ 
    success: true,
    message: 'Logout successful' 
  });
};