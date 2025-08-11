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

// Vercel-optimized CORS configuration
console.log('🚀 STARTING WITH VERCEL-OPTIMIZED CORS LOGIC');
const validOrigins = [
  'https://consensusai.netlify.app',
  'https://consensus-ai.netlify.app', 
  'http://localhost:5173',
  'http://localhost:3000'
];
console.log('🚀 Valid origins for Vercel:', validOrigins);

app.use(cors({
  origin: function (origin, callback) {
    console.log('🔍 Fresh CORS check for:', origin);
    
    // No origin = allow (mobile apps, curl, etc.)
    if (!origin) {
      console.log('✅ No origin - allowed');
      return callback(null, true);
    }
    
    // Localhost = allow for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      console.log('✅ Localhost - allowed');
      return callback(null, true);
    }
    
    // Check against valid origins list
    if (validOrigins.includes(origin)) {
      console.log('✅ Valid origin - allowed');
      return callback(null, true);
    }
    
    // Netlify branch deployments (format: https://branch--consensusai.netlify.app)
    if (origin.startsWith('https://') && origin.endsWith('--consensusai.netlify.app')) {
      console.log('✅ Netlify branch - allowed');
      return callback(null, true);
    }
    
    // Block everything else
    console.log('❌ Origin blocked:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Explicit preflight handler - TEMPORARY ALLOW ALL
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('OPTIONS preflight request from origin:', origin);
  
  // Check if origin is allowed
  if (!origin || origin.includes('consensusai.netlify.app') || origin.includes('localhost')) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
    console.log('OPTIONS preflight approved for origin:', origin);
    res.sendStatus(200);
  } else {
    console.log('OPTIONS preflight blocked for origin:', origin);
    res.sendStatus(403);
  }
});

// NUCLEAR: Explicit CORS headers middleware to override Railway proxy  
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('🚀 NUCLEAR CORS MIDDLEWARE RUNNING for:', origin);
  
  // Set CORS headers on every response
  if (!origin || 
      origin.includes('localhost') || 
      origin.includes('consensusai.netlify.app') ||
      (origin.startsWith('https://') && origin.endsWith('--consensusai.netlify.app'))) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    console.log('🚀 NUCLEAR CORS HEADERS SET for:', origin);
  }
  
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

// Railway-specific CORS headers (override proxy interference) - DEBUG VERSION
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('🔍 CORS middleware check for origin:', origin);
  console.log('🔍 allowedOrigins array:', allowedOrigins);
  console.log('🔍 origin in allowedOrigins?', allowedOrigins.includes(origin));
  console.log('🔍 origin type:', typeof origin);
  console.log('🔍 origin length:', origin ? origin.length : 'null');
  
  // Set CORS headers for allowed origins
  if (!origin || origin.includes('consensusai.netlify.app') || origin.includes('localhost')) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    console.log('✅ CORS headers set for origin:', origin || 'no-origin');
  } else {
    console.log('❌ CORS blocked for origin:', origin);
  }
  next();
});

// Routes
app.use('/api/consensus', require('./routes/consensus'));
app.use('/api/tokens', require('./routes/tokens'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/webhooks', require('./routes/webhooks'));

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested from origin:', req.headers.origin);
  
  // Manually set CORS headers for testing
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  console.log('🏥 CORS headers manually set for origin:', origin);
  
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../package.json').version
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Consensus.AI Backend API',
    version: require('../package.json').version,
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
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