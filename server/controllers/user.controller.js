const User = require('../models/User');
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
// ============================================================
//
// Super Admin:
//   All societies
//   BUT super_admin itself is NEVER included
//
// Manager/Admin:
//   Only own society
//
// GET /api/users
// ============================================================

exports.getAllUsers = async (
  req,
  res,
  next
) => {

  try {

    const {
      role,
      is_active,
      society_id,
      page = 1,
      limit = 50
    } = req.query;


    const query = {
      role: {
        $ne: 'super_admin'
      }
    };


    // ==========================================================
    // SOCIETY SCOPE
    // ==========================================================

    if (
      req.user.role === 'super_admin'
    ) {

      if (society_id) {

        if (
          !isValidObjectId(
            society_id
          )
        ) {

          return res.status(400).json({
            success: false,
            message:
              'Invalid society ID'
          });

        }

        query.society_id =
          society_id;

      }

    } else {

      if (
        !req.user.society_id
      ) {

        return res.status(400).json({
          success: false,
          message:
            'User is not assigned to any society'
        });

      }

      query.society_id =
        req.user.society_id;

    }


    // ==========================================================
    // ROLE FILTER
    // ==========================================================

    if (role) {

      const validRoles = [
        'manager',
        'admin',
        'resident',
        'watchman'
      ];


      if (
        !validRoles.includes(role)
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Invalid role'
        });

      }

      query.role = role;

    }


    // ==========================================================
    // ACTIVE FILTER
    // ==========================================================

    if (
      is_active !== undefined
    ) {

      if (
        is_active === 'true'
      ) {

        query.is_active = true;

      } else if (
        is_active === 'false'
      ) {

        query.is_active = false;

      }

    }


    // ==========================================================
    // PAGINATION
    // ==========================================================

    const pageNumber =
      Math.max(
        parseInt(page) || 1,
        1
      );


    const limitNumber =
      Math.min(
        Math.max(
          parseInt(limit) || 50,
          1
        ),
        100
      );


    const skip =
      (pageNumber - 1) *
      limitNumber;


    // ==========================================================
    // FETCH USERS
    // ==========================================================

    const users =
      await User.find(query)
        .select(
          '-password_hash -otp -otp_expires'
        )
        .populate(
          'society_id',
          'name society_code city state is_active'
        )
        .sort({
          created_at: -1
        })
        .skip(skip)
        .limit(limitNumber);


    // ==========================================================
    // COUNT
    // ==========================================================

    const total =
      await User.countDocuments(
        query
      );


    return res.status(200).json({

      success: true,

      data: users,

      pagination: {

        current:
          pageNumber,

        pages:
          Math.ceil(
            total /
            limitNumber
          ),

        total,

        limit:
          limitNumber

      }

    });

  } catch (error) {

    next(error);

  }

};


// ============================================================
// GET AVAILABLE FLATS
// ============================================================
//
// PUBLIC REGISTRATION:
//
// GET /api/users/flats/available?society_code=ABC123
//
// Manager/Admin:
//
// Uses logged-in user's society automatically.
//
// IMPORTANT:
// A flat is considered BOOKED if any user already has
// that flat in the selected society.
//
// This is society-wise.
// Society A booking does NOT affect Society B.
// ============================================================

exports.getAvailableFlats =
  async (
    req,
    res,
    next
  ) => {

    try {

      let societyId = null;


      // ========================================================
      // LOGGED-IN USER
      // ========================================================

      if (
        req.user &&
        req.user.society_id
      ) {

        societyId =
          req.user.society_id;

      } else {

        // ======================================================
        // PUBLIC REGISTRATION
        // ======================================================

        const Society =
          require('../models/Society');


        const society_code =
          typeof req.query.society_code === 'string'
            ? req.query.society_code
                .trim()
                .toUpperCase()
            : '';


        if (!society_code) {

          return res.status(400).json({
            success: false,
            message:
              'Please provide society code'
          });

        }


        const society =
          await Society.findOne({

            society_code,

            is_active: true

          }).select(
            '_id name society_code'
          );


        if (!society) {

          return res.status(404).json({
            success: false,
            message:
              'Invalid society code or society is inactive'
          });

        }


        societyId =
          society._id;

      }


      // ========================================================
      // GENERATE ALL FLATS
      // ========================================================

      const allFlats = [];


      for (
        let floor = 1;
        floor <= 4;
        floor++
      ) {

        for (
          let unit = 1;
          unit <= 10;
          unit++
        ) {

          allFlats.push(
            `${floor}0${unit}`.slice(-3)
          );

        }

      }


      // ========================================================
      // FIND BOOKED FLATS
      // ========================================================
      //
      // We intentionally do NOT check is_active here.
      //
      // If a flat was already registered once,
      // it remains booked even if that account becomes inactive.
      //
      // This prevents another person from registering
      // the same flat.
      // ========================================================

      const registeredUsers =
        await User.find({

          society_id:
            societyId,

          flat_no: {
            $exists: true,
            $ne: null,
            $ne: ''
          }

        }).select(
          'flat_no'
        );


      const registeredFlats =
        registeredUsers
          .map(
            user =>
              String(
                user.flat_no
              ).trim()
          );


      // ========================================================
      // AVAILABLE FLATS
      // ========================================================

      const availableFlats =
        allFlats.filter(
          flat =>
            !registeredFlats.includes(
              flat
            )
        );


      return res.status(200).json({

        success: true,

        data:
          availableFlats

      });

    } catch (error) {

      next(error);

    }

  };


// ============================================================
// GET USER BY ID
// ============================================================
//
// Manager/Admin:
//   Own society only
//
// Super Admin:
//   Any society
//
// IMPORTANT:
//   Super Admin itself is still protected.
// ============================================================

exports.getUserById =
  async (
    req,
    res,
    next
  ) => {

    try {

      const userId =
        req.params.id;


      if (
        !isValidObjectId(
          userId
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Invalid user ID'
        });

      }


      const query = {
        _id: userId
      };


      if (
        req.user.role !==
        'super_admin'
      ) {

        if (
          !req.user.society_id
        ) {

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
        await User.findOne(
          query
        )
          .select(
            '-password_hash -otp -otp_expires'
          )
          .populate(
            'society_id',
            'name society_code city state is_active'
          );


      if (!user) {

        return res.status(404).json({
          success: false,
          message:
            'User not found'
        });

      }


      return res.status(200).json({

        success: true,

        data:
          user

      });

    } catch (error) {

      next(error);

    }

  };


// ============================================================
// UPDATE USER ROLE
// ============================================================
//
// Manager/Admin:
//   Resident <-> Admin
//
// Super Admin:
//   Resident <-> Admin
//
// Protected:
//   Manager
//   Super Admin
//   Own account
// ============================================================

exports.updateUserRole =
  async (
    req,
    res,
    next
  ) => {

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
        !validRoles.includes(
          role
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Invalid role. Must be admin or resident'
        });

      }


      if (
        !isValidObjectId(
          userId
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Invalid user ID'
        });

      }


      // ========================================================
      // CANNOT CHANGE OWN ROLE
      // ========================================================

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


      // ========================================================
      // SOCIETY SECURITY
      // ========================================================

      if (
        req.user.role !==
        'super_admin'
      ) {

        if (
          !req.user.society_id
        ) {

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
        await User.findOne(
          query
        );


      if (!user) {

        return res.status(404).json({
          success: false,
          message:
            'User not found'
        });

      }


      // ========================================================
      // PROTECTED ROLES
      // ========================================================

      if (
        user.role ===
        'manager'
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Cannot change manager role'
        });

      }


      if (
        user.role ===
        'super_admin'
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Cannot change super admin role'
        });

      }


      // ========================================================
      // UPDATE
      // ========================================================

      user.role =
        role;


      await user.save();


      return res.status(200).json({

        success: true,

        message:
          `User role updated to ${role}`,

        data:
          user.toJSON()

      });

    } catch (error) {

      next(error);

    }

  };


// ============================================================
// CREATE WATCHMAN
// ============================================================

exports.createWatchman =
  async (
    req,
    res,
    next
  ) => {

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


      const normalizedEmail =
        email
          .toLowerCase()
          .trim();


      const existingUser =
        await User.findOne({
          email:
            normalizedEmail
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

          name:
            name.trim(),

          email:
            normalizedEmail,

          phone:
            phone.trim(),

          society_id:
            societyId,

          role:
            'watchman',

          password_hash:
            tempPassword,

          is_verified:
            true

        });


      return res.status(201).json({

        success: true,

        message:
          'Watchman account created successfully',

        data: {

          user:
            watchman.toJSON(),

          tempPassword

        }

      });

    } catch (error) {

      next(error);

    }

  };


// ============================================================
// DEACTIVATE USER
// ============================================================
//
// Manager/Admin:
//   Own society
//
// Super Admin:
//   Any society
//
// Protected:
//   Own account
//   Manager
//   Super Admin
// ============================================================

exports.deleteUser =
  async (
    req,
    res,
    next
  ) => {

    try {

      const userId =
        req.params.id;


      if (
        !isValidObjectId(
          userId
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Invalid user ID'
        });

      }


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


      // ========================================================
      // SOCIETY SECURITY
      // ========================================================

      if (
        req.user.role !==
        'super_admin'
      ) {

        if (
          !req.user.society_id
        ) {

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
        await User.findOne(
          query
        );


      if (!user) {

        return res.status(404).json({
          success: false,
          message:
            'User not found'
        });

      }


      if (
        user.role ===
        'manager'
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Cannot deactivate manager account'
        });

      }


      if (
        user.role ===
        'super_admin'
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Cannot deactivate super admin account'
        });

      }


      user.is_active =
        false;


      await user.save();


      return res.status(200).json({

        success: true,

        message:
          'User account deactivated',

        data:
          user.toJSON()

      });

    } catch (error) {

      next(error);

    }

  };


// ============================================================
// ACTIVATE USER
// ============================================================

exports.activateUser =
  async (
    req,
    res,
    next
  ) => {

    try {

      const userId =
        req.params.id;


      if (
        !isValidObjectId(
          userId
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Invalid user ID'
        });

      }


      const query = {
        _id: userId
      };


      if (
        req.user.role !==
        'super_admin'
      ) {

        if (
          !req.user.society_id
        ) {

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
        await User.findOne(
          query
        );


      if (!user) {

        return res.status(404).json({
          success: false,
          message:
            'User not found'
        });

      }


      if (
        user.role ===
        'super_admin'
      ) {

        return res.status(400).json({
          success: false,
          message:
            'Cannot modify super admin account'
        });

      }


      user.is_active =
        true;


      await user.save();


      return res.status(200).json({

        success: true,

        message:
          'User account activated',

        data:
          user.toJSON()

      });

    } catch (error) {

      next(error);

    }

  };


// ============================================================
// GET USERS BY SOCIETY
// ============================================================
//
// Super Admin only
//
// GET /api/users/society/:societyId
// ============================================================

exports.getUsersBySociety =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        societyId
      } = req.params;


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


      const users =
        await User.find({

          society_id:
            societyId,

          role: {
            $ne: 'super_admin'
          }

        })
          .select(
            '-password_hash -otp -otp_expires'
          )
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

        data:
          users

      });

    } catch (error) {

      next(error);

    }

  };


// ============================================================
// GET SOCIETY USER STATS
// ============================================================
//
// Super Admin only
//
// GET /api/users/society/:societyId/stats
// ============================================================

exports.getSocietyUserStats =
  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        societyId
      } = req.params;


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


      const objectId =
        new mongoose.Types.ObjectId(
          societyId
        );


      const stats =
        await User.aggregate([

          {
            $match: {

              society_id:
                objectId,

              role: {
                $ne:
                  'super_admin'
              }

            }
          },


          {
            $group: {

              _id:
                '$role',

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


      stats.forEach(
        item => {

          if (
            Object.prototype.hasOwnProperty
              .call(
                result,
                item._id
              )
          ) {

            result[item._id] =
              item.count;

          }


          result.total +=
            item.count;


          result.active +=
            item.active;

        }
      );


      result.inactive =
        result.total -
        result.active;


      return res.status(200).json({

        success: true,

        data:
          result

      });

    } catch (error) {

      next(error);

    }

  };