const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { sendComplaintStatusUpdate } = require('../services/email.service');
const { getAuthenticationParameters } = require('../services/upload.service');

/**
 * @desc    Create a new complaint
 * @route   POST /api/complaints
 * @access  Private (All authenticated users)
 */
exports.createComplaint = async (req, res, next) => {
  try {
    const { description, image_url } = req.body;
    const user = req.user;

    // Validate description
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Complaint description is required'
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 1000 characters'
      });
    }

    // Create complaint
    const complaint = await Complaint.create({
      user_id: user._id,
      flat_no: user.flat_no,
      description: description.trim(),
      image_url: image_url || null,
      status: 'open'
    });

    // Populate user info for response
    await complaint.populate('user_id', 'name email flat_no phone');

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    next(error);
  }
};

/**
 * @desc    Get current user's complaints
 * @route   GET /api/complaints
 * @access  Private (All authenticated users)
 */
exports.getUserComplaints = async (req, res, next) => {
  try {
    const user = req.user;
    const { page = 1, limit = 10, status } = req.query;

    // Build query
    const query = { user_id: user._id };
    if (status && ['open', 'in-progress', 'resolved'].includes(status)) {
      query.status = status;
    }

    // Count total
    const total = await Complaint.countDocuments(query);

    // Get complaints with pagination
    const complaints = await Complaint.find(query)
      .populate('user_id', 'name email flat_no')
      .populate('resolved_by', 'name email')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: complaints,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user complaints:', error);
    next(error);
  }
};

/**
 * @desc    Get all complaints (Admin/Manager only)
 * @route   GET /api/complaints/all
 * @access  Private (Manager, Admin)
 */
exports.getAllComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, flat_no, sortBy = 'created_at', order = 'desc' } = req.query;

    // Build query
    const query = {};
    if (status && ['open', 'in-progress', 'resolved'].includes(status)) {
      query.status = status;
    }
    if (flat_no) {
      query.flat_no = flat_no;
    }

    // Count total
    const total = await Complaint.countDocuments(query);

    // Build sort
    const sortOrder = order === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Get complaints with pagination
    const complaints = await Complaint.find(query)
      .populate('user_id', 'name email flat_no phone')
      .populate('resolved_by', 'name email')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get stats
    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {
      open: 0,
      'in-progress': 0,
      resolved: 0
    };
    stats.forEach(s => {
      statsMap[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      data: complaints,
      stats: statsMap,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    next(error);
  }
};

/**
 * @desc    Get complaint by ID
 * @route   GET /api/complaints/:id
 * @access  Private (Owner or Manager/Admin)
 */
exports.getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const complaint = await Complaint.findById(id)
      .populate('user_id', 'name email flat_no phone')
      .populate('resolved_by', 'name email');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if user is owner or admin/manager
    const isOwner = complaint.user_id._id.toString() === user._id.toString();
    const isAdmin = ['manager', 'admin'].includes(user.role);

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this complaint'
      });
    }

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    next(error);
  }
};

/**
 * @desc    Update complaint status (Admin/Manager only)
 * @route   PUT /api/complaints/:id/status
 * @access  Private (Manager, Admin)
 */
exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const user = req.user;

    // Validate status
    const validStatuses = ['open', 'in-progress', 'resolved'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: open, in-progress, or resolved'
      });
    }

    // Find complaint
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    const previousStatus = complaint.status;

    // Update complaint
    complaint.status = status;
    if (admin_notes) {
      complaint.admin_notes = admin_notes;
    }
    if (status === 'resolved') {
      complaint.resolved_by = user._id;
    }

    await complaint.save();

    // Populate for response
    await complaint.populate('user_id', 'name email flat_no phone');
    await complaint.populate('resolved_by', 'name email');

    // Send email notification to complaint owner if status changed
    if (previousStatus !== status) {
      try {
        await sendComplaintStatusUpdate({
          email: complaint.user_id.email,
          name: complaint.user_id.name,
          flat_no: complaint.flat_no,
          description: complaint.description,
          previous_status: previousStatus,
          new_status: status,
          admin_notes: admin_notes || null,
          updated_by: user.name,
          updated_at: new Date()
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError.message);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status}`,
      data: complaint
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    next(error);
  }
};

/**
 * @desc    Get ImageKit upload URL/authentication
 * @route   POST /api/complaints/upload-url
 * @access  Private (All authenticated users)
 */
exports.getUploadUrl = async (req, res, next) => {
  try {
    const result = getAuthenticationParameters();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate upload credentials'
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    next(error);
  }
};
