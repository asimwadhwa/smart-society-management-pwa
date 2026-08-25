const Maintenance = require('../models/Maintenance');
const emailService = require('../services/email.service');

/**
 * Send payment reminders based on the day of month
 * Runs daily at 9 AM
 * 
 * Day 1: Send invoice email to all pending payments
 * Day 10: Send reminder email
 * Day 16: Send final warning email (before late fee on day 18)
 */
const sendPaymentReminders = async () => {
  try {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    console.log(`📧 Checking for payment reminders (Day ${currentDay})...`);
    
    // Determine what type of reminder to send based on day of month
    let reminderType = null;
    
    if (currentDay === 1) {
      reminderType = 'invoice';
    } else if (currentDay === 10) {
      reminderType = 'reminder';
    } else if (currentDay === 16) {
      reminderType = 'final_warning';
    }
    
    if (!reminderType) {
      console.log('📧 No reminders scheduled for today');
      return { sent: 0, type: null };
    }
    
    console.log(`📧 Sending ${reminderType} emails...`);
    
    // Find all pending payments for current month
    const pendingPayments = await Maintenance.find({
      month: currentMonth,
      year: currentYear,
      status: { $in: ['pending', 'overdue'] }
    }).populate('user_id', 'name email');
    
    console.log(`Found ${pendingPayments.length} pending payments`);
    
    let sent = 0;
    let errors = 0;
    
    for (const payment of pendingPayments) {
      if (!payment.user_id || !payment.user_id.email) {
        console.log(`⏭️ Skipping flat ${payment.flat_no} - no user/email found`);
        continue;
      }
      
      try {
        switch (reminderType) {
          case 'invoice':
            await emailService.sendMaintenanceInvoice({
              email: payment.user_id.email,
              name: payment.user_id.name,
              flat_no: payment.flat_no,
              amount: payment.total_amount,
              month: payment.month,
              year: payment.year,
              due_date: payment.due_date
            });
            break;
            
          case 'reminder':
            await emailService.sendMaintenanceReminder({
              email: payment.user_id.email,
              name: payment.user_id.name,
              flat_no: payment.flat_no,
              amount: payment.total_amount,
              month: payment.month,
              year: payment.year,
              due_date: payment.due_date,
              is_overdue: false
            });
            break;
            
          case 'final_warning':
            await emailService.sendFinalWarning({
              email: payment.user_id.email,
              name: payment.user_id.name,
              flat_no: payment.flat_no,
              amount: payment.total_amount,
              month: payment.month,
              year: payment.year,
              due_date: payment.due_date
            });
            break;
        }
        
        console.log(`✅ Sent ${reminderType} to ${payment.user_id.email}`);
        sent++;
        
      } catch (err) {
        console.error(`Failed to send ${reminderType} to ${payment.user_id.email}:`, err.message);
        errors++;
      }
    }
    
    console.log(`📊 Reminder sending complete:`);
    console.log(`   Type: ${reminderType}`);
    console.log(`   Sent: ${sent}`);
    console.log(`   Errors: ${errors}`);
    
    return { sent, errors, type: reminderType };
    
  } catch (error) {
    console.error('❌ Error in sendPaymentReminders:', error);
    throw error;
  }
};

/**
 * Send reminders for a specific type (manual trigger)
 * @param {string} type - 'invoice', 'reminder', or 'final_warning'
 */
const sendRemindersByType = async (type, month = null, year = null) => {
  try {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();
    
    console.log(`📧 Manually sending ${type} emails for ${targetMonth}/${targetYear}...`);
    
    const pendingPayments = await Maintenance.find({
      month: targetMonth,
      year: targetYear,
      status: { $in: ['pending', 'overdue'] }
    }).populate('user_id', 'name email');
    
    let sent = 0;
    let errors = 0;
    
    for (const payment of pendingPayments) {
      if (!payment.user_id || !payment.user_id.email) {
        continue;
      }
      
      try {
        switch (type) {
          case 'invoice':
            await emailService.sendMaintenanceInvoice({
              email: payment.user_id.email,
              name: payment.user_id.name,
              flat_no: payment.flat_no,
              amount: payment.total_amount,
              month: payment.month,
              year: payment.year,
              due_date: payment.due_date
            });
            break;
            
          case 'reminder':
            await emailService.sendMaintenanceReminder({
              email: payment.user_id.email,
              name: payment.user_id.name,
              flat_no: payment.flat_no,
              amount: payment.total_amount,
              month: payment.month,
              year: payment.year,
              due_date: payment.due_date,
              is_overdue: false
            });
            break;
            
          case 'final_warning':
            await emailService.sendFinalWarning({
              email: payment.user_id.email,
              name: payment.user_id.name,
              flat_no: payment.flat_no,
              amount: payment.total_amount,
              month: payment.month,
              year: payment.year,
              due_date: payment.due_date
            });
            break;
            
          default:
            throw new Error(`Unknown reminder type: ${type}`);
        }
        
        sent++;
        
      } catch (err) {
        errors++;
      }
    }
    
    return { sent, errors, type, month: targetMonth, year: targetYear };
    
  } catch (error) {
    console.error('Error in sendRemindersByType:', error);
    throw error;
  }
};

module.exports = {
  sendPaymentReminders,
  sendRemindersByType
};
