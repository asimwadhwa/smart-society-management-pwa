const mongoose = require('mongoose');
const Razorpay = require('razorpay');

const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const Society = require('../models/Society');


// ============================================================
// RAZORPAY
// ============================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ============================================================
// HELPERS
// ============================================================

const getSocietyId = (req) => {
  if (!req.user) {
    return null;
  }

  if (req.user.role === 'super_admin') {
    return null;
  }

  return req.user.society_id || null;
};


const isSuperAdmin = (req) => {
  return req.user?.role === 'super_admin';
};


const isManagerOrAdmin = (req) => {
  return (
    req.user?.role === 'manager' ||
    req.user?.role === 'admin'
  );
};


const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};


// ============================================================
// GET USER MAINTENANCE
// Resident/Admin can see their own maintenance
// Manager does NOT have personal maintenance
// ============================================================

exports.getUserMaintenance = async (req, res) => {
  try {

    if (req.user.role === 'manager') {
      return res.status(200).json({
        success: true,
        message: 'Manager does not have personal maintenance.',
        data: []
      });
    }

    const societyId = getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'Society information is required.'
      });
    }

    const {
      status,
      month,
      year
    } = req.query;

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

    if (month) {
      filter.month = parseInt(month);
    }

    if (year) {
      filter.year = parseInt(year);
    }

    const maintenance = await Maintenance.find(filter)
      .sort({
        year: -1,
        month: -1,
        createdAt: -1
      });

    return res.status(200).json({
      success: true,
      count: maintenance.length,
      data: maintenance
    });

  } catch (error) {

    console.error(
      'Get user maintenance error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance records.'
    });
  }
};


// ============================================================
// GET CURRENT MONTH STATUS
// ============================================================

exports.getCurrentMonthStatus = async (req, res) => {
  try {

    // Manager has NO personal maintenance
    if (req.user.role === 'manager') {
      return res.status(200).json({
        success: true,
        configured: false,
        hasMaintenance: false,
        message: 'Manager does not have personal maintenance.',
        data: null
      });
    }

    const societyId = getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'Society information is required.'
      });
    }

    const now = new Date();

    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let maintenance =
      await Maintenance.findOne({
        society_id: societyId,
        user_id: req.user._id,
        month,
        year
      });

    // --------------------------------------------------------
    // If maintenance does not exist, DO NOT create ₹1000.
    // First check society settings.
    // --------------------------------------------------------

    if (!maintenance) {

      const society =
        await Society.findById(societyId).select(
          'maintenance_amount maintenance_due_day maintenance_late_fee'
        );

      if (
        !society ||
        society.maintenance_amount === null ||
        society.maintenance_amount === undefined ||
        Number(society.maintenance_amount) <= 0
      ) {
        return res.status(200).json({
          success: true,
          configured: false,
          hasMaintenance: false,
          message:
            'Maintenance has not been configured by the Manager/Admin.',
          data: null
        });
      }

      const dueDay =
        society.maintenance_due_day || 18;

      const dueDate =
        new Date(
          year,
          month - 1,
          dueDay,
          23,
          59,
          59
        );

      maintenance =
        await Maintenance.create({
          society_id: societyId,
          user_id: req.user._id,
          flat_no: req.user.flat_no,
          month,
          year,
          amount: Number(
            society.maintenance_amount
          ),
          late_fee:
            Number(
              society.maintenance_late_fee
            ) || 0,
          due_date: dueDate,
          status:
            dueDate < now
              ? 'overdue'
              : 'pending'
        });
    }

    return res.status(200).json({
      success: true,
      configured: true,
      hasMaintenance: true,
      data: maintenance
    });

  } catch (error) {

    console.error(
      'Get current maintenance error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to fetch current maintenance status.'
    });
  }
};


// ============================================================
// GET PAYMENT HISTORY
// ============================================================

exports.getPaymentHistory = async (req, res) => {
  try {

    if (req.user.role === 'manager') {
      return res.status(200).json({
        success: true,
        message:
          'Manager does not have personal payment history.',
        data: []
      });
    }

    const societyId = getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'Society information is required.'
      });
    }

    const maintenance =
      await Maintenance.find({
        society_id: societyId,
        user_id: req.user._id,
        status: 'paid'
      })
        .sort({
          paid_date: -1,
          year: -1,
          month: -1
        });

    return res.status(200).json({
      success: true,
      count: maintenance.length,
      data: maintenance
    });

  } catch (error) {

    console.error(
      'Get payment history error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to fetch payment history.'
    });
  }
};


// ============================================================
// GET ALL MAINTENANCE
// Super Admin -> all societies / selected society
// Manager/Admin -> own society only
// ============================================================

exports.getAllMaintenance = async (req, res) => {
  try {

    const {
      month,
      year,
      status,
      society_id
    } = req.query;

    const filter = {};

    // --------------------------------------------------------
    // SOCIETY SCOPE
    // --------------------------------------------------------

    if (isSuperAdmin(req)) {

      if (society_id) {

        if (!isValidObjectId(society_id)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid society ID.'
          });
        }

        filter.society_id = society_id;
      }

    } else {

      const currentSocietyId =
        getSocietyId(req);

      if (!currentSocietyId) {
        return res.status(400).json({
          success: false,
          message: 'Society information is required.'
        });
      }

      filter.society_id =
        currentSocietyId;
    }

    // --------------------------------------------------------
    // MONTH / YEAR / STATUS
    // --------------------------------------------------------

    if (month) {
      filter.month = parseInt(month);
    }

    if (year) {
      filter.year = parseInt(year);
    }

    if (
      status &&
      ['pending', 'paid', 'overdue'].includes(status)
    ) {
      filter.status = status;
    }

    // --------------------------------------------------------
    // DO NOT SHOW CURRENT MANAGER'S PERSONAL MAINTENANCE
    // --------------------------------------------------------

    const managerQuery = {
      role: 'manager'
    };

    if (filter.society_id) {
      managerQuery.society_id =
        filter.society_id;
    }

    const managerIds =
      await User.find(managerQuery)
        .distinct('_id');

    if (managerIds.length > 0) {
      filter.user_id = {
        $nin: managerIds
      };
    }

    const maintenance =
      await Maintenance.find(filter)
        .populate(
          'user_id',
          'name email phone flat_no role'
        )
        .populate(
          'society_id',
          'name society_code'
        )
        .sort({
          year: -1,
          month: -1,
          createdAt: -1
        });

    return res.status(200).json({
      success: true,
      count: maintenance.length,
      data: maintenance
    });

  } catch (error) {

    console.error(
      'Get all maintenance error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to fetch maintenance records.'
    });
  }
};


// ============================================================
// GET PAYMENT / MAINTENANCE STATS
// ============================================================

exports.getPaymentStats = async (req, res) => {
  try {

    const {
      month,
      year,
      society_id
    } = req.query;

    const filter = {};

    // --------------------------------------------------------
    // SOCIETY SCOPE
    // --------------------------------------------------------

    if (isSuperAdmin(req)) {

      if (society_id) {

        if (!isValidObjectId(society_id)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid society ID.'
          });
        }

        filter.society_id = society_id;
      }

    } else {

      const currentSocietyId =
        getSocietyId(req);

      if (!currentSocietyId) {
        return res.status(400).json({
          success: false,
          message: 'Society information is required.'
        });
      }

      filter.society_id =
        currentSocietyId;
    }

    if (month) {
      filter.month = parseInt(month);
    }

    if (year) {
      filter.year = parseInt(year);
    }

    // --------------------------------------------------------
    // EXCLUDE CURRENT MANAGERS
    // --------------------------------------------------------

    const managerQuery = {
      role: 'manager'
    };

    if (filter.society_id) {
      managerQuery.society_id =
        filter.society_id;
    }

    const managerIds =
      await User.find(managerQuery)
        .distinct('_id');

    if (managerIds.length > 0) {
      filter.user_id = {
        $nin: managerIds
      };
    }

    const records =
      await Maintenance.find(filter);

    const paidRecords =
      records.filter(
        item => item.status === 'paid'
      );

    const pendingRecords =
      records.filter(
        item => item.status === 'pending'
      );

    const overdueRecords =
      records.filter(
        item => item.status === 'overdue'
      );

    const sum = (items) =>
      items.reduce(
        (total, item) =>
          total +
          Number(item.total_amount || 0),
        0
      );

    const paidAmount =
      sum(paidRecords);

    const pendingAmount =
      sum(pendingRecords);

    const overdueAmount =
      sum(overdueRecords);

    const totalExpected =
      sum(records);

    return res.status(200).json({
      success: true,
      data: {

        month:
          month
            ? parseInt(month)
            : null,

        year:
          year
            ? parseInt(year)
            : null,

        society_id:
          society_id || getSocietyId(req),

        all_societies:
          isSuperAdmin(req) &&
          !society_id,

        byStatus: {

          paid: {
            count:
              paidRecords.length,
            totalAmount:
              paidAmount
          },

          pending: {
            count:
              pendingRecords.length,
            totalAmount:
              pendingAmount
          },

          overdue: {
            count:
              overdueRecords.length,
            totalAmount:
              overdueAmount
          }

        },

        totals: {

          totalFlats:
            records.length,

          totalExpected:
            totalExpected,

          totalCollected:
            paidAmount,

          totalPending:
            pendingAmount +
            overdueAmount

        }

      }
    });

  } catch (error) {

    console.error(
      'Get payment stats error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to fetch maintenance statistics.'
    });
  }
};


// ============================================================
// GET MAINTENANCE SETTINGS
// ONLY MANAGER / ADMIN
// ============================================================

exports.getMaintenanceSettings = async (
  req,
  res
) => {
  try {

    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          'Only Manager or Admin can access maintenance settings.'
      });
    }

    const societyId =
      getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'Society information is required.'
      });
    }

    const society =
      await Society.findById(
        societyId
      ).select(
        'name society_code maintenance_amount maintenance_due_day maintenance_late_fee'
      );

    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        society_id: society._id,
        society_name: society.name,
        society_code: society.society_code,

        maintenance_amount:
          society.maintenance_amount,

        maintenance_due_day:
          society.maintenance_due_day,

        maintenance_late_fee:
          society.maintenance_late_fee
      }
    });

  } catch (error) {

    console.error(
      'Get maintenance settings error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to fetch maintenance settings.'
    });
  }
};


// ============================================================
// UPDATE MAINTENANCE SETTINGS
// ONLY MANAGER / ADMIN
// ============================================================

exports.updateMaintenanceSettings = async (
  req,
  res
) => {
  try {

    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          'Only Manager or Admin can change maintenance settings.'
      });
    }

    const societyId =
      getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'Society information is required.'
      });
    }

    const {
      maintenance_amount,
      maintenance_due_day,
      maintenance_late_fee
    } = req.body || {};

    // --------------------------------------------------------
    // MAINTENANCE AMOUNT
    // --------------------------------------------------------

    if (
      maintenance_amount === undefined ||
      maintenance_amount === null ||
      maintenance_amount === ''
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Maintenance amount is required.'
      });
    }

    const amount =
      Number(maintenance_amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Maintenance amount must be greater than 0.'
      });
    }

    // --------------------------------------------------------
    // DUE DAY
    // --------------------------------------------------------

    let dueDay =
      maintenance_due_day;

    if (
      dueDay === undefined ||
      dueDay === null ||
      dueDay === ''
    ) {
      dueDay = 18;
    }

    dueDay = Number(dueDay);

    if (
      !Number.isInteger(dueDay) ||
      dueDay < 1 ||
      dueDay > 28
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Maintenance due day must be between 1 and 28.'
      });
    }

    // --------------------------------------------------------
    // LATE FEE
    // --------------------------------------------------------

    let lateFee =
      maintenance_late_fee;

    if (
      lateFee === undefined ||
      lateFee === null ||
      lateFee === ''
    ) {
      lateFee = 0;
    }

    lateFee = Number(lateFee);

    if (
      !Number.isFinite(lateFee) ||
      lateFee < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Maintenance late fee cannot be negative.'
      });
    }

    const society =
      await Society.findByIdAndUpdate(
        societyId,
        {
          $set: {
            maintenance_amount:
              amount,

            maintenance_due_day:
              dueDay,

            maintenance_late_fee:
              lateFee
          }
        },
        {
          new: true,
          runValidators: true
        }
      ).select(
        'name society_code maintenance_amount maintenance_due_day maintenance_late_fee'
      );

    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Maintenance settings updated successfully.',
      data: {
        society_id: society._id,
        society_name: society.name,
        society_code: society.society_code,

        maintenance_amount:
          society.maintenance_amount,

        maintenance_due_day:
          society.maintenance_due_day,

        maintenance_late_fee:
          society.maintenance_late_fee
      }
    });

  } catch (error) {

    console.error(
      'Update maintenance settings error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to update maintenance settings.'
    });
  }
};


// ============================================================
// UPDATE EXISTING MAINTENANCE
// ONLY MANAGER / ADMIN
// ONLY UNPAID RECORDS
// ============================================================

exports.updateMaintenance = async (
  req,
  res
) => {
  try {

    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          'Only Manager or Admin can edit maintenance.'
      });
    }

    const {
      id
    } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid maintenance ID.'
      });
    }

    const societyId =
      getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'Society information is required.'
      });
    }

    const maintenance =
      await Maintenance.findOne({
        _id: id,
        society_id: societyId
      });

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message:
          'Maintenance record not found.'
      });
    }

    // --------------------------------------------------------
    // PAID RECORD CANNOT BE EDITED
    // --------------------------------------------------------

    if (maintenance.status === 'paid') {
      return res.status(400).json({
        success: false,
        message:
          'Paid maintenance cannot be edited.'
      });
    }

    // --------------------------------------------------------
    // CHECK OWNER ROLE
    // MANAGER SHOULD NEVER HAVE PERSONAL MAINTENANCE
    // --------------------------------------------------------

    const owner =
      await User.findById(
        maintenance.user_id
      ).select('role');

    if (
      owner &&
      owner.role === 'manager'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Manager does not have personal maintenance.'
      });
    }

    const {
      amount,
      due_date,
      late_fee
    } = req.body || {};

    let amountChanged = false;

    // --------------------------------------------------------
    // UPDATE AMOUNT
    // --------------------------------------------------------

    if (
      amount !== undefined
    ) {

      const newAmount =
        Number(amount);

      if (
        !Number.isFinite(newAmount) ||
        newAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Maintenance amount must be greater than 0.'
        });
      }

      maintenance.amount =
        newAmount;

      amountChanged = true;
    }

    // --------------------------------------------------------
    // UPDATE LATE FEE
    // --------------------------------------------------------

    if (
      late_fee !== undefined
    ) {

      const newLateFee =
        Number(late_fee);

      if (
        !Number.isFinite(newLateFee) ||
        newLateFee < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Late fee cannot be negative.'
        });
      }

      maintenance.late_fee =
        newLateFee;

      amountChanged = true;
    }

    // --------------------------------------------------------
    // UPDATE DUE DATE
    // --------------------------------------------------------

    if (
      due_date !== undefined
    ) {

      const newDueDate =
        new Date(due_date);

      if (
        Number.isNaN(
          newDueDate.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid due date.'
        });
      }

      maintenance.due_date =
        newDueDate;

      amountChanged = true;
    }

    // --------------------------------------------------------
    // RE-CALCULATE STATUS
    // --------------------------------------------------------

    const now = new Date();

    if (
      maintenance.due_date &&
      maintenance.due_date < now
    ) {
      maintenance.status =
        'overdue';
    } else {
      maintenance.status =
        'pending';
    }

    // --------------------------------------------------------
    // IMPORTANT:
    // If amount/date/late fee changed, old Razorpay order
    // should not be reused.
    // --------------------------------------------------------

    if (amountChanged) {
      maintenance.razorpay_order_id =
        null;

      maintenance.razorpay_payment_id =
        null;
    }

    maintenance.total_amount =
      Number(maintenance.amount || 0) +
      Number(maintenance.late_fee || 0);

    await maintenance.save();

    return res.status(200).json({
      success: true,
      message:
        'Maintenance updated successfully.',
      data: maintenance
    });

  } catch (error) {

    console.error(
      'Update maintenance error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to update maintenance.'
    });
  }
};


// ============================================================
// CREATE RAZORPAY ORDER
// Manager cannot create/pay personal maintenance
// ============================================================

exports.createOrder = async (
  req,
  res
) => {
  try {

    if (req.user.role === 'manager') {
      return res.status(403).json({
        success: false,
        message:
          'Manager does not have personal maintenance.'
      });
    }

    const societyId =
      getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'Society information is required.'
      });
    }

    const {
      maintenance_id
    } = req.body || {};

    if (
      !maintenance_id ||
      !isValidObjectId(maintenance_id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Valid maintenance ID is required.'
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
          'Maintenance record not found.'
      });
    }

    if (maintenance.status === 'paid') {
      return res.status(400).json({
        success: false,
        message:
          'Maintenance is already paid.'
      });
    }

    const amount =
      Number(maintenance.total_amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid maintenance amount.'
      });
    }

    // --------------------------------------------------------
    // CREATE NEW RAZORPAY ORDER
    // --------------------------------------------------------

    const order =
      await razorpay.orders.create({
        amount:
          Math.round(amount * 100),

        currency: 'INR',

        receipt:
          `maintenance_${maintenance._id}_${Date.now()}`,

        notes: {
          maintenance_id:
            maintenance._id.toString(),

          user_id:
            req.user._id.toString(),

          society_id:
            societyId.toString(),

          flat_no:
            maintenance.flat_no
        }
      });

    maintenance.razorpay_order_id =
      order.id;

    await maintenance.save();

    return res.status(200).json({
      success: true,
      message:
        'Payment order created successfully.',
      data: {
        order_id: order.id,

        amount:
          order.amount,

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
      'Create maintenance order error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to create payment order.'
    });
  }
};


// ============================================================
// GENERATE MONTHLY MAINTENANCE
// ONLY MANAGER / ADMIN
// ============================================================

exports.generateMonthlyMaintenance = async (
  req,
  res
) => {
  try {

    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          'Only Manager or Admin can generate maintenance.'
      });
    }

    const societyId =
      getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'Society information is required.'
      });
    }

    const society =
      await Society.findById(
        societyId
      );

    if (!society) {
      return res.status(404).json({
        success: false,
        message:
          'Society not found.'
      });
    }

    const now = new Date();

    const month =
      req.body?.month
        ? parseInt(req.body.month)
        : now.getMonth() + 1;

    const year =
      req.body?.year
        ? parseInt(req.body.year)
        : now.getFullYear();

    if (
      month < 1 ||
      month > 12
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid month.'
      });
    }

    // --------------------------------------------------------
    // Optional settings from Generate request
    // If supplied, update society settings first.
    // --------------------------------------------------------

    let amount =
      req.body?.amount;

    let dueDay =
      req.body?.due_day;

    let lateFee =
      req.body?.late_fee;

    if (
      amount !== undefined
    ) {

      amount =
        Number(amount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Maintenance amount must be greater than 0.'
        });
      }

      society.maintenance_amount =
        amount;
    }

    if (
      dueDay !== undefined
    ) {

      dueDay =
        Number(dueDay);

      if (
        !Number.isInteger(dueDay) ||
        dueDay < 1 ||
        dueDay > 28
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Maintenance due day must be between 1 and 28.'
        });
      }

      society.maintenance_due_day =
        dueDay;
    }

    if (
      lateFee !== undefined
    ) {

      lateFee =
        Number(lateFee);

      if (
        !Number.isFinite(lateFee) ||
        lateFee < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Maintenance late fee cannot be negative.'
        });
      }

      society.maintenance_late_fee =
        lateFee;
    }

    // --------------------------------------------------------
    // NO DEFAULT AMOUNT
    // --------------------------------------------------------

    if (
      society.maintenance_amount === null ||
      society.maintenance_amount === undefined ||
      Number(society.maintenance_amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Maintenance amount is not configured. Please set the maintenance amount first.'
      });
    }

    if (
      society.maintenance_due_day === null ||
      society.maintenance_due_day === undefined
    ) {
      society.maintenance_due_day =
        18;
    }

    if (
      society.maintenance_late_fee === null ||
      society.maintenance_late_fee === undefined
    ) {
      society.maintenance_late_fee =
        0;
    }

    await society.save();

    // --------------------------------------------------------
    // GET ACTIVE RESIDENTS + ADMINS
    // MANAGER EXCLUDED
    // --------------------------------------------------------

    const users =
      await User.find({
        society_id: societyId,
        role: {
          $in: [
            'resident',
            'admin'
          ]
        },
        is_active: true
      }).select(
        '_id flat_no name email'
      );

    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          'No active residents or admins found for maintenance generation.',
        data: {
          created: 0,
          skipped: 0,
          amount:
            society.maintenance_amount,
          month,
          year
        }
      });
    }

    const dueDate =
      new Date(
        year,
        month - 1,
        Number(
          society.maintenance_due_day
        ),
        23,
        59,
        59
      );

    let created = 0;
    let skipped = 0;

    const createdRecords = [];

    // --------------------------------------------------------
    // CREATE MAINTENANCE FOR EACH USER
    // --------------------------------------------------------

    for (const user of users) {

      const existing =
        await Maintenance.findOne({
          society_id: societyId,
          user_id: user._id,
          month,
          year
        });

      if (existing) {
        skipped++;
        continue;
      }

      const maintenance =
        await Maintenance.create({
          society_id: societyId,

          user_id:
            user._id,

          flat_no:
            user.flat_no,

          month,

          year,

          amount:
            Number(
              society.maintenance_amount
            ),

          late_fee: 0,

          due_date:
            dueDate,

          status:
            dueDate < now
              ? 'overdue'
              : 'pending'
        });

      created++;

      createdRecords.push(
        maintenance
      );
    }

    return res.status(200).json({
      success: true,
      message:
        'Monthly maintenance generated successfully.',
      data: {
        created,
        skipped,
        totalUsers:
          users.length,

        amount:
          society.maintenance_amount,

        due_day:
          society.maintenance_due_day,

        late_fee:
          society.maintenance_late_fee,

        month,
        year,

        records:
          createdRecords
      }
    });

  } catch (error) {

    console.error(
      'Generate monthly maintenance error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to generate monthly maintenance.'
    });
  }
};


// ============================================================
// MANUAL CRON - GENERATE MAINTENANCE
// ONLY MANAGER / ADMIN
// ============================================================

exports.triggerMaintenanceGeneration = async (
  req,
  res
) => {
  try {

    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          'Only Manager or Admin can trigger maintenance generation.'
      });
    }

    const societyId =
      getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'Society information is required.'
      });
    }

    const {
      generateMaintenanceForMonth
    } = require('../jobs/maintenanceGenerator');

    const month =
      req.body?.month;

    const year =
      req.body?.year;

    let result;

    if (
      month &&
      year
    ) {

      result =
        await generateMaintenanceForMonth(
          parseInt(month),
          parseInt(year),
          societyId
        );

    } else {

      const {
        generateMonthlyMaintenance:
          generateMonthlyMaintenanceJob
      } = require('../jobs/maintenanceGenerator');

      result =
        await generateMonthlyMaintenanceJob(
          societyId
        );
    }

    return res.status(200).json({
      success: true,
      message:
        'Maintenance generation completed.',
      data: result
    });

  } catch (error) {

    console.error(
      'Trigger maintenance generation error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to trigger maintenance generation.'
    });
  }
};


// ============================================================
// MANUAL CRON - LATE FEES
// ONLY MANAGER / ADMIN
// ============================================================

exports.triggerLateFeeApplication = async (
  req,
  res
) => {
  try {

    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          'Only Manager or Admin can trigger late fees.'
      });
    }

    const societyId =
      getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'Society information is required.'
      });
    }

    const {
      applyLateFees
    } = require('../jobs/lateFeeApplier');

    const result =
      await applyLateFees(
        societyId
      );

    return res.status(200).json({
      success: true,
      message:
        'Late fee process completed.',
      data: result
    });

  } catch (error) {

    console.error(
      'Trigger late fee error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to apply late fees.'
    });
  }
};


// ============================================================
// MANUAL CRON - PAYMENT REMINDERS
// ONLY MANAGER / ADMIN
// ============================================================

exports.triggerPaymentReminders = async (
  req,
  res
) => {
  try {

    if (!isManagerOrAdmin(req)) {
      return res.status(403).json({
        success: false,
        message:
          'Only Manager or Admin can trigger payment reminders.'
      });
    }

    const societyId =
      getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'Society information is required.'
      });
    }

    const {
      type
    } = req.body || {};

    if (
      !type ||
      ![
        'before_due',
        'due_today',
        'overdue'
      ].includes(type)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Valid reminder type is required.'
      });
    }

    const {
      sendRemindersByType
    } = require('../jobs/reminderSender');

    const result =
      await sendRemindersByType(
        type,
        null,
        null,
        societyId
      );

    return res.status(200).json({
      success: true,
      message:
        'Payment reminders process completed.',
      data: result
    });

  } catch (error) {

    console.error(
      'Trigger payment reminders error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to send payment reminders.'
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = exports;