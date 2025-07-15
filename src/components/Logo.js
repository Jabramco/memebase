import React from 'react';
import { Zap } from 'lucide-react';
import './Logo.css';

const Logo = () => {
  return (
    <div className="logo-container">
      <div className="logo-background">
        <div className="logo-guilloche"></div>
        <div className="logo-gradient"></div>
      </div>
      <div className="logo-content">
        <div className="logo-icon">
          <div className="logo-icon-inner">
            <Zap className="logo-symbol" size={24} />
          </div>
        </div>
        <div className="logo-text">
          <span className="logo-title">Meme</span>
          <span className="logo-subtitle">Base</span>
        </div>
      </div>
    </div>
  );
};

export default Logo; 