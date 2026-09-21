const Maintenance = require('../models/Maintenance');
const emailService = require('../services/email.service');

/**
 * ============================================================
 * APPLY LATE FEES TO OVERDUE PAYMENTS
 * ============================================================
 *
 * Runs daily at midnight.
 *
 * IMPORTANT:
 * Manager does NOT have personal maintenance.
 *
 * Therefore this job only processes maintenance
 * belonging to:
 * - resident
 * - admin
 *
 * Old/incorrect manager maintenance records are
 * ignored and will not receive late fees.
 */
const applyLateFees = async () => {
  try {
    const now = new Date();

    console.log(
      `💰 Checking overdue payments across all societies...`
    );

    /*
     * ==========================================================
     * FIND OVERDUE MAINTENANCE
     * ==========================================================
     *
     * We populate user_id so that we can check
     * the user's current role.
     *
     * Only resident/admin records will be processed.
     */
    const overdueRecords =
      await Maintenance.find({
        status: 'pending',

        due_date: {
          $lt: now
        },

        late_fee: 0,

        society_id: {
          $exists: true,
          $ne: null
        }
      }).populate(
        'user_id',
        'name email role is_active'
      );

    console.log(
      `Found ${overdueRecords.length} overdue maintenance records`
    );

    let updated = 0;
    let skippedManagers = 0;
    let errors = 0;

    const societyStats = {};

    /*
     * ==========================================================
     * PROCESS EACH RECORD
     * ==========================================================
     */
    for (
      const record of overdueRecords
    ) {

      try {

        /*
         * ======================================================
         * MANAGER CHECK
         * ======================================================
         *
         * If an old Manager maintenance record exists,
         * do NOT apply late fee.
         */
        if (
          record.user_id &&
          record.user_id.role ===
            'manager'
        ) {

          skippedManagers++;

          console.log(
            `⏭️ Skipping manager maintenance - Society: ${record.society_id}, Flat: ${record.flat_no}`
          );

          continue;
        }

        /*
         * Only resident/admin should continue.
         */
        if (
          record.user_id &&
          ![
            'resident',
            'admin'
          ].includes(
            record.user_id.role
          )
        ) {

          skippedManagers++;

          console.log(
            `⏭️ Skipping maintenance for role ${record.user_id.role} - Flat: ${record.flat_no}`
          );

          continue;
        }

        /*
         * ======================================================
         * APPLY LATE FEE
         * ======================================================
         */
        record.late_fee = 100;

        record.total_amount =
          record.amount +
          record.late_fee;

        record.status =
          'overdue';

        await record.save();

        updated++;

        /*
         * ======================================================
         * SOCIETY STATISTICS
         * ======================================================
         */
        const societyKey =
          record.society_id.toString();

        if (
          !societyStats[societyKey]
        ) {
          societyStats[societyKey] = {
            updated: 0,
            skippedManagers: 0,
            errors: 0
          };
        }

        societyStats[societyKey]
          .updated++;

        /*
         * ======================================================
         * LOG
         * ======================================================
         */
        console.log(
          `✅ Late fee applied - Society: ${societyKey}, Flat: ${record.flat_no}`
        );

        /*
         * ======================================================
         * SEND OVERDUE EMAIL
         * ======================================================
         */
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

              is_overdue:
                true
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

        /*
         * ======================================================
         * SOCIETY ERROR STATISTICS
         * ======================================================
         */
        if (
          record.society_id
        ) {

          const societyKey =
            record.society_id.toString();

          if (
            !societyStats[societyKey]
          ) {
            societyStats[societyKey] = {
              updated: 0,
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
     * LOG SUMMARY
     * ==========================================================
     */
    console.log(
      `📊 Late fee application complete`
    );

    console.log(
      `   Updated: ${updated}`
    );

    console.log(
      `   Manager records skipped: ${skippedManagers}`
    );

    console.log(
      `   Errors: ${errors}`
    );

    return {
      updated,

      skippedManagers,

      errors,

      societies:
        societyStats
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
 * ============================================================
 * MANUALLY TRIGGER LATE FEE CHECK
 * ============================================================
 */
const checkAndApplyLateFees =
  async () => {
    return await applyLateFees();
  };


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */
module.exports = {
  applyLateFees,
  checkAndApplyLateFees
};