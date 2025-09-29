const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const SubscriptionTier = require('../models/subscriptionTiers');
const Report = require('../models/reportModel');
const auth = require('../middleware/auth');

// Admin middleware - check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Seed subscription tiers (admin only)
router.post('/seed-tiers', auth, adminAuth, async (req, res) => {
  try {
    console.log('🌱 Admin seeding subscription tiers...');
    
    // Clear existing tiers
    await SubscriptionTier.deleteMany({});
    console.log('🗑️ Cleared existing subscription tiers');

    // Get default tiers
    const defaultTiers = SubscriptionTier.getDefaultTiers();
    
    // Create tiers
    const createdTiers = await SubscriptionTier.insertMany(defaultTiers);
    console.log(`✅ Created ${createdTiers.length} subscription tiers`);

    res.json({
      success: true,
      message: `Successfully seeded ${createdTiers.length} subscription tiers`,
      tiers: createdTiers.map(tier => ({
        id: tier._id,
        name: tier.name,
        displayName: tier.displayName,
        billingType: tier.billingType,
        price: tier.billingType === 'per_report' ? tier.pricePerReport : tier.monthlyPrice
      }))
    });

  } catch (error) {
    console.error('❌ Error seeding subscription tiers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to seed subscription tiers',
      details: error.message 
    });
  }
});

// Public endpoint to seed tiers (temporary - for fixing registration)
router.post('/public-seed-tiers', async (req, res) => {
  try {
    console.log('🌱 Public seeding subscription tiers (temporary fix)...');
    
    // Check if tiers already exist
    const existingTiers = await SubscriptionTier.find({});
    if (existingTiers.length > 0) {
      return res.json({
        success: true,
        message: 'Subscription tiers already exist',
        count: existingTiers.length,
        tiers: existingTiers.map(tier => ({
          id: tier._id,
          name: tier.name,
          displayName: tier.displayName
        }))
      });
    }
    
    // Get default tiers
    const defaultTiers = SubscriptionTier.getDefaultTiers();
    
    // Create tiers
    const createdTiers = await SubscriptionTier.insertMany(defaultTiers);
    console.log(`✅ Created ${createdTiers.length} subscription tiers`);

    res.json({
      success: true,
      message: `Successfully seeded ${createdTiers.length} subscription tiers`,
      tiers: createdTiers.map(tier => ({
        id: tier._id,
        name: tier.name,
        displayName: tier.displayName,
        billingType: tier.billingType,
        price: tier.billingType === 'per_report' ? tier.pricePerReport : tier.monthlyPrice
      }))
    });

  } catch (error) {
    console.error('❌ Error seeding subscription tiers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to seed subscription tiers',
      details: error.message 
    });
  }
});

// Get all users (admin only)
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    const query = search ? {
      $or: [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(query)
      .populate('subscription.tier')
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get admin statistics
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const [userCount, reportCount, tierStats] = await Promise.all([
      User.countDocuments(),
      Report.countDocuments(),
      SubscriptionTier.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'subscription.tier',
            as: 'users'
          }
        },
        {
          $project: {
            name: 1,
            displayName: 1,
            userCount: { $size: '$users' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: userCount,
        totalReports: reportCount,
        subscriptionTiers: tierStats
      }
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;