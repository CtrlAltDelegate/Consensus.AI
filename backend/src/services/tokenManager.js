const User = require('../models/userModel');
const SubscriptionTier = require('../models/subscriptionTiers');

class TokenManager {
  constructor() {
    // Token rollover period in days
    this.ROLLOVER_DAYS = 90;
  }

  async checkTokenAvailability(userId, requestedTokens) {
    try {
      const user = await User.findById(userId).populate('subscription.tier');
      if (!user) {
        throw new Error('User not found');
      }

      // Clean up expired tokens first
      await this.cleanupExpiredTokens(userId);

      // Get current available tokens
      const availableTokens = await this.getAvailableTokens(userId);
      const tier = user.subscription.tier;
      
      return {
        available: availableTokens,
        requested: requestedTokens,
        sufficient: availableTokens >= requestedTokens,
        overage: Math.max(0, requestedTokens - availableTokens),
        tier: tier.name,
        overagePrice: tier.tokenOveragePrice,
        estimatedCost: Math.max(0, requestedTokens - availableTokens) * tier.tokenOveragePrice
      };
    } catch (error) {
      throw new Error(`Token availability check failed: ${error.message}`);
    }
  }

  async getAvailableTokens(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return 0;

      // Sum all non-expired token balances
      const now = new Date();
      const availableTokens = user.tokenUsage.tokenBuckets
        .filter(bucket => bucket.expiresAt > now)
        .reduce((sum, bucket) => sum + bucket.balance, 0);

      return availableTokens;
    } catch (error) {
      throw new Error(`Failed to get available tokens: ${error.message}`);
    }
  }

  async getTokensExpiringSoon(userId, daysAhead = 30) {
    try {
      const user = await User.findById(userId);
      if (!user) return 0;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      const expiringSoon = user.tokenUsage.tokenBuckets
        .filter(bucket => bucket.expiresAt <= cutoffDate && bucket.expiresAt > new Date())
        .reduce((sum, bucket) => sum + bucket.balance, 0);

      return expiringSoon;
    } catch (error) {
      throw new Error(`Failed to get expiring tokens: ${error.message}`);
    }
  }

  async consumeTokens(userId, tokensUsed, operationId = null, description = '') {
    try {
      const user = await User.findById(userId).populate('subscription.tier');
      if (!user) {
        throw new Error('User not found');
      }

      // Clean up expired tokens first
      await this.cleanupExpiredTokens(userId);

      const availability = await this.checkTokenAvailability(userId, tokensUsed);
      
      if (!availability.sufficient) {
        // Handle overage
        const overageTokens = availability.overage;
        const overageCharge = overageTokens * user.subscription.tier.tokenOveragePrice;
        
        // Record overage for billing
        await this.recordOverage(userId, overageTokens, overageCharge, operationId);
      }

      // Consume tokens using FIFO (oldest first)
      await this.consumeTokensFIFO(userId, tokensUsed);

      // Record usage
      await this.recordTokenUsage(userId, tokensUsed, operationId, description);

      return {
        tokensConsumed: tokensUsed,
        overage: availability.overage,
        overageCharge: availability.estimatedCost,
        remainingTokens: await this.getAvailableTokens(userId)
      };
    } catch (error) {
      throw new Error(`Token consumption failed: ${error.message}`);
    }
  }

  async consumeTokensFIFO(userId, tokensToConsume) {
    const user = await User.findById(userId);
    let remainingToConsume = tokensToConsume;

    // Sort buckets by expiration date (oldest first)
    user.tokenUsage.tokenBuckets.sort((a, b) => a.expiresAt - b.expiresAt);

    for (let bucket of user.tokenUsage.tokenBuckets) {
      if (remainingToConsume <= 0) break;
      if (bucket.balance <= 0) continue;

      const tokensFromThisBucket = Math.min(bucket.balance, remainingToConsume);
      bucket.balance -= tokensFromThisBucket;
      remainingToConsume -= tokensFromThisBucket;
    }

    // Remove empty buckets
    user.tokenUsage.tokenBuckets = user.tokenUsage.tokenBuckets.filter(bucket => bucket.balance > 0);

    await user.save();
  }

  async addTokens(userId, tokensToAdd, source = 'monthly_allocation') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.ROLLOVER_DAYS);

      // Add new token bucket
      user.tokenUsage.tokenBuckets.push({
        balance: tokensToAdd,
        addedAt: new Date(),
        expiresAt: expiresAt,
        source: source
      });

      await user.save();

      return {
        tokensAdded: tokensToAdd,
        expiresAt: expiresAt,
        totalAvailable: await this.getAvailableTokens(userId)
      };
    } catch (error) {
      throw new Error(`Failed to add tokens: ${error.message}`);
    }
  }

  async processMonthlyAllocation(userId) {
    try {
      const user = await User.findById(userId).populate('subscription.tier');
      if (!user || !user.subscription.tier) {
        return { success: false, reason: 'No active subscription' };
      }

      const tier = user.subscription.tier;
      const currentTokens = await this.getAvailableTokens(userId);

      // Check if adding new tokens would exceed rollover limit
      const newTotal = currentTokens + tier.tokensPerMonth;
      const tokensToAdd = Math.min(tier.tokensPerMonth, tier.maxRollover - currentTokens);

      if (tokensToAdd > 0) {
        await this.addTokens(userId, tokensToAdd, 'monthly_allocation');
      }

      return {
        success: true,
        tokensAdded: tokensToAdd,
        totalTokens: await this.getAvailableTokens(userId),
        rolloverLimitReached: newTotal > tier.maxRollover
      };
    } catch (error) {
      throw new Error(`Monthly allocation failed: ${error.message}`);
    }
  }

  async cleanupExpiredTokens(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const now = new Date();
      const expiredTokens = user.tokenUsage.tokenBuckets
        .filter(bucket => bucket.expiresAt <= now)
        .reduce((sum, bucket) => sum + bucket.balance, 0);

      // Remove expired buckets
      user.tokenUsage.tokenBuckets = user.tokenUsage.tokenBuckets.filter(bucket => bucket.expiresAt > now);

      if (expiredTokens > 0) {
        await user.save();
        console.log(`Cleaned up ${expiredTokens} expired tokens for user ${userId}`);
      }

      return expiredTokens;
    } catch (error) {
      console.error(`Failed to cleanup expired tokens for user ${userId}:`, error.message);
    }
  }

  async recordOverage(userId, overageTokens, overageCharge, operationId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      user.tokenUsage.overageHistory.push({
        tokens: overageTokens,
        charge: overageCharge,
        date: new Date(),
        operationId: operationId,
        status: 'pending' // Will be updated when payment is processed
      });

      await user.save();
    } catch (error) {
      console.error(`Failed to record overage:`, error.message);
    }
  }

  async recordTokenUsage(userId, tokensUsed, operationId, description) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      user.tokenUsage.usageHistory.push({
        tokens: tokensUsed,
        date: new Date(),
        operationId: operationId,
        description: description
      });

      // Update monthly stats
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const monthlyEntry = user.tokenUsage.monthlyUsage.find(entry => entry.month === currentMonth);
      if (monthlyEntry) {
        monthlyEntry.tokens += tokensUsed;
      } else {
        user.tokenUsage.monthlyUsage.push({
          month: currentMonth,
          tokens: tokensUsed
        });
      }

      await user.save();
    } catch (error) {
      console.error(`Failed to record token usage:`, error.message);
    }
  }

  async getTokenAnalytics(userId) {
    try {
      const user = await User.findById(userId).populate('subscription.tier');
      if (!user) {
        throw new Error('User not found');
      }

      const availableTokens = await this.getAvailableTokens(userId);
      const expiringSoon = await this.getTokensExpiringSoon(userId);
      
      // Get current month usage
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthlyEntry = user.tokenUsage.monthlyUsage.find(entry => entry.month === currentMonth);
      const currentMonthUsage = monthlyEntry ? monthlyEntry.tokens : 0;

      // Get recent usage (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentUsage = user.tokenUsage.usageHistory
        .filter(entry => entry.date >= thirtyDaysAgo)
        .reduce((sum, entry) => sum + entry.tokens, 0);

      return {
        availableTokens,
        expiringSoon,
        currentMonthUsage,
        recentUsage,
        tier: user.subscription.tier,
        tokenBuckets: user.tokenUsage.tokenBuckets.map(bucket => ({
          balance: bucket.balance,
          expiresAt: bucket.expiresAt,
          source: bucket.source,
          daysUntilExpiry: Math.ceil((bucket.expiresAt - now) / (1000 * 60 * 60 * 24))
        })),
        overage: user.tokenUsage.overageHistory.filter(o => o.status === 'pending'),
        usageHistory: user.tokenUsage.usageHistory.slice(-10) // Last 10 operations
      };
    } catch (error) {
      throw new Error(`Failed to get token analytics: ${error.message}`);
    }
  }

  // Estimate tokens for different operations
  async estimateTokensForOperation(operationType, contentLength) {
    try {
      // Base token estimates for different operations
      const baseEstimates = {
        consensus: 8000,      // 3-phase LLM consensus
        analysis: 3000,       // Single analysis
        summary: 1500,        // Text summarization
        translation: 2000,    // Language translation
        qa: 2500             // Q&A operations
      };

      // Content length multiplier (rough estimate: 1 token ≈ 4 characters)
      const contentTokens = Math.ceil(contentLength / 4);
      const baseTokens = baseEstimates[operationType] || 3000;
      
      // Total estimate with some buffer (20%)
      const estimatedTokens = Math.ceil((baseTokens + contentTokens) * 1.2);
      
      console.log(`📊 Token estimation: operation=${operationType}, content=${contentLength} chars, estimated=${estimatedTokens}`);
      
      return estimatedTokens;
    } catch (error) {
      console.error('Error estimating tokens:', error);
      // Return conservative estimate if calculation fails
      return 10000;
    }
  }
}

module.exports = new TokenManager(); 