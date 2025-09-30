const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const env = require('../config/environment');

const auth = async (req, res, next) => {
  try {
    // Skip database-dependent auth if no database configured
    if (!env.hasDatabase()) {
      console.warn('⚠️  No database configured - using demo authentication');
      req.user = { 
        id: 'demo-user', 
        userId: 'demo-user', 
        email: 'demo@example.com' 
      };
      return next();
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated.' });
    }

    // Set both user object and userId for compatibility
    req.user = user;
    req.user.userId = user._id;
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