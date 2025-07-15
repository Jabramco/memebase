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
        console.log('Attempting to copy external image:', imageUrl);
        
        // Method 1: Try direct fetch with proper headers (works for many Firebase Storage URLs)
        try {
          const response = await fetch(imageUrl, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            headers: {
              'Accept': 'image/*',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          blob = await response.blob();
          console.log('Direct fetch successful:', blob.type, blob.size);
          
          // Validate it's actually an image
          if (!blob.type.startsWith('image/')) {
            throw new Error('Response is not an image');
          }
          
        } catch (fetchError) {
          console.warn('Direct fetch failed, trying alternative method:', fetchError);
          
          // Method 2: Use a proxy image approach (create a temporary image element)
          try {
            // Create a temporary image element
            const img = new Image();
            
            // For Firebase Storage URLs, we can often load them directly without crossOrigin
            // since they should be publicly accessible
            const imageLoadPromise = new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Image load timeout'));
              }, 15000);
              
              img.onload = () => {
                clearTimeout(timeout);
                console.log('Image loaded successfully:', img.width, 'x', img.height);
                resolve();
              };
              
              img.onerror = (error) => {
                clearTimeout(timeout);
                reject(new Error(`Image load failed: ${error.message || 'Network error'}`));
              };
              
              // Load the image
              img.src = imageUrl;
            });
            
            await imageLoadPromise;
            
            // Create canvas and draw the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            
            console.log('Canvas size:', canvas.width, 'x', canvas.height);
            
            // Draw the image on canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            // Convert canvas to blob
            blob = await new Promise((resolve, reject) => {
              canvas.toBlob((canvasBlob) => {
                if (canvasBlob && canvasBlob.size > 0) {
                  console.log('Canvas converted to blob:', canvasBlob.type, canvasBlob.size);
                  resolve(canvasBlob);
                } else {
                  reject(new Error('Failed to create image blob from canvas'));
                }
              }, 'image/png', 1.0);
            });
            
          } catch (canvasError) {
            console.error('Canvas method failed:', canvasError);
            
            // Method 3: Last resort - try to get image data through Firebase Storage getDownloadURL
            try {
              // If it's a Firebase Storage URL, we can try to fetch it with a different approach
              if (imageUrl.includes('firebasestorage.googleapis.com')) {
                // Parse the URL to get the actual file path
                const urlParts = imageUrl.split('?');
                const baseUrl = urlParts[0];
                
                // Try fetching with no-cors mode (will give us opaque response)
                await fetch(baseUrl, {
                  method: 'GET',
                  mode: 'no-cors',
                  credentials: 'omit'
                });
                
                // Since it's opaque, we need to use a different approach
                const img = new Image();
                img.crossOrigin = 'use-credentials';
                
                await new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => {
                    reject(new Error('Credentials image load timeout'));
                  }, 10000);
                  
                  img.onload = () => {
                    clearTimeout(timeout);
                    resolve();
                  };
                  
                  img.onerror = () => {
                    clearTimeout(timeout);
                    reject(new Error('Credentials image load failed'));
                  };
                  
                  img.src = imageUrl;
                });
                
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                
                ctx.drawImage(img, 0, 0);
                
                blob = await new Promise((resolve, reject) => {
                  canvas.toBlob((canvasBlob) => {
                    if (canvasBlob) {
                      resolve(canvasBlob);
                    } else {
                      reject(new Error('Failed to convert credentials canvas to blob'));
                    }
                  }, 'image/png', 1.0);
                });
                
              } else {
                throw new Error('Not a Firebase Storage URL');
              }
              
            } catch (finalError) {
              console.error('All methods failed:', finalError);
              throw new Error(`Unable to copy image: All methods failed. ${finalError.message}`);
            }
          }
        }
      }
      
      // Ensure we have a valid image blob
      if (!blob) {
        throw new Error('No image blob was created');
      }
      
      // Validate blob type and size
      if (!blob.type.startsWith('image/')) {
        console.warn('Blob type is not an image:', blob.type);
        // Force PNG type if not detected as image
        blob = new Blob([blob], { type: 'image/png' });
      }
      
      if (blob.size === 0) {
        throw new Error('Generated image blob is empty');
      }
      
      console.log('Final blob for clipboard:', blob.type, blob.size);
      
      // Create ClipboardItem with the image blob
      const clipboardItem = new ClipboardItem({
        [blob.type]: blob
      });
      
      // Copy the image to clipboard
      await navigator.clipboard.write([clipboardItem]);
      showToast('Image copied! You can now paste it in other apps.', 'success');
      
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