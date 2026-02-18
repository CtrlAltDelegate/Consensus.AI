const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const env = require('../config/environment');

const auth = async (req, res, next) => {
  try {
    // Skip database-dependent auth if no database configured
    if (!env.hasDatabase()) {
      console.warn('⚠️  No database configured - using demo authentication');
      req.user = { 
        id: 'demo-user-id', 
        userId: 'demo-user-id', 
        email: 'demo@example.com',
        isDemo: true
      };
      return next();
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Handle demo user tokens (no per-request log to avoid log spam)
    if (decoded.isDemo && decoded.userId === 'demo-user-id') {
      req.user = {
        _id: 'demo-user-id',
        id: 'demo-user-id',
        userId: 'demo-user-id',
        email: 'test@onboarding.demo',
        isDemo: true,
        subscription: {
          tier: { name: 'PayAsYouGo' },
          status: 'active'
        }
      };
      return next();
    }
    
    const user = await User.findById(decoded.userId || decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated.' });
    }

    // Set user and ensure id/userId for route compatibility (consensus, reports, etc.)
    req.user = user;
    req.user.userId = user._id;
    req.user.id = user._id.toString ? user._id.toString() : user._id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed.' });
  }
};

module.exports = auth; 