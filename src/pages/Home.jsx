import React, { useState, useEffect, useCallback } from 'react';
import {
  getFeed, likePost, commentOnPost, deleteComment, savePost, deletePost, getUserById,
  getFriends
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import FeedCard from '../components/FeedCard';
import FullscreenViewer from '../components/FullscreenViewer';
import CommentsDrawer from '../components/CommentsDrawer';
import ShareModal from '../components/ShareModal';
import Toast from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import './Home.css';

import { useUpload } from '../context/UploadContext';

function getTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const CACHED_FEED_KEY = 'thecorn_feed_cache';

export default function Home() {
  const { user } = useAuth();
  const { activeUpload } = useUpload();
  const navigate = useNavigate();

  const initialCachedEnriched = (() => {
    try {
      const cached = localStorage.getItem(CACHED_FEED_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  })();

  const [posts, setPosts] = useState([]);
  const [enrichedPosts, setEnrichedPosts] = useState(initialCachedEnriched);
  const [isLoading, setIsLoading] = useState(initialCachedEnriched.length === 0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePostId, setSharePostId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const loadFeed = useCallback(async () => {
    try {
      const rawPosts = await getFeed();
      const userCache = {};
      const enriched = await Promise.all(
        rawPosts.map(async post => {
          if (!userCache[post.userId]) {
            userCache[post.userId] = await getUserById(post.userId);
          }
          const author = userCache[post.userId];
          return {
            ...post,
            authorName: author?.fullName || 'Anonymous',
            authorUsername: author?.username || 'user',
            authorAvatar: author?.avatar || '',
            timeAgo: getTimeAgo(post.timestamp),
          };
        })
      );
      setPosts(rawPosts);
      setEnrichedPosts(enriched);

      try {
        localStorage.setItem(CACHED_FEED_KEY, JSON.stringify(enriched));
      } catch {}

      if (user) {
        const f = await getFriends(user.id);
        setFriends(f);
      }
    } catch (err) {
      console.error('Error loading feed:', err);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    loadFeed().finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, [loadFeed]);

  // Refresh feed automatically when a background upload completes
  useEffect(() => {
    if (activeUpload?.status === 'done') {
      loadFeed();
    }
  }, [activeUpload?.status, loadFeed]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFeed();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleLike = async (postId) => {
    if (!user) return;
    await likePost(postId, user.id);
    loadFeed();
  };

  const handleSave = async (postId) => {
    if (!user) return;
    await savePost(postId, user.id);
    loadFeed();
    showToast('Post saved!', 'success');
  };

  const handleOpenComments = (postId) => {
    setCommentsPostId(postId);
    setCommentsOpen(true);
  };

  const handleAddComment = async (postId, text) => {
    if (!user) return;
    await commentOnPost(postId, user.id, text);
    loadFeed();
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!user) return;
    const res = await deleteComment(postId, commentId, user.id);
    if (res && res.success) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: res.comments } : p));
      showToast('Comment deleted', 'info');
    }
  };

  const handleShare = (postId) => {
    setSharePostId(postId);
    setShareOpen(true);
  };

  const handleDeletePost = async (postId) => {
    if (!user) return;
    await deletePost(postId);
    loadFeed();
    showToast('Post deleted', 'info');
  };

  const handlePostClick = (index) => {
    setSelectedPostIndex(index);
    setViewerOpen(true);
  };

  const commentsForPost = commentsPostId
    ? (posts.find(p => p.id === commentsPostId)?.comments || [])
    : [];

  return (
    <div className="home-container">
      {/* Header */}
      <header className="home-header">
        <h1 className="home-logo">🌽 The Corn</h1>
        <button
          className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
          onClick={handleRefresh}
          aria-label="Refresh feed"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </header>

      {/* Feed */}
      <div className="feed-container">
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : enrichedPosts.length > 0 ? (
          <>
            {enrichedPosts.map((post, index) => (
              <FeedCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
                onLike={handleLike}
                onComment={handleOpenComments}
                onSave={handleSave}
                onShare={handleShare}
                onDelete={handleDeletePost}
                onClick={() => handlePostClick(index)}
              />
            ))}
            <div className="feed-bottom-spacer" style={{ height: '28px', minHeight: '28px', width: '100%' }} />
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h2>No posts yet</h2>
            <p>Be the first to post or find some friends!</p>
            <button className="btn-primary" onClick={() => navigate('/friends')}>
              Find Friends
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Viewer */}
      {viewerOpen && selectedPostIndex !== null && (
        <FullscreenViewer
          posts={enrichedPosts}
          initialIndex={selectedPostIndex}
          currentUser={user}
          onClose={() => { setViewerOpen(false); setSelectedPostIndex(null); }}
          onLike={handleLike}
          onComment={handleOpenComments}
          onSave={handleSave}
          onShare={handleShare}
        />
      )}

      {/* Comments Drawer */}
      <CommentsDrawer
        isOpen={commentsOpen}
        postId={commentsPostId}
        postOwnerId={posts.find(p => p.id === commentsPostId)?.userId}
        comments={commentsForPost}
        currentUser={user}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        onClose={() => setCommentsOpen(false)}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={shareOpen}
        postId={sharePostId}
        friends={friends}
        currentUserId={user?.id}
        onClose={() => setShareOpen(false)}
        onShare={() => showToast('Post shared!', 'success')}
      />

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast(t => ({ ...t, visible: false }))}
      />
    </div>
  );
}
