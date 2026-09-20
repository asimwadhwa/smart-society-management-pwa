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
 * ============================================================
 * GET CURRENT USER MAINTENANCE
 * ============================================================
 */
exports.getUserMaintenance = async (req, res, next) => {
  try {
    const { status, year } = req.query;

    const societyId = getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'User is not assigned to any society'
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
 * ============================================================
 * GET CURRENT MONTH MAINTENANCE
 * ============================================================
 */
exports.getCurrentMonthStatus = async (req, res, next) => {
  try {
    const societyId = getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'User is not assigned to any society'
      });
    }

    const now = new Date();

    const currentMonth =
      now.getMonth() + 1;

    const currentYear =
      now.getFullYear();

    const userId = req.user._id;

    let maintenance =
      await Maintenance.findOne({
        society_id: societyId,
        user_id: userId,
        month: currentMonth,
        year: currentYear
      }).lean();

    if (!maintenance) {

      if (!req.user.flat_no) {
        return res.status(400).json({
          success: false,
          message:
            'User does not have a flat number assigned'
        });
      }

      const dueDate =
        new Date(
          currentYear,
          currentMonth - 1,
          18
        );

      try {

        const created =
          await Maintenance.create({
            society_id: societyId,
            user_id: userId,
            flat_no: req.user.flat_no,
            month: currentMonth,
            year: currentYear,
            amount: 1000,
            late_fee: 0,
            due_date: dueDate,
            status: 'pending'
          });

        maintenance =
          created.toObject();

      } catch (createError) {

        if (
          createError?.code === 11000
        ) {

          maintenance =
            await Maintenance.findOne({
              society_id: societyId,
              user_id: userId,
              month: currentMonth,
              year: currentYear
            }).lean();

        } else {
          throw createError;
        }
      }
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
 * ============================================================
 * GET PAYMENT HISTORY
 * ============================================================
 */
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10
    } = req.query;

    const societyId =
      getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }

    const pageNumber =
      Math.max(
        parseInt(page) || 1,
        1
      );

    const limitNumber =
      Math.min(
        Math.max(
          parseInt(limit) || 10,
          1
        ),
        100
      );

    const skip =
      (pageNumber - 1) *
      limitNumber;

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
 * ============================================================
 * GET ALL MAINTENANCE
 *
 * SUPER ADMIN:
 *   - Can see all societies
 *   - Can filter by society_id
 *
 * MANAGER / ADMIN:
 *   - Can see only their own society
 * ============================================================
 */
exports.getAllMaintenance = async (
  req,
  res,
  next
) => {
  try {

    const {
      page = 1,
      limit = 20,
      status,
      month,
      year,
      flat_no,
      society_id,
      sort = '-createdAt'
    } = req.query;

    const isSuperAdmin =
      req.user?.role === 'super_admin';

    const ownSocietyId =
      getSocietyId(req);

    /*
     * --------------------------------------------------------
     * SOCIETY FILTER
     * --------------------------------------------------------
     */

    const filter = {};

    if (isSuperAdmin) {

      // Super Admin:
      // If society_id is provided,
      // show only that society.
      if (society_id) {
        filter.society_id =
          society_id;
      }

    } else {

      // Manager/Admin:
      // Always restrict to own society.
      if (!ownSocietyId) {
        return res.status(400).json({
          success: false,
          message:
            'User is not assigned to any society'
        });
      }

      filter.society_id =
        ownSocietyId;
    }

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

    const skip =
      (pageNumber - 1) *
      limitNumber;

    /*
     * --------------------------------------------------------
     * STATUS
     * --------------------------------------------------------
     */

    if (
      status &&
      ['pending', 'paid', 'overdue'].includes(status)
    ) {
      filter.status = status;
    }

    /*
     * --------------------------------------------------------
     * MONTH
     * --------------------------------------------------------
     */

    if (month) {
      filter.month =
        parseInt(month);
    }

    /*
     * --------------------------------------------------------
     * YEAR
     * --------------------------------------------------------
     */

    if (year) {
      filter.year =
        parseInt(year);
    }

    /*
     * --------------------------------------------------------
     * FLAT
     * --------------------------------------------------------
     */

    if (flat_no) {
      filter.flat_no =
        flat_no;
    }

    /*
     * --------------------------------------------------------
     * SORT
     * --------------------------------------------------------
     */

    const sortObj = {};

    if (sort.startsWith('-')) {
      sortObj[
        sort.substring(1)
      ] = -1;
    } else {
      sortObj[sort] = 1;
    }

    /*
     * --------------------------------------------------------
     * FETCH
     * --------------------------------------------------------
     *
     * Populate society so Super Admin can see
     * exactly which society each record belongs to.
     */

    const [
      maintenance,
      total
    ] = await Promise.all([

      Maintenance.find(filter)
        .populate(
          'user_id',
          'name email phone flat_no role'
        )
        .populate(
          'society_id',
          'name society_code city state'
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
 * ============================================================
 * GET PAYMENT STATISTICS
 *
 * SUPER ADMIN:
 *   - All societies when society_id is not provided
 *   - One society when society_id is provided
 *
 * MANAGER / ADMIN:
 *   - Own society only
 * ============================================================
 */
exports.getPaymentStats = async (
  req,
  res,
  next
) => {
  try {

    const {
      month,
      year,
      society_id
    } = req.query;

    const isSuperAdmin =
      req.user?.role === 'super_admin';

    const ownSocietyId =
      getSocietyId(req);

    const now = new Date();

    const targetMonth =
      month
        ? parseInt(month)
        : now.getMonth() + 1;

    const targetYear =
      year
        ? parseInt(year)
        : now.getFullYear();

    /*
     * --------------------------------------------------------
     * FILTER
     * --------------------------------------------------------
     */

    const filter = {
      month: targetMonth,
      year: targetYear
    };

    if (isSuperAdmin) {

      if (society_id) {
        filter.society_id =
          society_id;
      }

    } else {

      if (!ownSocietyId) {
        return res.status(400).json({
          success: false,
          message:
            'User is not assigned to any society'
        });
      }

      filter.society_id =
        ownSocietyId;
    }

    /*
     * --------------------------------------------------------
     * AGGREGATE STATUS
     * --------------------------------------------------------
     */

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

    stats.forEach(stat => {

      if (
        statsByStatus[
          stat._id
        ]
      ) {

        statsByStatus[
          stat._id
        ] = {
          count:
            stat.count,

          totalAmount:
            stat.totalAmount
        };
      }
    });

    return res.status(200).json({
      success: true,

      data: {
        society_id:
          isSuperAdmin
            ? society_id || null
            : ownSocietyId,

        all_societies:
          isSuperAdmin &&
          !society_id,

        month:
          targetMonth,

        year:
          targetYear,

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
 * ============================================================
 * CREATE RAZORPAY ORDER
 * ============================================================
 */
exports.createOrder = async (
  req,
  res,
  next
) => {
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
        order_id:
          order.id,

        amount:
          order.amount,

        currency:
          order.currency,

        key_id:
          process.env.RAZORPAY_KEY_ID,

        maintenance: {
          id:
            maintenance._id,

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
 * ============================================================
 * GENERATE MONTHLY MAINTENANCE
 * ============================================================
 */
exports.generateMonthlyMaintenance =
  async (
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

      const users =
        await User.find({

          society_id:
            societyId,

          role: {
            $in: [
              'resident',
              'admin',
              'manager'
            ]
          },

          is_active: true

        }).select(
          '_id flat_no role'
        );

      const dueDate =
        new Date(
          targetYear,
          targetMonth - 1,
          18
        );

      let created = 0;
      let skipped = 0;

      for (
        const user of users
      ) {

        if (!user.flat_no) {
          continue;
        }

        const exists =
          await Maintenance.findOne({
            society_id:
              societyId,

            user_id:
              user._id,

            month:
              targetMonth,

            year:
              targetYear
          });

        if (!exists) {

          try {

            await Maintenance.create({

              society_id:
                societyId,

              user_id:
                user._id,

              flat_no:
                user.flat_no,

              month:
                targetMonth,

              year:
                targetYear,

              amount:
                1000,

              late_fee:
                0,

              due_date:
                dueDate,

              status:
                'pending'
            });

            created++;

          } catch (error) {

            if (
              error?.code === 11000
            ) {
              skipped++;
            } else {
              throw error;
            }
          }

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

/**
 * ============================================================
 * CRON JOBS
 * ============================================================
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
 * ============================================================
 * MANUAL MAINTENANCE GENERATION
 * ============================================================
 */
exports.triggerMaintenanceGeneration =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        month,
        year
      } = req.body;

      let result;

      if (
        month &&
        year
      ) {

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

        data:
          result
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
 * ============================================================
 * MANUAL LATE FEE
 * ============================================================
 */
exports.triggerLateFeeApplication =
  async (
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

        data:
          result
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
 * ============================================================
 * MANUAL REMINDERS
 * ============================================================
 */
exports.triggerPaymentReminders =
  async (
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

        data:
          result
      });

    } catch (error) {

      console.error(
        'Error triggering payment reminders:',
        error
      );

      next(error);
    }
  };