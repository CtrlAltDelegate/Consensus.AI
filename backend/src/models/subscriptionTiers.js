const mongoose = require('mongoose');

const subscriptionTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['PayAsYouGo', 'Starter', 'Professional', 'Business']
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  // Report-based billing
  billingType: {
    type: String,
    enum: ['per_report', 'subscription'],
    required: true
  },
  monthlyPrice: {
    type: Number,
    required: function() { return this.billingType === 'subscription'; } // in dollars
  },
  pricePerReport: {
    type: Number,
    required: function() { return this.billingType === 'per_report'; } // for pay-as-you-go
  },
  reportsIncluded: {
    type: Number,
    default: 0 // reports included in subscription (0 for pay-as-you-go)
  },
  overageRate: {
    type: Number,
    default: 0 // price per additional report beyond included
  },
  // Legacy token fields for backward compatibility
  tokensPerMonth: {
    type: Number,
    default: 0
  },
  maxRollover: {
    type: Number,
    default: 0
  },
  tokenOveragePrice: {
    type: Number,
    default: 0
  },
  features: [{
    type: String
  }],
  addOns: {
    privateMode: {
      available: { type: Boolean, default: true },
      monthlyPrice: { type: Number, default: 6 }
    },
    whiteLabel: {
      available: { type: Boolean, default: true },
      monthlyPrice: { type: Number, default: 9 }
    },
    tokenBundles: {
      available: { type: Boolean, default: true },
      pricePerThousand: { type: Number, default: 1 } // $10 for 10k tokens = $1 per 1k
    }
  },
  stripeProductId: {
    type: String
  },
  stripePriceId: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Default subscription tiers - Report-based billing
subscriptionTierSchema.statics.getDefaultTiers = function() {
  return [
    {
      name: 'PayAsYouGo',
      displayName: 'Pay-As-You-Go',
      description: 'Perfect for occasional analysis',
      billingType: 'per_report',
      pricePerReport: 15,
      reportsIncluded: 0,
      overageRate: 0,
      features: [
        'No monthly commitment',
        'Pay only for what you use',
        '4-LLM consensus analysis',
        'Professional PDF reports',
        'Report history & storage',
        'Email support',
        'GDPR compliant data handling'
      ]
    },
    {
      name: 'Starter',
      displayName: 'Starter',
      description: 'Great for individuals and small teams',
      billingType: 'subscription',
      monthlyPrice: 29,
      reportsIncluded: 3,
      overageRate: 12,
      features: [
        '3 reports per month included',
        '$12 per additional report',
        '4-LLM consensus analysis',
        'Professional PDF reports',
        'Report history & storage',
        'Priority email support',
        'Advanced export options',
        'GDPR compliant data handling'
      ]
    },
    {
      name: 'Professional',
      displayName: 'Professional',
      description: 'Perfect for professionals and growing teams',
      billingType: 'subscription',
      monthlyPrice: 79,
      reportsIncluded: 10,
      overageRate: 10,
      features: [
        '10 reports per month included',
        '$10 per additional report',
        '4-LLM consensus analysis',
        'Professional PDF reports',
        'Report history & storage',
        'Priority support',
        'Custom report branding',
        'Advanced analytics',
        'Team collaboration tools',
        'GDPR compliant data handling'
      ]
    },
    {
      name: 'Business',
      displayName: 'Business',
      description: 'For organizations with high-volume needs',
      billingType: 'subscription',
      monthlyPrice: 199,
      reportsIncluded: 30,
      overageRate: 8,
      features: [
        '30 reports per month included',
        '$8 per additional report',
        '4-LLM consensus analysis',
        'Professional PDF reports',
        'Report history & storage',
        'Dedicated account manager',
        'Custom report branding',
        'Advanced analytics',
        'Team collaboration tools',
        'Priority API access',
        'Custom integrations',
        'GDPR compliant data handling'
      ]
    }
  ];
};

module.exports = mongoose.model('SubscriptionTier', subscriptionTierSchema); 