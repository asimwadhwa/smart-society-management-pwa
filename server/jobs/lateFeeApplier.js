const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const emailService = require('../services/email.service');

/**
 * Apply late fees to overdue payments
 * Runs daily at midnight
 * 
 * Finds all pending payments past their due date
 * Adds ₹100 late fee
 * Updates status to 'overdue'
 */
const applyLateFees = async () => {
  try {
    const now = new Date();
    
    console.log(`💰 Checking for overdue payments...`);
    
    // Find all pending payments that are past due date
    // Late fee should only be applied once (late_fee = 0 means not yet applied)
    const overdueRecords = await Maintenance.find({
      status: 'pending',
      due_date: { $lt: now },
      late_fee: 0 // Only apply if late fee hasn't been added yet
    }).populate('user_id', 'name email');
    
    console.log(`Found ${overdueRecords.length} overdue payments to process`);
    
    let updated = 0;
    let errors = 0;
    
    for (const record of overdueRecords) {
      try {
        // Apply ₹100 late fee
        record.late_fee = 100;
        record.total_amount = record.amount + record.late_fee;
        record.status = 'overdue';
        await record.save();
        
        console.log(`✅ Applied late fee to flat ${record.flat_no} for ${record.month}/${record.year}`);
        updated++;
        
        // Send overdue notification email
        if (record.user_id && record.user_id.email) {
          try {
            await emailService.sendMaintenanceReminder({
              email: record.user_id.email,
              name: record.user_id.name,
              flat_no: record.flat_no,
              amount: record.total_amount,
              month: record.month,
              year: record.year,
              due_date: record.due_date,
              is_overdue: true
            });
          } catch (emailErr) {
            console.error(`Failed to send overdue email to ${record.user_id.email}:`, emailErr.message);
          }
        }
        
      } catch (err) {
        console.error(`Error applying late fee to flat ${record.flat_no}:`, err.message);
        errors++;
      }
    }
    
    console.log(`📊 Late fee application complete:`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Errors: ${errors}`);
    
    return { updated, errors };
    
  } catch (error) {
    console.error('❌ Error in applyLateFees:', error);
    throw error;
  }
};

/**
 * Manually trigger late fee check
 * Used for testing
 */
const checkAndApplyLateFees = async () => {
  return await applyLateFees();
};

module.exports = {
  applyLateFees,
  checkAndApplyLateFees
};
