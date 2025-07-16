import React from 'react';
import { Crown, Eye, Copy, MousePointer, Calendar } from 'lucide-react';
import { trackInteraction } from '../interaction-service';
import './MemeOfTheWeek.css';

function MemeOfTheWeek({ memes, showToast }) {
  const getMemeOfTheWeek = (memes) => {
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

  const getCurrentWeek = () => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((now - yearStart) / 86400000) + yearStart.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber}`;
  };

  const getInteractions = () => {
    try {
      const stored = localStorage.getItem('meme-interactions');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  };

  const formatWeekText = (weekString) => {
    const [year, week] = weekString.split('-W');
    return `Week ${week}, ${year}`;
  };

  const handleImageClick = (imageUrl, memeId) => {
    // Track click interaction
    trackInteraction(memeId, 'clicks');
    showToast('Meme clicked! 🎉', 'success');
  };

  const handleCopyImage = async (imageUrl, memeId) => {
    // Track copy interaction
    trackInteraction(memeId, 'copies');
    showToast('💡 Long-press the image above and select "Copy Image" to copy it!', 'info');
  };

  const memeOfTheWeek = getMemeOfTheWeek(memes);

  if (!memeOfTheWeek) {
    return (
      <div className="meme-of-the-week-container">
        <div className="meme-of-the-week-header">
          <Crown className="crown-icon" size={32} />
          <h2>Meme of the Week</h2>
          <Calendar className="calendar-icon" size={20} />
          <span className="week-text">{formatWeekText(getCurrentWeek())}</span>
        </div>
        
        <div className="no-meme-of-week">
          <div className="placeholder-crown">
            <Crown size={64} />
          </div>
          <h3>No Meme of the Week Yet!</h3>
          <p>
            Start interacting with memes to see the most popular one here. 
            View, copy, and click on memes to increase their popularity score!
          </p>
          <div className="scoring-info">
            <div className="score-item">
              <Eye size={16} />
              <span>Views = 1 point</span>
            </div>
            <div className="score-item">
              <Copy size={16} />
              <span>Copies = 3 points</span>
            </div>
            <div className="score-item">
              <MousePointer size={16} />
              <span>Clicks = 2 points</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { meme, stats, week } = memeOfTheWeek;

  return (
    <div className="meme-of-the-week-container">
      <div className="meme-of-the-week-header">
        <Crown className="crown-icon" size={32} />
        <h2>Meme of the Week</h2>
        <Calendar className="calendar-icon" size={20} />
        <span className="week-text">{formatWeekText(week)}</span>
      </div>
      
      <div className="meme-of-the-week-content">
        <div className="meme-champion">
          <div className="meme-image-container">
            <img
              src={meme.imageUrl}
              alt={meme.title}
              className="champion-meme-image"
              onClick={() => handleImageClick(meme.imageUrl, meme.id)}
            />
            <div className="crown-overlay">
              <Crown size={24} />
            </div>
          </div>
          
          <div className="meme-champion-info">
            <h3 className="champion-title">{meme.title}</h3>
            <div className="champion-keywords">
              {meme.keywords.join(', ')}
            </div>
            
            <div className="champion-stats">
              <div className="stat-item">
                <Eye className="stat-icon" size={16} />
                <span className="stat-value">{stats.views}</span>
                <span className="stat-label">Views</span>
              </div>
              <div className="stat-item">
                <Copy className="stat-icon" size={16} />
                <span className="stat-value">{stats.copies}</span>
                <span className="stat-label">Copies</span>
              </div>
              <div className="stat-item">
                <MousePointer className="stat-icon" size={16} />
                <span className="stat-value">{stats.clicks}</span>
                <span className="stat-label">Clicks</span>
              </div>
            </div>
            
            <div className="total-score">
              <span className="score-label">Total Score:</span>
              <span className="score-value">{stats.totalScore}</span>
            </div>
            
            <div className="champion-actions">
              <button
                onClick={() => handleCopyImage(meme.imageUrl, meme.id)}
                className="btn btn-primary btn-champion"
              >
                <Copy size={16} />
                Copy Champion
              </button>
            </div>
          </div>
        </div>
        
        <div className="scoring-explanation">
          <h4>How Scoring Works:</h4>
          <div className="scoring-grid">
            <div className="score-explanation">
              <Eye className="score-icon" size={16} />
              <span>Views = 1 point each</span>
            </div>
            <div className="score-explanation">
              <Copy className="score-icon" size={16} />
              <span>Copies = 3 points each</span>
            </div>
            <div className="score-explanation">
              <MousePointer className="score-icon" size={16} />
              <span>Clicks = 2 points each</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemeOfTheWeek; 