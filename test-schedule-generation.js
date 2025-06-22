// Test examples for AI schedule generation
// These examples show what kind of schedules the AI should generate

const testExamples = [
  {
    goal: "Run 5k every morning",
    expectedSchedule: {
      summary: "Daily morning 5K runs for 30 days",
      explanation: "Morning runs at 6 AM help build consistency and start the day with energy",
      sessions: [{
        activity: "5K Morning Run",
        frequency: "daily",
        time: "06:00",
        duration: 60,
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        totalOccurrences: 30
      }]
    }
  },
  
  {
    goal: "Learn Spanish 30 minutes daily",
    expectedSchedule: {
      summary: "Daily Spanish study sessions for consistent learning",
      explanation: "Evening sessions at 7 PM when mental energy is still good but work is done",
      sessions: [{
        activity: "Spanish Study Session",
        frequency: "daily",
        time: "19:00",
        duration: 30,
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        totalOccurrences: 30
      }]
    }
  },
  
  {
    goal: "Save $500 every month",
    expectedSchedule: {
      summary: "Monthly savings reminders and weekly budget reviews",
      explanation: "Monthly transfers on the 1st and weekly Sunday reviews keep finances on track",
      sessions: [
        {
          activity: "Transfer $500 to Savings",
          frequency: "monthly",
          time: "09:00",
          duration: 15,
          days: ["1st"],
          totalOccurrences: 6
        },
        {
          activity: "Weekly Budget Review",
          frequency: "weekly",
          time: "19:00",
          duration: 30,
          days: ["Sun"],
          totalOccurrences: 24
        }
      ]
    }
  },
  
  {
    goal: "Lose 20 pounds in 3 months",
    expectedSchedule: {
      summary: "3x weekly workouts with weekly weigh-ins",
      explanation: "MWF workouts allow recovery days, Sunday weigh-ins track progress",
      sessions: [
        {
          activity: "Weight Training & Cardio",
          frequency: "weekly",
          time: "06:00",
          duration: 60,
          days: ["Mon", "Wed", "Fri"],
          totalOccurrences: 36
        },
        {
          activity: "Weekly Weigh-in & Progress Check",
          frequency: "weekly",
          time: "08:00",
          duration: 15,
          days: ["Sun"],
          totalOccurrences: 12
        }
      ]
    }
  },
  
  {
    goal: "Read 2 books per month",
    expectedSchedule: {
      summary: "Daily reading sessions to complete 2 books monthly",
      explanation: "30 minutes before bed helps relax and ensures consistent progress",
      sessions: [{
        activity: "Evening Reading",
        frequency: "daily",
        time: "21:00",
        duration: 30,
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        totalOccurrences: 30
      }]
    }
  },
  
  {
    goal: "Network with 5 new professionals monthly",
    expectedSchedule: {
      summary: "Weekly networking activities and follow-ups",
      explanation: "Thursday events and Tuesday follow-ups maintain professional connections",
      sessions: [
        {
          activity: "Attend Networking Event/Reach Out",
          frequency: "weekly",
          time: "18:00",
          duration: 90,
          days: ["Thu"],
          totalOccurrences: 12
        },
        {
          activity: "Follow-up with New Connections",
          frequency: "weekly",
          time: "14:00",
          duration: 30,
          days: ["Tue"],
          totalOccurrences: 12
        }
      ]
    }
  },
  
  {
    goal: "Complete marathon training",
    expectedSchedule: {
      summary: "Progressive running schedule building to marathon distance",
      explanation: "4 days/week with long run on Saturday, rest day Sunday",
      sessions: [
        {
          activity: "Easy Run",
          frequency: "weekly",
          time: "06:00",
          duration: 45,
          days: ["Tue", "Thu"],
          totalOccurrences: 32
        },
        {
          activity: "Speed/Tempo Run",
          frequency: "weekly",
          time: "06:00",
          duration: 60,
          days: ["Wed"],
          totalOccurrences: 16
        },
        {
          activity: "Long Run",
          frequency: "weekly",
          time: "07:00",
          duration: 120,
          days: ["Sat"],
          totalOccurrences: 16
        }
      ]
    }
  }
];

console.log("AI Schedule Generation Test Cases");
console.log("=================================\n");

testExamples.forEach((example, index) => {
  console.log(`${index + 1}. Goal: "${example.goal}"`);
  console.log(`   Expected Schedule:`);
  console.log(`   - ${example.expectedSchedule.summary}`);
  example.expectedSchedule.sessions.forEach(session => {
    console.log(`   - ${session.activity}: ${session.frequency} at ${session.time}`);
  });
  console.log("");
});

console.log("\nKey AI Behavior Expectations:");
console.log("- Morning activities: 6:00-8:00 AM");
console.log("- Evening activities: 6:00-9:00 PM");
console.log("- Work hour avoidance: No activities 9:00 AM - 5:00 PM (except weekends)");
console.log("- Rest days for physical activities");
console.log("- Realistic frequency based on goal type");
console.log("- Clear activity names that match the goal");