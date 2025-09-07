const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Get all audit logs with filtering
router.get('/', auth, authorize('admin', 'auditor'), async (req, res) => {
  try {
    const { entityType, entityId, action, performedBy, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    
    if (entityType) filter.entityType = entityType;
    if (entityId) filter.entityId = entityId;
    if (action) filter.action = action;
    if (performedBy) filter.performedBy = performedBy;
    
    // Date range filter
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    const auditLogs = await AuditLog.find(filter)
      .populate('performedBy', 'name email role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ timestamp: -1 });
    
    const total = await AuditLog.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;