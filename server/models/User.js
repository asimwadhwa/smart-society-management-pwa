const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit phone number']
  },
  flat_no: {
    type: String,
    required: function() {
      return this.role !== 'watchman';
    },
    match: [/^[1-9]\d{2}$/, 'Please enter a valid flat number']
  },
  role: {
    type: String,
    enum: ['manager', 'admin', 'resident', 'watchman'],
    default: 'resident'
  },
  password_hash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_verified: {
    type: Boolean,
    default: true // Auto-verified for now
  },
  otp: {
    type: String,
    default: null
  },
  otp_expires: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
UserSchema.index({ flat_no: 1 });
UserSchema.index({ role: 1 });

// Hash password before saving
UserSchema.pre('save', async function() {
  // Only hash if password is modified
  if (!this.isModified('password_hash')) {
    return;
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password_hash);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.otp;
  delete obj.otp_expires;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
