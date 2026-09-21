const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const Society = require('../models/Society');
const emailService = require('../services/email.service');

/**
 * ============================================================
 * GENERATE MAINTENANCE FOR ONE SOCIETY
 * ============================================================
 *
 * IMPORTANT:
 * Manager does NOT receive personal maintenance.
 *
 * Maintenance is generated only for:
 * - resident
 * - admin
 *
 * Manager manages society maintenance.
 */
const generateMaintenanceForSociety = async (
  societyId,
  month,
  year,
  sendEmail = true
) => {
  const dueDate = new Date(
    year,
    month - 1,
    18
  );

  /*
   * ==========================================================
   * GET USERS
   * ==========================================================
   *
   * Only resident and admin receive
   * personal maintenance.
   *
   * Manager is intentionally excluded.
   */
  const users = await User.find({
    society_id: societyId,

    role: {
      $in: [
        'resident',
        'admin'
      ]
    },

    is_active: true,

    flat_no: {
      $exists: true,
      $ne: null,
      $ne: ''
    }
  }).select(
    '_id name email flat_no role society_id'
  );

  let created = 0;
  let skipped = 0;
  let errors = 0;

  /*
   * ==========================================================
   * CREATE MAINTENANCE FOR EACH USER
   * ==========================================================
   */
  for (const user of users) {
    try {

      /*
       * ======================================================
       * CHECK EXISTING MAINTENANCE
       * ======================================================
       */
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

      /*
       * ======================================================
       * CREATE MAINTENANCE
       * ======================================================
       */
      await Maintenance.create({
        society_id: societyId,

        user_id: user._id,

        flat_no: user.flat_no,

        month,

        year,

        amount: 1000,

        late_fee: 0,

        total_amount: 1000,

        due_date: dueDate,

        paid_date: null,

        status: 'pending',

        razorpay_payment_id: null,

        razorpay_order_id: null
      });

      created++;

      /*
       * ======================================================
       * SEND INVOICE EMAIL
       * ======================================================
       */
      if (sendEmail) {
        try {

          await emailService.sendMaintenanceInvoice({
            email: user.email,

            name: user.name,

            flat_no: user.flat_no,

            amount: 1000,

            month,

            year,

            due_date: dueDate
          });

        } catch (emailErr) {

          console.error(
            `Failed invoice email to ${user.email}:`,
            emailErr.message
          );

        }
      }

    } catch (err) {

      /*
       * ======================================================
       * DUPLICATE RECORD
       * ======================================================
       */
      if (
        err.code === 11000
      ) {

        skipped++;

        console.log(
          `Maintenance already exists for flat ${user.flat_no} (${month}/${year})`
        );

        continue;
      }

      /*
       * ======================================================
       * OTHER ERROR
       * ======================================================
       */
      console.error(
        `Error creating maintenance for flat ${user.flat_no}:`,
        err.message
      );

      errors++;
    }
  }

  return {
    society_id:
      societyId.toString(),

    created,

    skipped,

    errors,

    month,

    year
  };
};


/**
 * ============================================================
 * GENERATE MONTHLY MAINTENANCE FOR ALL ACTIVE SOCIETIES
 * ============================================================
 *
 * Runs automatically on 1st of every month.
 *
 * Manager is NOT included.
 */
const generateMonthlyMaintenance =
  async () => {

    try {

      const now =
        new Date();

      const month =
        now.getMonth() + 1;

      const year =
        now.getFullYear();

      console.log(
        `📅 Generating maintenance for all societies - ${month}/${year}`
      );

      /*
       * ======================================================
       * GET ACTIVE SOCIETIES
       * ======================================================
       */
      const societies =
        await Society.find({
          is_active: true
        }).select(
          '_id name society_code'
        );

      console.log(
        `🏢 Found ${societies.length} active societies`
      );

      let totalCreated = 0;

      let totalSkipped = 0;

      let totalErrors = 0;

      const societyResults = [];

      /*
       * ======================================================
       * PROCESS EACH SOCIETY
       * ======================================================
       */
      for (
        const society of societies
      ) {

        try {

          console.log(
            `🏢 Processing ${society.name} (${society.society_code})...`
          );

          const result =
            await generateMaintenanceForSociety(
              society._id,
              month,
              year,
              true
            );

          totalCreated +=
            result.created;

          totalSkipped +=
            result.skipped;

          totalErrors +=
            result.errors;

          societyResults.push({
            society_id:
              society._id,

            society_name:
              society.name,

            society_code:
              society.society_code,

            ...result
          });

        } catch (err) {

          console.error(
            `Error processing society ${society.society_code}:`,
            err.message
          );

          totalErrors++;

        }
      }

      console.log(
        `📊 Monthly maintenance generation complete`
      );

      console.log(
        `   Created: ${totalCreated}`
      );

      console.log(
        `   Skipped: ${totalSkipped}`
      );

      console.log(
        `   Errors: ${totalErrors}`
      );

      return {

        created:
          totalCreated,

        skipped:
          totalSkipped,

        errors:
          totalErrors,

        month,

        year,

        societies:
          societyResults
      };

    } catch (error) {

      console.error(
        '❌ Error in generateMonthlyMaintenance:',
        error
      );

      throw error;
    }
  };


/**
 * ============================================================
 * GENERATE MAINTENANCE FOR ALL ACTIVE SOCIETIES
 * FOR SPECIFIC MONTH/YEAR
 * ============================================================
 *
 * Manager is NOT included.
 */
const generateMaintenanceForMonth =
  async (
    month,
    year
  ) => {

    try {

      month =
        parseInt(month);

      year =
        parseInt(year);

      if (
        !month ||
        month < 1 ||
        month > 12 ||
        !year
      ) {

        throw new Error(
          'Valid month and year are required'
        );
      }

      console.log(
        `📅 Generating maintenance for all societies - ${month}/${year}`
      );

      /*
       * ======================================================
       * GET ACTIVE SOCIETIES
       * ======================================================
       */
      const societies =
        await Society.find({
          is_active: true
        }).select(
          '_id name society_code'
        );

      console.log(
        `🏢 Found ${societies.length} active societies`
      );

      let totalCreated = 0;

      let totalSkipped = 0;

      let totalErrors = 0;

      const societyResults = [];

      /*
       * ======================================================
       * PROCESS EACH SOCIETY
       * ======================================================
       */
      for (
        const society of societies
      ) {

        try {

          const result =
            await generateMaintenanceForSociety(
              society._id,
              month,
              year,
              false
            );

          totalCreated +=
            result.created;

          totalSkipped +=
            result.skipped;

          totalErrors +=
            result.errors;

          societyResults.push({
            society_id:
              society._id,

            society_name:
              society.name,

            society_code:
              society.society_code,

            ...result
          });

        } catch (err) {

          console.error(
            `Error processing society ${society.society_code}:`,
            err.message
          );

          totalErrors++;

        }
      }

      return {

        created:
          totalCreated,

        skipped:
          totalSkipped,

        errors:
          totalErrors,

        month,

        year,

        societies:
          societyResults
      };

    } catch (error) {

      console.error(
        'Error in generateMaintenanceForMonth:',
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
  generateMonthlyMaintenance,

  generateMaintenanceForMonth,

  generateMaintenanceForSociety
};