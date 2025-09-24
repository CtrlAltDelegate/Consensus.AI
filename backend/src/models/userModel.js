const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    firstName: String,
    lastName: String,
    organization: String
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  subscription: {
    tier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionTier',
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'past_due', 'canceled', 'trialing'],
      default: 'active'
    },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    nextBillingDate: Date,
    addOns: {
      privateMode: { type: Boolean, default: false },
      whiteLabel: { type: Boolean, default: false }
    }
  },
  // Report-based billing system
  reportUsage: {
    // Current billing period usage
    currentPeriod: {
      reportsGenerated: {
        type: Number,
        default: 0,
        min: 0
      },
      periodStart: {
        type: Date,
        default: Date.now
      },
      periodEnd: {
        type: Date,
        default: function() {
          const date = new Date();
          date.setMonth(date.getMonth() + 1);
          return date;
        }
      }
    },
    
    // Report generation history
    reportHistory: [{
      reportId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        required: true
      },
      generatedAt: {
        type: Date,
        default: Date.now
      },
      cost: {
        type: Number,
        required: true,
        min: 0
      },
      billingType: {
        type: String,
        enum: ['included', 'overage', 'pay_per_report'],
        required: true
      },
      paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'waived'],
        default: 'pending'
      },
      stripePaymentIntentId: String
    }],
    
    // Monthly usage statistics
    monthlyStats: [{
      month: {
        type: String, // Format: "YYYY-MM"
        required: true
      },
      reportsGenerated: {
        type: Number,
        required: true,
        min: 0
      },
      totalCost: {
        type: Number,
        required: true,
        min: 0
      },
      includedReports: {
        type: Number,
        required: true,
        min: 0
      },
      overageReports: {
        type: Number,
        required: true,
        min: 0
      },
      overageCost: {
        type: Number,
        required: true,
        min: 0
      }
    }],
    
    // Legacy token fields for migration compatibility
    tokenBuckets: [{
      balance: {
        type: Number,
        default: 0,
        min: 0
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: {
        type: Date,
        default: function() {
          const date = new Date();
          date.setMonth(date.getMonth() + 3);
          return date;
        }
      },
      source: {
        type: String,
        enum: ['monthly_allocation', 'purchased_bundle', 'bonus', 'refund'],
        default: 'monthly_allocation'
      }
    }],
    
    usageHistory: [{
      tokens: {
        type: Number,
        default: 0
      },
      date: {
        type: Date,
        default: Date.now
      },
      operationId: String,
      description: String
    }],
    
    totalLifetimeUsed: {
      type: Number,
      default: 0
    },
    lastAllocationDate: {
      type: Date,
      default: Date.now
    }
  },
  
  // Report storage and history
  reports: [{
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    topic: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    tokensUsed: Number,
    confidence: Number,
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing'
    }
  }],
  
  // User preferences
  preferences: {
    emailNotifications: {
      tokenLowWarning: { type: Boolean, default: true },
      reportReady: { type: Boolean, default: true },
      billing: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    defaultReportFormat: {
      type: String,
      enum: ['pdf', 'html', 'markdown'],
      default: 'pdf'
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ 'subscription.stripeCustomerId': 1 });
userSchema.index({ 'subscription.stripeSubscriptionId': 1 });
userSchema.index({ 'reportUsage.currentPeriod.periodEnd': 1 });
userSchema.index({ 'reportUsage.reportHistory.generatedAt': -1 });
userSchema.index({ 'reportUsage.monthlyStats.month': 1 });
userSchema.index({ 'reports.createdAt': -1 });
// Legacy token indexes for backward compatibility
userSchema.index({ 'reportUsage.tokenBuckets.expiresAt': 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate available reports for current billing period
userSchema.methods.getAvailableReports = function() {
  if (!this.subscription.tier) return 0;
  
  const currentPeriodReports = this.reportUsage.currentPeriod.reportsGenerated || 0;
  const includedReports = this.subscription.tier.reportsIncluded || 0;
  
  // For pay-as-you-go, always return unlimited (represented as -1)
  if (this.subscription.tier.billingType === 'per_report') {
    return -1; // Unlimited for pay-as-you-go
  }
  
  return Math.max(0, includedReports - currentPeriodReports);
};

// Get reports used in current billing period
userSchema.methods.getReportsUsedThisPeriod = function() {
  return this.reportUsage.currentPeriod.reportsGenerated || 0;
};

// Calculate overage reports for current period
userSchema.methods.getOverageReports = function() {
  if (!this.subscription.tier || this.subscription.tier.billingType === 'per_report') {
    return 0; // No overage for pay-as-you-go
  }
  
  const currentPeriodReports = this.reportUsage.currentPeriod.reportsGenerated || 0;
  const includedReports = this.subscription.tier.reportsIncluded || 0;
  
  return Math.max(0, currentPeriodReports - includedReports);
};

// Calculate current period overage cost
userSchema.methods.getCurrentOverageCost = function() {
  if (!this.subscription.tier || this.subscription.tier.billingType === 'per_report') {
    return 0;
  }
  
  const overageReports = this.getOverageReports();
  const overageRate = this.subscription.tier.overageRate || 0;
  
  return overageReports * overageRate;
};

// Check if user can generate a report (has available reports or can pay per report)
userSchema.methods.canGenerateReport = function() {
  if (!this.subscription.tier) return false;
  
  // Pay-as-you-go users can always generate reports (will be charged per report)
  if (this.subscription.tier.billingType === 'per_report') {
    return true;
  }
  
  // Subscription users can generate if they have available reports or overage is allowed
  const availableReports = this.getAvailableReports();
  return availableReports > 0 || this.subscription.tier.overageRate > 0;
};

// Reset billing period (called monthly)
userSchema.methods.resetBillingPeriod = function() {
  const now = new Date();
  const nextPeriodEnd = new Date(now);
  nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);
  
  // Archive current period stats
  const currentMonth = now.toISOString().substring(0, 7); // YYYY-MM format
  const currentPeriod = this.reportUsage.currentPeriod;
  
  if (currentPeriod.reportsGenerated > 0) {
    const overageReports = this.getOverageReports();
    const overageCost = this.getCurrentOverageCost();
    
    this.reportUsage.monthlyStats.push({
      month: currentMonth,
      reportsGenerated: currentPeriod.reportsGenerated,
      totalCost: overageCost,
      includedReports: this.subscription.tier?.reportsIncluded || 0,
      overageReports,
      overageCost
    });
  }
  
  // Reset current period
  this.reportUsage.currentPeriod = {
    reportsGenerated: 0,
    periodStart: now,
    periodEnd: nextPeriodEnd
  };
  
  return this.save();
};

// Record a report generation
userSchema.methods.recordReportGeneration = function(reportId, cost = 0, billingType = 'included') {
  // Increment current period counter
  this.reportUsage.currentPeriod.reportsGenerated += 1;
  
  // Add to report history
  this.reportUsage.reportHistory.push({
    reportId,
    generatedAt: new Date(),
    cost,
    billingType,
    paymentStatus: billingType === 'pay_per_report' ? 'pending' : 'paid'
  });
  
  return this.save();
};

// Legacy token methods for backward compatibility
userSchema.methods.getAvailableTokens = function() {
  const now = new Date();
  return this.reportUsage.tokenBuckets
    .filter(bucket => bucket.expiresAt > now)
    .reduce((sum, bucket) => sum + bucket.balance, 0);
};

userSchema.methods.getTokensExpiringSoon = function(daysAhead = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
  
  return this.reportUsage.tokenBuckets
    .filter(bucket => bucket.expiresAt <= cutoffDate && bucket.expiresAt > new Date())
    .reduce((sum, bucket) => sum + bucket.balance, 0);
};

module.exports = mongoose.model('User', userSchema); 