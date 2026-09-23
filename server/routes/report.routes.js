const express = require('express');

const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth.middleware');

const {
  getMaintenanceReport,
  getComplaintReport,
  getEmergencyReport,
  getUsersReport,
  getAssetsReport,
} = require('../controllers/report.controller');

/*
|--------------------------------------------------------------------------
| Reports Authentication
|--------------------------------------------------------------------------
| Only Super Admin, Manager and Admin can access reports.
|
| Society-level access is additionally enforced inside
| report.controller.js.
|--------------------------------------------------------------------------
*/

router.use(authenticate);

router.use(
  authorize(
    'super_admin',
    'manager',
    'admin'
  )
);

/*
|--------------------------------------------------------------------------
| Maintenance Report
|--------------------------------------------------------------------------
| GET /api/reports/maintenance
|
| Optional query parameters:
|   society_id
|   month
|   year
|   status
|
| Examples:
|   /api/reports/maintenance
|   /api/reports/maintenance?society_id=SOC_ID
|   /api/reports/maintenance?month=9&year=2026
|   /api/reports/maintenance?status=paid
|--------------------------------------------------------------------------
*/

router.get(
  '/maintenance',
  getMaintenanceReport
);

/*
|--------------------------------------------------------------------------
| Complaint Report
|--------------------------------------------------------------------------
| GET /api/reports/complaints
|
| Optional:
|   society_id
|   status
|
| status:
|   all
|   open
|   in-progress
|   resolved
|--------------------------------------------------------------------------
*/

router.get(
  '/complaints',
  getComplaintReport
);

/*
|--------------------------------------------------------------------------
| Emergency Report
|--------------------------------------------------------------------------
| GET /api/reports/emergency
|
| Optional:
|   society_id
|   status
|
| status:
|   all
|   active
|   resolved
|--------------------------------------------------------------------------
*/

router.get(
  '/emergency',
  getEmergencyReport
);

/*
|--------------------------------------------------------------------------
| Users / Residents Report
|--------------------------------------------------------------------------
| GET /api/reports/users
|
| Optional:
|   society_id
|   role
|   is_active
|
| role:
|   all
|   resident
|   manager
|   admin
|   watchman
|
| is_active:
|   true
|   false
|--------------------------------------------------------------------------
*/

router.get(
  '/users',
  getUsersReport
);

/*
|--------------------------------------------------------------------------
| Assets Report
|--------------------------------------------------------------------------
| GET /api/reports/assets
|
| Optional:
|   society_id
|   type
|   status
|
| type:
|   all
|   lift
|   water_pump
|   generator
|
| status:
|   all
|   working
|   under_maintenance
|   not_working
|--------------------------------------------------------------------------
*/

router.get(
  '/assets',
  getAssetsReport
);

module.exports = router;