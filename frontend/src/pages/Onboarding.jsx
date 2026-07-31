import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkUsernameAvailable } from '../services/mockBackend';
import './Onboarding.css';

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | checking | available | taken
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Debounced username availability check against real backend
  useEffect(() => {
    if (!username.trim() || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const timer = setTimeout(() => {
      const available = checkUsernameAvailable(username);
      setUsernameStatus(available ? 'available' : 'taken');
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image too large (max 2MB)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSkip = () => {
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=8B5324&color=fff&size=150`;
    setAvatarPreview(defaultAvatar);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) { setError('Username is required'); return; }
    if (username.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (usernameStatus === 'taken') { setError('That username is already taken'); return; }
    if (usernameStatus === 'checking') { return; }

    setLoading(true);
    const avatar = avatarPreview ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=8B5324&color=fff&size=150`;

    const result = await updateUser({ username, bio, avatar });
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Setup failed. Please try again.');
    }
  };

  const displayName = user?.fullName?.split(' ')[0] || 'Friend';

  return (
    <div className="onboarding-bg">
      <div className="onboarding-blob ob-1" />
      <div className="onboarding-blob ob-2" />

      <div className="onboarding-card fade-in">
        <div className="onboarding-logo">🌽</div>
        <h1 className="onboarding-title">Welcome, {displayName}!</h1>
        <p className="onboarding-sub">Let's set up your profile to get started</p>

        <form onSubmit={handleSubmit}>
          {/* Avatar Upload */}
          <div className="avatar-upload-section">
            <div
              className="avatar-upload-circle"
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload photo"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="avatar-preview-img" />
              ) : (
                <div className="avatar-placeholder-upload">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Add Photo</span>
                </div>
              )}
              <div className="avatar-upload-badge">+</div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            {!avatarPreview && (
              <button type="button" className="btn-ghost skip-avatar-btn" onClick={handleSkip}>
                Skip for now
              </button>
            )}
            {avatarPreview && (
              <button type="button" className="btn-ghost skip-avatar-btn" onClick={() => setAvatarPreview('')}>
                Change photo
              </button>
            )}
          </div>

          {/* Username */}
          <div className="form-group">
            <label htmlFor="ob-username">Choose your username *</label>
            <div className="username-input-wrap">
              <span className="username-at">@</span>
              <input
                id="ob-username"
                type="text"
                className={`input-field username-input ${usernameStatus === 'taken' ? 'input-error' : usernameStatus === 'available' ? 'input-success' : ''}`}
                placeholder="your_username"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
              />
              <div className="username-status">
                {usernameStatus === 'checking' && <span className="spinner-sm" />}
                {usernameStatus === 'available' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" width="20" height="20">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                {usernameStatus === 'taken' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="3" width="20" height="20">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
              </div>
            </div>
            {usernameStatus === 'taken' && <p className="field-error">Username is taken</p>}
            {usernameStatus === 'available' && <p className="field-success">Username is available!</p>}
            <p className="field-hint">Only letters, numbers, underscores. Min 3 chars.</p>
          </div>

          {/* Bio */}
          <div className="form-group">
            <label htmlFor="ob-bio">Bio <span className="optional-tag">(optional)</span></label>
            <textarea
              id="ob-bio"
              className="input-field"
              placeholder="Tell people a little about yourself…"
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              maxLength={150}
            />
            <span className="char-count">{bio.length}/150</span>
          </div>

          {error && <div className="onboarding-error shake">{error}</div>}

          <button
            type="submit"
            className="btn-primary ob-submit-btn"
            disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking' || !username.trim()}
          >
            {loading ? <span className="spinner-sm" /> : 'Complete Setup 🌽'}
          </button>
        </form>
      </div>
    </div>
  );
}
