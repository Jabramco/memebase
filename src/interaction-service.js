// Interaction tracking service for memes
// Uses localStorage for persistence (can be moved to Firebase later)

const INTERACTIONS_KEY = 'meme-interactions';

// Get current week identifier (year-week format)
const getCurrentWeek = () => {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil((((now - yearStart) / 86400000) + yearStart.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber}`;
};

// Get all interactions from localStorage
const getInteractions = () => {
  try {
    const stored = localStorage.getItem(INTERACTIONS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading interactions:', error);
    return {};
  }
};

// Save interactions to localStorage
const saveInteractions = (interactions) => {
  try {
    localStorage.setItem(INTERACTIONS_KEY, JSON.stringify(interactions));
  } catch (error) {
    console.error('Error saving interactions:', error);
  }
};

// Track a meme interaction
export const trackInteraction = (memeId, type = 'view') => {
  const currentWeek = getCurrentWeek();
  const interactions = getInteractions();
  
  // Initialize week data if it doesn't exist
  if (!interactions[currentWeek]) {
    interactions[currentWeek] = {};
  }
  
  // Initialize meme data if it doesn't exist
  if (!interactions[currentWeek][memeId]) {
    interactions[currentWeek][memeId] = {
      views: 0,
      copies: 0,
      clicks: 0,
      totalScore: 0
    };
  }
  
  // Increment the interaction type
  interactions[currentWeek][memeId][type]++;
  
  // Calculate total score (weighted: views=1, copies=3, clicks=2)
  const memeData = interactions[currentWeek][memeId];
  memeData.totalScore = (memeData.views * 1) + (memeData.copies * 3) + (memeData.clicks * 2);
  
  // Save back to localStorage
  saveInteractions(interactions);
  
  return interactions[currentWeek][memeId];
};

// Get the most interacted with meme for the current week
export const getMemeOfTheWeek = (memes) => {
  const currentWeek = getCurrentWeek();
  const interactions = getInteractions();
  const weekData = interactions[currentWeek] || {};
  
  // Find the meme with the highest total score
  let topMemeId = null;
  let highestScore = 0;
  
  Object.keys(weekData).forEach(memeId => {
    const score = weekData[memeId].totalScore;
    if (score > highestScore) {
      highestScore = score;
      topMemeId = memeId;
    }
  });
  
  // Find the actual meme object
  const topMeme = memes.find(meme => meme.id === topMemeId);
  
  return topMeme ? {
    meme: topMeme,
    stats: weekData[topMemeId],
    week: currentWeek
  } : null;
};

// Get interaction stats for a specific meme
export const getMemeStats = (memeId) => {
  const currentWeek = getCurrentWeek();
  const interactions = getInteractions();
  const weekData = interactions[currentWeek] || {};
  
  return weekData[memeId] || {
    views: 0,
    copies: 0,
    clicks: 0,
    totalScore: 0
  };
};

// Clean up old interaction data (keep only last 4 weeks)
export const cleanupOldInteractions = () => {
  const interactions = getInteractions();
  
  // Generate list of recent weeks to keep
  const weeksToKeep = [];
  const now = new Date();
  
  for (let i = 0; i < 4; i++) {
    const weekAgo = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
    const yearStart = new Date(weekAgo.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((weekAgo - yearStart) / 86400000) + yearStart.getDay() + 1) / 7);
    weeksToKeep.push(`${weekAgo.getFullYear()}-W${weekNumber}`);
  }
  
  // Remove old weeks
  const cleanedInteractions = {};
  weeksToKeep.forEach(week => {
    if (interactions[week]) {
      cleanedInteractions[week] = interactions[week];
    }
  });
  
  saveInteractions(cleanedInteractions);
}; 