const User = require('../models/userModel');
const Report = require('../models/reportModel');
const mongoose = require('mongoose');

class DataRetentionService {
  constructor() {
    this.retentionPolicies = {
      // User account data - retained while account is active
      userAccounts: {
        retentionPeriod: null, // Indefinite while active
        description: 'User account data retained while account is active'
      },
      
      // Reports - configurable retention
      reports: {
        retentionPeriod: null, // Indefinite by default, user can configure
        description: 'User reports stored until manually deleted or account closure'
      },
      
      // Usage logs and analytics
      usageLogs: {
        retentionPeriod: 365, // 12 months
        description: 'Usage logs and performance metrics'
      },
      
      // Error logs
      errorLogs: {
        retentionPeriod: 90, // 3 months
        description: 'Error logs and debugging information'
      },
      
      // Session data
      sessionData: {
        retentionPeriod: 30, // 30 days
        description: 'Authentication sessions and temporary data'
      },
      
      // Deleted account data
      deletedAccounts: {
        retentionPeriod: 30, // 30 days for recovery
        description: 'Soft-deleted account data for recovery period'
      }
    };
  }

  /**
   * Get data retention policies
   */
  getRetentionPolicies() {
    return this.retentionPolicies;
  }

  /**
   * Clean up expired data based on retention policies
   */
  async performDataCleanup() {
    console.log('🧹 Starting data retention cleanup...');
    const results = {
      timestamp: new Date().toISOString(),
      cleanupResults: {}
    };

    try {
      // Clean up old usage logs (if we had a usage logs collection)
      results.cleanupResults.usageLogs = await this.cleanupUsageLogs();
      
      // Clean up old error logs (if we had an error logs collection)
      results.cleanupResults.errorLogs = await this.cleanupErrorLogs();
      
      // Clean up expired sessions (if we had a sessions collection)
      results.cleanupResults.sessions = await this.cleanupExpiredSessions();
      
      // Clean up permanently deleted accounts
      results.cleanupResults.deletedAccounts = await this.cleanupDeletedAccounts();
      
      // Clean up orphaned reports (reports without valid users)
      results.cleanupResults.orphanedReports = await this.cleanupOrphanedReports();

      console.log('✅ Data retention cleanup completed:', results);
      return results;

    } catch (error) {
      console.error('❌ Data retention cleanup failed:', error);
      results.error = error.message;
      return results;
    }
  }

  /**
   * Clean up old usage logs (placeholder - implement when usage logs collection exists)
   */
  async cleanupUsageLogs() {
    // Placeholder for usage logs cleanup
    // In a real implementation, you would have a UsageLog model
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.usageLogs.retentionPeriod);
    
    console.log(`🗑️ Cleaning usage logs older than ${cutoffDate.toISOString()}`);
    
    // Example: await UsageLog.deleteMany({ createdAt: { $lt: cutoffDate } });
    return {
      deleted: 0,
      cutoffDate: cutoffDate.toISOString(),
      message: 'Usage logs cleanup - no collection implemented yet'
    };
  }

  /**
   * Clean up old error logs (placeholder - implement when error logs collection exists)
   */
  async cleanupErrorLogs() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.errorLogs.retentionPeriod);
    
    console.log(`🗑️ Cleaning error logs older than ${cutoffDate.toISOString()}`);
    
    // Example: await ErrorLog.deleteMany({ createdAt: { $lt: cutoffDate } });
    return {
      deleted: 0,
      cutoffDate: cutoffDate.toISOString(),
      message: 'Error logs cleanup - no collection implemented yet'
    };
  }

  /**
   * Clean up expired sessions (placeholder - implement when sessions collection exists)
   */
  async cleanupExpiredSessions() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.sessionData.retentionPeriod);
    
    console.log(`🗑️ Cleaning expired sessions older than ${cutoffDate.toISOString()}`);
    
    // Example: await Session.deleteMany({ lastAccessed: { $lt: cutoffDate } });
    return {
      deleted: 0,
      cutoffDate: cutoffDate.toISOString(),
      message: 'Session cleanup - using JWT tokens, no persistent sessions'
    };
  }

  /**
   * Clean up permanently deleted accounts
   */
  async cleanupDeletedAccounts() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicies.deletedAccounts.retentionPeriod);
    
    console.log(`🗑️ Permanently deleting accounts marked for deletion before ${cutoffDate.toISOString()}`);
    
    try {
      // Find accounts marked for deletion that are past the recovery period
      const accountsToDelete = await User.find({
        'deletion.isDeleted': true,
        'deletion.deletedAt': { $lt: cutoffDate }
      });

      let permanentlyDeleted = 0;
      
      for (const user of accountsToDelete) {
        // Delete all reports for this user
        await Report.deleteMany({ userId: user._id });
        
        // Permanently delete the user account
        await User.deleteOne({ _id: user._id });
        
        permanentlyDeleted++;
        console.log(`🗑️ Permanently deleted account: ${user.email}`);
      }

      return {
        deleted: permanentlyDeleted,
        cutoffDate: cutoffDate.toISOString(),
        message: `Permanently deleted ${permanentlyDeleted} accounts past recovery period`
      };

    } catch (error) {
      console.error('❌ Error cleaning up deleted accounts:', error);
      return {
        deleted: 0,
        error: error.message
      };
    }
  }

  /**
   * Clean up orphaned reports (reports without valid users)
   */
  async cleanupOrphanedReports() {
    console.log('🗑️ Cleaning up orphaned reports...');
    
    try {
      // Find reports where the user no longer exists
      const orphanedReports = await Report.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $match: {
            user: { $size: 0 } // No matching user found
          }
        }
      ]);

      let deletedCount = 0;
      
      for (const report of orphanedReports) {
        await Report.deleteOne({ _id: report._id });
        deletedCount++;
      }

      return {
        deleted: deletedCount,
        message: `Cleaned up ${deletedCount} orphaned reports`
      };

    } catch (error) {
      console.error('❌ Error cleaning up orphaned reports:', error);
      return {
        deleted: 0,
        error: error.message
      };
    }
  }

  /**
   * Get data retention statistics
   */
  async getRetentionStats() {
    try {
      const stats = {
        timestamp: new Date().toISOString(),
        policies: this.retentionPolicies,
        currentData: {}
      };

      // Count current data
      stats.currentData.totalUsers = await User.countDocuments({ 'deletion.isDeleted': { $ne: true } });
      stats.currentData.deletedUsers = await User.countDocuments({ 'deletion.isDeleted': true });
      stats.currentData.totalReports = await Report.countDocuments();
      
      // Calculate data ages
      const oldestUser = await User.findOne({}, {}, { sort: { createdAt: 1 } });
      const oldestReport = await Report.findOne({}, {}, { sort: { createdAt: 1 } });
      
      if (oldestUser) {
        stats.currentData.oldestUserAge = Math.floor((Date.now() - oldestUser.createdAt) / (1000 * 60 * 60 * 24));
      }
      
      if (oldestReport) {
        stats.currentData.oldestReportAge = Math.floor((Date.now() - oldestReport.createdAt) / (1000 * 60 * 60 * 24));
      }

      return stats;

    } catch (error) {
      console.error('❌ Error getting retention stats:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Schedule automatic data cleanup (to be called by a cron job)
   */
  async scheduleCleanup() {
    console.log('📅 Scheduling automatic data retention cleanup...');
    
    // In a production environment, you would set up a cron job or scheduled task
    // For now, we'll just log that this should be implemented
    
    const schedule = {
      daily: 'Clean up expired sessions and temporary data',
      weekly: 'Clean up old logs and orphaned data',
      monthly: 'Comprehensive data retention review'
    };

    console.log('📅 Recommended cleanup schedule:', schedule);
    
    return {
      message: 'Data retention cleanup should be scheduled as a cron job',
      recommendedSchedule: schedule,
      implementation: 'Use node-cron or system cron to run performDataCleanup() regularly'
    };
  }

  /**
   * Export user data for GDPR/CCPA compliance
   */
  async exportUserData(userId) {
    try {
      console.log(`📦 Exporting data for user: ${userId}`);
      
      // Get user data
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's reports
      const reports = await Report.find({ userId }).select('-__v');

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile,
          subscription: user.subscription,
          reportUsage: user.reportUsage,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        reports: reports.map(report => ({
          id: report._id,
          title: report.title,
          topic: report.topic,
          consensus: report.consensus,
          confidence: report.confidence,
          metadata: report.metadata,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt
        })),
        summary: {
          totalReports: reports.length,
          accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)),
          dataSize: JSON.stringify({ user, reports }).length
        }
      };

      return exportData;

    } catch (error) {
      console.error('❌ Error exporting user data:', error);
      throw error;
    }
  }
}

module.exports = new DataRetentionService();
