const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth.controller');

const {
  authenticate,
  authorize
} = require('../middleware/auth.middleware');

// =========================================================
// SUPER ADMIN SETUP
// =========================================================

router.post(
  '/super-admin-setup',
  authController.superAdminSetup
);

// =========================================================
// MANAGER SETUP
// ONLY SUPER ADMIN CAN CREATE MANAGER
// =========================================================

router.post(
  '/manager-setup',
  authenticate,
  authorize('super_admin'),
  authController.managerSetup
);

// =========================================================
// CHECK MANAGER
// ONLY SUPER ADMIN
// =========================================================

router.get(
  '/manager-exists',
  authenticate,
  authorize('super_admin'),
  authController.checkManagerExists
);

// =========================================================
// REGISTER
// =========================================================

router.post(
  '/register',
  authController.register
);

// =========================================================
// LOGIN
// =========================================================

router.post(
  '/login',
  authController.login
);

// =========================================================
// LOGOUT
// =========================================================

router.post(
  '/logout',
  authController.logout
);

// =========================================================
// CURRENT USER
// =========================================================

router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

// =========================================================
// PASSWORD
// =========================================================

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