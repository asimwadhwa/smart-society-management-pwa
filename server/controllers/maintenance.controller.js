const Maintenance = require('../models/Maintenance');
const PaymentLog = require('../models/PaymentLog');
const User = require('../models/User');
const razorpay = require('../config/razorpay');

/**
 * Helper
 */
const getSocietyId = (req) => {
  return req.user?.society_id || null;
};


/**
 * @desc    Get current user's maintenance records
 * @route   GET /api/maintenance
 * @access  Private
 */
exports.getUserMaintenance = async (req, res, next) => {
  try {
    const { status, year } = req.query;

    const societyId = getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }

    const filter = {
      society_id: societyId,
      user_id: req.user._id
    };

    if (
      status &&
      ['pending', 'paid', 'overdue'].includes(status)
    ) {
      filter.status = status;
    }

    if (year) {
      filter.year = parseInt(year);
    }

    const maintenance = await Maintenance.find(filter)
      .sort({
        year: -1,
        month: -1
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: maintenance.length,
      data: maintenance
    });
  } catch (error) {
    console.error(
      'Error fetching user maintenance:',
      error
    );

    next(error);
  }
};


/**
 * @desc    Get current month's maintenance status
 * @route   GET /api/maintenance/current
 * @access  Private
 */
exports.getCurrentMonthStatus = async (req, res, next) => {
  try {
    const societyId = getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }

    const now = new Date();

    const currentMonth =
      now.getMonth() + 1;

    const currentYear =
      now.getFullYear();

    let maintenance =
      await Maintenance.findOne({
        society_id: societyId,
        user_id: req.user._id,
        month: currentMonth,
        year: currentYear
      }).lean();

    if (!maintenance) {

      const dueDate = new Date(
        currentYear,
        currentMonth - 1,
        18
      );

      maintenance =
        await Maintenance.create({
          society_id: societyId,
          user_id: req.user._id,
          flat_no: req.user.flat_no,
          month: currentMonth,
          year: currentYear,
          amount: 1000,
          late_fee: 0,
          due_date: dueDate,
          status: 'pending'
        });

      maintenance =
        maintenance.toObject();
    }

    return res.status(200).json({
      success: true,
      data: maintenance
    });
  } catch (error) {
    console.error(
      'Error fetching current month status:',
      error
    );

    next(error);
  }
};


/**
 * @desc    Get payment history
 * @route   GET /api/maintenance/history
 * @access  Private
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10
    } = req.query;

    const societyId = getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }

    const pageNumber =
      Math.max(parseInt(page) || 1, 1);

    const limitNumber =
      Math.min(
        Math.max(parseInt(limit) || 10, 1),
        100
      );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    // PaymentLog must also be linked to the same
    // user's maintenance/payment records.
    const userMaintenanceIds =
      await Maintenance.find({
        society_id: societyId,
        user_id: req.user._id
      }).distinct('_id');

    const paymentFilter = {
      user_id: req.user._id,
      maintenance_id: {
        $in: userMaintenanceIds
      }
    };

    const [
      payments,
      total
    ] = await Promise.all([
      PaymentLog.find(paymentFilter)
        .sort({
          payment_date: -1
        })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      PaymentLog.countDocuments(
        paymentFilter
      )
    ]);

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        current: pageNumber,
        pages: Math.ceil(
          total / limitNumber
        ),
        total,
        limit: limitNumber
      }
    });
  } catch (error) {
    console.error(
      'Error fetching payment history:',
      error
    );

    next(error);
  }
};


/**
 * @desc    Get all flats' maintenance records
 * @route   GET /api/maintenance/all
 * @access  Private (Manager, Admin)
 */
exports.getAllMaintenance = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      month,
      year,
      flat_no,
      sort = '-createdAt'
    } = req.query;

    const societyId = getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }

    const pageNumber =
      Math.max(parseInt(page) || 1, 1);

    const limitNumber =
      Math.min(
        Math.max(parseInt(limit) || 20, 1),
        100
      );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    // IMPORTANT:
    // Always filter by current society.
    const filter = {
      society_id: societyId
    };

    if (
      status &&
      ['pending', 'paid', 'overdue'].includes(status)
    ) {
      filter.status = status;
    }

    if (month) {
      filter.month = parseInt(month);
    }

    if (year) {
      filter.year = parseInt(year);
    }

    if (flat_no) {
      filter.flat_no = flat_no;
    }

    const sortObj = {};

    if (sort.startsWith('-')) {
      sortObj[
        sort.substring(1)
      ] = -1;
    } else {
      sortObj[sort] = 1;
    }

    const [
      maintenance,
      total
    ] = await Promise.all([
      Maintenance.find(filter)
        .populate(
          'user_id',
          'name email phone flat_no role'
        )
        .sort(sortObj)
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Maintenance.countDocuments(
        filter
      )
    ]);

    return res.status(200).json({
      success: true,
      data: maintenance,
      pagination: {
        current: pageNumber,
        pages: Math.ceil(
          total / limitNumber
        ),
        total,
        limit: limitNumber
      }
    });
  } catch (error) {
    console.error(
      'Error fetching all maintenance:',
      error
    );

    next(error);
  }
};


/**
 * @desc    Get payment statistics
 * @route   GET /api/maintenance/stats
 * @access  Private (Manager, Admin)
 */
exports.getPaymentStats = async (req, res, next) => {
  try {
    const {
      month,
      year
    } = req.query;

    const societyId = getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }

    const now = new Date();

    const targetMonth =
      month
        ? parseInt(month)
        : now.getMonth() + 1;

    const targetYear =
      year
        ? parseInt(year)
        : now.getFullYear();

    const filter = {
      society_id: societyId,
      month: targetMonth,
      year: targetYear
    };

    const [
      stats,
      totals
    ] = await Promise.all([

      Maintenance.aggregate([
        {
          $match: filter
        },

        {
          $group: {
            _id: '$status',
            count: {
              $sum: 1
            },
            totalAmount: {
              $sum: '$total_amount'
            }
          }
        }
      ]),

      Maintenance.aggregate([
        {
          $match: filter
        },

        {
          $group: {
            _id: null,

            totalFlats: {
              $sum: 1
            },

            totalExpected: {
              $sum: '$amount'
            },

            totalCollected: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      '$status',
                      'paid'
                    ]
                  },
                  '$total_amount',
                  0
                ]
              }
            },

            totalPending: {
              $sum: {
                $cond: [
                  {
                    $ne: [
                      '$status',
                      'paid'
                    ]
                  },
                  '$total_amount',
                  0
                ]
              }
            }
          }
        }
      ])
    ]);

    const statsByStatus = {
      paid: {
        count: 0,
        totalAmount: 0
      },

      pending: {
        count: 0,
        totalAmount: 0
      },

      overdue: {
        count: 0,
        totalAmount: 0
      }
    };

    stats.forEach((stat) => {

      if (
        statsByStatus[stat._id]
      ) {
        statsByStatus[
          stat._id
        ] = {
          count: stat.count,
          totalAmount:
            stat.totalAmount
        };
      }
    });

    return res.status(200).json({
      success: true,

      data: {
        society_id: societyId,
        month: targetMonth,
        year: targetYear,

        byStatus:
          statsByStatus,

        totals:
          totals[0] || {
            totalFlats: 0,
            totalExpected: 0,
            totalCollected: 0,
            totalPending: 0
          }
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


/**
 * @desc    Create Razorpay order
 * @route   POST /api/maintenance/create-order
 * @access  Private
 */
exports.createOrder = async (req, res, next) => {
  try {
    const {
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

    if (!maintenance_id) {
      return res.status(400).json({
        success: false,
        message:
          'Maintenance ID is required'
      });
    }

    // IMPORTANT:
    // Find maintenance only inside user's society.
    const maintenance =
      await Maintenance.findOne({
        _id: maintenance_id,
        society_id: societyId
      });

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message:
          'Maintenance record not found'
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

    const options = {
      amount:
        maintenance.total_amount * 100,

      currency: 'INR',

      receipt:
        `maint_${maintenance._id}`,

      notes: {
        maintenance_id:
          maintenance._id.toString(),

        society_id:
          societyId.toString(),

        flat_no:
          maintenance.flat_no,

        month:
          maintenance.month,

        year:
          maintenance.year,

        user_id:
          req.user._id.toString()
      }
    };

    const order =
      await razorpay.orders.create(
        options
      );

    maintenance.razorpay_order_id =
      order.id;

    await maintenance.save();

    return res.status(200).json({
      success: true,

      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,

        key_id:
          process.env.RAZORPAY_KEY_ID,

        maintenance: {
          id: maintenance._id,
          month:
            maintenance.month,
          year:
            maintenance.year,
          flat_no:
            maintenance.flat_no,
          total_amount:
            maintenance.total_amount
        },

        prefill: {
          name:
            req.user.name,
          email:
            req.user.email,
          contact:
            req.user.phone
        }
      }
    });
  } catch (error) {
    console.error(
      'Error creating Razorpay order:',
      error
    );

    next(error);
  }
};


/**
 * @desc    Generate maintenance for current society
 * @route   POST /api/maintenance/generate
 * @access  Private (Manager)
 */
exports.generateMonthlyMaintenance = async (
  req,
  res,
  next
) => {
  try {
    const {
      month,
      year
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

    const now = new Date();

    const targetMonth =
      month
        ? parseInt(month)
        : now.getMonth() + 1;

    const targetYear =
      year
        ? parseInt(year)
        : now.getFullYear();

    // Only active users from current society
    const users =
      await User.find({
        society_id: societyId,

        role: {
          $in: [
            'resident',
            'admin',
            'manager'
          ]
        },

        is_active: true
      }).select(
        '_id flat_no'
      );

    const dueDate =
      new Date(
        targetYear,
        targetMonth - 1,
        18
      );

    let created = 0;
    let skipped = 0;

    for (const user of users) {

      const exists =
        await Maintenance.findOne({
          society_id: societyId,
          user_id: user._id,
          month: targetMonth,
          year: targetYear
        });

      if (!exists) {

        await Maintenance.create({
          society_id: societyId,
          user_id: user._id,
          flat_no: user.flat_no,
          month: targetMonth,
          year: targetYear,
          amount: 1000,
          late_fee: 0,
          due_date: dueDate,
          status: 'pending'
        });

        created++;
      } else {
        skipped++;
      }
    }

    return res.status(200).json({
      success: true,

      message:
        `Maintenance records generated: ${created} created, ${skipped} skipped (already exist)`,

      data: {
        society_id:
          societyId,

        month:
          targetMonth,

        year:
          targetYear,

        created,
        skipped
      }
    });
  } catch (error) {
    console.error(
      'Error generating maintenance:',
      error
    );

    next(error);
  }
};


/*
============================================================
CRON JOB MANUAL TRIGGERS
============================================================

NOTE:
The automatic cron files are still global at this point.
We will update those separately so that:

Society A → Society A maintenance
Society B → Society B maintenance
Society C → Society C maintenance

Do NOT test the cron endpoints until those job files
are updated.
============================================================
*/

const {
  generateMonthlyMaintenance:
    generateMonthlyMaintenanceJob,

  generateMaintenanceForMonth
} = require('../jobs/maintenanceGenerator');

const {
  applyLateFees
} = require('../jobs/lateFeeApplier');

const {
  sendRemindersByType
} = require('../jobs/reminderSender');


/**
 * @desc    Manually trigger monthly maintenance generation
 * @route   POST /api/maintenance/cron/generate
 * @access  Private (Manager only)
 */
exports.triggerMaintenanceGeneration = async (
  req,
  res,
  next
) => {
  try {
    const {
      month,
      year
    } = req.body;

    /*
     * Existing cron job is currently global.
     * Society-wise cron update will be done next.
     */
    let result;

    if (month && year) {

      result =
        await generateMaintenanceForMonth(
          parseInt(month),
          parseInt(year)
        );

    } else {

      result =
        await generateMonthlyMaintenanceJob();
    }

    return res.status(200).json({
      success: true,
      message:
        'Maintenance generation completed',
      data: result
    });
  } catch (error) {
    console.error(
      'Error triggering maintenance generation:',
      error
    );

    next(error);
  }
};


/**
 * @desc    Manually trigger late fee application
 * @route   POST /api/maintenance/cron/late-fees
 * @access  Private (Manager only)
 */
exports.triggerLateFeeApplication = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await applyLateFees();

    return res.status(200).json({
      success: true,
      message:
        'Late fee application completed',
      data: result
    });
  } catch (error) {
    console.error(
      'Error triggering late fee application:',
      error
    );

    next(error);
  }
};


/**
 * @desc    Manually trigger payment reminders
 * @route   POST /api/maintenance/cron/reminders
 * @access  Private (Manager only)
 */
exports.triggerPaymentReminders = async (
  req,
  res,
  next
) => {
  try {
    const {
      type = 'reminder',
      month,
      year
    } = req.body;

    const validTypes = [
      'invoice',
      'reminder',
      'final_warning'
    ];

    if (
      !validTypes.includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Invalid reminder type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const result =
      await sendRemindersByType(
        type,
        month
          ? parseInt(month)
          : null,
        year
          ? parseInt(year)
          : null
      );

    return res.status(200).json({
      success: true,
      message:
        `${type} reminders sent`,
      data: result
    });
  } catch (error) {
    console.error(
      'Error triggering payment reminders:',
      error
    );

    next(error);
  }
};