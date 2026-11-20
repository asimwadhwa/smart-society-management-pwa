
const mongoose = require('mongoose');

const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const Society = require('../models/Society');

// ============================================================
// DEFAULT LATE FEE
// ============================================================

const DEFAULT_LATE_FEE = 100;

// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ============================================================
// ENSURE SOCIETY LATE FEE
// ============================================================

const ensureSocietyLateFee = async (society) => {

  if (
    society.maintenance_late_fee === null ||
    society.maintenance_late_fee === undefined ||
    society.maintenance_late_fee === ''
  ) {
    society.maintenance_late_fee = DEFAULT_LATE_FEE;
    await society.save();
  }

  return society;
};

// ============================================================
// APPLY LATE FEES
//
// Rules:
//
// 1. Only active societies.
// 2. Only pending and overdue maintenance.
// 3. Only records whose due date has passed.
// 4. Only active residents/admin/manager.
// 5. Watchman and super_admin excluded.
// 6. Late fee is applied only once.
// 7. Total includes:
//       Maintenance Amount
//       + Carry Forward
//       + Late Fee
// 8. Paid maintenance is never modified.
// ============================================================

const applyLateFees = async (societyId = null) => {

  try {

    const now = new Date();

    // ========================================================
    // SOCIETY FILTER
    // ========================================================

    const societyFilter = {
      is_active: true
    };

    if (societyId) {

      if (!isValidObjectId(societyId)) {
        return {
          success: false,
          message: 'Invalid society ID.',
          updated: 0,
          skipped: 0
        };
      }

      societyFilter._id = societyId;
    }

    // ========================================================
    // GET ACTIVE SOCIETIES
    // ========================================================

    let societies = await Society.find(
      societyFilter
    ).select(
      '_id name society_code maintenance_amount maintenance_due_day maintenance_late_fee'
    );

    if (societies.length === 0) {

      return {
        success: true,
        message: 'No active societies found.',
        societies_processed: 0,
        records_checked: 0,
        updated: 0,
        skipped: 0
      };
    }

    // ========================================================
    // ENSURE SOCIETY LATE FEE
    // ========================================================

    const preparedSocieties = [];

    for (const society of societies) {

      const prepared = await ensureSocietyLateFee(
        society
      );

      preparedSocieties.push(prepared);
    }

    societies = preparedSocieties;

    // ========================================================
    // SOCIETY MAP
    // ========================================================

    const societyMap = new Map();

    societies.forEach((society) => {

      societyMap.set(
        society._id.toString(),
        society
      );

    });

    // ========================================================
    // SOCIETY IDS
    // ========================================================

    const societyIds = societies.map(
      society => society._id
    );

    // ========================================================
    // GET UNPAID OVERDUE MAINTENANCE
    //
    // Only:
    // pending
    // overdue
    //
    // Due date must be crossed.
    // ========================================================

    const maintenanceRecords = await Maintenance.find({

      society_id: {
        $in: societyIds
      },

      status: {
        $in: [
          'pending',
          'overdue'
        ]
      },

      due_date: {
        $lt: now
      }

    }).populate(
      'user_id',
      'name email flat_no role is_active'
    );

    // ========================================================
    // NO RECORDS
    // ========================================================

    if (maintenanceRecords.length === 0) {

      return {
        success: true,
        message: 'No unpaid maintenance records require late fees.',
        societies_processed: societies.length,
        records_checked: 0,
        updated: 0,
        skipped: 0,
        records: []
      };
    }

    // ========================================================
    // COUNTERS
    // ========================================================

    let updated = 0;
    let skipped = 0;

    const updatedRecords = [];

    // ========================================================
    // APPLY LATE FEE
    // ========================================================

    for (const maintenance of maintenanceRecords) {

      // ------------------------------------------------------
      // USER CHECK
      // ------------------------------------------------------

      const user = maintenance.user_id;

      if (!user) {

        skipped++;
        continue;
      }

      // ------------------------------------------------------
      // USER ACTIVE CHECK
      // ------------------------------------------------------

      if (user.is_active === false) {

        skipped++;
        continue;
      }

      // ------------------------------------------------------
      // ALLOWED ROLES
      // ------------------------------------------------------

      const allowedRoles = [
        'resident',
        'admin',
        'manager'
      ];

      if (!allowedRoles.includes(user.role)) {

        skipped++;
        continue;
      }

      // ------------------------------------------------------
      // SOCIETY CHECK
      // ------------------------------------------------------

      const society = societyMap.get(
        maintenance.society_id.toString()
      );

      if (!society) {

        skipped++;
        continue;
      }

      // ------------------------------------------------------
      // GET SOCIETY LATE FEE
      // ------------------------------------------------------

      let lateFee = society.maintenance_late_fee;

      if (
        lateFee === null ||
        lateFee === undefined ||
        lateFee === ''
      ) {

        lateFee = DEFAULT_LATE_FEE;

        society.maintenance_late_fee =
          DEFAULT_LATE_FEE;

        await society.save();
      }

      lateFee = Number(lateFee);

      // ------------------------------------------------------
      // VALIDATE LATE FEE
      // ------------------------------------------------------

      if (
        !Number.isFinite(lateFee) ||
        lateFee < 0
      ) {

        skipped++;
        continue;
      }

      // ------------------------------------------------------
      // CURRENT VALUES
      // ------------------------------------------------------

      const amount = Number(
        maintenance.amount || 0
      );

      const carryForward = Number(
        maintenance.carry_forward || 0
      );

      const currentLateFee = Number(
        maintenance.late_fee || 0
      );

      // ------------------------------------------------------
      // CALCULATE CORRECT TOTAL
      //
      // Maintenance
      // + Previous Month Outstanding
      // + Late Fee
      // ------------------------------------------------------

      const nextTotal =
        amount +
        carryForward +
        lateFee;

      // ------------------------------------------------------
      // CHECK IF ALREADY CORRECT
      //
      // Do not repeatedly apply late fees.
      // But fix total_amount if it is incorrect.
      // ------------------------------------------------------

      const alreadyCorrect =
        maintenance.status === 'overdue' &&
        currentLateFee === lateFee &&
        Number(maintenance.total_amount || 0) === nextTotal;

      if (alreadyCorrect) {

        skipped++;
        continue;
      }

      // ------------------------------------------------------
      // APPLY LATE FEE
      // ------------------------------------------------------

      maintenance.late_fee = lateFee;

      maintenance.total_amount = nextTotal;

      maintenance.status = 'overdue';

      await maintenance.save();

      updated++;

      // ------------------------------------------------------
      // SAVE RESULT
      // ------------------------------------------------------

      updatedRecords.push({

        maintenance_id: maintenance._id,

        society_id: society._id,

        society_name: society.name,

        society_code: society.society_code,

        user_id: user._id,

        name: user.name,

        email: user.email,

        flat_no: user.flat_no,

        role: user.role,

        amount: maintenance.amount,

        carry_forward: maintenance.carry_forward || 0,

        late_fee: maintenance.late_fee,

        total_amount: maintenance.total_amount,

        due_date: maintenance.due_date,

        status: maintenance.status

      });

      // ------------------------------------------------------
      // LOG
      // ------------------------------------------------------

      console.log(
        `Late fee applied for ${user.email} ` +
        `- Society: ${society.name} ` +
        `- Flat: ${user.flat_no} ` +
        `- Maintenance: ₹${amount} ` +
        `- Carry Forward: ₹${carryForward} ` +
        `- Late Fee: ₹${lateFee} ` +
        `- Total: ₹${nextTotal}`
      );

    }

    // ========================================================
    // RESULT
    // ========================================================

    return {

      success: true,

      message: 'Late fee process completed successfully.',

      societies_processed: societies.length,

      records_checked: maintenanceRecords.length,

      updated,

      skipped,

      records: updatedRecords

    };

  } catch (error) {

    console.error(
      'Apply late fees error:',
      error
    );

    return {

      success: false,

      message:
        error.message ||
        'Failed to apply late fees.',

      updated: 0,

      skipped: 0,

      records: []

    };
  }
};

// ============================================================
// CHECK AND APPLY LATE FEES
//
// Used by scheduled cron job.
// ============================================================

const checkAndApplyLateFees = async () => {

  try {

    return await applyLateFees();

  } catch (error) {

    console.error(
      'Check and apply late fees error:',
      error
    );

    return {

      success: false,

      message:
        error.message ||
        'Failed to check and apply late fees.'

    };
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  applyLateFees,
  checkAndApplyLateFees
};
