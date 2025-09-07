const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  entityType: {
    type: String,
    enum: ['asset', 'assignment', 'maintenance', 'user', 'vendor'], // Added 'vendor'
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'assign', 'return', 'maintenance'],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  before: {
    type: mongoose.Schema.Types.Mixed
  },
  after: {
    type: mongoose.Schema.Types.Mixed
  },
  reason: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);