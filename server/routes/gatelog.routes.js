const express = require('express');
const router = express.Router();
const gatelogController = require('../controllers/gatelog.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// POST /api/gatelog - Create gate log entry (Watchman only)
router.post('/', authorize('watchman'), gatelogController.createEntry);

// GET /api/gatelog/today - Get today's entries (Watchman, Manager, Admin)
router.get('/today', authorize('watchman', 'manager', 'admin'), gatelogController.getTodayEntries);

// PUT /api/gatelog/:id/out - Mark visitor out time (Watchman only)
router.put('/:id/out', authorize('watchman'), gatelogController.markOutTime);

// GET /api/gatelog/history - Get gate log history (Manager, Admin)
router.get('/history', authorize('manager', 'admin'), gatelogController.getHistory);

module.exports = router;
