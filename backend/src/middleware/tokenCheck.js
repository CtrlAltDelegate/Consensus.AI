const tokenManager = require('../services/tokenManager');
const env = require('../config/environment');

const tokenCheck = (requiredTokens = 0) => {
  return async (req, res, next) => {
    try {
      // Skip token check if no database configured
      if (!env.hasDatabase()) {
        console.warn('⚠️  No database configured - skipping token check');
        return next();
      }

      // If no specific token requirement, just check if user has any tokens left
      let tokensToCheck = requiredTokens;
      
      // If no tokens specified, estimate based on request body size
      if (tokensToCheck === 0 && req.body) {
        const bodySize = JSON.stringify(req.body).length;
        tokensToCheck = await tokenManager.estimateTokensForOperation('analysis', bodySize);
      }

      const availability = await tokenManager.checkTokenAvailability(req.user.id, tokensToCheck);
      
      // Allow request if sufficient tokens or if overage is within acceptable limits
      if (availability.sufficient || availability.overage <= tokensToCheck * 0.2) {
        req.tokenEstimate = {
          estimated: tokensToCheck,
          available: availability.available,
          sufficient: availability.sufficient,
          overage: availability.overage
        };
        return next();
      }

      // Block request if significant overage would occur
      return res.status(402).json({
        error: 'Insufficient tokens for this operation',
        required: tokensToCheck,
        available: availability.available,
        overage: availability.overage,
        message: 'Please upgrade your subscription or wait for your next billing cycle'
      });

    } catch (error) {
      console.error('Token check middleware error:', error);
      res.status(500).json({ error: 'Token verification failed' });
    }
  };
};

// Specific middleware for high-cost operations
const tokenCheck_strict = (requiredTokens) => {
  return async (req, res, next) => {
    try {
      const availability = await tokenManager.checkTokenAvailability(req.user.id, requiredTokens);
      
      if (!availability.sufficient) {
        return res.status(402).json({
          error: 'Insufficient tokens for this operation',
          required: requiredTokens,
          available: availability.available,
          overage: availability.overage,
          message: 'This operation requires more tokens than you have available'
        });
      }

      req.tokenEstimate = {
        estimated: requiredTokens,
        available: availability.available,
        sufficient: true,
        overage: 0
      };
      
      next();
    } catch (error) {
      console.error('Strict token check middleware error:', error);
      res.status(500).json({ error: 'Token verification failed' });
    }
  };
};

module.exports = {
  tokenCheck,
  tokenCheck_strict
}; 