const express = require('express');

const router = express.Router();

const complaintController =
  require('../controllers/complaint.controller');

const {
  authenticate,
  authorize
} = require('../middleware/auth.middleware');


// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authenticate);


// ============================================================
// CREATE COMPLAINT
// ============================================================

router.post(
  '/',
  complaintController.createComplaint
);


// ============================================================
// CURRENT USER COMPLAINTS
// ============================================================

router.get(
  '/',
  complaintController.getUserComplaints
);


// ============================================================
// ALL COMPLAINTS
// Super Admin = all societies
// Manager/Admin = own society
// ============================================================

router.get(
  '/all',
  authorize(
    'super_admin',
    'manager',
    'admin'
  ),
  complaintController.getAllComplaints
);


// ============================================================
// SINGLE COMPLAINT
// ============================================================

router.get(
  '/:id',
  complaintController.getComplaintById
);


// ============================================================
// UPDATE COMPLAINT STATUS
// Super Admin = all societies
// Manager/Admin = own society
// ============================================================

router.put(
  '/:id/status',
  authorize(
    'super_admin',
    'manager',
    'admin'
  ),
  complaintController.updateComplaintStatus
);


// ============================================================
// IMAGEKIT
// ============================================================

router.post(
  '/upload-url',
  complaintController.getUploadUrl
);


module.exports = router;