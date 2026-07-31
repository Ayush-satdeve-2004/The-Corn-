import React, { useState, useRef } from 'react';
import { createPost, uploadMedia } from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import './CreatePost.css';

const GRADIENTS = [
  { id: 'gradient1', label: 'Sunset', bg: 'linear-gradient(135deg, #8B5324, #966236)' },
  { id: 'gradient2', label: 'Night', bg: 'linear-gradient(135deg, #36190D, #8B5324)' },
  { id: 'gradient3', label: 'Forest', bg: 'linear-gradient(135deg, #9CA886, #8FA075)' },
  { id: 'gradient4', label: 'Ocean', bg: 'linear-gradient(135deg, #5b8fb9, #3b4f73)' },
  { id: 'gradient5', label: 'Berry', bg: 'linear-gradient(135deg, #7b4f9e, #c06c84)' },
];

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [postType, setPostType] = useState('photo');
  const [mediaPreview, setMediaPreview] = useState(null); // object URL for preview
  const [mediaFile, setMediaFile] = useState(null);       // actual File object for upload
  const [caption, setCaption] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [published, setPublished] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const handleFile = (file) => {
    if (!file) return;

    const isAdmin = user?.role === 'ADMIN';
    const maxVideoSize = isAdmin ? 1024 * 1024 * 1024 : 500 * 1024 * 1024; // 1 GB for ADMIN, 500 MB for regular users
    const maxPhotoSize = 50 * 1024 * 1024; // 50 MB for photos

    if (file.type.startsWith('video/') && file.size > maxVideoSize) {
      if (isAdmin) {
        showToast('Video exceeds Admin limit of 1 GB', 'error');
      } else {
        showToast('Regular users can upload videos up to 500 MB. Admin account required for 1 GB video uploads!', 'error');
      }
      return;
    }

    if (file.type.startsWith('image/') && file.size > maxPhotoSize) {
      showToast('Image file size exceeds 50 MB limit', 'error');
      return;
    }

    // Use URL.createObjectURL instead of FileReader — no memory issues with large files
    const previewUrl = URL.createObjectURL(file);

    // Revoke old preview URL to free memory
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
    }

    setMediaPreview(previewUrl);
    setMediaFile(file);
  };

  const handleFileInput = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handlePublish = async () => {
    if (!user) return;
    if (postType !== 'text' && !mediaFile) {
      showToast('Please select a file first', 'error');
      return;
    }
    if (postType === 'text' && !textContent.trim()) {
      showToast('Please enter some text', 'error');
      return;
    }

    setIsPublishing(true);
    setUploadProgress(0);

    try {
      let mediaUrl = '';

      // Upload media file to server if it's a photo or video
      if (postType !== 'text' && mediaFile) {
        setUploadProgress(10);
        const uploadResult = await uploadMedia(mediaFile);
        mediaUrl = uploadResult.url;
        setUploadProgress(80);
      }

      await createPost({
        userId: user.id,
        type: postType,
        content: postType === 'text' ? textContent : caption,
        caption: postType === 'text' ? '' : caption,
        mediaUrl: mediaUrl,
        gradient: postType === 'text' ? selectedGradient.id : null,
      });

      setUploadProgress(100);
      setIsPublishing(false);
      setPublished(true);

      // Clean up object URL
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);

      setTimeout(() => navigate('/'), 1800);
    } catch (err) {
      setIsPublishing(false);
      setUploadProgress(0);
      showToast('Failed to publish post. Please try again.', 'error');
      console.error('Publish error:', err);
    }
  };

  const reset = () => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    setMediaPreview(null);
    setMediaFile(null);
    setCaption('');
    setTextContent('');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (published) {
    return (
      <div className="create-success">
        <div className="success-corn">🌽</div>
        <h2>Posted!</h2>
        <p>Redirecting to feed…</p>
      </div>
    );
  }

  return (
    <div className="create-page">
      <header className="create-header">
        <h1>New Post</h1>
        <button
          className="btn-primary publish-btn"
          onClick={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? <span className="spinner-sm" /> : 'Share'}
        </button>
      </header>

      {/* Upload progress bar */}
      {isPublishing && uploadProgress > 0 && (
        <div className="upload-progress-bar">
          <div className="upload-progress-fill" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {/* Type selector */}
      <div className="post-type-tabs">
        {['photo', 'video', 'text'].map(type => (
          <button
            key={type}
            className={`type-tab ${postType === type ? 'active' : ''}`}
            onClick={() => { setPostType(type); reset(); }}
          >
            {type === 'photo' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            )}
            {type === 'video' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
            )}
            {type === 'text' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            )}
            <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
          </button>
        ))}
      </div>

      <div className="create-body">
        {/* Photo / Video upload */}
        {(postType === 'photo' || postType === 'video') && (
          <>
            {mediaPreview ? (
              <div className="media-preview-wrap">
                {postType === 'photo' ? (
                  <img src={mediaPreview} alt="Preview" className="media-preview-img" />
                ) : (
                  <video src={mediaPreview} controls className="media-preview-video" />
                )}
                <button className="remove-media-btn" onClick={reset}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                {mediaFile && (
                  <div className="file-size-badge">
                    {(mediaFile.size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="drop-zone-icon">
                  {postType === 'photo' ? '🖼️' : '🎬'}
                </div>
                <p className="drop-zone-main">Click or drag & drop</p>
                <p className="drop-zone-sub">
                  {postType === 'photo'
                    ? 'JPG, PNG, GIF, WebP (max 50 MB)'
                    : user?.role === 'ADMIN'
                    ? 'MP4, WebM, MOV (Admin limit: 1 GB)'
                    : 'MP4, WebM, MOV (User limit: 500 MB · Admin: 1 GB)'}
                </p>
                <button className="btn-secondary" type="button">Browse Files</button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={postType === 'photo' ? 'image/*' : 'video/*'}
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Caption (optional)</label>
              <textarea
                className="input-field caption-textarea"
                placeholder="Write a caption…"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <span className="char-count">{caption.length}/500</span>
            </div>
          </>
        )}

        {/* Text post */}
        {postType === 'text' && (
          <>
            {/* Directly Editable Gradient Canvas */}
            <div className="text-post-preview" style={{ background: selectedGradient.bg }}>
              <textarea
                className="text-post-canvas-textarea"
                placeholder="Start typing your post…"
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                maxLength={5000}
                style={{ color: selectedGradient.id === 'gradient3' ? '#2A1208' : '#FBF8EB' }}
                autoFocus
              />
            </div>
            <span className="char-count">{textContent.length}/5000</span>

            {/* Background picker */}
            <div className="gradient-picker">
              <p className="gradient-label">Background</p>
              <div className="gradient-options">
                {GRADIENTS.map(g => (
                  <button
                    key={g.id}
                    className={`gradient-swatch ${selectedGradient.id === g.id ? 'selected' : ''}`}
                    style={{ background: g.bg }}
                    onClick={() => setSelectedGradient(g)}
                    title={g.label}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible}
        onClose={() => setToast(t => ({ ...t, visible: false }))} />
    </div>
  );
}
