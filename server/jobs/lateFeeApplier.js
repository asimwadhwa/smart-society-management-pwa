const Maintenance = require('../models/Maintenance');
const emailService = require('../services/email.service');

/**
 * Apply late fees to overdue payments
 * Runs daily at midnight
 *
 * Finds all pending payments past due date
 * Adds ₹100 late fee
 * Updates status to overdue
 *
 * Works across all societies because every
 * Maintenance record contains society_id.
 */
const applyLateFees = async () => {
  try {
    const now = new Date();

    console.log(
      `💰 Checking overdue payments across all societies...`
    );

    const overdueRecords =
      await Maintenance.find({
        status: 'pending',
        due_date: { $lt: now },
        late_fee: 0,
        society_id: {
          $exists: true,
          $ne: null
        }
      }).populate(
        'user_id',
        'name email'
      );

    console.log(
      `Found ${overdueRecords.length} overdue payments`
    );

    let updated = 0;
    let errors = 0;

    const societyStats = {};

    for (const record of overdueRecords) {
      try {
        record.late_fee = 100;

        record.total_amount =
          record.amount +
          record.late_fee;

        record.status = 'overdue';

        await record.save();

        updated++;

        const societyKey =
          record.society_id.toString();

        if (!societyStats[societyKey]) {
          societyStats[societyKey] = {
            updated: 0,
            errors: 0
          };
        }

        societyStats[societyKey].updated++;

        console.log(
          `✅ Late fee applied - Society: ${societyKey}, Flat: ${record.flat_no}`
        );

        if (
          record.user_id &&
          record.user_id.email
        ) {
          try {
            await emailService.sendMaintenanceReminder({
              email:
                record.user_id.email,

              name:
                record.user_id.name,

              flat_no:
                record.flat_no,

              amount:
                record.total_amount,

              month:
                record.month,

              year:
                record.year,

              due_date:
                record.due_date,

              is_overdue: true
            });
          } catch (emailErr) {
            console.error(
              `Failed overdue email to ${record.user_id.email}:`,
              emailErr.message
            );
          }
        }
      } catch (err) {
        console.error(
          `Error applying late fee to flat ${record.flat_no}:`,
          err.message
        );

        errors++;

        if (record.society_id) {
          const societyKey =
            record.society_id.toString();

          if (!societyStats[societyKey]) {
            societyStats[societyKey] = {
              updated: 0,
              errors: 0
            };
          }

          societyStats[societyKey].errors++;
        }
      }
    }

    console.log(
      `📊 Late fee application complete`
    );

    console.log(
      `   Updated: ${updated}`
    );

    console.log(
      `   Errors: ${errors}`
    );

    return {
      updated,
      errors,
      societies: societyStats
    };
  } catch (error) {
    console.error(
      '❌ Error in applyLateFees:',
      error
    );

    throw error;
  }
};


/**
 * Manually trigger late fee check
 */
const checkAndApplyLateFees = async () => {
  return await applyLateFees();
};


module.exports = {
  applyLateFees,
  checkAndApplyLateFees
};