const User = require('../models/userModel');
const stripeConfig = require('../config/stripe');

class TokenManager {
  constructor() {
    this.tierLimits = {
      basic: 10000,
      pro: 50000,
      enterprise: 200000
    };
  }

  async checkTokenAvailability(userId, requestedTokens) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const currentLimit = this.tierLimits[user.subscription.tier];
      const available = currentLimit - user.tokenUsage.currentPeriodUsed;
      
      return {
        available,
        requested: requestedTokens,
        sufficient: available >= requestedTokens,
        overage: Math.max(0, requestedTokens - available),
        currentUsage: user.tokenUsage.currentPeriodUsed,
        limit: currentLimit,
        tier: user.subscription.tier
      };
    } catch (error) {
      throw new Error(`Token availability check failed: ${error.message}`);
    }
  }

  async consumeTokens(userId, tokensUsed, operationId = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const availability = await this.checkTokenAvailability(userId, tokensUsed);
      
      if (!availability.sufficient) {
        // Calculate overage charges
        const overageTokens = availability.overage;
        const overageCharge = overageTokens * stripeConfig.overageTokenPrice;
        
        // In a real implementation, you'd want to handle billing here
        console.log(`Overage detected: ${overageTokens} tokens, charge: $${overageCharge}`);
        
        // For now, we'll allow the usage but flag it
        await this.recordOverage(userId, overageTokens, overageCharge);
      }

      // Update token usage
      user.tokenUsage.currentPeriodUsed += tokensUsed;
      user.tokenUsage.totalLifetimeUsed += tokensUsed;
      
      await user.save();

      return {
        success: true,
        tokensConsumed: tokensUsed,
        remainingTokens: Math.max(0, availability.available - tokensUsed),
        overage: availability.overage,
        newUsage: user.tokenUsage.currentPeriodUsed
      };
    } catch (error) {
      throw new Error(`Token consumption failed: ${error.message}`);
    }
  }

  async recordOverage(userId, overageTokens, charge) {
    // This would typically create an overage record and initiate billing
    console.log(`Recording overage for user ${userId}: ${overageTokens} tokens, $${charge}`);
    
    // In a real implementation, you might:
    // 1. Create an overage record in the database
    // 2. Create a Stripe invoice item
    // 3. Send notification to user
  }

  async resetMonthlyUsage(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.tokenUsage.currentPeriodUsed = 0;
      user.tokenUsage.lastResetDate = new Date();
      
      await user.save();

      return {
        success: true,
        resetDate: user.tokenUsage.lastResetDate,
        previousUsage: user.tokenUsage.currentPeriodUsed
      };
    } catch (error) {
      throw new Error(`Token reset failed: ${error.message}`);
    }
  }

  async getUsageStats(userId, period = 'current') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const tierLimit = this.tierLimits[user.subscription.tier];
      const currentUsage = user.tokenUsage.currentPeriodUsed;
      const remaining = Math.max(0, tierLimit - currentUsage);
      const usagePercentage = (currentUsage / tierLimit) * 100;

      return {
        tier: user.subscription.tier,
        limit: tierLimit,
        used: currentUsage,
        remaining,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        totalLifetime: user.tokenUsage.totalLifetimeUsed,
        lastReset: user.tokenUsage.lastResetDate,
        status: this.getUsageStatus(usagePercentage)
      };
    } catch (error) {
      throw new Error(`Usage stats retrieval failed: ${error.message}`);
    }
  }

  getUsageStatus(percentage) {
    if (percentage >= 100) return 'exceeded';
    if (percentage >= 90) return 'critical';
    if (percentage >= 75) return 'warning';
    if (percentage >= 50) return 'moderate';
    return 'low';
  }

  async estimateTokensForOperation(operationType, inputSize) {
    // Simplified token estimation - in practice, this would be more sophisticated
    const baseCosts = {
      consensus: 1000, // Base cost for consensus generation
      analysis: 500,   // Base cost for simple analysis
      summary: 200     // Base cost for summarization
    };

    const variableCost = Math.ceil(inputSize / 4); // Roughly 1 token per 4 characters
    const baseCost = baseCosts[operationType] || 100;

    return baseCost + variableCost;
  }
}

module.exports = new TokenManager(); 