import React, { useEffect, useRef } from 'react';
import './CommentsDrawer.css';

function getTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function CommentsDrawer({
  isOpen, postId, postOwnerId, comments, currentUser,
  onAddComment, onDeleteComment, onClose
}) {
  const [text, setTextState] = React.useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new comment added
  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments, isOpen]);

  // Focus input when opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || !postId) return;
    onAddComment(postId, text.trim());
    setTextState('');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="drawer-backdrop" onClick={onClose} />}

      <div className={`comments-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-handle" />

        <div className="drawer-header">
          <h3>Comments {comments?.length > 0 && <span className="comment-count">{comments.length}</span>}</h3>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="comments-list" ref={listRef}>
          {!comments || comments.length === 0 ? (
            <div className="comments-empty">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
              <p>No comments yet.</p>
              <p>Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment, idx) => {
              const initial = (comment.username?.[0] || comment.userId?.[0] || 'U').toUpperCase();
              const avatarSrc = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%238B5324"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="%23FFFFFF">${initial}</text></svg>`;
              const commentId = comment.id || comment._id || String(idx);
              const canDelete =
                comment.userId === currentUser?.id ||
                postOwnerId === currentUser?.id ||
                currentUser?.role === 'ADMIN';

              return (
                <div key={commentId} className="comment-item">
                  <img src={avatarSrc} alt="avatar" className="comment-avatar" />
                  <div className="comment-body">
                    <div className="comment-header">
                      <span className="comment-username">{comment.username || comment.userId?.slice(0, 8) || 'user'}</span>
                      <span className="comment-time">{getTimeAgo(comment.timestamp)}</span>
                    </div>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                  {canDelete && onDeleteComment && (
                    <button
                      className="comment-delete-btn"
                      onClick={() => onDeleteComment(postId, commentId)}
                      title="Delete comment"
                      aria-label="Delete comment"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <form className="comment-input-bar" onSubmit={handleSubmit}>
          <img
            src={`data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%238B5324"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="36" font-weight="bold" fill="%23FFFFFF">${(currentUser?.fullName?.[0] || 'U').toUpperCase()}</text></svg>`}
            alt="you"
            className="comment-avatar"
          />
          <input
            ref={inputRef}
            className="comment-input"
            placeholder="Add a comment…"
            value={text}
            onChange={e => setTextState(e.target.value)}
            maxLength={500}
          />
          <button type="submit" className="comment-send-btn" disabled={!text.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
}
