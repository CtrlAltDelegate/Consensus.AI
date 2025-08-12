// Vercel serverless function entry point
const app = require('../backend/src/app');

// Export handler for Vercel
module.exports = (req, res) => {
  return app(req, res);
};