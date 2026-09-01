const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();

// =====================================================
// IMPORTANT:
// Force Node.js to use public DNS servers.
// This fixes MongoDB Atlas SRV DNS resolution issue.
// =====================================================
dns.setServers(['8.8.8.8', '1.1.1.1']);

const User = require('../models/User');
const Complaint = require('../models/complaint');
const Maintenance = require('../models/Maintenance');
const PaymentLog = require('../models/PaymentLog');
const GateLog = require('../models/GateLog');
const LiftEmergency = require('../models/LiftEmergency');

const resetDatabase = async () => {
  try {
    console.log('');
    console.log('====================================');
    console.log('       SOCIETY DATABASE RESET');
    console.log('====================================');
    console.log('');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('✅ MongoDB Connected');
    console.log('');

    // =====================================================
    // DELETE USERS
    // =====================================================

    const usersResult = await User.deleteMany({});

    console.log(
      `Users deleted: ${usersResult.deletedCount}`
    );

    // =====================================================
    // DELETE COMPLAINTS
    // =====================================================

    const complaintsResult =
      await Complaint.deleteMany({});

    console.log(
      `Complaints deleted: ${complaintsResult.deletedCount}`
    );

    // =====================================================
    // DELETE MAINTENANCE RECORDS
    // =====================================================

    const maintenanceResult =
      await Maintenance.deleteMany({});

    console.log(
      `Maintenance records deleted: ${maintenanceResult.deletedCount}`
    );

    // =====================================================
    // DELETE PAYMENT LOGS
    // =====================================================

    const paymentLogsResult =
      await PaymentLog.deleteMany({});

    console.log(
      `Payment logs deleted: ${paymentLogsResult.deletedCount}`
    );

    // =====================================================
    // DELETE GATE LOGS
    // =====================================================

    const gateLogsResult =
      await GateLog.deleteMany({});

    console.log(
      `Gate logs deleted: ${gateLogsResult.deletedCount}`
    );

    // =====================================================
    // DELETE LIFT EMERGENCIES
    // =====================================================

    const emergencyResult =
      await LiftEmergency.deleteMany({});

    console.log(
      `Emergency records deleted: ${emergencyResult.deletedCount}`
    );

    // =====================================================
    // ASSETS ARE INTENTIONALLY NOT DELETED
    // =====================================================

    console.log('');
    console.log('Assets: NOT deleted');
    console.log('Your Lift / Water Pump / Generator data is safe.');

    console.log('');
    console.log('====================================');
    console.log('    DATABASE RESET COMPLETED');
    console.log('====================================');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ DATABASE RESET FAILED');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
  } finally {
    // Close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    }
  }
};

resetDatabase();