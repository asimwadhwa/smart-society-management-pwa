const mongoose = require('mongoose');

const Complaint =
  require('../models/Complaint');

const {
  sendComplaintStatusUpdate
} = require('../services/email.service');

const {
  getAuthenticationParameters
} = require('../services/upload.service');


// ============================================================
// HELPERS
// ============================================================

const getSocietyId = (req) => {
  return req.user?.society_id || null;
};


const isSuperAdmin = (req) => {
  return req.user?.role === 'super_admin';
};


const isAdminOrManager = (req) => {
  return [
    'manager',
    'admin'
  ].includes(
    req.user?.role
  );
};


const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};


// ============================================================
// CREATE COMPLAINT
// ============================================================

exports.createComplaint = async (
  req,
  res,
  next
) => {

  try {

    const {
      description,
      image_url
    } = req.body;


    const user =
      req.user;


    const societyId =
      getSocietyId(req);


    if (!societyId) {

      return res.status(400).json({

        success: false,

        message:
          'User is not assigned to any society'

      });
    }


    if (
      !description ||
      description.trim().length === 0
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Complaint description is required'

      });
    }


    if (
      description.length > 1000
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Description cannot exceed 1000 characters'

      });
    }


    const complaint =
      await Complaint.create({

        society_id:
          societyId,

        user_id:
          user._id,

        flat_no:
          user.flat_no,

        description:
          description.trim(),

        image_url:
          image_url || null,

        status:
          'open'

      });


    await complaint.populate(
      'user_id',
      'name email flat_no phone'
    );


    return res.status(201).json({

      success: true,

      message:
        'Complaint submitted successfully',

      data:
        complaint

    });

  } catch (error) {

    console.error(
      'Error creating complaint:',
      error
    );

    next(error);
  }
};


// ============================================================
// CURRENT USER COMPLAINTS
// ============================================================

exports.getUserComplaints = async (
  req,
  res,
  next
) => {

  try {

    const user =
      req.user;


    const {
      page = 1,
      limit = 10,
      status
    } = req.query;


    const societyId =
      getSocietyId(req);


    if (!societyId) {

      return res.status(400).json({

        success: false,

        message:
          'User is not assigned to any society'

      });
    }


    const pageNumber =
      Math.max(
        parseInt(page) || 1,
        1
      );


    const limitNumber =
      Math.min(
        Math.max(
          parseInt(limit) || 10,
          1
        ),
        100
      );


    const query = {

      society_id:
        societyId,

      user_id:
        user._id

    };


    if (
      status &&
      [
        'open',
        'in-progress',
        'resolved'
      ].includes(status)
    ) {

      query.status =
        status;

    }


    const total =
      await Complaint.countDocuments(
        query
      );


    const complaints =
      await Complaint.find(query)
        .populate(
          'user_id',
          'name email flat_no'
        )
        .populate(
          'resolved_by',
          'name email'
        )
        .populate(
          'society_id',
          'name society_code'
        )
        .sort({
          created_at:
            -1
        })
        .skip(
          (pageNumber - 1) *
            limitNumber
        )
        .limit(
          limitNumber
        );


    return res.status(200).json({

      success: true,

      data:
        complaints,

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

    console.error(
      'Error fetching user complaints:',
      error
    );

    next(error);
  }
};


// ============================================================
// ALL COMPLAINTS
//
// SUPER ADMIN
// -> ALL SOCIETIES
//
// MANAGER / ADMIN
// -> OWN SOCIETY
// ============================================================

exports.getAllComplaints = async (
  req,
  res,
  next
) => {

  try {

    const {
      page = 1,
      limit = 10,
      status,
      flat_no,
      society_id,
      sortBy = 'created_at',
      order = 'desc'
    } = req.query;


    const pageNumber =
      Math.max(
        parseInt(page) || 1,
        1
      );


    const limitNumber =
      Math.min(
        Math.max(
          parseInt(limit) || 10,
          1
        ),
        100
      );


    const query = {};


    // ========================================================
    // SUPER ADMIN
    // ========================================================

    if (isSuperAdmin(req)) {

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

    }

    // ========================================================
    // MANAGER / ADMIN
    // ========================================================

    else {

      const currentSociety =
        getSocietyId(req);


      if (!currentSociety) {

        return res.status(400).json({

          success: false,

          message:
            'User is not assigned to any society'

        });
      }


      query.society_id =
        currentSociety;
    }


    // ========================================================
    // FILTERS
    // ========================================================

    if (
      status &&
      [
        'open',
        'in-progress',
        'resolved'
      ].includes(status)
    ) {

      query.status =
        status;

    }


    if (flat_no) {

      query.flat_no =
        flat_no;

    }


    const total =
      await Complaint.countDocuments(
        query
      );


    const sortOrder =
      order === 'asc'
        ? 1
        : -1;


    const allowedSortFields = [
      'created_at',
      'updated_at',
      'status',
      'flat_no'
    ];


    const safeSortBy =
      allowedSortFields.includes(
        sortBy
      )
        ? sortBy
        : 'created_at';


    const sort = {

      [safeSortBy]:
        sortOrder

    };


    const complaints =
      await Complaint.find(query)
        .populate(
          'user_id',
          'name email flat_no phone role'
        )
        .populate(
          'resolved_by',
          'name email'
        )
        .populate(
          'society_id',
          'name society_code city state'
        )
        .sort(sort)
        .skip(
          (pageNumber - 1) *
            limitNumber
        )
        .limit(
          limitNumber
        );


    // ========================================================
    // STATS
    // ========================================================

    const stats =
      await Complaint.aggregate([

        {
          $match:
            query
        },

        {
          $group: {

            _id:
              '$status',

            count: {
              $sum: 1
            }

          }

        }

      ]);


    const statsMap = {

      open: 0,

      'in-progress': 0,

      resolved: 0

    };


    stats.forEach(
      (item) => {

        if (
          Object.prototype.hasOwnProperty.call(
            statsMap,
            item._id
          )
        ) {

          statsMap[item._id] =
            item.count;

        }

      }
    );


    return res.status(200).json({

      success: true,

      data:
        complaints,

      stats:
        statsMap,

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

    console.error(
      'Error fetching all complaints:',
      error
    );

    next(error);
  }
};


// ============================================================
// GET COMPLAINT BY ID
// ============================================================

exports.getComplaintById = async (
  req,
  res,
  next
) => {

  try {

    const {
      id
    } = req.params;


    const user =
      req.user;


    if (
      !isValidObjectId(id)
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Invalid complaint ID'

      });
    }


    const query = {
      _id:
        id
    };


    if (
      !isSuperAdmin(req)
    ) {

      const societyId =
        getSocietyId(req);


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


    const complaint =
      await Complaint.findOne(
        query
      )
        .populate(
          'user_id',
          'name email flat_no phone'
        )
        .populate(
          'resolved_by',
          'name email'
        )
        .populate(
          'society_id',
          'name society_code city state'
        );


    if (!complaint) {

      return res.status(404).json({

        success: false,

        message:
          'Complaint not found'

      });
    }


    const isOwner =
      complaint.user_id &&
      complaint.user_id._id.toString() ===
        user._id.toString();


    const isAdmin =
      isAdminOrManager(req);


    if (
      !isSuperAdmin(req) &&
      !isOwner &&
      !isAdmin
    ) {

      return res.status(403).json({

        success: false,

        message:
          'Not authorized to view this complaint'

      });
    }


    return res.status(200).json({

      success: true,

      data:
        complaint

    });

  } catch (error) {

    console.error(
      'Error fetching complaint:',
      error
    );

    next(error);
  }
};


// ============================================================
// UPDATE COMPLAINT STATUS
//
// SUPER ADMIN
// -> ANY SOCIETY
//
// MANAGER / ADMIN
// -> OWN SOCIETY
// ============================================================

exports.updateComplaintStatus = async (
  req,
  res,
  next
) => {

  try {

    const {
      id
    } = req.params;


    const {
      status,
      admin_notes
    } = req.body;


    const user =
      req.user;


    const validStatuses = [

      'open',

      'in-progress',

      'resolved'

    ];


    if (
      !status ||
      !validStatuses.includes(
        status
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Invalid status. Must be: open, in-progress, or resolved'

      });
    }


    if (
      !isValidObjectId(id)
    ) {

      return res.status(400).json({

        success: false,

        message:
          'Invalid complaint ID'

      });
    }


    const query = {

      _id:
        id

    };


    if (
      !isSuperAdmin(req)
    ) {

      const societyId =
        getSocietyId(req);


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


    const complaint =
      await Complaint.findOne(
        query
      );


    if (!complaint) {

      return res.status(404).json({

        success: false,

        message:
          'Complaint not found'

      });
    }


    const previousStatus =
      complaint.status;


    complaint.status =
      status;


    if (
      admin_notes !==
      undefined
    ) {

      complaint.admin_notes =
        admin_notes;

    }


    if (
      status === 'resolved'
    ) {

      complaint.resolved_by =
        user._id;

    }


    await complaint.save();


    await complaint.populate(
      'user_id',
      'name email flat_no phone'
    );


    await complaint.populate(
      'resolved_by',
      'name email'
    );


    await complaint.populate(
      'society_id',
      'name society_code'
    );


    if (
      previousStatus !==
      status
    ) {

      try {

        await sendComplaintStatusUpdate({

          email:
            complaint.user_id.email,

          name:
            complaint.user_id.name,

          flat_no:
            complaint.flat_no,

          description:
            complaint.description,

          previous_status:
            previousStatus,

          new_status:
            status,

          admin_notes:
            admin_notes ||
            null,

          updated_by:
            user.name,

          updated_at:
            new Date()

        });

      } catch (emailError) {

        console.error(
          'Failed to send status update email:',
          emailError.message
        );

      }

    }


    return res.status(200).json({

      success: true,

      message:
        `Complaint status updated to ${status}`,

      data:
        complaint

    });

  } catch (error) {

    console.error(
      'Error updating complaint status:',
      error
    );

    next(error);
  }
};


// ============================================================
// IMAGEKIT UPLOAD URL
// ============================================================

exports.getUploadUrl = async (
  req,
  res,
  next
) => {

  try {

    if (
      !getSocietyId(req)
    ) {

      return res.status(400).json({

        success: false,

        message:
          'User is not assigned to any society'

      });
    }


    const result =
      getAuthenticationParameters();


    if (!result.success) {

      return res.status(500).json({

        success: false,

        message:
          'Failed to generate upload credentials'

      });
    }


    return res.status(200).json({

      success: true,

      data:
        result.data

    });

  } catch (error) {

    console.error(
      'Error generating upload URL:',
      error
    );

    next(error);
  }
};