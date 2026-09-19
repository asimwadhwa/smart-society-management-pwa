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
// SUPER ADMIN - USERS BY SOCIETY
// ============================================================

// GET /api/users/society/:societyId
router.get(
  '/society/:societyId',
  authorize('super_admin'),
  userController.getUsersBySociety
);

// GET /api/users/society/:societyId/stats
router.get(
  '/society/:societyId/stats',
  authorize('super_admin'),
  userController.getSocietyUserStats
);

// ============================================================
// ALL USERS
// ============================================================

// Manager/Admin:
//   Own society users
//
// Super Admin:
//   All society users
//   Optional ?society_id=...
//
// GET /api/users
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

// Manager/Admin only
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

// Manager/Admin:
//   Own society only
//
// Super Admin:
//   Any society
//
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

// Manager/Admin:
//   Resident <-> Admin
//
// Super Admin:
//   Resident <-> Admin
//
// Manager role is handled separately through manager setup.
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

// Manager/Admin:
//   Own society
//
// Super Admin:
//   Any society
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

// Manager/Admin:
//   Own society
//
// Super Admin:
//   Any society
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