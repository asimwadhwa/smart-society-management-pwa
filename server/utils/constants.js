// Application constants

// Maintenance
const MONTHLY_MAINTENANCE_AMOUNT = 1000; // ₹1000
const LATE_FEE_AMOUNT = 100; // ₹100
const LATE_FEE_DAYS = 18; // Days after which late fee applies

// Reminder days (from start of month)
const REMINDER_DAYS = {
  INVOICE: 1,      // Day 1 - Send invoice
  REMINDER: 10,    // Day 10 - First reminder
  FINAL_WARNING: 16 // Day 16 - Final warning (2 days before late fee)
};

// User roles
const ROLES = {
  MANAGER: 'manager',
  ADMIN: 'admin',
  RESIDENT: 'resident',
  WATCHMAN: 'watchman'
};

// Maintenance status
const MAINTENANCE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue'
};

// Complaint status
const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved'
};

// Emergency status
const EMERGENCY_STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved'
};

// Asset types
const ASSET_TYPES = {
  LIFT: 'lift',
  WATER_PUMP: 'water_pump',
  GENERATOR: 'generator'
};

// Asset status
const ASSET_STATUS = {
  WORKING: 'working',
  UNDER_MAINTENANCE: 'under_maintenance',
  NOT_WORKING: 'not_working'
};

module.exports = {
  MONTHLY_MAINTENANCE_AMOUNT,
  LATE_FEE_AMOUNT,
  LATE_FEE_DAYS,
  REMINDER_DAYS,
  ROLES,
  MAINTENANCE_STATUS,
  COMPLAINT_STATUS,
  EMERGENCY_STATUS,
  ASSET_TYPES,
  ASSET_STATUS
};
