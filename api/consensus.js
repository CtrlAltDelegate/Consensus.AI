// Consensus generation endpoint for Vercel
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method === 'POST') {
    try {
      // Basic consensus response for testing
      res.status(200).json({
        status: 'success',
        message: 'Consensus endpoint is working!',
        data: {
          topic: req.body?.topic || 'test',
          consensus: 'This is a test response from Vercel',
          confidence: 0.95,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  } else {
    res.status(405).json({
      status: 'error',
      message: 'Method not allowed'
    });
  }
};