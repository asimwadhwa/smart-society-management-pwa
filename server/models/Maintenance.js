const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({

  // Society to which this maintenance belongs
  society_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Society',
    required: true,
    index: true
  },

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  flat_no: {
    type: String,
    required: [true, 'Flat number is required']
  },

  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12
  },

  year: {
    type: Number,
    required: [true, 'Year is required']
  },

  amount: {
    type: Number,
    required: true,
    default: 1000
  },

  late_fee: {
    type: Number,
    default: 0
  },

  total_amount: {
    type: Number,
    default: function () {
      return this.amount + this.late_fee;
    }
  },

  due_date: {
    type: Date,
    required: true
  },

  paid_date: {
    type: Date,
    default: null
  },

  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },

  razorpay_payment_id: {
    type: String,
    default: null
  },

  razorpay_order_id: {
    type: String,
    default: null
  }

}, {
  timestamps: true
});

// ============================================================
// Indexes
// ============================================================

// Same flat can have only one maintenance record
// for the same month and year WITHIN the same society.
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

MaintenanceSchema.index({
  society_id: 1,
  status: 1
});

MaintenanceSchema.index({
  society_id: 1,
  due_date: 1
});

MaintenanceSchema.index({
  society_id: 1,
  user_id: 1
});

// ============================================================
// Virtual
// ============================================================

MaintenanceSchema.virtual('calculatedTotal').get(function () {
  return this.amount + this.late_fee;
});

// ============================================================
// Update total amount before save
// ============================================================

MaintenanceSchema.pre('save', async function () {
  this.total_amount =
    this.amount + this.late_fee;
});

module.exports = mongoose.model(
  'Maintenance',
  MaintenanceSchema
);