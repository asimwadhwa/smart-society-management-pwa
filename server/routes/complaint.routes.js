const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaint.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// POST /api/complaints - Create new complaint
router.post('/', complaintController.createComplaint);

// GET /api/complaints - Get user's complaints
router.get('/', complaintController.getUserComplaints);

// GET /api/complaints/all - Get all complaints (Manager, Admin)
router.get('/all', authorize('manager', 'admin'), complaintController.getAllComplaints);

// GET /api/complaints/:id - Get complaint details
router.get('/:id', complaintController.getComplaintById);

// PUT /api/complaints/:id/status - Update complaint status (Manager, Admin)
router.put('/:id/status', authorize('manager', 'admin'), complaintController.updateComplaintStatus);

// POST /api/complaints/upload-url - Get ImageKit upload URL
router.post('/upload-url', complaintController.getUploadUrl);

module.exports = router;
