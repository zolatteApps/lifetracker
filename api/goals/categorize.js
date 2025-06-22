const connectDB = require('../lib/mongodb');
const { verifyToken } = require('../lib/auth-middleware');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

module.exports = async (req, res) => {
  await connectDB();

  // Apply CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    return verifyToken(async (req, res) => {
      try {
        console.log('Categorize request received:', req.body);
        const { goalText } = req.body;

        if (!goalText || typeof goalText !== 'string') {
          return res.status(400).json({ error: 'Goal text is required' });
        }

        // Check if API key is configured
        if (!process.env.ANTHROPIC_API_KEY) {
          console.error('ANTHROPIC_API_KEY is not configured');
          return res.status(500).json({ error: 'AI service not configured. Please contact support.' });
        }

        // Call Claude API to categorize the goal
        const message = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 100,
          temperature: 0,
          system: "You are a goal categorization assistant. Categorize goals into exactly one of these categories: physical, mental, financial, or social. Respond with only the category name in lowercase.",
          messages: [{
            role: 'user',
            content: `Categorize this goal: "${goalText}"

Categories:
- physical: Exercise, fitness, health, sports, diet, sleep
- mental: Learning, education, skills, mindfulness, meditation, personal growth
- financial: Money, savings, investments, budgeting, income, expenses
- social: Relationships, family, friends, networking, community, communication

Respond with only one word: the category name in lowercase.`
          }]
        });

        const category = message.content[0].text.trim().toLowerCase();
        console.log('AI response:', message.content[0].text);
        console.log('Parsed category:', category);
        
        // Validate the category
        const validCategories = ['physical', 'mental', 'financial', 'social'];
        if (!validCategories.includes(category)) {
          return res.status(500).json({ error: 'Invalid category returned by AI' });
        }

        return res.status(200).json({ 
          category,
          goalText 
        });

      } catch (error) {
        console.error('Error categorizing goal:', error);
        
        // More detailed error response for debugging
        if (error.message && error.message.includes('API key')) {
          return res.status(500).json({ error: 'API key not configured or invalid' });
        }
        
        return res.status(500).json({ 
          error: 'Failed to categorize goal',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    })(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};