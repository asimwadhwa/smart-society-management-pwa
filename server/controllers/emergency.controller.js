const LiftEmergency = require('../models/LiftEmergency');
const User = require('../models/User');
const { sendEmergencyAlert, sendEmergencyResolved } = require('../services/email.service');

/**
 * @desc    Trigger a lift emergency alert
 * @route   POST /api/emergency/trigger
 * @access  Private (All authenticated users)
 */
exports.triggerEmergency = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const user = req.user;

    // Check if there's already an active emergency
    const activeEmergency = await LiftEmergency.findOne({ status: 'active' });
    if (activeEmergency) {
      return res.status(400).json({
        success: false,
        message: 'There is already an active emergency. Please wait for it to be resolved.'
      });
    }

    // Create new emergency record
    // Watchmen don't have flat_no, so use their role as identifier
    const emergency = await LiftEmergency.create({
      triggered_by: user._id,
      flat_no: user.flat_no || (user.role === 'watchman' ? 'Security/Watchman' : 'Unknown'),
      status: 'active',
      notes: notes || null
    });

    // Populate triggered_by for response
    await emergency.populate('triggered_by', 'name email flat_no phone');

    // Get all active users to send emergency alert emails
    const allUsers = await User.find({ is_active: true }).select('name email flat_no phone');

    // Send emergency alert emails to all users
    const emailPromises = allUsers.map(recipient => 
      sendEmergencyAlert({
        email: recipient.email,
        name: recipient.name,
        triggered_by_name: user.name,
        triggered_by_flat: user.flat_no || (user.role === 'watchman' ? 'Security/Watchman' : 'Unknown'),
        triggered_by_phone: user.phone,
        triggered_at: emergency.triggered_at,
        notes: emergency.notes
      }).catch(err => {
        console.error(`Failed to send emergency alert to ${recipient.email}:`, err.message);
        return null;
      })
    );

    // Send emails in parallel (don't block response)
    Promise.all(emailPromises).then(results => {
      const sent = results.filter(r => r !== null).length;
      console.log(`Emergency alerts sent to ${sent}/${allUsers.length} users`);
    });

    res.status(201).json({
      success: true,
      message: 'Emergency alert triggered! All residents have been notified.',
      data: emergency
    });
  } catch (error) {
    console.error('Error triggering emergency:', error);
    next(error);
  }
};

/**
 * @desc    Get active emergencies
 * @route   GET /api/emergency/active
 * @access  Private (All authenticated users)
 */
exports.getActiveEmergencies = async (req, res, next) => {
  try {
    const activeEmergency = await LiftEmergency.findOne({ status: 'active' })
      .populate('triggered_by', 'name email flat_no phone')
      .sort({ triggered_at: -1 });

    res.status(200).json({
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

    // Find the emergency
    const emergency = await LiftEmergency.findById(id)
      .populate('triggered_by', 'name email flat_no phone');

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

    // Update emergency to resolved
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
    await emergency.populate('resolved_by', 'name email flat_no');

    // Get all active users to send resolution emails
    const allUsers = await User.find({ is_active: true }).select('name email');

    // Send resolution emails to all users
    const emailPromises = allUsers.map(recipient =>
      sendEmergencyResolved({
        email: recipient.email,
        name: recipient.name,
        resolved_by_name: user.name,
        resolved_by_flat: user.flat_no,
        resolved_at: emergency.resolved_at,
        triggered_by_name: emergency.triggered_by.name,
        triggered_by_flat: emergency.triggered_by.flat_no,
        triggered_at: emergency.triggered_at
      }).catch(err => {
        console.error(`Failed to send resolution email to ${recipient.email}:`, err.message);
        return null;
      })
    );

    // Send emails in parallel (don't block response)
    Promise.all(emailPromises).then(results => {
      const sent = results.filter(r => r !== null).length;
      console.log(`Resolution emails sent to ${sent}/${allUsers.length} users`);
    });

    res.status(200).json({
      success: true,
      message: 'Emergency resolved! All residents have been notified.',
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
 * @access  Private (Manager, Admin only)
 */
exports.getEmergencyHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await LiftEmergency.countDocuments();

    const emergencies = await LiftEmergency.find()
      .populate('triggered_by', 'name email flat_no phone')
      .populate('resolved_by', 'name email flat_no')
      .sort({ triggered_at: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
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
