const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Get all users
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, department, page = 1, limit = 20 } = req.query;
    
    let filter = {};
    
    if (role) filter.role = role;
    if (department) filter.department = new RegExp(department, 'i');
    
    const users = await User.find(filter)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });
    
    const total = await User.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: users,
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

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    // Remove restricted fields
    const { password, role, ...allowedUpdates } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update user (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const oldUser = await User.findById(req.params.id);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Log the action
    await AuditLog.create({
      entityType: 'user',
      entityId: user._id,
      action: 'update',
      performedBy: req.user._id,
      before: oldUser.toObject(),
      after: user.toObject(),
      reason: req.body.reason || 'User updated by admin'
    });
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Log the action
    await AuditLog.create({
      entityType: 'user',
      entityId: req.params.id,
      action: 'delete',
      performedBy: req.user._id,
      before: user.toObject(),
      reason: 'User deleted by admin'
    });
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// Add this route to your existing users.js file
// Get specific user (Admin only)
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = router;