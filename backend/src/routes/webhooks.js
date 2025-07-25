const express = require('express');
const router = express.Router();
const billingService = require('../services/billingService');
const emailService = require('../services/emailService');

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripeConfig = require('../config/stripe');
  
  let event;

  try {
    event = stripeConfig.stripe.webhooks.constructEvent(req.body, sig, stripeConfig.webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await billingService.processWebhook(event);
    
    // Handle additional webhook events for notifications
    await handleWebhookNotifications(event);
    
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleWebhookNotifications(event) {
  const User = require('../models/userModel');
  
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        // Send welcome email for new subscription
        const newSubscription = event.data.object;
        const newUser = await User.findOne({ 
          'subscription.stripeSubscriptionId': newSubscription.id 
        });
        
        if (newUser) {
          await emailService.sendWelcomeEmail(
            newUser.email,
            newUser.profile?.firstName || 'User'
          );
        }
        break;

      case 'customer.subscription.updated':
        // Handle subscription changes
        const updatedSubscription = event.data.object;
        
        if (updatedSubscription.cancel_at_period_end) {
          // Subscription was set to cancel
          const cancelingUser = await User.findOne({ 
            'subscription.stripeSubscriptionId': updatedSubscription.id 
          });
          
          console.log(`Subscription ${updatedSubscription.id} set to cancel at period end`);
        }
        break;

      case 'customer.subscription.deleted':
        // Subscription was canceled
        const canceledSubscription = event.data.object;
        const canceledUser = await User.findOne({ 
          'subscription.stripeSubscriptionId': canceledSubscription.id 
        });
        
        console.log(`Subscription ${canceledSubscription.id} canceled`);
        break;

      case 'invoice.payment_succeeded':
        // Payment succeeded - reset token usage
        const successfulPayment = event.data.object;
        console.log(`Payment succeeded for invoice ${successfulPayment.id}`);
        break;

      case 'invoice.payment_failed':
        // Payment failed - send notification
        const failedPayment = event.data.object;
        const customer = await stripeConfig.stripe.customers.retrieve(failedPayment.customer);
        const paymentFailedUser = await User.findOne({ 
          'subscription.stripeCustomerId': customer.id 
        });
        
        if (paymentFailedUser) {
          await emailService.sendBillingFailureNotification(
            paymentFailedUser.email,
            paymentFailedUser.profile?.firstName || 'User',
            {
              amount: failedPayment.amount_due / 100,
              currency: failedPayment.currency,
              nextPaymentAttempt: failedPayment.next_payment_attempt
            }
          );
        }
        break;

      case 'customer.subscription.trial_will_end':
        // Trial ending soon
        const trialEndingSubscription = event.data.object;
        const trialUser = await User.findOne({ 
          'subscription.stripeSubscriptionId': trialEndingSubscription.id 
        });
        
        console.log(`Trial ending soon for subscription ${trialEndingSubscription.id}`);
        break;

      case 'invoice.upcoming':
        // Upcoming invoice - good time to check usage and send warnings
        const upcomingInvoice = event.data.object;
        const invoiceCustomer = await stripeConfig.stripe.customers.retrieve(upcomingInvoice.customer);
        const invoiceUser = await User.findOne({ 
          'subscription.stripeCustomerId': invoiceCustomer.id 
        });
        
        if (invoiceUser) {
          // Check if user is close to token limit
          const tokenManager = require('../services/tokenManager');
          const usageStats = await tokenManager.getUsageStats(invoiceUser._id);
          
          if (usageStats.usagePercentage >= 75) {
            await emailService.sendTokenUsageAlert(
              invoiceUser.email,
              invoiceUser.profile?.firstName || 'User',
              usageStats
            );
          }
        }
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Webhook notification handling error:', error);
  }
}

// Health check for webhook endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    endpoint: 'webhooks'
  });
});

// Test webhook endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test', express.json(), async (req, res) => {
    try {
      console.log('Test webhook received:', req.body);
      res.json({ success: true, message: 'Test webhook received' });
    } catch (error) {
      console.error('Test webhook error:', error);
      res.status(500).json({ error: 'Test webhook failed' });
    }
  });
}

module.exports = router; 