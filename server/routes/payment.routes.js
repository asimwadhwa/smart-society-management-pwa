const express = require('express');

const router = express.Router();

const paymentController =
  require('../controllers/payment.controller');

const {
  authenticate
} = require('../middleware/auth.middleware');


// ============================================================
// RAZORPAY WEBHOOK
// ============================================================

router.post(
  '/webhook',
  paymentController.handleWebhook
);


// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authenticate);


// ============================================================
// PAYMENT STATUS
// IMPORTANT:
// Keep /status/:orderId BEFORE /:paymentId
// ============================================================

router.get(
  '/status/:orderId',
  paymentController.getPaymentStatus
);


// ============================================================
// VERIFY PAYMENT
// ============================================================

router.post(
  '/verify',
  paymentController.verifyPayment
);


// ============================================================
// PAYMENT DETAILS
// ============================================================

router.get(
  '/:paymentId',
  paymentController.getPaymentDetails
);


module.exports = router;