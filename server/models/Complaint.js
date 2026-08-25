const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flat_no: {
    type: String,
    required: [true, 'Flat number is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  image_url: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved'],
    default: 'open'
  },
  admin_notes: {
    type: String,
    default: null
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
ComplaintSchema.index({ user_id: 1 });
ComplaintSchema.index({ status: 1 });
ComplaintSchema.index({ created_at: -1 });

module.exports = mongoose.model('Complaint', ComplaintSchema);
