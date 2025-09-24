const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

// Sentry configuration
const initSentry = (app) => {
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️ Sentry DSN not configured - skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app }),
      // Enable profiling
      new ProfilingIntegration(),
    ],

    // Filter out health check and metrics endpoints from error tracking
    beforeSend(event) {
      if (event.request?.url?.includes('/health') || 
          event.request?.url?.includes('/metrics')) {
        return null;
      }
      return event;
    },

    // Add custom tags
    initialScope: {
      tags: {
        component: 'consensus-ai-backend',
        version: require('../../package.json').version
      }
    }
  });

  console.log('✅ Sentry initialized for error monitoring');
};

// Express middleware
const sentryMiddleware = () => {
  if (!process.env.SENTRY_DSN) {
    return [(req, res, next) => next(), (req, res, next) => next()];
  }

  return [
    // RequestHandler creates a separate execution context using domains
    Sentry.Handlers.requestHandler(),
    // TracingHandler creates a trace for every incoming request
    Sentry.Handlers.tracingHandler(),
  ];
};

// Error handler (must be before other error handlers)
const sentryErrorHandler = () => {
  if (!process.env.SENTRY_DSN) {
    return (req, res, next) => next();
  }

  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Send all errors to Sentry
      return true;
    }
  });
};

module.exports = {
  initSentry,
  sentryMiddleware,
  sentryErrorHandler,
  Sentry
};
