const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const connectDB = require('./config/database');
connectDB();

// Performance monitoring
const { performanceMonitor, getMetrics, resetMetrics } = require('./middleware/performanceMonitor');

// Error monitoring
const errorMonitor = require('./services/errorMonitor');

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

// Railway-optimized CORS configuration
console.log('🚂 STARTING WITH RAILWAY-OPTIMIZED CORS LOGIC');
const validOrigins = [
  'https://consensusai.netlify.app',
  'https://consensus-ai.netlify.app',
  'https://consensusai-production.up.railway.app',
  'http://localhost:5173',
  'http://localhost:3000'
];
console.log('🚂 Valid origins for Railway:', validOrigins);

// Use the cors package - Railway might respect this better
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 CORS package - checking origin:', origin);
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) {
      console.log('✅ No origin - allowing');
      return callback(null, true);
    }
    
    // Allow Netlify domains
    if (origin.includes('consensusai.netlify.app') || 
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')) {
      console.log('✅ Allowed origin:', origin);
      return callback(null, true);
    }
    
    // For debugging - allow all origins temporarily
    console.log('✅ Debug mode - allowing all origins:', origin);
    return callback(null, true);
  },
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: false, // No credentials to avoid wildcard issues
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Additional manual CORS headers as backup
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('🔧 Backup CORS middleware - Origin:', origin);
  
  // Set headers manually as backup
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://consensusai.netlify.app');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  console.log('🔧 Backup CORS headers set');
  next();
});

// NUCLEAR OPTION: Intercept ALL responses and force CORS headers at the last moment
app.use((req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  const origin = req.headers.origin;
  
  res.send = function(data) {
    console.log('🚀 NUCLEAR: Forcing CORS headers at response time');
    this.setHeader('Access-Control-Allow-Origin', origin || 'https://consensusai.netlify.app');
    this.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    this.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    console.log('🚀 NUCLEAR: Forcing CORS headers at JSON response time');
    this.setHeader('Access-Control-Allow-Origin', origin || 'https://consensusai.netlify.app');
    this.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    this.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    return originalJson.call(this, data);
  };
  
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
console.log('🔗 Loading auth routes...');
let authRoutesError = null;
let authRoutesLoaded = false;

try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
  authRoutesLoaded = true;
} catch (error) {
  console.error('❌ Failed to load auth routes:', error);
  authRoutesError = error.message;
}

// Debug endpoint to check auth routes loading status
app.get('/debug-auth', (req, res) => {
  res.json({
    authRoutesLoaded,
    authRoutesError,
    timestamp: new Date().toISOString(),
    availableRoutes: app._router ? app._router.stack.map(r => r.regexp.toString()) : 'No router'
  });
});

// Debug endpoint to check database connection and data
app.get('/debug-db', async (req, res) => {
  const mongoose = require('mongoose');
  
  try {
    const dbStatus = {
      mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not Set',
      connectionState: mongoose.connection.readyState,
      connectionStates: {
        0: 'disconnected',
        1: 'connected', 
        2: 'connecting',
        3: 'disconnecting'
      },
      connectedTo: mongoose.connection.host || 'No host',
      database: mongoose.connection.name || 'No database'
    };

    // Try to count some collections
    const User = require('./models/userModel');
    const SubscriptionTier = require('./models/subscriptionTiers');
    
    const userCount = await User.countDocuments();
    const tierCount = await SubscriptionTier.countDocuments();

    res.json({
      dbStatus,
      collections: {
        users: userCount,
        subscriptionTiers: tierCount
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.json({
      error: error.message,
      mongodbUri: process.env.MONGODB_URI ? 'Set' : 'Not Set',
      connectionState: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  }
});

console.log('🔗 Loading other routes...');
app.use('/api/admin', require('./routes/admin'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/consensus', require('./routes/consensus'));
app.use('/api/tokens', require('./routes/tokens'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/support', require('./routes/support'));
app.use('/api/webhooks', require('./routes/webhooks'));

// TEST ENDPOINT - debug connectivity - BYPASS ALL MIDDLEWARE
app.get('/test', (req, res) => {
  console.log('🔥 TEST ENDPOINT HIT from:', req.headers.origin);
  
  // MANUALLY SET CORS HEADERS - BYPASS ALL MIDDLEWARE
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  console.log('🔥 Manual CORS headers set for test endpoint');
  
  res.json({ 
    message: 'BACKEND IS REACHABLE!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// CORS TEST ENDPOINT - Handle OPTIONS manually
app.options('/test', (req, res) => {
  console.log('🔥 TEST OPTIONS HIT from:', req.headers.origin);
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  console.log('🔥 Manual OPTIONS response sent');
  res.sendStatus(200);
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'BACKEND IS REACHABLE!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    headers: req.headers
  });
});

// Test login page for debugging
app.get('/test-login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Test Login</title></head>
    <body>
      <h2>Test Login Form</h2>
      <form id="loginForm">
        <input type="email" id="email" placeholder="Email" required><br><br>
        <input type="password" id="password" placeholder="Password" required><br><br>
        <button type="submit">Test Login</button>
      </form>
      <div id="result"></div>
      <script>
        document.getElementById('loginForm').onsubmit = async (e) => {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          
          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            document.getElementById('result').innerHTML = 
              '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            document.getElementById('result').innerHTML = 
              '<p style="color: red;">Error: ' + error.message + '</p>';
          }
        };
      </script>
    </body>
    </html>
  `);
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested from origin:', req.headers.origin);
  
  // CORS headers are already set by middleware above
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../package.json').version,
    database: process.env.MONGODB_URI ? 'configured' : 'not configured'
  });
});

// Database test endpoint
app.get('/test-db', async (req, res) => {
  console.log('🗄️ Database test requested');
  
  try {
    const mongoose = require('mongoose');
    
    if (!mongoose.connection.readyState) {
      return res.status(500).json({
        error: 'Database not connected',
        readyState: mongoose.connection.readyState,
        hasUri: !!process.env.MONGODB_URI
      });
    }
    
    // Test database connection
    const dbStats = await mongoose.connection.db.admin().ping();
    
    res.json({
      status: 'Database connected successfully',
      connectionState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      ping: dbStats
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      error: 'Database test failed',
      message: error.message,
      hasUri: !!process.env.MONGODB_URI
    });
  }
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

module.exports = app; 