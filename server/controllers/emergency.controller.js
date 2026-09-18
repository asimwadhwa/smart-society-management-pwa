const LiftEmergency = require('../models/LiftEmergency');
const User = require('../models/User');
const {
  sendEmergencyAlert,
  sendEmergencyResolved
} = require('../services/email.service');

/**
 * @desc    Trigger a lift emergency alert
 * @route   POST /api/emergency/trigger
 * @access  Private (All authenticated users)
 */
exports.triggerEmergency = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const user = req.user;

    if (!user.society_id) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any society'
      });
    }

    // Check active emergency only in the current society
    const activeEmergency = await LiftEmergency.findOne({
      society_id: user.society_id,
      status: 'active'
    });

    if (activeEmergency) {
      return res.status(400).json({
        success: false,
        message:
          'There is already an active emergency in this society. Please wait for it to be resolved.'
      });
    }

    const triggeredFlat =
      user.flat_no ||
      (user.role === 'watchman'
        ? 'Security/Watchman'
        : 'Unknown');

    // Create emergency record
    const emergency = await LiftEmergency.create({
      society_id: user.society_id,
      triggered_by: user._id,
      flat_no: triggeredFlat,
      status: 'active',
      notes: notes || null
    });

    // Populate triggered_by for response
    await emergency.populate(
      'triggered_by',
      'name email flat_no phone'
    );

    // Get active users only from the same society
    const allUsers = await User.find({
      society_id: user.society_id,
      is_active: true
    }).select('name email flat_no phone');

    // Send emergency alert emails
    const emailPromises = allUsers.map((recipient) =>
      sendEmergencyAlert({
        email: recipient.email,
        name: recipient.name,
        triggered_by_name: user.name,
        triggered_by_flat: triggeredFlat,
        triggered_by_phone: user.phone,
        triggered_at: emergency.triggered_at,
        notes: emergency.notes
      }).catch((err) => {
        console.error(
          `Failed to send emergency alert to ${recipient.email}:`,
          err.message
        );
        return null;
      })
    );

    // Don't block API response
    Promise.all(emailPromises).then((results) => {
      const sent = results.filter((r) => r !== null).length;

      console.log(
        `Emergency alerts sent to ${sent}/${allUsers.length} users in society ${user.society_id}`
      );
    });

    return res.status(201).json({
      success: true,
      message:
        'Emergency alert triggered! All users in your society have been notified.',
      data: emergency
    });

  } catch (error) {
    console.error('Error triggering emergency:', error);
    next(error);
  }
};

/**
 * @desc    Get active emergency
 * @route   GET /api/emergency/active
 * @access  Private (All authenticated users)
 */
exports.getActiveEmergencies = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user.society_id) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any society'
      });
    }

    // Get active emergency only from current society
    const activeEmergency = await LiftEmergency.findOne({
      society_id: user.society_id,
      status: 'active'
    })
      .populate('triggered_by', 'name email flat_no phone')
      .sort({ triggered_at: -1 });

    return res.status(200).json({
      success: true,
      data: activeEmergency || null
    });

  } catch (error) {
    console.error('Error fetching active emergency:', error);
    next(error);
  }
};

/**
 * @desc    Resolve an emergency
 * @route   PUT /api/emergency/:id/resolve
 * @access  Private (Manager, Admin only)
 */
exports.resolveEmergency = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const user = req.user;

    if (!user.society_id) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any society'
      });
    }

    // Find emergency only inside current society
    const emergency = await LiftEmergency.findOne({
      _id: id,
      society_id: user.society_id
    }).populate(
      'triggered_by',
      'name email flat_no phone'
    );

    if (!emergency) {
      return res.status(404).json({
        success: false,
        message: 'Emergency not found'
      });
    }

    if (emergency.status === 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'This emergency has already been resolved'
      });
    }

    // Update emergency
    emergency.status = 'resolved';
    emergency.resolved_by = user._id;
    emergency.resolved_at = new Date();

    if (notes) {
      emergency.notes = emergency.notes
        ? `${emergency.notes}\n\nResolution: ${notes}`
        : `Resolution: ${notes}`;
    }

    await emergency.save();

    // Populate resolved_by
    await emergency.populate(
      'resolved_by',
      'name email flat_no'
    );

    // Get active users only from same society
    const allUsers = await User.find({
      society_id: user.society_id,
      is_active: true
    }).select('name email');

    // Send resolution emails
    const emailPromises = allUsers.map((recipient) =>
      sendEmergencyResolved({
        email: recipient.email,
        name: recipient.name,
        resolved_by_name: user.name,
        resolved_by_flat:
          user.flat_no ||
          (user.role === 'watchman'
            ? 'Security/Watchman'
            : 'Unknown'),
        resolved_at: emergency.resolved_at,
        triggered_by_name: emergency.triggered_by.name,
        triggered_by_flat: emergency.triggered_by.flat_no,
        triggered_at: emergency.triggered_at
      }).catch((err) => {
        console.error(
          `Failed to send resolution email to ${recipient.email}:`,
          err.message
        );
        return null;
      })
    );

    // Don't block API response
    Promise.all(emailPromises).then((results) => {
      const sent = results.filter((r) => r !== null).length;

      console.log(
        `Resolution emails sent to ${sent}/${allUsers.length} users in society ${user.society_id}`
      );
    });

    return res.status(200).json({
      success: true,
      message:
        'Emergency resolved! All users in your society have been notified.',
      data: emergency
    });

  } catch (error) {
    console.error('Error resolving emergency:', error);
    next(error);
  }
};

/**
 * @desc    Get emergency history
 * @route   GET /api/emergency/history
 * @access  Private (All authenticated users)
 *
 * Resident:
 *   - Can see only emergencies triggered by themselves
 *
 * Manager/Admin/Watchman:
 *   - Can see complete emergency history of their society
 */
exports.getEmergencyHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = req.user;

    if (!user.society_id) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any society'
      });
    }

    // Base query: current society only
    let query = {
      society_id: user.society_id
    };

    // Resident can see only their own emergencies
    if (user.role === 'resident') {
      query.triggered_by = user._id;
    }

    const total = await LiftEmergency.countDocuments(query);

    const emergencies = await LiftEmergency.find(query)
      .populate(
        'triggered_by',
        'name email flat_no phone'
      )
      .populate(
        'resolved_by',
        'name email flat_no'
      )
      .sort({ triggered_at: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: emergencies,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching emergency history:', error);
    next(error);
  }
};