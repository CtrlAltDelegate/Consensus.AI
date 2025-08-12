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
  'http://localhost:5173',
  'http://localhost:3000'
];
console.log('🚂 Valid origins for Railway:', validOrigins);

// DISABLE cors() middleware - handle manually to override Railway
console.log('🚂 DISABLING cors() middleware - handling manually');

// SIMPLE TEST: Just allow everything temporarily
app.use((req, res, next) => {
  console.log('🟢 SIMPLE CORS TEST - allowing all origins');
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    console.log('🟢 OPTIONS handled - allow all');
    return res.sendStatus(200);
  }
  
  next();
});

// FINAL NUCLEAR OPTION: Intercept ALL responses and force CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log('☢️ FINAL NUCLEAR CORS INTERCEPT for:', origin);
  
  // Override Railway proxy - set headers AFTER response
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function(data) {
    // Force CORS headers just before sending
    if (!origin || 
        origin.includes('localhost') || 
        origin.includes('consensusai.netlify.app') ||
        (origin.startsWith('https://') && origin.endsWith('--consensusai.netlify.app'))) {
      
      this.header('Access-Control-Allow-Origin', origin || '*');
      this.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
      this.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      this.header('Access-Control-Allow-Credentials', 'true');
      
      console.log('☢️ NUCLEAR CORS HEADERS INJECTED at response time for:', origin);
    }
    
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    // Force CORS headers just before sending JSON
    if (!origin || 
        origin.includes('localhost') || 
        origin.includes('consensusai.netlify.app') ||
        (origin.startsWith('https://') && origin.endsWith('--consensusai.netlify.app'))) {
      
      this.header('Access-Control-Allow-Origin', origin || '*');
      this.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
      this.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      this.header('Access-Control-Allow-Credentials', 'true');
      
      console.log('☢️ NUCLEAR CORS HEADERS INJECTED at JSON response time for:', origin);
    }
    
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

// TEST ENDPOINT - debug connectivity
app.get('/test', (req, res) => {
  console.log('🔥 TEST ENDPOINT HIT from:', req.headers.origin);
  res.header('Access-Control-Allow-Origin', '*');
  res.json({ message: 'BACKEND IS REACHABLE!', origin: req.headers.origin });
});

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