// Vercel serverless function that handles all routes
const app = require('../backend/src/app');

// Export as a serverless function handler
module.exports = async (req, res) => {
  // Let Express handle the request
  return app(req, res);
};