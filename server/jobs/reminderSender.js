const Maintenance = require('../models/Maintenance');
const emailService = require('../services/email.service');

/**
 * ============================================================
 * SEND PAYMENT REMINDERS ACROSS ALL SOCIETIES
 * ============================================================
 *
 * Day 1  -> Invoice
 * Day 10 -> Reminder
 * Day 16 -> Final Warning
 *
 * IMPORTANT:
 * Manager does NOT have personal maintenance.
 *
 * Therefore reminders are sent only to:
 * - resident
 * - admin
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

    /*
     * ==========================================================
     * DETERMINE REMINDER TYPE
     * ==========================================================
     */
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
        skippedManagers: 0,
        errors: 0,
        type: null
      };
    }

    console.log(
      `📧 Sending ${reminderType} emails across all societies...`
    );

    /*
     * ==========================================================
     * GET PENDING PAYMENTS
     * ==========================================================
     *
     * Manager is NOT filtered here by MongoDB directly because
     * user role is stored in User collection.
     *
     * We populate user_id with role and check it below.
     */
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
        'name email role is_active'
      );

    console.log(
      `Found ${pendingPayments.length} pending maintenance records`
    );

    let sent = 0;
    let skippedManagers = 0;
    let errors = 0;

    const societyStats = {};

    /*
     * ==========================================================
     * SEND REMINDERS
     * ==========================================================
     */
    for (
      const payment
      of pendingPayments
    ) {

      /*
       * ========================================================
       * CHECK USER
       * ========================================================
       */
      if (
        !payment.user_id ||
        !payment.user_id.email
      ) {
        continue;
      }

      /*
       * ========================================================
       * MANAGER CHECK
       * ========================================================
       *
       * Old Manager maintenance records will be ignored.
       */
      if (
        payment.user_id.role ===
        'manager'
      ) {

        skippedManagers++;

        console.log(
          `⏭️ Skipping reminder for manager - Flat: ${payment.flat_no}`
        );

        continue;
      }

      /*
       * ========================================================
       * ONLY RESIDENT / ADMIN
       * ========================================================
       */
      if (
        ![
          'resident',
          'admin'
        ].includes(
          payment.user_id.role
        )
      ) {

        skippedManagers++;

        console.log(
          `⏭️ Skipping reminder for role ${payment.user_id.role} - Flat: ${payment.flat_no}`
        );

        continue;
      }

      try {

        /*
         * ======================================================
         * SEND EMAIL BASED ON TYPE
         * ======================================================
         */
        switch (reminderType) {

          /*
           * ----------------------------------------------------
           * INVOICE
           * ----------------------------------------------------
           */
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


          /*
           * ----------------------------------------------------
           * NORMAL REMINDER
           * ----------------------------------------------------
           */
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

              is_overdue:
                false
            });

            break;


          /*
           * ----------------------------------------------------
           * FINAL WARNING
           * ----------------------------------------------------
           */
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

        /*
         * ======================================================
         * SOCIETY STATISTICS
         * ======================================================
         */
        const societyKey =
          payment.society_id.toString();

        if (
          !societyStats[societyKey]
        ) {
          societyStats[societyKey] = {
            sent: 0,
            skippedManagers: 0,
            errors: 0
          };
        }

        societyStats[societyKey]
          .sent++;

        console.log(
          `✅ Sent ${reminderType} to ${payment.user_id.email}`
        );

      } catch (err) {

        console.error(
          `Failed to send ${reminderType} to ${payment.user_id.email}:`,
          err.message
        );

        errors++;

        /*
         * ======================================================
         * SOCIETY ERROR STATISTICS
         * ======================================================
         */
        if (
          payment.society_id
        ) {

          const societyKey =
            payment.society_id.toString();

          if (
            !societyStats[societyKey]
          ) {
            societyStats[societyKey] = {
              sent: 0,
              skippedManagers: 0,
              errors: 0
            };
          }

          societyStats[societyKey]
            .errors++;
        }
      }
    }

    /*
     * ==========================================================
     * SUMMARY
     * ==========================================================
     */
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
      `   Manager records skipped: ${skippedManagers}`
    );

    console.log(
      `   Errors: ${errors}`
    );

    return {
      sent,

      skippedManagers,

      errors,

      type:
        reminderType,

      month:
        currentMonth,

      year:
        currentYear,

      societies:
        societyStats
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
 * ============================================================
 * SEND REMINDERS FOR SPECIFIC TYPE
 * ============================================================
 *
 * type:
 * - invoice
 * - reminder
 * - final_warning
 *
 * Manager is excluded.
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

    /*
     * ==========================================================
     * VALIDATE TYPE
     * ==========================================================
     */
    const validTypes = [
      'invoice',
      'reminder',
      'final_warning'
    ];

    if (
      !validTypes.includes(type)
    ) {
      throw new Error(
        `Unknown reminder type: ${type}`
      );
    }

    console.log(
      `📧 Manually sending ${type} emails for ${targetMonth}/${targetYear} across all societies...`
    );

    /*
     * ==========================================================
     * GET PENDING PAYMENTS
     * ==========================================================
     */
    const pendingPayments =
      await Maintenance.find({
        month:
          targetMonth,

        year:
          targetYear,

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
        'name email role is_active'
      );

    let sent = 0;
    let skippedManagers = 0;
    let errors = 0;

    const societyStats = {};

    /*
     * ==========================================================
     * PROCESS PAYMENTS
     * ==========================================================
     */
    for (
      const payment
      of pendingPayments
    ) {

      /*
       * ========================================================
       * CHECK USER
       * ========================================================
       */
      if (
        !payment.user_id ||
        !payment.user_id.email
      ) {
        continue;
      }

      /*
       * ========================================================
       * SKIP MANAGER
       * ========================================================
       */
      if (
        payment.user_id.role ===
        'manager'
      ) {

        skippedManagers++;

        console.log(
          `⏭️ Skipping manager reminder - Flat: ${payment.flat_no}`
        );

        continue;
      }

      /*
       * ========================================================
       * ONLY RESIDENT / ADMIN
       * ========================================================
       */
      if (
        ![
          'resident',
          'admin'
        ].includes(
          payment.user_id.role
        )
      ) {

        skippedManagers++;

        console.log(
          `⏭️ Skipping reminder for role ${payment.user_id.role} - Flat: ${payment.flat_no}`
        );

        continue;
      }

      try {

        /*
         * ======================================================
         * SEND EMAIL
         * ======================================================
         */
        switch (type) {

          /*
           * ----------------------------------------------------
           * INVOICE
           * ----------------------------------------------------
           */
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


          /*
           * ----------------------------------------------------
           * REMINDER
           * ----------------------------------------------------
           */
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

              is_overdue:
                false
            });

            break;


          /*
           * ----------------------------------------------------
           * FINAL WARNING
           * ----------------------------------------------------
           */
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

        /*
         * ======================================================
         * SOCIETY STATISTICS
         * ======================================================
         */
        const societyKey =
          payment.society_id.toString();

        if (
          !societyStats[societyKey]
        ) {
          societyStats[societyKey] = {
            sent: 0,
            skippedManagers: 0,
            errors: 0
          };
        }

        societyStats[societyKey]
          .sent++;

      } catch (err) {

        console.error(
          `Failed to send ${type} to ${payment.user_id.email}:`,
          err.message
        );

        errors++;

        if (
          payment.society_id
        ) {

          const societyKey =
            payment.society_id.toString();

          if (
            !societyStats[societyKey]
          ) {
            societyStats[societyKey] = {
              sent: 0,
              skippedManagers: 0,
              errors: 0
            };
          }

          societyStats[societyKey]
            .errors++;
        }
      }
    }

    /*
     * ==========================================================
     * RETURN RESULT
     * ==========================================================
     */
    return {
      sent,

      skippedManagers,

      errors,

      type,

      month:
        targetMonth,

      year:
        targetYear,

      societies:
        societyStats
    };

  } catch (error) {

    console.error(
      'Error in sendRemindersByType:',
      error
    );

    throw error;
  }
};


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */
module.exports = {
  sendPaymentReminders,
  sendRemindersByType
};