const GateLog = require('../models/GateLog');

/**
 * @desc    Create gate log entry
 * @route   POST /api/gatelog
 * @access  Private (Watchman only)
 */
exports.createEntry = async (req, res, next) => {
  try {
    const { visitor_name, flat_no_visiting, purpose, vehicle_number } = req.body;

    // Validate required fields
    if (!visitor_name || !flat_no_visiting || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Please provide visitor_name, flat_no_visiting, and purpose'
      });
    }

    // Create gate log entry
    const entry = await GateLog.create({
      visitor_name: visitor_name.trim(),
      flat_no_visiting,
      purpose: purpose.trim(),
      vehicle_number: vehicle_number ? vehicle_number.trim() : null,
      logged_by: req.user._id,
      in_time: new Date()
    });

    // Populate logged_by for response
    await entry.populate('logged_by', 'name');

    res.status(201).json({
      success: true,
      message: 'Visitor entry logged successfully',
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get today's entries
 * @route   GET /api/gatelog/today
 * @access  Private (Watchman, Manager, Admin)
 */
exports.getTodayEntries = async (req, res, next) => {
  try {
    // Get start and end of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await GateLog.find({
      in_time: {
        $gte: today,
        $lt: tomorrow
      }
    })
      .populate('logged_by', 'name')
      .sort({ in_time: -1 });

    // Calculate stats
    const stats = {
      total: entries.length,
      inside: entries.filter(e => !e.out_time).length,
      exited: entries.filter(e => e.out_time).length
    };

    res.status(200).json({
      success: true,
      data: entries,
      stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark visitor out time
 * @route   PUT /api/gatelog/:id/out
 * @access  Private (Watchman only)
 */
exports.markOutTime = async (req, res, next) => {
  try {
    const entry = await GateLog.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Gate log entry not found'
      });
    }

    // Check if already marked out
    if (entry.out_time) {
      return res.status(400).json({
        success: false,
        message: 'Visitor has already been marked out'
      });
    }

    // Update out time
    entry.out_time = new Date();
    await entry.save();

    await entry.populate('logged_by', 'name');

    res.status(200).json({
      success: true,
      message: 'Visitor marked as exited',
      data: entry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get gate log history
 * @route   GET /api/gatelog/history
 * @access  Private (Manager, Admin)
 */
exports.getHistory = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      date,
      flat_no 
    } = req.query;

    const query = {};

    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      query.in_time = { $gte: startDate, $lt: endDate };
    }

    // Filter by flat number if provided
    if (flat_no) {
      query.flat_no_visiting = flat_no;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const entries = await GateLog.find(query)
      .populate('logged_by', 'name')
      .sort({ in_time: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GateLog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: entries,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
