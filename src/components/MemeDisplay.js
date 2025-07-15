import React, { useState } from 'react';
import { Copy, Trash2, FolderX, Rocket } from 'lucide-react';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import './MemeDisplay.css';

function MemeDisplay({ memes, onDeleteMeme, showToast }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memeToDelete, setMemeToDelete] = useState(null);

  const handleCopyImage = async (imageUrl) => {
    try {
      // Check if clipboard API supports writing images
      if (!navigator.clipboard || !window.isSecureContext) {
        throw new Error('Clipboard API not supported or not in secure context');
      }

      // Check if ClipboardItem is supported
      if (!window.ClipboardItem) {
        throw new Error('ClipboardItem not supported');
      }

      showToast('Copying image...', 'info');
      
      let blob;
      
      // Check if the imageUrl is a data URL (base64)
      if (imageUrl.startsWith('data:')) {
        try {
          // Convert data URL to blob
          const response = await fetch(imageUrl);
          blob = await response.blob();
          console.log('Data URL converted to blob:', blob.type, blob.size);
        } catch (error) {
          console.error('Failed to convert data URL to blob:', error);
          throw error;
        }
      } else {
        // For Firebase Storage URLs or other external URLs
        console.log('Attempting to fetch external image:', imageUrl);
        
        // Method 1: Try direct fetch first (works if CORS is properly configured)
        try {
          const response = await fetch(imageUrl, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          blob = await response.blob();
          console.log('Direct fetch successful:', blob.type, blob.size);
          
          // Ensure blob is a valid image type
          if (!blob.type.startsWith('image/')) {
            throw new Error('Retrieved content is not an image');
          }
          
        } catch (fetchError) {
          console.warn('Direct fetch failed, trying proxy method:', fetchError);
          
          // Method 2: Use a CORS proxy approach by creating a new image and converting via canvas
          // But first, let's try loading with proper CORS headers
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // This is key for CORS
            
            // Create a promise to handle the image loading
            const loadImage = () => new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Image load timeout'));
              }, 15000); // 15 second timeout
              
              img.onload = () => {
                clearTimeout(timeout);
                resolve();
              };
              
              img.onerror = (error) => {
                clearTimeout(timeout);
                reject(new Error(`Failed to load image with CORS: ${error.message || 'Network error'}`));
              };
              
              // Set the source after setting up event listeners
              img.src = imageUrl;
            });
            
            await loadImage();
            
            // Create canvas and draw the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            
            // Clear canvas and draw image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            // Convert canvas to blob
            blob = await new Promise((resolve, reject) => {
              canvas.toBlob((canvasBlob) => {
                if (canvasBlob) {
                  resolve(canvasBlob);
                } else {
                  reject(new Error('Failed to convert canvas to blob'));
                }
              }, 'image/png', 1.0);
            });
            
            console.log('Canvas method with CORS successful:', blob.type, blob.size);
            
          } catch (canvasError) {
            console.error('Canvas method with CORS failed:', canvasError);
            
            // Method 3: Fallback to copying image URL as text
            console.log('Falling back to copying image URL as text');
            
            try {
              await navigator.clipboard.writeText(imageUrl);
              showToast('Image URL copied to clipboard! You can paste the link and download the image.', 'success');
              return; // Early return for URL copy success
            } catch (textError) {
              console.error('Text copy also failed:', textError);
              throw new Error(`Unable to copy image or URL: ${canvasError.message}`);
            }
          }
        }
      }
      
      // Ensure we have a valid image blob (if we got here)
      if (!blob) {
        throw new Error('No image blob created');
      }
      
      // Validate blob type
      if (!blob.type.startsWith('image/')) {
        console.warn('Blob type is not an image:', blob.type);
        // Force PNG type if not detected as image
        blob = new Blob([blob], { type: 'image/png' });
      }
      
      console.log('Final blob for clipboard:', blob.type, blob.size);
      
      // Create ClipboardItem with the image blob
      const clipboardItem = new ClipboardItem({
        [blob.type]: blob
      });
      
      // Copy the image to clipboard
      await navigator.clipboard.write([clipboardItem]);
      showToast('Image copied to clipboard! You can now paste it in other apps.', 'success');
      
    } catch (error) {
      console.error('Failed to copy image:', error);
      showToast(`Failed to copy image: ${error.message}`, 'error');
    }
  };

  const handleDeleteMeme = (memeId) => {
    const meme = memes.find(m => m.id === memeId);
    setMemeToDelete(meme);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (memeToDelete) {
      onDeleteMeme(memeToDelete.id);
      setDeleteModalOpen(false);
      setMemeToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setMemeToDelete(null);
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  if (memes.length === 0) {
    return (
      <div className="no-results">
        <div className="no-results-icon">
          <FolderX size={48} />
        </div>
        <h3>No memes found</h3>
        <p>
          <Rocket size={16} className="inline-icon" />
          Upload your first meme to get started!
        </p>
      </div>
    );
  }

  return (
    <>
      {memes.map((meme) => (
        <div key={meme.id} className="meme-card">
          <img
            src={meme.imageUrl}
            alt={meme.title}
            className="meme-image"
            onClick={() => handleImageClick(meme.imageUrl)}
          />
          <div className="meme-info">
            <h3 className="meme-title">{meme.title}</h3>
            <div className="meme-keywords">
              {meme.keywords.join(', ')}
            </div>
            <div className="meme-actions">
              <button
                onClick={() => handleCopyImage(meme.imageUrl)}
                className="btn btn-secondary btn-small"
              >
                <Copy size={14} />
                Copy
              </button>
              <button
                onClick={() => handleDeleteMeme(meme.id)}
                className="btn btn-danger btn-small"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
      
      {selectedImage && (
        <div className="modal" onClick={handleModalClick}>
          <div className="modal-content">
            <img src={selectedImage} alt="Full size" />
            <button className="modal-close" onClick={handleCloseModal}>
              ×
            </button>
          </div>
        </div>
      )}
      
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        memeTitle={memeToDelete?.title}
      />
    </>
  );
}

export default MemeDisplay; 