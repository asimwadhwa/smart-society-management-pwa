const User = require('../models/User');
const crypto = require('crypto');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (Manager, Admin)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, is_active, page = 1, limit = 50 } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (is_active !== undefined) query.is_active = is_active === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password_hash -otp -otp_expires')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available (unregistered) flats
 * @route   GET /api/users/flats/available
 * @access  Private
 */
exports.getAvailableFlats = async (req, res, next) => {
  try {
    // Generate all possible flats (101-410)
    const allFlats = [];
    for (let floor = 1; floor <= 4; floor++) {
      for (let unit = 1; unit <= 10; unit++) {
        allFlats.push(`${floor}0${unit}`.slice(-3));
      }
    }

    // Get registered flats
    const registeredUsers = await User.find({ 
      flat_no: { $exists: true, $ne: null },
      is_active: true 
    }).select('flat_no');
    
    const registeredFlats = registeredUsers.map(u => u.flat_no);

    // Filter available flats
    const availableFlats = allFlats.filter(flat => !registeredFlats.includes(flat));

    res.status(200).json({
      success: true,
      data: availableFlats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private (Manager, Admin)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password_hash -otp -otp_expires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role
 * @route   PUT /api/users/:id/role
 * @access  Private (Manager only)
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    // Validate role
    const validRoles = ['admin', 'resident'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin or resident'
      });
    }

    // Cannot change own role
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot change manager's role
    if (user.role === 'manager') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change manager role'
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create watchman account
 * @route   POST /api/users/watchman
 * @access  Private (Manager only)
 */
exports.createWatchman = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and phone'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generate random password
    const tempPassword = crypto.randomBytes(4).toString('hex'); // 8 character password

    // Create watchman user
    const watchman = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      role: 'watchman',
      password_hash: tempPassword, // Will be hashed by pre-save hook
      is_verified: true
    });

    res.status(201).json({
      success: true,
      message: 'Watchman account created successfully',
      data: {
        user: watchman.toJSON(),
        tempPassword // Return the unhashed password for manager to share
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate user (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private (Manager only)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Cannot delete self
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot delete manager
    if (user.role === 'manager') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate manager account'
      });
    }

    // Soft delete - set is_active to false
    user.is_active = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User account deactivated',
      data: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};
