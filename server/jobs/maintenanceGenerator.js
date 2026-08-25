const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const emailService = require('../services/email.service');

/**
 * Generate monthly maintenance records for all registered flats
 * Runs on 1st of every month at midnight
 * 
 * Creates a maintenance record for each user with role: resident, admin, or manager
 * Amount: ₹1000 (fixed)
 * Due date: 18th of current month
 * Status: pending
 */
const generateMonthlyMaintenance = async () => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed
    const year = now.getFullYear();
    const dueDate = new Date(year, now.getMonth(), 18); // 18th of current month
    
    console.log(`📅 Generating maintenance records for ${month}/${year}...`);
    
    // Get all active users who need to pay maintenance (residents, admins, managers)
    // Exclude watchmen as they don't pay maintenance
    const users = await User.find({
      role: { $in: ['resident', 'admin', 'manager'] },
      flat_no: { $exists: true, $ne: null }
    }).select('_id name email flat_no');
    
    console.log(`Found ${users.length} users to generate maintenance for`);
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const user of users) {
      try {
        // Check if maintenance record already exists for this flat/month/year
        const existing = await Maintenance.findOne({
          flat_no: user.flat_no,
          month,
          year
        });
        
        if (existing) {
          console.log(`⏭️ Skipping flat ${user.flat_no} - record already exists`);
          skipped++;
          continue;
        }
        
        // Create new maintenance record
        const maintenance = await Maintenance.create({
          user_id: user._id,
          flat_no: user.flat_no,
          month,
          year,
          amount: 1000, // Fixed ₹1000
          late_fee: 0,
          total_amount: 1000,
          due_date: dueDate,
          status: 'pending'
        });
        
        console.log(`✅ Created maintenance for flat ${user.flat_no}`);
        created++;
        
        // Send invoice email
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
          console.error(`Failed to send invoice email to ${user.email}:`, emailErr.message);
        }
        
      } catch (err) {
        console.error(`Error creating maintenance for flat ${user.flat_no}:`, err.message);
        errors++;
      }
    }
    
    console.log(`📊 Monthly maintenance generation complete:`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Errors: ${errors}`);
    
    return { created, skipped, errors, month, year };
    
  } catch (error) {
    console.error('❌ Error in generateMonthlyMaintenance:', error);
    throw error;
  }
};

/**
 * Manually trigger maintenance generation for a specific month/year
 * Used for testing or catching up on missed months
 */
const generateMaintenanceForMonth = async (month, year) => {
  try {
    const dueDate = new Date(year, month - 1, 18); // 18th of specified month
    
    console.log(`📅 Generating maintenance records for ${month}/${year}...`);
    
    const users = await User.find({
      role: { $in: ['resident', 'admin', 'manager'] },
      flat_no: { $exists: true, $ne: null }
    }).select('_id name email flat_no');
    
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const user of users) {
      try {
        const existing = await Maintenance.findOne({
          flat_no: user.flat_no,
          month,
          year
        });
        
        if (existing) {
          skipped++;
          continue;
        }
        
        await Maintenance.create({
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
        
      } catch (err) {
        errors++;
      }
    }
    
    return { created, skipped, errors, month, year };
    
  } catch (error) {
    console.error('Error in generateMaintenanceForMonth:', error);
    throw error;
  }
};

module.exports = {
  generateMonthlyMaintenance,
  generateMaintenanceForMonth
};
