const express = require('express');

const router = express.Router();

const complaintController = require('../controllers/complaint.controller');

const {
  authenticate,
  authorize
} = require('../middleware/auth.middleware');

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authenticate);

// ============================================================
// COMPLAINTS
// ============================================================

// POST /api/complaints
// All authenticated society users
router.post(
  '/',
  complaintController.createComplaint
);

// GET /api/complaints
// Current user's complaints
router.get(
  '/',
  complaintController.getUserComplaints
);

// GET /api/complaints/all
// Manager/Admin - current society only
router.get(
  '/all',
  authorize('manager', 'admin'),
  complaintController.getAllComplaints
);

// GET /api/complaints/:id
// Current society complaint
router.get(
  '/:id',
  complaintController.getComplaintById
);

// PUT /api/complaints/:id/status
// Manager/Admin - current society only
router.put(
  '/:id/status',
  authorize('manager', 'admin'),
  complaintController.updateComplaintStatus
);

// ============================================================
// IMAGEKIT
// ============================================================

// POST /api/complaints/upload-url
router.post(
  '/upload-url',
  complaintController.getUploadUrl
);

module.exports = router;