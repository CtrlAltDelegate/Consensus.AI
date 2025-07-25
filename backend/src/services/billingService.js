const stripeConfig = require('../config/stripe');
const User = require('../models/userModel');

class BillingService {
  constructor() {
    this.stripe = stripeConfig.stripe;
  }

  async createCustomer(userEmail, paymentMethodId = null) {
    try {
      const customer = await this.stripe.customers.create({
        email: userEmail,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      return customer;
    } catch (error) {
      throw new Error(`Customer creation failed: ${error.message}`);
    }
  }

  async createSubscription(customerId, priceId, tier) {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      });

      return subscription;
    } catch (error) {
      throw new Error(`Subscription creation failed: ${error.message}`);
    }
  }

  async updateSubscription(subscriptionId, newPriceId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId
        }],
        proration_behavior: 'create_prorations'
      });

      return updatedSubscription;
    } catch (error) {
      throw new Error(`Subscription update failed: ${error.message}`);
    }
  }

  async cancelSubscription(subscriptionId, immediate = false) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: !immediate
      });

      if (immediate) {
        await this.stripe.subscriptions.del(subscriptionId);
      }

      return subscription;
    } catch (error) {
      throw new Error(`Subscription cancellation failed: ${error.message}`);
    }
  }

  async createOverageInvoice(customerId, overageTokens, unitPrice = stripeConfig.overageTokenPrice) {
    try {
      const invoiceItem = await this.stripe.invoiceItems.create({
        customer: customerId,
        amount: Math.round(overageTokens * unitPrice * 100), // Convert to cents
        currency: 'usd',
        description: `Token overage: ${overageTokens.toLocaleString()} tokens`
      });

      const invoice = await this.stripe.invoices.create({
        customer: customerId,
        auto_advance: true,
        collection_method: 'charge_automatically'
      });

      return { invoiceItem, invoice };
    } catch (error) {
      throw new Error(`Overage invoice creation failed: ${error.message}`);
    }
  }

  async getSubscriptionStatus(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      return {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        priceId: subscription.items.data[0].price.id
      };
    } catch (error) {
      throw new Error(`Subscription status retrieval failed: ${error.message}`);
    }
  }

  async getCustomerInvoices(customerId, limit = 10) {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit
      });

      return invoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid / 100,
        currency: invoice.currency,
        status: invoice.status,
        date: new Date(invoice.created * 1000),
        description: invoice.description,
        hostedInvoiceUrl: invoice.hosted_invoice_url
      }));
    } catch (error) {
      throw new Error(`Invoice retrieval failed: ${error.message}`);
    }
  }

  async processWebhook(event) {
    try {
      switch (event.type) {
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (error) {
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }

  async handleSubscriptionUpdate(subscription) {
    const user = await User.findOne({ 
      'subscription.stripeSubscriptionId': subscription.id 
    });
    
    if (user) {
      user.subscription.status = subscription.status;
      user.subscription.currentPeriodStart = new Date(subscription.current_period_start * 1000);
      user.subscription.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      
      await user.save();
    }
  }

  async handleSubscriptionCancellation(subscription) {
    const user = await User.findOne({ 
      'subscription.stripeSubscriptionId': subscription.id 
    });
    
    if (user) {
      user.subscription.status = 'canceled';
      await user.save();
    }
  }

  async handlePaymentSuccess(invoice) {
    // Reset token usage for the new billing period
    const customer = await this.stripe.customers.retrieve(invoice.customer);
    const user = await User.findOne({ 
      'subscription.stripeCustomerId': customer.id 
    });
    
    if (user) {
      user.tokenUsage.currentPeriodUsed = 0;
      user.tokenUsage.lastResetDate = new Date();
      await user.save();
    }
  }

  async handlePaymentFailure(invoice) {
    const customer = await this.stripe.customers.retrieve(invoice.customer);
    const user = await User.findOne({ 
      'subscription.stripeCustomerId': customer.id 
    });
    
    if (user) {
      user.subscription.status = 'past_due';
      await user.save();
      
      // In a real implementation, you'd send notification emails here
    }
  }
}

module.exports = new BillingService(); 