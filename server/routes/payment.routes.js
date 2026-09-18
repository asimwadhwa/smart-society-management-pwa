const express = require('express');

const router = express.Router();

const paymentController = require('../controllers/payment.controller');

const {
  authenticate
} = require('../middleware/auth.middleware');

// ============================================================
// RAZORPAY WEBHOOK
// No JWT authentication
// Signature verification is handled by controller
// ============================================================

router.post(
  '/webhook',
  paymentController.handleWebhook
);

// ============================================================
// PROTECTED PAYMENT ROUTES
// ============================================================

router.use(authenticate);

// ============================================================
// VERIFY PAYMENT
// ============================================================

// POST /api/payment/verify
router.post(
  '/verify',
  paymentController.verifyPayment
);

// ============================================================
// PAYMENT DETAILS
// ============================================================

// GET /api/payment/:paymentId
router.get(
  '/:paymentId',
  paymentController.getPaymentDetails
);

// ============================================================
// PAYMENT STATUS
// ============================================================

// GET /api/payment/status/:orderId
router.get(
  '/status/:orderId',
  paymentController.getPaymentStatus
);

module.exports = router;