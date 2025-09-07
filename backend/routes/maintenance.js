const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Maintenance = require('../models/Maintenance');
const Asset = require('../models/Asset');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Get all maintenance records
router.get('/', auth, async (req, res) => {
  try {
    const { status, assetId, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (assetId) filter.assetId = assetId;
    
    const maintenanceRecords = await Maintenance.find(filter)
      .populate('assetId', 'name assetTag category')
      .populate('createdBy', 'name')
      .populate('vendorId', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ scheduledAt: 1 });
    
    const total = await Maintenance.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: maintenanceRecords,
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

// Get specific maintenance record
router.get('/:id', auth, async (req, res) => {
  try {
    const maintenance = await Maintenance.findById(req.params.id)
      .populate('assetId')
      .populate('createdBy')
      .populate('vendorId');
    
    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: maintenance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new maintenance record
router.post('/', auth, authorize('admin', 'ops'), async (req, res) => {
  try {
    const maintenance = await Maintenance.create({
      ...req.body,
      createdBy: req.user._id
    });
    
    // Update asset status if needed
    if (req.body.status === 'scheduled' || req.body.status === 'in_progress') {
      const asset = await Asset.findById(req.body.assetId);
      asset.status = 'maintenance';
      await asset.save();
      
      await AuditLog.create({
        entityType: 'asset',
        entityId: req.body.assetId,
        action: 'maintenance',
        performedBy: req.user._id,
        after: asset.toObject(),
        reason: 'Asset put under maintenance'
      });
    }
    
    // Log the action
    await AuditLog.create({
      entityType: 'maintenance',
      entityId: maintenance._id,
      action: 'create',
      performedBy: req.user._id,
      after: maintenance.toObject(),
      reason: 'New maintenance scheduled'
    });
    
    const populatedMaintenance = await Maintenance.findById(maintenance._id)
      .populate('assetId')
      .populate('createdBy')
      .populate('vendorId');
    
    res.status(201).json({
      success: true,
      data: populatedMaintenance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update maintenance record
router.put('/:id', auth, authorize('admin', 'ops'), async (req, res) => {
  try {
    const oldMaintenance = await Maintenance.findById(req.params.id);
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }
    
    // Update asset status if maintenance is completed
    if (req.body.status === 'done') {
      const asset = await Asset.findById(maintenance.assetId);
      asset.status = 'available';
      await asset.save();
      
      await AuditLog.create({
        entityType: 'asset',
        entityId: maintenance.assetId,
        action: 'maintenance',
        performedBy: req.user._id,
        after: asset.toObject(),
        reason: 'Maintenance completed, asset available'
      });
    }
    
    // Log the action
    await AuditLog.create({
      entityType: 'maintenance',
      entityId: maintenance._id,
      action: 'update',
      performedBy: req.user._id,
      before: oldMaintenance.toObject(),
      after: maintenance.toObject(),
      reason: req.body.reason || 'Maintenance updated'
    });
    
    const populatedMaintenance = await Maintenance.findById(maintenance._id)
      .populate('assetId')
      .populate('createdBy')
      .populate('vendorId');
    
    res.status(200).json({
      success: true,
      data: populatedMaintenance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;