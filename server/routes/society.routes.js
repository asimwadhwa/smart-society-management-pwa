const express = require('express');

const router =
  express.Router();

const societyController =
  require('../controllers/society.controller');

const {
  authenticate,
  authorize
} = require('../middleware/auth.middleware');

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(
  authenticate
);

// ============================================================
// SUPER ADMIN ONLY
// ============================================================

router.use(
  authorize('super_admin')
);

// ============================================================
// CREATE SOCIETY
// POST /api/societies
// ============================================================

router.post(
  '/',
  societyController.createSociety
);

// ============================================================
// GET ALL SOCIETIES
// GET /api/societies
// ============================================================

router.get(
  '/',
  societyController.getAllSocieties
);

// ============================================================
// SOCIETY STATS
// GET /api/societies/:id/stats
// ============================================================

router.get(
  '/:id/stats',
  societyController.getSocietyStats
);

// ============================================================
// GET SOCIETY MANAGER
// GET /api/societies/:id/manager
// ============================================================

router.get(
  '/:id/manager',
  societyController.getSocietyManager
);

// ============================================================
// ASSIGN / CHANGE MANAGER
//
// PUT /api/societies/:id/manager
//
// Existing user:
// { user_id }
//
// New manager:
// { name, email, password, phone, flat_no }
// ============================================================

router.put(
  '/:id/manager',
  societyController.assignOrReplaceManager
);

// ============================================================
// REMOVE MANAGER
//
// DELETE /api/societies/:id/manager
// ============================================================

router.delete(
  '/:id/manager',
  societyController.removeSocietyManager
);

// ============================================================
// ACTIVATE SOCIETY
// PUT /api/societies/:id/activate
// ============================================================

router.put(
  '/:id/activate',
  societyController.activateSociety
);

// ============================================================
// GET SOCIETY BY ID
// GET /api/societies/:id
// ============================================================

router.get(
  '/:id',
  societyController.getSocietyById
);

// ============================================================
// UPDATE SOCIETY
// PUT /api/societies/:id
// ============================================================

router.put(
  '/:id',
  societyController.updateSociety
);

// ============================================================
// DEACTIVATE SOCIETY
// DELETE /api/societies/:id
// ============================================================

router.delete(
  '/:id',
  societyController.deactivateSociety
);

module.exports = router;