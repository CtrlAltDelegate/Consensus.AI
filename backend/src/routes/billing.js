const express = require('express');
const router = express.Router();
const billingService = require('../services/billingService');
const auth = require('../middleware/auth');
const { validateSubscriptionUpdate } = require('../utils/validation');

// Get current subscription status
router.get('/subscription', auth, async (req, res) => {
  try {
    const User = require('../models/userModel');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let subscriptionDetails = null;
    if (user.subscription.stripeSubscriptionId) {
      subscriptionDetails = await billingService.getSubscriptionStatus(
        user.subscription.stripeSubscriptionId
      );
    }

    res.json({
      success: true,
      subscription: {
        tier: user.subscription.tier,
        status: user.subscription.status,
        currentPeriodStart: user.subscription.currentPeriodStart,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        stripeSubscriptionId: user.subscription.stripeSubscriptionId,
        ...subscriptionDetails
      }
    });

  } catch (error) {
    console.error('Subscription status error:', error);
    res.status(500).json({ error: 'Failed to retrieve subscription status' });
  }
});

// Update subscription (upgrade/downgrade)
router.put('/subscription', auth, async (req, res) => {
  try {
    const { tier, billingPeriod = 'monthly' } = req.body;
    
    // Validate request
    const { error } = validateSubscriptionUpdate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const User = require('../models/userModel');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stripeConfig = require('../config/stripe');
    const tierConfig = stripeConfig.subscriptionTiers[tier];
    
    if (!tierConfig) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const priceId = billingPeriod === 'yearly' ? tierConfig.yearlyPriceId : tierConfig.monthlyPriceId;

    let subscription;
    if (user.subscription.stripeSubscriptionId) {
      // Update existing subscription
      subscription = await billingService.updateSubscription(
        user.subscription.stripeSubscriptionId,
        priceId
      );
    } else {
      // Create new subscription
      if (!user.subscription.stripeCustomerId) {
        return res.status(400).json({ error: 'No payment method on file' });
      }
      
      subscription = await billingService.createSubscription(
        user.subscription.stripeCustomerId,
        priceId,
        tier
      );
    }

    // Update user subscription in database
    user.subscription.tier = tier;
    user.subscription.stripeSubscriptionId = subscription.id;
    user.subscription.status = subscription.status;
    await user.save();

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: {
        tier,
        status: subscription.status,
        stripeSubscriptionId: subscription.id
      }
    });

  } catch (error) {
    console.error('Subscription update error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Cancel subscription
router.delete('/subscription', auth, async (req, res) => {
  try {
    const { immediate = false } = req.body;
    
    const User = require('../models/userModel');
    const user = await User.findById(req.user.id);
    
    if (!user || !user.subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    const subscription = await billingService.cancelSubscription(
      user.subscription.stripeSubscriptionId,
      immediate
    );

    // Update user status
    if (immediate) {
      user.subscription.status = 'canceled';
      user.subscription.tier = 'basic';
    } else {
      user.subscription.status = 'active'; // Still active until period end
    }
    
    await user.save();

    res.json({
      success: true,
      message: immediate ? 'Subscription canceled immediately' : 'Subscription will cancel at period end',
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: user.subscription.currentPeriodEnd
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get billing history
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const User = require('../models/userModel');
    const user = await User.findById(req.user.id);
    
    if (!user || !user.subscription.stripeCustomerId) {
      return res.json({
        success: true,
        invoices: []
      });
    }

    const invoices = await billingService.getCustomerInvoices(
      user.subscription.stripeCustomerId,
      parseInt(limit)
    );

    res.json({
      success: true,
      invoices
    });

  } catch (error) {
    console.error('Billing history error:', error);
    res.status(500).json({ error: 'Failed to retrieve billing history' });
  }
});

// Create setup intent for payment method
router.post('/setup-intent', auth, async (req, res) => {
  try {
    const stripeConfig = require('../config/stripe');
    const User = require('../models/userModel');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let customerId = user.subscription.stripeCustomerId;
    
    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await billingService.createCustomer(user.email);
      customerId = customer.id;
      
      user.subscription.stripeCustomerId = customerId;
      await user.save();
    }

    const setupIntent = await stripeConfig.stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session'
    });

    res.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      customerId
    });

  } catch (error) {
    console.error('Setup intent creation error:', error);
    res.status(500).json({ error: 'Failed to create setup intent' });
  }
});

// Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic',
        description: 'Perfect for individuals getting started',
        tokenLimit: 10000,
        monthlyPrice: 19.99,
        yearlyPrice: 199.99,
        features: [
          '10,000 tokens per month',
          'Basic consensus analysis',
          'PDF report generation',
          'Email support'
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'Ideal for professionals and small teams',
        tokenLimit: 50000,
        monthlyPrice: 49.99,
        yearlyPrice: 499.99,
        features: [
          '50,000 tokens per month',
          'Advanced consensus analysis',
          'Priority processing',
          'PDF and email reports',
          'Priority support'
        ]
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large organizations with high volume needs',
        tokenLimit: 200000,
        monthlyPrice: 149.99,
        yearlyPrice: 1499.99,
        features: [
          '200,000 tokens per month',
          'Premium consensus analysis',
          'Custom integrations',
          'Advanced reporting',
          'Dedicated support',
          'SLA guarantee'
        ]
      }
    ];

    res.json({
      success: true,
      plans,
      overageRate: 0.001 // $0.001 per token
    });

  } catch (error) {
    console.error('Plans retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve subscription plans' });
  }
});

module.exports = router; 