import React, { useState } from 'react';
import { FileImage, Upload } from 'lucide-react';
import './MemeUpload.css';
import { uploadImageToFirebase, addMemeToFirebase } from '../firebase-service';
import BulkUploadModal from './BulkUploadModal';

function MemeUpload({ onAddMeme, showToast }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [keywords, setKeywords] = useState('');
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFiles, setBulkFiles] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // Validate all files
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      showToast('Please select only image files', 'error');
      return;
    }
    
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      showToast('All files must be less than 10MB', 'error');
      return;
    }
    
    if (files.length === 1) {
      // Single file upload - use existing flow
      const file = files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      // Multiple files - show bulk upload modal
      setBulkFiles(files);
      setShowBulkModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !keywords.trim() || !title.trim()) {
      showToast('Please provide a name, select an image, and add keywords', 'error');
      return;
    }

    setIsUploading(true);
    
    try {
      // Generate a unique ID for the meme
      const memeId = Date.now().toString();
      
      console.log('Starting Firebase upload...');
      
      // Upload image to Firebase Storage with timeout
      const uploadPromise = uploadImageToFirebase(selectedFile, memeId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 30000)
      );
      
      const imageUrl = await Promise.race([uploadPromise, timeoutPromise]);
      
      console.log('Image uploaded successfully:', imageUrl);
      
      // Prepare meme data
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      const memeData = {
        title: title.trim(),
        keywords: keywordArray,
        imageUrl,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        createdAt: new Date().toISOString()
      };
      
      // Save meme to Firestore
      console.log('Saving to Firestore...');
      const savedMeme = await addMemeToFirebase(memeData);
      
      console.log('Meme saved successfully:', savedMeme);
      
      // Update parent component
      onAddMeme(savedMeme);
      
      // Reset form
      setSelectedFile(null);
      setKeywords('');
      setTitle('');
      setPreviewUrl('');
      
      // Note: Success toast is handled in App.js
      
    } catch (error) {
      console.error('Firebase upload failed:', error);
      
      // Fallback to localStorage with base64
      try {
        console.log('Falling back to localStorage...');
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
          const memeData = {
            id: Date.now().toString(),
            title: title.trim(),
            keywords: keywordArray,
            imageUrl: e.target.result, // base64 data URL
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            createdAt: new Date().toISOString()
          };
          
          // Save to localStorage
          const existingMemes = JSON.parse(localStorage.getItem('memes') || '[]');
          const updatedMemes = [memeData, ...existingMemes];
          localStorage.setItem('memes', JSON.stringify(updatedMemes));
          
          // Update parent component
          onAddMeme(memeData);
          
          // Reset form
          setSelectedFile(null);
          setKeywords('');
          setTitle('');
          setPreviewUrl('');
          
          showToast('Firebase failed, but meme saved locally!', 'warning');
        };
        reader.readAsDataURL(selectedFile);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        showToast('Upload failed completely. Please check your internet connection and try again.', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="meme-upload">
      <h2>Upload New Meme</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <div className="input-container">
            <input
              type="text"
              id="title"
              className="modern-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder=" "
              required
              disabled={isUploading}
            />
            <label htmlFor="title" className="modern-label">Meme Name</label>
          </div>
        </div>
        
        <div className="form-group">
          <div className="file-input-container">
            <label className="file-input-label">Select Image</label>
            <div className={`modern-file-input ${selectedFile ? 'has-file' : ''}`}>
              <input
                type="file"
                id="imageFile"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                required
                disabled={isUploading}
                className="file-input-hidden"
              />
              <div className="file-input-content">
                {selectedFile ? (
                  <div className="file-selected">
                    <FileImage className="file-icon" size={24} />
                    <div className="file-details">
                      <div className="file-name">{selectedFile.name}</div>
                      <div className="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <Upload className="upload-icon" size={24} />
                    <div className="upload-text">Click to select an image or drag and drop</div>
                  </div>
                )}
              </div>
            </div>
            <small className="input-helper">
              Supported formats: JPG, PNG, GIF, WebP (max 10MB). Select multiple files for bulk upload.
            </small>
          </div>
        </div>

        {previewUrl && (
          <div className="form-group">
            <label>Preview</label>
            <div className="file-preview">
              <img src={previewUrl} alt="Preview" />
            </div>
          </div>
        )}
        
        <div className="form-group">
          <div className="input-container">
            <input
              type="text"
              id="keywords"
              className="modern-input"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder=" "
              required
              disabled={isUploading}
            />
            <label htmlFor="keywords" className="modern-label">Keywords</label>
          </div>
          <small className="input-helper">
            Add keywords separated by commas to make your meme searchable
          </small>
        </div>
        
        <button 
          type="submit" 
          className="modern-submit-button"
          disabled={isUploading || !selectedFile}
        >
          {isUploading ? 'Uploading to Cloud...' : 'Add Meme'}
        </button>
      </form>
      
      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <BulkUploadModal
          files={bulkFiles}
          onClose={() => {
            setShowBulkModal(false);
            setBulkFiles([]);
          }}
          onAddMeme={onAddMeme}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default MemeUpload; 