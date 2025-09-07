const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Asset = require('../models/Asset');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Get all assets with filtering
router.get('/', auth, async (req, res) => {
  try {
    const { status, category, location, search, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (location) filter.location = new RegExp(location, 'i');
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { assetTag: new RegExp(search, 'i') },
        { serial: new RegExp(search, 'i') }
      ];
    }
    
    const assets = await Asset.find(filter)
      .populate('vendorId', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Asset.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: assets,
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

// Get specific asset
router.get('/:id', auth, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('vendorId', 'name contact email phone')
      .populate('attachments.uploadedBy', 'name');
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new asset
router.post('/', auth, authorize('admin', 'ops'), async (req, res) => {
  try {
    const asset = await Asset.create(req.body);
    
    // Log the action
    await AuditLog.create({
      entityType: 'asset',
      entityId: asset._id,
      action: 'create',
      performedBy: req.user._id,
      after: asset.toObject(),
      reason: 'New asset created'
    });
    
    res.status(201).json({
      success: true,
      data: asset
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Asset tag or serial number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update asset
router.put('/:id', auth, authorize('admin', 'ops'), async (req, res) => {
  try {
    const oldAsset = await Asset.findById(req.params.id);
    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }
    
    // Log the action
    await AuditLog.create({
      entityType: 'asset',
      entityId: asset._id,
      action: 'update',
      performedBy: req.user._id,
      before: oldAsset.toObject(),
      after: asset.toObject(),
      reason: req.body.reason || 'Asset updated'
    });
    
    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete asset
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }
    
    // Log the action
    await AuditLog.create({
      entityType: 'asset',
      entityId: req.params.id,
      action: 'delete',
      performedBy: req.user._id,
      before: asset.toObject(),
      reason: 'Asset deleted'
    });
    
    res.status(200).json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;