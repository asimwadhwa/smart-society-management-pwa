const mongoose = require('mongoose');

const SocietySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Society name is required'],
    trim: true,
    minlength: [2, 'Society name must be at least 2 characters'],
    maxlength: [100, 'Society name cannot exceed 100 characters']
  },

  society_code: {
    type: String,
    required: [true, 'Society code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Society code must be at least 3 characters'],
    maxlength: [20, 'Society code cannot exceed 20 characters']
  },

  address: {
    type: String,
    required: [true, 'Society address is required'],
    trim: true,
    maxlength: [300, 'Address cannot exceed 300 characters']
  },

  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City cannot exceed 50 characters']
  },

  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State cannot exceed 50 characters']
  },

  contact_number: {
    type: String,
    required: [true, 'Contact number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit contact number']
  },

  is_active: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// Indexes
SocietySchema.index({ society_code: 1 });
SocietySchema.index({ name: 1 });

module.exports = mongoose.model('Society', SocietySchema);