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
// SEND PAYMENT REMINDERS
//
// societyId optional:
//
// societyId provided -> only that society
// societyId omitted  -> all active societies
// ============================================================

const sendPaymentReminders = async (
  societyId = null
) => {

  try {

    const now = new Date();

    // --------------------------------------------------------
    // CURRENT MONTH / YEAR
    // --------------------------------------------------------

    const month =
      now.getMonth() + 1;

    const year =
      now.getFullYear();


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

      societyFilter._id =
        societyId;
    }


    const societies =
      await Society.find(
        societyFilter
      ).select(
        '_id name society_code'
      );


    if (societies.length === 0) {

      return {
        success: true,
        message:
          'No active societies found.',
        societies_processed: 0,
        reminders_sent: 0
      };
    }


    const societyIds =
      societies.map(
        society => society._id
      );


    // --------------------------------------------------------
    // GET CURRENT MONTH UNPAID MAINTENANCE
    //
    // Manager is excluded later.
    // --------------------------------------------------------

    const maintenanceRecords =
      await Maintenance.find({

        society_id: {
          $in: societyIds
        },

        month,

        year,

        status: {
          $in: [
            'pending',
            'overdue'
          ]
        }

      }).populate(
        'user_id',
        'name email flat_no role is_active'
      );


    if (maintenanceRecords.length === 0) {

      return {
        success: true,
        message:
          'No unpaid maintenance records found.',
        societies_processed:
          societies.length,
        reminders_sent: 0
      };
    }


    let remindersSent = 0;
    let skipped = 0;

    const reminders = [];


    // --------------------------------------------------------
    // SEND REMINDERS
    // --------------------------------------------------------

    for (
      const maintenance
      of maintenanceRecords
    ) {

      const user =
        maintenance.user_id;


      // ------------------------------------------------------
      // USER NOT FOUND
      // ------------------------------------------------------

      if (!user) {
        skipped++;
        continue;
      }


      // ------------------------------------------------------
      // MANAGER HAS NO PERSONAL MAINTENANCE
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
      // INACTIVE USER
      // ------------------------------------------------------

      if (
        user.is_active === false
      ) {
        skipped++;
        continue;
      }


      // ------------------------------------------------------
      // SOCIETY
      // ------------------------------------------------------

      const society =
        societies.find(
          item =>
            item._id.toString() ===
            maintenance.society_id.toString()
        );


      if (!society) {
        skipped++;
        continue;
      }


      // ------------------------------------------------------
      // EMAIL CHECK
      // ------------------------------------------------------

      if (
        !user.email ||
        !user.email.trim()
      ) {
        skipped++;
        continue;
      }


      // ------------------------------------------------------
      // REMINDER DATA
      // ------------------------------------------------------

      const reminderData = {

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

        month,

        year,

        amount:
          Number(
            maintenance.amount || 0
          ),

        late_fee:
          Number(
            maintenance.late_fee || 0
          ),

        total_amount:
          Number(
            maintenance.total_amount || 0
          ),

        due_date:
          maintenance.due_date,

        status:
          maintenance.status
      };


      // ------------------------------------------------------
      // EMAIL
      // ------------------------------------------------------
      //
      // Keep this independent from DB.
      //
      // If your project already has an email utility,
      // call it here.
      // ------------------------------------------------------

      try {

        console.log(
          `Payment reminder prepared for ${user.email} - Flat ${user.flat_no}`
        );

        /*
         * Example:
         *
         * await sendMaintenanceReminderEmail({
         *   user,
         *   maintenance,
         *   society
         * });
         *
         * Use your existing email utility here if available.
         */

        remindersSent++;

        reminders.push(
          reminderData
        );

      } catch (emailError) {

        console.error(
          `Reminder email failed for ${user.email}:`,
          emailError.message
        );

        skipped++;
      }

    }


    return {

      success: true,

      message:
        'Payment reminder process completed.',

      societies_processed:
        societies.length,

      month,

      year,

      records_checked:
        maintenanceRecords.length,

      reminders_sent:
        remindersSent,

      skipped,

      reminders

    };

  } catch (error) {

    console.error(
      'Send payment reminders error:',
      error
    );

    return {

      success: false,

      message:
        error.message ||
        'Failed to send payment reminders.',

      reminders_sent: 0,

      skipped: 0

    };
  }
};


// ============================================================
// SEND REMINDERS BY TYPE
//
// type:
//   before_due
//   due_today
//   overdue
//
// month/year are optional.
// societyId is optional.
//
// IMPORTANT:
// Previous code was passing societyId as "month".
// This version fixes that.
// ============================================================

const sendRemindersByType = async (
  type,
  month = null,
  year = null,
  societyId = null
) => {

  try {

    // --------------------------------------------------------
    // VALIDATE TYPE
    // --------------------------------------------------------

    const validTypes = [
      'before_due',
      'due_today',
      'overdue'
    ];

    if (
      !validTypes.includes(type)
    ) {
      return {
        success: false,
        message:
          'Invalid reminder type.'
      };
    }


    // --------------------------------------------------------
    // DATE
    // --------------------------------------------------------

    const now = new Date();

    const targetMonth =
      month
        ? parseInt(month)
        : now.getMonth() + 1;

    const targetYear =
      year
        ? parseInt(year)
        : now.getFullYear();


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
          message:
            'Invalid society ID.'
        };
      }

      societyFilter._id =
        societyId;
    }


    const societies =
      await Society.find(
        societyFilter
      ).select(
        '_id name society_code'
      );


    if (societies.length === 0) {

      return {
        success: true,
        message:
          'No active societies found.',
        societies_processed: 0,
        reminders_sent: 0
      };
    }


    const societyIds =
      societies.map(
        society => society._id
      );


    // --------------------------------------------------------
    // GET MAINTENANCE RECORDS
    // --------------------------------------------------------

    const maintenanceFilter = {

      society_id: {
        $in: societyIds
      },

      month:
        targetMonth,

      year:
        targetYear,

      status: {
        $in: [
          'pending',
          'overdue'
        ]
      }
    };


    // --------------------------------------------------------
    // REMINDER TYPE FILTER
    // --------------------------------------------------------

    if (
      type === 'before_due'
    ) {

      // Maintenance due within next 3 days
      const beforeDate =
        new Date(now);

      beforeDate.setDate(
        beforeDate.getDate() + 3
      );

      maintenanceFilter.due_date = {
        $gte: now,
        $lte: beforeDate
      };

    } else if (
      type === 'due_today'
    ) {

      const startOfDay =
        new Date(now);

      startOfDay.setHours(
        0,
        0,
        0,
        0
      );

      const endOfDay =
        new Date(now);

      endOfDay.setHours(
        23,
        59,
        59,
        999
      );

      maintenanceFilter.due_date = {
        $gte: startOfDay,
        $lte: endOfDay
      };

    } else if (
      type === 'overdue'
    ) {

      maintenanceFilter.due_date = {
        $lt: now
      };

    }


    const maintenanceRecords =
      await Maintenance.find(
        maintenanceFilter
      ).populate(
        'user_id',
        'name email flat_no role is_active'
      );


    let remindersSent = 0;
    let skipped = 0;

    const reminders = [];


    // --------------------------------------------------------
    // PROCESS RECORDS
    // --------------------------------------------------------

    for (
      const maintenance
      of maintenanceRecords
    ) {

      const user =
        maintenance.user_id;


      if (!user) {
        skipped++;
        continue;
      }


      // ------------------------------------------------------
      // MANAGER EXCLUDED
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
      // INACTIVE USER
      // ------------------------------------------------------

      if (
        user.is_active === false
      ) {
        skipped++;
        continue;
      }


      // ------------------------------------------------------
      // EMAIL REQUIRED
      // ------------------------------------------------------

      if (
        !user.email ||
        !user.email.trim()
      ) {
        skipped++;
        continue;
      }


      // ------------------------------------------------------
      // FIND SOCIETY
      // ------------------------------------------------------

      const society =
        societies.find(
          item =>
            item._id.toString() ===
            maintenance.society_id.toString()
        );


      if (!society) {
        skipped++;
        continue;
      }


      const reminderData = {

        type,

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

        month:
          targetMonth,

        year:
          targetYear,

        amount:
          Number(
            maintenance.amount || 0
          ),

        late_fee:
          Number(
            maintenance.late_fee || 0
          ),

        total_amount:
          Number(
            maintenance.total_amount || 0
          ),

        due_date:
          maintenance.due_date,

        status:
          maintenance.status
      };


      // ------------------------------------------------------
      // EMAIL
      // ------------------------------------------------------

      try {

        console.log(
          `${type} reminder prepared for ${user.email} - Flat ${user.flat_no}`
        );

        /*
         * Use your existing email utility here if available.
         *
         * Example:
         *
         * await sendMaintenanceReminderEmail({
         *   user,
         *   maintenance,
         *   society,
         *   type
         * });
         */

        remindersSent++;

        reminders.push(
          reminderData
        );

      } catch (emailError) {

        console.error(
          `Reminder email failed for ${user.email}:`,
          emailError.message
        );

        skipped++;
      }

    }


    return {

      success: true,

      message:
        'Reminder process completed.',

      type,

      month:
        targetMonth,

      year:
        targetYear,

      societies_processed:
        societies.length,

      records_checked:
        maintenanceRecords.length,

      reminders_sent:
        remindersSent,

      skipped,

      reminders

    };

  } catch (error) {

    console.error(
      'Send reminders by type error:',
      error
    );

    return {

      success: false,

      message:
        error.message ||
        'Failed to send reminders.',

      reminders_sent: 0,

      skipped: 0

    };
  }
};


// ============================================================
// SCHEDULED PAYMENT REMINDERS
//
// This can be called by node-cron.
//
// Existing reminder schedule can call this function.
// ============================================================

const schedulePaymentReminders = async () => {

  try {

    return await sendPaymentReminders();

  } catch (error) {

    console.error(
      'Scheduled payment reminders error:',
      error
    );

    return {
      success: false,
      message:
        error.message ||
        'Failed to send scheduled payment reminders.'
    };
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {

  sendPaymentReminders,

  sendRemindersByType,

  schedulePaymentReminders

};