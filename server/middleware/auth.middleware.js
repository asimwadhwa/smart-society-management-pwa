const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authenticate user using JWT
 *
 * Token sources:
 * 1. HTTP-only cookie
 * 2. Authorization: Bearer <token>
 *
 * JWT payload:
 * {
 *   user_id: "<MongoDB User ID>"
 * }
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // ==========================================================
    // GET TOKEN FROM COOKIE
    // ==========================================================
    if (
      req.cookies &&
      req.cookies.token
    ) {
      token = req.cookies.token;
    }

    // ==========================================================
    // GET TOKEN FROM AUTHORIZATION HEADER
    // ==========================================================
    if (
      !token &&
      req.headers.authorization
    ) {
      const authHeader =
        req.headers.authorization;

      if (
        authHeader.startsWith('Bearer ')
      ) {
        token =
          authHeader
            .substring(7)
            .trim();
      }
    }

    // ==========================================================
    // TOKEN NOT FOUND
    // ==========================================================
    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          'Access denied. No token provided.'
      });
    }

    // ==========================================================
    // VERIFY JWT
    // ==========================================================
    let decoded;

    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );
    } catch (error) {

      if (
        error.name ===
        'TokenExpiredError'
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
    // CHECK USER ID IN TOKEN
    // ==========================================================
    if (!decoded || !decoded.user_id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    // ==========================================================
    // FIND USER
    // ==========================================================
    const user =
      await User.findById(
        decoded.user_id
      ).select(
        '-password_hash'
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          'User not found.'
      });
    }

    // ==========================================================
    // CHECK ACTIVE ACCOUNT
    // ==========================================================
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message:
          'Account is deactivated.'
      });
    }

    // ==========================================================
    // SOCIETY VALIDATION
    //
    // Super Admin:
    //   society_id = null
    //
    // Manager/Admin/Resident/Watchman:
    //   society_id must exist
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
    // ATTACH USER TO REQUEST
    // ==========================================================
    req.user = user;

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
 * Authorize user based on role
 */
const authorize = (...roles) => {
  return (req, res, next) => {

    // ==========================================================
    // AUTHENTICATION REQUIRED
    // ==========================================================
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required.'
      });
    }

    // ==========================================================
    // ROLE CHECK
    // ==========================================================
    if (
      !roles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};