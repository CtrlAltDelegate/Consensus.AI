const mongoose = require('mongoose');

const subscriptionTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['basic', 'pro', 'enterprise']
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
    required: true
  },
  yearlyPrice: {
    type: Number,
    required: true
  },
  tokenLimit: {
    type: Number,
    required: true
  },
  features: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SubscriptionTier', subscriptionTierSchema); 