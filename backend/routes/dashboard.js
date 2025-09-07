const express = require('express');
const { auth } = require('../middleware/auth');
const Asset = require('../models/Asset');
const Maintenance = require('../models/Maintenance');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const totalAssets = await Asset.countDocuments();
    const availableAssets = await Asset.countDocuments({ status: 'available' });
    const assignedAssets = await Asset.countDocuments({ status: 'assigned' });
    const maintenanceAssets = await Asset.countDocuments({ status: 'maintenance' });
    
    // Calculate overdue maintenances
    const overdueMaintenances = await Maintenance.countDocuments({
      scheduledAt: { $lt: new Date() },
      status: { $in: ['scheduled', 'in_progress'] }
    });
    
    // Calculate expiring warranties (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringWarranties = await Asset.countDocuments({
      warrantyUntil: { 
        $lte: thirtyDaysFromNow,
        $gte: new Date()
      }
    });
    
    // Get recent activities
    const recentActivities = await AuditLog.find()
      .populate('performedBy', 'name')
      .sort({ timestamp: -1 })
      .limit(5);
    
    // Get assets by category
    const assetsByCategory = await Asset.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } }
    ]);
    
    // Get maintenance by status
    const maintenanceByStatus = await Maintenance.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalAssets,
        availableAssets,
        assignedAssets,
        maintenanceAssets,
        overdueMaintenances,
        expiringWarranties,
        recentActivities,
        assetsByCategory,
        maintenanceByStatus
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