import React from 'react';
import { Search } from 'lucide-react';
import './MemeSearch.css';

function MemeSearch({ searchTerm, onSearchChange }) {
  return (
    <div className="meme-search">
      <h2>Search Your Memes</h2>
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or keywords..."
            className="search-input"
          />
          <Search className="search-icon" size={20} />
        </div>
        
        {searchTerm && (
          <div className="search-stats">
            Searching for: <strong>"{searchTerm}"</strong>
          </div>
        )}
      </div>
    </div>
  );
}

export default MemeSearch; 