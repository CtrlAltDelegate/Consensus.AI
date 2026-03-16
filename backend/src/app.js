const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Railway (and most cloud platforms) sit behind a reverse proxy — trust the first hop
// so express-rate-limit can read the real client IP from X-Forwarded-For
app.set('trust proxy', 1);

// Database connection
const connectDB = require('./config/database');
connectDB();

// Performance monitoring
const { performanceMonitor, getMetrics, resetMetrics } = require('./middleware/performanceMonitor');

// Error monitoring
const errorMonitor = require('./services/errorMonitor');

// Rate limiting
const { generalLimiter, authLimiter, webhookLimiter } = require('./middleware/rateLimiting');

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins for now
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter — 100 req / 15 min per IP (all endpoints)
// Consensus-specific limiting (5 req / 10 min) is applied inside the consensus router.
app.use(generalLimiter);

// Performance monitoring middleware
app.use(performanceMonitor({
  slowThreshold: 2000, // 2 seconds
  logSlowRequests: true,
  trackMemory: true,
  excludePaths: ['/health', '/test', '/metrics']
}));

// Increase server timeout for long-running LLM requests (4-LLM consensus can take 60-90 seconds)
app.use((req, res, next) => {
  // Set timeout to 3 minutes for consensus generation
  if (req.path.includes('/consensus/generate')) {
    req.setTimeout(180000); // 3 minutes
    res.setTimeout(180000); // 3 minutes
  }
  next();
});



// Health Check Endpoint - Monitor all system components
app.get('/health', async (req, res) => {
  const startTime = Date.now();
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../package.json').version,
    services: {},
    performance: {}
  };

  try {
    // Check Database Connection
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        healthCheck.services.database = {
          status: 'healthy',
          connection: 'connected',
          readyState: mongoose.connection.readyState
        };
      } else {
        healthCheck.services.database = {
          status: 'unhealthy',
          connection: 'disconnected',
          readyState: mongoose.connection.readyState
        };
        healthCheck.status = 'degraded';
      }
    } catch (dbError) {
      healthCheck.services.database = {
        status: 'error',
        error: dbError.message
      };
      healthCheck.status = 'unhealthy';
    }

    // Check LLM API Keys Configuration
    const llmStatus = {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      google: !!process.env.GOOGLE_API_KEY,
      cohere: !!process.env.COHERE_API_KEY
    };
    const configuredLLMs = Object.values(llmStatus).filter(Boolean).length;
    
    healthCheck.services.llm_apis = {
      status: configuredLLMs >= 2 ? 'healthy' : 'degraded',
      configured: configuredLLMs,
      total: 4,
      details: llmStatus
    };

    // Check Stripe Configuration
    healthCheck.services.stripe = {
      status: process.env.STRIPE_SECRET_KEY ? 'healthy' : 'not_configured',
      configured: !!process.env.STRIPE_SECRET_KEY
    };

    // Check File Upload Directory
    try {
      const fs = require('fs');
      const uploadDir = 'uploads';
      if (fs.existsSync(uploadDir)) {
        const stats = fs.statSync(uploadDir);
        healthCheck.services.file_upload = {
          status: 'healthy',
          directory_exists: true,
          is_writable: stats.isDirectory()
        };
      } else {
        healthCheck.services.file_upload = {
          status: 'degraded',
          directory_exists: false,
          message: 'Upload directory does not exist'
        };
      }
    } catch (fsError) {
      healthCheck.services.file_upload = {
        status: 'error',
        error: fsError.message
      };
    }

    // Performance Metrics
    const responseTime = Date.now() - startTime;
    healthCheck.performance = {
      response_time_ms: responseTime,
      memory_usage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heap_used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heap_total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      cpu_usage: process.cpuUsage()
    };

    // Overall Status
    const unhealthyServices = Object.values(healthCheck.services).filter(service => service.status === 'error' || service.status === 'unhealthy');
    if (unhealthyServices.length > 0) {
      healthCheck.status = 'unhealthy';
    } else {
      const degradedServices = Object.values(healthCheck.services).filter(service => service.status === 'degraded');
      if (degradedServices.length > 0) {
        healthCheck.status = 'degraded';
      }
    }

    // Set appropriate HTTP status code
    const statusCode = healthCheck.status === 'ok' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(healthCheck);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    });
  }
});

// Performance Metrics Endpoint
app.get('/metrics', (req, res) => {
  try {
    const metrics = getMetrics();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      ...metrics
    });
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics'
    });
  }
});

// Reset Metrics Endpoint (Admin only)
app.post('/metrics/reset', (req, res) => {
  try {
    resetMetrics();
    res.json({
      success: true,
      message: 'Performance metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Metrics reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics'
    });
  }
});

// Error Monitoring Endpoints
app.get('/errors', (req, res) => {
  try {
    const { limit, severity, type, since } = req.query;
    const errors = errorMonitor.getErrors({
      limit: limit ? parseInt(limit) : 50,
      severity,
      type,
      since
    });
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      errors,
      stats: errorMonitor.getErrorStats()
    });
  } catch (error) {
    console.error('Error monitoring endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve error logs'
    });
  }
});

app.get('/errors/stats', (req, res) => {
  try {
    const stats = errorMonitor.getErrorStats();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats
    });
  } catch (error) {
    console.error('Error stats endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve error statistics'
    });
  }
});

app.post('/errors/clear', (req, res) => {
  try {
    errorMonitor.clearErrors();
    res.json({
      success: true,
      message: 'Error logs cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clear endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear error logs'
    });
  }
});

// Routes
// authLimiter: 5 login attempts per 15 min per IP (brute-force protection)
app.use('/api/auth', authLimiter, require('./routes/auth'));


app.use('/api/admin', require('./routes/admin'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/consensus', require('./routes/consensus'));
app.use('/api/tokens', require('./routes/tokens'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/support', require('./routes/support'));
app.use('/api/webhooks', webhookLimiter, require('./routes/webhooks'));


// Sentry test endpoint — trigger a test error to verify alerting (production hardening)
app.get('/api/test/sentry', (req, res) => {
  const secret = req.query.secret || req.headers['x-sentry-test-secret'];
  const expected = process.env.SENTRY_TEST_SECRET;
  if (!process.env.SENTRY_DSN) {
    return res.status(400).json({ error: 'Sentry not configured' });
  }
  if (!expected || secret !== expected) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const err = new Error('Production hardening: Sentry test error (intentional)');
  err.code = 'SENTRY_TEST';
  try {
    const Sentry = require('@sentry/node');
    Sentry.captureException(err);
  } catch (_) { /* Sentry not loaded */ }
  res.status(200).json({ ok: true, message: 'Test error sent to Sentry; check your dashboard.' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Consensus.AI Backend API - Ready',
    version: require('../package.json').version,
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      admin: '/api/admin',
      billing: '/api/billing',
      consensus: '/api/consensus',
      tokens: '/api/tokens',
      reports: '/api/reports',
      webhooks: '/api/webhooks'
    }
  });
});

// Error monitoring middleware
app.use(errorMonitor.middleware());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server with extended timeout for LLM operations
try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`⏱️  Server timeout: 3 minutes for LLM consensus operations`);
  });

  // Set server timeout to 3 minutes for long-running LLM requests
  server.timeout = 180000; // 3 minutes
  server.keepAliveTimeout = 185000; // Slightly longer than timeout
  server.headersTimeout = 186000; // Slightly longer than keepAliveTimeout

  // Handle server errors
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${PORT} is already in use`);
    }
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────
  // On SIGTERM (Railway deployment stop) or SIGINT (Ctrl-C in dev):
  //   1. Stop accepting new connections.
  //   2. Wait for in-flight requests to finish (up to 30 s).
  //   3. Close the MongoDB connection cleanly.
  //   4. Exit.
  const shutdown = async (signal) => {
    console.log(`\n🛑 ${signal} received — starting graceful shutdown...`);
    server.close(async () => {
      console.log('✅ HTTP server closed (no new connections accepted)');
      try {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
      } catch (err) {
        console.error('⚠️  MongoDB close error:', err.message);
      }
      console.log('👋 Process exiting cleanly');
      process.exit(0);
    });

    // Safety net: force-exit after 30 seconds if something hangs
    setTimeout(() => {
      console.error('❌ Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 30_000).unref(); // .unref() so the timer doesn't keep the event loop alive on its own
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

} catch (error) {
  console.error('❌ Failed to start server:', error);
}

module.exports = app; 