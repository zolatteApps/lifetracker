const Anthropic = require('@anthropic-ai/sdk');

module.exports = async (req, res) => {
  // Apply CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      // Check if API key exists
      const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
      const apiKeyPrefix = process.env.ANTHROPIC_API_KEY ? 
        process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...' : 
        'NOT SET';

      // Try to initialize Anthropic client
      let clientInitialized = false;
      let testResult = null;
      
      if (hasApiKey) {
        try {
          const anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
          });
          
          // Try a simple API call
          const message = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{
              role: 'user',
              content: 'Say "test"'
            }]
          });
          
          clientInitialized = true;
          testResult = 'API call successful';
        } catch (error) {
          testResult = `API call failed: ${error.message}`;
        }
      }

      return res.status(200).json({
        status: 'Test endpoint working',
        apiKeyConfigured: hasApiKey,
        apiKeyPrefix: apiKeyPrefix,
        clientInitialized: clientInitialized,
        testResult: testResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Test failed',
        message: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};