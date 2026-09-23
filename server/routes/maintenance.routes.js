    const express = require('express');

    const router = express.Router();

    const maintenanceController =
    require('../controllers/maintenance.controller');

    const {
    authenticate,
    authorize
    } = require('../middleware/auth.middleware');


    // ============================================================
    // AUTHENTICATION
    // ============================================================

    router.use(authenticate);


    // ============================================================
    // RESIDENT / ADMIN USER MAINTENANCE
    // ============================================================

    // Get logged-in user's maintenance
    router.get(
    '/',
    maintenanceController.getUserMaintenance
    );


    // Current month maintenance
    router.get(
    '/current',
    maintenanceController.getCurrentMonthStatus
    );


    // Payment history
    router.get(
    '/history',
    maintenanceController.getPaymentHistory
    );


    // ============================================================
    // MANAGER / ADMIN MAINTENANCE MANAGEMENT
    // ============================================================

    // Get maintenance settings
    router.get(
    '/settings',
    authorize('manager', 'admin'),
    maintenanceController.getMaintenanceSettings
    );


    // Update maintenance settings
    router.put(
    '/settings',
    authorize('manager', 'admin'),
    maintenanceController.updateMaintenanceSettings
    );


    // ============================================================
    // MANAGER / ADMIN + SUPER ADMIN
    // ============================================================

    // Get all maintenance records
    router.get(
    '/all',
    authorize(
        'super_admin',
        'manager',
        'admin'
    ),
    maintenanceController.getAllMaintenance
    );


    // Get maintenance statistics
    router.get(
    '/stats',
    authorize(
        'super_admin',
        'manager',
        'admin'
    ),
    maintenanceController.getPaymentStats
    );


    // ============================================================
    // RESIDENT / ADMIN PAYMENT
    // ============================================================

    // Create Razorpay order
    router.post(
    '/create-order',
    maintenanceController.createOrder
    );


    // ============================================================
    // MANAGER / ADMIN
    // ============================================================

    // Generate monthly maintenance
    router.post(
    '/generate',
    authorize('manager', 'admin'),
    maintenanceController.generateMonthlyMaintenance
    );


    // Edit unpaid maintenance
    router.put(
    '/:id',
    authorize('manager', 'admin'),
    maintenanceController.updateMaintenance
    );


    // ============================================================
    // MANUAL JOB CONTROLS
    // ============================================================

    // Generate maintenance manually
    router.post(
    '/cron/generate',
    authorize('manager', 'admin'),
    maintenanceController.triggerMaintenanceGeneration
    );


    // Apply late fees manually
    router.post(
    '/cron/late-fees',
    authorize('manager', 'admin'),
    maintenanceController.triggerLateFeeApplication
    );


    // Send payment reminders manually
    router.post(
    '/cron/reminders',
    authorize('manager', 'admin'),
    maintenanceController.triggerPaymentReminders
    );


    module.exports = router;