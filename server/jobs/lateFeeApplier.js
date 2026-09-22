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
//
// Existing societies ke liye bhi:
// maintenance_late_fee = ₹100
//
// Manager/Admin baad mein settings se edit kar sakte hain.
// ============================================================

const ensureSocietyLateFee = async (society) => {

  if (
    society.maintenance_late_fee === null ||
    society.maintenance_late_fee === undefined ||
    society.maintenance_late_fee === ''
  ) {

    society.maintenance_late_fee =
      DEFAULT_LATE_FEE;

    await society.save();
  }

  return society;
};


// ============================================================
// APPLY LATE FEES
//
// societyId provided:
//   Only that society
//
// societyId omitted:
//   All active societies
//
// Applicable users:
//   Resident
//   Admin
//   Manager
//
// Not applicable:
//   Watchman
//   Super Admin
//
// Default late fee:
//   ₹100
//
// Manager/Admin can change society late fee from settings.
// ============================================================

const applyLateFees = async (
  societyId = null
) => {

  try {

    const now =
      new Date();


    // ========================================================
    // SOCIETY FILTER
    // ========================================================

    const societyFilter = {
      is_active: true
    };


    if (societyId) {

      if (
        !isValidObjectId(
          societyId
        )
      ) {

        return {

          success: false,

          message:
            'Invalid society ID.',

          updated: 0,

          skipped: 0

        };
      }


      societyFilter._id =
        societyId;
    }


    // ========================================================
    // GET ACTIVE SOCIETIES
    // ========================================================

    let societies =
      await Society.find(
        societyFilter
      ).select(
        '_id name society_code maintenance_amount maintenance_due_day maintenance_late_fee'
      );


    if (
      societies.length === 0
    ) {

      return {

        success: true,

        message:
          'No active societies found.',

        societies_processed:
          0,

        records_checked:
          0,

        updated:
          0,

        skipped:
          0

      };
    }


    // ========================================================
    // ENSURE DEFAULT LATE FEE
    // ========================================================

    const preparedSocieties = [];


    for (
      const society of societies
    ) {

      const prepared =
        await ensureSocietyLateFee(
          society
        );


      preparedSocieties.push(
        prepared
      );
    }


    societies =
      preparedSocieties;


    // ========================================================
    // SOCIETY MAP
    // ========================================================

    const societyMap =
      new Map();


    societies.forEach(
      (society) => {

        societyMap.set(

          society._id.toString(),

          society

        );

      }
    );


    // ========================================================
    // SOCIETY IDS
    // ========================================================

    const societyIds =
      societies.map(
        society =>
          society._id
      );


    // ========================================================
    // GET UNPAID OVERDUE MAINTENANCE
    //
    // IMPORTANT:
    //
    // status = pending
    // OR
    // status = overdue
    //
    // due_date already crossed.
    //
    // This also handles records which were directly created
    // as "overdue" because their due date had already passed.
    // ========================================================

    const maintenanceRecords =
      await Maintenance.find({

        society_id: {
          $in:
            societyIds
        },

        status: {
          $in: [
            'pending',
            'overdue'
          ]
        },

        due_date: {
          $lt:
            now
        }

      }).populate(

        'user_id',

        'name email flat_no role is_active'

      );


    // ========================================================
    // NO RECORDS
    // ========================================================

    if (
      maintenanceRecords.length === 0
    ) {

      return {

        success: true,

        message:
          'No unpaid maintenance records require late fees.',

        societies_processed:
          societies.length,

        records_checked:
          0,

        updated:
          0,

        skipped:
          0,

        records:
          []

      };
    }


    let updated =
      0;


    let skipped =
      0;


    const updatedRecords =
      [];


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
      // USER ACTIVE CHECK
      // ------------------------------------------------------

      if (
        user.is_active === false
      ) {

        skipped++;

        continue;
      }


      // ------------------------------------------------------
      // ALLOWED ROLES
      //
      // Resident
      // Admin
      // Manager
      // ------------------------------------------------------

      if (
        ![
          'resident',
          'admin',
          'manager'
        ].includes(
          user.role
        )
      ) {

        skipped++;

        continue;
      }


      // ------------------------------------------------------
      // SOCIETY
      // ------------------------------------------------------

      const society =
        societyMap.get(

          maintenance
            .society_id
            .toString()

        );


      if (!society) {

        skipped++;

        continue;
      }


      // ------------------------------------------------------
      // GET SOCIETY LATE FEE
      //
      // Default = ₹100
      // ------------------------------------------------------

      let lateFee =
        society.maintenance_late_fee;


      if (
        lateFee === null ||
        lateFee === undefined ||
        lateFee === ''
      ) {

        lateFee =
          DEFAULT_LATE_FEE;

        society.maintenance_late_fee =
          DEFAULT_LATE_FEE;

        await society.save();

      }


      lateFee =
        Number(
          lateFee
        );


      // ------------------------------------------------------
      // VALIDATE LATE FEE
      // ------------------------------------------------------

      if (
        !Number.isFinite(
          lateFee
        ) ||
        lateFee < 0
      ) {

        skipped++;

        continue;
      }


      // ------------------------------------------------------
      // ALREADY HAS LATE FEE
      //
      // Do not repeatedly add late fee.
      //
      // Example:
      //
      // Amount = ₹1000
      // Late Fee = ₹100
      // Total = ₹1100
      //
      // Next cron run should NOT become ₹1200.
      // ------------------------------------------------------

      const currentLateFee =
        Number(
          maintenance.late_fee || 0
        );


      if (
        maintenance.status === 'overdue' &&
        currentLateFee === lateFee
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


      // ------------------------------------------------------
      // SAVE RESULT
      // ------------------------------------------------------

      updatedRecords.push({

        maintenance_id:
          maintenance._id,

        society_id:
          society._id,

        society_name:
          society.name,

        society_code:
          society.society_code,

        user_id:
          user._id,

        name:
          user.name,

        email:
          user.email,

        flat_no:
          user.flat_no,

        role:
          user.role,

        amount:
          maintenance.amount,

        late_fee:
          maintenance.late_fee,

        total_amount:
          maintenance.total_amount,

        due_date:
          maintenance.due_date,

        status:
          maintenance.status

      });


      // ------------------------------------------------------
      // EMAIL
      // ------------------------------------------------------

      try {

        console.log(

          `Late fee applied for ${user.email} ` +
          `- Society: ${society.name} ` +
          `- Flat: ${user.flat_no} ` +
          `- Role: ${user.role} ` +
          `- Late Fee: ₹${lateFee}`

        );

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

const checkAndApplyLateFees =
  async () => {

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