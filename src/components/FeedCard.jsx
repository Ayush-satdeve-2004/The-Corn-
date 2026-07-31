import React, { useState, useRef, useEffect, useCallback } from 'react';
import Watermark from './Watermark';
import { useAuth } from '../context/AuthContext';
import './FeedCard.css';

const TEXT_GRADIENTS = {
  gradient1: 'linear-gradient(135deg, #8B5324, #966236)',
  gradient2: 'linear-gradient(135deg, #36190D, #8B5324)',
  gradient3: 'linear-gradient(135deg, #9CA886, #8FA075)',
  gradient4: 'linear-gradient(135deg, #5b8fb9, #3b4f73)',
  gradient5: 'linear-gradient(135deg, #7b4f9e, #c06c84)',
  default: 'linear-gradient(135deg, #8B5324, #36190D)',
};

export default function FeedCard({ post, currentUserId, onLike, onComment, onSave, onShare, onDelete, onClick }) {
  const { user: currentUser } = useAuth();
  const isLiked = post?.likes?.includes(currentUserId) || false;
  const isSaved = post?.saves?.includes(currentUserId) || false;
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastTapRef = useRef(0);

  const isOwner = post.userId === currentUserId;

  const watermarkText = currentUser
    ? `${currentUser.email || ''} · ${currentUser.mobile || ''}`
    : `@${post.authorUsername || 'thecorn'} · The Corn`;

  const mediaWrapRef = useRef(null);
  const videoRef = useRef(null);

  const triggerHeartBurst = () => {
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 800);
  };

  const handleLike = (e) => {
    e.stopPropagation();
    if (!isLiked) triggerHeartBurst();
    if (onLike) onLike(post.id);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    if (onSave) onSave(post.id);
  };

  const handleComment = (e) => {
    e.stopPropagation();
    if (onComment) onComment(post.id);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (onShare) onShare(post.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this post?')) {
      if (onDelete) onDelete(post.id);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (!isLiked && onLike) onLike(post.id);
      triggerHeartBurst();
    }
    lastTapRef.current = now;
  };

  const handleCardClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  /* ---- Custom fullscreen toggle ---- */
  const toggleFullscreen = (e) => {
    e.stopPropagation();
    if (!mediaWrapRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      mediaWrapRef.current.requestFullscreen().catch(() => {});
    }
  };

  /* Listen for fullscreen changes so we can update the icon */
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const timeStr = post.timeAgo || 'recently';
  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;

  return (
    <article className="feed-card">
      {/* Header */}
      <div className="feed-card-header">
        <div className="feed-author" onClick={handleCardClick}>
          <img
            src={post.authorAvatar || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%238B5324"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="%23FFFFFF">${(post.authorName?.[0] || 'U').toUpperCase()}</text></svg>`}
            alt={post.authorName || 'user'}
            className="feed-avatar"
            onError={e => { 
              e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%238B5324"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="%23FFFFFF">U</text></svg>`; 
            }}
          />
          <div className="feed-author-info">
            <span className="feed-display-name">{post.authorName}</span>
            <span className="feed-username">@{post.authorUsername}</span>
          </div>
        </div>

        <div className="feed-header-right">
          <span className="feed-time">{timeStr}</span>
          {isOwner && (
            <button className="delete-post-btn" onClick={handleDelete} title="Delete post" aria-label="Delete post">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Media */}
      <div
        className="feed-media-wrap"
        ref={mediaWrapRef}
        onClick={handleDoubleTap}
        onDoubleClick={() => { if (!isLiked && onLike) onLike(post.id); triggerHeartBurst(); }}
      >
        {/* Security Watermark for photo/video protection */}
        {(post.type === 'photo' || post.type === 'video') && (
          <Watermark text={watermarkText} variant={post.type} />
        )}

        {post.type === 'photo' && post.mediaUrl && (
          <img
            src={post.mediaUrl}
            alt="Post"
            className="feed-media-img"
            loading="lazy"
            decoding="async"
            draggable="false"
            onContextMenu={e => e.preventDefault()}
            onClick={handleCardClick}
          />
        )}
        {post.type === 'video' && post.mediaUrl && (
          <>
            <video
              ref={videoRef}
              src={post.mediaUrl}
              preload="metadata"
              controls
              controlsList="nodownload noplaybackrate nofullscreen"
              disablePictureInPicture={false}
              className="feed-media-video"
              onContextMenu={e => e.preventDefault()}
            />
            {/* Custom fullscreen button — makes the WRAPPER fullscreen so watermark is included */}
            <button
              className="feed-fullscreen-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                /* Exit fullscreen icon */
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <polyline points="4 14 8 14 8 18" />
                  <polyline points="20 10 16 10 16 6" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              ) : (
                /* Enter fullscreen icon */
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              )}
            </button>
          </>
        )}
        {post.type === 'text' && (
          <div
            className="feed-media-text"
            style={{ background: TEXT_GRADIENTS[post.gradient] || TEXT_GRADIENTS.default }}
            onClick={handleCardClick}
          >
            <p>{post.content}</p>
          </div>
        )}

        {/* Double-tap heart burst */}
        {showHeartBurst && (
          <div className="heart-burst">
            <svg viewBox="0 0 24 24" fill="white" width="80" height="80">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="feed-actions">
        <div className="actions-left">
          {/* Like */}
          <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike} aria-label="Like">
            {isLiked ? (
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            )}
          </button>
          {/* Comment */}
          <button className="action-btn" onClick={handleComment} aria-label="Comment">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          {/* Share */}
          <button className="action-btn" onClick={handleShare} aria-label="Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        {/* Save */}
        <button className={`action-btn ${isSaved ? 'saved' : ''}`} onClick={handleSave} aria-label="Save">
          {isSaved ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Footer - ONLY render caption if type is NOT text */}
      <div className="feed-footer">
        {likeCount > 0 && (
          <p className="feed-likes">{likeCount} like{likeCount !== 1 ? 's' : ''}</p>
        )}
        {post.type !== 'text' && post.caption && (
          <p className="feed-caption">
            <span className="feed-cap-user">{post.authorUsername} </span>
            {expanded || post.caption.length <= 120 ? post.caption : (
              <>
                {post.caption.slice(0, 120)}…{' '}
                <button className="read-more-btn" onClick={() => setExpanded(true)}>more</button>
              </>
            )}
          </p>
        )}
        <button className="view-comments-btn" onClick={handleComment}>
          {commentCount > 0
            ? `View all ${commentCount} comment${commentCount !== 1 ? 's' : ''}`
            : 'Add a comment…'}
        </button>
      </div>
    </article>
  );
}
