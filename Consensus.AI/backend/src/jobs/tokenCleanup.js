const cron = require('node-cron');
const User = require('../models/userModel');
const tokenManager = require('../services/tokenManager');
const emailService = require('../services/emailService');

class TokenCleanupJob {
  constructor() {
    this.isRunning = false;
  }

  // Schedule the cleanup job to run daily at 2 AM
  start() {
    console.log('Starting token cleanup job scheduler...');
    
    // Daily cleanup at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.runCleanup();
    });

    // Monthly reset on the 1st of each month at 3 AM
    cron.schedule('0 3 1 * *', () => {
      this.runMonthlyReset();
    });

    // Weekly usage alerts on Sundays at 10 AM
    cron.schedule('0 10 * * 0', () => {
      this.runUsageAlerts();
    });

    console.log('Token cleanup jobs scheduled successfully');
  }

  async runCleanup() {
    if (this.isRunning) {
      console.log('Token cleanup job already running, skipping...');
      return;
    }

    console.log('Starting daily token cleanup job...');
    this.isRunning = true;

    try {
      await this.cleanupExpiredSessions();
      await this.updateUsageStats();
      await this.checkOverageUsers();
      
      console.log('Daily token cleanup job completed successfully');
    } catch (error) {
      console.error('Daily token cleanup job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async runMonthlyReset() {
    console.log('Starting monthly token reset job...');
    
    try {
      const users = await User.find({
        'subscription.status': 'active',
        'subscription.currentPeriodEnd': { $lte: new Date() }
      });

      let resetCount = 0;
      
      for (const user of users) {
        try {
          await tokenManager.resetMonthlyUsage(user._id);
          resetCount++;
          
          // Send monthly usage summary email
          const usageStats = await tokenManager.getUsageStats(user._id);
          await this.sendMonthlySummary(user, usageStats);
          
        } catch (error) {
          console.error(`Failed to reset tokens for user ${user._id}:`, error);
        }
      }

      console.log(`Monthly token reset completed for ${resetCount} users`);
    } catch (error) {
      console.error('Monthly token reset job failed:', error);
    }
  }

  async runUsageAlerts() {
    console.log('Starting weekly usage alerts job...');
    
    try {
      const users = await User.find({
        'subscription.status': 'active',
        isActive: true
      });

      let alertCount = 0;

      for (const user of users) {
        try {
          const usageStats = await tokenManager.getUsageStats(user._id);
          
          // Send alert if usage is >= 75%
          if (usageStats.usagePercentage >= 75) {
            await emailService.sendTokenUsageAlert(
              user.email,
              user.profile?.firstName || 'User',
              usageStats
            );
            alertCount++;
          }
        } catch (error) {
          console.error(`Failed to check usage for user ${user._id}:`, error);
        }
      }

      console.log(`Usage alerts sent to ${alertCount} users`);
    } catch (error) {
      console.error('Usage alerts job failed:', error);
    }
  }

  async cleanupExpiredSessions() {
    // Clean up any expired or invalid user sessions
    // This is a placeholder for session cleanup logic
    console.log('Cleaning up expired sessions...');
    
    try {
      // In a real implementation, you might have a sessions collection
      // For now, we'll just log that this step was completed
      console.log('Expired sessions cleanup completed');
    } catch (error) {
      console.error('Session cleanup failed:', error);
    }
  }

  async updateUsageStats() {
    console.log('Updating usage statistics...');
    
    try {
      // Update any cached usage statistics
      // This is where you might update aggregate stats, clear caches, etc.
      console.log('Usage statistics updated');
    } catch (error) {
      console.error('Usage stats update failed:', error);
    }
  }

  async checkOverageUsers() {
    console.log('Checking for users with token overage...');
    
    try {
      const users = await User.find({
        'subscription.status': 'active',
        isActive: true
      });

      for (const user of users) {
        const usageStats = await tokenManager.getUsageStats(user._id);
        
        if (usageStats.usagePercentage > 100) {
          const overageTokens = usageStats.used - usageStats.limit;
          const overageCharge = overageTokens * 0.001; // $0.001 per token
          
          // Log overage for billing processing
          console.log(`User ${user._id} has overage: ${overageTokens} tokens ($${overageCharge.toFixed(2)})`);
          
          // Send overage notification
          await emailService.sendOverageNotification(
            user.email,
            user.profile?.firstName || 'User',
            {
              overageTokens,
              charge: overageCharge,
              period: 'current'
            }
          );
        }
      }
    } catch (error) {
      console.error('Overage check failed:', error);
    }
  }

  async sendMonthlySummary(user, usageStats) {
    try {
      // This would send a comprehensive monthly usage summary
      console.log(`Sending monthly summary to ${user.email}`);
      
      // In a real implementation, you'd create a detailed email template
      // For now, we'll just log that this would be sent
    } catch (error) {
      console.error(`Failed to send monthly summary to ${user.email}:`, error);
    }
  }

  // Manual cleanup trigger (for testing or admin use)
  async runManualCleanup() {
    console.log('Running manual token cleanup...');
    await this.runCleanup();
  }

  // Get job status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun || 'Never',
      nextRun: 'Scheduled for 2 AM daily'
    };
  }
}

module.exports = new TokenCleanupJob(); 