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
// DEFAULT MAINTENANCE SETTINGS
// ============================================================

const DEFAULT_MAINTENANCE_AMOUNT = 1000;
const DEFAULT_DUE_DAY = 18;
const DEFAULT_LATE_FEE = 100;


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


const isMaintenanceUser = (req) => {

  return (
    req.user?.role === 'resident' ||
    req.user?.role === 'admin' ||
    req.user?.role === 'manager'
  );

};


const isValidObjectId = (id) => {

  return mongoose.Types.ObjectId.isValid(id);

};


// ============================================================
// GET EFFECTIVE MAINTENANCE SETTINGS
// ============================================================

const getEffectiveMaintenanceSettings = async (society) => {

  let amount = society.maintenance_amount;

  let dueDay = society.maintenance_due_day;

  let lateFee = society.maintenance_late_fee;


  if (
    amount === null ||
    amount === undefined ||
    Number(amount) <= 0
  ) {

    amount = DEFAULT_MAINTENANCE_AMOUNT;

  }


  if (
    dueDay === null ||
    dueDay === undefined ||
    Number(dueDay) < 1 ||
    Number(dueDay) > 28
  ) {

    dueDay = DEFAULT_DUE_DAY;

  }


  if (
    lateFee === null ||
    lateFee === undefined ||
    Number(lateFee) < 0
  ) {

    lateFee = DEFAULT_LATE_FEE;

  }


  return {

    amount: Number(amount),

    dueDay: Number(dueDay),

    lateFee: Number(lateFee)

  };

};


// ============================================================
// ENSURE DEFAULT SETTINGS
// ============================================================

const ensureDefaultMaintenanceSettings = async (society) => {

  let changed = false;


  if (
    society.maintenance_amount === null ||
    society.maintenance_amount === undefined ||
    Number(society.maintenance_amount) <= 0
  ) {

    society.maintenance_amount =
      DEFAULT_MAINTENANCE_AMOUNT;

    changed = true;

  }


  if (
    society.maintenance_due_day === null ||
    society.maintenance_due_day === undefined ||
    Number(society.maintenance_due_day) < 1 ||
    Number(society.maintenance_due_day) > 28
  ) {

    society.maintenance_due_day =
      DEFAULT_DUE_DAY;

    changed = true;

  }


  if (
    society.maintenance_late_fee === null ||
    society.maintenance_late_fee === undefined ||
    Number(society.maintenance_late_fee) < 0
  ) {

    society.maintenance_late_fee =
      DEFAULT_LATE_FEE;

    changed = true;

  }


  if (changed) {

    await society.save();

  }


  return society;

};


// ============================================================
// CREATE CURRENT MONTH MAINTENANCE
//
// Resident + Admin + Manager
//
// IMPORTANT:
// Unique database index:
//
// society_id + flat_no + month + year
//
// Existing maintenance is searched using the same fields.
// ============================================================

const createCurrentMonthMaintenance = async (
  req,
  society
) => {

  const now = new Date();


  const month =
    now.getMonth() + 1;


  const year =
    now.getFullYear();


  // ==========================================================
  // SAME KEY AS DATABASE UNIQUE INDEX
  // ==========================================================

  const existingFilter = {

    society_id: society._id,

    flat_no: req.user.flat_no,

    month,

    year

  };


  // ==========================================================
  // CHECK EXISTING RECORD
  // ==========================================================

  let maintenance =
    await Maintenance.findOne(
      existingFilter
    );


  if (maintenance) {

    return maintenance;

  }


  // ==========================================================
  // GET SOCIETY SETTINGS
  // ==========================================================

  const settings =
    await getEffectiveMaintenanceSettings(
      society
    );


  // ==========================================================
  // DUE DATE
  // ==========================================================

  const dueDate =
    new Date(
      year,
      month - 1,
      settings.dueDay,
      23,
      59,
      59
    );


  // ==========================================================
  // CREATE NEW RECORD
  // ==========================================================

  try {

    maintenance =
      await Maintenance.create({

        society_id: society._id,

        user_id: req.user._id,

        flat_no: req.user.flat_no,

        month,

        year,

        amount: settings.amount,

        late_fee: 0,

        due_date: dueDate,

        status:
          dueDate < now
            ? 'overdue'
            : 'pending'

      });


    return maintenance;

  } catch (error) {

    // ========================================================
    // HANDLE RACE CONDITION
    // ========================================================

    if (error?.code === 11000) {

      const existing =
        await Maintenance.findOne(
          existingFilter
        );


      if (existing) {

        return existing;

      }

    }


    throw error;

  }

};


// ============================================================
// GET USER MAINTENANCE
// ============================================================

exports.getUserMaintenance = async (
  req,
  res
) => {

  try {

    if (isSuperAdmin(req)) {

      return res.status(200).json({

        success: true,

        count: 0,

        data: []

      });

    }


    if (!isMaintenanceUser(req)) {

      return res.status(403).json({

        success: false,

        message:
          'Maintenance is not available for this user role.'

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
      await Society.findOne({

        _id: societyId,

        is_active: true

      });


    if (!society) {

      return res.status(404).json({

        success: false,

        message:
          'Active society not found.'

      });

    }


    await ensureDefaultMaintenanceSettings(
      society
    );


    await createCurrentMonthMaintenance(
      req,
      society
    );


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
      [
        'pending',
        'paid',
        'overdue'
      ].includes(status)
    ) {

      filter.status = status;

    }


    if (month) {

      const parsedMonth =
        parseInt(month);


      if (
        Number.isInteger(parsedMonth) &&
        parsedMonth >= 1 &&
        parsedMonth <= 12
      ) {

        filter.month = parsedMonth;

      }

    }


    if (year) {

      const parsedYear =
        parseInt(year);


      if (
        Number.isInteger(parsedYear)
      ) {

        filter.year = parsedYear;

      }

    }


    const maintenance =
      await Maintenance.find(filter)
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

      message:
        'Failed to fetch maintenance records.'

    });

  }

};


// ============================================================
// GET CURRENT MONTH STATUS
// ============================================================

exports.getCurrentMonthStatus = async (
  req,
  res
) => {

  try {

    if (isSuperAdmin(req)) {

      return res.status(200).json({

        success: true,

        configured: false,

        hasMaintenance: false,

        data: null

      });

    }


    if (!isMaintenanceUser(req)) {

      return res.status(403).json({

        success: false,

        message:
          'Maintenance is not available for this user role.'

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


    let society =
      await Society.findOne({

        _id: societyId,

        is_active: true

      });


    if (!society) {

      return res.status(404).json({

        success: false,

        message:
          'Active society not found.'

      });

    }


    society =
      await ensureDefaultMaintenanceSettings(
        society
      );


    const maintenance =
      await createCurrentMonthMaintenance(
        req,
        society
      );


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

exports.getPaymentHistory = async (
  req,
  res
) => {

  try {

    if (isSuperAdmin(req)) {

      return res.status(200).json({

        success: true,

        count: 0,

        data: []

      });

    }


    if (!isMaintenanceUser(req)) {

      return res.status(403).json({

        success: false,

        message:
          'Maintenance is not available for this user role.'

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
      await Maintenance.find({

        society_id: societyId,

        user_id: req.user._id,

        status: 'paid'

      }).sort({

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
// ============================================================

exports.getAllMaintenance = async (
  req,
  res
) => {

  try {

    const {
      month,
      year,
      status,
      society_id
    } = req.query;


    const filter = {};


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
              'Invalid society ID.'

          });

        }


        filter.society_id =
          society_id;

      }

    } else {

      const currentSocietyId =
        getSocietyId(req);


      if (!currentSocietyId) {

        return res.status(400).json({

          success: false,

          message:
            'Society information is required.'

        });

      }


      filter.society_id =
        currentSocietyId;

    }


    // ========================================================
    // FILTERS
    // ========================================================

    if (month) {

      const parsedMonth =
        parseInt(month);


      if (
        Number.isInteger(parsedMonth) &&
        parsedMonth >= 1 &&
        parsedMonth <= 12
      ) {

        filter.month =
          parsedMonth;

      }

    }


    if (year) {

      const parsedYear =
        parseInt(year);


      if (
        Number.isInteger(parsedYear)
      ) {

        filter.year =
          parsedYear;

      }

    }


    if (
      status &&
      [
        'pending',
        'paid',
        'overdue'
      ].includes(status)
    ) {

      filter.status =
        status;

    }


    const maintenance =
      await Maintenance.find(filter)

        .populate(
          'user_id',
          'name email phone flat_no role society_id'
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


    const filteredMaintenance =
      maintenance.filter(
        item => {

          const role =
            item.user_id?.role;

          return [
            'resident',
            'admin',
            'manager'
          ].includes(role);

        }
      );


    return res.status(200).json({

      success: true,

      count:
        filteredMaintenance.length,

      data:
        filteredMaintenance

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
// GET PAYMENT STATS
// ============================================================

exports.getPaymentStats = async (
  req,
  res
) => {

  try {

    const {
      month,
      year,
      society_id
    } = req.query;


    const filter = {};


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
              'Invalid society ID.'

          });

        }


        filter.society_id =
          society_id;

      }

    } else {

      const currentSocietyId =
        getSocietyId(req);


      if (!currentSocietyId) {

        return res.status(400).json({

          success: false,

          message:
            'Society information is required.'

        });

      }


      filter.society_id =
        currentSocietyId;

    }


    if (month) {

      const parsedMonth =
        parseInt(month);


      if (
        Number.isInteger(parsedMonth) &&
        parsedMonth >= 1 &&
        parsedMonth <= 12
      ) {

        filter.month =
          parsedMonth;

      }

    }


    if (year) {

      const parsedYear =
        parseInt(year);


      if (
        Number.isInteger(parsedYear)
      ) {

        filter.year =
          parsedYear;

      }

    }


    const records =
      await Maintenance.find(
        filter
      );


    const userIds =
      records.map(
        record =>
          record.user_id
      );


    const validUsers =
      await User.find({

        _id: {
          $in:
            userIds
        },

        role: {
          $in: [
            'resident',
            'admin',
            'manager'
          ]
        }

      }).select('_id');


    const validUserIds =
      new Set(
        validUsers.map(
          user =>
            user._id.toString()
        )
      );


    const validRecords =
      records.filter(
        record =>
          validUserIds.has(
            record.user_id.toString()
          )
      );


    const paidRecords =
      validRecords.filter(
        item =>
          item.status === 'paid'
      );


    const pendingRecords =
      validRecords.filter(
        item =>
          item.status === 'pending'
      );


    const overdueRecords =
      validRecords.filter(
        item =>
          item.status === 'overdue'
      );


    const sum =
      (items) => {

        return items.reduce(

          (total, item) => {

            return (
              total +
              Number(
                item.total_amount || 0
              )
            );

          },

          0

        );

      };


    const paidAmount =
      sum(paidRecords);


    const pendingAmount =
      sum(pendingRecords);


    const overdueAmount =
      sum(overdueRecords);


    const totalExpected =
      sum(validRecords);


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
          society_id ||
          getSocietyId(req),

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
            validRecords.length,

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

        message:
          'Society information is required.'

      });

    }


    let society =
      await Society.findOne({

        _id: societyId,

        is_active: true

      });


    if (!society) {

      return res.status(404).json({

        success: false,

        message:
          'Active society not found.'

      });

    }


    society =
      await ensureDefaultMaintenanceSettings(
        society
      );


    return res.status(200).json({

      success: true,

      data: {

        society_id:
          society._id,

        society_name:
          society.name,

        society_code:
          society.society_code,

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

        message:
          'Society information is required.'

      });

    }


    const {
      maintenance_amount,
      maintenance_due_day,
      maintenance_late_fee
    } = req.body || {};


    let amount =
      maintenance_amount;


    if (
      amount === undefined ||
      amount === null ||
      amount === ''
    ) {

      amount =
        DEFAULT_MAINTENANCE_AMOUNT;

    }


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


    let dueDay =
      maintenance_due_day;


    if (
      dueDay === undefined ||
      dueDay === null ||
      dueDay === ''
    ) {

      dueDay =
        DEFAULT_DUE_DAY;

    }


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


    let lateFee =
      maintenance_late_fee;


    if (
      lateFee === undefined ||
      lateFee === null ||
      lateFee === ''
    ) {

      lateFee =
        DEFAULT_LATE_FEE;

    }


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

        message:
          'Society not found.'

      });

    }


    return res.status(200).json({

      success: true,

      message:
        'Maintenance settings updated successfully.',

      data: {

        society_id:
          society._id,

        society_name:
          society.name,

        society_code:
          society.society_code,

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

        society_id:
          societyId

      });


    if (!maintenance) {

      return res.status(404).json({

        success: false,

        message:
          'Maintenance record not found.'

      });

    }


    if (
      maintenance.status === 'paid'
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Paid maintenance cannot be edited.'

      });

    }


    const {
      amount,
      due_date,
      late_fee
    } = req.body || {};


    let financialChange =
      false;


    if (
      amount !== undefined
    ) {

      const newAmount =
        Number(amount);


      if (
        !Number.isFinite(
          newAmount
        ) ||
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

      financialChange =
        true;

    }


    if (
      late_fee !== undefined
    ) {

      const newLateFee =
        Number(late_fee);


      if (
        !Number.isFinite(
          newLateFee
        ) ||
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

      financialChange =
        true;

    }


    if (
      due_date !== undefined
    ) {

      const newDueDate =
        new Date(
          due_date
        );


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

      financialChange =
        true;

    }


    const now =
      new Date();


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


    if (financialChange) {

      maintenance.razorpay_order_id =
        null;

      maintenance.razorpay_payment_id =
        null;

    }


    maintenance.total_amount =
      Number(
        maintenance.amount || 0
      ) +
      Number(
        maintenance.late_fee || 0
      );


    await maintenance.save();


    return res.status(200).json({

      success: true,

      message:
        'Maintenance updated successfully.',

      data:
        maintenance

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
// ============================================================

exports.createOrder = async (
  req,
  res
) => {

  try {

    if (isSuperAdmin(req)) {

      return res.status(403).json({

        success: false,

        message:
          'Super Admin does not have personal maintenance.'

      });

    }


    if (!isMaintenanceUser(req)) {

      return res.status(403).json({

        success: false,

        message:
          'This user role cannot pay maintenance.'

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
      !isValidObjectId(
        maintenance_id
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Valid maintenance ID is required.'

      });

    }


    const maintenance =
      await Maintenance.findOne({

        _id:
          maintenance_id,

        society_id:
          societyId,

        user_id:
          req.user._id

      });


    if (!maintenance) {

      return res.status(404).json({

        success: false,

        message:
          'Maintenance record not found.'

      });

    }


    if (
      maintenance.status === 'paid'
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Maintenance is already paid.'

      });

    }


    const amount =
      Number(
        maintenance.total_amount
      );


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


    const order =
      await razorpay.orders.create({

        amount:
          Math.round(
            amount * 100
          ),

        currency:
          'INR',

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
            req.user.name || '',

          email:
            req.user.email || '',

          contact:
            req.user.phone || ''

        }

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


    let society =
      await Society.findOne({

        _id:
          societyId,

        is_active:
          true

      });


    if (!society) {

      return res.status(404).json({

        success: false,

        message:
          'Active society not found.'

      });

    }


    society =
      await ensureDefaultMaintenanceSettings(
        society
      );


    const now =
      new Date();


    const month =
      req.body?.month
        ? parseInt(
            req.body.month
          )
        : now.getMonth() + 1;


    const year =
      req.body?.year
        ? parseInt(
            req.body.year
          )
        : now.getFullYear();


    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Invalid month.'

      });

    }


    if (
      !Number.isInteger(year) ||
      year < 2000
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Invalid year.'

      });

    }


    // ========================================================
    // OPTIONAL SETTINGS
    // ========================================================

    if (
      req.body?.amount !== undefined
    ) {

      const amount =
        Number(
          req.body.amount
        );


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
      req.body?.due_day !== undefined
    ) {

      const dueDay =
        Number(
          req.body.due_day
        );


      if (
        !Number.isInteger(
          dueDay
        ) ||
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
      req.body?.late_fee !== undefined
    ) {

      const lateFee =
        Number(
          req.body.late_fee
        );


      if (
        !Number.isFinite(
          lateFee
        ) ||
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


    await society.save();


    const settings =
      await getEffectiveMaintenanceSettings(
        society
      );


    // ========================================================
    // RESIDENT + ADMIN + MANAGER
    // ========================================================

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

        is_active:
          true

      }).select(
        '_id flat_no name email role'
      );


    if (
      users.length === 0
    ) {

      return res.status(200).json({

        success: true,

        message:
          'No active residents, admins or managers found for maintenance generation.',

        data: {

          created:
            0,

          skipped:
            0,

          amount:
            settings.amount,

          late_fee:
            settings.lateFee,

          month,

          year

        }

      });

    }


    const dueDate =
      new Date(

        year,

        month - 1,

        settings.dueDay,

        23,
        59,
        59

      );


    let created =
      0;


    let skipped =
      0;


    const createdRecords =
      [];


    // ========================================================
    // CREATE RECORDS
    // ========================================================

    for (
      const user of users
    ) {

      // IMPORTANT:
      // Same fields as unique index.
      const existing =
        await Maintenance.findOne({

          society_id:
            societyId,

          flat_no:
            user.flat_no,

          month,

          year

        });


      if (existing) {

        skipped++;

        continue;

      }


      try {

        const maintenance =
          await Maintenance.create({

            society_id:
              societyId,

            user_id:
              user._id,

            flat_no:
              user.flat_no,

            month,

            year,

            amount:
              settings.amount,

            late_fee:
              0,

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

      } catch (createError) {

        if (
          createError?.code === 11000
        ) {

          skipped++;

          continue;

        }


        throw createError;

      }

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
          settings.amount,

        due_day:
          settings.dueDay,

        late_fee:
          settings.lateFee,

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
    } =
      require(
        '../jobs/maintenanceGenerator'
      );


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
      } =
        require(
          '../jobs/maintenanceGenerator'
        );


      result =
        await generateMonthlyMaintenanceJob(
          societyId
        );

    }


    return res.status(200).json({

      success: true,

      message:
        'Maintenance generation completed.',

      data:
        result

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
    } =
      require(
        '../jobs/lateFeeApplier'
      );


    const result =
      await applyLateFees(
        societyId
      );


    return res.status(200).json({

      success: true,

      message:
        'Late fee process completed.',

      data:
        result

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
    } =
      req.body || {};


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
    } =
      require(
        '../jobs/reminderSender'
      );


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

      data:
        result

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