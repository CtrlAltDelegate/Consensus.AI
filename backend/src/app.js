const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const connectDB = require('./config/database');
connectDB();

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

// Increase server timeout for long-running LLM requests (4-LLM consensus can take 60-90 seconds)
app.use((req, res, next) => {
  // Set timeout to 3 minutes for consensus generation
  if (req.path.includes('/consensus/generate')) {
    req.setTimeout(180000); // 3 minutes
    res.setTimeout(180000); // 3 minutes
  }
  next();
});



// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/consensus', require('./routes/consensus'));
app.use('/api/tokens', require('./routes/tokens'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/reports', require('./routes/reports'));
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
    message: 'Consensus.AI Backend API',
    version: require('../package.json').version,
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      consensus: '/api/consensus',
      tokens: '/api/tokens',
      billing: '/api/billing',
      webhooks: '/api/webhooks'
    }
  });
});

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