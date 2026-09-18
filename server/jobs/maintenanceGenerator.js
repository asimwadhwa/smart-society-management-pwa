const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const Society = require('../models/Society');
const emailService = require('../services/email.service');

/**
 * Generate maintenance for one society
 */
const generateMaintenanceForSociety = async (
  societyId,
  month,
  year,
  sendEmail = true
) => {
  const dueDate = new Date(year, month - 1, 18);

  const users = await User.find({
    society_id: societyId,
    role: { $in: ['resident', 'admin', 'manager'] },
    is_active: true,
    flat_no: { $exists: true, $ne: null }
  }).select('_id name email flat_no');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const existing = await Maintenance.findOne({
        society_id: societyId,
        user_id: user._id,
        month,
        year
      });

      if (existing) {
        skipped++;
        continue;
      }

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
        status: 'pending'
      });

      created++;

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
      console.error(
        `Error creating maintenance for flat ${user.flat_no}:`,
        err.message
      );
      errors++;
    }
  }

  return {
    society_id: societyId.toString(),
    created,
    skipped,
    errors,
    month,
    year
  };
};


/**
 * Generate monthly maintenance for ALL active societies
 * Runs on 1st of every month at midnight
 */
const generateMonthlyMaintenance = async () => {
  try {
    const now = new Date();

    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    console.log(
      `📅 Generating maintenance for all societies - ${month}/${year}`
    );

    const societies = await Society.find({
      is_active: true
    }).select('_id name society_code');

    console.log(
      `🏢 Found ${societies.length} active societies`
    );

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    const societyResults = [];

    for (const society of societies) {
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

        totalCreated += result.created;
        totalSkipped += result.skipped;
        totalErrors += result.errors;

        societyResults.push({
          society_id: society._id,
          society_name: society.name,
          society_code: society.society_code,
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
      created: totalCreated,
      skipped: totalSkipped,
      errors: totalErrors,
      month,
      year,
      societies: societyResults
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
 * Generate maintenance for ALL active societies
 * for a specific month/year
 */
const generateMaintenanceForMonth = async (
  month,
  year
) => {
  try {
    month = parseInt(month);
    year = parseInt(year);

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

    const societies = await Society.find({
      is_active: true
    }).select('_id name society_code');

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    const societyResults = [];

    for (const society of societies) {
      try {
        const result =
          await generateMaintenanceForSociety(
            society._id,
            month,
            year,
            false
          );

        totalCreated += result.created;
        totalSkipped += result.skipped;
        totalErrors += result.errors;

        societyResults.push({
          society_id: society._id,
          society_name: society.name,
          society_code: society.society_code,
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
      created: totalCreated,
      skipped: totalSkipped,
      errors: totalErrors,
      month,
      year,
      societies: societyResults
    };
  } catch (error) {
    console.error(
      'Error in generateMaintenanceForMonth:',
      error
    );

    throw error;
  }
};


module.exports = {
  generateMonthlyMaintenance,
  generateMaintenanceForMonth,
  generateMaintenanceForSociety
};