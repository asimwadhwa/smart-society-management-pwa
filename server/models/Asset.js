const mongoose = require('mongoose');

const ServiceLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  done_by: {
    type: String,
    required: [true, 'Technician name is required'],
    trim: true
  }
}, { _id: true });

const AssetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true,
    maxlength: [100, 'Asset name cannot exceed 100 characters']
  },
  type: {
    type: String,
    enum: ['lift', 'water_pump', 'generator'],
    required: [true, 'Asset type is required']
  },
  status: {
    type: String,
    enum: ['working', 'under_maintenance', 'not_working'],
    default: 'working'
  },
  location: {
    type: String,
    default: null
  },
  last_service_date: {
    type: Date,
    default: null
  },
  services: [ServiceLogSchema]
}, {
  timestamps: true
});

// Indexes
AssetSchema.index({ type: 1 });
AssetSchema.index({ status: 1 });

// Update last_service_date when service is added
AssetSchema.pre('save', async function() {
  if (this.services && this.services.length > 0) {
    const lastService = this.services[this.services.length - 1];
    this.last_service_date = lastService.date;
  }
});

module.exports = mongoose.model('Asset', AssetSchema);
