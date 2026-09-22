const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({

  // ============================================================
  // SOCIETY
  // ============================================================

  society_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: [
      true,
      'Society is required'
    ],
    index: true
  },


  // ============================================================
  // USER
  // ============================================================

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [
      true,
      'User is required'
    ],
    index: true
  },


  // ============================================================
  // FLAT
  // ============================================================

  flat_no: {
    type: String,
    required: [
      true,
      'Flat number is required'
    ],
    trim: true
  },


  // ============================================================
  // MONTH
  // ============================================================

  month: {
    type: Number,
    required: [
      true,
      'Month is required'
    ],
    min: [
      1,
      'Month must be between 1 and 12'
    ],
    max: [
      12,
      'Month must be between 1 and 12'
    ]
  },


  // ============================================================
  // YEAR
  // ============================================================

  year: {
    type: Number,
    required: [
      true,
      'Year is required'
    ],
    min: [
      2000,
      'Invalid year'
    ]
  },


  // ============================================================
  // MAINTENANCE AMOUNT
  // Default = ₹1000
  // ============================================================

  amount: {
    type: Number,
    required: true,
    default: 1000,
    min: [
      0.01,
      'Maintenance amount must be greater than 0'
    ]
  },


  // ============================================================
  // LATE FEE
  // Default = ₹100
  // ============================================================

  late_fee: {
    type: Number,
    default: 100,
    min: [
      0,
      'Late fee cannot be negative'
    ]
  },


  // ============================================================
  // TOTAL AMOUNT
  // ============================================================

  total_amount: {
    type: Number,
    required: true,
    default: function () {

      return (
        Number(this.amount || 0) +
        Number(this.late_fee || 0)
      );

    }
  },


  // ============================================================
  // DUE DATE
  // ============================================================

  due_date: {
    type: Date,
    required: [
      true,
      'Due date is required'
    ]
  },


  // ============================================================
  // PAID DATE
  // ============================================================

  paid_date: {
    type: Date,
    default: null
  },


  // ============================================================
  // STATUS
  // ============================================================

  status: {
    type: String,

    enum: [
      'pending',
      'paid',
      'overdue'
    ],

    default: 'pending',

    index: true
  },


  // ============================================================
  // RAZORPAY PAYMENT ID
  // ============================================================

  razorpay_payment_id: {
    type: String,
    default: null,
    trim: true
  },


  // ============================================================
  // RAZORPAY ORDER ID
  // ============================================================

  razorpay_order_id: {
    type: String,
    default: null,
    trim: true
  }

}, {

  timestamps: true

});


// ============================================================
// INDEXES
// ============================================================


// One maintenance record per flat per month per society
MaintenanceSchema.index(
  {
    society_id: 1,
    flat_no: 1,
    month: 1,
    year: 1
  },
  {
    unique: true
  }
);


// Status lookup
MaintenanceSchema.index({
  society_id: 1,
  status: 1
});


// Due date lookup
MaintenanceSchema.index({
  society_id: 1,
  due_date: 1
});


// User maintenance lookup
MaintenanceSchema.index({
  society_id: 1,
  user_id: 1
});


// Month/year lookup
MaintenanceSchema.index({
  society_id: 1,
  month: 1,
  year: 1
});


// ============================================================
// VIRTUAL
// ============================================================

MaintenanceSchema.virtual(
  'calculatedTotal'
).get(function () {

  return (
    Number(this.amount || 0) +
    Number(this.late_fee || 0)
  );

});


// ============================================================
// PRE SAVE
// ============================================================
//
// Mongoose current version ke liye callback `next()` use nahi
// karna hai.
//
// Every save:
// total_amount = amount + late_fee
//
// Example:
// ₹1000 + ₹0   = ₹1000
// ₹1000 + ₹100 = ₹1100
//
// ============================================================

MaintenanceSchema.pre(
  'save',
  function () {

    this.total_amount =
      Number(this.amount || 0) +
      Number(this.late_fee || 0);

  }
);


// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.model(
    'Maintenance',
    MaintenanceSchema
  );