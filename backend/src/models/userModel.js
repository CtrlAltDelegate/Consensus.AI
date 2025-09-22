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
  tokenUsage: {
    // Token buckets with expiration dates for 90-day rollover
    tokenBuckets: [{
      balance: {
        type: Number,
        required: true,
        min: 0
      },
      addedAt: {
        type: Date,
        required: true,
        default: Date.now
      },
      expiresAt: {
        type: Date,
        required: true
      },
      source: {
        type: String,
        enum: ['monthly_allocation', 'purchased_bundle', 'bonus', 'refund'],
        default: 'monthly_allocation'
      }
    }],
    
    // Usage history for tracking and analytics
    usageHistory: [{
      tokens: {
        type: Number,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      },
      operationId: String,
      description: String
    }],
    
    // Monthly usage statistics
    monthlyUsage: [{
      month: {
        type: String, // Format: "YYYY-MM"
        required: true
      },
      tokens: {
        type: Number,
        required: true
      }
    }],
    
    // Overage tracking for billing
    overageHistory: [{
      tokens: {
        type: Number,
        required: true
      },
      charge: {
        type: Number,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      },
      operationId: String,
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'waived'],
        default: 'pending'
      }
    }],
    
    // Legacy fields for migration compatibility
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
userSchema.index({ 'tokenUsage.tokenBuckets.expiresAt': 1 });
userSchema.index({ 'reports.createdAt': -1 });

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

// Calculate total available tokens
userSchema.methods.getAvailableTokens = function() {
  const now = new Date();
  return this.tokenUsage.tokenBuckets
    .filter(bucket => bucket.expiresAt > now)
    .reduce((sum, bucket) => sum + bucket.balance, 0);
};

// Get tokens expiring soon
userSchema.methods.getTokensExpiringSoon = function(daysAhead = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
  
  return this.tokenUsage.tokenBuckets
    .filter(bucket => bucket.expiresAt <= cutoffDate && bucket.expiresAt > new Date())
    .reduce((sum, bucket) => sum + bucket.balance, 0);
};

module.exports = mongoose.model('User', userSchema); 