const mongoose = require('mongoose');

const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const Society = require('../models/Society');


// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};


// ============================================================
// APPLY LATE FEES
//
// societyId optional:
//
// societyId provided  -> only that society
// societyId omitted   -> all active societies
//
// Late fee comes from Society settings.
// NO hardcoded ₹100.
// ============================================================

const applyLateFees = async (
  societyId = null
) => {

  try {

    const now = new Date();

    // --------------------------------------------------------
    // SOCIETY FILTER
    // --------------------------------------------------------

    const societyFilter = {
      is_active: true
    };

    if (societyId) {

      if (!isValidObjectId(societyId)) {
        return {
          success: false,
          message: 'Invalid society ID.'
        };
      }

      societyFilter._id = societyId;
    }

    const societies =
      await Society.find(
        societyFilter
      ).select(
        '_id name society_code maintenance_late_fee'
      );

    if (societies.length === 0) {
      return {
        success: true,
        message: 'No active societies found.',
        societies_processed: 0,
        updated: 0,
        skipped: 0
      };
    }

    const societyMap = new Map();

    societies.forEach((society) => {

      societyMap.set(
        society._id.toString(),
        society
      );

    });


    // --------------------------------------------------------
    // GET PENDING MAINTENANCE
    //
    // Manager records are excluded later.
    // --------------------------------------------------------

    const societyIds =
      societies.map(
        society => society._id
      );

    const maintenanceRecords =
      await Maintenance.find({
        society_id: {
          $in: societyIds
        },

        status: 'pending',

        due_date: {
          $lt: now
        }
      }).populate(
        'user_id',
        'name email flat_no role is_active'
      );


    if (maintenanceRecords.length === 0) {

      return {
        success: true,
        message:
          'No pending maintenance records require late fees.',
        societies_processed:
          societies.length,
        records_checked: 0,
        updated: 0,
        skipped: 0
      };
    }


    let updated = 0;
    let skipped = 0;

    const updatedRecords = [];


    // ========================================================
    // APPLY LATE FEE
    // ========================================================

    for (
      const maintenance
      of maintenanceRecords
    ) {

      // ------------------------------------------------------
      // USER CHECK
      // ------------------------------------------------------

      const user =
        maintenance.user_id;

      if (!user) {
        skipped++;
        continue;
      }


      // ------------------------------------------------------
      // MANAGER SHOULD NEVER HAVE PERSONAL MAINTENANCE
      // ------------------------------------------------------

      if (
        user.role === 'manager'
      ) {

        skipped++;
        continue;
      }


      // ------------------------------------------------------
      // ONLY RESIDENT / ADMIN
      // ------------------------------------------------------

      if (
        ![
          'resident',
          'admin'
        ].includes(user.role)
      ) {

        skipped++;
        continue;
      }


      // ------------------------------------------------------
      // SOCIETY
      // ------------------------------------------------------

      const society =
        societyMap.get(
          maintenance.society_id.toString()
        );

      if (!society) {
        skipped++;
        continue;
      }


      // ------------------------------------------------------
      // GET LATE FEE FROM SOCIETY SETTINGS
      // ------------------------------------------------------

      let lateFee =
        society.maintenance_late_fee;


      if (
        lateFee === null ||
        lateFee === undefined ||
        lateFee === ''
      ) {
        lateFee = 0;
      }


      lateFee =
        Number(lateFee);


      if (
        !Number.isFinite(lateFee) ||
        lateFee < 0
      ) {
        skipped++;
        continue;
      }


      // ------------------------------------------------------
      // APPLY LATE FEE
      // ------------------------------------------------------

      maintenance.late_fee =
        lateFee;


      maintenance.total_amount =
        Number(
          maintenance.amount || 0
        ) +
        lateFee;


      maintenance.status =
        'overdue';


      await maintenance.save();


      updated++;


      updatedRecords.push({
        maintenance_id:
          maintenance._id,

        society_id:
          society._id,

        society_name:
          society.name,

        user_id:
          user._id,

        name:
          user.name,

        email:
          user.email,

        flat_no:
          user.flat_no,

        amount:
          maintenance.amount,

        late_fee:
          maintenance.late_fee,

        total_amount:
          maintenance.total_amount,

        status:
          maintenance.status
      });


      // ------------------------------------------------------
      // EMAIL
      // ------------------------------------------------------
      //
      // Keep email sending independent from database update.
      // ------------------------------------------------------

      try {

        console.log(
          `Late fee applied for ${user.email} - Flat ${user.flat_no}`
        );

        /*
         * If your existing project already has an email
         * utility for late-fee notifications, call it here.
         *
         * Database update does not depend on email success.
         */

      } catch (emailError) {

        console.error(
          `Late fee email failed for ${user.email}:`,
          emailError.message
        );

      }

    }


    // ========================================================
    // RESULT
    // ========================================================

    return {
      success: true,

      message:
        'Late fee process completed successfully.',

      societies_processed:
        societies.length,

      records_checked:
        maintenanceRecords.length,

      updated,

      skipped,

      records:
        updatedRecords
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

      skipped: 0
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