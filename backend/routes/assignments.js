const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Assignment = require('../models/Assignment');
const Asset = require('../models/Asset');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Get all assignments
router.get('/', auth, async (req, res) => {
  try {
    const { status, userId, assetId, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (assetId) filter.assetId = assetId;
    
    const assignments = await Assignment.find(filter)
      .populate('assetId', 'name assetTag category')
      .populate('userId', 'name email department')
      .populate('assignedBy', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Assignment.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: assignments,
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

// Get specific assignment
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('assetId')
      .populate('userId')
      .populate('assignedBy');
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new assignment
router.post('/', auth, authorize('admin', 'ops'), async (req, res) => {
  try {
    const { assetId, userId, notes, dueDate } = req.body;
    
    // Check if asset is available
    const asset = await Asset.findById(assetId);
    if (!asset || asset.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Asset is not available for assignment'
      });
    }
    
    const assignment = await Assignment.create({
      assetId,
      userId,
      assignedBy: req.user._id,
      startDate: new Date(),
      dueDate,
      notes
    });
    
    // Update asset status
    asset.status = 'assigned';
    await asset.save();
    
    // Log the action
    await AuditLog.create({
      entityType: 'assignment',
      entityId: assignment._id,
      action: 'create',
      performedBy: req.user._id,
      after: assignment.toObject(),
      reason: 'New assignment created'
    });
    
    await AuditLog.create({
      entityType: 'asset',
      entityId: assetId,
      action: 'assign',
      performedBy: req.user._id,
      after: asset.toObject(),
      reason: 'Asset assigned to user'
    });
    
    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('assetId')
      .populate('userId')
      .populate('assignedBy');
    
    res.status(201).json({
      success: true,
      data: populatedAssignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Return assignment
router.post('/:id/return', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    if (assignment.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Assignment already returned'
      });
    }
    
    // Update assignment
    assignment.returnedAt = new Date();
    assignment.status = 'returned';
    await assignment.save();
    
    // Update asset status
    const asset = await Asset.findById(assignment.assetId);
    asset.status = 'available';
    await asset.save();
    
    // Log the action
    await AuditLog.create({
      entityType: 'assignment',
      entityId: assignment._id,
      action: 'return',
      performedBy: req.user._id,
      after: assignment.toObject(),
      reason: req.body.reason || 'Assignment returned'
    });
    
    await AuditLog.create({
      entityType: 'asset',
      entityId: assignment.assetId,
      action: 'return',
      performedBy: req.user._id,
      after: asset.toObject(),
      reason: 'Asset returned from assignment'
    });
    
    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('assetId')
      .populate('userId')
      .populate('assignedBy');
    
    res.status(200).json({
      success: true,
      data: populatedAssignment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;