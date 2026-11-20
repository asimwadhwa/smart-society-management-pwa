const mongoose = require('mongoose');

const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const Society = require('../models/Society');

// ============================================================
// DEFAULT MAINTENANCE SETTINGS
// ============================================================

const DEFAULT_MAINTENANCE_AMOUNT = 1000;
const DEFAULT_DUE_DAY = 18;
const DEFAULT_LATE_FEE = 100;


// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);


/**
 * Get the previous month/year for the supplied month and year.
 */
const getPreviousMonth = (month, year) => {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
};


/**
 * Return the previous month's unpaid outstanding amount for a resident.
 * The stored total_amount is preferred because it may already include
 * earlier carry-forward and late fee. Fallback keeps older records safe.
 */
const calculateCarryForward = async (societyId, userId, month, year) => {
  const previous = getPreviousMonth(month, year);


  const previousMaintenance = await Maintenance.findOne({
    society_id: societyId,
    user_id: userId,
    month: previous.month,
    year: previous.year,
    status: { $in: ['pending', 'overdue'] }
  });


  if (!previousMaintenance) return 0;


  const storedTotal = Number(previousMaintenance.total_amount);
  if (Number.isFinite(storedTotal) && storedTotal > 0) {
    return storedTotal;
  }


  const amount = Number(previousMaintenance.amount) || 0;
  const carryForward = Number(previousMaintenance.carry_forward) || 0;
  const lateFee = Number(previousMaintenance.late_fee) || 0;
  return Math.max(0, amount + carryForward + lateFee);
};


// ============================================================
// ENSURE SOCIETY MAINTENANCE SETTINGS
// Existing societies receive defaults only when values are missing/invalid.
// ============================================================

const ensureMaintenanceSettings = async (society) => {
  let changed = false;

  if (
    society.maintenance_amount === null ||
    society.maintenance_amount === undefined ||
    Number(society.maintenance_amount) <= 0
  ) {
    society.maintenance_amount = DEFAULT_MAINTENANCE_AMOUNT;
    changed = true;
  }

  if (
    society.maintenance_due_day === null ||
    society.maintenance_due_day === undefined ||
    Number(society.maintenance_due_day) < 1 ||
    Number(society.maintenance_due_day) > 31
  ) {
  society.maintenance_due_day = DEFAULT_DUE_DAY;
  changed = true;
  }

  if (
    society.maintenance_late_fee === null ||
    society.maintenance_late_fee === undefined ||
    Number(society.maintenance_late_fee) < 0
  ) {
  society.maintenance_late_fee = DEFAULT_LATE_FEE;
  changed = true;
  }

  if (changed) await society.save();
  return society;
};


// ============================================================
// GENERATE MAINTENANCE FOR ONE SOCIETY
// ============================================================

const generateMaintenanceForSociety = async (
  societyId,
  month,
  year,
  sendEmail = true
) => {
  try {
    if (!isValidObjectId(societyId)) {
      return { success: false, message: 'Invalid society ID.', created: 0, skipped: 0 };
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return { success: false, message: 'Invalid month.', created: 0, skipped: 0 };
    }

    if (!Number.isInteger(year) || year < 2000) {
      return { success: false, message: 'Invalid year.', created: 0, skipped: 0 };
    }

    let society = await Society.findOne({ _id: societyId, is_active: true })
      .select('name society_code maintenance_amount maintenance_due_day maintenance_late_fee');

    if (!society) {
      return { success: false, message: 'Active society not found.', created: 0, skipped: 0 };
    }

    society = await ensureMaintenanceSettings(society);

    const maintenanceAmount = Number(society.maintenance_amount);
    const dueDay = Number(society.maintenance_due_day);
    const configuredLateFee = Number(society.maintenance_late_fee);

    // Clamp the configured due day to the last day of the selected month.
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const actualDueDay = Math.min(Math.max(dueDay, 1), lastDayOfMonth);
    const dueDate = new Date(year, month - 1, actualDueDay, 23, 59, 59, 999);

    const users = await User.find({
      society_id: societyId,
      role: { $in: ['resident', 'admin', 'manager'] },
      is_active: true
    }).select('_id name email flat_no role');


    if (users.length === 0) {
      return {
        success: true,
        configured: true,
        society_id: society._id,
        society_name: society.name,
        society_code: society.society_code,
        created: 0,
        skipped: 0,
        total_users: 0,
        amount: maintenanceAmount,
        due_day: actualDueDay,
        late_fee: configuredLateFee,
        month,
        year,
        records: []
      };
    }


    let created = 0;
    let skipped = 0;
    const createdRecords = [];


    for (const user of users) {
      try {
        const existing = await Maintenance.findOne({
          society_id: societyId,
          user_id: user._id,
          month,
          year
        });

        if (existing) {
          skipped++;
          continue;
        }

        const carryForward = await calculateCarryForward(
          societyId,
          user._id,
          month,
          year
        );

        // New records start as pending. The late-fee job is responsible
        // for transitioning them to overdue after the due date has passed.
        const maintenance = await Maintenance.create({
          society_id: societyId,
          user_id: user._id,
          flat_no: user.flat_no,
          month,
          year,
          amount: maintenanceAmount,
          carry_forward: carryForward,
          late_fee: 0,
          total_amount: maintenanceAmount + carryForward,
          due_date: dueDate,
          status: 'pending'
        });

        created++;
        createdRecords.push({
          id: maintenance._id,
          user_id: user._id,
          name: user.name,
          email: user.email,
          flat_no: user.flat_no,
          role: user.role,
          amount: maintenance.amount,
          carry_forward: maintenance.carry_forward,
          late_fee: maintenance.late_fee,
          total_amount: maintenance.total_amount,
          due_date: maintenance.due_date,
          status: maintenance.status
        });

        if (sendEmail) {
          try {
            console.log(
              `Maintenance generated for ${user.email} | Society: ${society.name} | ` +
              `Flat: ${user.flat_no} | Role: ${user.role} | ` +
              `Amount: ₹${maintenanceAmount} | Carry-forward: ₹${carryForward}`
            );
          } catch (emailError) {
            console.error(`Maintenance email failed for ${user.email}:`, emailError.message);
          }
        }
      } catch (userError) {
        if (userError?.code === 11000) {
          skipped++;
          console.log(`Maintenance already exists for ${user.email} - ${month}/${year}`);
          continue;
        }
        console.error(`Maintenance creation failed for ${user.email}:`, userError);
      }
    }

    return {
      success: true,
      configured: true,
      society_id: society._id,
      society_name: society.name,
      society_code: society.society_code,
      created,
      skipped,
      total_users: users.length,
      amount: maintenanceAmount,
      due_day: actualDueDay,
      late_fee: configuredLateFee,
      month,
      year,
      records: createdRecords
    };
  } catch (error) {
    console.error(`Generate maintenance error for society ${societyId}:`, error);
    return {
      success: false,
      message: error.message || 'Failed to generate maintenance.',
      created: 0,
      skipped: 0
    };
  }
};


// ============================================================
// GENERATE MONTHLY MAINTENANCE
// societyId supplied: only that society; otherwise all active societies.
// ============================================================

const generateMonthlyMaintenance = async (societyId = null) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let societies;

    if (societyId) {
      if (!isValidObjectId(societyId)) {
        return { success: false, message: 'Invalid society ID.' };
      }

      const society = await Society.findOne({ _id: societyId, is_active: true });
      if (!society) return { success: false, message: 'Active society not found.' };
      societies = [society];
    } else {
      societies = await Society.find({ is_active: true });
    }

    const results = [];
    let totalCreated = 0;
    let totalSkipped = 0;

    for (const society of societies) {
      const result = await generateMaintenanceForSociety(society._id, month, year, true);
      results.push(result);
      totalCreated += Number(result.created || 0);
      totalSkipped += Number(result.skipped || 0);
    }

    return {
      success: true,
      month,
      year,
      societies_processed: societies.length,
      total_created: totalCreated,
      total_skipped: totalSkipped,
      results
    };
  } catch (error) {
    console.error('Generate monthly maintenance job error:', error);
    return {
      success: false,
      message: error.message || 'Failed to generate monthly maintenance.'
    };
  }
};


// ============================================================
// GENERATE MAINTENANCE FOR SPECIFIC MONTH
// ============================================================

const generateMaintenanceForMonth = async (month, year, societyId = null) => {
  try {
    month = parseInt(month, 10);
    year = parseInt(year, 10);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return { success: false, message: 'Invalid month.' };
    }

    if (!Number.isInteger(year) || year < 2000) {
      return { success: false, message: 'Invalid year.' };
    }

    let societies;

    if ( societyId ) {
      if (!isValidObjectId(societyId)) {
        return { success: false, message: 'Invalid society ID.' };
      }

      const society = await Society.findOne({ _id: societyId, is_active: true });
      if (!society) return { success: false, message: 'Active society not found.' };
      societies = [society];
    } else {
      societies = await Society.find({ is_active: true });
    }

    const results = [];
    let totalCreated = 0;
    let totalSkipped = 0;

    for (const society of societies) {
      const result = await generateMaintenanceForSociety(society._id, month, year, true);
      results.push(result);
      totalCreated += Number(result.created || 0);
      totalSkipped += Number(result.skipped || 0);
    }

    return {
      success: true,
      month,
      year,
      societies_processed: societies.length,
      total_created: totalCreated,
      total_skipped: totalSkipped,
      results
    };
  } catch (error) {
    console.error('Generate maintenance for month error:', error);
    return {
      success: false,
      message: error.message || 'Failed to generate maintenance for month.'
    };
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  generateMaintenanceForSociety,
  generateMonthlyMaintenance,
  generateMaintenanceForMonth
};
