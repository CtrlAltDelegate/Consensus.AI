const https = require('https');
const { URL } = require('url');

exports.handler = async (event, context) => {
  // Get the path after /api/
  const path = event.path.replace('/.netlify/functions/api', '');
  
  // Build the target URL
  const targetUrl = `https://consensusai-production-up.railway.app${path}`;
  
  console.log('Proxying request to:', targetUrl);
  console.log('Original path:', event.path);
  console.log('Method:', event.httpMethod);
  
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: event.httpMethod,
      headers: {
        ...event.headers,
        'host': url.hostname,
        'origin': 'https://consensusai.netlify.app'
      }
    };
    
    // Remove headers that shouldn't be forwarded
    delete options.headers['x-forwarded-for'];
    delete options.headers['x-forwarded-proto'];
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Content-Type': res.headers['content-type'] || 'application/json'
          },
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      console.error('Proxy error:', error);
      resolve({
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Proxy error', message: error.message })
      });
    });
    
    // Forward the request body for POST/PUT requests
    if (event.body) {
      req.write(event.body);
    }
    
    req.end();
  });
};
