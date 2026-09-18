const Maintenance = require('../models/Maintenance');
const emailService = require('../services/email.service');

/**
 * Send payment reminders across all societies
 *
 * Day 1  -> Invoice
 * Day 10 -> Reminder
 * Day 16 -> Final Warning
 */
const sendPaymentReminders = async () => {
  try {
    const now = new Date();

    const currentDay =
      now.getDate();

    const currentMonth =
      now.getMonth() + 1;

    const currentYear =
      now.getFullYear();

    console.log(
      `📧 Checking payment reminders for Day ${currentDay}...`
    );

    let reminderType = null;

    if (currentDay === 1) {
      reminderType = 'invoice';
    } else if (currentDay === 10) {
      reminderType = 'reminder';
    } else if (currentDay === 16) {
      reminderType = 'final_warning';
    }

    if (!reminderType) {
      console.log(
        '📧 No reminders scheduled for today'
      );

      return {
        sent: 0,
        errors: 0,
        type: null
      };
    }

    console.log(
      `📧 Sending ${reminderType} emails across all societies...`
    );

    const pendingPayments =
      await Maintenance.find({
        month: currentMonth,
        year: currentYear,

        status: {
          $in: [
            'pending',
            'overdue'
          ]
        },

        society_id: {
          $exists: true,
          $ne: null
        }
      }).populate(
        'user_id',
        'name email'
      );

    console.log(
      `Found ${pendingPayments.length} pending payments`
    );

    let sent = 0;
    let errors = 0;

    const societyStats = {};

    for (const payment of pendingPayments) {
      if (
        !payment.user_id ||
        !payment.user_id.email
      ) {
        continue;
      }

      try {
        switch (reminderType) {

          case 'invoice':

            await emailService.sendMaintenanceInvoice({
              email:
                payment.user_id.email,

              name:
                payment.user_id.name,

              flat_no:
                payment.flat_no,

              amount:
                payment.total_amount,

              month:
                payment.month,

              year:
                payment.year,

              due_date:
                payment.due_date
            });

            break;


          case 'reminder':

            await emailService.sendMaintenanceReminder({
              email:
                payment.user_id.email,

              name:
                payment.user_id.name,

              flat_no:
                payment.flat_no,

              amount:
                payment.total_amount,

              month:
                payment.month,

              year:
                payment.year,

              due_date:
                payment.due_date,

              is_overdue: false
            });

            break;


          case 'final_warning':

            await emailService.sendFinalWarning({
              email:
                payment.user_id.email,

              name:
                payment.user_id.name,

              flat_no:
                payment.flat_no,

              amount:
                payment.total_amount,

              month:
                payment.month,

              year:
                payment.year,

              due_date:
                payment.due_date
            });

            break;
        }

        sent++;

        const societyKey =
          payment.society_id.toString();

        if (!societyStats[societyKey]) {
          societyStats[societyKey] = {
            sent: 0,
            errors: 0
          };
        }

        societyStats[societyKey].sent++;

        console.log(
          `✅ Sent ${reminderType} to ${payment.user_id.email}`
        );

      } catch (err) {

        console.error(
          `Failed to send ${reminderType} to ${payment.user_id.email}:`,
          err.message
        );

        errors++;

        if (payment.society_id) {
          const societyKey =
            payment.society_id.toString();

          if (!societyStats[societyKey]) {
            societyStats[societyKey] = {
              sent: 0,
              errors: 0
            };
          }

          societyStats[societyKey].errors++;
        }
      }
    }

    console.log(
      `📊 Reminder sending complete`
    );

    console.log(
      `   Type: ${reminderType}`
    );

    console.log(
      `   Sent: ${sent}`
    );

    console.log(
      `   Errors: ${errors}`
    );

    return {
      sent,
      errors,
      type: reminderType,
      month: currentMonth,
      year: currentYear,
      societies: societyStats
    };

  } catch (error) {

    console.error(
      '❌ Error in sendPaymentReminders:',
      error
    );

    throw error;
  }
};


/**
 * Send reminders for a specific type
 *
 * type:
 * invoice
 * reminder
 * final_warning
 */
const sendRemindersByType = async (
  type,
  month = null,
  year = null
) => {
  try {

    const now = new Date();

    const targetMonth =
      month ||
      now.getMonth() + 1;

    const targetYear =
      year ||
      now.getFullYear();

    const validTypes = [
      'invoice',
      'reminder',
      'final_warning'
    ];

    if (!validTypes.includes(type)) {
      throw new Error(
        `Unknown reminder type: ${type}`
      );
    }

    console.log(
      `📧 Manually sending ${type} emails for ${targetMonth}/${targetYear} across all societies...`
    );

    const pendingPayments =
      await Maintenance.find({
        month: targetMonth,
        year: targetYear,

        status: {
          $in: [
            'pending',
            'overdue'
          ]
        },

        society_id: {
          $exists: true,
          $ne: null
        }
      }).populate(
        'user_id',
        'name email'
      );

    let sent = 0;
    let errors = 0;

    const societyStats = {};

    for (const payment of pendingPayments) {

      if (
        !payment.user_id ||
        !payment.user_id.email
      ) {
        continue;
      }

      try {

        switch (type) {

          case 'invoice':

            await emailService.sendMaintenanceInvoice({
              email:
                payment.user_id.email,

              name:
                payment.user_id.name,

              flat_no:
                payment.flat_no,

              amount:
                payment.total_amount,

              month:
                payment.month,

              year:
                payment.year,

              due_date:
                payment.due_date
            });

            break;


          case 'reminder':

            await emailService.sendMaintenanceReminder({
              email:
                payment.user_id.email,

              name:
                payment.user_id.name,

              flat_no:
                payment.flat_no,

              amount:
                payment.total_amount,

              month:
                payment.month,

              year:
                payment.year,

              due_date:
                payment.due_date,

              is_overdue: false
            });

            break;


          case 'final_warning':

            await emailService.sendFinalWarning({
              email:
                payment.user_id.email,

              name:
                payment.user_id.name,

              flat_no:
                payment.flat_no,

              amount:
                payment.total_amount,

              month:
                payment.month,

              year:
                payment.year,

              due_date:
                payment.due_date
            });

            break;
        }

        sent++;

        const societyKey =
          payment.society_id.toString();

        if (!societyStats[societyKey]) {
          societyStats[societyKey] = {
            sent: 0,
            errors: 0
          };
        }

        societyStats[societyKey].sent++;

      } catch (err) {

        console.error(
          `Failed to send ${type} to ${payment.user_id.email}:`,
          err.message
        );

        errors++;

        if (payment.society_id) {

          const societyKey =
            payment.society_id.toString();

          if (!societyStats[societyKey]) {
            societyStats[societyKey] = {
              sent: 0,
              errors: 0
            };
          }

          societyStats[societyKey].errors++;
        }
      }
    }

    return {
      sent,
      errors,
      type,
      month: targetMonth,
      year: targetYear,
      societies: societyStats
    };

  } catch (error) {

    console.error(
      'Error in sendRemindersByType:',
      error
    );

    throw error;
  }
};


module.exports = {
  sendPaymentReminders,
  sendRemindersByType
};