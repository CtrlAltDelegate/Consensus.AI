const mongoose = require('mongoose');

/**
 * ConsensusJob — persists async consensus job state to MongoDB so that
 * in-flight and completed jobs survive server restarts.
 *
 * The in-memory Maps in consensus.js are kept as a fast read-through cache;
 * this model is the source of truth after a restart.
 *
 * TTL: jobs are automatically purged from MongoDB 24 hours after completion.
 * Unfinished jobs (started/processing) are purged after 3 hours via a
 * separate cron-style cleanup on startup.
 */
const consensusJobSchema = new mongoose.Schema({
  jobId:          { type: String, required: true, unique: true, index: true },
  userId:         { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['started', 'processing', 'completed', 'failed'],
    default: 'started'
  },
  progress:       { type: Number, default: 0 },
  phase:          { type: String, default: 'phase1' },
  topic:          { type: String },
  sources:        [{ type: String }],
  options:        { type: mongoose.Schema.Types.Mixed },
  estimatedTokens:{ type: Number },
  // Snapshot of per-phase statuses (mirrors the in-memory phases object)
  phases:         { type: mongoose.Schema.Types.Mixed },
  // Full result payload stored on completion so polls survive restarts
  result:         { type: mongoose.Schema.Types.Mixed },
  error:          { type: String },
  startedAt:      { type: Date },
  completedAt:    { type: Date },
  duration:       { type: String }
}, {
  timestamps: true
});

// TTL index: auto-delete documents 24 hours after completedAt is set.
// MongoDB only applies this TTL to documents where completedAt is a valid date.
consensusJobSchema.index({ completedAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('ConsensusJob', consensusJobSchema);
