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
  'https://consensusai-production-up.railway.app',
  'http://localhost:5173',
  'http://localhost:3000'
];
console.log('🚂 Valid origins for Railway:', validOrigins);

// Ultra-permissive CORS middleware - NO CREDENTIALS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  console.log('🔍 CORS Check - Origin:', origin);
  console.log('🔍 Method:', req.method);
  console.log('🔍 Path:', req.path);
  
  // ALLOW ALL ORIGINS - NO CREDENTIALS TO AVOID WILDCARD ISSUES
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  // NO CREDENTIALS - this allows wildcard origin
  
  console.log('✅ CORS headers set - Allow all origins, no credentials');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('🟢 OPTIONS preflight handled');
    return res.sendStatus(200);
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



// Routes
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