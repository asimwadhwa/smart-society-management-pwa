
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

// All routes below require login.

router.use(authenticate);


// ============================================================
// AVAILABLE FLATS
// ============================================================
//
// Manager only
//
// GET /api/users/flats/available
//
// Manager can see available flats of own society only.
// ============================================================

router.get(
  '/flats/available',
  authorize('manager'),
  userController.getAvailableFlats
);


// ============================================================
// CREATE RESIDENT
// ============================================================
//
// Manager only
//
// POST /api/users/resident
//
// Manager can create residents only in own society.
// ============================================================

router.post(
  '/resident',
  authorize('manager'),
  userController.createResident
);


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
//
// Manager/Admin:
//   Own society users
//
// Super Admin:
//   All society users
//   Optional ?society_id=...
//
// GET /api/users
// ============================================================

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
// USER BY ID
// ============================================================
//
// Manager/Admin:
//   Own society only
//
// Super Admin:
//   Any society
//
// GET /api/users/:id
// ============================================================

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
