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
    
    // Check if correct tiers exist
    const payAsYouGoTier = await SubscriptionTier.findOne({ name: 'PayAsYouGo' });
    if (payAsYouGoTier) {
      const allTiers = await SubscriptionTier.find({});
      return res.json({
        success: true,
        message: 'Correct subscription tiers already exist',
        count: allTiers.length,
        tiers: allTiers.map(tier => ({
          id: tier._id,
          name: tier.name,
          displayName: tier.displayName,
          billingType: tier.billingType
        }))
      });
    }
    
    // Clear existing tiers and create new ones
    console.log('🗑️ Clearing existing tiers and creating new ones...');
    await SubscriptionTier.deleteMany({});
    
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

// Force refresh subscription tiers (public endpoint for debugging)
router.post('/force-refresh-tiers', async (req, res) => {
  try {
    console.log('🔄 Force refreshing subscription tiers...');
    
    // Clear ALL existing tiers
    const deleteResult = await SubscriptionTier.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing tiers`);
    
    // Get default tiers
    const defaultTiers = SubscriptionTier.getDefaultTiers();
    
    // Create new tiers
    const createdTiers = await SubscriptionTier.insertMany(defaultTiers);
    console.log(`✅ Created ${createdTiers.length} new subscription tiers`);

    res.json({
      success: true,
      message: `Force refreshed ${createdTiers.length} subscription tiers`,
      deleted: deleteResult.deletedCount,
      created: createdTiers.length,
      tiers: createdTiers.map(tier => ({
        id: tier._id,
        name: tier.name,
        displayName: tier.displayName,
        billingType: tier.billingType,
        price: tier.billingType === 'per_report' ? tier.pricePerReport : tier.monthlyPrice
      }))
    });

  } catch (error) {
    console.error('❌ Error force refreshing subscription tiers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to force refresh subscription tiers',
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

// Estimated $ per 1M tokens (blended LLM cost - adjust to your actual provider mix)
const ESTIMATED_COST_PER_1M_TOKENS = Number(process.env.ADMIN_LLM_COST_PER_1M) || 6.5;

// Cost & usage dashboard (admin only)
router.get('/usage', auth, adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const tokenSum = { $sum: { $ifNull: ['$metadata.totalTokens', 0] } };
    const [thisMonth, last7Days, allTime] = await Promise.all([
      Report.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, totalTokens: tokenSum, reportCount: { $sum: 1 } } }
      ]).then((r) => r[0] || { totalTokens: 0, reportCount: 0 }),
      Report.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: null, totalTokens: tokenSum, reportCount: { $sum: 1 } } }
      ]).then((r) => r[0] || { totalTokens: 0, reportCount: 0 }),
      Report.aggregate([
        { $group: { _id: null, totalTokens: tokenSum, reportCount: { $sum: 1 } } }
      ]).then((r) => r[0] || { totalTokens: 0, reportCount: 0 })
    ]);

    const toEstimatedCost = (tokens) =>
      Math.round((tokens / 1e6) * ESTIMATED_COST_PER_1M_TOKENS * 100) / 100;

    const usage = {
      thisMonth: {
        totalTokens: thisMonth.totalTokens,
        reportCount: thisMonth.reportCount,
        estimatedCostUsd: toEstimatedCost(thisMonth.totalTokens)
      },
      last7Days: {
        totalTokens: last7Days.totalTokens,
        reportCount: last7Days.reportCount,
        estimatedCostUsd: toEstimatedCost(last7Days.totalTokens)
      },
      allTime: {
        totalTokens: allTime.totalTokens,
        reportCount: allTime.reportCount,
        estimatedCostUsd: toEstimatedCost(allTime.totalTokens)
      },
      costPer1MTokens: ESTIMATED_COST_PER_1M_TOKENS
    };

    res.json({ success: true, usage });
  } catch (error) {
    console.error('Error fetching admin usage:', error);
    res.status(500).json({ error: 'Failed to fetch cost and usage' });
  }
});

// Debug endpoint to check what's in the database
router.get('/debug-tiers', async (req, res) => {
  try {
    const tiers = await SubscriptionTier.find({});
    const payAsYouGoTier = await SubscriptionTier.findOne({ name: 'PayAsYouGo' });
    
    res.json({
      success: true,
      totalTiers: tiers.length,
      payAsYouGoExists: !!payAsYouGoTier,
      payAsYouGoId: payAsYouGoTier?._id,
      allTiers: tiers.map(tier => ({
        id: tier._id,
        name: tier.name,
        displayName: tier.displayName,
        billingType: tier.billingType
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;