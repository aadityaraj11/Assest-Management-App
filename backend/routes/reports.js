const express = require('express');
const { auth, authorize } = require('../middleware/auth');
const Asset = require('../models/Asset');
const Maintenance = require('../models/Maintenance');
const Assignment = require('../models/Assignment');

const router = express.Router();

// Generate maintenance due report
router.get('/maintenance-due', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(days));
    
    const dueMaintenance = await Maintenance.find({
      scheduledAt: { $lte: targetDate },
      status: { $in: ['scheduled', 'in_progress'] }
    })
    .populate('assetId', 'name assetTag category location')
    .populate('vendorId', 'name contact')
    .sort({ scheduledAt: 1 });
    
    res.status(200).json({
      success: true,
      data: dueMaintenance,
      reportInfo: {
        type: 'maintenance-due',
        period: `${days} days`,
        generatedAt: new Date(),
        count: dueMaintenance.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Generate warranty expiry report
router.get('/warranty-expiry', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(days));
    
    const expiringWarranties = await Asset.find({
      warrantyUntil: { $lte: targetDate, $gte: new Date() }
    })
    .populate('vendorId', 'name contact')
    .sort({ warrantyUntil: 1 });
    
    res.status(200).json({
      success: true,
      data: expiringWarranties,
      reportInfo: {
        type: 'warranty-expiry',
        period: `${days} days`,
        generatedAt: new Date(),
        count: expiringWarranties.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Generate inventory summary report
router.get('/inventory-summary', auth, async (req, res) => {
  try {
    const inventorySummary = await Asset.aggregate([
      {
        $group: {
          _id: { category: '$category', status: '$status' },
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      },
      {
        $group: {
          _id: '$_id.category',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count',
              totalCost: '$totalCost'
            }
          },
          totalCount: { $sum: '$count' },
          overallCost: { $sum: '$totalCost' }
        }
      },
      {
        $project: {
          category: '$_id',
          statuses: 1,
          totalCount: 1,
          overallCost: 1,
          _id: 0
        }
      },
      { $sort: { category: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: inventorySummary,
      reportInfo: {
        type: 'inventory-summary',
        generatedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Generate compliance report
router.get('/compliance', auth, authorize('admin', 'auditor'), async (req, res) => {
  try {
    // Get assets that need maintenance but don't have scheduled maintenance
    const assetsNeedingMaintenance = await Asset.find({
      status: { $in: ['available', 'assigned'] }
    });
    
    const complianceIssues = [];
    
    for (const asset of assetsNeedingMaintenance) {
      const lastMaintenance = await Maintenance.findOne({
        assetId: asset._id,
        status: 'done'
      }).sort({ performedAt: -1 });
      
      // Check if maintenance is overdue (more than 1 year since last maintenance)
      if (lastMaintenance) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        
        if (lastMaintenance.performedAt < oneYearAgo) {
          complianceIssues.push({
            asset: asset,
            issue: 'Maintenance overdue',
            lastMaintenance: lastMaintenance.performedAt
          });
        }
      } else {
        // No maintenance record found
        complianceIssues.push({
          asset: asset,
          issue: 'No maintenance history',
          lastMaintenance: null
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: complianceIssues,
      reportInfo: {
        type: 'compliance',
        generatedAt: new Date(),
        issuesCount: complianceIssues.length
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