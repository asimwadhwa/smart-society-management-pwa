const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergency.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// POST /api/emergency/trigger - Trigger lift emergency
router.post('/trigger', emergencyController.triggerEmergency);

// GET /api/emergency/active - Get active emergencies
router.get('/active', emergencyController.getActiveEmergencies);

// PUT /api/emergency/:id/resolve - Mark emergency resolved (Manager, Admin)
router.put('/:id/resolve', authorize('manager', 'admin'), emergencyController.resolveEmergency);

// GET /api/emergency/history - Get emergency history (Manager, Admin)
router.get('/history', authorize('manager', 'admin'), emergencyController.getEmergencyHistory);

module.exports = router;
