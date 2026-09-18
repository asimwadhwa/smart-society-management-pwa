const mongoose = require('mongoose');

const LiftEmergencySchema = new mongoose.Schema({

  society_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true,
    index: true
  },

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
LiftEmergencySchema.index({ society_id: 1, status: 1 });
LiftEmergencySchema.index({ society_id: 1, triggered_at: -1 });
LiftEmergencySchema.index({ society_id: 1, triggered_by: 1 });

module.exports = mongoose.model('LiftEmergency', LiftEmergencySchema);