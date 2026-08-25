const cron = require('node-cron');

// Import job handlers
const { generateMonthlyMaintenance } = require('./maintenanceGenerator');
const { applyLateFees } = require('./lateFeeApplier');
const { sendPaymentReminders } = require('./reminderSender');

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
  console.log('📅 Initializing cron jobs...');
  
  // Generate maintenance records on 1st of every month at midnight
  // Schedule: '0 0 1 * *' = At 00:00 on day-of-month 1
  cron.schedule('0 0 1 * *', async () => {
    console.log('🔄 Running: Generate monthly maintenance records');
    try {
      await generateMonthlyMaintenance();
    } catch (err) {
      console.error('Cron job failed - generateMonthlyMaintenance:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
  
  // Apply late fees daily at midnight
  // Schedule: '0 0 * * *' = At 00:00 every day
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Running: Apply late fees to overdue payments');
    try {
      await applyLateFees();
    } catch (err) {
      console.error('Cron job failed - applyLateFees:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
  
  // Send payment reminders daily at 9 AM
  // Schedule: '0 9 * * *' = At 09:00 every day
  cron.schedule('0 9 * * *', async () => {
    console.log('🔄 Running: Send payment reminders');
    try {
      await sendPaymentReminders();
    } catch (err) {
      console.error('Cron job failed - sendPaymentReminders:', err.message);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
  
  console.log('✅ Cron jobs initialized:');
  console.log('   - Monthly maintenance generation: 1st of month at 00:00');
  console.log('   - Late fee application: Daily at 00:00');
  console.log('   - Payment reminders: Daily at 09:00');
};

module.exports = initCronJobs;
