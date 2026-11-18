
const User = require('../models/User');
const Society = require('../models/Society');
const mongoose = require('mongoose');
const crypto = require('crypto');

// ============================================================
// HELPER
// ============================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ============================================================
// GET ALL USERS
// GET /api/users
// ============================================================

exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      role,
      is_active,
      society_id,
      page = 1,
      limit = 50
    } = req.query;

    const query = {
      role: { $ne: 'super_admin' }
    };

    // Society scope
    if (req.user.role === 'super_admin') {
      if (society_id) {
        if (!isValidObjectId(society_id)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid society ID'
          });
        }

        query.society_id = society_id;
      }
    } else {
      if (!req.user.society_id) {
        return res.status(400).json({
          success: false,
          message: 'User is not assigned to any society'
        });
      }

      query.society_id = req.user.society_id;
    }

    // Role filter
    if (role) {
      const validRoles = [
        'manager',
        'admin',
        'resident',
        'watchman'
      ];

      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        });
      }

      query.role = role;
    }

    // Active filter
    if (is_active === 'true') {
      query.is_active = true;
    } else if (is_active === 'false') {
      query.is_active = false;
    }

    // Pagination
    const pageNumber = Math.max(parseInt(page) || 1, 1);

    const limitNumber = Math.min(
      Math.max(parseInt(limit) || 50, 1),
      100
    );

    const skip = (pageNumber - 1) * limitNumber;

    // Fetch users
    const users = await User.find(query)
      .select('-password_hash -otp -otp_expires')
      .populate(
        'society_id',
        'name society_code city state is_active'
      )
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        current: pageNumber,
        pages: Math.ceil(total / limitNumber),
        total,
        limit: limitNumber
      }
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET AVAILABLE FLATS
// GET /api/users/flats/available
//
// MANAGER ONLY
// Uses logged-in manager's society.
// ============================================================

exports.getAvailableFlats = async (req, res, next) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Only managers can view available flats'
      });
    }

    const societyId = req.user.society_id;

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'Manager is not assigned to any society'
      });
    }

    // Generate all flats
    const allFlats = [];

    for (let floor = 1; floor <= 4; floor++) {
      for (let unit = 1; unit <= 10; unit++) {
        allFlats.push(`${floor}0${unit}`.slice(-3));
      }
    }

    // Find already registered flats.
    // Inactive accounts are also considered registered.
    const registeredUsers = await User.find({
      society_id: societyId,
      flat_no: {
        $exists: true,
        $nin: [null, '']
      }
    }).select('flat_no');

    const registeredFlats = registeredUsers.map(user =>
      String(user.flat_no).trim()
    );

    const availableFlats = allFlats.filter(
      flat => !registeredFlats.includes(flat)
    );

    return res.status(200).json({
      success: true,
      data: availableFlats
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// CREATE RESIDENT
// POST /api/users/resident
//
// MANAGER ONLY
// Resident is automatically assigned to manager's society.
// ============================================================

exports.createResident = async (req, res, next) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Only managers can create residents'
      });
    }

    const {
      name,
      email,
      phone,
      flat_no,
      password
    } = req.body;

    const societyId = req.user.society_id;

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'Manager is not assigned to any society'
      });
    }

    if (!name || !email || !phone || !flat_no || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();
    const normalizedFlat = String(flat_no).trim();

    // Name validation
    if (normalizedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must contain at least 2 characters'
      });
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Phone validation
    if (!/^[0-9]{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must contain 10 digits'
      });
    }

    // Flat validation: 101-110, 201-210, 301-310, 401-410
    if (!/^[1-4](0[1-9]|10)$/.test(normalizedFlat)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid flat number'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters'
      });
    }

    // Check society
    const society = await Society.findOne({
      _id: societyId,
      is_active: true
    });

    if (!society) {
      return res.status(400).json({
        success: false,
        message: 'Manager society is inactive or not found'
      });
    }

    // Check duplicate email globally
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check duplicate flat in manager's society
    const existingFlat = await User.findOne({
      society_id: societyId,
      flat_no: normalizedFlat
    });

    if (existingFlat) {
      return res.status(400).json({
        success: false,
        message: 'This flat is already registered'
      });
    }

    // Create resident
    const resident = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      flat_no: normalizedFlat,
      password_hash: password,
      society_id: societyId,
      role: 'resident',
      is_verified: true
    });

    return res.status(201).json({
      success: true,
      message: 'Resident created successfully',
      data: resident.toJSON()
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET USER BY ID
// GET /api/users/:id
// ============================================================

exports.getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const query = { _id: userId };

    if (req.user.role !== 'super_admin') {
      if (!req.user.society_id) {
        return res.status(400).json({
          success: false,
          message: 'User is not assigned to any society'
        });
      }

      query.society_id = req.user.society_id;
    }

    const user = await User.findOne(query)
      .select('-password_hash -otp -otp_expires')
      .populate(
        'society_id',
        'name society_code city state is_active'
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE USER ROLE
// PUT /api/users/:id/role
// ============================================================

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    const validRoles = ['admin', 'resident'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be admin or resident'
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const query = { _id: userId };

    if (req.user.role !== 'super_admin') {
      if (!req.user.society_id) {
        return res.status(400).json({
          success: false,
          message: 'User is not assigned to any society'
        });
      }

      query.society_id = req.user.society_id;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'manager') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change manager role'
      });
    }

    if (user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change super admin role'
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      data: user.toJSON()
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// CREATE WATCHMAN
// POST /api/users/watchman
// ============================================================

exports.createWatchman = async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    const societyId = req.user.society_id;

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message: 'User is not assigned to any society'
      });
    }

    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and phone'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');

    const watchman = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      society_id: societyId,
      role: 'watchman',
      password_hash: tempPassword,
      is_verified: true
    });

    return res.status(201).json({
      success: true,
      message: 'Watchman account created successfully',
      data: {
        user: watchman.toJSON(),
        tempPassword
      }
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// DEACTIVATE USER
// DELETE /api/users/:id
// ============================================================

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const query = { _id: userId };

    if (req.user.role !== 'super_admin') {
      if (!req.user.society_id) {
        return res.status(400).json({
          success: false,
          message: 'User is not assigned to any society'
        });
      }

      query.society_id = req.user.society_id;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'manager') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate manager account'
      });
    }

    if (user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate super admin account'
      });
    }

    user.is_active = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User account deactivated',
      data: user.toJSON()
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// ACTIVATE USER
// PUT /api/users/:id/activate
// ============================================================

exports.activateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    const query = { _id: userId };

    if (req.user.role !== 'super_admin') {
      if (!req.user.society_id) {
        return res.status(400).json({
          success: false,
          message: 'User is not assigned to any society'
        });
      }

      query.society_id = req.user.society_id;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify super admin account'
      });
    }

    user.is_active = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User account activated',
      data: user.toJSON()
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET USERS BY SOCIETY
// GET /api/users/society/:societyId
// SUPER ADMIN ONLY
// ============================================================

exports.getUsersBySociety = async (req, res, next) => {
  try {
    const { societyId } = req.params;

    if (!isValidObjectId(societyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid society ID'
      });
    }

    const users = await User.find({
      society_id: societyId,
      role: { $ne: 'super_admin' }
    })
      .select('-password_hash -otp -otp_expires')
      .populate(
        'society_id',
        'name society_code city state is_active'
      )
      .sort({
        role: 1,
        created_at: -1
      });

    return res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET SOCIETY USER STATS
// GET /api/users/society/:societyId/stats
// SUPER ADMIN ONLY
// ============================================================

exports.getSocietyUserStats = async (req, res, next) => {
  try {
    const { societyId } = req.params;

    if (!isValidObjectId(societyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid society ID'
      });
    }

    const objectId = new mongoose.Types.ObjectId(societyId);

    const stats = await User.aggregate([
      {
        $match: {
          society_id: objectId,
          role: { $ne: 'super_admin' }
        }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: ['$is_active', 1, 0]
            }
          }
        }
      }
    ]);

    const result = {
      total: 0,
      active: 0,
      inactive: 0,
      manager: 0,
      admin: 0,
      resident: 0,
      watchman: 0
    };

    stats.forEach(item => {
      if (
        Object.prototype.hasOwnProperty.call(
          result,
          item._id
        )
      ) {
        result[item._id] = item.count;
      }

      result.total += item.count;
      result.active += item.active;
    });

    result.inactive = result.total - result.active;

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};
