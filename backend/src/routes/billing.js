const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel');
const SubscriptionTier = require('../models/subscriptionTiers');
const auth = require('../middleware/auth');
const { validateSubscriptionUpdate } = require('../utils/validation');

// All billing routes require authentication
router.use(auth);

// @route   GET /api/billing/plans
// @desc    Get available subscription plans
// @access  Private
router.get('/plans', async (req, res) => {
  try {
    const plans = await SubscriptionTier.getActiveTiers();
    
    const plansWithPricing = plans.map(plan => ({
      id: plan._id,
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      yearlySavings: plan.yearlySavings,
      yearlySavingsPercent: plan.yearlySavingsPercent,
      // Report-based pricing fields
      reportsIncluded: plan.reportsIncluded,
      pricePerReport: plan.pricePerReport,
      overageRate: plan.overageRate,
      billingType: plan.billingType,
      // Legacy token fields for backward compatibility
      tokenLimit: plan.tokenLimit || 0,
      features: plan.features,
      stripePriceIds: plan.stripePriceIds,
      // Calculated fields
      effectivePricePerReport: plan.getEffectivePricePerReport(),
      savingsVsPayAsYouGo: plan.calculateSavings()
    }));

    res.json({
      success: true,
      plans: plansWithPricing
    });

  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to retrieve subscription plans' });
  }
});

// @route   POST /api/billing/create-checkout-session
// @desc    Create Stripe checkout session for subscription
// @access  Private
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { error } = validateSubscriptionUpdate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { tier, billingPeriod = 'monthly' } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the subscription tier
    const subscriptionTier = await SubscriptionTier.findById(tier);
    if (!subscriptionTier) {
      return res.status(404).json({ error: 'Subscription tier not found' });
    }

    // Check if it's the pay-as-you-go tier (no subscription needed)
    if (subscriptionTier.name === 'PayAsYouGo') {
      return res.status(400).json({ error: 'Pay-As-You-Go users pay per report, no subscription needed' });
    }

    // Get the appropriate Stripe price ID
    const priceId = billingPeriod === 'yearly' 
      ? subscriptionTier.stripePriceIds.yearly 
      : subscriptionTier.stripePriceIds.monthly;

    if (!priceId) {
      return res.status(400).json({ 
        error: `${billingPeriod} billing not available for this plan` 
      });
    }

    // Create or get Stripe customer
    let customerId = user.subscription.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      user.subscription.stripeCustomerId = customerId;
      await user.save();
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/billing?canceled=true`,
      metadata: {
        userId: user._id.toString(),
        tierId: subscriptionTier._id.toString(),
        billingPeriod
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// @route   POST /api/billing/create-portal-session
// @desc    Create Stripe customer portal session
// @access  Private
router.post('/create-portal-session', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || !user.subscription.stripeCustomerId) {
      return res.status(404).json({ error: 'No billing account found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.subscription.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL}/billing`,
    });

    res.json({
      success: true,
      url: session.url
    });

  } catch (error) {
    console.error('Create portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// @route   GET /api/billing/subscription
// @desc    Get current subscription details
// @access  Private
router.get('/subscription', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('subscription.tier', 'name displayName monthlyPrice yearlyPrice reportsIncluded pricePerReport overageRate billingType features tokenLimit');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle users without subscription setup (default to PayAsYouGo)
    if (!user.subscription || !user.subscription.tier) {
      return res.json({
        success: true,
        subscription: {
          tier: 'PayAsYouGo',
          status: 'active',
          reportsGenerated: 0,
          reportsRemaining: 'unlimited',
          billingPeriod: 'monthly',
          nextBillingDate: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null
        }
      });
    }

    let stripeSubscription = null;
    if (user.subscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          user.subscription.stripeSubscriptionId
        );
      } catch (error) {
        console.warn('Failed to retrieve Stripe subscription:', error.message);
      }
    }

    const subscriptionDetails = {
      tier: user.subscription.tier,
      status: user.subscription.status,
      currentPeriodStart: user.subscription.currentPeriodStart,
      currentPeriodEnd: user.subscription.currentPeriodEnd,
      nextBillingDate: user.subscription.nextBillingDate,
      stripeData: stripeSubscription ? {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000),
        cancel_at_period_end: stripeSubscription.cancel_at_period_end
      } : null,
      // Report-based usage tracking
      reportUsage: {
        availableReports: user.getAvailableReports(),
        reportsUsedThisPeriod: user.getReportsUsedThisPeriod(),
        overageReports: user.getOverageReports(),
        currentOverageCost: user.getCurrentOverageCost(),
        canGenerateReport: user.canGenerateReport(),
        billingPeriod: {
          start: user.reportUsage.currentPeriod.periodStart,
          end: user.reportUsage.currentPeriod.periodEnd
        }
      },
      // Legacy token usage for backward compatibility
      tokenUsage: {
        available: user.getAvailableTokens(),
        expiringSoon: user.getTokensExpiringSoon(30)
      }
    };

    res.json({
      success: true,
      subscription: subscriptionDetails
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to retrieve subscription details' });
  }
});

// @route   POST /api/billing/cancel-subscription
// @desc    Cancel subscription at end of billing period
// @access  Private
router.post('/cancel-subscription', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || !user.subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel subscription at period end in Stripe
    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true
      }
    );

    // Update user subscription status
    user.subscription.status = 'canceled';
    await user.save();

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing period',
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// @route   POST /api/billing/reactivate-subscription
// @desc    Reactivate a canceled subscription
// @access  Private
router.post('/reactivate-subscription', async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user || !user.subscription.stripeSubscriptionId) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Reactivate subscription in Stripe
    const subscription = await stripe.subscriptions.update(
      user.subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: false
      }
    );

    // Update user subscription status
    user.subscription.status = 'active';
    await user.save();

    res.json({
      success: true,
      message: 'Subscription reactivated successfully',
      subscription: {
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });

  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ error: 'Failed to reactivate subscription' });
  }
});

// @route   GET /api/billing/invoices
// @desc    Get billing history/invoices
// @access  Private
router.get('/invoices', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const user = await User.findById(req.user.userId);

    if (!user || !user.subscription.stripeCustomerId) {
      return res.json({
        success: true,
        invoices: []
      });
    }

    const invoices = await stripe.invoices.list({
      customer: user.subscription.stripeCustomerId,
      limit: parseInt(limit)
    });

    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      amount_paid: invoice.amount_paid,
      amount_due: invoice.amount_due,
      currency: invoice.currency,
      status: invoice.status,
      created: invoice.created,
      period_start: invoice.period_start,
      period_end: invoice.period_end,
      hosted_invoice_url: invoice.hosted_invoice_url,
      invoice_pdf: invoice.invoice_pdf
    }));

    res.json({
      success: true,
      invoices: formattedInvoices
    });

  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to retrieve billing history' });
  }
});

// @route   GET /api/billing/usage
// @desc    Get detailed token usage statistics
// @access  Private
router.get('/usage', async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('subscription.tier', 'name tokenLimit');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current token stats
    const availableTokens = user.getAvailableTokens();
    const tokensExpiringSoon = user.getTokensExpiringSoon(30);

    // Get usage history for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyUsage = user.tokenUsage.monthlyUsage
      .filter(usage => new Date(usage.month + '-01') >= sixMonthsAgo)
      .sort((a, b) => a.month.localeCompare(b.month));

    // Get recent usage history
    const recentUsage = user.tokenUsage.usageHistory
      .slice(-20) // Last 20 operations
      .reverse(); // Most recent first

    // Calculate total lifetime usage
    const totalLifetimeUsed = user.tokenUsage.totalLifetimeUsed || 0;

    res.json({
      success: true,
      usage: {
        current: {
          available: availableTokens,
          limit: user.subscription.tier?.tokenLimit || 0,
          used: Math.max(0, (user.subscription.tier?.tokenLimit || 0) - availableTokens),
          expiringSoon: tokensExpiringSoon
        },
        monthly: monthlyUsage,
        recent: recentUsage,
        lifetime: {
          totalUsed: totalLifetimeUsed,
          averageMonthly: monthlyUsage.length > 0 
            ? Math.round(monthlyUsage.reduce((sum, m) => sum + m.tokens, 0) / monthlyUsage.length)
            : 0
        },
        tokenBuckets: user.tokenUsage.tokenBuckets
          .filter(bucket => bucket.expiresAt > new Date())
          .map(bucket => ({
            balance: bucket.balance,
            source: bucket.source,
            addedAt: bucket.addedAt,
            expiresAt: bucket.expiresAt
          }))
      }
    });

  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: 'Failed to retrieve usage statistics' });
  }
});

module.exports = router;