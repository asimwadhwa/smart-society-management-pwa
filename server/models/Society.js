const mongoose = require('mongoose');

const SocietySchema = new mongoose.Schema({

  // ============================================================
  // SOCIETY BASIC DETAILS
  // ============================================================

  name: {

    type: String,

    required: [
      true,
      'Society name is required'
    ],

    trim: true,

    minlength: [
      2,
      'Society name must be at least 2 characters'
    ],

    maxlength: [
      100,
      'Society name cannot exceed 100 characters'
    ]

  },


  society_code: {

    type: String,

    required: [
      true,
      'Society code is required'
    ],

    unique: true,

    uppercase: true,

    trim: true,

    minlength: [
      3,
      'Society code must be at least 3 characters'
    ],

    maxlength: [
      20,
      'Society code cannot exceed 20 characters'
    ]

  },


  address: {

    type: String,

    required: [
      true,
      'Society address is required'
    ],

    trim: true,

    maxlength: [
      300,
      'Address cannot exceed 300 characters'
    ]

  },


  city: {

    type: String,

    required: [
      true,
      'City is required'
    ],

    trim: true,

    maxlength: [
      50,
      'City cannot exceed 50 characters'
    ]

  },


  state: {

    type: String,

    required: [
      true,
      'State is required'
    ],

    trim: true,

    maxlength: [
      50,
      'State cannot exceed 50 characters'
    ]

  },


  contact_number: {

    type: String,

    required: [
      true,
      'Contact number is required'
    ],

    match: [
      /^[6-9]\d{9}$/,

      'Please enter a valid 10-digit contact number'
    ]

  },


  // ============================================================
  // SOCIETY STATUS
  // ============================================================

  is_active: {

    type: Boolean,

    default: true

  },


  // ============================================================
  // MAINTENANCE SETTINGS
  // ============================================================
  //
  // DEFAULT:
  //
  // Maintenance Amount = ₹1000
  // Due Day             = 18
  // Late Fee            = ₹100
  //
  // Manager/Admin can edit
  // these settings from
  // Maintenance Settings.
  // ============================================================

  maintenance_amount: {

    type: Number,

    default: 1000,

    min: [
      1,

      'Maintenance amount must be greater than 0'
    ]

  },


  maintenance_due_day: {

    type: Number,

    default: 18,

    min: [
      1,

      'Maintenance due day must be between 1 and 28'
    ],

    max: [
      28,

      'Maintenance due day must be between 1 and 28'
    ]

  },


  maintenance_late_fee: {

    type: Number,

    default: 100,

    min: [
      0,

      'Maintenance late fee cannot be negative'
    ]

  }

}, {

  timestamps: {

    createdAt:
      'created_at',

    updatedAt:
      'updated_at'

  }

});


// ============================================================
// INDEXES
// ============================================================

SocietySchema.index({
  society_code: 1
});


SocietySchema.index({
  name: 1
});


// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.model(
    'Society',
    SocietySchema
  );