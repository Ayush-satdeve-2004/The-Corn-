import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUserPosts, getLikedPosts, getSavedPosts, deleteAccount, resetPassword, sendEmailOTP, verifyEmailOTP,
  getFriends, deletePost, updateProfile, submitFeedback
} from '../services/api';
import FullscreenViewer from '../components/FullscreenViewer';
import Toast from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

function getTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function enrichPost(post) {
  return { ...post, timeAgo: getTimeAgo(post.timestamp) };
}

export default function Profile() {
  const { user, logout, updateUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  const profileMemory = window.__CORN_PROFILE_CACHE__?.[user?.id] || null;

  const [activeTab, setActiveTab] = useState('posts');
  const [tabData, setTabData] = useState(profileMemory?.tabData || { posts: [], liked: [], saved: [] });
  const [friendCount, setFriendCount] = useState(profileMemory?.friendCount || 0);
  const [showAllMap, setShowAllMap] = useState({ posts: false, liked: false, saved: false });
  const [viewerState, setViewerState] = useState({ open: false, index: 0, posts: [] });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  // Edit Profile Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: user?.fullName || '', bio: user?.bio || '', avatar: user?.avatar || '' });
  const [editLoading, setEditLoading] = useState(false);
  const avatarFileRef = React.useRef(null);

  const handleAvatarFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditForm(f => ({ ...f, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Reset Password Modal
  const [resetOpen, setResetOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetOtp, setResetOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // App Feedback Modal
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState('General Feedback');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      showToast('Please enter your feedback message', 'error');
      return;
    }
    setFeedbackSubmitting(true);
    try {
      const res = await submitFeedback({
        userId: user.id,
        userEmail: user.email || '',
        userName: user.fullName || user.username,
        category: feedbackCategory,
        rating: feedbackRating,
        message: feedbackText
      });
      if (res && res.success) {
        showToast('Thank you! Your feedback has been submitted.', 'success');
        setFeedbackOpen(false);
        setFeedbackText('');
        setFeedbackRating(5);
      } else {
        showToast(res?.message || 'Failed to submit feedback', 'error');
      }
    } catch (err) {
      showToast('Failed to submit feedback', 'error');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const loadTabData = useCallback(async () => {
    if (!user) return;
    try {
      const [postsRes, likedRes, savedRes, friendsRes] = await Promise.all([
        getUserPosts(user.id),
        getLikedPosts(user.id),
        getSavedPosts(user.id),
        getFriends(user.id)
      ]);

      const newTabData = {
        posts: (postsRes || []).map(enrichPost),
        liked: (likedRes || []).map(enrichPost),
        saved: (savedRes || []).map(enrichPost),
      };

      const newFriendCount = (friendsRes || []).length;

      window.__CORN_PROFILE_CACHE__ = window.__CORN_PROFILE_CACHE__ || {};
      window.__CORN_PROFILE_CACHE__[user.id] = { tabData: newTabData, friendCount: newFriendCount };

      setTabData(newTabData);
      setFriendCount(newFriendCount);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  const handleDeletePost = async (postId) => {
    await deletePost(postId);
    setViewerState(v => ({ ...v, open: false }));
    loadTabData();
    showToast('Post deleted', 'info');
  };

  const openViewer = (posts, index) => {
    setViewerState({ open: true, index, posts });
  };

  const closeViewer = () => setViewerState(v => ({ ...v, open: false }));

  const handleEditSave = async () => {
    setEditLoading(true);
    try {
      const res = await updateUser({
        fullName: editForm.fullName,
        bio: editForm.bio,
        avatar: editForm.avatar
      });
      if (res.success) {
        showToast('Profile updated!', 'success');
        setEditOpen(false);
        loadTabData();
      } else {
        showToast(res.message || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // Reset Password
  const handleSendOtp = async () => {
    setResetLoading(true);
    const result = await sendEmailOTP(user.email);
    setResetLoading(false);
    if (result.success) {
      setSentOtp(result.otp || '');
      setResetOtp(''); // User enters real OTP received in email
      showToast(`Verification code sent to ${user.email}`, 'info');
      setResetStep(2);
    } else {
      showToast(result.message || 'Failed to send OTP', 'error');
    }
  };

  const handleVerifyOtp = async () => {
    const enteredOtp = resetOtp ? resetOtp.trim() : '';
    if (!enteredOtp) {
      showToast('Please enter the 6-digit OTP', 'error');
      return;
    }
    if (sentOtp && enteredOtp === sentOtp) {
      setResetStep(3);
      return;
    }
    setResetLoading(true);
    const res = await verifyEmailOTP(user.email, enteredOtp);
    setResetLoading(false);
    if (res.success) {
      setResetStep(3);
    } else {
      showToast('Invalid or expired OTP', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    if (newPassword !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }
    setResetLoading(true);
    try {
      await resetPassword(user.id, newPassword);
      showToast('Password reset successfully!', 'success');
      setResetOpen(false);
      setResetStep(1);
      setResetOtp('');
      setSentOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast('Failed to reset password. Try again.', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    await deleteAccount(user.id);
    logout();
  };

  if (!user) return null;

  const avatarSrc = user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'U')}&background=8B5324&color=fff&size=150`;

  const renderGrid = (items, tabName) => {
    if (items.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <p>Nothing here yet</p>
        </div>
      );
    }

    const isExpanded = showAllMap[tabName];
    const displayItems = isExpanded ? items : items.slice(0, 3);
    const hasMore = items.length > 3;

    return (
      <div className="profile-grid-wrapper">
        <div className="profile-grid">
          {displayItems.map((post, idx) => (
            <div key={post.id} className="grid-item" onClick={() => openViewer(items, idx)}>
              {post.type === 'photo' && (
                <img src={post.mediaUrl} alt="Post" />
              )}
              {post.type === 'video' && (
                <div className="video-thumb-wrap">
                  <video src={post.mediaUrl} />
                  <span className="play-overlay">PLAY</span>
                </div>
              )}
              {post.type === 'text' && (
                <div className="text-thumb">
                  <p>{(post.content || '').slice(0, 60)}{post.content?.length > 60 ? '...' : ''}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {hasMore && (
          <div className="show-more-wrap">
            <button
              className="btn-show-more"
              onClick={() => setShowAllMap(prev => ({ ...prev, [tabName]: !isExpanded }))}
            >
              {isExpanded ? 'Show Less' : `Show More (${items.length - 3} more)`}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-top-row">
          <div
            className="profile-avatar-wrap clickable-avatar"
            onClick={() => { setEditForm({ fullName: user.fullName, bio: user.bio || '', avatar: user.avatar || '' }); setEditOpen(true); }}
            title="Click to edit profile picture"
          >
            <img
              src={avatarSrc}
              alt={user.fullName}
              className="profile-avatar-img"
              onError={e => { e.target.src = `https://ui-avatars.com/api/?name=U&background=8B5324&color=fff&size=150`; }}
            />
            <div className="avatar-camera-badge">Edit</div>
          </div>
          <div className="profile-stats-row">
            <div className="stat-box">
              <span className="stat-number">{tabData.posts.length}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{friendCount}</span>
              <span className="stat-label">Friends</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{tabData.liked.length}</span>
              <span className="stat-label">Liked</span>
            </div>
          </div>
        </div>

        <div className="profile-bio-section">
          {isAdmin && <span className="admin-badge">Admin</span>}
          <h2 className="profile-fullname">{user.fullName}</h2>
          <p className="profile-username">@{user.username}</p>
          {user.bio && <p className="profile-bio">{user.bio}</p>}
          <button className="btn-secondary edit-profile-btn" onClick={() => { setEditForm({ fullName: user.fullName, bio: user.bio || '', avatar: user.avatar || '' }); setEditOpen(true); }}>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs-bar">
        {['posts', 'liked', 'saved'].map(tab => (
          <button
            key={tab}
            className={`ptab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'posts' && (
              <svg viewBox="0 0 24 24" fill={activeTab === tab ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="20" height="20">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            )}
            {tab === 'liked' && (
              <svg viewBox="0 0 24 24" fill={activeTab === tab ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            )}
            {tab === 'saved' && (
              <svg viewBox="0 0 24 24" fill={activeTab === tab ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="profile-tab-content">
        {activeTab === 'posts' && renderGrid(tabData.posts, 'posts')}
        {activeTab === 'liked' && renderGrid(tabData.liked, 'liked')}
        {activeTab === 'saved' && renderGrid(tabData.saved, 'saved')}
      </div>

      {/* Settings Section */}
      <div className="settings-section">
        <h3 className="settings-heading">ACCOUNT</h3>
        <div className="settings-list">
          {!isAdmin && (
            <button className="settings-row" onClick={() => setFeedbackOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Give App Feedback
            </button>
          )}
          <button className="settings-row" onClick={() => { setResetStep(1); setResetOpen(true); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Reset Password
          </button>
          {isAdmin && (
            <button className="settings-row" onClick={() => navigate('/admin')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Admin Panel
            </button>
          )}
          <button className="settings-row" onClick={logout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
          <button className="settings-row danger" onClick={() => setDeleteConfirm(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
            </svg>
            Delete Account
          </button>
        </div>
        <p className="app-version">The Corn v1.0.0</p>
      </div>

      {/* App Feedback Modal */}
      {feedbackOpen && (
        <div className="modal-overlay" onClick={() => setFeedbackOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>App Feedback & Suggestions</h3>
            <p className="modal-desc">Help us improve The Corn! Share your feedback, feature requests, or report issues.</p>
            
            <div className="form-group">
              <label>Feedback Category</label>
              <select
                className="input-field"
                value={feedbackCategory}
                onChange={e => setFeedbackCategory(e.target.value)}
              >
                <option value="General Feedback">General Feedback</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Bug Report">Bug Report</option>
                <option value="Performance & Speed">Performance & Speed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Rating (1 - 5 Stars)</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    style={{
                      background: feedbackRating >= star ? '#8B5324' : 'var(--sage-light)',
                      color: feedbackRating >= star ? '#FFF' : '#36190D',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    {star} ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Your Message / Ideas</label>
              <textarea
                className="input-field"
                rows={4}
                maxLength={1000}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Tell us what you love or what we should improve..."
              />
              <span className="char-count">{feedbackText.length}/1000</span>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setFeedbackOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmitFeedback} disabled={feedbackSubmitting}>
                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Edit Profile</h3>

            {/* Avatar Upload / Reset Section */}
            <div className="edit-avatar-section">
              <div className="edit-avatar-preview">
                <img
                  src={editForm.avatar || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%238B5324"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="%23FFFFFF">${(editForm.fullName?.[0] || 'U').toUpperCase()}</text></svg>`}
                  alt="Preview"
                  onError={e => { e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%238B5324"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="%23FFFFFF">U</text></svg>`; }}
                />
              </div>
              <div className="edit-avatar-actions">
                <button type="button" className="btn-secondary btn-sm" onClick={() => avatarFileRef.current?.click()}>
                  Upload Photo
                </button>
                {editForm.avatar && (
                  <button type="button" className="btn-danger-outline btn-sm" onClick={() => setEditForm(f => ({ ...f, avatar: '' }))}>
                    Reset Photo
                  </button>
                )}
                <input
                  ref={avatarFileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleAvatarFile(e.target.files[0])}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Full Name</label>
              <input className="input-field" value={editForm.fullName}
                onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea className="input-field" rows={3} maxLength={150} value={editForm.bio}
                onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Tell people about yourself..." />
              <span className="char-count">{editForm.bio.length}/150</span>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleEditSave} disabled={editLoading}>
                {editLoading ? '…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetOpen && (
        <div className="modal-overlay" onClick={() => setResetOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Reset Password</h3>
            {resetStep === 1 && (
              <>
                <p className="modal-desc">We'll send an OTP to <strong>{user.email}</strong></p>
                <button className="btn-primary" onClick={handleSendOtp} disabled={resetLoading}>
                  {resetLoading ? 'Sending…' : 'Send OTP'}
                </button>
              </>
            )}
            {resetStep === 2 && (
              <>
                <p className="modal-desc">Enter the 6-digit OTP sent to your email</p>
                <input className="input-field" placeholder="Enter OTP" value={resetOtp}
                  onChange={e => setResetOtp(e.target.value)} maxLength={6} />
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setResetStep(1)}>Back</button>
                  <button className="btn-primary" onClick={handleVerifyOtp}>Verify</button>
                </div>
              </>
            )}
            {resetStep === 3 && (
              <>
                <p className="modal-desc">Enter your new password</p>
                <input className="input-field" type="password" placeholder="New password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} />
                <input className="input-field" type="password" placeholder="Confirm password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} style={{ marginTop: '0.5rem' }} />
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={() => setResetOpen(false)}>Cancel</button>
                  <button className="btn-primary" onClick={handleResetPassword}>Reset</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Delete Account</h3>
            <p className="modal-desc">This will permanently delete your account and all your posts. This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteAccount}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Viewer */}
      {viewerState.open && (
        <FullscreenViewer
          posts={viewerState.posts}
          initialIndex={viewerState.index}
          currentUser={user}
          onClose={closeViewer}
          onDelete={handleDeletePost}
        />
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible}
        onClose={() => setToast(t => ({ ...t, visible: false }))} />
    </div>
  );
}
