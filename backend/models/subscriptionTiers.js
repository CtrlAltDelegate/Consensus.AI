// backend/models/subscriptionTiers.js
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
  // Report-based pricing fields
  reportsIncluded: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  pricePerReport: {
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
  // Overage pricing for additional reports beyond included amount
  overageRate: {
    type: Number,
    default: 0 // Price per additional report
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
    },
    perReport: {
      type: String,
      default: null // For pay-as-you-go single report purchases
    }
  },
  billingType: {
    type: String,
    enum: ['subscription', 'per_report'],
    default: 'subscription'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  // Legacy token fields (for migration compatibility)
  tokenLimit: {
    type: Number,
    default: 0
  },
  maxOverageTokens: {
    type: Number,
    default: 0
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

// Instance method to calculate overage cost for additional reports
subscriptionTierSchema.methods.calculateOverageCost = function(reportsUsed) {
  if (this.billingType === 'per_report') {
    // Pay-as-you-go: each report costs the full price
    return reportsUsed * this.pricePerReport;
  }
  
  if (reportsUsed <= this.reportsIncluded) return 0;
  
  const overageReports = reportsUsed - this.reportsIncluded;
  return overageReports * this.overageRate;
};

// Instance method to get effective price per report
subscriptionTierSchema.methods.getEffectivePricePerReport = function() {
  if (this.billingType === 'per_report') {
    return this.pricePerReport;
  }
  
  if (this.reportsIncluded === 0) return 0;
  return this.monthlyPrice / this.reportsIncluded;
};

// Instance method to calculate savings vs pay-as-you-go
subscriptionTierSchema.methods.calculateSavings = function(payAsYouGoPrice = 15) {
  if (this.billingType === 'per_report') return 0;
  
  const effectivePrice = this.getEffectivePricePerReport();
  const savings = ((payAsYouGoPrice - effectivePrice) / payAsYouGoPrice) * 100;
  return Math.round(savings);
};

module.exports = mongoose.model('SubscriptionTier', subscriptionTierSchema);
