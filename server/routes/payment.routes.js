const express = require('express');

const router = express.Router();

const paymentController = require('../controllers/payment.controller');

const {
  authenticate,
  authorize
} = require('../middleware/auth.middleware');


// ============================================================
// RAZORPAY WEBHOOK
// Public route
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
// ALL PAYMENTS
// Super Admin = all societies
// Manager/Admin = own society
// ============================================================

router.get(
  '/all',
  authorize('super_admin', 'manager', 'admin'),
  paymentController.getAllPayments
);


// ============================================================
// PAYMENT STATS
// Super Admin = all societies
// Manager/Admin = own society
// ============================================================

router.get(
  '/stats',
  authorize('super_admin', 'manager', 'admin'),
  paymentController.getPaymentStats
);


// ============================================================
// VERIFY PAYMENT
// ============================================================

router.post(
  '/verify',
  paymentController.verifyPayment
);


// ============================================================
// PAYMENT STATUS
// IMPORTANT: Must come before /:paymentId
// ============================================================

router.get(
  '/status/:orderId',
  paymentController.getPaymentStatus
);


// ============================================================
// PAYMENT DETAILS
// ============================================================

router.get(
  '/:paymentId',
  paymentController.getPaymentDetails
);


module.exports = router;