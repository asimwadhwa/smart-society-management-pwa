const Society = require('../models/Society');
const User = require('../models/User');

/**
 * ============================================================
 * CREATE SOCIETY
 * ============================================================
 * POST /api/societies
 * Super Admin only
 */
exports.createSociety = async (req, res, next) => {
  try {
    const {
      name,
      society_code,
      address,
      city,
      state,
      contact_number
    } = req.body;

    if (
      !name ||
      !society_code ||
      !address ||
      !city ||
      !state ||
      !contact_number
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide all required society details'
      });
    }

    const cleanName = name.trim();
    const cleanCode =
      society_code.trim().toUpperCase();
    const cleanAddress = address.trim();
    const cleanCity = city.trim();
    const cleanState = state.trim();
    const cleanContact = contact_number.trim();

    const existingSociety =
      await Society.findOne({
        society_code: cleanCode
      });

    if (existingSociety) {
      return res.status(400).json({
        success: false,
        message:
          'Society code already exists'
      });
    }

    const society =
      await Society.create({
        name: cleanName,
        society_code: cleanCode,
        address: cleanAddress,
        city: cleanCity,
        state: cleanState,
        contact_number: cleanContact,
        is_active: true
      });

    return res.status(201).json({
      success: true,
      message:
        'Society created successfully',
      data: society
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          'Society code already exists'
      });
    }

    next(error);
  }
};


/**
 * ============================================================
 * GET ALL SOCIETIES
 * ============================================================
 * GET /api/societies
 * Super Admin only
 */
exports.getAllSocieties = async (
  req,
  res,
  next
) => {
  try {
    const societies =
      await Society.find()
        .sort({
          created_at: -1
        });

    return res.status(200).json({
      success: true,
      data: societies
    });

  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * GET SOCIETY BY ID
 * ============================================================
 * GET /api/societies/:id
 * Super Admin only
 */
exports.getSocietyById = async (
  req,
  res,
  next
) => {
  try {
    const society =
      await Society.findById(
        req.params.id
      );

    if (!society) {
      return res.status(404).json({
        success: false,
        message:
          'Society not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: society
    });

  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * UPDATE SOCIETY
 * ============================================================
 * PUT /api/societies/:id
 * Super Admin only
 */
exports.updateSociety = async (
  req,
  res,
  next
) => {
  try {
    const {
      name,
      society_code,
      address,
      city,
      state,
      contact_number,
      is_active
    } = req.body;

    const society =
      await Society.findById(
        req.params.id
      );

    if (!society) {
      return res.status(404).json({
        success: false,
        message:
          'Society not found'
      });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            'Society name cannot be empty'
        });
      }

      society.name =
        name.trim();
    }

    if (society_code !== undefined) {
      if (!society_code.trim()) {
        return res.status(400).json({
          success: false,
          message:
            'Society code cannot be empty'
        });
      }

      society.society_code =
        society_code
          .trim()
          .toUpperCase();
    }

    if (address !== undefined) {
      society.address =
        address.trim();
    }

    if (city !== undefined) {
      society.city =
        city.trim();
    }

    if (state !== undefined) {
      society.state =
        state.trim();
    }

    if (contact_number !== undefined) {
      society.contact_number =
        contact_number.trim();
    }

    if (is_active !== undefined) {
      society.is_active =
        Boolean(is_active);
    }

    await society.save();

    return res.status(200).json({
      success: true,
      message:
        'Society updated successfully',
      data: society
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          'Society code already exists'
      });
    }

    next(error);
  }
};


/**
 * ============================================================
 * DEACTIVATE SOCIETY
 * ============================================================
 * DELETE /api/societies/:id
 * Super Admin only
 */
exports.deactivateSociety = async (
  req,
  res,
  next
) => {
  try {
    const society =
      await Society.findById(
        req.params.id
      );

    if (!society) {
      return res.status(404).json({
        success: false,
        message:
          'Society not found'
      });
    }

    society.is_active = false;

    await society.save();

    return res.status(200).json({
      success: true,
      message:
        'Society deactivated successfully',
      data: society
    });

  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * ACTIVATE SOCIETY
 * ============================================================
 * PUT /api/societies/:id/activate
 * Super Admin only
 */
exports.activateSociety = async (
  req,
  res,
  next
) => {
  try {
    const society =
      await Society.findById(
        req.params.id
      );

    if (!society) {
      return res.status(404).json({
        success: false,
        message:
          'Society not found'
      });
    }

    society.is_active = true;

    await society.save();

    return res.status(200).json({
      success: true,
      message:
        'Society activated successfully',
      data: society
    });

  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * GET SOCIETY STATISTICS
 * ============================================================
 * GET /api/societies/:id/stats
 * Super Admin only
 */
exports.getSocietyStats = async (
  req,
  res,
  next
) => {
  try {
    const societyId =
      req.params.id;

    const society =
      await Society.findById(
        societyId
      );

    if (!society) {
      return res.status(404).json({
        success: false,
        message:
          'Society not found'
      });
    }

    const totalUsers =
      await User.countDocuments({
        society_id: societyId
      });

    const activeUsers =
      await User.countDocuments({
        society_id: societyId,
        is_active: true
      });

    const inactiveUsers =
      await User.countDocuments({
        society_id: societyId,
        is_active: false
      });

    const managers =
      await User.countDocuments({
        society_id: societyId,
        role: 'manager'
      });

    const admins =
      await User.countDocuments({
        society_id: societyId,
        role: 'admin'
      });

    const residents =
      await User.countDocuments({
        society_id: societyId,
        role: 'resident'
      });

    const watchmen =
      await User.countDocuments({
        society_id: societyId,
        role: 'watchman'
      });

    return res.status(200).json({
      success: true,
      data: {
        society: {
          _id: society._id,
          name: society.name,
          society_code:
            society.society_code,
          is_active:
            society.is_active
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers
        },
        roles: {
          manager: managers,
          admin: admins,
          resident: residents,
          watchman: watchmen
        }
      }
    });

  } catch (error) {
    next(error);
  }
};


/**
 * ============================================================
 * GET SOCIETY MANAGER
 * ============================================================
 * GET /api/societies/:id/manager
 * Super Admin only
 */
exports.getSocietyManager = async (
  req,
  res,
  next
) => {
  try {
    const societyId =
      req.params.id;

    const society =
      await Society.findById(
        societyId
      );

    if (!society) {
      return res.status(404).json({
        success: false,
        message:
          'Society not found'
      });
    }

    const manager =
      await User.findOne({
        society_id: societyId,
        role: 'manager'
      }).select(
        '-password_hash -otp -otp_expires'
      );

    if (!manager) {
      return res.status(404).json({
        success: false,
        message:
          'Manager not found for this society'
      });
    }

    return res.status(200).json({
      success: true,
      data: manager
    });

  } catch (error) {
    next(error);
  }
};