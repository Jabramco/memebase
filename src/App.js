import React, { useState, useEffect } from 'react';
import { Search, Plus, Crown } from 'lucide-react';
import './App.css';
import MemeUpload from './components/MemeUpload';
import MemeSearch from './components/MemeSearch';
import MemeDisplay from './components/MemeDisplay';
import MemeOfTheWeek from './components/MemeOfTheWeek';
import Toast from './components/Toast';
import Logo from './components/Logo';
import { getMemesFromFirebase, deleteMemeFromFirebase } from './firebase-service';
import { cleanupOldInteractions } from './interaction-service';

function App() {
  const [memes, setMemes] = useState([]);
  const [filteredMemes, setFilteredMemes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'add', or 'meme-week'

  // Load memes from Firebase on component mount
  useEffect(() => {
    loadMemes();
    // Clean up old interaction data on app start
    cleanupOldInteractions();
  }, []);

  // Scrollbar animation on scroll
  useEffect(() => {
    let scrollTimeout;
    
    const handleScroll = () => {
      // Add scrolling class
      document.documentElement.classList.add('scrolling');
      
      // Clear existing timeout
      clearTimeout(scrollTimeout);
      
      // Remove scrolling class after scroll stops
      scrollTimeout = setTimeout(() => {
        document.documentElement.classList.remove('scrolling');
      }, 150);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const loadMemes = async () => {
    try {
      setLoading(true);
      setError('');
      const memesData = await getMemesFromFirebase();
      setMemes(memesData);
      setFilteredMemes(memesData);
    } catch (err) {
      console.error('Error loading memes:', err);
      setError('Failed to load memes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter memes based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMemes(memes);
    } else {
      const filtered = memes.filter(meme => {
        const searchLower = searchTerm.toLowerCase();
        
        // Search in meme title
        const titleMatch = meme.title.toLowerCase().includes(searchLower);
        
        // Search in keywords
        const keywordMatch = meme.keywords.some(keyword =>
          keyword.toLowerCase().includes(searchLower)
        );
        
        return titleMatch || keywordMatch;
      });
      setFilteredMemes(filtered);
    }
  }, [searchTerm, memes]);

  const handleAddMeme = (newMeme) => {
    setMemes(prevMemes => {
      const updatedMemes = [newMeme, ...prevMemes];
      
      // If there's a search term, filter the new list
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const filtered = updatedMemes.filter(meme => {
          const titleMatch = meme.title.toLowerCase().includes(searchLower);
          const keywordMatch = meme.keywords.some(keyword =>
            keyword.toLowerCase().includes(searchLower)
          );
          return titleMatch || keywordMatch;
        });
        setFilteredMemes(filtered);
      } else {
        setFilteredMemes(updatedMemes);
      }
      
      return updatedMemes;
    });
    
    showToast('Meme uploaded successfully!', 'success');
    // Switch to search tab after successful upload
    setActiveTab('search');
  };

  const handleDeleteMeme = async (memeId) => {
    try {
      await deleteMemeFromFirebase(memeId);
      
      setMemes(prevMemes => {
        const updatedMemes = prevMemes.filter(meme => meme.id !== memeId);
        
        // Update filtered memes as well
        if (searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase();
          const filtered = updatedMemes.filter(meme => {
            const titleMatch = meme.title.toLowerCase().includes(searchLower);
            const keywordMatch = meme.keywords.some(keyword =>
              keyword.toLowerCase().includes(searchLower)
            );
            return titleMatch || keywordMatch;
          });
          setFilteredMemes(filtered);
        } else {
          setFilteredMemes(updatedMemes);
        }
        
        return updatedMemes;
      });
      
      showToast('Meme deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting meme:', err);
      showToast('Failed to delete meme. Please try again.', 'error');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  if (loading) {
    return (
      <div className="App">
        <div className="app-header">
          <Logo />
        </div>
        <div className="app-container">
          <div className="loading-message">Loading your memes...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="app-header">
          <Logo />
        </div>
        <div className="app-container">
          <div className="error-message">
            {error}
            <br />
            <button className="btn btn-primary" onClick={loadMemes}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={hideToast} 
        />
      )}
      
      <div className="app-header">
        <Logo />
      </div>
      
      <div className="app-container">
        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <Search className="tab-icon" size={16} />
            <span>Search Your Memes</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <Plus className="tab-icon" size={16} />
            <span>Add Meme</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'meme-week' ? 'active' : ''}`}
            onClick={() => setActiveTab('meme-week')}
          >
            <Crown className="tab-icon" size={16} />
            <span>Meme of the Week</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'search' ? (
            // Search Tab Content
            <>
              <div className="search-section">
                <MemeSearch 
                  searchTerm={searchTerm} 
                  onSearchChange={setSearchTerm} 
                />
              </div>
              
              <div className="meme-grid">
                <MemeDisplay 
                  memes={filteredMemes} 
                  onDeleteMeme={handleDeleteMeme}
                  showToast={showToast}
                />
              </div>
            </>
          ) : activeTab === 'add' ? (
            // Add Meme Tab Content
            <div className="upload-section">
              <MemeUpload onAddMeme={handleAddMeme} showToast={showToast} />
            </div>
          ) : (
            // Meme of the Week Tab Content
            <div className="meme-week-section">
              <MemeOfTheWeek 
                memes={memes} 
                showToast={showToast}
              />
            </div>
          )}
        </div>
        
        {/* Copyright Footer */}
        <footer className="app-footer">
          <p>© 2024 - Built by agents working for jcosigner</p>
        </footer>
      </div>
    </div>
  );
}

export default App; 