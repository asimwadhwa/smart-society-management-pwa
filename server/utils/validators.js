/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (10 digits for India)
 * @param {string} phone 
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate flat number format (e.g., 101, 102, 201)
 * @param {string} flatNo 
 * @returns {boolean}
 */
const isValidFlatNo = (flatNo) => {
  const flatRegex = /^[1-9]\d{2}$/;
  return flatRegex.test(flatNo);
};

/**
 * Validate password strength
 * @param {string} password 
 * @returns {object} { isValid, message }
 */
const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { 
      isValid: false, 
      message: 'Password must be at least 6 characters long' 
    };
  }
  return { isValid: true, message: '' };
};

/**
 * Validate OTP format (6 digits)
 * @param {string} otp 
 * @returns {boolean}
 */
const isValidOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

/**
 * List of all flat numbers in the society
 * Format: Floor (1-4) + Unit (01-10)
 * Generates: 101, 102, ..., 110, 201, ..., 410
 */
const getAllFlatNumbers = () => {
  const flats = [];
  for (let floor = 1; floor <= 4; floor++) {
    for (let unit = 1; unit <= 10; unit++) {
      flats.push(`${floor}0${unit > 9 ? '' : ''}${unit}`);
    }
  }
  return flats;
};

// Predefined flat numbers (30-40 flats)
const FLAT_NUMBERS = [
  '101', '102', '103', '104', '105', '106', '107', '108', '109', '110',
  '201', '202', '203', '204', '205', '206', '207', '208', '209', '210',
  '301', '302', '303', '304', '305', '306', '307', '308', '309', '310',
  '401', '402', '403', '404', '405', '406', '407', '408', '409', '410'
];

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidFlatNo,
  validatePassword,
  isValidOTP,
  getAllFlatNumbers,
  FLAT_NUMBERS
};
