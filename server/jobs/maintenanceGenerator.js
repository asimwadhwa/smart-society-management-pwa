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
      return {
        success: false,
        message: 'Invalid society ID.',
        created: 0,
        skipped: 0
      };
    }

    // --------------------------------------------------------
    // GET SOCIETY SETTINGS
    // --------------------------------------------------------

    const society =
      await Society.findOne({
        _id: societyId,
        is_active: true
      }).select(
        'name society_code maintenance_amount maintenance_due_day maintenance_late_fee'
      );

    if (!society) {
      return {
        success: false,
        message: 'Active society not found.',
        created: 0,
        skipped: 0
      };
    }

    // --------------------------------------------------------
    // NO DEFAULT ₹1000
    // --------------------------------------------------------

    if (
      society.maintenance_amount === null ||
      society.maintenance_amount === undefined ||
      Number(society.maintenance_amount) <= 0
    ) {

      console.log(
        `Maintenance skipped for ${society.name}: amount not configured.`
      );

      return {
        success: false,
        configured: false,
        skipped: true,
        message:
          'Maintenance amount is not configured.',
        society_id: society._id,
        society_name: society.name,
        created: 0,
        skipped: 0
      };
    }

    // --------------------------------------------------------
    // DUE DAY
    // --------------------------------------------------------

    const dueDay =
      society.maintenance_due_day || 18;

    // --------------------------------------------------------
    // LATE FEE
    // --------------------------------------------------------

    const configuredLateFee =
      society.maintenance_late_fee === null ||
      society.maintenance_late_fee === undefined
        ? 0
        : Number(
            society.maintenance_late_fee
          );

    // --------------------------------------------------------
    // VALIDATE MONTH / YEAR
    // --------------------------------------------------------

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return {
        success: false,
        message: 'Invalid month.',
        created: 0,
        skipped: 0
      };
    }

    if (
      !Number.isInteger(year) ||
      year < 2000
    ) {
      return {
        success: false,
        message: 'Invalid year.',
        created: 0,
        skipped: 0
      };
    }

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
    // GET RESIDENTS + ADMINS
    //
    // IMPORTANT:
    // MANAGER IS NOT INCLUDED
    // WATCHMAN IS NOT INCLUDED
    // SUPER ADMIN IS NOT INCLUDED
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
        '_id name email flat_no role'
      );

    if (users.length === 0) {

      return {
        success: true,
        configured: true,
        society_id: society._id,
        society_name: society.name,
        created: 0,
        skipped: 0,
        total_users: 0,
        amount:
          Number(
            society.maintenance_amount
          ),
        due_day: dueDay,
        late_fee: configuredLateFee,
        month,
        year
      };
    }

    let created = 0;
    let skipped = 0;

    const createdRecords = [];

    // --------------------------------------------------------
    // CREATE MAINTENANCE
    // --------------------------------------------------------

    for (const user of users) {

      // ------------------------------------------------------
      // CHECK EXISTING RECORD
      // ------------------------------------------------------

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

      // ------------------------------------------------------
      // CREATE RECORD
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
            Number(
              society.maintenance_amount
            ),

          // Initial maintenance does not have late fee.
          // Late fee will be applied by lateFeeApplier job.
          late_fee: 0,

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

        amount:
          maintenance.amount,

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

          /*
           * Email sending can be handled by your existing
           * email utility if already present.
           *
           * This job does not depend on email success.
           */

          console.log(
            `Maintenance generated for ${user.email} - Flat ${user.flat_no}`
          );

        } catch (emailError) {

          console.error(
            `Maintenance email failed for ${user.email}:`,
            emailError.message
          );

        }

      }

    }

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
        Number(
          society.maintenance_amount
        ),

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
// If societyId is provided:
//   Generate ONLY for that society.
//
// If societyId is not provided:
//   Generate for ALL active societies.
//
// This is important for multi-society system.
// ============================================================

const generateMonthlyMaintenance = async (
  societyId = null
) => {

  try {

    const now = new Date();

    const month =
      now.getMonth() + 1;

    const year =
      now.getFullYear();

    let societies;

    // --------------------------------------------------------
    // ONE SOCIETY
    // --------------------------------------------------------

    if (societyId) {

      if (!isValidObjectId(societyId)) {
        return {
          success: false,
          message: 'Invalid society ID.'
        };
      }

      const society =
        await Society.findOne({
          _id: societyId,
          is_active: true
        });

      if (!society) {
        return {
          success: false,
          message:
            'Active society not found.'
        };
      }

      societies = [society];

    }

    // --------------------------------------------------------
    // ALL SOCIETIES
    // --------------------------------------------------------

    else {

      societies =
        await Society.find({
          is_active: true
        });

    }

    const results = [];

    let totalCreated = 0;
    let totalSkipped = 0;

    // --------------------------------------------------------
    // GENERATE FOR EACH SOCIETY
    // --------------------------------------------------------

    for (const society of societies) {

      const result =
        await generateMaintenanceForSociety(
          society._id,
          month,
          year,
          true
        );

      results.push(result);

      totalCreated +=
        Number(result.created || 0);

      totalSkipped +=
        Number(result.skipped || 0);
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
// societyId optional.
//
// IMPORTANT:
// Previously the societyId argument was ignored.
// Now it correctly scopes generation.
// ============================================================

const generateMaintenanceForMonth = async (
  month,
  year,
  societyId = null
) => {

  try {

    month =
      parseInt(month);

    year =
      parseInt(year);

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return {
        success: false,
        message: 'Invalid month.'
      };
    }

    if (
      !Number.isInteger(year) ||
      year < 2000
    ) {
      return {
        success: false,
        message: 'Invalid year.'
      };
    }

    let societies;

    // --------------------------------------------------------
    // ONE SOCIETY
    // --------------------------------------------------------

    if (societyId) {

      if (!isValidObjectId(societyId)) {
        return {
          success: false,
          message: 'Invalid society ID.'
        };
      }

      const society =
        await Society.findOne({
          _id: societyId,
          is_active: true
        });

      if (!society) {
        return {
          success: false,
          message:
            'Active society not found.'
        };
      }

      societies = [society];

    }

    // --------------------------------------------------------
    // ALL ACTIVE SOCIETIES
    // --------------------------------------------------------

    else {

      societies =
        await Society.find({
          is_active: true
        });

    }

    const results = [];

    let totalCreated = 0;
    let totalSkipped = 0;

    // --------------------------------------------------------
    // GENERATE
    // --------------------------------------------------------

    for (const society of societies) {

      const result =
        await generateMaintenanceForSociety(
          society._id,
          month,
          year,
          true
        );

      results.push(result);

      totalCreated +=
        Number(result.created || 0);

      totalSkipped +=
        Number(result.skipped || 0);
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