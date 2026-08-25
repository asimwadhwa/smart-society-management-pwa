// Application Constants

// Maintenance
export const MONTHLY_MAINTENANCE_AMOUNT = 1000; // ₹1000
export const LATE_FEE_AMOUNT = 100; // ₹100
export const LATE_FEE_DAYS = 18;

// User Roles
export const ROLES = {
  MANAGER: 'manager',
  ADMIN: 'admin',
  RESIDENT: 'resident',
  WATCHMAN: 'watchman',
} as const;

// Maintenance Status
export const MAINTENANCE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
} as const;

// Complaint Status
export const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
} as const;

// Emergency Status
export const EMERGENCY_STATUS = {
  ACTIVE: 'active',
  RESOLVED: 'resolved',
} as const;

// Asset Types
export const ASSET_TYPES = {
  LIFT: 'lift',
  WATER_PUMP: 'water_pump',
  GENERATOR: 'generator',
} as const;

// Asset Status
export const ASSET_STATUS = {
  WORKING: 'working',
  UNDER_MAINTENANCE: 'under_maintenance',
  NOT_WORKING: 'not_working',
} as const;

// Society Info
export const SOCIETY_NAME = 'Asim Wadhwa';
export const SOCIETY_TAGLINE = 'Society Management';

// Flat numbers list (4 floors, 10 flats each)
export const FLAT_NUMBERS = [
  '101', '102', '103', '104', '105', '106', '107', '108', '109', '110',
  '201', '202', '203', '204', '205', '206', '207', '208', '209', '210',
  '301', '302', '303', '304', '305', '306', '307', '308', '309', '310',
  '401', '402', '403', '404', '405', '406', '407', '408', '409', '410',
];

// Emergency polling interval (30 seconds)
export const EMERGENCY_POLL_INTERVAL = 30000;
