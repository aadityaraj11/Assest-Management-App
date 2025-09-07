const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  performedAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'done', 'cancelled'],
    default: 'scheduled'
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor'
  },
  cost: {
    type: Number
  },
  notes: {
    type: String,
    required: true
  },
  attachments: [{
    key: String,
    url: String,
    filename: String,
    type: String
  }]
}, {
  timestamps: true
});

// Index for better query performance
maintenanceSchema.index({ assetId: 1 });
maintenanceSchema.index({ status: 1 });
maintenanceSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model('Maintenance', maintenanceSchema);