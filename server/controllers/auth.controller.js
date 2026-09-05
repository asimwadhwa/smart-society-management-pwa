const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOTP, getOTPExpiry } = require('../utils/generateOTP');
const emailService = require('../services/email.service');

// ============================================================
// Helper: Generate JWT Token
// ============================================================
const generateToken = (userId) => {
  return jwt.sign(
    { user_id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ============================================================
// Helper: Set JWT Cookie
// ============================================================
const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  res.cookie('token', token, cookieOptions);
};

// ============================================================
// Helper: Validate Flat Number
// Allowed:
// 101-110
// 201-210
// 301-310
// 401-410
// ============================================================
const isValidFlatNo = (flatNo) => {
  if (typeof flatNo !== 'string') {
    return false;
  }

  return /^(10[1-9]|110|20[1-9]|210|30[1-9]|310|40[1-9]|410)$/.test(
    flatNo.trim()
  );
};

// ============================================================
// Helper: Validate Email
// ============================================================
const isValidEmail = (email) => {
  if (typeof email !== 'string') {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
    email.trim()
  );
};

// ============================================================
// Helper: Validate Name
// Allows letters, spaces, dot, apostrophe and hyphen
// ============================================================
const isValidName = (name) => {
  if (typeof name !== 'string') {
    return false;
  }

  const cleanName = name.trim();

  if (cleanName.length < 2 || cleanName.length > 50) {
    return false;
  }

  return /^[A-Za-zÀ-ÖØ-öø-ÿ.' -]+$/.test(cleanName);
};

// ============================================================
// Helper: Validate Indian Mobile Number
// Must be exactly 10 digits and start with 6-9
// ============================================================
const isValidPhone = (phone) => {
  if (typeof phone !== 'string') {
    return false;
  }

  return /^[6-9]\d{9}$/.test(phone.trim());
};

// ============================================================
// Helper: Validate Strong Password
// Minimum 8 characters
// 1 uppercase
// 1 lowercase
// 1 number
// 1 special character
// No spaces
// ============================================================
const isStrongPassword = (password) => {
  if (typeof password !== 'string') {
    return false;
  }

  if (password.length < 8 || password.length > 64) {
    return false;
  }

  // No spaces
  if (/\s/.test(password)) {
    return false;
  }

  // Uppercase
  if (!/[A-Z]/.test(password)) {
    return false;
  }

  // Lowercase
  if (!/[a-z]/.test(password)) {
    return false;
  }

  // Number
  if (!/[0-9]/.test(password)) {
    return false;
  }

  // Special character
  if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]/+=;'`~]/.test(password)) {
    return false;
  }

  return true;
};

// ============================================================
// Helper: Validate Registration Details
// ============================================================
const validateUserDetails = ({
  name,
  email,
  password,
  flat_no,
  phone,
}) => {
  const errors = [];

  // Name
  if (!name || !name.trim()) {
    errors.push('Full name is required');
  } else if (!isValidName(name)) {
    errors.push(
      'Full name must be 2-50 characters and can contain only letters, spaces, dot, apostrophe and hyphen'
    );
  }

  // Email
  if (!email || !email.trim()) {
    errors.push('Email address is required');
  } else if (!isValidEmail(email)) {
    errors.push('Please enter a valid email address');
  }

  // Password
  if (!password) {
    errors.push('Password is required');
  } else if (!isStrongPassword(password)) {
    errors.push(
      'Password must be 8-64 characters and contain uppercase, lowercase, number and special character, with no spaces'
    );
  }

  // Flat
  if (!flat_no || !flat_no.trim()) {
    errors.push('Flat number is required');
  } else if (!isValidFlatNo(flat_no)) {
    errors.push(
      'Invalid flat number. Must be between 101-110, 201-210, 301-310, or 401-410'
    );
  }

  // Phone
  if (!phone || !phone.trim()) {
    errors.push('Phone number is required');
  } else if (!isValidPhone(phone)) {
    errors.push(
      'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9'
    );
  }

  return errors;
};

/**
 * @desc    Register new resident
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      flat_no,
      phone,
    } = req.body;

    // ========================================================
    // Validate all registration details
    // ========================================================
    const validationErrors = validateUserDetails({
      name,
      email,
      password,
      flat_no,
      phone,
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0],
        errors: validationErrors,
      });
    }

    // ========================================================
    // Clean / normalize data
    // ========================================================
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanFlatNo = flat_no.trim();
    const cleanPhone = phone.trim();

    // ========================================================
    // Check if email already exists
    // ========================================================
    const existingEmail = await User.findOne({
      email: cleanEmail,
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    // ========================================================
    // Check if flat is already registered
    // ========================================================
    const existingFlat = await User.findOne({
      flat_no: cleanFlatNo,
    });

    if (existingFlat) {
      return res.status(400).json({
        success: false,
        message: 'This flat is already registered',
      });
    }

    // ========================================================
    // Check if manager exists
    // Residents can register only after manager
    // ========================================================
    const managerExists = await User.findOne({
      role: 'manager',
    });

    if (!managerExists) {
      return res.status(400).json({
        success: false,
        message:
          'Manager must be registered first. Please contact your society manager.',
      });
    }

    // ========================================================
    // Create resident
    // ========================================================
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password_hash: password,
      flat_no: cleanFlatNo,
      phone: cleanPhone,
      role: 'resident',
    });

    // ========================================================
    // Generate JWT
    // ========================================================
    const token = generateToken(user._id);

    // ========================================================
    // Set cookie
    // ========================================================
    setTokenCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(
        (err) => err.message
      );

      return res.status(400).json({
        success: false,
        message: messages.join('. '),
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const duplicateField = Object.keys(
        error.keyPattern || {}
      )[0];

      if (duplicateField === 'email') {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered',
        });
      }

      if (duplicateField === 'flat_no') {
        return res.status(400).json({
          success: false,
          message: 'This flat is already registered',
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Duplicate data already exists',
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
    const {
      email,
      password,
    } = req.body;

    // ========================================================
    // Basic validation
    // ========================================================
    if (
      typeof email !== 'string' ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address',
      });
    }

    if (
      typeof password !== 'string' ||
      !password.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your password',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // ========================================================
    // Email validation
    // ========================================================
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    // ========================================================
    // Find user
    // ========================================================
    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ========================================================
    // Check account status
    // ========================================================
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message:
          'Your account has been deactivated. Please contact the manager.',
      });
    }

    // ========================================================
    // Compare password
    // ========================================================
    const isMatch = await user.comparePassword(
      password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // ========================================================
    // Generate token
    // ========================================================
    const token = generateToken(user._id);

    // ========================================================
    // Set cookie
    // ========================================================
    setTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Public
 */
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
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
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    One-time manager setup
 * @route   POST /api/auth/manager-setup
 * @access  Public
 */
exports.managerSetup = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      flat_no,
      phone,
    } = req.body;

    // ========================================================
    // Check if manager already exists
    // ========================================================
    const managerExists = await User.findOne({
      role: 'manager',
    });

    if (managerExists) {
      return res.status(400).json({
        success: false,
        message:
          'Manager is already registered. This is a one-time setup.',
      });
    }

    // ========================================================
    // Validate details
    // ========================================================
    const validationErrors = validateUserDetails({
      name,
      email,
      password,
      flat_no,
      phone,
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors[0],
        errors: validationErrors,
      });
    }

    // ========================================================
    // Clean / normalize
    // ========================================================
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanFlatNo = flat_no.trim();
    const cleanPhone = phone.trim();

    // ========================================================
    // Check duplicate email
    // ========================================================
    const existingEmail = await User.findOne({
      email: cleanEmail,
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    // ========================================================
    // Check duplicate flat
    // ========================================================
    const existingFlat = await User.findOne({
      flat_no: cleanFlatNo,
    });

    if (existingFlat) {
      return res.status(400).json({
        success: false,
        message: 'This flat is already registered',
      });
    }

    // ========================================================
    // Create manager
    // ========================================================
    const manager = await User.create({
      name: cleanName,
      email: cleanEmail,
      password_hash: password,
      flat_no: cleanFlatNo,
      phone: cleanPhone,
      role: 'manager',
    });

    // ========================================================
    // Generate token
    // ========================================================
    const token = generateToken(manager._id);

    // ========================================================
    // Set cookie
    // ========================================================
    setTokenCookie(res, token);

    return res.status(201).json({
      success: true,
      message:
        'Manager setup successful. Welcome!',
      data: {
        user: manager.toJSON(),
        token,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(
        error.errors
      ).map((err) => err.message);

      return res.status(400).json({
        success: false,
        message: messages.join('. '),
      });
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(
        error.keyPattern || {}
      )[0];

      if (duplicateField === 'email') {
        return res.status(400).json({
          success: false,
          message: 'Email is already registered',
        });
      }

      if (duplicateField === 'flat_no') {
        return res.status(400).json({
          success: false,
          message: 'This flat is already registered',
        });
      }
    }

    next(error);
  }
};

/**
 * @desc    Check if manager exists
 * @route   GET /api/auth/manager-exists
 * @access  Public
 */
exports.checkManagerExists = async (
  req,
  res,
  next
) => {
  try {
    const managerExists = await User.findOne({
      role: 'manager',
    });

    return res.status(200).json({
      success: true,
      data: {
        exists: !!managerExists,
      },
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
exports.forgotPassword = async (
  req,
  res,
  next
) => {
  try {
    const { email } = req.body;

    // Validate email
    if (
      typeof email !== 'string' ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide your email address',
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message:
          'Please enter a valid email address',
      });
    }

    // Find user
    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          'No account found with this email address',
      });
    }

    // Check active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message:
          'This account has been deactivated',
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    user.otp = otp;
    user.otp_expires = otpExpiry;

    await user.save({
      validateBeforeSave: false,
    });

    // Send OTP email
    try {
      await emailService.sendPasswordResetOTP({
        email: user.email,
        name: user.name,
        otp,
        expiryMinutes:
          parseInt(
            process.env.OTP_EXPIRY_MINUTES
          ) || 10,
      });
    } catch (emailError) {
      user.otp = null;
      user.otp_expires = null;

      await user.save({
        validateBeforeSave: false,
      });

      console.error(
        'Failed to send OTP email:',
        emailError
      );

      return res.status(500).json({
        success: false,
        message:
          'Failed to send OTP email. Please try again later.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'OTP sent to your email address',
      data: {
        email: user.email,
        expiryMinutes:
          parseInt(
            process.env.OTP_EXPIRY_MINUTES
          ) || 10,
      },
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
exports.verifyOTP = async (
  req,
  res,
  next
) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (
      typeof email !== 'string' ||
      !email.trim() ||
      !otp
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide email and OTP',
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    // Validate email
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message:
          'Please enter a valid email address',
      });
    }

    // Validate OTP format
    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({
        success: false,
        message:
          'OTP must be a 6-digit number',
      });
    }

    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          'No account found with this email address',
      });
    }

    if (!user.otp || !user.otp_expires) {
      return res.status(400).json({
        success: false,
        message:
          'No OTP request found. Please request a new OTP.',
      });
    }

    // Check expiry
    if (
      new Date() >
      new Date(user.otp_expires)
    ) {
      user.otp = null;
      user.otp_expires = null;

      await user.save({
        validateBeforeSave: false,
      });

      return res.status(400).json({
        success: false,
        message:
          'OTP has expired. Please request a new one.',
      });
    }

    // Check OTP
    if (user.otp !== String(otp)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid OTP. Please check and try again.',
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      {
        user_id: user._id,
        purpose: 'password_reset',
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '15m',
      }
    );

    return res.status(200).json({
      success: true,
      message:
        'OTP verified successfully',
      data: {
        resetToken,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (
  req,
  res,
  next
) => {
  try {
    const {
      email,
      resetToken,
      newPassword,
      confirmPassword,
    } = req.body;

    // Validate required fields
    if (
      typeof email !== 'string' ||
      !email.trim() ||
      !resetToken ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide all required fields',
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    // Validate email
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message:
          'Please enter a valid email address',
      });
    }

    // Password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          'Passwords do not match',
      });
    }

    // Strong password validation
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be 8-64 characters and contain uppercase, lowercase, number and special character, with no spaces',
      });
    }

    // Verify reset token
    let decoded;

    try {
      decoded = jwt.verify(
        resetToken,
        process.env.JWT_SECRET
      );
    } catch (tokenError) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid or expired reset token. Please request a new OTP.',
      });
    }

    // Check token purpose
    if (
      decoded.purpose !==
      'password_reset'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid reset token',
      });
    }

    // Find user
    const user = await User.findOne({
      _id: decoded.user_id,
      email: cleanEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update password
    user.password_hash = newPassword;
    user.otp = null;
    user.otp_expires = null;

    await user.save();

    // Send confirmation email
    try {
      await emailService.sendPasswordResetConfirmation(
        {
          email: user.email,
          name: user.name,
        }
      );
    } catch (emailError) {
      console.error(
        'Failed to send password reset confirmation:',
        emailError
      );
    }

    return res.status(200).json({
      success: true,
      message:
        'Password reset successful. You can now login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};