const Complaint = require('../models/Complaint');
const {
  sendComplaintStatusUpdate
} = require('../services/email.service');

const {
  getAuthenticationParameters
} = require('../services/upload.service');


/**
 * Get current user's society ID
 */
const getSocietyId = (req) => {
  return req.user?.society_id || null;
};


/**
 * @desc    Create a new complaint
 * @route   POST /api/complaints
 * @access  Private
 */
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

    const user = req.user;

    const societyId =
      getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }

    // Validate description
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

    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        message:
          'Description cannot exceed 1000 characters'
      });
    }

    // Create society-specific complaint
    const complaint =
      await Complaint.create({
        society_id: societyId,

        user_id: user._id,

        flat_no:
          user.flat_no,

        description:
          description.trim(),

        image_url:
          image_url || null,

        status: 'open'
      });

    await complaint.populate(
      'user_id',
      'name email flat_no phone'
    );

    return res.status(201).json({
      success: true,
      message:
        'Complaint submitted successfully',
      data: complaint
    });

  } catch (error) {
    console.error(
      'Error creating complaint:',
      error
    );

    next(error);
  }
};


/**
 * @desc    Get current user's complaints
 * @route   GET /api/complaints
 * @access  Private
 */
exports.getUserComplaints = async (
  req,
  res,
  next
) => {
  try {
    const user = req.user;

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

    // User can only see complaints
    // from their own society and their own account.
    const query = {
      society_id: societyId,
      user_id: user._id
    };

    if (
      status &&
      [
        'open',
        'in-progress',
        'resolved'
      ].includes(status)
    ) {
      query.status = status;
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
        .sort({
          created_at: -1
        })
        .skip(
          (pageNumber - 1) *
            limitNumber
        )
        .limit(limitNumber);

    return res.status(200).json({
      success: true,
      data: complaints,

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
    console.error(
      'Error fetching user complaints:',
      error
    );

    next(error);
  }
};


/**
 * @desc    Get all complaints
 * @route   GET /api/complaints/all
 * @access  Private (Manager, Admin)
 */
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
      sortBy = 'created_at',
      order = 'desc'
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

    // IMPORTANT:
    // Admin/Manager can only see complaints
    // from their own society.
    const query = {
      society_id: societyId
    };

    if (
      status &&
      [
        'open',
        'in-progress',
        'resolved'
      ].includes(status)
    ) {
      query.status = status;
    }

    if (flat_no) {
      query.flat_no = flat_no;
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
          'name email flat_no phone'
        )
        .populate(
          'resolved_by',
          'name email'
        )
        .sort(sort)
        .skip(
          (pageNumber - 1) *
            limitNumber
        )
        .limit(limitNumber);

    // Society-specific stats
    const stats =
      await Complaint.aggregate([
        {
          $match: {
            society_id:
              societyId
          }
        },

        {
          $group: {
            _id: '$status',

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
      (s) => {
        statsMap[s._id] =
          s.count;
      }
    );

    return res.status(200).json({
      success: true,

      data: complaints,

      stats: statsMap,

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
    console.error(
      'Error fetching all complaints:',
      error
    );

    next(error);
  }
};


/**
 * @desc    Get complaint by ID
 * @route   GET /api/complaints/:id
 * @access  Private
 */
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

    const societyId =
      getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }

    // Find complaint only inside
    // current user's society.
    const complaint =
      await Complaint.findOne({
        _id: id,
        society_id: societyId
      })
        .populate(
          'user_id',
          'name email flat_no phone'
        )
        .populate(
          'resolved_by',
          'name email'
        );

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message:
          'Complaint not found in your society'
      });
    }

    const isOwner =
      complaint.user_id._id.toString() ===
      user._id.toString();

    const isAdmin =
      [
        'manager',
        'admin'
      ].includes(
        user.role
      );

    if (
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
      data: complaint
    });

  } catch (error) {
    console.error(
      'Error fetching complaint:',
      error
    );

    next(error);
  }
};


/**
 * @desc    Update complaint status
 * @route   PUT /api/complaints/:id/status
 * @access  Private (Manager, Admin)
 */
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

    const societyId =
      getSocietyId(req);

    if (!societyId) {
      return res.status(400).json({
        success: false,
        message:
          'User is not assigned to any society'
      });
    }

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

    // IMPORTANT:
    // Complaint must belong to current society.
    const complaint =
      await Complaint.findOne({
        _id: id,
        society_id: societyId
      });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message:
          'Complaint not found in your society'
      });
    }

    const previousStatus =
      complaint.status;

    complaint.status =
      status;

    if (
      admin_notes !== undefined
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

    // Send email when status changes
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
            admin_notes || null,

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

      data: complaint
    });

  } catch (error) {
    console.error(
      'Error updating complaint status:',
      error
    );

    next(error);
  }
};


/**
 * @desc    Get ImageKit upload URL/authentication
 * @route   POST /api/complaints/upload-url
 * @access  Private
 */
exports.getUploadUrl = async (
  req,
  res,
  next
) => {
  try {
    // User must belong to a society
    if (!getSocietyId(req)) {
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
      data: result.data
    });

  } catch (error) {
    console.error(
      'Error generating upload URL:',
      error
    );

    next(error);
  }
};