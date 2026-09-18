const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth.controller');

const {
  authenticate,
  authorize
} = require('../middleware/auth.middleware');

// ============================================================
// SUPER ADMIN
// ============================================================

// One-time Super Admin registration
router.post(
  '/super-admin-setup',
  authController.superAdminSetup
);

// ============================================================
// MANAGER
// ============================================================

// Only Super Admin can create a Manager
router.post(
  '/manager-setup',
  authenticate,
  authorize('super_admin'),
  authController.managerSetup
);

// Check Manager for a specific society
router.get(
  '/manager-exists',
  authenticate,
  authorize('super_admin'),
  authController.checkManagerExists
);

// ============================================================
// RESIDENT
// ============================================================

router.post(
  '/register',
  authController.register
);

// ============================================================
// LOGIN / LOGOUT
// ============================================================

router.post(
  '/login',
  authController.login
);

router.post(
  '/logout',
  authController.logout
);

// ============================================================
// CURRENT USER
// ============================================================

router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

// ============================================================
// PASSWORD RESET
// ============================================================

router.post(
  '/forgot-password',
  authController.forgotPassword
);

router.post(
  '/verify-otp',
  authController.verifyOTP
);

router.post(
  '/reset-password',
  authController.resetPassword
);

module.exports = router;