const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  assetTag: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['extinguisher', 'detector', 'panel', 'sprinkler', 'fire_door', 'alarm', 'hose', 'emergency_light'],
    required: true
  },
  serial: {
    type: String,
    required: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  warrantyUntil: {
    type: Date,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'assigned', 'maintenance', 'retired'],
    default: 'available'
  },
  location: {
    type: String,
    required: true
  },
  metadata: {
    manufacturer: String,
    model: String,
    specifications: String,
    capacity: String,
    lastInspection: Date
  },
  attachments: [{
    key: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    filename: String,
    type: String
  }]
}, {
  timestamps: true
});

// Index for better query performance
assetSchema.index({ assetTag: 1 });
assetSchema.index({ category: 1 });
assetSchema.index({ status: 1 });
assetSchema.index({ location: 1 });

module.exports = mongoose.model('Asset', assetSchema);