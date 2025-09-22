const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Report = require('../models/reportModel');
const SubscriptionTier = require('../models/subscriptionTiers');
const { adminAuth } = require('../middleware/admin');

// All admin routes require admin authentication
router.use(adminAuth);

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filtering
// @access  Admin only
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '', tier = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { 'profile.organization': { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      if (status === 'active') {
        filter.isActive = true;
      } else if (status === 'inactive') {
        filter.isActive = false;
      }
    }

    if (tier) {
      const tierObj = await SubscriptionTier.findOne({ name: tier });
      if (tierObj) {
        filter['subscription.tier'] = tierObj._id;
      }
    }

    // Get users with subscription tier details
    const users = await User.find(filter)
      .populate('subscription.tier', 'name displayName monthlyPrice')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);

    // Calculate additional stats for each user
    const usersWithStats = users.map(user => {
      const availableTokens = user.getAvailableTokens();
      const tokensExpiringSoon = user.getTokensExpiringSoon(30);
      
      return {
        id: user._id,
        email: user.email,
        profile: user.profile,
        role: user.role,
        isActive: user.isActive,
        subscription: {
          tier: user.subscription.tier,
          status: user.subscription.status,
          stripeCustomerId: user.subscription.stripeCustomerId,
          currentPeriodEnd: user.subscription.currentPeriodEnd
        },
        availableTokens,
        tokensExpiringSoon,
        totalReports: user.reports.length,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    });

    res.json({
      success: true,
      users: usersWithStats,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalUsers / parseInt(limit)),
        count: totalUsers,
        perPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// @route   POST /api/admin/users/:userId/activate
// @desc    Activate a user account
// @access  Admin only
router.post('/users/:userId/activate', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = true;
    await user.save();

    res.json({ 
      success: true, 
      message: 'User activated successfully',
      user: { id: user._id, email: user.email, isActive: user.isActive }
    });

  } catch (error) {
    console.error('Admin activate user error:', error);
    res.status(500).json({ error: 'Failed to activate user' });
  }
});

// @route   POST /api/admin/users/:userId/deactivate
// @desc    Deactivate a user account
// @access  Admin only
router.post('/users/:userId/deactivate', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deactivating other admins
    if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Cannot deactivate other admin accounts' });
    }

    user.isActive = false;
    await user.save();

    res.json({ 
      success: true, 
      message: 'User deactivated successfully',
      user: { id: user._id, email: user.email, isActive: user.isActive }
    });

  } catch (error) {
    console.error('Admin deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
});

// @route   POST /api/admin/users/:userId/reset-tokens
// @desc    Reset user's token buckets
// @access  Admin only
router.post('/users/:userId/reset-tokens', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate('subscription.tier');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { amount, reason = 'Admin token reset' } = req.body;
    
    // If amount specified, set to that amount. Otherwise, reset to tier allocation
    const tokenAmount = amount || user.subscription.tier.tokenLimit;

    // Clear existing token buckets and add new allocation
    user.tokenUsage.tokenBuckets = [{
      balance: tokenAmount,
      addedAt: new Date(),
      expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months validity
      source: 'bonus'
    }];

    // Log the reset in usage history
    user.tokenUsage.usageHistory.push({
      tokens: -tokenAmount, // Negative indicates addition
      date: new Date(),
      operationId: `admin-reset-${Date.now()}`,
      description: reason
    });

    await user.save();

    res.json({ 
      success: true, 
      message: 'User tokens reset successfully',
      user: { 
        id: user._id, 
        email: user.email, 
        availableTokens: user.getAvailableTokens(),
        resetAmount: tokenAmount
      }
    });

  } catch (error) {
    console.error('Admin reset tokens error:', error);
    res.status(500).json({ error: 'Failed to reset user tokens' });
  }
});

// @route   POST /api/admin/users/:userId/make-admin
// @desc    Grant admin role to a user
// @access  Admin only
router.post('/users/:userId/make-admin', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = 'admin';
    await user.save();

    res.json({ 
      success: true, 
      message: 'User granted admin privileges successfully',
      user: { id: user._id, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error('Admin make-admin error:', error);
    res.status(500).json({ error: 'Failed to grant admin privileges' });
  }
});

// @route   GET /api/admin/reports
// @desc    Get all reports with pagination and filtering
// @access  Admin only
router.get('/reports', async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '', userId = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }

    if (userId) {
      filter.userId = userId;
    }

    // Get reports with user details
    const reports = await Report.find(filter)
      .populate('userId', 'email profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalReports = await Report.countDocuments(filter);

    res.json({
      success: true,
      reports,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalReports / parseInt(limit)),
        count: totalReports,
        perPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Admin get reports error:', error);
    res.status(500).json({ error: 'Failed to retrieve reports' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get system statistics for admin dashboard
// @access  Admin only
router.get('/stats', async (req, res) => {
  try {
    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });

    // Get subscription statistics
    const subscriptionStats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'subscriptiontiers',
          localField: 'subscription.tier',
          foreignField: '_id',
          as: 'tierInfo'
        }
      },
      { $unwind: '$tierInfo' },
      {
        $group: {
          _id: '$tierInfo.name',
          count: { $sum: 1 },
          revenue: { $sum: '$tierInfo.monthlyPrice' }
        }
      }
    ]);

    // Get report statistics
    const totalReports = await Report.countDocuments();
    const reportsThisMonth = await Report.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    const reportsLastMonth = await Report.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });

    // Calculate token usage statistics
    const tokenStats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $project: {
          availableTokens: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$tokenUsage.tokenBuckets',
                    cond: { $gt: ['$$this.expiresAt', now] }
                  }
                },
                as: 'bucket',
                in: '$$bucket.balance'
              }
            }
          },
          totalLifetimeUsed: '$tokenUsage.totalLifetimeUsed'
        }
      },
      {
        $group: {
          _id: null,
          totalAvailable: { $sum: '$availableTokens' },
          totalUsed: { $sum: '$totalLifetimeUsed' },
          avgAvailable: { $avg: '$availableTokens' }
        }
      }
    ]);

    // Calculate growth rates
    const userGrowthRate = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth * 100).toFixed(1)
      : '0';

    const reportGrowthRate = reportsLastMonth > 0
      ? ((reportsThisMonth - reportsLastMonth) / reportsLastMonth * 100).toFixed(1)
      : '0';

    // Calculate monthly revenue
    const monthlyRevenue = subscriptionStats.reduce((sum, tier) => sum + tier.revenue, 0);

    // Get active subscriptions count (non-free tiers)
    const activeSubscriptions = subscriptionStats
      .filter(tier => tier._id !== 'Free')
      .reduce((sum, tier) => sum + tier.count, 0);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        userGrowthRate: `${userGrowthRate}%`,
        
        totalReports,
        reportsThisMonth,
        reportGrowthRate: `${reportGrowthRate}%`,
        
        activeSubscriptions,
        monthlyRevenue: monthlyRevenue.toFixed(2),
        
        subscriptionBreakdown: subscriptionStats,
        
        tokenUsage: tokenStats[0] || {
          totalAvailable: 0,
          totalUsed: 0,
          avgAvailable: 0
        }
      }
    });

  } catch (error) {
    console.error('Admin get stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve system statistics' });
  }
});

// @route   POST /api/admin/system/reset-all-tokens
// @desc    Reset all users' tokens to their tier allocation
// @access  Admin only
router.post('/system/reset-all-tokens', async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).populate('subscription.tier');
    let resetCount = 0;

    for (const user of users) {
      if (user.subscription.tier) {
        user.tokenUsage.tokenBuckets = [{
          balance: user.subscription.tier.tokenLimit,
          addedAt: new Date(),
          expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
          source: 'monthly_allocation'
        }];

        user.tokenUsage.usageHistory.push({
          tokens: -user.subscription.tier.tokenLimit,
          date: new Date(),
          operationId: `admin-bulk-reset-${Date.now()}`,
          description: 'Bulk admin token reset'
        });

        await user.save();
        resetCount++;
      }
    }

    res.json({
      success: true,
      message: `Successfully reset tokens for ${resetCount} users`,
      resetCount
    });

  } catch (error) {
    console.error('Admin reset all tokens error:', error);
    res.status(500).json({ error: 'Failed to reset all user tokens' });
  }
});

// @route   POST /api/admin/system/bulk-token-grant
// @desc    Grant bonus tokens to all active users
// @access  Admin only
router.post('/system/bulk-token-grant', async (req, res) => {
  try {
    const { amount, reason = 'Admin bonus token grant' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid token amount is required' });
    }

    const users = await User.find({ isActive: true });
    let grantCount = 0;

    for (const user of users) {
      // Add bonus token bucket
      user.tokenUsage.tokenBuckets.push({
        balance: amount,
        addedAt: new Date(),
        expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 3)),
        source: 'bonus'
      });

      user.tokenUsage.usageHistory.push({
        tokens: -amount, // Negative indicates addition
        date: new Date(),
        operationId: `admin-bulk-grant-${Date.now()}`,
        description: reason
      });

      await user.save();
      grantCount++;
    }

    res.json({
      success: true,
      message: `Successfully granted ${amount.toLocaleString()} tokens to ${grantCount} users`,
      grantCount,
      amount
    });

  } catch (error) {
    console.error('Admin bulk token grant error:', error);
    res.status(500).json({ error: 'Failed to grant tokens to users' });
  }
});

module.exports = router;
