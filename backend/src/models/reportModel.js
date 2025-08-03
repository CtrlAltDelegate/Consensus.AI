const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 500
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  consensus: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  metadata: {
    totalTokens: {
      type: Number,
      required: true,
      min: 0
    },
    llmsUsed: [{
      type: String,
      required: true
    }],
    processingTime: String,
    priority: {
      type: String,
      enum: ['standard', 'detailed'],
      default: 'standard'
    }
  },
  phases: {
    phase1_drafts: [{
      model: String,
      content: String,
      tokens: Number
    }],
    phase2_reviews: [{
      reviewer: String,
      content: String,
      tokens: Number
    }],
    phase3_consensus: {
      arbiter: String,
      content: String,
      tokens: Number
    }
  },
  sources: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  status: {
    type: String,
    enum: ['draft', 'completed', 'failed', 'archived'],
    default: 'completed'
  },
  visibility: {
    type: String,
    enum: ['private', 'shared', 'public'],
    default: 'private'
  },
  pdf: {
    available: {
      type: Boolean,
      default: false
    },
    filename: String,
    size: Number,
    generatedAt: Date
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    downloads: {
      type: Number,
      default: 0
    },
    lastViewed: Date,
    lastDownloaded: Date
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ userId: 1, status: 1 });
reportSchema.index({ tags: 1 });
reportSchema.index({ 'metadata.totalTokens': 1 });

// Virtual for formatted creation date
reportSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Virtual for summary (first 150 chars of consensus)
reportSchema.virtual('summary').get(function() {
  if (!this.consensus) return '';
  return this.consensus.length > 150 
    ? this.consensus.substring(0, 150) + '...'
    : this.consensus;
});

// Static method to find reports by user
reportSchema.statics.findByUser = function(userId, options = {}) {
  const {
    page = 1,
    limit = 10,
    status = 'completed',
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

  return this.find({ userId, status })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('userId', 'email profile.firstName profile.lastName');
};

// Static method to get user's report statistics
reportSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalTokens: { $sum: '$metadata.totalTokens' },
        avgConfidence: { $avg: '$confidence' }
      }
    }
  ]);
};

// Instance method to increment view count
reportSchema.methods.incrementViews = function() {
  this.analytics.views += 1;
  this.analytics.lastViewed = new Date();
  return this.save();
};

// Instance method to increment download count
reportSchema.methods.incrementDownloads = function() {
  this.analytics.downloads += 1;
  this.analytics.lastDownloaded = new Date();
  return this.save();
};

// Pre-save middleware to generate title if not provided
reportSchema.pre('save', function(next) {
  if (!this.title && this.topic) {
    // Generate title from topic (first 100 chars)
    this.title = this.topic.length > 100 
      ? this.topic.substring(0, 100) + '...'
      : this.topic;
  }
  next();
});

// Pre-save middleware to extract tags from topic and consensus
reportSchema.pre('save', function(next) {
  if (!this.tags || this.tags.length === 0) {
    const text = `${this.topic} ${this.consensus}`.toLowerCase();
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'a', 'an'];
    
    // Extract potential tags (words 4+ chars, not common words)
    const words = text.match(/\b\w{4,}\b/g) || [];
    const uniqueWords = [...new Set(words)]
      .filter(word => !commonWords.includes(word))
      .slice(0, 10); // Limit to 10 tags
    
    this.tags = uniqueWords;
  }
  next();
});

module.exports = mongoose.model('Report', reportSchema);