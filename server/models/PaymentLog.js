const mongoose = require('mongoose');

const PaymentLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flat_no: {
    type: String,
    required: [true, 'Flat number is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required']
  },
  payment_date: {
    type: Date,
    default: Date.now
  },
  transaction_id: {
    type: String,
    required: [true, 'Transaction ID is required']
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
  razorpay_order_id: {
    type: String
  },
  razorpay_signature: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
PaymentLogSchema.index({ user_id: 1 });
PaymentLogSchema.index({ flat_no: 1 });
PaymentLogSchema.index({ payment_date: -1 });

module.exports = mongoose.model('PaymentLog', PaymentLogSchema);
