import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './DeleteConfirmationModal.css';

function DeleteConfirmationModal({ isOpen, onConfirm, onCancel, memeTitle = "this meme" }) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="delete-modal-overlay" onClick={handleOverlayClick}>
      <div className="delete-modal">
        <button className="delete-modal-close" onClick={onCancel}>
          <X size={20} />
        </button>
        
        <div className="delete-modal-icon">
          <AlertTriangle size={48} />
        </div>
        
        <h2 className="delete-modal-title">Delete Meme?</h2>
        
        <p className="delete-modal-message">
          Are you sure you want to delete "{memeTitle}"? This action cannot be undone.
        </p>
        
        <div className="delete-modal-actions">
          <button 
            className="delete-modal-btn delete-modal-btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className="delete-modal-btn delete-modal-btn-confirm"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteConfirmationModal; 