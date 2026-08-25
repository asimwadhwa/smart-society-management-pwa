const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// POST /api/payment/webhook - Razorpay webhook handler (no auth - verified by signature)
router.post('/webhook', paymentController.handleWebhook);

// Protected routes
router.use(authenticate);

// POST /api/payment/verify - Verify Razorpay payment after frontend callback
router.post('/verify', paymentController.verifyPayment);

// GET /api/payment/:paymentId - Get payment details
router.get('/:paymentId', paymentController.getPaymentDetails);

// GET /api/payment/status/:orderId - Get payment status from Razorpay
router.get('/status/:orderId', paymentController.getPaymentStatus);

module.exports = router;
