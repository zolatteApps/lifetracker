// Test script for AI goal categorization
// Run with: node test-ai-categorization.js

const testGoals = [
  // Physical goals
  "Run 5k every morning",
  "Lose 10 pounds in 3 months",
  "Do 50 push-ups daily",
  "Complete a marathon",
  "Gym 4 times a week",
  
  // Mental goals
  "Read 2 books per month",
  "Learn Spanish",
  "Meditate for 20 minutes daily",
  "Complete online course on machine learning",
  "Practice mindfulness",
  
  // Financial goals
  "Save $5000 for emergency fund",
  "Invest $500 monthly",
  "Pay off credit card debt",
  "Increase income by 20%",
  "Budget monthly expenses",
  
  // Social goals
  "Call mom weekly",
  "Make 3 new friends",
  "Volunteer at local shelter monthly",
  "Organize team building event",
  "Join a networking group"
];

console.log("AI Goal Categorization Test Examples:");
console.log("=====================================\n");

console.log("Test these goals in your app to verify categorization:\n");

testGoals.forEach((goal, index) => {
  console.log(`${index + 1}. "${goal}"`);
});

console.log("\n\nExpected categories:");
console.log("- Goals 1-5: Physical");
console.log("- Goals 6-10: Mental");
console.log("- Goals 11-15: Financial");
console.log("- Goals 16-20: Social");

console.log("\n\nTo test:");
console.log("1. Make sure ANTHROPIC_API_KEY is set in your .env.local");
console.log("2. Run your app and enter these goals one by one");
console.log("3. Verify they are categorized correctly");