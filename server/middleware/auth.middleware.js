const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Cookie
    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // Authorization header
    if (!token) {
      const authHeader =
        req.headers.authorization;

      if (
        authHeader &&
        authHeader.startsWith('Bearer ')
      ) {
        token =
          authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    if (!decoded?.user_id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    const user =
      await User.findById(
        decoded.user_id
      ).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive'
      });
    }

    // Every user except Super Admin
    // must belong to a society
    if (
      user.role !== 'super_admin' &&
      !user.society_id
    ) {
      return res.status(403).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }

    req.user = user;

    next();

  } catch (error) {

    console.error(
      'Authentication error:',
      error
    );

    return res.status(401).json({
      success: false,
      message:
        'Invalid or expired authentication token'
    });
  }
};


// =========================================================
// ROLE AUTHORIZATION
// =========================================================

const authorize = (...roles) => {
  return (req, res, next) => {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required'
      });
    }

    if (
      !roles.includes(req.user.role)
    ) {
      console.log(
        'Authorization failed:',
        {
          userId: req.user._id,
          role: req.user.role,
          requiredRoles: roles
        }
      );

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