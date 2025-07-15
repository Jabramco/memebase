import React, { useState } from 'react';
import { Copy, Trash2, FolderX, Rocket } from 'lucide-react';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import './MemeDisplay.css';

function MemeDisplay({ memes, onDeleteMeme, showToast }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memeToDelete, setMemeToDelete] = useState(null);

  // Helper function to detect mobile devices
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && window.innerHeight <= 1024);
  };

  // Helper function to get filename from URL
  const getImageFilename = (url) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const filename = path.split('/').pop();
      return filename || 'meme-image';
    } catch {
      return 'meme-image';
    }
  };

  // Helper function to download image for mobile devices
  const downloadImageForMobile = async (imageUrl, filename) => {
    try {
      showToast('Downloading image...', 'info');
      
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      link.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Image downloaded! Check your downloads folder.', 'success');
      return true;
    } catch (error) {
      console.error('Download failed:', error);
      return false;
    }
  };

  // Helper function to try native sharing (mobile)
  const tryNativeShare = async (imageUrl, filename) => {
    if (!navigator.share) {
      return false;
    }

    try {
      showToast('Preparing to share...', 'info');
      
      // Fetch the image as blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a file from the blob
      const file = new File([blob], filename, { type: blob.type });
      
      // Check if we can share files
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Share Meme',
          text: 'Check out this meme!'
        });
        showToast('Image shared successfully!', 'success');
        return true;
      } else {
        // Fallback to sharing URL
        await navigator.share({
          url: imageUrl,
          title: 'Share Meme',
          text: 'Check out this meme!'
        });
        showToast('Meme link shared!', 'success');
        return true;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled the share
        return true;
      }
      console.error('Share failed:', error);
      return false;
    }
  };

  const handleCopyImage = async (imageUrl, event) => {
    const filename = getImageFilename(imageUrl);
    
    // Handle mobile devices differently
    if (isMobileDevice()) {
      console.log('Mobile device detected, using mobile-friendly methods');
      
      // Try native sharing first (iOS/Android)
      const shareSuccess = await tryNativeShare(imageUrl, filename);
      if (shareSuccess) {
        return;
      }
      
      // Fallback to download
      const downloadSuccess = await downloadImageForMobile(imageUrl, filename);
      if (downloadSuccess) {
        return;
      }
      
      // Final fallback: copy URL and show mobile instructions
      try {
        await navigator.clipboard.writeText(imageUrl);
        showToast('Image URL copied! Long-press the image above and select "Copy Image" to copy the actual image.', 'info');
      } catch (error) {
        showToast('On mobile: long-press the image and select "Copy Image" or "Save Image".', 'info');
      }
      return;
    }

    // Desktop handling (existing logic)
    try {
      // Check if clipboard API supports writing images
      if (!navigator.clipboard || !window.isSecureContext) {
        throw new Error('Clipboard API not supported or not in secure context');
      }

      showToast('Copying image...', 'info');
      
      // Find the actual image element that's already loaded on the page
      const button = event.target.closest('button');
      if (!button) {
        throw new Error('Could not find button element');
      }
      
      const memeCard = button.closest('.meme-card');
      if (!memeCard) {
        throw new Error('Could not find meme card');
      }
      
      const imageElement = memeCard.querySelector('.meme-image');
      if (!imageElement) {
        throw new Error('Could not find image element');
      }
      
      console.log('Found image element:', {
        src: imageElement.src,
        complete: imageElement.complete,
        naturalWidth: imageElement.naturalWidth,
        naturalHeight: imageElement.naturalHeight
      });
      
      // Make sure the image is fully loaded
      if (!imageElement.complete) {
        throw new Error('Image is not fully loaded');
      }
      
      // Method 1: Try using the Selection API to copy the image
      try {
        console.log('Attempting to copy using Selection API...');
        
        // Create a range and select the image
        const range = document.createRange();
        range.selectNode(imageElement);
        
        // Clear any existing selection
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Try to copy using the older execCommand (still works for images in some browsers)
        const success = document.execCommand('copy');
        
        // Clear the selection
        selection.removeAllRanges();
        
        if (success) {
          console.log('Successfully copied using Selection API');
          showToast('Image copied! You can now paste it in other apps.', 'success');
          return;
        } else {
          throw new Error('execCommand copy failed');
        }
        
      } catch (selectionError) {
        console.warn('Selection API copy failed:', selectionError.message);
        
        // Method 2: Try creating a temporary link with the image
        try {
          console.log('Attempting to copy using temporary link method...');
          
          // Create a temporary container
          const tempContainer = document.createElement('div');
          tempContainer.style.position = 'fixed';
          tempContainer.style.left = '-9999px';
          tempContainer.style.top = '-9999px';
          tempContainer.style.opacity = '0';
          
          // Create a copy of the image
          const tempImg = document.createElement('img');
          tempImg.src = imageElement.src;
          tempImg.style.width = imageElement.style.width || `${imageElement.naturalWidth}px`;
          tempImg.style.height = imageElement.style.height || `${imageElement.naturalHeight}px`;
          
          tempContainer.appendChild(tempImg);
          document.body.appendChild(tempContainer);
          
          // Wait for the image to load
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Temporary image load timeout'));
            }, 5000);
            
            if (tempImg.complete) {
              clearTimeout(timeout);
              resolve();
            } else {
              tempImg.onload = () => {
                clearTimeout(timeout);
                resolve();
              };
              tempImg.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Temporary image load failed'));
              };
            }
          });
          
          // Select the temporary image
          const range = document.createRange();
          range.selectNode(tempImg);
          
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Try to copy
          const success = document.execCommand('copy');
          
          // Clean up
          selection.removeAllRanges();
          document.body.removeChild(tempContainer);
          
          if (success) {
            console.log('Successfully copied using temporary link method');
            showToast('Image copied! You can now paste it in other apps.', 'success');
            return;
          } else {
            throw new Error('Temporary link copy failed');
          }
          
        } catch (linkError) {
          console.warn('Temporary link copy failed:', linkError.message);
          
          // Method 3: Last resort - copy the URL
          console.log('Falling back to URL copy...');
          await navigator.clipboard.writeText(imageUrl);
          showToast('Image URL copied to clipboard! (Right-click image and copy works better)', 'info');
        }
      }
      
    } catch (error) {
      console.error('Copy failed:', error);
      
      // Final fallback: copy URL
      try {
        await navigator.clipboard.writeText(imageUrl);
        showToast('Image URL copied as fallback! (Try right-click → copy on the image)', 'info');
      } catch (urlError) {
        showToast(`Copy failed: ${error.message}. Try right-click → copy on the image.`, 'error');
      }
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
                onClick={(e) => handleCopyImage(meme.imageUrl, e)}
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