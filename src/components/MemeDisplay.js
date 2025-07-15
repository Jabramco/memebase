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
        
        // Always use canvas method for external URLs to ensure we get image data
        const img = new Image();
        
        // Create a promise to handle the image loading
        const loadImage = () => new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Image load timeout after 10 seconds'));
          }, 10000);
          
          img.onload = () => {
            clearTimeout(timeout);
            console.log('Image loaded successfully:', img.width, 'x', img.height);
            resolve();
          };
          
          img.onerror = (error) => {
            clearTimeout(timeout);
            reject(new Error(`Failed to load image: ${error.message || 'Network error'}`));
          };
          
          // Try loading without crossOrigin first (works for many cases)
          img.src = imageUrl;
        });
        
        try {
          await loadImage();
          
          // Create canvas and draw the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          
          console.log('Canvas size:', canvas.width, 'x', canvas.height);
          
          // Clear canvas and draw image
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          // Convert canvas to blob
          blob = await new Promise((resolve, reject) => {
            canvas.toBlob((canvasBlob) => {
              if (canvasBlob) {
                console.log('Canvas converted to blob:', canvasBlob.type, canvasBlob.size);
                resolve(canvasBlob);
              } else {
                reject(new Error('Failed to convert canvas to blob'));
              }
            }, 'image/png', 1.0);
          });
          
        } catch (canvasError) {
          console.warn('Canvas method failed, trying with CORS headers:', canvasError);
          
          // Try again with CORS headers
          try {
            const imgWithCors = new Image();
            imgWithCors.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('CORS image load timeout'));
              }, 10000);
              
              imgWithCors.onload = () => {
                clearTimeout(timeout);
                resolve();
              };
              
              imgWithCors.onerror = (error) => {
                clearTimeout(timeout);
                reject(new Error(`CORS image load failed: ${error.message || 'Network error'}`));
              };
              
              imgWithCors.src = imageUrl;
            });
            
            // Create canvas and draw the CORS image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = imgWithCors.naturalWidth || imgWithCors.width;
            canvas.height = imgWithCors.naturalHeight || imgWithCors.height;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imgWithCors, 0, 0);
            
            // Convert canvas to blob
            blob = await new Promise((resolve, reject) => {
              canvas.toBlob((canvasBlob) => {
                if (canvasBlob) {
                  resolve(canvasBlob);
                } else {
                  reject(new Error('Failed to convert CORS canvas to blob'));
                }
              }, 'image/png', 1.0);
            });
            
          } catch (corsError) {
            console.error('Both canvas methods failed:', corsError);
            throw new Error(`Unable to copy image: ${corsError.message}`);
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