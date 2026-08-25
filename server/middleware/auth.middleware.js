const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authenticate user via JWT token in cookies or Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies.token;

    // Check Authorization header if cookie not found
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // DEBUG
    console.log("=================================");
    console.log("TOKEN:", token);
    console.log("Authorization Header:", req.headers.authorization);
    console.log("=================================");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // DEBUG
    console.log("DECODED TOKEN:");
    console.log(decoded);

    // Get user from database
    const user = await User.findById(decoded.user_id).select('-password_hash');

    // DEBUG
    console.log("USER FOUND:");
    console.log(user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Attach user to request
    req.user = user;

    console.log("✅ Authentication Successful");
    console.log("=================================");

    next();

  } catch (error) {
    console.log("❌ AUTH ERROR:");
    console.log(error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }

    next(error);
  }
};

/**
 * Authorize user based on roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};