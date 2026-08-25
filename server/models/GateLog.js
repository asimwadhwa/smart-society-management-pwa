const mongoose = require('mongoose');

const GateLogSchema = new mongoose.Schema({
  visitor_name: {
    type: String,
    required: [true, 'Visitor name is required'],
    trim: true,
    maxlength: [100, 'Visitor name cannot exceed 100 characters']
  },
  flat_no_visiting: {
    type: String,
    required: [true, 'Flat number is required']
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    trim: true,
    maxlength: [200, 'Purpose cannot exceed 200 characters']
  },
  vehicle_number: {
    type: String,
    trim: true,
    maxlength: [20, 'Vehicle number cannot exceed 20 characters'],
    default: null
  },
  in_time: {
    type: Date,
    default: Date.now
  },
  out_time: {
    type: Date,
    default: null
  },
  logged_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for today's logs query
GateLogSchema.index({ in_time: -1 });
GateLogSchema.index({ logged_by: 1 });

module.exports = mongoose.model('GateLog', GateLogSchema);
