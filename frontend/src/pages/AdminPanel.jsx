import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getPendingAccounts, getActiveUsers, approveUser, rejectUser,
  deleteUserByAdmin, getFeed, deletePost, getUserById
} from '../services/api';
import Toast from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

import AdminAnalytics from '../components/AdminAnalytics';

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'pending' | 'active' | 'posts'
  const [pendingUsers, setPendingUsers] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [postFilter, setPostFilter] = useState('all'); // 'all' | 'photo' | 'video' | 'text'
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, activeRes, rawPosts] = await Promise.all([
        getPendingAccounts(),
        getActiveUsers(),
        getFeed()
      ]);
      setPendingUsers(pendingRes || []);
      setActiveUsers(activeRes || []);

      // Enrich posts with user details
      const userCache = {};
      const enriched = await Promise.all(
        (rawPosts || []).map(async p => {
          if (!userCache[p.userId]) {
            userCache[p.userId] = await getUserById(p.userId);
          }
          const author = userCache[p.userId];
          return {
            ...p,
            authorName: author?.fullName || 'User',
            authorUsername: author?.username || 'user',
            authorAvatar: author?.avatar || '',
          };
        })
      );
      setAllPosts(enriched);
    } catch (err) {
      console.error(err);
      showToast('Error loading admin data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      showToast('Access denied: Admins only', 'error');
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate, loadData]);

  const handleApprove = async (id) => {
    try {
      await approveUser(id);
      showToast('User approved successfully', 'success');
      loadData();
    } catch (err) {
      showToast('Failed to approve user', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectUser(id);
      showToast('User rejected', 'info');
      loadData();
    } catch (err) {
      showToast('Failed to reject user', 'error');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}'s account and all their posts?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await deleteUserByAdmin(id);
      if (res && res.success) {
        showToast(`User ${name} deleted`, 'success');
        loadData();
      }
    } catch (err) {
      showToast('Failed to delete user', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeletePostAdmin = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setDeletingPostId(postId);
    try {
      await deletePost(postId, user.id);
      showToast('Post deleted successfully', 'success');
      setAllPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      showToast('Failed to delete post', 'error');
    } finally {
      setDeletingPostId(null);
    }
  };

  const filteredPosts = allPosts.filter(p => {
    if (postFilter === 'all') return true;
    return p.type === postFilter;
  });

  return (
    <div className="admin-container">
      <header className="admin-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          ← Back
        </button>
        <h1>Admin Control Panel</h1>
      </header>

      {/* Admin Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics & Graphs
        </button>
        <button
          className={`admin-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingUsers.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Users ({activeUsers.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Manage Posts ({allPosts.length})
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : activeTab === 'analytics' ? (
          <AdminAnalytics posts={allPosts} users={activeUsers} />
        ) : activeTab === 'pending' ? (
          /* Pending Users List */
          pendingUsers.length === 0 ? (
            <div className="admin-empty">
              <div style={{ fontSize: '3rem' }}>🎉</div>
              <h3>No pending approvals</h3>
              <p>All user registration requests have been processed.</p>
            </div>
          ) : (
            <div className="pending-list">
              {pendingUsers.map(u => (
                <div key={u.id} className="admin-user-card">
                  <div className="admin-user-info">
                    <div className="admin-user-avatar">
                      {u.fullName?.[0] || 'U'}
                    </div>
                    <div>
                      <h4 className="admin-user-name">{u.fullName}</h4>
                      <p className="admin-user-detail">📧 {u.email}</p>
                      <p className="admin-user-detail">📱 {u.mobile}</p>
                    </div>
                  </div>
                  <div className="admin-actions">
                    <button className="btn-approve" onClick={() => handleApprove(u.id)}>
                      Approve ✓
                    </button>
                    <button className="btn-reject" onClick={() => handleReject(u.id)}>
                      Reject ✗
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'active' ? (
          /* Active Users List */
          activeUsers.length === 0 ? (
            <div className="admin-empty">
              <div style={{ fontSize: '3rem' }}>👥</div>
              <h3>No active users found</h3>
              <p>Approved active users will appear here.</p>
            </div>
          ) : (
            <div className="pending-list">
              {activeUsers.map(u => (
                <div key={u.id} className="admin-user-card">
                  <div className="admin-user-info">
                    <div className="admin-user-avatar" style={{ background: 'var(--sage-dark)' }}>
                      {u.fullName?.[0] || 'U'}
                    </div>
                    <div>
                      <h4 className="admin-user-name">
                        {u.fullName} {u.role === 'ADMIN' && <span className="admin-badge">ADMIN</span>}
                      </h4>
                      <p className="admin-user-detail">👤 @{u.username}</p>
                      <p className="admin-user-detail">📧 {u.email}</p>
                      <p className="admin-user-detail">📱 {u.mobile}</p>
                    </div>
                  </div>
                  <div className="admin-actions">
                    {u.id !== user?.id ? (
                      <button
                        className="btn-reject"
                        onClick={() => handleDeleteUser(u.id, u.fullName)}
                        disabled={deletingId === u.id}
                        style={{ backgroundColor: '#c0392b', color: '#fff' }}
                      >
                        {deletingId === u.id ? 'Deleting...' : 'Delete Account 🗑️'}
                      </button>
                    ) : (
                      <span className="current-user-badge">You (Admin)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Manage User Posts Section */
          <div>
            {/* Filter Bar */}
            <div className="admin-filter-bar">
              <button
                className={`filter-chip ${postFilter === 'all' ? 'active' : ''}`}
                onClick={() => setPostFilter('all')}
              >
                All ({allPosts.length})
              </button>
              <button
                className={`filter-chip ${postFilter === 'photo' ? 'active' : ''}`}
                onClick={() => setPostFilter('photo')}
              >
                Photos 📷 ({allPosts.filter(p => p.type === 'photo').length})
              </button>
              <button
                className={`filter-chip ${postFilter === 'video' ? 'active' : ''}`}
                onClick={() => setPostFilter('video')}
              >
                Videos 🎥 ({allPosts.filter(p => p.type === 'video').length})
              </button>
              <button
                className={`filter-chip ${postFilter === 'text' ? 'active' : ''}`}
                onClick={() => setPostFilter('text')}
              >
                Text 📝 ({allPosts.filter(p => p.type === 'text').length})
              </button>
            </div>

            {filteredPosts.length === 0 ? (
              <div className="admin-empty">
                <div style={{ fontSize: '3rem' }}>🖼️</div>
                <h3>No posts found</h3>
                <p>No user posts matching the selected filter.</p>
              </div>
            ) : (
              <div className="admin-posts-list">
                {filteredPosts.map(p => (
                  <div key={p.id} className="admin-post-card">
                    <div className="admin-post-preview">
                      {p.type === 'photo' && p.mediaUrl && (
                        <img src={p.mediaUrl} alt="Preview" className="admin-media-thumb" />
                      )}
                      {p.type === 'video' && p.mediaUrl && (
                        <video src={p.mediaUrl} className="admin-media-thumb" />
                      )}
                      {p.type === 'text' && (
                        <div className="admin-text-thumb">
                          "{p.content}"
                        </div>
                      )}
                    </div>

                    <div className="admin-post-details">
                      <div className="admin-post-header">
                        <span className="admin-author-name">{p.authorName}</span>
                        <span className="admin-author-handle">@{p.authorUsername}</span>
                        <span className={`post-type-tag ${p.type}`}>
                          {p.type.toUpperCase()}
                        </span>
                      </div>

                      {p.caption && <p className="admin-post-caption">{p.caption}</p>}
                      {p.type === 'text' && p.content && (
                        <p className="admin-post-caption">"{p.content}"</p>
                      )}

                      <p className="admin-post-meta">
                        ❤️ {p.likes?.length || 0} Likes · 💬 {p.comments?.length || 0} Comments
                      </p>
                    </div>

                    <div className="admin-post-actions">
                      <button
                        className="btn-reject"
                        onClick={() => handleDeletePost(p.id)}
                        disabled={deletingPostId === p.id}
                        style={{ backgroundColor: '#c0392b', color: '#ffffff' }}
                      >
                        {deletingPostId === p.id ? 'Deleting...' : 'Delete Post 🗑️'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible}
        onClose={() => setToast(t => ({ ...t, visible: false }))} />
    </div>
  );
}
