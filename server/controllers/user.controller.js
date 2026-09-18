const User = require('../models/User');
const crypto = require('crypto');

/**
 * ============================================================
 * GET ALL USERS
 * ============================================================
 * Manager/Admin:
 *   - Only their own society
 *
 * Super Admin:
 *   - Can view users from any society
 *   - Use ?society_id=...
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      role,
      is_active,
      society_id,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    // ----------------------------------------------------------
    // SOCIETY SCOPE
    // ----------------------------------------------------------

    if (req.user.role === 'super_admin') {
      if (society_id) {
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

    // ----------------------------------------------------------
    // FILTERS
    // ----------------------------------------------------------

    if (role) {
      query.role = role;
    }

    if (is_active !== undefined) {
      query.is_active = is_active === 'true';
    }

    // ----------------------------------------------------------
    // PAGINATION
    // ----------------------------------------------------------

    const pageNumber = Math.max(
      parseInt(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(parseInt(limit) || 50, 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const users = await User.find(query)
      .select('-password_hash -otp -otp_expires')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total =
      await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        current: pageNumber,
        pages: Math.ceil(
          total / limitNumber
        ),
        total,
        limit: limitNumber
      }
    });

  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * GET AVAILABLE FLATS
 * ============================================================
 * Manager/Admin only
 */
exports.getAvailableFlats = async (req, res, next) => {
  try {
    const societyId =
      req.user.society_id;

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }

    const allFlats = [];

    for (let floor = 1; floor <= 4; floor++) {
      for (let unit = 1; unit <= 10; unit++) {
        allFlats.push(
          `${floor}0${unit}`.slice(-3)
        );
      }
    }

    const registeredUsers =
      await User.find({
        society_id: societyId,
        flat_no: {
          $exists: true,
          $ne: null
        },
        is_active: true
      }).select('flat_no');

    const registeredFlats =
      registeredUsers.map(
        user => user.flat_no
      );

    const availableFlats =
      allFlats.filter(
        flat =>
          !registeredFlats.includes(flat)
      );

    return res.status(200).json({
      success: true,
      data: availableFlats
    });

  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * GET USER BY ID
 * ============================================================
 * Manager/Admin:
 *   - Own society only
 *
 * Super Admin:
 *   - Any user
 */
exports.getUserById = async (req, res, next) => {
  try {
    const query = {
      _id: req.params.id
    };

    if (req.user.role !== 'super_admin') {

      const societyId =
        req.user.society_id;

      if (!societyId) {
        return res.status(400).json({
          success: false,
          message:
            'User is not assigned to any society'
        });
      }

      query.society_id = societyId;
    }

    const user =
      await User.findOne(query)
        .select(
          '-password_hash -otp -otp_expires'
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


/**
 * ============================================================
 * UPDATE USER ROLE
 * ============================================================
 *
 * Manager/Admin:
 *   - Resident <-> Admin
 *
 * Super Admin:
 *   - Can change Admin/Resident
 *   - Cannot change Super Admin
 *   - Cannot change Manager through this API
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const {
      role
    } = req.body;

    const userId =
      req.params.id;

    const validRoles = [
      'admin',
      'resident'
    ];

    if (
      !role ||
      !validRoles.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid role. Must be admin or resident'
      });
    }

    if (
      userId ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot change your own role'
      });
    }

    const query = {
      _id: userId
    };

    // ----------------------------------------------------------
    // SOCIETY SECURITY
    // ----------------------------------------------------------

    if (
      req.user.role !== 'super_admin'
    ) {
      if (!req.user.society_id) {
        return res.status(400).json({
          success: false,
          message:
            'User is not assigned to any society'
        });
      }

      query.society_id =
        req.user.society_id;
    }

    const user =
      await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (
      user.role === 'manager'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot change manager role'
      });
    }

    if (
      user.role === 'super_admin'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot change super admin role'
      });
    }

    user.role = role;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        `User role updated to ${role}`,
      data: user.toJSON()
    });

  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * CREATE WATCHMAN
 * ============================================================
 * Existing functionality preserved.
 */
exports.createWatchman = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone
    } = req.body;

    const societyId =
      req.user.society_id;

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }

    if (
      !name ||
      !email ||
      !phone
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide name, email and phone'
      });
    }

    const existingUser =
      await User.findOne({
        email: email.toLowerCase()
      });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          'Email already registered'
      });
    }

    const tempPassword =
      crypto
        .randomBytes(4)
        .toString('hex');

    const watchman =
      await User.create({
        name: name.trim(),
        email:
          email.toLowerCase().trim(),
        phone: phone.trim(),
        society_id: societyId,
        role: 'watchman',
        password_hash:
          tempPassword,
        is_verified: true
      });

    return res.status(201).json({
      success: true,
      message:
        'Watchman account created successfully',
      data: {
        user: watchman.toJSON(),
        tempPassword
      }
    });

  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * DEACTIVATE USER
 * ============================================================
 *
 * Manager/Admin:
 *   - Own society
 *
 * Super Admin:
 *   - Any society user
 *   - Cannot deactivate himself
 *   - Cannot deactivate another Super Admin
 *   - Cannot deactivate Manager
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const userId =
      req.params.id;

    if (
      userId ===
      req.user._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot deactivate your own account'
      });
    }

    const query = {
      _id: userId
    };

    // ----------------------------------------------------------
    // SOCIETY SECURITY
    // ----------------------------------------------------------

    if (
      req.user.role !== 'super_admin'
    ) {
      const societyId =
        req.user.society_id;

      if (!societyId) {
        return res.status(400).json({
          success: false,
          message:
            'User is not assigned to any society'
        });
      }

      query.society_id =
        societyId;
    }

    const user =
      await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          'User not found'
      });
    }

    if (
      user.role === 'manager'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot deactivate manager account'
      });
    }

    if (
      user.role === 'super_admin'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot deactivate super admin account'
      });
    }

    user.is_active = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        'User account deactivated',
      data: user.toJSON()
    });

  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * ACTIVATE USER
 * ============================================================
 *
 * Super Admin:
 *   - Any society user
 *
 * Manager/Admin:
 *   - Own society users
 */
exports.activateUser = async (req, res, next) => {
  try {
    const userId =
      req.params.id;

    const query = {
      _id: userId
    };

    if (
      req.user.role !== 'super_admin'
    ) {
      if (!req.user.society_id) {
        return res.status(400).json({
          success: false,
          message:
            'User is not assigned to any society'
        });
      }

      query.society_id =
        req.user.society_id;
    }

    const user =
      await User.findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          'User not found'
      });
    }

    if (
      user.role === 'super_admin'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Cannot modify super admin account'
      });
    }

    user.is_active = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        'User account activated',
      data: user.toJSON()
    });

  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * GET USERS BY SOCIETY
 * ============================================================
 * Super Admin only
 *
 * GET /api/users/society/:societyId
 */
exports.getUsersBySociety = async (
  req,
  res,
  next
) => {
  try {
    const {
      societyId
    } = req.params;

    const users =
      await User.find({
        society_id: societyId
      })
        .select(
          '-password_hash -otp -otp_expires'
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


/**
 * ============================================================
 * GET SOCIETY USER STATS
 * ============================================================
 * Super Admin only
 *
 * GET /api/users/society/:societyId/stats
 */
exports.getSocietyUserStats = async (
  req,
  res,
  next
) => {
  try {
    const {
      societyId
    } = req.params;

    const stats =
      await User.aggregate([
        {
          $match: {
            society_id:
              require('mongoose').Types.ObjectId.createFromHexString(
                societyId
              )
          }
        },
        {
          $group: {
            _id: '$role',
            count: {
              $sum: 1
            },
            active: {
              $sum: {
                $cond: [
                  '$is_active',
                  1,
                  0
                ]
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
      result[item._id] =
        item.count;

      result.total +=
        item.count;

      result.active +=
        item.active;
    });

    result.inactive =
      result.total -
      result.active;

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};