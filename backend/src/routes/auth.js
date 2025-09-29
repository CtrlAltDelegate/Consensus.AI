const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/userModel');
const SubscriptionTier = require('../models/subscriptionTiers');
const { validateUserRegistration, validateUserLogin } = require('../utils/validation');
const auth = require('../middleware/auth');
const env = require('../config/environment');

// User Registration
router.post('/register', async (req, res) => {
  try {
    console.log('📝 User registration attempt:', { email: req.body.email });
    
    // Validate request data
    const { error } = validateUserRegistration(req.body);
    if (error) {
      console.log('❌ Registration validation failed:', error.details[0].message);
      return res.status(400).json({
        error: error.details[0].message,
        field: error.details[0].path[0]
      });
    }

    const { email, password, profile = {} } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Get default subscription tier (Pay-As-You-Go)
    console.log('🔍 Looking for PayAsYouGo subscription tier...');
    const allTiers = await SubscriptionTier.find({});
    console.log('📊 Available tiers:', allTiers.map(t => ({ name: t.name, id: t._id })));
    
    const defaultTier = await SubscriptionTier.findOne({ name: 'PayAsYouGo' });
    console.log('🎯 PayAsYouGo tier found:', !!defaultTier, defaultTier?._id);
    
    if (!defaultTier) {
      console.error('❌ Default "PayAsYouGo" subscription tier not found. Please seed the database.');
      console.error('📋 Available tiers:', allTiers.map(t => t.name));
      return res.status(500).json({ 
        error: 'Server configuration error: Default subscription tier missing.',
        availableTiers: allTiers.map(t => t.name),
        debug: 'PayAsYouGo tier not found in database'
      });
    }

    // Create new user with report-based billing
    const now = new Date();
    const nextPeriodEnd = new Date(now);
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

    const user = new User({
      email: email.toLowerCase(),
      password, // Will be hashed by pre-save middleware
      profile: {
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        organization: profile.organization || ''
      },
      subscription: {
        tier: defaultTier._id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: nextPeriodEnd,
        nextBillingDate: nextPeriodEnd
      },
      reportUsage: {
        currentPeriod: {
          reportsGenerated: 0,
          periodStart: now,
          periodEnd: nextPeriodEnd
        },
        reportHistory: [],
        monthlyStats: [],
        // Legacy token fields for backward compatibility
        tokenBuckets: [],
        usageHistory: [],
        totalLifetimeUsed: 0,
        lastAllocationDate: now
      }
    });

    await user.save();
    console.log('✅ User registered successfully:', user._id);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (excluding password)
    const userData = {
      id: user._id,
      email: user.email,
      profile: user.profile,
      subscription: {
        tier: defaultTier.name,
        status: user.subscription.status,
        tokenLimit: defaultTier.tokenLimit
      },
      availableTokens: user.getAvailableTokens(),
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userData
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 User login attempt:', { email: req.body.email });
    
    // Validate request data
    const { error } = validateUserLogin(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
        field: error.details[0].path[0]
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('subscription.tier');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated. Please contact support.' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('✅ User login successful:', user._id);

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (excluding password)
    const userData = {
      id: user._id,
      email: user.email,
      profile: user.profile,
      subscription: {
        tier: user.subscription.tier.name,
        status: user.subscription.status,
        tokenLimit: user.subscription.tier.tokenLimit,
        stripeCustomerId: user.subscription.stripeCustomerId
      },
      availableTokens: user.getAvailableTokens(),
      preferences: user.preferences,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// Get Current User Profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('subscription.tier')
      .select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = {
      id: user._id,
      email: user.email,
      profile: user.profile,
      subscription: {
        tier: user.subscription.tier.name,
        status: user.subscription.status,
        tokenLimit: user.subscription.tier.tokenLimit,
        stripeCustomerId: user.subscription.stripeCustomerId,
        currentPeriodEnd: user.subscription.currentPeriodEnd
      },
      availableTokens: user.getAvailableTokens(),
      tokensExpiringSoon: user.getTokensExpiringSoon(30),
      preferences: user.preferences,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update User Profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { profile, preferences } = req.body;
    
    const updateData = {};
    if (profile) updateData.profile = profile;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('subscription.tier').select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Profile updated successfully:', user._id);

    const userData = {
      id: user._id,
      email: user.email,
      profile: user.profile,
      subscription: {
        tier: user.subscription.tier.name,
        status: user.subscription.status,
        tokenLimit: user.subscription.tier.tokenLimit
      },
      availableTokens: user.getAvailableTokens(),
      preferences: user.preferences,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userData
    });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change Password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    console.log('✅ Password changed successfully:', user._id);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', auth, async (req, res) => {
  try {
    console.log('👋 User logout:', req.user.id);
    
    // In a production app, you might want to:
    // 1. Add token to a blacklist
    // 2. Track logout events
    // 3. Clear any server-side sessions
    
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Verify Token (for frontend to check if token is still valid)
router.get('/verify', auth, async (req, res) => {
  try {
    // If we reach here, the auth middleware has validated the token
    res.json({
      success: true,
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      valid: false,
      error: 'Invalid token'
    });
  }
});

// Export User Data (GDPR/CCPA Compliance)
router.get('/export-data', auth, async (req, res) => {
  try {
    console.log(`📦 Data export requested by user: ${req.user.id}`);
    
    const dataRetentionService = require('../services/dataRetentionService');
    const exportData = await dataRetentionService.exportUserData(req.user.id);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="consensus-ai-data-export-${Date.now()}.json"`);
    
    res.json({
      success: true,
      message: 'Data export completed successfully',
      data: exportData
    });
    
  } catch (error) {
    console.error('❌ Data export error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export user data'
    });
  }
});

// Request Account Deletion (GDPR/CCPA Compliance)
router.post('/delete-account', auth, async (req, res) => {
  try {
    const { reason, confirmEmail } = req.body;
    
    // Verify email confirmation
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (confirmEmail !== user.email) {
      return res.status(400).json({
        success: false,
        error: 'Email confirmation does not match account email'
      });
    }
    
    console.log(`🗑️ Account deletion requested by user: ${user.email}`);
    
    // Mark account for deletion with 30-day grace period
    await user.markForDeletion(reason || 'user_request', 30);
    
    // Send confirmation email (optional - implement email service)
    console.log(`📧 Account deletion confirmation email should be sent to: ${user.email}`);
    console.log(`🔑 Recovery token: ${user.deletion.recoveryToken}`);
    console.log(`📅 Permanent deletion date: ${user.deletion.permanentDeletionDate}`);
    
    res.json({
      success: true,
      message: 'Account marked for deletion successfully',
      gracePeriod: {
        days: 30,
        permanentDeletionDate: user.deletion.permanentDeletionDate,
        recoveryInstructions: 'Contact support with your recovery token to restore your account within 30 days'
      }
    });
    
  } catch (error) {
    console.error('❌ Account deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process account deletion request'
    });
  }
});

// Recover Deleted Account
router.post('/recover-account', async (req, res) => {
  try {
    const { email, recoveryToken } = req.body;
    
    if (!email || !recoveryToken) {
      return res.status(400).json({
        success: false,
        error: 'Email and recovery token are required'
      });
    }
    
    // Find the deleted account
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      'deletion.isDeleted': true 
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No deleted account found with this email'
      });
    }
    
    // Attempt to recover the account
    await user.recoverAccount(recoveryToken);
    
    console.log(`✅ Account recovered successfully: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Account recovered successfully',
      user: {
        email: user.email,
        profile: user.profile,
        recoveredAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Account recovery error:', error);
    
    if (error.message.includes('Invalid recovery token')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recovery token'
      });
    }
    
    if (error.message.includes('Recovery period has expired')) {
      return res.status(400).json({
        success: false,
        error: 'Recovery period has expired. Account data has been permanently deleted.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to recover account'
    });
  }
});

// Get Account Deletion Status
router.get('/deletion-status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const deletionStatus = {
      isMarkedForDeletion: user.deletion.isDeleted,
      deletedAt: user.deletion.deletedAt,
      deletionReason: user.deletion.deletionReason,
      permanentDeletionDate: user.deletion.permanentDeletionDate,
      isRecoverable: user.isRecoverable(),
      daysUntilPermanentDeletion: user.getDaysUntilPermanentDeletion()
    };
    
    res.json({
      success: true,
      deletionStatus
    });
    
  } catch (error) {
    console.error('❌ Deletion status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deletion status'
    });
  }
});

module.exports = router;
