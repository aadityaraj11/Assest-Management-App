const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Vendor = require('../models/Vendor');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Get all vendors
router.get('/', auth, async (req, res) => {
  try {
    const { specialization, page = 1, limit = 10 } = req.query;
    
    let filter = {};
    
    if (specialization) filter.specialization = specialization;
    
    const vendors = await Vendor.find(filter)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });
    
    const total = await Vendor.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: vendors,
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

// Get specific vendor
router.get('/:id', auth, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Create new vendor
router.post('/', auth, authorize('admin', 'ops'), async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    
    // Log the action
    await AuditLog.create({
      entityType: 'vendor',
      entityId: vendor._id,
      action: 'create',
      performedBy: req.user._id,
      after: vendor.toObject(),
      reason: 'New vendor created'
    });
    
    res.status(201).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update vendor
router.put('/:id', auth, authorize('admin', 'ops'), async (req, res) => {
  try {
    const oldVendor = await Vendor.findById(req.params.id);
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Log the action
    await AuditLog.create({
      entityType: 'vendor',
      entityId: vendor._id,
      action: 'update',
      performedBy: req.user._id,
      before: oldVendor.toObject(),
      after: vendor.toObject(),
      reason: req.body.reason || 'Vendor updated'
    });
    
    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete vendor
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Log the action
    await AuditLog.create({
      entityType: 'vendor',
      entityId: req.params.id,
      action: 'delete',
      performedBy: req.user._id,
      before: vendor.toObject(),
      reason: 'Vendor deleted'
    });
    
    res.status(200).json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;