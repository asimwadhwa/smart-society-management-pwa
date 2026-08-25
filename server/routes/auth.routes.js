const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// POST /api/auth/manager-setup - First-time manager registration
router.post('/manager-setup', authController.managerSetup);

// GET /api/auth/manager-exists - Check if manager exists
router.get('/manager-exists', authController.checkManagerExists);

// POST /api/auth/register - Register new resident
router.post('/register', authController.register);

// POST /api/auth/login - Login user
router.post('/login', authController.login);

// POST /api/auth/logout - Logout user
router.post('/logout', authController.logout);

// GET /api/auth/me - Get current user (Protected)
router.get('/me', authenticate, authController.getCurrentUser);

// POST /api/auth/forgot-password - Send OTP to email
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/verify-otp - Verify OTP
router.post('/verify-otp', authController.verifyOTP);

// POST /api/auth/reset-password - Reset password
router.post('/reset-password', authController.resetPassword);

module.exports = router;
