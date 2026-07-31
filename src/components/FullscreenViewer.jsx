import React, { useEffect, useState, useCallback, useRef } from 'react';
import Watermark from './Watermark';
import CommentsDrawer from './CommentsDrawer';
import { commentOnPost, likePost, savePost } from '../services/api';
import { hidePrivacyShield } from '../services/antiHack';
import './FullscreenViewer.css';

export default function FullscreenViewer({
  posts, initialIndex, currentUser,
  onClose, onLike, onComment, onSave, onShare, onDelete
}) {
  const [index, setIndex] = useState(initialIndex || 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const post = posts?.[index];

  const fsMediaRef = useRef(null);
  const fsVideoRef = useRef(null);

  const handleClose = useCallback(() => {
    hidePrivacyShield();
    if (onClose) onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') handleClose();
    if (e.key === 'ArrowRight') setIndex(i => Math.min(i + 1, posts.length - 1));
    if (e.key === 'ArrowLeft') setIndex(i => Math.max(i - 1, 0));
  }, [handleClose, posts?.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      hidePrivacyShield();
    };
  }, [handleKeyDown]);

  /* Listen for fullscreen changes */
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (!post) return null;

  const isOwner = post.userId === currentUser?.id;
  const isLiked = post.likes?.includes(currentUser?.id);
  const isSaved = post.saves?.includes(currentUser?.id);
  const likeCount = post.likes?.length || 0;

  const avatarSrc = post.authorAvatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName || 'U')}&background=8B5324&color=fff`;

  const handleAddComment = (postId, text) => {
    if (!currentUser) return;
    commentOnPost(postId, currentUser.id, text);
    if (onComment) onComment(postId);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      if (onDelete) onDelete(post.id);
    }
  };

  const watermarkText = currentUser
    ? `${currentUser.email || ''} · ${currentUser.mobile || ''}`
    : 'The Corn Security';

  /* ---- Custom fullscreen toggle for wrapper (video + watermark) ---- */
  const toggleFullscreen = (e) => {
    e.stopPropagation();
    if (!fsMediaRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      fsMediaRef.current.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="fs-overlay" onClick={handleClose}>
      {/* Close */}
      <button className="fs-close" onClick={handleClose} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Delete button for owner */}
      {isOwner && (
        <button className="fs-delete-btn" onClick={e => { e.stopPropagation(); handleDelete(); }} title="Delete post">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" />
          </svg>
        </button>
      )}

      {/* Prev arrow */}
      {index > 0 && (
        <button className="fs-arrow fs-arrow-left" onClick={e => { e.stopPropagation(); setIndex(i => i - 1); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Next arrow */}
      {index < posts.length - 1 && (
        <button className="fs-arrow fs-arrow-right" onClick={e => { e.stopPropagation(); setIndex(i => i + 1); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="24" height="24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Main content */}
      <div className="fs-content" onClick={e => e.stopPropagation()} onContextMenu={e => e.preventDefault()}>
        {/* Media */}
        <div className="fs-media-wrap" ref={fsMediaRef}>
          {/* Security Watermark with User Email & Phone Number */}
          {(post.type === 'photo' || post.type === 'video') && (
            <Watermark text={watermarkText} variant={post.type} />
          )}

          {post.type === 'photo' && (
            <img src={post.mediaUrl} alt="Post" className="fs-media-img" draggable="false" />
          )}
          {post.type === 'video' && (
            <>
              <video
                ref={fsVideoRef}
                src={post.mediaUrl}
                controls
                autoPlay
                controlsList="nodownload noplaybackrate nofullscreen"
                disablePictureInPicture={false}
                className="fs-media-video"
                onContextMenu={e => e.preventDefault()}
              />
              {/* Custom fullscreen button — makes the WRAPPER fullscreen so watermark is included */}
              <button
                className="fs-fullscreen-btn"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <polyline points="4 14 8 14 8 18" />
                    <polyline points="20 10 16 10 16 6" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                ) : (
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
            <div className="fs-media-text">
              <p>{post.content}</p>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="fs-bottom-bar">
          <div className="fs-user-row">
            <img src={avatarSrc} alt={post.authorName} className="fs-avatar"
              onError={e => { e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%238B5324"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="%23FFFFFF">U</text></svg>`; }} />
            <div>
              <p className="fs-author">{post.authorName}</p>
              <p className="fs-author-sub">@{post.authorUsername}</p>
            </div>
          </div>

          {post.type !== 'text' && post.caption && <p className="fs-caption">{post.caption}</p>}

          <div className="fs-actions">
            <button className={`fs-action-btn ${isLiked ? 'liked' : ''}`}
              onClick={() => onLike && onLike(post.id)}>
              {isLiked ? (
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              )}
              <span>{likeCount}</span>
            </button>

            <button className="fs-action-btn" onClick={() => setCommentsOpen(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{post.comments?.length || 0}</span>
            </button>

            <button className="fs-action-btn" onClick={() => onShare && onShare(post.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>

            <button className={`fs-action-btn ${isSaved ? 'saved' : ''}`}
              onClick={() => onSave && onSave(post.id)}>
              {isSaved ? (
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comments drawer */}
      <CommentsDrawer
        isOpen={commentsOpen}
        postId={post.id}
        comments={post.comments || []}
        currentUser={currentUser}
        onAddComment={handleAddComment}
        onClose={() => setCommentsOpen(false)}
      />
    </div>
  );
}
