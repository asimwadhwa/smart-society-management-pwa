const crypto = require('crypto');
const Maintenance = require('../models/Maintenance');
const PaymentLog = require('../models/PaymentLog');
const razorpay = require('../config/razorpay');

// Import email service (will be created)
let emailService;
try {
  emailService = require('../services/email.service');
} catch (e) {
  console.log('Email service not configured yet');
}

/**
 * @desc    Verify Razorpay payment and update maintenance status
 * @route   POST /api/payment/verify
 * @access  Private
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      maintenance_id
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !maintenance_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields'
      });
    }

    // Find maintenance record
    const maintenance = await Maintenance.findById(maintenance_id);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    // Verify order ID matches
    if (maintenance.razorpay_order_id !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID mismatch'
      });
    }

    // Check if already paid
    if (maintenance.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This maintenance has already been paid'
      });
    }

    // Verify payment signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Payment verification failed.'
      });
    }

    // Payment verified - Update maintenance record
    maintenance.status = 'paid';
    maintenance.razorpay_payment_id = razorpay_payment_id;
    await maintenance.save();

    // Create payment log
    const paymentLog = await PaymentLog.create({
      user_id: maintenance.user_id,
      flat_no: maintenance.flat_no,
      amount: maintenance.total_amount,
      payment_date: new Date(),
      transaction_id: razorpay_payment_id,
      month: maintenance.month,
      year: maintenance.year,
      razorpay_order_id: razorpay_order_id,
      razorpay_signature: razorpay_signature
    });

    // Send confirmation email
    if (emailService && emailService.sendPaymentConfirmation) {
      try {
        await emailService.sendPaymentConfirmation({
          email: req.user.email,
          name: req.user.name,
          flat_no: maintenance.flat_no,
          amount: maintenance.total_amount,
          month: maintenance.month,
          year: maintenance.year,
          transaction_id: razorpay_payment_id,
          payment_date: new Date()
        });
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        maintenance: {
          id: maintenance._id,
          status: maintenance.status,
          amount: maintenance.total_amount,
          month: maintenance.month,
          year: maintenance.year
        },
        payment: {
          id: paymentLog._id,
          transaction_id: razorpay_payment_id,
          payment_date: paymentLog.payment_date
        }
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    next(error);
  }
};

/**
 * @desc    Handle Razorpay webhook events
 * @route   POST /api/payment/webhook
 * @access  Public (verified by signature)
 */
exports.handleWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // If webhook secret is not configured, log and return
    if (!webhookSecret) {
      console.log('Razorpay webhook secret not configured');
      return res.status(200).json({ received: true });
    }

    // Get the signature from headers
    const signature = req.headers['x-razorpay-signature'];
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature'
      });
    }

    // Verify webhook signature
    const body = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    // Process the webhook event
    const event = req.body.event;
    const payload = req.body.payload;

    console.log('Received Razorpay webhook:', event);

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(payload);
        break;
      
      case 'order.paid':
        await handleOrderPaid(payload);
        break;
      
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    // Return 200 to acknowledge receipt (Razorpay will retry otherwise)
    res.status(200).json({ received: true, error: error.message });
  }
};

/**
 * Handle payment.captured webhook event
 */
async function handlePaymentCaptured(payload) {
  try {
    const payment = payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;

    // Find maintenance record by order ID
    const maintenance = await Maintenance.findOne({ razorpay_order_id: orderId });

    if (!maintenance) {
      console.log('Maintenance not found for order:', orderId);
      return;
    }

    // Already processed
    if (maintenance.status === 'paid') {
      console.log('Maintenance already paid:', maintenance._id);
      return;
    }

    // Update maintenance
    maintenance.status = 'paid';
    maintenance.razorpay_payment_id = paymentId;
    await maintenance.save();

    // Check if payment log exists
    const existingLog = await PaymentLog.findOne({ transaction_id: paymentId });
    
    if (!existingLog) {
      // Create payment log
      await PaymentLog.create({
        user_id: maintenance.user_id,
        flat_no: maintenance.flat_no,
        amount: maintenance.total_amount,
        payment_date: new Date(payment.created_at * 1000),
        transaction_id: paymentId,
        month: maintenance.month,
        year: maintenance.year,
        razorpay_order_id: orderId,
        razorpay_signature: 'webhook'
      });
    }

    console.log('Payment captured via webhook:', paymentId);
  } catch (error) {
    console.error('Error handling payment.captured:', error);
  }
}

/**
 * Handle payment.failed webhook event
 */
async function handlePaymentFailed(payload) {
  try {
    const payment = payload.payment.entity;
    const orderId = payment.order_id;

    console.log('Payment failed for order:', orderId, 'Reason:', payment.error_description);
    
    // Optionally log failed payments or notify admin
  } catch (error) {
    console.error('Error handling payment.failed:', error);
  }
}

/**
 * Handle order.paid webhook event
 */
async function handleOrderPaid(payload) {
  try {
    const order = payload.order.entity;
    console.log('Order paid:', order.id);
    
    // This is a backup - payment.captured should handle the actual update
  } catch (error) {
    console.error('Error handling order.paid:', error);
  }
}

/**
 * @desc    Get payment details by ID
 * @route   GET /api/payment/:paymentId
 * @access  Private
 */
exports.getPaymentDetails = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await PaymentLog.findById(paymentId)
      .populate('user_id', 'name email flat_no')
      .lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user owns this payment or is admin/manager
    if (
      payment.user_id._id.toString() !== req.user._id.toString() &&
      !['admin', 'manager'].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    next(error);
  }
};

/**
 * @desc    Fetch Razorpay payment status from Razorpay API
 * @route   GET /api/payment/status/:orderId
 * @access  Private
 */
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Fetch order from Razorpay
    const order = await razorpay.orders.fetch(orderId);

    // Fetch payments for this order
    const payments = await razorpay.orders.fetchPayments(orderId);

    res.status(200).json({
      success: true,
      data: {
        order: {
          id: order.id,
          amount: order.amount / 100,
          status: order.status,
          created_at: new Date(order.created_at * 1000)
        },
        payments: payments.items.map(p => ({
          id: p.id,
          amount: p.amount / 100,
          status: p.status,
          method: p.method,
          created_at: new Date(p.created_at * 1000)
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    next(error);
  }
};
