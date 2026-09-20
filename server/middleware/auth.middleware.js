const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * ============================================================
 * AUTHENTICATE USER
 * ============================================================
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // ==========================================================
    // 1. AUTHORIZATION HEADER
    // ==========================================================

    const authHeader = req.headers.authorization;

    if (
      authHeader &&
      authHeader.startsWith('Bearer ')
    ) {
      token = authHeader
        .substring(7)
        .trim();
    }

    // ==========================================================
    // 2. HTTP-ONLY COOKIE
    // ==========================================================

    if (
      !token &&
      req.cookies &&
      req.cookies.token
    ) {
      token = req.cookies.token;
    }

    // ==========================================================
    // NO TOKEN
    // ==========================================================

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // ==========================================================
    // VERIFY TOKEN
    // ==========================================================

    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (error) {
      console.error(
        'JWT verification error:',
        error.message
      );

      if (
        error.name === 'TokenExpiredError'
      ) {
        return res.status(401).json({
          success: false,
          message: 'Token expired.'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    // ==========================================================
    // VALIDATE PAYLOAD
    // ==========================================================

    if (
      !decoded ||
      !decoded.user_id
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    // ==========================================================
    // FIND USER
    // ==========================================================

    const user = await User.findById(
      decoded.user_id
    ).select('-password_hash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    // ==========================================================
    // CHECK ACTIVE
    // ==========================================================

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // ==========================================================
    // SOCIETY VALIDATION
    // ==========================================================

    if (
      user.role !== 'super_admin' &&
      !user.society_id
    ) {
      return res.status(401).json({
        success: false,
        message:
          'User is not assigned to any society.'
      });
    }

    // ==========================================================
    // ATTACH USER
    // ==========================================================

    req.user = user;

    // DEBUG
    console.log(
      'Authenticated User:',
      user.email
    );

    console.log(
      'Authenticated Role:',
      user.role
    );

    console.log(
      'Authenticated Society:',
      user.society_id || 'ALL SOCIETIES'
    );

    next();

  } catch (error) {
    console.error(
      'Authentication error:',
      error
    );

    next(error);
  }
};


/**
 * ============================================================
 * AUTHORIZE USER ROLE
 * ============================================================
 */
const authorize = (...roles) => {
  return (req, res, next) => {

    // ==========================================================
    // AUTHENTICATION CHECK
    // ==========================================================

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required.'
      });
    }

    // ==========================================================
    // NORMALIZE USER ROLE
    // ==========================================================

    const userRole = String(
      req.user.role || ''
    )
      .trim()
      .toLowerCase();

    // ==========================================================
    // NORMALIZE ALLOWED ROLES
    // ==========================================================

    const allowedRoles = roles.map(
      role =>
        String(role)
          .trim()
          .toLowerCase()
    );

    // ==========================================================
    // DEBUG
    // ==========================================================

    console.log(
      'Authorization Check:',
      {
        user: req.user.email,
        userRole,
        allowedRoles
      }
    );

    // ==========================================================
    // ROLE CHECK
    // ==========================================================

    if (
      !allowedRoles.includes(userRole)
    ) {
      console.log(
        '❌ ACCESS DENIED'
      );

      return res.status(403).json({
        success: false,
        message:
          'Access denied. Insufficient permissions.',
        debug: {
          userRole,
          allowedRoles
        }
      });
    }

    // ==========================================================
    // ACCESS GRANTED
    // ==========================================================

    console.log(
      '✅ ACCESS GRANTED'
    );

    next();
  };
};


module.exports = {
  authenticate,
  authorize
};