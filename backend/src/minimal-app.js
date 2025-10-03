// Minimal Railway test app - absolutely basic
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting minimal app...');
console.log('📊 Environment variables check:');
console.log('- PORT:', process.env.PORT || 'not set');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'not set');

// Basic CORS - allow all origins for testing
app.use(cors({
  origin: true,
  credentials: false
}));

// Basic middleware
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  console.log('📍 Root endpoint hit');
  res.json({
    status: 'MINIMAL APP WORKING',
    message: 'Railway backend is responding',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Health check
app.get('/health', (req, res) => {
  console.log('🏥 Health check hit');
  res.json({ status: 'OK', message: 'Minimal app healthy' });
});

// Environment check
app.get('/env-check', (req, res) => {
  console.log('🔍 Environment check hit');
  res.json({
    status: 'Environment Check - Minimal App',
    variables: {
      PORT: process.env.PORT || 'not_set',
      NODE_ENV: process.env.NODE_ENV || 'not_set',
      FRONTEND_URL: !!process.env.FRONTEND_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      MONGODB_URI: !!process.env.MONGODB_URI,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY
    },
    message: 'All environment variables visible'
  });
});

// Test API endpoint
app.get('/api/test', (req, res) => {
  console.log('🧪 Test API hit');
  res.json({
    success: true,
    message: 'API endpoint working',
    cors: 'enabled',
    timestamp: new Date().toISOString()
  });
});

// Start server
try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ MINIMAL SERVER RUNNING ON PORT ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🔍 Env Check: http://localhost:${PORT}/env-check`);
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error);
  });

} catch (error) {
  console.error('❌ Failed to start minimal server:', error);
  process.exit(1);
}

module.exports = app;
