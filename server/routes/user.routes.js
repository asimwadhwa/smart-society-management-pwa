const express = require('express');

const router = express.Router();

const userController =
  require('../controllers/user.controller');

const {
  authenticate,
  authorize
} = require('../middleware/auth.middleware');

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authenticate);

// ============================================================
// SUPER ADMIN USER MANAGEMENT
// ============================================================

// GET /api/users/society/:societyId
// Get all users of a particular society
router.get(
  '/society/:societyId',
  authorize('super_admin'),
  userController.getUsersBySociety
);

// ============================================================

// GET /api/users/society/:societyId/stats
// Get user statistics of a particular society
router.get(
  '/society/:societyId/stats',
  authorize('super_admin'),
  userController.getSocietyUserStats
);

// ============================================================
// ALL USERS
// ============================================================

// GET /api/users
//
// Manager/Admin:
//   Own society users
//
// Super Admin:
//   All users
//   Optional ?society_id=...
router.get(
  '/',
  authorize(
    'super_admin',
    'manager',
    'admin'
  ),
  userController.getAllUsers
);

// ============================================================
// AVAILABLE FLATS
// ============================================================

// GET /api/users/flats/available
router.get(
  '/flats/available',
  authorize(
    'manager',
    'admin'
  ),
  userController.getAvailableFlats
);

// ============================================================
// USER BY ID
// ============================================================

// GET /api/users/:id
router.get(
  '/:id',
  authorize(
    'super_admin',
    'manager',
    'admin'
  ),
  userController.getUserById
);

// ============================================================
// ROLE MANAGEMENT
// ============================================================

// PUT /api/users/:id/role
//
// Manager/Admin:
//   Resident <-> Admin
//
// Super Admin:
//   Resident <-> Admin
router.put(
  '/:id/role',
  authorize(
    'super_admin',
    'manager',
    'admin'
  ),
  userController.updateUserRole
);

// ============================================================
// WATCHMAN
// ============================================================

// Existing functionality preserved
router.post(
  '/watchman',
  authorize(
    'manager',
    'admin'
  ),
  userController.createWatchman
);

// ============================================================
// DEACTIVATE USER
// ============================================================

// DELETE /api/users/:id
router.delete(
  '/:id',
  authorize(
    'super_admin',
    'manager',
    'admin'
  ),
  userController.deleteUser
);

// ============================================================
// ACTIVATE USER
// ============================================================

// PUT /api/users/:id/activate
router.put(
  '/:id/activate',
  authorize(
    'super_admin',
    'manager',
    'admin'
  ),
  userController.activateUser
);

module.exports = router;