const Society = require('../models/Society');
const User = require('../models/User');
const Maintenance = require('../models/Maintenance');
const mongoose = require('mongoose');

// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const cleanString = (value) => {
  return typeof value === 'string'
    ? value.trim()
    : '';
};

// ============================================================
// CREATE CURRENT MONTH MAINTENANCE FOR USER
// ============================================================

const createCurrentMonthMaintenance = async (
  user,
  societyId
) => {
  try {
    if (!user || !user._id) {
      return null;
    }

    if (!societyId) {
      return null;
    }

    if (!user.flat_no) {
      console.log(
        `⚠️ Maintenance skipped for ${user.name}: flat number missing`
      );

      return null;
    }

    const now = new Date();

    const month =
      now.getMonth() + 1;

    const year =
      now.getFullYear();

    // --------------------------------------------------------
    // Check if maintenance already exists
    // --------------------------------------------------------

    const existing =
      await Maintenance.findOne({
        society_id: societyId,
        user_id: user._id,
        month,
        year
      });

    if (existing) {
      console.log(
        `ℹ️ Maintenance already exists for ${user.name} - ${month}/${year}`
      );

      return existing;
    }

    // --------------------------------------------------------
    // Due date
    // --------------------------------------------------------

    const dueDate =
      new Date(
        year,
        month - 1,
        18
      );

    // --------------------------------------------------------
    // Create maintenance
    // --------------------------------------------------------

    const maintenance =
      await Maintenance.create({
        society_id: societyId,

        user_id: user._id,

        flat_no:
          user.flat_no,

        month,

        year,

        amount: 1000,

        late_fee: 0,

        total_amount: 1000,

        due_date:
          dueDate,

        paid_date: null,

        status: 'pending',

        razorpay_payment_id:
          null,

        razorpay_order_id:
          null
      });

    console.log(
      `✅ Current month maintenance created for ${user.name} - ${month}/${year}`
    );

    return maintenance;

  } catch (error) {

    /*
     * If another request created the same record
     * at the same time, don't fail manager creation.
     */
    if (
      error.code === 11000
    ) {

      console.log(
        `ℹ️ Maintenance already exists for user ${user._id}`
      );

      return await Maintenance.findOne({
        society_id:
          societyId,

        user_id:
          user._id,

        month:
          new Date().getMonth() + 1,

        year:
          new Date().getFullYear()
      });
    }

    console.error(
      'Error creating current month maintenance:',
      error
    );

    /*
     * Manager creation should not fail only because
     * maintenance creation failed.
     */
    return null;
  }
};

// ============================================================
// CREATE SOCIETY
// POST /api/societies
// ============================================================

exports.createSociety = async (
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

    const cleanName =
      cleanString(name);

    const cleanCode =
      cleanString(
        society_code
      ).toUpperCase();

    const cleanAddress =
      cleanString(address);

    const cleanCity =
      cleanString(city);

    const cleanState =
      cleanString(state);

    const cleanContact =
      cleanString(contact_number);

    if (
      !cleanName ||
      !cleanCode ||
      !cleanAddress ||
      !cleanCity ||
      !cleanState
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Society details cannot be empty'
      });
    }

    if (
      !/^[6-9]\d{9}$/.test(
        cleanContact
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Please enter a valid 10-digit contact number'
      });
    }

    const existingSociety =
      await Society.findOne({
        society_code:
          cleanCode
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
        name:
          cleanName,

        society_code:
          cleanCode,

        address:
          cleanAddress,

        city:
          cleanCity,

        state:
          cleanState,

        contact_number:
          cleanContact,

        is_active:
          true
      });

    return res.status(201).json({
      success: true,
      message:
        'Society created successfully',
      data:
        society
    });

  } catch (error) {

    if (
      error.code === 11000
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Society code already exists'
      });
    }

    next(error);
  }
};

// ============================================================
// GET ALL SOCIETIES
// GET /api/societies
// ============================================================

exports.getAllSocieties =
  async (
    req,
    res,
    next
  ) => {

    try {

      const societies =
        await Society.find()
          .sort({
            created_at:
              -1
          });

      return res.status(200).json({
        success: true,
        data:
          societies
      });

    } catch (error) {
      next(error);
    }
  };

// ============================================================
// GET SOCIETY BY ID
// GET /api/societies/:id
// ============================================================

exports.getSocietyById =
  async (
    req,
    res,
    next
  ) => {

    try {

      if (
        !isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid society ID'
        });
      }

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
        data:
          society
      });

    } catch (error) {
      next(error);
    }
  };

// ============================================================
// UPDATE SOCIETY
// PUT /api/societies/:id
// ============================================================

exports.updateSociety =
  async (
    req,
    res,
    next
  ) => {

    try {

      if (
        !isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid society ID'
        });
      }

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

      if (
        name !== undefined
      ) {

        const value =
          cleanString(name);

        if (!value) {
          return res.status(400).json({
            success: false,
            message:
              'Society name cannot be empty'
          });
        }

        society.name =
          value;
      }

      if (
        society_code !==
        undefined
      ) {

        const value =
          cleanString(
            society_code
          ).toUpperCase();

        if (!value) {
          return res.status(400).json({
            success: false,
            message:
              'Society code cannot be empty'
          });
        }

        society.society_code =
          value;
      }

      if (
        address !== undefined
      ) {
        society.address =
          cleanString(address);
      }

      if (
        city !== undefined
      ) {
        society.city =
          cleanString(city);
      }

      if (
        state !== undefined
      ) {
        society.state =
          cleanString(state);
      }

      if (
        contact_number !==
        undefined
      ) {

        const value =
          cleanString(
            contact_number
          );

        if (
          !/^[6-9]\d{9}$/.test(
            value
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Please enter a valid 10-digit contact number'
          });
        }

        society.contact_number =
          value;
      }

      if (
        is_active !==
        undefined
      ) {

        if (
          typeof is_active ===
          'boolean'
        ) {

          society.is_active =
            is_active;

        } else if (
          String(
            is_active
          ).toLowerCase() ===
          'true'
        ) {

          society.is_active =
            true;

        } else if (
          String(
            is_active
          ).toLowerCase() ===
          'false'
        ) {

          society.is_active =
            false;
        }
      }

      await society.save();

      return res.status(200).json({
        success: true,
        message:
          'Society updated successfully',
        data:
          society
      });

    } catch (error) {

      if (
        error.code ===
        11000
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Society code already exists'
        });
      }

      next(error);
    }
  };

// ============================================================
// DEACTIVATE SOCIETY
// DELETE /api/societies/:id
// ============================================================

exports.deactivateSociety =
  async (
    req,
    res,
    next
  ) => {

    try {

      if (
        !isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid society ID'
        });
      }

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

      society.is_active =
        false;

      await society.save();

      return res.status(200).json({
        success: true,
        message:
          'Society deactivated successfully',
        data:
          society
      });

    } catch (error) {
      next(error);
    }
  };

// ============================================================
// ACTIVATE SOCIETY
// PUT /api/societies/:id/activate
// ============================================================

exports.activateSociety =
  async (
    req,
    res,
    next
  ) => {

    try {

      if (
        !isValidObjectId(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid society ID'
        });
      }

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

      society.is_active =
        true;

      await society.save();

      return res.status(200).json({
        success: true,
        message:
          'Society activated successfully',
        data:
          society
      });

    } catch (error) {
      next(error);
    }
  };

// ============================================================
// GET SOCIETY STATISTICS
// GET /api/societies/:id/stats
// ============================================================

exports.getSocietyStats =
  async (
    req,
    res,
    next
  ) => {

    try {

      const societyId =
        req.params.id;

      if (
        !isValidObjectId(
          societyId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid society ID'
        });
      }

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

      const [
        totalUsers,
        activeUsers,
        inactiveUsers,
        managers,
        admins,
        residents,
        watchmen
      ] =
        await Promise.all([
          User.countDocuments({
            society_id:
              societyId
          }),

          User.countDocuments({
            society_id:
              societyId,
            is_active:
              true
          }),

          User.countDocuments({
            society_id:
              societyId,
            is_active:
              false
          }),

          User.countDocuments({
            society_id:
              societyId,
            role:
              'manager'
          }),

          User.countDocuments({
            society_id:
              societyId,
            role:
              'admin'
          }),

          User.countDocuments({
            society_id:
              societyId,
            role:
              'resident'
          }),

          User.countDocuments({
            society_id:
              societyId,
            role:
              'watchman'
          })
        ]);

      return res.status(200).json({
        success: true,

        data: {

          totalUsers,

          activeUsers,

          inactiveUsers,

          managers,

          admins,

          residents,

          watchmen,

          society: {
            _id:
              society._id,

            name:
              society.name,

            society_code:
              society.society_code,

            is_active:
              society.is_active
          },

          users: {
            total:
              totalUsers,

            active:
              activeUsers,

            inactive:
              inactiveUsers
          },

          roles: {
            manager:
              managers,

            admin:
              admins,

            resident:
              residents,

            watchman:
              watchmen
          }
        }
      });

    } catch (error) {
      next(error);
    }
  };

// ============================================================
// GET SOCIETY MANAGER
// GET /api/societies/:id/manager
// ============================================================

exports.getSocietyManager =
  async (
    req,
    res,
    next
  ) => {

    try {

      const societyId =
        req.params.id;

      if (
        !isValidObjectId(
          societyId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid society ID'
        });
      }

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
          society_id:
            societyId,

          role:
            'manager'
        }).select(
          '-password_hash -otp -otp_expires -reset_password_otp -reset_password_otp_expires'
        );

      return res.status(200).json({
        success: true,

        data:
          manager || null,

        hasManager:
          !!manager
      });

    } catch (error) {
      next(error);
    }
  };

// ============================================================
// ASSIGN / REPLACE MANAGER
//
// PUT /api/societies/:id/manager
// ============================================================

exports.assignOrReplaceManager =
  async (
    req,
    res,
    next
  ) => {

    try {

      const societyId =
        req.params.id;

      if (
        !isValidObjectId(
          societyId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid society ID'
        });
      }

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

      if (
        !society.is_active
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Cannot assign manager to an inactive society'
        });
      }

      const currentManager =
        await User.findOne({
          society_id:
            societyId,

          role:
            'manager'
        });

      const {
        user_id
      } = req.body;

      // ========================================================
      // EXISTING USER -> MANAGER
      // ========================================================

      if (user_id) {

        if (
          !isValidObjectId(
            user_id
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid manager user ID'
          });
        }

        if (
          currentManager &&
          currentManager._id
            .toString() ===
            user_id.toString()
        ) {
          return res.status(400).json({
            success: false,
            message:
              'This user is already the manager of this society'
          });
        }

        const newManager =
          await User.findOne({
            _id:
              user_id,

            society_id:
              societyId,

            role: {
              $in: [
                'resident',
                'admin'
              ]
            },

            is_active:
              true
          });

        if (!newManager) {
          return res.status(404).json({
            success: false,
            message:
              'Active resident/admin from this society was not found'
          });
        }

        // ------------------------------------------------------
        // Promote existing user
        // ------------------------------------------------------

        newManager.role =
          'manager';

        newManager.is_active =
          true;

        await newManager.save();

        // ------------------------------------------------------
        // IMPORTANT:
        // Create current month's maintenance immediately
        // ------------------------------------------------------

        await createCurrentMonthMaintenance(
          newManager,
          societyId
        );

        // ------------------------------------------------------
        // Retire old manager
        // ------------------------------------------------------

        if (
          currentManager
        ) {

          currentManager.role =
            'resident';

          currentManager.is_active =
            false;

          await currentManager.save();
        }

        return res.status(200).json({

          success: true,

          message:
            `${newManager.name} is now the manager of ${society.name}`,

          data: {

            manager:
              newManager.toJSON(),

            previous_manager:
              currentManager
                ? currentManager.toJSON()
                : null,

            society: {

              _id:
                society._id,

              name:
                society.name,

              society_code:
                society.society_code
            }
          }
        });
      }

      // ========================================================
      // CREATE NEW MANAGER
      // ========================================================

      const {
        name,
        email,
        password,
        phone,
        flat_no
      } = req.body;

      const cleanName =
        cleanString(name);

      const cleanEmail =
        cleanString(
          email
        ).toLowerCase();

      const cleanPassword =
        typeof password ===
        'string'
          ? password
          : '';

      const cleanPhone =
        cleanString(phone);

      const cleanFlatNo =
        cleanString(flat_no);

      if (
        !cleanName ||
        !cleanEmail ||
        !cleanPassword ||
        !cleanPhone ||
        !cleanFlatNo
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Name, email, password, phone and flat number are required'
        });
      }

      if (
        cleanName.length < 2
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Name must be at least 2 characters'
        });
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          cleanEmail
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid email address'
        });
      }

      if (
        cleanPassword.length < 8
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Password must be at least 8 characters'
        });
      }

      if (
        !/^[6-9]\d{9}$/.test(
          cleanPhone
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Please enter a valid 10-digit phone number'
        });
      }

      // ========================================================
      // EMAIL UNIQUE
      // ========================================================

      const existingEmail =
        await User.findOne({
          email:
            cleanEmail
        });

      if (
        existingEmail
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Email is already registered. Please use another email.'
        });
      }

      // ========================================================
      // FLAT UNIQUE WITHIN SOCIETY
      // ========================================================

      const existingFlat =
        await User.findOne({

          society_id:
            societyId,

          flat_no:
            cleanFlatNo,

          is_active:
            true
        });

      if (
        existingFlat
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Flat ${cleanFlatNo} is already registered in ${society.name}`
        });
      }

      // ========================================================
      // CREATE NEW MANAGER
      // ========================================================

      const manager =
        await User.create({

          name:
            cleanName,

          email:
            cleanEmail,

          password_hash:
            cleanPassword,

          flat_no:
            cleanFlatNo,

          phone:
            cleanPhone,

          society_id:
            society._id,

          role:
            'manager',

          is_active:
            true,

          is_verified:
            true
        });

      // ========================================================
      // IMPORTANT:
      // CREATE CURRENT MONTH MAINTENANCE IMMEDIATELY
      // ========================================================

      await createCurrentMonthMaintenance(
        manager,
        societyId
      );

      // ========================================================
      // RETIRE OLD MANAGER
      // ========================================================

      if (
        currentManager
      ) {

        currentManager.role =
          'resident';

        currentManager.is_active =
          false;

        await currentManager.save();
      }

      return res.status(
        currentManager
          ? 200
          : 201
      ).json({

        success: true,

        message:
          currentManager
            ? `${manager.name} is now the manager of ${society.name}`
            : `Manager created successfully for ${society.name}`,

        data: {

          manager:
            manager.toJSON(),

          previous_manager:
            currentManager
              ? currentManager.toJSON()
              : null,

          society: {

            _id:
              society._id,

            name:
              society.name,

            society_code:
              society.society_code
          }
        }
      });

    } catch (error) {

      console.error(
        'Assign/replace manager error:',
        error
      );

      if (
        error.name ===
        'ValidationError'
      ) {

        return res.status(400).json({

          success: false,

          message:
            Object.values(
              error.errors
            )
              .map(
                err =>
                  err.message
              )
              .join('. ')
        });
      }

      if (
        error.code ===
        11000
      ) {

        return res.status(400).json({

          success: false,

          message:
            'Duplicate data already exists'
        });
      }

      next(error);
    }
  };

// ============================================================
// REMOVE MANAGER
//
// DELETE /api/societies/:id/manager
// ============================================================

exports.removeSocietyManager =
  async (
    req,
    res,
    next
  ) => {

    try {

      const societyId =
        req.params.id;

      if (
        !isValidObjectId(
          societyId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid society ID'
        });
      }

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
          society_id:
            societyId,

          role:
            'manager'
        });

      if (!manager) {
        return res.status(404).json({
          success: false,
          message:
            'No manager is currently assigned to this society'
        });
      }

      manager.role =
        'resident';

      manager.is_active =
        false;

      await manager.save();

      return res.status(200).json({

        success: true,

        message:
          `${manager.name} has been removed as manager`,

        data: {

          removed_manager:
            manager.toJSON(),

          society: {

            _id:
              society._id,

            name:
              society.name,

            society_code:
              society.society_code
          }
        }
      });

    } catch (error) {
      next(error);
    }
  };