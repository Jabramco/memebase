import React, { useState, useEffect } from 'react';
import { X, Save, Upload, AlertTriangle, Sparkles } from 'lucide-react';
import { uploadImageToFirebase, addMemeToFirebase } from '../firebase-service';
import './BulkUploadModal.css';

// Smart naming function to suggest better titles
const suggestTitle = (filename) => {
  // Remove file extension
  let name = filename.replace(/\.[^/.]+$/, '');
  
  // Common patterns to clean up
  const patterns = [
    // Remove common prefixes/suffixes
    /^(img|image|pic|picture|photo|screenshot|snapshot|meme|funny|humor|joke|comic|cartoon)_/i,
    /_(img|image|pic|picture|photo|screenshot|snapshot|meme|funny|humor|joke|comic|cartoon)$/i,
    // Remove numbers and dates at the end
    /_\d{4}-\d{2}-\d{2}$/,
    /_\d{8}$/,
    /_\d{1,4}$/,
    // Remove common separators and replace with spaces
    /[-_]+/g,
    // Remove multiple spaces
    /\s+/g,
    // Remove special characters but keep letters, numbers, and spaces
    /[^a-zA-Z0-9\s]/g,
  ];
  
  // Apply patterns
  patterns.forEach(pattern => {
    name = name.replace(pattern, ' ');
  });
  
  // Clean up and capitalize
  name = name.trim().replace(/\s+/g, ' ');
  
  // If the result is too short or empty, use the original cleaned name
  if (name.length < 3) {
    name = filename.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
  }
  
  // Capitalize first letter of each word
  name = name.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
  
  return name;
};

function BulkUploadModal({ files, onClose, onAddMeme, showToast }) {
  const [memeData, setMemeData] = useState(
    files.map(file => ({
      file,
      title: suggestTitle(file.name), // Use smart naming for better titles
      keywords: '',
      previewUrl: null,
      isDuplicate: false
    }))
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [duplicateCount, setDuplicateCount] = useState(0);

  // Check for duplicates and generate preview URLs
  useEffect(() => {
    const checkDuplicates = () => {
      const fileMap = new Map();
      const duplicates = new Set();
      
      memeData.forEach((item, index) => {
        const fileKey = `${item.file.name}-${item.file.size}`;
        if (fileMap.has(fileKey)) {
          duplicates.add(index);
          duplicates.add(fileMap.get(fileKey));
        } else {
          fileMap.set(fileKey, index);
        }
      });
      
      setMemeData(prev => prev.map((item, index) => ({
        ...item,
        isDuplicate: duplicates.has(index)
      })));
      
      setDuplicateCount(duplicates.size);
    };
    
    checkDuplicates();
  }, [memeData]);

  // Generate preview URLs for all files
  React.useEffect(() => {
    memeData.forEach((item, index) => {
      if (!item.previewUrl) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMemeData(prev => prev.map((data, i) => 
            i === index ? { ...data, previewUrl: e.target.result } : data
          ));
        };
        reader.readAsDataURL(item.file);
      }
    });
  }, [files, memeData]);

  const handleInputChange = (index, field, value) => {
    setMemeData(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const handleSuggestTitle = (index) => {
    const newTitle = suggestTitle(memeData[index].file.name);
    setMemeData(prev => prev.map((item, i) => 
      i === index ? { ...item, title: newTitle } : item
    ));
  };

  const handleSuggestAllTitles = () => {
    setMemeData(prev => prev.map(item => ({
      ...item,
      title: suggestTitle(item.file.name)
    })));
  };

  const handleSaveAll = async () => {
    // Filter out duplicates
    const validEntries = memeData.filter(item => !item.isDuplicate);
    
    if (validEntries.length === 0) {
      showToast('No valid images to upload (all are duplicates)', 'error');
      return;
    }
    
    // Validate all entries have titles
    const invalidEntries = validEntries.filter(item => !item.title.trim());
    if (invalidEntries.length > 0) {
      showToast('Please provide titles for all images', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress({});

    try {
      const results = [];
      
      for (let i = 0; i < validEntries.length; i++) {
        const item = validEntries[i];
        const originalIndex = memeData.findIndex(m => m.file === item.file);
        setUploadProgress(prev => ({ ...prev, [originalIndex]: 'uploading' }));

        try {
          // Generate unique ID for the meme
          const memeId = Date.now().toString() + '-' + i;
          
          // Upload image to Firebase Storage
          const imageUrl = await uploadImageToFirebase(item.file, memeId);
          
          // Prepare meme data
          const keywordArray = item.keywords.split(',').map(k => k.trim()).filter(k => k);
          const memeDataObj = {
            title: item.title.trim(),
            keywords: keywordArray,
            imageUrl,
            fileName: item.file.name,
            fileSize: item.file.size,
            createdAt: new Date().toISOString()
          };
          
          // Save to Firestore
          const savedMeme = await addMemeToFirebase(memeDataObj);
          results.push(savedMeme);
          
          setUploadProgress(prev => ({ ...prev, [originalIndex]: 'success' }));
          
        } catch (error) {
          console.error(`Failed to upload ${item.file.name}:`, error);
          
          // Fallback to localStorage
          const reader = new FileReader();
          reader.onload = (e) => {
            const keywordArray = item.keywords.split(',').map(k => k.trim()).filter(k => k);
            const fallbackMeme = {
              id: Date.now().toString() + '-' + i,
              title: item.title.trim(),
              keywords: keywordArray,
              imageUrl: e.target.result,
              fileName: item.file.name,
              fileSize: item.file.size,
              createdAt: new Date().toISOString()
            };
            
            // Save to localStorage
            const existingMemes = JSON.parse(localStorage.getItem('memes') || '[]');
            const updatedMemes = [fallbackMeme, ...existingMemes];
            localStorage.setItem('memes', JSON.stringify(updatedMemes));
            
            results.push(fallbackMeme);
            setUploadProgress(prev => ({ ...prev, [originalIndex]: 'local' }));
          };
          reader.readAsDataURL(item.file);
        }
      }

      // Update parent component with all new memes
      results.forEach(meme => onAddMeme(meme));
      
      showToast(`Successfully uploaded ${results.length} memes!`, 'success');
      onClose();
      
    } catch (error) {
      console.error('Bulk upload failed:', error);
      showToast('Some uploads failed. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  const getProgressStatus = (index) => {
    const status = uploadProgress[index];
    if (!status) return null;
    
    switch (status) {
      case 'uploading':
        return <div className="progress-spinner" />;
      case 'success':
        return <div className="progress-success">✓</div>;
      case 'local':
        return <div className="progress-local">💾</div>;
      default:
        return null;
    }
  };

  return (
    <div className="bulk-upload-page">
      <div className="page-header">
        <button className="close-button" onClick={onClose} disabled={isUploading}>
          <X size={24} />
        </button>
        <h1>Bulk Upload Memes</h1>
        <button 
          className="suggest-all-button"
          onClick={handleSuggestAllTitles}
          disabled={isUploading}
          title="Suggest better titles for all memes"
        >
          <Sparkles size={20} />
          <span>Suggest All Titles</span>
        </button>
      </div>
      
      <div className="page-content">
        <div className="upload-summary">
          <Upload size={20} />
          <span>{files.length} images selected</span>
        </div>
        
        {duplicateCount > 0 && (
          <div className="duplicate-warning">
            <AlertTriangle size={20} />
            <span>{duplicateCount} duplicate image(s) detected and will be skipped</span>
          </div>
        )}
        
        <div className="meme-list">
          {memeData.map((item, index) => (
            <div key={index} className={`meme-item ${item.isDuplicate ? 'duplicate' : ''}`}>
              <div className="meme-preview">
                {item.previewUrl && (
                  <img src={item.previewUrl} alt={item.file.name} />
                )}
                <div className="file-info">
                  <div className="file-name">{item.file.name}</div>
                  <div className="file-size">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                {item.isDuplicate && (
                  <div className="duplicate-indicator">DUPLICATE</div>
                )}
                {getProgressStatus(index)}
              </div>
              
              <div className="meme-inputs">
                <div className="input-group">
                  <label>Title</label>
                  <div className="title-input-container">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => handleInputChange(index, 'title', e.target.value)}
                      placeholder="Enter meme title"
                      disabled={isUploading || item.isDuplicate}
                      className="title-input"
                    />
                    <button
                      type="button"
                      onClick={() => handleSuggestTitle(index)}
                      disabled={isUploading || item.isDuplicate}
                      className="suggest-title-button"
                      title="Suggest a better title"
                    >
                      <Sparkles size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="input-group">
                  <label>Keywords</label>
                  <input
                    type="text"
                    value={item.keywords}
                    onChange={(e) => handleInputChange(index, 'keywords', e.target.value)}
                    placeholder="Enter keywords separated by commas"
                    disabled={isUploading || item.isDuplicate}
                    className="keywords-input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="page-footer">
        <button 
          className="cancel-button" 
          onClick={onClose}
          disabled={isUploading}
        >
          Cancel
        </button>
        <button 
          className="save-all-button"
          onClick={handleSaveAll}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <div className="button-spinner" />
              Uploading...
            </>
          ) : (
            <>
              <Save size={16} />
              Save All ({files.length - duplicateCount})
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default BulkUploadModal; 