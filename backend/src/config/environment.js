// Environment configuration with fallbacks for Railway deployment
module.exports = {
  // Core settings
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  
  // Authentication (with fallback for Railway startup)
  JWT_SECRET: process.env.JWT_SECRET || 'railway-fallback-secret-change-in-production',
  
  // Database (optional for startup)
  MONGODB_URI: process.env.MONGODB_URI,
  
  // LLM APIs (optional)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  COHERE_API_KEY: process.env.COHERE_API_KEY,
  
  // Other services (optional)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  
  // Email (optional)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  
  // Helper functions
  isProduction: () => (process.env.NODE_ENV === 'production'),
  isDevelopment: () => (process.env.NODE_ENV === 'development'),
  hasDatabase: () => !!process.env.MONGODB_URI,
  hasLLMKeys: () => !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY),
  
  // Validation
  validateRequiredForProduction: () => {
    if (module.exports.isProduction()) {
      const required = ['JWT_SECRET', 'MONGODB_URI'];
      const missing = required.filter(key => !process.env[key]);
      if (missing.length > 0) {
        console.error(`❌ Missing required production environment variables: ${missing.join(', ')}`);
        return false;
      }
    }
    return true;
  }
};