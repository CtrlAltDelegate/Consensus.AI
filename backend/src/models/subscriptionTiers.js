const mongoose = require('mongoose');

const subscriptionTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['lite', 'pro', 'expert']
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  monthlyPrice: {
    type: Number,
    required: true // in dollars
  },
  tokensPerMonth: {
    type: Number,
    required: true // monthly token allocation
  },
  estimatedReports: {
    type: Number,
    required: true // estimated reports per month
  },
  maxRollover: {
    type: Number,
    required: true // maximum tokens that can be accumulated
  },
  tokenOveragePrice: {
    type: Number,
    required: true // price per token when exceeding limit
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

// Default subscription tiers based on specification
subscriptionTierSchema.statics.getDefaultTiers = function() {
  return [
    {
      name: 'lite',
      displayName: 'Lite',
      description: 'Perfect for individual researchers and students',
      monthlyPrice: 14,
      tokensPerMonth: 25000,
      estimatedReports: 2,
      maxRollover: 75000, // 3 months worth
      tokenOveragePrice: 0.01, // $0.01 per token
      features: [
        '~2 consensus reports per month',
        '25,000 tokens included',
        'Access to all 4 LLMs',
        '3-phase consensus workflow',
        'PDF report downloads',
        'Basic dashboard',
        'Token rollover (90 days)'
      ]
    },
    {
      name: 'pro',
      displayName: 'Pro',
      description: 'Ideal for professionals and small teams',
      monthlyPrice: 29,
      tokensPerMonth: 60000,
      estimatedReports: 5,
      maxRollover: 180000, // 3 months worth
      tokenOveragePrice: 0.009, // $0.009 per token
      features: [
        '~5 consensus reports per month',
        '60,000 tokens included',
        'Access to all 4 LLMs',
        '3-phase consensus workflow',
        'PDF report downloads',
        'Enhanced dashboard',
        'Token rollover (90 days)',
        'Priority processing',
        'Email report delivery'
      ]
    },
    {
      name: 'expert',
      displayName: 'Expert',
      description: 'For organizations and heavy users',
      monthlyPrice: 59,
      tokensPerMonth: 150000,
      estimatedReports: 12,
      maxRollover: 450000, // 3 months worth
      tokenOveragePrice: 0.008, // $0.008 per token
      features: [
        '~12 consensus reports per month',
        '150,000 tokens included',
        'Access to all 4 LLMs',
        '3-phase consensus workflow',
        'PDF report downloads',
        'Advanced analytics dashboard',
        'Token rollover (90 days)',
        'Priority processing',
        'Email report delivery',
        'API access',
        'Custom report templates',
        'Bulk processing'
      ]
    }
  ];
};

module.exports = mongoose.model('SubscriptionTier', subscriptionTierSchema); 