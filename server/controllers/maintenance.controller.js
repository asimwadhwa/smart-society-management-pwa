const mongoose = require('mongoose');
const Maintenance = require('../models/Maintenance');
const PaymentLog = require('../models/PaymentLog');
const User = require('../models/User');
const razorpay = require('../config/razorpay');

const getSocietyId = (req) => {
  return req.user?.society_id || null;
};

exports.getUserMaintenance = async (req, res, next) => {
  try {
    if (req.user?.role === 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Managers do not have personal maintenance dues'
      });
    }

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

exports.getCurrentMonthStatus = async (
  req,
  res,
  next
) => {
  try {
    if (req.user?.role === 'manager') {
      return res.status(403).json({
        success: false,
        message:
          'Managers do not have personal maintenance dues'
      });
    }

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

      const dueDate = new Date(
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
        if (createError?.code === 11000) {
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

exports.getPaymentHistory = async (
  req,
  res,
  next
) => {
  try {
    if (req.user?.role === 'manager') {
      return res.status(403).json({
        success: false,
        message:
          'Managers do not have personal maintenance payment history'
      });
    }

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

    const pageNumber = Math.max(
      parseInt(page) || 1,
      1
    );

    const limitNumber = Math.min(
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
        pages:
          Math.ceil(
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
      req.user?.role ===
      'super_admin';

    const ownSocietyId =
      getSocietyId(req);

    const filter = {};

    if (isSuperAdmin) {
      if (society_id) {
        if (
          !mongoose.Types.ObjectId.isValid(
            society_id
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid society ID'
          });
        }

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

    if (
      status &&
      ['pending', 'paid', 'overdue'].includes(
        status
      )
    ) {
      filter.status = status;
    }

    if (month) {
      filter.month =
        parseInt(month);
    }

    if (year) {
      filter.year =
        parseInt(year);
    }

    if (flat_no) {
      filter.flat_no = flat_no;
    }

    const pageNumber = Math.max(
      parseInt(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(
        parseInt(limit) || 20,
        1
      ),
      100
    );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const [
      maintenance,
      total
    ] = await Promise.all([
      Maintenance.find(filter)
        .populate(
          'user_id',
          'name email flat_no phone role'
        )
        .populate(
          'society_id',
          'name society_code'
        )
        .sort(sort)
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
        pages:
          Math.ceil(
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
      req.user?.role ===
      'super_admin';

    const ownSocietyId =
      getSocietyId(req);

    const filter = {};

    if (isSuperAdmin) {
      if (society_id) {
        if (
          !mongoose.Types.ObjectId.isValid(
            society_id
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid society ID'
          });
        }

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

    if (month) {
      filter.month =
        parseInt(month);
    }

    if (year) {
      filter.year =
        parseInt(year);
    }

    const [
      totalRecords,
      paidRecords,
      pendingRecords,
      overdueRecords
    ] = await Promise.all([
      Maintenance.countDocuments(
        filter
      ),

      Maintenance.countDocuments({
        ...filter,
        status: 'paid'
      }),

      Maintenance.countDocuments({
        ...filter,
        status: 'pending'
      }),

      Maintenance.countDocuments({
        ...filter,
        status: 'overdue'
      })
    ]);

    const amountStats =
      await Maintenance.aggregate([
        {
          $match: filter
        },
        {
          $group: {
            _id: '$status',
            totalAmount: {
              $sum: '$total_amount'
            },
            amount: {
              $sum: '$amount'
            },
            lateFee: {
              $sum: '$late_fee'
            }
          }
        }
      ]);

    const stats = {
      total: totalRecords,
      paid: paidRecords,
      pending: pendingRecords,
      overdue: overdueRecords,
      total_amount: 0,
      paid_amount: 0,
      pending_amount: 0,
      overdue_amount: 0,
      total_late_fee: 0
    };

    amountStats.forEach(
      (item) => {
        const totalAmount =
          item.totalAmount || 0;

        const amount =
          item.amount || 0;

        const lateFee =
          item.lateFee || 0;

        stats.total_amount +=
          totalAmount;

        stats.total_late_fee +=
          lateFee;

        if (
          item._id === 'paid'
        ) {
          stats.paid_amount =
            totalAmount;
        }

        if (
          item._id === 'pending'
        ) {
          stats.pending_amount =
            totalAmount;
        }

        if (
          item._id === 'overdue'
        ) {
          stats.overdue_amount =
            totalAmount;
        }
      }
    );

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error(
      'Error fetching payment stats:',
      error
    );
    next(error);
  }
};

exports.createOrder = async (
  req,
  res,
  next
) => {
  try {
    if (req.user?.role === 'manager') {
      return res.status(403).json({
        success: false,
        message:
          'Managers do not have personal maintenance payments'
      });
    }

    const {
      maintenance_id
    } = req.body;

    if (!maintenance_id) {
      return res.status(400).json({
        success: false,
        message:
          'Maintenance ID is required'
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        maintenance_id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid maintenance ID'
      });
    }

    const societyId =
      getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }

    const maintenance =
      await Maintenance.findOne({
        _id: maintenance_id,
        society_id: societyId,
        user_id: req.user._id
      });

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message:
          'Maintenance record not found'
      });
    }

    if (
      maintenance.status ===
      'paid'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Maintenance is already paid'
      });
    }

    const amount =
      Math.round(
        maintenance.total_amount * 100
      );

    const receipt =
      `maintenance_${maintenance._id}_${Date.now()}`;

    const order =
      await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt,
        notes: {
          maintenance_id:
            maintenance._id.toString(),

          user_id:
            req.user._id.toString(),

          society_id:
            societyId.toString(),

          flat_no:
            maintenance.flat_no,

          month:
            maintenance.month,

          year:
            maintenance.year
        }
      });

    maintenance.razorpay_order_id =
      order.id;

    await maintenance.save();

    return res.status(200).json({
      success: true,
      data: {
        order_id: order.id,
        amount: order.amount,
        currency:
          order.currency,
        maintenance_id:
          maintenance._id,
        key_id:
          process.env.RAZORPAY_KEY_ID
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

exports.generateMonthlyMaintenance =
  async (req, res, next) => {
    try {
      const {
        month,
        year,
        amount = 1000,
        due_day = 18,
        society_id
      } = req.body;

      const isSuperAdmin =
        req.user?.role ===
        'super_admin';

      let targetSocietyId =
        society_id ||
        getSocietyId(req);

      if (
        !targetSocietyId
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Society ID is required'
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          targetSocietyId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid society ID'
        });
      }

      if (
        !isSuperAdmin &&
        String(
          targetSocietyId
        ) !==
          String(
            getSocietyId(req)
          )
      ) {
        return res.status(403).json({
          success: false,
          message:
            'You can generate maintenance only for your society'
        });
      }

      const now =
        new Date();

      const targetMonth =
        month ||
        now.getMonth() + 1;

      const targetYear =
        year ||
        now.getFullYear();

      const targetAmount =
        Number(amount);

      const targetDueDay =
        Number(due_day);

      if (
        targetMonth < 1 ||
        targetMonth > 12
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Month must be between 1 and 12'
        });
      }

      if (
        !Number.isInteger(
          targetYear
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid year'
        });
      }

      if (
        !Number.isFinite(
          targetAmount
        ) ||
        targetAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Maintenance amount must be greater than 0'
        });
      }

      if (
        targetDueDay < 1 ||
        targetDueDay > 28
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Due day must be between 1 and 28'
        });
      }

      const societyUsers =
        await User.find({
          society_id:
            targetSocietyId,

          role: {
            $in: [
              'resident',
              'admin'
            ]
          },

          is_active: true,

          flat_no: {
            $exists: true,
            $ne: null,
            $ne: ''
          }
        })
          .select(
            '_id flat_no name email role'
          )
          .lean();

      if (
        societyUsers.length ===
        0
      ) {
        return res.status(200).json({
          success: true,
          message:
            'No active residents or admins found for maintenance generation',
          data: {
            created: 0,
            skipped: 0,
            total_users: 0
          }
        });
      }

      const dueDate =
        new Date(
          targetYear,
          targetMonth - 1,
          targetDueDay,
          23,
          59,
          59
        );

      const operations = [];
      let skipped = 0;

      for (
        const user
        of societyUsers
      ) {
        operations.push({
          updateOne: {
            filter: {
              society_id:
                targetSocietyId,

              user_id:
                user._id,

              month:
                targetMonth,

              year:
                targetYear
            },

            update: {
              $setOnInsert: {
                society_id:
                  targetSocietyId,

                user_id:
                  user._id,

                flat_no:
                  user.flat_no,

                month:
                  targetMonth,

                year:
                  targetYear,

                amount:
                  targetAmount,

                late_fee: 0,

                total_amount:
                  targetAmount,

                due_date:
                  dueDate,

                status:
                  'pending'
              }
            },

            upsert: true
          }
        });
      }

      if (
        operations.length
      ) {
        const result =
          await Maintenance.bulkWrite(
            operations,
            {
              ordered: false
            }
          );

        const created =
          result.upsertedCount ||
          0;

        skipped =
          societyUsers.length -
          created;

        return res.status(200).json({
          success: true,
          message:
            'Monthly maintenance generated successfully',
          data: {
            created,
            skipped,
            total_users:
              societyUsers.length,
            month:
              targetMonth,
            year:
              targetYear,
            amount:
              targetAmount,
            due_date:
              dueDate
          }
        });
      }

      return res.status(200).json({
        success: true,
        message:
          'No maintenance records generated',
        data: {
          created: 0,
          skipped,
          total_users:
            societyUsers.length
        }
      });
    } catch (error) {
      console.error(
        'Error generating monthly maintenance:',
        error
      );
      next(error);
    }
  };

exports.triggerMaintenanceGeneration =
  async (req, res, next) => {
    try {
      const {
        generateMonthlyMaintenance:
          generateMonthlyMaintenanceJob,
        generateMaintenanceForMonth
      } =
        require('../jobs/maintenanceGenerator');

      const {
        month,
        year,
        society_id
      } = req.body || {};

      if (
        society_id &&
        req.user?.role !==
          'super_admin'
      ) {
        if (
          String(
            society_id
          ) !==
          String(
            getSocietyId(req)
          )
        ) {
          return res.status(403).json({
            success: false,
            message:
              'You can generate maintenance only for your society'
          });
        }
      }

      let result;

      if (
        month &&
        year
      ) {
        result =
          await generateMaintenanceForMonth(
            parseInt(month),
            parseInt(year),
            society_id ||
              getSocietyId(req)
          );
      } else {
        result =
          await generateMonthlyMaintenanceJob(
            society_id ||
              getSocietyId(req)
          );
      }

      return res.status(200).json({
        success: true,
        message:
          'Maintenance generation triggered successfully',
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

exports.triggerLateFeeApplication =
  async (req, res, next) => {
    try {
      const {
        applyLateFees
      } =
        require('../jobs/lateFeeApplier');

      const result =
        await applyLateFees(
          getSocietyId(req)
        );

      return res.status(200).json({
        success: true,
        message:
          'Late fee application completed successfully',
        data: result
      });
    } catch (error) {
      console.error(
        'Error applying late fees:',
        error
      );
      next(error);
    }
  };

exports.triggerPaymentReminders =
  async (req, res, next) => {
    try {
      const {
        sendRemindersByType
      } =
        require('../jobs/reminderSender');

      const {
        type = 'all'
      } = req.body || {};

      const result =
        await sendRemindersByType(
          type,
          getSocietyId(req)
        );

      return res.status(200).json({
        success: true,
        message:
          'Payment reminders sent successfully',
        data: result
      });
    } catch (error) {
      console.error(
        'Error sending payment reminders:',
        error
      );
      next(error);
    }
  };

module.exports =
  module.exports;