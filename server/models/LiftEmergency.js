const mongoose = require('mongoose');

const LiftEmergencySchema = new mongoose.Schema({
  triggered_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flat_no: {
    type: String,
    required: false,
    default: null
  },
  triggered_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active'
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolved_at: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
LiftEmergencySchema.index({ status: 1 });
LiftEmergencySchema.index({ triggered_at: -1 });

module.exports = mongoose.model('LiftEmergency', LiftEmergencySchema);
