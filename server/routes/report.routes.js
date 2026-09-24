const express = require('express');

const router = express.Router();

const {
  authenticate,
  authorize
} = require('../middleware/auth.middleware');

const reportController =
  require('../controllers/report.controller');


// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authenticate);


// ============================================================
// MAINTENANCE REPORT
// ============================================================

router.get(
  '/maintenance',
  authorize(
    'super_admin',
    'manager',
    'admin'
  ),
  reportController.getMaintenanceReport
);


// ============================================================
// COMPLAINT REPORT
// ============================================================

router.get(
  '/complaints',
  authorize(
    'super_admin',
    'manager',
    'admin'
  ),
  reportController.getComplaintReport
);


// ============================================================
// EMERGENCY REPORT
// ============================================================

router.get(
  '/emergency',
  authorize(
    'super_admin',
    'manager',
    'admin'
  ),
  reportController.getEmergencyReport
);


// ============================================================
// USERS / RESIDENTS REPORT
// ============================================================

router.get(
  '/users',
  authorize(
    'super_admin',
    'manager',
    'admin'
  ),
  reportController.getUsersReport
);


// ============================================================
// ASSETS REPORT
// ============================================================

router.get(
  '/assets',
  authorize(
    'super_admin',
    'manager',
    'admin'
  ),
  reportController.getAssetsReport
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;