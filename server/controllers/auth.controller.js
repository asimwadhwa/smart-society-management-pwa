const User = require('../models/User');
const Society = require('../models/Society');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ============================================================
// JWT TOKEN
// ============================================================
const generateToken = (userId) => {
  return jwt.sign(
    { user_id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// ============================================================
// SET TOKEN COOKIE
// ============================================================
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite:
      process.env.NODE_ENV === 'production'
        ? 'none'
        : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

// ============================================================
// VALIDATE USER DETAILS
// ============================================================
const validateUserDetails = ({
  name,
  email,
  password,
  flat_no,
  phone
}) => {
  const errors = [];

  if (
    typeof name !== 'string' ||
    name.trim().length < 2
  ) {
    errors.push(
      'Name must be at least 2 characters'
    );
  }

  if (
    typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email.trim()
    )
  ) {
    errors.push(
      'Please enter a valid email address'
    );
  }

  if (
    typeof password !== 'string' ||
    password.length < 6
  ) {
    errors.push(
      'Password must be at least 6 characters'
    );
  }

  if (
    typeof flat_no !== 'string' ||
    !flat_no.trim()
  ) {
    errors.push(
      'Flat number is required'
    );
  }

  if (
    typeof phone !== 'string' ||
    !/^[6-9]\d{9}$/.test(
      phone.trim()
    )
  ) {
    errors.push(
      'Please enter a valid 10-digit phone number'
    );
  }

  return errors;
};

// ============================================================
// SUPER ADMIN SETUP
// ============================================================
exports.superAdminSetup = async (
  req,
  res,
  next
) => {
  try {
    const {
      setup_key,
      name,
      email,
      password,
      phone
    } = req.body;

    // --------------------------------------------------------
    // Check setup key
    // --------------------------------------------------------
    if (
      !setup_key ||
      setup_key !==
        process.env.SUPER_ADMIN_SETUP_KEY
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Invalid super admin setup key'
      });
    }

    // --------------------------------------------------------
    // Check if super admin already exists
    // --------------------------------------------------------
    const existingSuperAdmin =
      await User.findOne({
        role: 'super_admin'
      });

    if (existingSuperAdmin) {
      return res.status(400).json({
        success: false,
        message:
          'Super Admin is already registered'
      });
    }

    // --------------------------------------------------------
    // Validate
    // --------------------------------------------------------
    if (
      typeof name !== 'string' ||
      name.trim().length < 2
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Name must be at least 2 characters'
      });
    }

    if (
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please enter a valid email address'
      });
    }

    if (
      typeof password !== 'string' ||
      password.length < 6
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 6 characters'
      });
    }

    if (
      typeof phone !== 'string' ||
      !/^[6-9]\d{9}$/.test(
        phone.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please enter a valid 10-digit phone number'
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    // --------------------------------------------------------
    // Check email
    // --------------------------------------------------------
    const existingEmail =
      await User.findOne({
        email: cleanEmail
      });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message:
          'Email is already registered'
      });
    }

    // --------------------------------------------------------
    // Create Super Admin
    // --------------------------------------------------------
    const user =
      await User.create({
        name: name.trim(),
        email: cleanEmail,
        password_hash: password,
        phone: phone.trim(),
        role: 'super_admin',
        society_id: null,
        is_active: true,
        is_verified: true
      });

    const token =
      generateToken(user._id);

    setTokenCookie(
      res,
      token
    );

    return res.status(201).json({
      success: true,
      message:
        'Super Admin registered successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });

  } catch (error) {

    if (
      error.code === 11000
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Email is already registered'
      });
    }

    next(error);
  }
};

// ============================================================
// MANAGER SETUP BY SUPER ADMIN
// ============================================================
exports.managerSetup = async (
  req,
  res,
  next
) => {
  try {
    const {
      society_id,
      name,
      email,
      password,
      flat_no,
      phone
    } = req.body;

    // --------------------------------------------------------
    // Society ID required
    // --------------------------------------------------------
    if (!society_id) {
      return res.status(400).json({
        success: false,
        message:
          'Society ID is required'
      });
    }

    // --------------------------------------------------------
    // Find active society
    // --------------------------------------------------------
    const society =
      await Society.findOne({
        _id: society_id,
        is_active: true
      });

    if (!society) {
      return res.status(404).json({
        success: false,
        message:
          'Society not found or inactive'
      });
    }

    // --------------------------------------------------------
    // Validate details
    // --------------------------------------------------------
    const errors =
      validateUserDetails({
        name,
        email,
        password,
        flat_no,
        phone
      });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanFlatNo =
      flat_no.trim();

    const cleanPhone =
      phone.trim();

    // --------------------------------------------------------
    // Check email
    // --------------------------------------------------------
    const existingEmail =
      await User.findOne({
        email: cleanEmail
      });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message:
          'Email is already registered'
      });
    }

    // --------------------------------------------------------
    // Check manager already exists
    // --------------------------------------------------------
    const existingManager =
      await User.findOne({
        society_id: society._id,
        role: 'manager',
        is_active: true
      });

    if (existingManager) {
      return res.status(400).json({
        success: false,
        message:
          'Manager already exists for this society'
      });
    }

    // --------------------------------------------------------
    // Check flat
    // --------------------------------------------------------
    const existingFlat =
      await User.findOne({
        society_id: society._id,
        flat_no: cleanFlatNo,
        is_active: true
      });

    if (existingFlat) {
      return res.status(400).json({
        success: false,
        message:
          'This flat is already registered in this society'
      });
    }

    // --------------------------------------------------------
    // Create Manager
    // --------------------------------------------------------
    const manager =
      await User.create({
        name: name.trim(),
        email: cleanEmail,
        password_hash: password,
        flat_no: cleanFlatNo,
        phone: cleanPhone,
        society_id: society._id,
        role: 'manager',
        is_active: true,
        is_verified: true
      });

    const token =
      generateToken(manager._id);

    setTokenCookie(
      res,
      token
    );

    return res.status(201).json({
      success: true,
      message:
        'Manager registered successfully',
      data: {
        user: manager.toJSON(),
        token,
        society: {
          _id: society._id,
          name: society.name,
          society_code:
            society.society_code
        }
      }
    });

  } catch (error) {

    if (
      error.name ===
      'ValidationError'
    ) {
      return res.status(400).json({
        success: false,
        message:
          Object.values(
            error.errors
          )
            .map(
              err => err.message
            )
            .join('. ')
      });
    }

    if (
      error.code === 11000
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Duplicate data already exists'
      });
    }

    next(error);
  }
};

// ============================================================
// CHECK MANAGER EXISTS
// ============================================================
exports.checkManagerExists =
  async (
    req,
    res,
    next
  ) => {
    try {

      const {
        society_id
      } = req.query;

      if (!society_id) {
        return res.status(400).json({
          success: false,
          message:
            'Society ID is required'
        });
      }

      const manager =
        await User.findOne({
          society_id,
          role: 'manager',
          is_active: true
        }).select('_id');

      return res.status(200).json({
        success: true,
        exists: !!manager
      });

    } catch (error) {
      next(error);
    }
  };

// ============================================================
// REGISTER RESIDENT
// ============================================================
exports.register = async (
  req,
  res,
  next
) => {
  try {

    const {
      name,
      email,
      password,
      flat_no,
      phone,
      society_code
    } = req.body;

    // --------------------------------------------------------
    // Validate user details
    // --------------------------------------------------------
    const errors =
      validateUserDetails({
        name,
        email,
        password,
        flat_no,
        phone
      });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    // --------------------------------------------------------
    // Society code required
    // --------------------------------------------------------
    if (
      typeof society_code !==
        'string' ||
      !society_code.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Society code is required'
      });
    }

    const cleanSocietyCode =
      society_code
        .trim()
        .toUpperCase();

    // --------------------------------------------------------
    // Find active society
    // --------------------------------------------------------
    const society =
      await Society.findOne({
        society_code:
          cleanSocietyCode,
        is_active: true
      });

    if (!society) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid or inactive society code'
      });
    }

    const societyId =
      society._id;

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanFlatNo =
      flat_no.trim();

    const cleanPhone =
      phone.trim();

    // --------------------------------------------------------
    // Check email
    // --------------------------------------------------------
    const existingEmail =
      await User.findOne({
        email: cleanEmail
      });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message:
          'Email is already registered'
      });
    }

    // --------------------------------------------------------
    // Check flat in same society
    // --------------------------------------------------------
    const existingFlat =
      await User.findOne({
        society_id: societyId,
        flat_no: cleanFlatNo,
        is_active: true
      });

    if (existingFlat) {
      return res.status(400).json({
        success: false,
        message:
          'This flat is already registered in this society'
      });
    }

    // --------------------------------------------------------
    // Manager must exist first
    // --------------------------------------------------------
    const managerExists =
      await User.findOne({
        society_id: societyId,
        role: 'manager',
        is_active: true
      });

    if (!managerExists) {
      return res.status(400).json({
        success: false,
        message:
          'Manager must be registered first. Please contact your society manager.'
      });
    }

    // --------------------------------------------------------
    // Create Resident
    // --------------------------------------------------------
    const user =
      await User.create({
        name: name.trim(),
        email: cleanEmail,
        password_hash: password,
        flat_no: cleanFlatNo,
        phone: cleanPhone,
        society_id: societyId,
        role: 'resident',
        is_active: true,
        is_verified: true
      });

    const token =
      generateToken(user._id);

    setTokenCookie(
      res,
      token
    );

    return res.status(201).json({
      success: true,
      message:
        'Registration successful',
      data: {
        user: user.toJSON(),
        token,
        society: {
          _id: society._id,
          name: society.name,
          society_code:
            society.society_code
        }
      }
    });

  } catch (error) {

    if (
      error.name ===
      'ValidationError'
    ) {
      return res.status(400).json({
        success: false,
        message:
          Object.values(
            error.errors
          )
            .map(
              err => err.message
            )
            .join('. ')
      });
    }

    if (
      error.code === 11000
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Duplicate data already exists'
      });
    }

    next(error);
  }
};

// ============================================================
// LOGIN
// ============================================================
exports.login = async (
  req,
  res,
  next
) => {
  try {

    const {
      email,
      password,
      society_code
    } = req.body;

    // --------------------------------------------------------
    // Validate email
    // --------------------------------------------------------
    if (
      typeof email !== 'string' ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Email is required'
      });
    }

    // --------------------------------------------------------
    // Validate password
    // --------------------------------------------------------
    if (
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Password is required'
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    // --------------------------------------------------------
    // Find user
    // --------------------------------------------------------
    const user =
      await User.findOne({
        email: cleanEmail
      }).select(
        '+password_hash'
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid email or password'
      });
    }

    // --------------------------------------------------------
    // Check active status
    // --------------------------------------------------------
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message:
          'Your account is inactive. Please contact administrator.'
      });
    }

    // --------------------------------------------------------
    // SUPER ADMIN LOGIN
    // --------------------------------------------------------
    if (
      user.role ===
      'super_admin'
    ) {

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message:
            'Invalid email or password'
        });
      }

      const token =
        generateToken(user._id);

      setTokenCookie(
        res,
        token
      );

      return res.status(200).json({
        success: true,
        message:
          'Login successful',
        data: {
          user: user.toJSON(),
          token,
          society: null
        }
      });
    }

    // --------------------------------------------------------
    // NORMAL USER LOGIN
    // Manager / Admin / Resident / Watchman
    // --------------------------------------------------------
    if (
      typeof society_code !==
        'string' ||
      !society_code.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Society code is required'
      });
    }

    const cleanSocietyCode =
      society_code
        .trim()
        .toUpperCase();

    // --------------------------------------------------------
    // Find active society
    // --------------------------------------------------------
    const society =
      await Society.findOne({
        society_code:
          cleanSocietyCode,
        is_active: true
      });

    if (!society) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid or inactive society code'
      });
    }

    // --------------------------------------------------------
    // Check user's society
    // --------------------------------------------------------
    if (
      !user.society_id ||
      user.society_id.toString() !==
        society._id.toString()
    ) {
      return res.status(401).json({
        success: false,
        message:
          'User does not belong to this society'
      });
    }

    // --------------------------------------------------------
    // Compare password
    // --------------------------------------------------------
    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password_hash
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          'Invalid email or password'
      });
    }

    // --------------------------------------------------------
    // Generate token
    // --------------------------------------------------------
    const token =
      generateToken(user._id);

    setTokenCookie(
      res,
      token
    );

    return res.status(200).json({
      success: true,
      message:
        'Login successful',
      data: {
        user: user.toJSON(),
        token,
        society: {
          _id: society._id,
          name: society.name,
          society_code:
            society.society_code
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// LOGOUT
// ============================================================
exports.logout = async (
  req,
  res,
  next
) => {
  try {

    res.clearCookie(
      'token',
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          'production',
        sameSite:
          process.env.NODE_ENV ===
          'production'
            ? 'none'
            : 'lax'
      }
    );

    return res.status(200).json({
      success: true,
      message:
        'Logout successful'
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET CURRENT USER
// ============================================================
exports.getCurrentUser =
  async (
    req,
    res,
    next
  ) => {
    try {

      const user =
        await User.findById(
          req.user._id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            'User not found'
        });
      }

      let society = null;

      if (
        user.role !==
          'super_admin' &&
        user.society_id
      ) {
        society =
          await Society.findById(
            user.society_id
          ).select(
            '_id name society_code address city state contact_number is_active'
          );
      }

      return res.status(200).json({
        success: true,
        data: {
          user: user.toJSON(),
          society
        }
      });

    } catch (error) {
      next(error);
    }
  };

// ============================================================
// FORGOT PASSWORD
// ============================================================
exports.forgotPassword =
  async (
    req,
    res,
    next
  ) => {
    try {

      const {
        email
      } = req.body;

      if (
        typeof email !== 'string' ||
        !email.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Email is required'
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const user =
        await User.findOne({
          email: cleanEmail
        });

      // ------------------------------------------------------
      // Do not reveal whether email exists
      // ------------------------------------------------------
      if (!user) {
        return res.status(200).json({
          success: true,
          message:
            'If the email is registered, an OTP has been sent.'
        });
      }

      if (!user.is_active) {
        return res.status(200).json({
          success: true,
          message:
            'If the email is registered, an OTP has been sent.'
        });
      }

      // ------------------------------------------------------
      // Generate OTP
      // ------------------------------------------------------
      const otp =
        crypto
          .randomInt(
            100000,
            1000000
          )
          .toString();

      const otpHash =
        await bcrypt.hash(
          otp,
          10
        );

      user.reset_password_otp =
        otpHash;

      user.reset_password_otp_expires =
        new Date(
          Date.now() +
            10 * 60 * 1000
        );

      await user.save();

      // ------------------------------------------------------
      // Send email
      // ------------------------------------------------------
      try {

        if (
          process.env.BREVO_API_KEY &&
          process.env.BREVO_SENDER_EMAIL
        ) {

          const response =
            await fetch(
              'https://api.brevo.com/v3/smtp/email',
              {
                method: 'POST',
                headers: {
                  'accept':
                    'application/json',
                  'api-key':
                    process.env.BREVO_API_KEY,
                  'content-type':
                    'application/json'
                },
                body: JSON.stringify({
                  sender: {
                    name:
                      process.env.BREVO_SENDER_NAME ||
                      'Smart Society Management',
                    email:
                      process.env.BREVO_SENDER_EMAIL
                  },
                  to: [
                    {
                      email:
                        cleanEmail
                    }
                  ],
                  subject:
                    'Password Reset OTP',
                  htmlContent: `
                    <div style="font-family: Arial, sans-serif;">
                      <h2>Password Reset</h2>
                      <p>Your OTP for password reset is:</p>
                      <h1>${otp}</h1>
                      <p>This OTP is valid for 10 minutes.</p>
                      <p>If you did not request this, please ignore this email.</p>
                    </div>
                  `
                })
              }
            );

          if (!response.ok) {
            console.error(
              'Brevo email failed:',
              await response.text()
            );
          }

        } else {

          // Development fallback
          console.log(
            `PASSWORD RESET OTP for ${cleanEmail}: ${otp}`
          );
        }

      } catch (emailError) {

        console.error(
          'OTP email error:',
          emailError
        );

        // Do not expose internal email error
      }

      return res.status(200).json({
        success: true,
        message:
          'If the email is registered, an OTP has been sent.'
      });

    } catch (error) {
      next(error);
    }
  };

// ============================================================
// VERIFY OTP
// ============================================================
exports.verifyOTP =
  async (
    req,
    res,
    next
  ) => {
    try {

      const {
        email,
        otp
      } = req.body;

      if (
        typeof email !== 'string' ||
        !email.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Email is required'
        });
      }

      if (
        typeof otp !== 'string' ||
        !/^\d{6}$/.test(
          otp.trim()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid 6-digit OTP'
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const user =
        await User.findOne({
          email: cleanEmail
        }).select(
          '+reset_password_otp +reset_password_otp_expires'
        );

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid OTP'
        });
      }

      if (
        !user.reset_password_otp ||
        !user.reset_password_otp_expires
      ) {
        return res.status(400).json({
          success: false,
          message:
            'OTP is invalid or expired'
        });
      }

      if (
        new Date() >
        user.reset_password_otp_expires
      ) {
        return res.status(400).json({
          success: false,
          message:
            'OTP has expired'
        });
      }

      const otpMatch =
        await bcrypt.compare(
          otp.trim(),
          user.reset_password_otp
        );

      if (!otpMatch) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid OTP'
        });
      }

      return res.status(200).json({
        success: true,
        message:
          'OTP verified successfully'
      });

    } catch (error) {
      next(error);
    }
  };

// ============================================================
// RESET PASSWORD
// ============================================================
exports.resetPassword =
  async (
    req,
    res,
    next
  ) => {
    try {

      const {
        email,
        otp,
        new_password
      } = req.body;

      if (
        typeof email !== 'string' ||
        !email.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Email is required'
        });
      }

      if (
        typeof otp !== 'string' ||
        !/^\d{6}$/.test(
          otp.trim()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid 6-digit OTP'
        });
      }

      if (
        typeof new_password !==
          'string' ||
        new_password.length < 6
      ) {
        return res.status(400).json({
          success: false,
          message:
            'New password must be at least 6 characters'
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const user =
        await User.findOne({
          email: cleanEmail
        }).select(
          '+reset_password_otp +reset_password_otp_expires'
        );

      if (!user) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid reset request'
        });
      }

      if (
        !user.reset_password_otp ||
        !user.reset_password_otp_expires
      ) {
        return res.status(400).json({
          success: false,
          message:
            'OTP is invalid or expired'
        });
      }

      if (
        new Date() >
        user.reset_password_otp_expires
      ) {
        return res.status(400).json({
          success: false,
          message:
            'OTP has expired'
        });
      }

      // ------------------------------------------------------
      // Verify OTP
      // ------------------------------------------------------
      const otpMatch =
        await bcrypt.compare(
          otp.trim(),
          user.reset_password_otp
        );

      if (!otpMatch) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid OTP'
        });
      }

      // ------------------------------------------------------
      // Update password
      // ------------------------------------------------------
      user.password_hash =
        new_password;

      // ------------------------------------------------------
      // Clear OTP
      // ------------------------------------------------------
      user.reset_password_otp =
        undefined;

      user.reset_password_otp_expires =
        undefined;

      await user.save();

      return res.status(200).json({
        success: true,
        message:
          'Password reset successfully'
      });

    } catch (error) {
      next(error);
    }
  };