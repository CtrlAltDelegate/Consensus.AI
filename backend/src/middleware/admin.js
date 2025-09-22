const auth = require('./auth');

// Admin middleware that requires authentication and admin role
const adminAuth = async (req, res, next) => {
  // First run the standard auth middleware
  auth(req, res, (err) => {
    if (err) {
      return next(err);
    }

    // Check if user has admin role
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied. Admin privileges required.' 
      });
    }

    next();
  });
};

// Middleware to check if current user is admin (for conditional features)
const checkAdminRole = (req, res, next) => {
  req.isAdmin = req.user && req.user.role === 'admin';
  next();
};

module.exports = {
  adminAuth,
  checkAdminRole
};
