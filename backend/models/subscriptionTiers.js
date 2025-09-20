// backend/models/subscriptionTiers.js
const mongoose = require('mongoose');

const subscriptionTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Free', 'Lite', 'Pro', 'Expert']
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  tokenLimit: {
    type: Number,
    required: true,
    min: 0
  },
  monthlyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  yearlyPrice: {
    type: Number,
    required: true,
    min: 0
  },
  features: [{
    type: String,
    required: true
  }],
  stripePriceIds: {
    monthly: {
      type: String,
      default: null
    },
    yearly: {
      type: String,
      default: null
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  // Token overage pricing (per token above limit)
  overageRate: {
    type: Number,
    default: 0.001 // $0.001 per token
  },
  // Maximum tokens that can be purchased as overage
  maxOverageTokens: {
    type: Number,
    default: 100000
  }
}, {
  timestamps: true
});

// Indexes for performance
subscriptionTierSchema.index({ name: 1 });
subscriptionTierSchema.index({ isActive: 1 });
subscriptionTierSchema.index({ sortOrder: 1 });

// Virtual for yearly savings calculation
subscriptionTierSchema.virtual('yearlySavings').get(function() {
  const monthlyYearly = this.monthlyPrice * 12;
  return monthlyYearly - this.yearlyPrice;
});

// Virtual for yearly savings percentage
subscriptionTierSchema.virtual('yearlySavingsPercent').get(function() {
  const monthlyYearly = this.monthlyPrice * 12;
  if (monthlyYearly === 0) return 0;
  return Math.round(((monthlyYearly - this.yearlyPrice) / monthlyYearly) * 100);
});

// Static method to get all active tiers sorted by price
subscriptionTierSchema.statics.getActiveTiers = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1 });
};

// Static method to get tier by name
subscriptionTierSchema.statics.getTierByName = function(name) {
  return this.findOne({ name, isActive: true });
};

// Instance method to check if this tier allows certain features
subscriptionTierSchema.methods.hasFeature = function(feature) {
  return this.features.includes(feature);
};

// Instance method to calculate overage cost
subscriptionTierSchema.methods.calculateOverageCost = function(tokensUsed) {
  if (tokensUsed <= this.tokenLimit) return 0;
  
  const overageTokens = Math.min(
    tokensUsed - this.tokenLimit,
    this.maxOverageTokens
  );
  
  return overageTokens * this.overageRate;
};

module.exports = mongoose.model('SubscriptionTier', subscriptionTierSchema);
