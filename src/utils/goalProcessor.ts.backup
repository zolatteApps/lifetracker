import { Goal, ActionItem } from '../types';

export const processGoals = (goalsText: string, achievementsText: string): Goal[] => {
  const categories = {
    physical: ['health', 'fitness', 'weight', 'exercise', 'body', 'gym', 'diet', 'nutrition', 'sleep'],
    mental: ['mental', 'mindfulness', 'meditation', 'stress', 'anxiety', 'peace', 'calm', 'therapy', 'journal'],
    financial: ['money', 'save', 'invest', 'finance', 'income', 'budget', 'debt', 'wealth', 'retire'],
    social: ['relationship', 'friend', 'family', 'social', 'network', 'connect', 'community', 'love']
  };

  const categorizedGoals: { [key: string]: string[] } = {
    physical: [],
    mental: [],
    financial: [],
    social: []
  };

  const allText = `${goalsText} ${achievementsText}`.toLowerCase();
  const sentences = allText.split(/[.,;!?]/).filter(s => s.trim());

  sentences.forEach(sentence => {
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => sentence.includes(keyword))) {
        categorizedGoals[category].push(sentence.trim());
        break;
      }
    }
  });

  const goals: Goal[] = [];
  
  // Always create goals for all categories
  const allCategories = ['physical', 'mental', 'financial', 'social'];
  
  allCategories.forEach(category => {
    const items = categorizedGoals[category];
    const description = items.length > 0 
      ? items.join('. ') 
      : getDefaultDescription(category);
    
    goals.push({
      id: `goal-${category}`,
      category: category as 'physical' | 'mental' | 'financial' | 'social',
      title: getCategoryTitle(category),
      description: description,
      actionItems: generateActionItems(category, items),
      progress: 0
    });
  });

  return goals;
};

const getCategoryTitle = (category: string): string => {
  const titles: { [key: string]: string } = {
    physical: 'Physical Health & Fitness',
    mental: 'Mental Health & Wellbeing',
    financial: 'Financial Goals',
    social: 'Social & Relationships'
  };
  return titles[category] || category;
};

const getDefaultDescription = (category: string): string => {
  const defaults: { [key: string]: string } = {
    physical: 'Build a strong, healthy body through regular exercise and proper nutrition',
    mental: 'Develop mental resilience and maintain emotional wellbeing',
    financial: 'Achieve financial stability and build wealth for the future',
    social: 'Build meaningful relationships and maintain social connections'
  };
  return defaults[category] || 'Set goals for this category';
};

const generateActionItems = (category: string, items: string[]): ActionItem[] => {
  const templates: { [key: string]: string[] } = {
    physical: [
      'Schedule weekly workout sessions',
      'Plan healthy meals for the week',
      'Track daily water intake',
      'Set consistent sleep schedule',
      'Take daily walks'
    ],
    mental: [
      'Practice daily meditation (10 mins)',
      'Journal thoughts and feelings',
      'Schedule self-care time',
      'Practice gratitude daily',
      'Limit screen time before bed'
    ],
    financial: [
      'Create monthly budget',
      'Track daily expenses',
      'Set up automatic savings',
      'Review investment options',
      'Reduce unnecessary spending'
    ],
    social: [
      'Schedule weekly catch-ups with friends',
      'Plan family activities',
      'Join community groups',
      'Practice active listening',
      'Express appreciation to loved ones'
    ]
  };

  return (templates[category] || []).map((title, index) => ({
    id: `action-${category}-${index}`,
    title,
    completed: false,
    priority: index === 0 ? 'high' : index < 3 ? 'medium' : 'low'
  }));
};