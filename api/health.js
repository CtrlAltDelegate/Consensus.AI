// Simple health check endpoint
module.exports = async (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Vercel serverless function is working!',
    timestamp: new Date().toISOString(),
    environment: 'production'
  });
};