const express = require('express');
const router = express.Router();
const tokenManager = require('../services/tokenManager');
const pdfGenerator = require('../services/pdfGenerator');
const auth = require('../middleware/auth');

// Get current token usage statistics
router.get('/usage', auth, async (req, res) => {
  try {
    const stats = await tokenManager.getUsageStats(req.user.id);
    
    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error('Token usage retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve token usage' });
  }
});

// Get detailed usage history
router.get('/usage/history', auth, async (req, res) => {
  try {
    const { period = 'monthly', page = 1, limit = 20 } = req.query;
    
    // In a real implementation, this would fetch detailed usage logs from database
    // For now, return mock data structure
    res.json({
      success: true,
      history: [],
      summary: {
        totalRequests: 0,
        totalTokens: 0,
        averageTokensPerRequest: 0,
        period
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    });

  } catch (error) {
    console.error('Usage history retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve usage history' });
  }
});

// Check token availability for a specific amount
router.post('/check', auth, async (req, res) => {
  try {
    const { tokens } = req.body;
    
    if (!tokens || typeof tokens !== 'number' || tokens <= 0) {
      return res.status(400).json({ error: 'Valid token amount is required' });
    }

    const availability = await tokenManager.checkTokenAvailability(req.user.id, tokens);
    
    res.json({
      success: true,
      ...availability
    });

  } catch (error) {
    console.error('Token check error:', error);
    res.status(500).json({ error: 'Failed to check token availability' });
  }
});

// Generate usage report PDF
router.get('/usage/report', auth, async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    
    // Get user data with token usage
    const User = require('../models/userModel');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pdfBuffer = await pdfGenerator.generateTokenUsageReport(user, period);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=token-usage-${period}-${Date.now()}.pdf`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Usage report generation error:', error);
    res.status(500).json({ error: 'Failed to generate usage report' });
  }
});

// Get token pricing information
router.get('/pricing', auth, async (req, res) => {
  try {
    const stripeConfig = require('../config/stripe');
    
    res.json({
      success: true,
      tiers: {
        basic: {
          name: 'Basic',
          monthlyTokens: 10000,
          monthlyPrice: 19.99,
          yearlyPrice: 199.99
        },
        pro: {
          name: 'Pro',
          monthlyTokens: 50000,
          monthlyPrice: 49.99,
          yearlyPrice: 499.99
        },
        enterprise: {
          name: 'Enterprise',
          monthlyTokens: 200000,
          monthlyPrice: 149.99,
          yearlyPrice: 1499.99
        }
      },
      overage: {
        pricePerToken: stripeConfig.overageTokenPrice,
        currency: 'USD'
      }
    });

  } catch (error) {
    console.error('Pricing retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve pricing information' });
  }
});

// Reset monthly usage (admin only - for testing)
router.post('/reset', auth, async (req, res) => {
  try {
    // In production, this would require admin privileges
    const result = await tokenManager.resetMonthlyUsage(req.user.id);
    
    res.json({
      success: true,
      message: 'Token usage reset successfully',
      ...result
    });

  } catch (error) {
    console.error('Token reset error:', error);
    res.status(500).json({ error: 'Failed to reset token usage' });
  }
});

// Get current subscription tier limits
router.get('/limits', auth, async (req, res) => {
  try {
    const User = require('../models/userModel');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tierLimits = {
      basic: 10000,
      pro: 50000,
      enterprise: 200000
    };

    const currentLimit = tierLimits[user.subscription.tier];
    const used = user.tokenUsage.currentPeriodUsed;
    const remaining = Math.max(0, currentLimit - used);

    res.json({
      success: true,
      tier: user.subscription.tier,
      limit: currentLimit,
      used,
      remaining,
      usagePercentage: (used / currentLimit) * 100,
      nextResetDate: user.subscription.currentPeriodEnd || null
    });

  } catch (error) {
    console.error('Limits retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve token limits' });
  }
});

module.exports = router; 