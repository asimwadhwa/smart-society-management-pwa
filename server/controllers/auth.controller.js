const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, getOTPExpiry } = require('../utils/generateOTP');
const emailService = require('../services/email.service');

// Helper: Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { user_id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Helper: Set JWT Cookie
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // Must be true for sameSite: 'none'
    sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-origin cookies
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  };
  res.cookie('token', token, cookieOptions);
};

// Helper: Validate flat number format (101-410)
const isValidFlatNo = (flatNo) => {
  const floor = parseInt(flatNo.charAt(0));
  const unit = parseInt(flatNo.substring(1));
  return floor >= 1 && floor <= 4 && unit >= 1 && unit <= 10;
};

/**
 * @desc    Register new resident
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, flat_no, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password || !flat_no || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, flat_no, phone'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Validate flat number format
    if (!isValidFlatNo(flat_no)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid flat number. Must be between 101-110, 201-210, 301-310, or 401-410'
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered'
      });
    }

    // Check if flat is already registered
    const existingFlat = await User.findOne({ flat_no });
    if (existingFlat) {
      return res.status(400).json({
        success: false,
        message: 'This flat is already registered'
      });
    }

    // Check if manager exists (residents can only register after manager)
    const managerExists = await User.findOne({ role: 'manager' });
    if (!managerExists) {
      return res.status(400).json({
        success: false,
        message: 'Manager must be registered first. Please contact your society manager.'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash: password, // Will be hashed by pre-save hook
      flat_no,
      phone,
      role: 'resident'
    });

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }
    next(error);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the manager.'
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Set cookie
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user (clear cookie)
 * @route   POST /api/auth/logout
 * @access  Public
 */
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0)
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    // User is already attached by auth middleware
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user: user.toJSON() }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    One-time manager setup (first user)
 * @route   POST /api/auth/manager-setup
 * @access  Public
 */
exports.managerSetup = async (req, res, next) => {
  try {
    const { name, email, password, flat_no, phone } = req.body;

    // Check if manager already exists
    const managerExists = await User.findOne({ role: 'manager' });
    if (managerExists) {
      return res.status(400).json({
        success: false,
        message: 'Manager is already registered. This is a one-time setup.'
      });
    }

    // Validate required fields
    if (!name || !email || !password || !flat_no || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, flat_no, phone'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Validate flat number
    if (!isValidFlatNo(flat_no)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid flat number. Must be between 101-110, 201-210, 301-310, or 401-410'
      });
    }

    // Create manager
    const manager = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash: password,
      flat_no,
      phone,
      role: 'manager'
    });

    // Generate token
    const token = generateToken(manager._id);

    // Set cookie
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Manager setup successful. Welcome!',
      data: {
        user: manager.toJSON(),
        token
      }
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join('. ')
      });
    }
    next(error);
  }
};

/**
 * @desc    Check if manager exists
 * @route   GET /api/auth/manager-exists
 * @access  Public
 */
exports.checkManagerExists = async (req, res, next) => {
  try {
    const managerExists = await User.findOne({ role: 'manager' });
    
    res.status(200).json({
      success: true,
      data: { exists: !!managerExists }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send password reset OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated'
      });
    }

    // Generate OTP and expiry
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Save OTP to user document
    user.otp = otp;
    user.otp_expires = otpExpiry;
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    try {
      await emailService.sendPasswordResetOTP({
        email: user.email,
        name: user.name,
        otp: otp,
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10
      });
    } catch (emailError) {
      // Clear OTP if email fails
      user.otp = null;
      user.otp_expires = null;
      await user.save({ validateBeforeSave: false });

      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email address',
      data: {
        email: user.email,
        expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Check if OTP exists
    if (!user.otp || !user.otp_expires) {
      return res.status(400).json({
        success: false,
        message: 'No OTP request found. Please request a new OTP.'
      });
    }

    // Check if OTP is expired
    if (new Date() > new Date(user.otp_expires)) {
      // Clear expired OTP
      user.otp = null;
      user.otp_expires = null;
      await user.save({ validateBeforeSave: false });

      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again.'
      });
    }

    // OTP is valid - generate a temporary reset token
    const resetToken = jwt.sign(
      { user_id: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Token valid for 15 minutes
    );

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        resetToken,
        email: user.email
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password with verified OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, resetToken, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!email || !resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (tokenError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new OTP.'
      });
    }

    // Check token purpose
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Find user by email and token user_id
    const user = await User.findOne({ 
      _id: decoded.user_id,
      email: email.toLowerCase() 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password_hash = newPassword;
    user.otp = null;
    user.otp_expires = null;
    await user.save();

    // Send confirmation email
    try {
      await emailService.sendPasswordResetConfirmation({
        email: user.email,
        name: user.name
      });
    } catch (emailError) {
      console.error('Failed to send password reset confirmation:', emailError);
      // Don't fail the request, password was already reset
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    next(error);
  }
};
