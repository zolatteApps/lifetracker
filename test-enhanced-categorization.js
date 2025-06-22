// Test script for enhanced AI goal analysis
// Run with: node test-enhanced-categorization.js

const testGoals = [
  // Habit goals
  "Run 5k every morning",
  "Meditate for 20 minutes daily",
  "Call mom every Sunday",
  "Save $500 every month",
  
  // Numeric goals
  "Lose 20 pounds in 3 months",
  "Read 24 books this year",
  "Save $10,000 for emergency fund",
  "Increase bench press to 200 lbs",
  
  // Milestone goals
  "Complete a marathon",
  "Get PMP certification",
  "Launch my startup",
  "Visit Japan",
  
  // Complex goals
  "Exercise 4 times a week at the gym",
  "Learn Spanish to conversational level",
  "Pay off $5000 credit card debt by December",
  "Network with 5 new professionals monthly"
];

console.log("Enhanced AI Goal Analysis Test Examples:");
console.log("=======================================\n");

console.log("Expected AI Analysis Results:\n");

testGoals.forEach((goal, index) => {
  console.log(`${index + 1}. "${goal}"`);
  
  // Show expected results
  if (goal.includes("every morning") || goal.includes("daily") || goal.includes("every")) {
    console.log("   → Type: habit");
  } else if (/\d+/.test(goal) && (goal.includes("lose") || goal.includes("save") || goal.includes("increase"))) {
    console.log("   → Type: numeric");
  } else {
    console.log("   → Type: milestone");
  }
  console.log("");
});

console.log("\nExpected Fields for Each Goal:");
console.log("- Title: Short, actionable title");
console.log("- Description: Detailed explanation");
console.log("- Type: habit/numeric/milestone");
console.log("- Priority: high/medium/low");
console.log("- Target Value: Number for habits/numeric, null for milestones");
console.log("- Unit: days/pounds/dollars/books etc.");
console.log("- Due Date: Suggested timeframe");

console.log("\n\nExample Expected Result for 'Run 5k every morning':");
console.log(JSON.stringify({
  category: "physical",
  title: "Run 5K Daily",
  description: "Run 5 kilometers every morning to improve cardiovascular fitness",
  type: "habit",
  priority: "high",
  targetValue: 30,
  unit: "days",
  dueDate: "2024-07-22T00:00:00.000Z"
}, null, 2));