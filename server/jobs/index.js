const cron = require('node-cron');

// ============================================================
// IMPORT JOB HANDLERS
// ============================================================

const {
  generateMonthlyMaintenance
} = require('./maintenanceGenerator');

const {
  applyLateFees
} = require('./lateFeeApplier');

const {
  sendPaymentReminders
} = require('./reminderSender');


// ============================================================
// INITIALIZE ALL CRON JOBS
// ============================================================

const initCronJobs = () => {

  console.log(
    '📅 Initializing cron jobs...'
  );


  // ==========================================================
  // 1. MONTHLY MAINTENANCE GENERATION
  // ==========================================================
  //
  // Runs:
  // Every month on 1st day at 00:00
  //
  // IMPORTANT:
  // generateMonthlyMaintenance() now:
  //
  // - Checks every active society
  // - Uses society.maintenance_amount
  // - Uses society.maintenance_due_day
  // - Does NOT use default ₹1000
  // - Generates only for resident/admin
  // - Does NOT generate for manager
  // - Skips societies where amount is not configured
  //
  // ==========================================================

  cron.schedule(
    '0 0 1 * *',
    async () => {

      console.log(
        '🔄 Running: Generate monthly maintenance records'
      );

      try {

        const result =
          await generateMonthlyMaintenance();

        console.log(
          '✅ Monthly maintenance generation completed:',
          result
        );

      } catch (err) {

        console.error(
          '❌ Cron job failed - generateMonthlyMaintenance:',
          err.message
        );

      }

    },
    {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    }
  );


  // ==========================================================
  // 2. APPLY LATE FEES
  // ==========================================================
  //
  // Runs:
  // Every day at 00:00
  //
  // IMPORTANT:
  // Late fee is taken from each society's:
  //
  // maintenance_late_fee
  //
  // No hardcoded ₹100.
  //
  // Manager personal maintenance is ignored.
  //
  // ==========================================================

  cron.schedule(
    '0 0 * * *',
    async () => {

      console.log(
        '🔄 Running: Apply late fees to overdue payments'
      );

      try {

        const result =
          await applyLateFees();

        console.log(
          '✅ Late fee process completed:',
          result
        );

      } catch (err) {

        console.error(
          '❌ Cron job failed - applyLateFees:',
          err.message
        );

      }

    },
    {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    }
  );


  // ==========================================================
  // 3. PAYMENT REMINDERS
  // ==========================================================
  //
  // Runs:
  // Every day at 09:00
  //
  // Sends reminders only to:
  // - Resident
  // - Admin
  //
  // Manager is excluded.
  //
  // ==========================================================

  cron.schedule(
    '0 9 * * *',
    async () => {

      console.log(
        '🔄 Running: Send payment reminders'
      );

      try {

        const result =
          await sendPaymentReminders();

        console.log(
          '✅ Payment reminder process completed:',
          result
        );

      } catch (err) {

        console.error(
          '❌ Cron job failed - sendPaymentReminders:',
          err.message
        );

      }

    },
    {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    }
  );


  // ==========================================================
  // CRON INITIALIZATION COMPLETE
  // ==========================================================

  console.log(
    '✅ Cron jobs initialized:'
  );

  console.log(
    '   - Monthly maintenance generation: 1st of month at 00:00'
  );

  console.log(
    '   - Late fee application: Daily at 00:00'
  );

  console.log(
    '   - Payment reminders: Daily at 09:00'
  );

};


// ============================================================
// EXPORT
// ============================================================

module.exports =
  initCronJobs;