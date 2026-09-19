const crypto = require('crypto');

const mongoose = require('mongoose');

const Maintenance = require('../models/Maintenance');
const PaymentLog = require('../models/PaymentLog');
const razorpay = require('../config/razorpay');


// ============================================================
// EMAIL SERVICE
// ============================================================

let emailService;

try {
  emailService = require('../services/email.service');
} catch (e) {
  console.log(
    'Email service not configured yet'
  );
}


// ============================================================
// HELPERS
// ============================================================

const getSocietyId = (req) => {
  return req.user?.society_id || null;
};


const isSuperAdmin = (req) => {
  return req.user?.role === 'super_admin';
};


const isAdminOrManager = (req) => {
  return [
    'admin',
    'manager'
  ].includes(req.user?.role);
};


const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};


// ============================================================
// VERIFY PAYMENT
// ============================================================

exports.verifyPayment = async (
  req,
  res,
  next
) => {
  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      maintenance_id
    } = req.body;


    const societyId =
      getSocietyId(req);


    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }


    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !maintenance_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Missing required payment verification fields'
      });
    }


    const maintenance =
      await Maintenance.findOne({
        _id: maintenance_id,
        society_id: societyId
      });


    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message:
          'Maintenance record not found in your society'
      });
    }


    if (
      maintenance.user_id.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You are not authorized to pay this maintenance'
      });
    }


    if (
      maintenance.razorpay_order_id !==
      razorpay_order_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Order ID mismatch'
      });
    }


    if (
      maintenance.status === 'paid'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'This maintenance has already been paid'
      });
    }


    const body =
      razorpay_order_id +
      '|' +
      razorpay_payment_id;


    const expectedSignature =
      crypto
        .createHmac(
          'sha256',
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(body)
        .digest('hex');


    if (
      expectedSignature !==
      razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid payment signature. Payment verification failed.'
      });
    }


    maintenance.status = 'paid';

    maintenance.razorpay_payment_id =
      razorpay_payment_id;


    await maintenance.save();


    let paymentLog =
      await PaymentLog.findOne({
        transaction_id:
          razorpay_payment_id
      });


    if (!paymentLog) {

      paymentLog =
        await PaymentLog.create({

          society_id:
            societyId,

          maintenance_id:
            maintenance._id,

          user_id:
            maintenance.user_id,

          flat_no:
            maintenance.flat_no,

          amount:
            maintenance.total_amount,

          payment_date:
            new Date(),

          transaction_id:
            razorpay_payment_id,

          month:
            maintenance.month,

          year:
            maintenance.year,

          razorpay_order_id:
            razorpay_order_id,

          razorpay_signature:
            razorpay_signature
        });
    }


    if (
      emailService &&
      emailService.sendPaymentConfirmation
    ) {

      try {

        await emailService.sendPaymentConfirmation({

          email:
            req.user.email,

          name:
            req.user.name,

          flat_no:
            maintenance.flat_no,

          amount:
            maintenance.total_amount,

          month:
            maintenance.month,

          year:
            maintenance.year,

          transaction_id:
            razorpay_payment_id,

          payment_date:
            new Date()

        });

      } catch (emailError) {

        console.error(
          'Failed to send payment confirmation email:',
          emailError
        );

      }
    }


    return res.status(200).json({

      success: true,

      message:
        'Payment verified successfully',

      data: {

        maintenance: {

          id:
            maintenance._id,

          status:
            maintenance.status,

          amount:
            maintenance.total_amount,

          month:
            maintenance.month,

          year:
            maintenance.year

        },

        payment: {

          id:
            paymentLog._id,

          transaction_id:
            razorpay_payment_id,

          payment_date:
            paymentLog.payment_date

        }

      }

    });

  } catch (error) {

    console.error(
      'Error verifying payment:',
      error
    );

    next(error);
  }
};


// ============================================================
// GET ALL PAYMENTS
// Super Admin = ALL SOCIETIES
// Manager/Admin = OWN SOCIETY
// ============================================================

exports.getAllPayments = async (
  req,
  res,
  next
) => {

  try {

    const {
      page = 1,
      limit = 20,
      status,
      society_id,
      search,
      sortBy = 'payment_date',
      order = 'desc'
    } = req.query;


    const pageNumber =
      Math.max(
        parseInt(page) || 1,
        1
      );


    const limitNumber =
      Math.min(
        Math.max(
          parseInt(limit) || 20,
          1
        ),
        100
      );


    const query = {};


    // ========================================================
    // SOCIETY SCOPE
    // ========================================================

    if (isSuperAdmin(req)) {

      if (society_id) {

        if (
          !isValidObjectId(
            society_id
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid society ID'
          });
        }

        query.society_id =
          society_id;
      }

    } else {

      const currentSociety =
        getSocietyId(req);

      if (!currentSociety) {
        return res.status(400).json({
          success: false,
          message:
            'User is not assigned to any society'
        });
      }

      query.society_id =
        currentSociety;
    }


    // ========================================================
    // STATUS FILTER
    // ========================================================

    if (status) {
      query.status = status;
    }


    // ========================================================
    // SEARCH
    // ========================================================

    if (search) {

      const regex =
        new RegExp(
          search,
          'i'
        );

      query.$or = [
        {
          transaction_id:
            regex
        },
        {
          razorpay_order_id:
            regex
        },
        {
          flat_no:
            regex
        }
      ];
    }


    const total =
      await PaymentLog.countDocuments(
        query
      );


    const sortOrder =
      order === 'asc'
        ? 1
        : -1;


    const allowedSortFields = [
      'payment_date',
      'amount',
      'created_at',
      'month',
      'year'
    ];


    const safeSortBy =
      allowedSortFields.includes(
        sortBy
      )
        ? sortBy
        : 'payment_date';


    const sort = {
      [safeSortBy]:
        sortOrder
    };


    const payments =
      await PaymentLog.find(query)
        .populate(
          'user_id',
          'name email phone flat_no role'
        )
        .populate(
          'society_id',
          'name society_code city state'
        )
        .populate(
          'maintenance_id',
          'month year amount total_amount status'
        )
        .sort(sort)
        .skip(
          (pageNumber - 1) *
            limitNumber
        )
        .limit(limitNumber)
        .lean();


    return res.status(200).json({

      success: true,

      data: payments,

      pagination: {

        current:
          pageNumber,

        pages:
          Math.ceil(
            total /
              limitNumber
          ),

        total,

        limit:
          limitNumber

      }

    });

  } catch (error) {

    console.error(
      'Error fetching all payments:',
      error
    );

    next(error);
  }
};


// ============================================================
// PAYMENT STATS
// Super Admin = ALL SOCIETIES
// Manager/Admin = OWN SOCIETY
// ============================================================

exports.getPaymentStats = async (
  req,
  res,
  next
) => {

  try {

    const {
      society_id
    } = req.query;


    const match = {};


    // ========================================================
    // SOCIETY SCOPE
    // ========================================================

    if (isSuperAdmin(req)) {

      if (society_id) {

        if (
          !isValidObjectId(
            society_id
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid society ID'
          });
        }

        match.society_id =
          new mongoose.Types.ObjectId(
            society_id
          );
      }

    } else {

      const currentSociety =
        getSocietyId(req);

      if (!currentSociety) {
        return res.status(400).json({
          success: false,
          message:
            'User is not assigned to any society'
        });
      }

      match.society_id =
        new mongoose.Types.ObjectId(
          currentSociety.toString()
        );
    }


    const result =
      await PaymentLog.aggregate([

        {
          $match:
            match
        },

        {
          $group: {

            _id: null,

            totalPayments: {
              $sum: 1
            },

            totalAmount: {
              $sum: {
                $ifNull: [
                  '$amount',
                  0
                ]
              }
            }

          }
        }

      ]);


    const stats =
      result[0] || {
        totalPayments: 0,
        totalAmount: 0
      };


    return res.status(200).json({

      success: true,

      data: {

        totalPayments:
          stats.totalPayments,

        totalAmount:
          stats.totalAmount

      }

    });

  } catch (error) {

    console.error(
      'Error fetching payment stats:',
      error
    );

    next(error);
  }
};


// ============================================================
// GET PAYMENT DETAILS
// ============================================================

exports.getPaymentDetails = async (
  req,
  res,
  next
) => {

  try {

    const {
      paymentId
    } = req.params;


    if (
      !isValidObjectId(
        paymentId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid payment ID'
      });
    }


    const query = {
      _id: paymentId
    };


    // Super Admin can access
    // payments from any society.
    if (
      !isSuperAdmin(req)
    ) {

      const societyId =
        getSocietyId(req);

      if (!societyId) {
        return res.status(400).json({
          success: false,
          message:
            'User is not assigned to any society'
        });
      }

      query.society_id =
        societyId;
    }


    const payment =
      await PaymentLog.findOne(
        query
      )
        .populate(
          'user_id',
          'name email flat_no phone role'
        )
        .populate(
          'society_id',
          'name society_code city state'
        )
        .lean();


    if (!payment) {
      return res.status(404).json({
        success: false,
        message:
          'Payment not found'
      });
    }


    const isOwner =
      payment.user_id &&
      payment.user_id._id.toString() ===
        req.user._id.toString();


    if (
      !isSuperAdmin(req) &&
      !isAdminOrManager(req) &&
      !isOwner
    ) {

      return res.status(403).json({
        success: false,
        message:
          'Not authorized to view this payment'
      });
    }


    return res.status(200).json({

      success: true,

      data:
        payment

    });

  } catch (error) {

    console.error(
      'Error fetching payment details:',
      error
    );

    next(error);
  }
};


// ============================================================
// PAYMENT STATUS
// ============================================================

exports.getPaymentStatus = async (
  req,
  res,
  next
) => {

  try {

    const {
      orderId
    } = req.params;


    const query = {
      razorpay_order_id:
        orderId
    };


    if (
      !isSuperAdmin(req)
    ) {

      const societyId =
        getSocietyId(req);

      if (!societyId) {
        return res.status(400).json({
          success: false,
          message:
            'User is not assigned to any society'
        });
      }

      query.society_id =
        societyId;
    }


    const maintenance =
      await Maintenance.findOne(
        query
      );


    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message:
          'Payment order not found'
      });
    }


    const isOwner =
      maintenance.user_id.toString() ===
      req.user._id.toString();


    if (
      !isSuperAdmin(req) &&
      !isAdminOrManager(req) &&
      !isOwner
    ) {

      return res.status(403).json({
        success: false,
        message:
          'Not authorized to view this payment status'
      });
    }


    const order =
      await razorpay.orders.fetch(
        orderId
      );


    const payments =
      await razorpay.orders.fetchPayments(
        orderId
      );


    return res.status(200).json({

      success: true,

      data: {

        order: {

          id:
            order.id,

          amount:
            order.amount / 100,

          status:
            order.status,

          created_at:
            new Date(
              order.created_at *
              1000
            )

        },

        payments:
          payments.items.map(
            (p) => ({

              id:
                p.id,

              amount:
                p.amount / 100,

              status:
                p.status,

              method:
                p.method,

              created_at:
                new Date(
                  p.created_at *
                  1000
                )

            })
          )

      }

    });

  } catch (error) {

    console.error(
      'Error fetching payment status:',
      error
    );

    next(error);
  }
};


// ============================================================
// RAZORPAY WEBHOOK
// ============================================================

exports.handleWebhook = async (
  req,
  res,
  next
) => {

  try {

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;


    if (!webhookSecret) {

      console.log(
        'Razorpay webhook secret not configured'
      );

      return res.status(200).json({
        received: true
      });
    }


    const signature =
      req.headers[
        'x-razorpay-signature'
      ];


    if (!signature) {

      return res.status(400).json({
        success: false,
        message:
          'Missing webhook signature'
      });
    }


    const body =
      JSON.stringify(
        req.body
      );


    const expectedSignature =
      crypto
        .createHmac(
          'sha256',
          webhookSecret
        )
        .update(body)
        .digest('hex');


    if (
      signature !==
      expectedSignature
    ) {

      return res.status(400).json({
        success: false,
        message:
          'Invalid webhook signature'
      });
    }


    const event =
      req.body.event;


    const payload =
      req.body.payload;


    console.log(
      'Received Razorpay webhook:',
      event
    );


    switch (event) {

      case 'payment.captured':

        await handlePaymentCaptured(
          payload
        );

        break;


      case 'payment.failed':

        await handlePaymentFailed(
          payload
        );

        break;


      case 'order.paid':

        await handleOrderPaid(
          payload
        );

        break;


      default:

        console.log(
          'Unhandled webhook event:',
          event
        );

    }


    return res.status(200).json({
      received: true
    });

  } catch (error) {

    console.error(
      'Error handling payment webhook:',
      error
    );

    return res.status(200).json({
      received: true,
      error:
        error.message
    });
  }
};


// ============================================================
// PAYMENT CAPTURED
// ============================================================

async function handlePaymentCaptured(
  payload
) {

  try {

    const payment =
      payload.payment.entity;


    const orderId =
      payment.order_id;


    const paymentId =
      payment.id;


    const maintenance =
      await Maintenance.findOne({
        razorpay_order_id:
          orderId
      });


    if (!maintenance) {

      console.log(
        'Maintenance not found for order:',
        orderId
      );

      return;
    }


    if (!maintenance.society_id) {

      console.log(
        'Maintenance has no society:',
        maintenance._id
      );

      return;
    }


    if (
      maintenance.status ===
      'paid'
    ) {

      console.log(
        'Maintenance already paid:',
        maintenance._id
      );

      return;
    }


    maintenance.status =
      'paid';


    maintenance.razorpay_payment_id =
      paymentId;


    await maintenance.save();


    const existingLog =
      await PaymentLog.findOne({
        transaction_id:
          paymentId
      });


    if (!existingLog) {

      await PaymentLog.create({

        society_id:
          maintenance.society_id,

        maintenance_id:
          maintenance._id,

        user_id:
          maintenance.user_id,

        flat_no:
          maintenance.flat_no,

        amount:
          maintenance.total_amount,

        payment_date:
          new Date(
            payment.created_at *
            1000
          ),

        transaction_id:
          paymentId,

        month:
          maintenance.month,

        year:
          maintenance.year,

        razorpay_order_id:
          orderId,

        razorpay_signature:
          'webhook'

      });

    }


    console.log(
      'Payment captured via webhook:',
      paymentId
    );

  } catch (error) {

    console.error(
      'Error handling payment.captured:',
      error
    );

  }
}


// ============================================================
// PAYMENT FAILED
// ============================================================

async function handlePaymentFailed(
  payload
) {

  try {

    const payment =
      payload.payment.entity;


    console.log(
      'Payment failed for order:',
      payment.order_id,
      'Reason:',
      payment.error_description
    );

  } catch (error) {

    console.error(
      'Error handling payment.failed:',
      error
    );

  }
}


// ============================================================
// ORDER PAID
// ============================================================

async function handleOrderPaid(
  payload
) {

  try {

    const order =
      payload.order.entity;


    console.log(
      'Order paid:',
      order.id
    );

  } catch (error) {

    console.error(
      'Error handling order.paid:',
      error
    );

  }
}