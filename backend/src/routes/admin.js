const express = require('express');
const mongoose = require('mongoose');
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

const {
  ESTIMATED_COST_PER_1M_TOKENS,
  PAYG_FLOOR_USD,
  STARTER_3_REPORT_MAX_COST_USD,
  estimatedCostUsdFromTokens
} = require('../config/costs');

// Token cap validation constants (Basic tier profitability guardrail)
const BASIC_CAP_TOKENS = 10000;
const MAX_COST_PER_BASIC_USER = 8;

function percentile(sortedArr, p) {
  if (!sortedArr.length) return 0;
  const i = (p / 100) * (sortedArr.length - 1);
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  if (lo === hi) return sortedArr[lo];
  return Math.round(sortedArr[lo] + (i - lo) * (sortedArr[hi] - sortedArr[lo]));
}

// Token cap validation (admin only) — actual consumption vs pricing assumptions
router.get('/token-validation', auth, adminAuth, async (req, res) => {
  try {
    const docs = await Report.find({ 'metadata.totalTokens': { $exists: true, $gte: 0 } })
      .select('metadata.totalTokens')
      .lean();
    const tokens = docs.map(d => d.metadata?.totalTokens).filter(t => typeof t === 'number' && t > 0);

    const costPer1M = ESTIMATED_COST_PER_1M_TOKENS;
    const sorted = [...tokens].sort((a, b) => a - b);
    const sum = tokens.reduce((a, b) => a + b, 0);
    const mean = tokens.length ? Math.round(sum / tokens.length) : 0;
    const tokensPerReport = {
      sampleSize: tokens.length,
      min: tokens.length ? Math.min(...tokens) : 0,
      max: tokens.length ? Math.max(...tokens) : 0,
      mean,
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95)
    };

    const reportsAt10kCap = mean > 0 ? Math.floor(BASIC_CAP_TOKENS / mean) : 0;
    const costPerBasicUserAtCap = (BASIC_CAP_TOKENS / 1e6) * costPer1M;
    const withinTarget = costPerBasicUserAtCap <= MAX_COST_PER_BASIC_USER;
    const suggestedCapIfOver = withinTarget
      ? null
      : Math.floor((MAX_COST_PER_BASIC_USER / costPer1M) * 1e6);

    res.json({
      success: true,
      tokenValidation: {
        tokensPerReport,
        basicCapTokens: BASIC_CAP_TOKENS,
        costPer1MTokens: costPer1M,
        costPerBasicUserAtCap: Math.round(costPerBasicUserAtCap * 100) / 100,
        maxCostPerBasicUser: MAX_COST_PER_BASIC_USER,
        reportsAt10kCap,
        withinTarget,
        suggestedCapIfOver,
        recommendation: tokens.length
          ? (withinTarget
            ? `At ${BASIC_CAP_TOKENS.toLocaleString()} tokens/month cap, API cost ($${costPerBasicUserAtCap.toFixed(2)}) is within $${MAX_COST_PER_BASIC_USER} target. Validate with script: node scripts/validateTokenCaps.js --live --runs 30 for real test runs.`
            : `Cost ($${costPerBasicUserAtCap.toFixed(2)}) exceeds $${MAX_COST_PER_BASIC_USER}. Consider lowering Basic cap to ~${(suggestedCapIfOver || 0).toLocaleString()} tokens/month.`)
          : 'No report token data yet. Run: node scripts/validateTokenCaps.js --live --runs 30 to validate with real generations.'
      }
    });
  } catch (error) {
    console.error('Error fetching token validation:', error);
    res.status(500).json({ error: 'Failed to fetch token validation' });
  }
});

// Cost & usage dashboard (admin only)
router.get('/usage', auth, adminAuth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const tokenSum = { $sum: { $ifNull: ['$metadata.totalTokens', 0] } };
    const [thisMonth, last7Days, allTime, perUserAgg] = await Promise.all([
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
      ]).then((r) => r[0] || { totalTokens: 0, reportCount: 0 }),
      Report.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: '$userId', totalTokens: tokenSum, reportCount: { $sum: 1 } } }
      ])
    ]);

    const toEstimatedCost = (tokens) => estimatedCostUsdFromTokens(tokens);

    // Per-user: resolve emails/tiers and compute revenue vs cost flags
    const userIds = [...new Set(perUserAgg.map((r) => r._id).filter(Boolean))];
    const userDocs = userIds.length
      ? await User.find({
          _id: {
            $in: userIds.map((id) =>
              mongoose.Types.ObjectId.isValid(id) && String(id).length === 24
                ? new mongoose.Types.ObjectId(id)
                : id
            )
          }
        })
          .populate('subscription.tier')
          .select('email subscription.tier')
          .lean()
      : [];
    const userByKey = Object.fromEntries(
      userDocs.map((u) => [String(u._id), u])
    );

    const APPROACH_THRESHOLD = 0.8; // flag when cost >= 80% of revenue
    const perUser = perUserAgg.map((row) => {
      const userId = row._id;
      const key = userId != null ? String(userId) : '';
      const user = userByKey[key];
      const reportCount = row.reportCount || 0;
      const totalTokens = row.totalTokens || 0;
      const estimatedCostUsd = toEstimatedCost(totalTokens);
      const tier = user?.subscription?.tier;
      let expectedRevenue = 0;
      if (tier) {
        if (tier.billingType === 'per_report') {
          expectedRevenue = reportCount * (tier.pricePerReport || 0);
        } else {
          const included = tier.reportsIncluded ?? 0;
          const overage = Math.max(0, reportCount - included);
          expectedRevenue = (tier.monthlyPrice || 0) + (tier.overageRate || 0) * overage;
        }
      }
      let status = 'ok';
      if (expectedRevenue > 0) {
        if (estimatedCostUsd > expectedRevenue) status = 'unprofitable';
        else if (estimatedCostUsd >= APPROACH_THRESHOLD * expectedRevenue) status = 'approaching';
      }

      return {
        userId: key,
        email: user?.email ?? '(unknown)',
        tierName: tier?.displayName ?? tier?.name ?? '—',
        reportCount,
        totalTokens,
        estimatedCostUsd,
        expectedRevenue: Math.round(expectedRevenue * 100) / 100,
        status
      };
    });

    // Sort: unprofitable first, then approaching, then by cost desc
    const statusOrder = { unprofitable: 0, approaching: 1, ok: 2 };
    perUser.sort(
      (a, b) =>
        statusOrder[a.status] - statusOrder[b.status] ||
        (b.estimatedCostUsd - a.estimatedCostUsd)
    );

    // Cost per report (actual from metadata or derived from totalTokens) for margin monitoring
    const costReportDocs = await Report.find({
      $or: [
        { 'metadata.estimatedCostUsd': { $exists: true, $gte: 0 } },
        { 'metadata.totalTokens': { $exists: true, $gte: 0 } }
      ]
    })
      .select('metadata.totalTokens metadata.estimatedCostUsd')
      .lean();
    const costPerReportUsd = costReportDocs.map((d) => {
      if (typeof d.metadata?.estimatedCostUsd === 'number' && d.metadata.estimatedCostUsd >= 0) {
        return d.metadata.estimatedCostUsd;
      }
      return estimatedCostUsdFromTokens(d.metadata?.totalTokens);
    }).filter((c) => typeof c === 'number' && c >= 0);
    const sortedCosts = [...costPerReportUsd].sort((a, b) => a - b);
    const meanCost = costPerReportUsd.length
      ? costPerReportUsd.reduce((a, b) => a + b, 0) / costPerReportUsd.length
      : 0;
    const round2 = (n) => Math.round((n || 0) * 100) / 100;
    const costPerReport = {
      sampleSize: costPerReportUsd.length,
      minUsd: costPerReportUsd.length ? round2(Math.min(...costPerReportUsd)) : 0,
      maxUsd: costPerReportUsd.length ? round2(Math.max(...costPerReportUsd)) : 0,
      meanUsd: round2(meanCost),
      p50Usd: sortedCosts.length ? round2(percentile(sortedCosts, 50)) : 0,
      p95Usd: sortedCosts.length ? round2(percentile(sortedCosts, 95)) : 0,
      paygFloorUsd: PAYG_FLOOR_USD,
      starter3ReportMaxUsd: STARTER_3_REPORT_MAX_COST_USD,
      withinPaygFloor: costPerReportUsd.length ? meanCost <= PAYG_FLOOR_USD : null,
      withinStarterTarget: costPerReportUsd.length ? meanCost * 3 <= STARTER_3_REPORT_MAX_COST_USD : null
    };

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
      costPer1MTokens: ESTIMATED_COST_PER_1M_TOKENS,
      costPerReport,
      perUser
    };

    res.json({ success: true, usage });
  } catch (error) {
    console.error('Error fetching admin usage:', error);
    res.status(500).json({ error: 'Failed to fetch cost and usage' });
  }
});


module.exports = router;