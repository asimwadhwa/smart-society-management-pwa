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

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};


// ============================================================
// ENSURE SOCIETY MAINTENANCE SETTINGS
//
// Existing societies ke liye bhi default values set karega.
//
// Maintenance = ₹1000
// Due Day = 18
// Late Fee = ₹100
// ============================================================

const ensureMaintenanceSettings = async (society) => {

  let changed = false;


  // ----------------------------------------------------------
  // MAINTENANCE AMOUNT
  // ----------------------------------------------------------

  if (
    society.maintenance_amount === null ||
    society.maintenance_amount === undefined ||
    Number(society.maintenance_amount) <= 0
  ) {

    society.maintenance_amount =
      DEFAULT_MAINTENANCE_AMOUNT;

    changed = true;
  }


  // ----------------------------------------------------------
  // DUE DAY
  // ----------------------------------------------------------

  if (
    society.maintenance_due_day === null ||
    society.maintenance_due_day === undefined ||
    Number(society.maintenance_due_day) < 1
  ) {

    society.maintenance_due_day =
      DEFAULT_DUE_DAY;

    changed = true;
  }


  // ----------------------------------------------------------
  // LATE FEE
  // ----------------------------------------------------------

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
// GENERATE MAINTENANCE FOR ONE SOCIETY
// ============================================================

const generateMaintenanceForSociety = async (
  societyId,
  month,
  year,
  sendEmail = true
) => {

  try {

    // --------------------------------------------------------
    // VALIDATE SOCIETY ID
    // --------------------------------------------------------

    if (
      !isValidObjectId(societyId)
    ) {

      return {

        success: false,

        message:
          'Invalid society ID.',

        created: 0,

        skipped: 0

      };
    }


    // --------------------------------------------------------
    // VALIDATE MONTH
    // --------------------------------------------------------

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {

      return {

        success: false,

        message:
          'Invalid month.',

        created: 0,

        skipped: 0

      };
    }


    // --------------------------------------------------------
    // VALIDATE YEAR
    // --------------------------------------------------------

    if (
      !Number.isInteger(year) ||
      year < 2000
    ) {

      return {

        success: false,

        message:
          'Invalid year.',

        created: 0,

        skipped: 0

      };
    }


    // --------------------------------------------------------
    // GET ACTIVE SOCIETY
    // --------------------------------------------------------

    let society =
      await Society.findOne({

        _id:
          societyId,

        is_active:
          true

      }).select(

        'name society_code maintenance_amount maintenance_due_day maintenance_late_fee'

      );


    if (!society) {

      return {

        success: false,

        message:
          'Active society not found.',

        created: 0,

        skipped: 0

      };
    }


    // --------------------------------------------------------
    // ENSURE DEFAULT SETTINGS
    // --------------------------------------------------------

    society =
      await ensureMaintenanceSettings(
        society
      );


    const maintenanceAmount =
      Number(
        society.maintenance_amount
      );


    const dueDay =
      Number(
        society.maintenance_due_day
      );


    const configuredLateFee =
      Number(
        society.maintenance_late_fee
      );


    // --------------------------------------------------------
    // DUE DATE
    // --------------------------------------------------------

    const dueDate =
      new Date(

        year,

        month - 1,

        dueDay,

        23,

        59,

        59

      );


    // --------------------------------------------------------
    // GET USERS
    //
    // IMPORTANT:
    //
    // RESIDENT  -> INCLUDED
    // ADMIN     -> INCLUDED
    // MANAGER   -> INCLUDED
    //
    // WATCHMAN  -> NOT INCLUDED
    // SUPER ADMIN -> NOT INCLUDED
    //
    // Same society only.
    // --------------------------------------------------------

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

        '_id name email flat_no role'

      );


    // --------------------------------------------------------
    // NO USERS
    // --------------------------------------------------------

    if (
      users.length === 0
    ) {

      return {

        success: true,

        configured: true,

        society_id:
          society._id,

        society_name:
          society.name,

        society_code:
          society.society_code,

        created: 0,

        skipped: 0,

        total_users: 0,

        amount:
          maintenanceAmount,

        due_day:
          dueDay,

        late_fee:
          configuredLateFee,

        month,

        year,

        records: []

      };
    }


    let created =
      0;


    let skipped =
      0;


    const createdRecords =
      [];


    // --------------------------------------------------------
    // CREATE MAINTENANCE
    // --------------------------------------------------------

    for (
      const user of users
    ) {

      try {

        // ------------------------------------------------------
        // CHECK EXISTING RECORD
        // ------------------------------------------------------

        const existing =
          await Maintenance.findOne({

            society_id:
              societyId,

            user_id:
              user._id,

            month,

            year

          });


        if (existing) {

          skipped++;

          continue;
        }


        // ------------------------------------------------------
        // CREATE NEW MAINTENANCE
        //
        // Late fee initially 0.
        //
        // After due date:
        // lateFeeApplier will apply society's late fee.
        // ------------------------------------------------------

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
              maintenanceAmount,

            late_fee:
              0,

            due_date:
              dueDate,

            status:
              dueDate < new Date()
                ? 'overdue'
                : 'pending'

          });


        created++;


        createdRecords.push({

          id:
            maintenance._id,

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
        // OPTIONAL EMAIL
        // ------------------------------------------------------

        if (sendEmail) {

          try {

            console.log(

              `Maintenance generated for ${user.email} ` +
              `- Society: ${society.name} ` +
              `- Flat: ${user.flat_no} ` +
              `- Role: ${user.role} ` +
              `- Amount: ₹${maintenanceAmount}`

            );

          } catch (emailError) {

            console.error(

              `Maintenance email failed for ${user.email}:`,

              emailError.message

            );

          }

        }

      } catch (userError) {

        // ------------------------------------------------------
        // DUPLICATE RECORD SAFETY
        // ------------------------------------------------------

        if (
          userError?.code === 11000
        ) {

          skipped++;

          console.log(

            `Maintenance already exists for ` +
            `${user.email} - ${month}/${year}`

          );

          continue;
        }


        console.error(

          `Maintenance creation failed for ${user.email}:`,

          userError

        );

      }

    }


    // --------------------------------------------------------
    // RESULT
    // --------------------------------------------------------

    return {

      success: true,

      configured: true,

      society_id:
        society._id,

      society_name:
        society.name,

      society_code:
        society.society_code,

      created,

      skipped,

      total_users:
        users.length,

      amount:
        maintenanceAmount,

      due_day:
        dueDay,

      late_fee:
        configuredLateFee,

      month,

      year,

      records:
        createdRecords

    };

  } catch (error) {

    console.error(

      `Generate maintenance error for society ${societyId}:`,

      error

    );


    return {

      success: false,

      message:
        error.message ||
        'Failed to generate maintenance.',

      created: 0,

      skipped: 0

    };
  }
};


// ============================================================
// GENERATE MONTHLY MAINTENANCE
//
// societyId provided:
//   Only that society.
//
// societyId not provided:
//   All active societies.
//
// Cron:
//   All active societies.
//
// Manager/Admin manual generation:
//   Their own society only.
// ============================================================

const generateMonthlyMaintenance = async (
  societyId = null
) => {

  try {

    const now =
      new Date();


    const month =
      now.getMonth() + 1;


    const year =
      now.getFullYear();


    let societies;


    // --------------------------------------------------------
    // ONE SOCIETY
    // --------------------------------------------------------

    if (societyId) {

      if (
        !isValidObjectId(
          societyId
        )
      ) {

        return {

          success: false,

          message:
            'Invalid society ID.'

        };
      }


      const society =
        await Society.findOne({

          _id:
            societyId,

          is_active:
            true

        });


      if (!society) {

        return {

          success: false,

          message:
            'Active society not found.'

        };
      }


      societies = [
        society
      ];

    }

    // --------------------------------------------------------
    // ALL ACTIVE SOCIETIES
    // --------------------------------------------------------

    else {

      societies =
        await Society.find({

          is_active:
            true

        });

    }


    const results =
      [];


    let totalCreated =
      0;


    let totalSkipped =
      0;


    // --------------------------------------------------------
    // GENERATE FOR EACH SOCIETY
    // --------------------------------------------------------

    for (
      const society of societies
    ) {

      const result =
        await generateMaintenanceForSociety(

          society._id,

          month,

          year,

          true

        );


      results.push(
        result
      );


      totalCreated +=
        Number(
          result.created || 0
        );


      totalSkipped +=
        Number(
          result.skipped || 0
        );

    }


    return {

      success: true,

      month,

      year,

      societies_processed:
        societies.length,

      total_created:
        totalCreated,

      total_skipped:
        totalSkipped,

      results

    };

  } catch (error) {

    console.error(

      'Generate monthly maintenance job error:',

      error

    );


    return {

      success: false,

      message:
        error.message ||
        'Failed to generate monthly maintenance.'

    };
  }
};


// ============================================================
// GENERATE MAINTENANCE FOR SPECIFIC MONTH
//
// month/year required.
//
// societyId provided:
//   Only that society.
//
// societyId not provided:
//   All active societies.
// ============================================================

const generateMaintenanceForMonth = async (
  month,
  year,
  societyId = null
) => {

  try {

    month =
      parseInt(
        month
      );


    year =
      parseInt(
        year
      );


    // --------------------------------------------------------
    // VALIDATE MONTH
    // --------------------------------------------------------

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {

      return {

        success: false,

        message:
          'Invalid month.'

      };
    }


    // --------------------------------------------------------
    // VALIDATE YEAR
    // --------------------------------------------------------

    if (
      !Number.isInteger(year) ||
      year < 2000
    ) {

      return {

        success: false,

        message:
          'Invalid year.'

      };
    }


    let societies;


    // --------------------------------------------------------
    // ONE SOCIETY
    // --------------------------------------------------------

    if (societyId) {

      if (
        !isValidObjectId(
          societyId
        )
      ) {

        return {

          success: false,

          message:
            'Invalid society ID.'

        };
      }


      const society =
        await Society.findOne({

          _id:
            societyId,

          is_active:
            true

        });


      if (!society) {

        return {

          success: false,

          message:
            'Active society not found.'

        };
      }


      societies = [
        society
      ];

    }

    // --------------------------------------------------------
    // ALL ACTIVE SOCIETIES
    // --------------------------------------------------------

    else {

      societies =
        await Society.find({

          is_active:
            true

        });

    }


    const results =
      [];


    let totalCreated =
      0;


    let totalSkipped =
      0;


    // --------------------------------------------------------
    // GENERATE
    // --------------------------------------------------------

    for (
      const society of societies
    ) {

      const result =
        await generateMaintenanceForSociety(

          society._id,

          month,

          year,

          true

        );


      results.push(
        result
      );


      totalCreated +=
        Number(
          result.created || 0
        );


      totalSkipped +=
        Number(
          result.skipped || 0
        );

    }


    return {

      success: true,

      month,

      year,

      societies_processed:
        societies.length,

      total_created:
        totalCreated,

      total_skipped:
        totalSkipped,

      results

    };

  } catch (error) {

    console.error(

      'Generate maintenance for month error:',

      error

    );


    return {

      success: false,

      message:
        error.message ||
        'Failed to generate maintenance for month.'

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