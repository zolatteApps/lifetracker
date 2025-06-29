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
        const { goalText, suggestedCategory } = req.body;

        if (!goalText || typeof goalText !== 'string') {
          return res.status(400).json({ error: 'Goal text is required' });
        }

        // Check if API key is configured
        if (!process.env.ANTHROPIC_API_KEY) {
          console.error('ANTHROPIC_API_KEY is not configured');
          return res.status(500).json({ error: 'AI service not configured. Please contact support.' });
        }

        // Call Claude API to analyze the goal comprehensively
        const message = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          temperature: 0,
          system: "You are a goal analysis assistant. Analyze goals and provide structured information to help users track their progress.",
          messages: [{
            role: 'user',
            content: `Analyze this goal and provide structured information: "${goalText}"
${suggestedCategory ? `The user has suggested this might be a "${suggestedCategory}" goal. Use this as a strong hint but override if the goal clearly belongs to a different category.` : ''}

Provide a JSON response with the following fields:
{
  "category": "physical" | "mental" | "financial" | "social",
  "title": "short concise title (max 50 chars)",
  "description": "detailed description of the goal",
  "type": "milestone" | "numeric" | "habit",
  "priority": "high" | "medium" | "low",
  "targetValue": number or null,
  "unit": "string describing the unit" or "",
  "suggestedDueDate": number of days from now or null,
  "proposedSchedule": {
    "summary": "brief description of the schedule",
    "explanation": "why this schedule makes sense",
    "sessions": [
      {
        "activity": "activity name",
        "frequency": "daily" | "weekly" | "monthly",
        "daysPerWeek": number,
        "time": "HH:MM",
        "duration": minutes as number,
        "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] or specific days,
        "totalOccurrences": number
      }
    ]
  }
}

Categories:
- physical: Exercise, fitness, health, sports, diet, sleep
- mental: Learning, education, skills, mindfulness, meditation, personal growth
- financial: Money, savings, investments, budgeting, income, expenses
- social: Relationships, family, friends, networking, community, communication

Types:
- milestone: One-time achievement (e.g., "Complete a marathon")
- numeric: Measurable target (e.g., "Lose 20 pounds", "Save $5000")
- habit: Recurring activity (e.g., "Exercise daily", "Read 2 books monthly")

For habits, set targetValue to days per month (e.g., 30 for daily, 4 for weekly).
For numeric goals, extract the number from the goal.
For milestones, set targetValue to null.

Examples:
"Run 5k every morning" → habit, targetValue: 30, unit: "days"
"Save $5000" → numeric, targetValue: 5000, unit: "dollars"
"Learn Spanish" → milestone, targetValue: null, unit: ""

Schedule Creation Guidelines:
- For "morning" activities: schedule between 6:00-8:00
- For "evening" activities: schedule between 18:00-20:00
- For "daily" habits: include all 7 days
- For fitness goals: suggest 3-5 days per week with rest days
- For learning goals: suggest consistent daily sessions of 30-60 minutes
- For financial goals: suggest weekly/monthly check-ins
- Consider work hours (9:00-17:00) when scheduling
- Be specific about times and duration

Example schedule for "Run 5k every morning":
{
  "proposedSchedule": {
    "summary": "Daily morning 5K runs for 30 days",
    "explanation": "Morning runs at 6 AM help build consistency and start the day with energy. Daily practice develops a strong habit.",
    "sessions": [{
      "activity": "5K Morning Run",
      "frequency": "daily",
      "daysPerWeek": 7,
      "time": "06:00",
      "duration": 60,
      "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      "totalOccurrences": 30
    }]
  }
}

Respond with only valid JSON.`
          }]
        });

        const aiResponse = message.content[0].text.trim();
        console.log('AI response:', aiResponse);
        
        let goalDetails;
        try {
          goalDetails = JSON.parse(aiResponse);
        } catch (parseError) {
          console.error('Failed to parse AI response:', aiResponse);
          return res.status(500).json({ error: 'Failed to parse AI response' });
        }

        // Validate the response
        const validCategories = ['physical', 'mental', 'financial', 'social'];
        const validTypes = ['milestone', 'numeric', 'habit'];
        const validPriorities = ['high', 'medium', 'low'];

        if (!validCategories.includes(goalDetails.category)) {
          return res.status(500).json({ error: 'Invalid category returned by AI' });
        }

        if (!validTypes.includes(goalDetails.type)) {
          goalDetails.type = 'milestone'; // Default fallback
        }

        if (!validPriorities.includes(goalDetails.priority)) {
          goalDetails.priority = 'medium'; // Default fallback
        }

        // Calculate due date if suggested
        if (goalDetails.suggestedDueDate && typeof goalDetails.suggestedDueDate === 'number') {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + goalDetails.suggestedDueDate);
          goalDetails.dueDate = dueDate.toISOString();
        } else {
          goalDetails.dueDate = null;
        }

        // Clean up the response
        delete goalDetails.suggestedDueDate;
        
        // Ensure numeric values
        if (goalDetails.targetValue !== null) {
          goalDetails.targetValue = Number(goalDetails.targetValue) || 0;
        }

        return res.status(200).json({ 
          ...goalDetails,
          currentValue: 0,
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