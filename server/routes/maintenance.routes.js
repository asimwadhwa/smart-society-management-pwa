const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// GET /api/maintenance - Get current user's maintenance
router.get('/', maintenanceController.getUserMaintenance);

// GET /api/maintenance/current - Get current month's status
router.get('/current', maintenanceController.getCurrentMonthStatus);

// GET /api/maintenance/history - Get payment history
router.get('/history', maintenanceController.getPaymentHistory);

// GET /api/maintenance/all - Get all flats' maintenance (Manager, Admin)
router.get('/all', authorize('manager', 'admin'), maintenanceController.getAllMaintenance);

// GET /api/maintenance/stats - Get payment statistics (Manager, Admin)
router.get('/stats', authorize('manager', 'admin'), maintenanceController.getPaymentStats);

// POST /api/maintenance/create-order - Create Razorpay order
router.post('/create-order', maintenanceController.createOrder);

// POST /api/maintenance/generate - Generate maintenance for all users (Manager only)
router.post('/generate', authorize('manager'), maintenanceController.generateMonthlyMaintenance);

// ========== CRON JOB MANUAL TRIGGERS (Manager only) ==========

// POST /api/maintenance/cron/generate - Manually trigger monthly maintenance generation
router.post('/cron/generate', authorize('manager'), maintenanceController.triggerMaintenanceGeneration);

// POST /api/maintenance/cron/late-fees - Manually trigger late fee application
router.post('/cron/late-fees', authorize('manager'), maintenanceController.triggerLateFeeApplication);

// POST /api/maintenance/cron/reminders - Manually send payment reminders
router.post('/cron/reminders', authorize('manager'), maintenanceController.triggerPaymentReminders);

module.exports = router;
