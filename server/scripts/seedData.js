/**
 * Seed Data Script for Society Management System
 * 
 * This script populates the database with sample data for testing
 * 
 * Usage: 
 *   node scripts/seedData.js           - Seeds all data
 *   node scripts/seedData.js --clear   - Clears all data first, then seeds
 *   node scripts/seedData.js --reset   - Clears all data only
 * 
 * Note: This will NOT delete existing manager/admin users for safety
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const User = require('../models/User');
const Maintenance = require('../models/Maintenance');
const PaymentLog = require('../models/PaymentLog');
const LiftEmergency = require('../models/LiftEmergency');
const Complaint = require('../models/Complaint');
const GateLog = require('../models/GateLog');
const Asset = require('../models/Asset');

// MongoDB connection
const connectDB = require('../config/db');

// ============================================
// SEED DATA CONFIGURATION
// ============================================

const CURRENT_YEAR = 2026;
const CURRENT_MONTH = 1; // January

// Password for all seeded users (will be hashed)
const DEFAULT_PASSWORD = 'password123';

// ============================================
// USERS SEED DATA
// ============================================

const usersData = [
  // Admin users
  {
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@example.com',
    phone: '9876543210',
    flat_no: '102',
    role: 'admin',
    password_hash: DEFAULT_PASSWORD
  },
  // Resident users
  {
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '9876543211',
    flat_no: '103',
    role: 'resident',
    password_hash: DEFAULT_PASSWORD
  },
  {
    name: 'Amit Kumar',
    email: 'amit.kumar@example.com',
    phone: '9876543212',
    flat_no: '104',
    role: 'resident',
    password_hash: DEFAULT_PASSWORD
  },
  {
    name: 'Sunita Verma',
    email: 'sunita.verma@example.com',
    phone: '9876543213',
    flat_no: '105',
    role: 'resident',
    password_hash: DEFAULT_PASSWORD
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    phone: '9876543214',
    flat_no: '201',
    role: 'resident',
    password_hash: DEFAULT_PASSWORD
  },
  {
    name: 'Anita Desai',
    email: 'anita.desai@example.com',
    phone: '9876543215',
    flat_no: '202',
    role: 'resident',
    password_hash: DEFAULT_PASSWORD
  },
  {
    name: 'Suresh Mehta',
    email: 'suresh.mehta@example.com',
    phone: '9876543216',
    flat_no: '203',
    role: 'resident',
    password_hash: DEFAULT_PASSWORD
  },
  {
    name: 'Kavita Joshi',
    email: 'kavita.joshi@example.com',
    phone: '9876543217',
    flat_no: '204',
    role: 'resident',
    password_hash: DEFAULT_PASSWORD
  },
  {
    name: 'Rahul Gupta',
    email: 'rahul.gupta@example.com',
    phone: '9876543218',
    flat_no: '205',
    role: 'resident',
    password_hash: DEFAULT_PASSWORD
  },
  {
    name: 'Meena Agarwal',
    email: 'meena.agarwal@example.com',
    phone: '9876543219',
    flat_no: '301',
    role: 'resident',
    password_hash: DEFAULT_PASSWORD
  },
  {
    name: 'Deepak Reddy',
    email: 'deepak.reddy@example.com',
    phone: '9876543220',
    flat_no: '302',
    role: 'resident',
    password_hash: DEFAULT_PASSWORD
  },
  {
    name: 'Pooja Nair',
    email: 'pooja.nair@example.com',
    phone: '9876543221',
    flat_no: '303',
    role: 'resident',
    password_hash: DEFAULT_PASSWORD
  },
  {
    name: 'Arjun Kapoor',
    email: 'arjun.kapoor@example.com',
    phone: '9876543222',
    flat_no: '304',
    role: 'resident',
    password_hash: DEFAULT_PASSWORD
  },
  // Watchman
  {
    name: 'Ramesh Yadav',
    email: 'ramesh.watchman@example.com',
    phone: '9876543223',
    flat_no: null,
    role: 'watchman',
    password_hash: DEFAULT_PASSWORD
  }
];

// ============================================
// ASSETS SEED DATA
// ============================================

const assetsData = [
  {
    name: 'Main Lift',
    type: 'lift',
    status: 'working',
    location: 'Building A - Main Entrance',
    services: [
      {
        date: new Date('2025-10-15'),
        description: 'Annual maintenance and safety inspection',
        done_by: 'Otis Elevator Services'
      },
      {
        date: new Date('2025-12-20'),
        description: 'Emergency brake system check and lubrication',
        done_by: 'Otis Elevator Services'
      },
      {
        date: new Date('2026-01-10'),
        description: 'Routine inspection and cleaning',
        done_by: 'Otis Elevator Services'
      }
    ]
  },
  {
    name: 'Water Pump 1',
    type: 'water_pump',
    status: 'working',
    location: 'Basement - Pump Room',
    services: [
      {
        date: new Date('2025-09-01'),
        description: 'Motor rewinding and bearing replacement',
        done_by: 'Kumar Electronics'
      },
      {
        date: new Date('2025-11-15'),
        description: 'Impeller cleaning and pressure check',
        done_by: 'Kumar Electronics'
      }
    ]
  },
  {
    name: 'Water Pump 2',
    type: 'water_pump',
    status: 'under_maintenance',
    location: 'Basement - Pump Room',
    services: [
      {
        date: new Date('2025-08-10'),
        description: 'Initial installation',
        done_by: 'Crompton Pumps'
      },
      {
        date: new Date('2026-01-20'),
        description: 'Motor overheating issue - Under repair',
        done_by: 'Kumar Electronics'
      }
    ]
  },
  {
    name: 'Backup Generator',
    type: 'generator',
    status: 'working',
    location: 'Basement - Generator Room',
    services: [
      {
        date: new Date('2025-07-01'),
        description: 'Annual service - Oil change, filter replacement',
        done_by: 'Kirloskar Service Center'
      },
      {
        date: new Date('2025-12-01'),
        description: 'Battery replacement and load testing',
        done_by: 'Kirloskar Service Center'
      }
    ]
  }
];

// ============================================
// COMPLAINTS SEED DATA (will be linked to users)
// ============================================

const complaintsData = [
  {
    flat_no: '103',
    description: 'Water leakage from ceiling in the master bedroom. The issue started after heavy rain last week. Urgent attention required.',
    status: 'open',
    image_url: null
  },
  {
    flat_no: '201',
    description: 'The corridor light on the 2nd floor has been flickering for the past 3 days. It makes strange buzzing sounds at night.',
    status: 'in-progress',
    admin_notes: 'Electrician scheduled for tomorrow morning'
  },
  {
    flat_no: '204',
    description: 'Parking space dispute - Someone keeps parking in my designated spot. Vehicle number GJ-01-AB-1234.',
    status: 'resolved',
    admin_notes: 'Spoke with the offending party. Issue resolved.'
  },
  {
    flat_no: '302',
    description: 'The intercom system in my flat is not working. Cannot receive calls from the gate.',
    status: 'open'
  },
  {
    flat_no: '104',
    description: 'Garbage not being collected on time. The bins are overflowing since 3 days.',
    status: 'resolved',
    admin_notes: 'Contacted waste management. Collection schedule restored.'
  },
  {
    flat_no: '203',
    description: 'Loud music from flat 204 after 11 PM on weekends. This has been happening for the past month.',
    status: 'in-progress',
    admin_notes: 'Warning notice sent to flat 204'
  },
  {
    flat_no: '301',
    description: 'The main gate remote is not working. Need a new one issued.',
    status: 'open'
  }
];

// ============================================
// LIFT EMERGENCIES SEED DATA (resolved ones)
// ============================================

const emergenciesData = [
  {
    flat_no: '205',
    triggered_at: new Date('2025-11-15T14:30:00'),
    status: 'resolved',
    resolved_at: new Date('2025-11-15T14:45:00'),
    notes: 'Power outage caused lift to stop. Resident rescued within 15 minutes.'
  },
  {
    flat_no: '102',
    triggered_at: new Date('2025-12-03T19:20:00'),
    status: 'resolved',
    resolved_at: new Date('2025-12-03T19:35:00'),
    notes: 'Lift door malfunction. Technician called and issue fixed.'
  },
  {
    flat_no: '304',
    triggered_at: new Date('2025-12-22T10:15:00'),
    status: 'resolved',
    resolved_at: new Date('2025-12-22T10:30:00'),
    notes: 'False alarm - child pressed emergency button accidentally.'
  },
  {
    flat_no: '203',
    triggered_at: new Date('2026-01-05T16:45:00'),
    status: 'resolved',
    resolved_at: new Date('2026-01-05T17:10:00'),
    notes: 'Lift stuck between floors due to overload. All passengers safely evacuated.'
  }
];

// ============================================
// GATE LOGS SEED DATA (will be linked to watchman)
// ============================================

const gateLogsData = [
  // Today's entries
  {
    visitor_name: 'Swiggy Delivery',
    flat_no_visiting: '103',
    purpose: 'Food Delivery',
    vehicle_number: null,
    in_time: new Date(Date.now() - 3600000), // 1 hour ago
    out_time: new Date(Date.now() - 3500000) // 50 mins ago
  },
  {
    visitor_name: 'Amazon Delivery',
    flat_no_visiting: '201',
    purpose: 'Package Delivery',
    vehicle_number: 'GJ-01-CD-5678',
    in_time: new Date(Date.now() - 7200000), // 2 hours ago
    out_time: new Date(Date.now() - 7000000)
  },
  {
    visitor_name: 'Dr. Mehta',
    flat_no_visiting: '301',
    purpose: 'Doctor Visit',
    vehicle_number: 'GJ-01-EF-9012',
    in_time: new Date(Date.now() - 5400000), // 1.5 hours ago
    out_time: null // Still inside
  },
  {
    visitor_name: 'Plumber - Rajesh',
    flat_no_visiting: '104',
    purpose: 'Plumbing Repair',
    vehicle_number: null,
    in_time: new Date(Date.now() - 1800000), // 30 mins ago
    out_time: null // Still inside
  },
  {
    visitor_name: 'Family Visit - Mr. Shah',
    flat_no_visiting: '202',
    purpose: 'Personal Visit',
    vehicle_number: 'MH-12-AB-3456',
    in_time: new Date(Date.now() - 900000), // 15 mins ago
    out_time: null // Still inside
  },
  // Yesterday's entries
  {
    visitor_name: 'Electrician - Sunil',
    flat_no_visiting: '203',
    purpose: 'Electrical Work',
    vehicle_number: null,
    in_time: new Date(Date.now() - 86400000 - 7200000), // Yesterday, 2 hours
    out_time: new Date(Date.now() - 86400000 - 3600000) // Yesterday, 1 hour later
  },
  {
    visitor_name: 'Courier - BlueDart',
    flat_no_visiting: '304',
    purpose: 'Package Delivery',
    vehicle_number: 'GJ-01-XY-7890',
    in_time: new Date(Date.now() - 86400000 - 14400000),
    out_time: new Date(Date.now() - 86400000 - 14200000)
  },
  {
    visitor_name: 'Maid - Lakshmi',
    flat_no_visiting: '102',
    purpose: 'Household Help',
    vehicle_number: null,
    in_time: new Date(Date.now() - 86400000 - 21600000),
    out_time: new Date(Date.now() - 86400000 - 14400000)
  }
];

// ============================================
// MAINTENANCE RECORDS SEED DATA
// ============================================

// Function to generate maintenance records for past months
function generateMaintenanceData(userId, flatNo) {
  const records = [];
  const months = [
    { month: 10, year: 2025, status: 'paid', paid: true },
    { month: 11, year: 2025, status: 'paid', paid: true },
    { month: 12, year: 2025, status: 'paid', paid: true, late: true }, // Paid with late fee
    { month: 1, year: 2026, status: 'pending', paid: false } // Current month
  ];

  months.forEach(m => {
    const dueDate = new Date(m.year, m.month - 1, 18); // Due on 18th
    const record = {
      user_id: userId,
      flat_no: flatNo,
      month: m.month,
      year: m.year,
      amount: 1000,
      late_fee: m.late ? 100 : 0,
      total_amount: m.late ? 1100 : 1000,
      due_date: dueDate,
      status: m.status
    };

    if (m.paid) {
      record.paid_date = m.late 
        ? new Date(m.year, m.month - 1, 22) // Paid late on 22nd
        : new Date(m.year, m.month - 1, 10); // Paid on 10th
      record.razorpay_payment_id = `pay_seed_${flatNo}_${m.month}_${m.year}`;
      record.razorpay_order_id = `order_seed_${flatNo}_${m.month}_${m.year}`;
    }

    records.push(record);
  });

  return records;
}

// Function to generate payment logs
function generatePaymentLogs(userId, flatNo, maintenanceRecords) {
  return maintenanceRecords
    .filter(m => m.status === 'paid')
    .map(m => ({
      user_id: userId,
      flat_no: flatNo,
      amount: m.total_amount,
      payment_date: m.paid_date,
      transaction_id: m.razorpay_payment_id,
      month: m.month,
      year: m.year,
      razorpay_order_id: m.razorpay_order_id
    }));
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedDatabase() {
  try {
    // Connect to database
    await connectDB();
    console.log('📦 Connected to MongoDB\n');

    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear');
    const resetOnly = args.includes('--reset');

    if (shouldClear || resetOnly) {
      console.log('🗑️  Clearing existing data...');
      
      // Clear collections (except manager user)
      await Maintenance.deleteMany({});
      console.log('   ✓ Maintenance records cleared');
      
      await PaymentLog.deleteMany({});
      console.log('   ✓ Payment logs cleared');
      
      await LiftEmergency.deleteMany({});
      console.log('   ✓ Lift emergencies cleared');
      
      await Complaint.deleteMany({});
      console.log('   ✓ Complaints cleared');
      
      await GateLog.deleteMany({});
      console.log('   ✓ Gate logs cleared');
      
      await Asset.deleteMany({});
      console.log('   ✓ Assets cleared');
      
      // Only delete seeded users (not manager/admin that were manually created)
      await User.deleteMany({ 
        email: { $nin: ['testuser@example.com'] }
      });
      console.log('   ✓ Seeded users cleared (preserved existing accounts)\n');

      if (resetOnly) {
        console.log('✅ Database reset complete!');
        process.exit(0);
      }
    }

    console.log('🌱 Starting seed process...\n');

    // ----------------------------------------
    // 1. Seed Users
    // ----------------------------------------
    console.log('👥 Seeding Users...');
    const createdUsers = [];
    
    for (const userData of usersData) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log(`   ⏭️  User ${userData.email} already exists, skipping`);
        createdUsers.push(existingUser);
        continue;
      }

      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`   ✓ Created user: ${userData.name} (${userData.role}) - Flat ${userData.flat_no || 'N/A'}`);
    }
    console.log(`   📊 Total users: ${createdUsers.length}\n`);

    // Get manager user for resolving emergencies
    const manager = await User.findOne({ role: 'manager' });
    
    // Get watchman for gate logs
    const watchman = createdUsers.find(u => u.role === 'watchman') || 
                     await User.findOne({ role: 'watchman' });

    // ----------------------------------------
    // 2. Seed Assets
    // ----------------------------------------
    console.log('🏗️  Seeding Assets...');
    for (const assetData of assetsData) {
      const existingAsset = await Asset.findOne({ name: assetData.name });
      if (existingAsset) {
        console.log(`   ⏭️  Asset "${assetData.name}" already exists, skipping`);
        continue;
      }
      
      const asset = new Asset(assetData);
      await asset.save();
      console.log(`   ✓ Created asset: ${assetData.name} (${assetData.type}) - ${assetData.status}`);
    }
    console.log('');

    // ----------------------------------------
    // 3. Seed Maintenance Records & Payment Logs
    // ----------------------------------------
    console.log('💰 Seeding Maintenance Records...');
    const residentsAndAdmins = createdUsers.filter(u => 
      u.role === 'resident' || u.role === 'admin'
    );

    for (const user of residentsAndAdmins) {
      if (!user.flat_no) continue;
      
      // Check if maintenance records already exist for this flat
      const existingMaintenance = await Maintenance.findOne({ 
        flat_no: user.flat_no, 
        month: 1, 
        year: 2026 
      });
      
      if (existingMaintenance) {
        console.log(`   ⏭️  Maintenance for Flat ${user.flat_no} already exists, skipping`);
        continue;
      }

      const maintenanceRecords = generateMaintenanceData(user._id, user.flat_no);
      
      for (const record of maintenanceRecords) {
        try {
          const maintenance = new Maintenance(record);
          await maintenance.save();
        } catch (err) {
          if (err.code === 11000) {
            // Skip duplicate entries
            continue;
          }
          throw err;
        }
      }

      // Create payment logs for paid records
      const paymentLogs = generatePaymentLogs(user._id, user.flat_no, maintenanceRecords);
      for (const log of paymentLogs) {
        try {
          const paymentLog = new PaymentLog(log);
          await paymentLog.save();
        } catch (err) {
          if (err.code === 11000) {
            continue;
          }
          throw err;
        }
      }

      console.log(`   ✓ Created maintenance records & payment logs for Flat ${user.flat_no}`);
    }
    console.log('');

    // ----------------------------------------
    // 4. Seed Complaints
    // ----------------------------------------
    console.log('📝 Seeding Complaints...');
    for (const complaintData of complaintsData) {
      // Find user by flat number
      const user = createdUsers.find(u => u.flat_no === complaintData.flat_no) ||
                   await User.findOne({ flat_no: complaintData.flat_no });
      
      if (!user) {
        console.log(`   ⚠️  No user found for flat ${complaintData.flat_no}, skipping complaint`);
        continue;
      }

      const complaint = new Complaint({
        ...complaintData,
        user_id: user._id,
        resolved_by: complaintData.status === 'resolved' && manager ? manager._id : null
      });
      await complaint.save();
      console.log(`   ✓ Created complaint from Flat ${complaintData.flat_no} - ${complaintData.status}`);
    }
    console.log('');

    // ----------------------------------------
    // 5. Seed Lift Emergencies
    // ----------------------------------------
    console.log('🚨 Seeding Lift Emergencies...');
    for (const emergencyData of emergenciesData) {
      // Find user by flat number
      const user = createdUsers.find(u => u.flat_no === emergencyData.flat_no) ||
                   await User.findOne({ flat_no: emergencyData.flat_no });
      
      if (!user) {
        console.log(`   ⚠️  No user found for flat ${emergencyData.flat_no}, skipping emergency`);
        continue;
      }

      const emergency = new LiftEmergency({
        ...emergencyData,
        triggered_by: user._id,
        resolved_by: emergencyData.status === 'resolved' && manager ? manager._id : null
      });
      await emergency.save();
      console.log(`   ✓ Created emergency from Flat ${emergencyData.flat_no} - ${emergencyData.status}`);
    }
    console.log('');

    // ----------------------------------------
    // 6. Seed Gate Logs
    // ----------------------------------------
    console.log('🚪 Seeding Gate Logs...');
    if (watchman) {
      for (const logData of gateLogsData) {
        const gateLog = new GateLog({
          ...logData,
          logged_by: watchman._id
        });
        await gateLog.save();
        console.log(`   ✓ Created gate log: ${logData.visitor_name} → Flat ${logData.flat_no_visiting}`);
      }
    } else {
      console.log('   ⚠️  No watchman user found, skipping gate logs');
    }
    console.log('');

    // ----------------------------------------
    // Summary
    // ----------------------------------------
    console.log('═══════════════════════════════════════════════════');
    console.log('✅ SEED COMPLETE!');
    console.log('═══════════════════════════════════════════════════');
    console.log('\n📊 Summary:');
    console.log(`   • Users: ${createdUsers.length} residents/admins + 1 watchman`);
    console.log(`   • Assets: ${assetsData.length} (lift, pumps, generator)`);
    console.log(`   • Maintenance: ${residentsAndAdmins.length * 4} records`);
    console.log(`   • Payment Logs: ${residentsAndAdmins.length * 3} records`);
    console.log(`   • Complaints: ${complaintsData.length}`);
    console.log(`   • Emergencies: ${emergenciesData.length}`);
    console.log(`   • Gate Logs: ${gateLogsData.length}`);
    console.log('\n🔐 Test Credentials (for seeded users):');
    console.log('   Email: [any seeded email]');
    console.log('   Password: password123');
    console.log('\n📧 Sample seeded users:');
    console.log('   • Admin: rajesh.sharma@example.com');
    console.log('   • Resident: priya.patel@example.com');
    console.log('   • Watchman: ramesh.watchman@example.com');
    console.log('═══════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
