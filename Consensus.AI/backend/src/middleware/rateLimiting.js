const rateLimit = require('express-rate-limit');

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 'Check the Retry-After header for when you can make requests again.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for resource-intensive operations
const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 requests per 5 minutes
  message: {
    error: 'Too many resource-intensive requests from this IP, please try again later.',
    retryAfter: 'Please wait before making more requests.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiting for consensus generation
const consensusLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit each IP to 5 consensus requests per 10 minutes
  message: {
    error: 'Too many consensus generation requests. Please wait before generating another consensus.',
    retryAfter: 'Consensus generation is limited to prevent abuse.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limiting (for login attempts)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per 15 minutes
  message: {
    error: 'Too many login attempts from this IP, please try again later.',
    retryAfter: 'Account security measure - please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Webhook rate limiting
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Allow more webhook requests as they come from trusted sources
  message: {
    error: 'Too many webhook requests',
    retryAfter: 'Webhook rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// User-specific rate limiting based on subscription tier
const createUserBasedLimiter = (getUserTier) => {
  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: (req) => {
      const tier = getUserTier(req);
      switch (tier) {
        case 'enterprise':
          return 1000; // 1000 requests per hour
        case 'pro':
          return 500;  // 500 requests per hour
        case 'basic':
        default:
          return 100;  // 100 requests per hour
      }
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise fall back to IP
      return req.user?.id || req.ip;
    },
    message: (req) => {
      const tier = getUserTier(req);
      return {
        error: `Rate limit exceeded for ${tier} tier`,
        message: 'Consider upgrading your subscription for higher rate limits'
      };
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Helper function to get user tier from request
const getUserTierFromRequest = (req) => {
  return req.user?.subscription?.tier || 'basic';
};

// Create user-based limiter instance
const userBasedLimiter = createUserBasedLimiter(getUserTierFromRequest);

module.exports = {
  generalLimiter,
  strictLimiter,
  consensusLimiter,
  authLimiter,
  webhookLimiter,
  userBasedLimiter,
  createUserBasedLimiter
}; 