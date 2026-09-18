const express = require('express');

const router = express.Router();

const maintenanceController = require('../controllers/maintenance.controller');

const {
  authenticate,
  authorize
} = require('../middleware/auth.middleware');

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authenticate);

// ============================================================
// USER MAINTENANCE
// ============================================================

// GET /api/maintenance
router.get(
  '/',
  maintenanceController.getUserMaintenance
);

// GET /api/maintenance/current
router.get(
  '/current',
  maintenanceController.getCurrentMonthStatus
);

// GET /api/maintenance/history
router.get(
  '/history',
  maintenanceController.getPaymentHistory
);

// ============================================================
// MANAGER / ADMIN
// ============================================================

// GET /api/maintenance/all
router.get(
  '/all',
  authorize('manager', 'admin'),
  maintenanceController.getAllMaintenance
);

// GET /api/maintenance/stats
router.get(
  '/stats',
  authorize('manager', 'admin'),
  maintenanceController.getPaymentStats
);

// ============================================================
// RAZORPAY
// ============================================================

// POST /api/maintenance/create-order
router.post(
  '/create-order',
  maintenanceController.createOrder
);

// ============================================================
// MAINTENANCE GENERATION
// ============================================================

// POST /api/maintenance/generate
// Manager only
router.post(
  '/generate',
  authorize('manager'),
  maintenanceController.generateMonthlyMaintenance
);

// ============================================================
// MANUAL CRON TRIGGERS
// ============================================================

// POST /api/maintenance/cron/generate
router.post(
  '/cron/generate',
  authorize('manager'),
  maintenanceController.triggerMaintenanceGeneration
);

// POST /api/maintenance/cron/late-fees
router.post(
  '/cron/late-fees',
  authorize('manager'),
  maintenanceController.triggerLateFeeApplication
);

// POST /api/maintenance/cron/reminders
router.post(
  '/cron/reminders',
  authorize('manager'),
  maintenanceController.triggerPaymentReminders
);

module.exports = router;