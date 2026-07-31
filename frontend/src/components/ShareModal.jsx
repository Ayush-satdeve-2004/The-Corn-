import React, { useState } from 'react';
import { sharePost } from '../services/mockBackend';
import './ShareModal.css';

export default function ShareModal({ isOpen, postId, friends, currentUserId, onClose, onShare }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const filtered = (friends || []).filter(f =>
    f.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    f.username?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const handleSend = () => {
    if (selected.length === 0) return;
    selected.forEach(toId => sharePost(postId, currentUserId, toId));
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setSelected([]);
      setSearch('');
      onShare && onShare();
      onClose();
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="share-modal-card" onClick={e => e.stopPropagation()}>
        <div className="share-modal-header">
          <h3>Share with Friends</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="share-note">🔒 Sharing only available within The Corn</p>

        {sent ? (
          <div className="share-success">
            <div className="share-success-icon">✓</div>
            <p>Shared successfully!</p>
          </div>
        ) : (
          <>
            <input
              className="input-field share-search"
              placeholder="Search friends…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <div className="share-friends-list">
              {filtered.length === 0 ? (
                <p className="share-empty">
                  {friends?.length === 0 ? 'Add friends to share with them' : 'No friends found'}
                </p>
              ) : (
                filtered.map(friend => {
                  const avatarSrc = friend.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.fullName || 'U')}&background=8B5324&color=fff&size=40`;
                  return (
                    <div
                      key={friend.id}
                      className={`share-friend-row ${selected.includes(friend.id) ? 'selected' : ''}`}
                      onClick={() => toggle(friend.id)}
                    >
                      <img src={avatarSrc} alt={friend.fullName} className="share-avatar"
                        onError={e => { e.target.src = `https://ui-avatars.com/api/?name=U&background=8B5324&color=fff&size=40`; }} />
                      <div className="share-friend-info">
                        <span className="share-friend-name">{friend.fullName}</span>
                        <span className="share-friend-username">@{friend.username}</span>
                      </div>
                      <div className={`share-checkbox ${selected.includes(friend.id) ? 'checked' : ''}`}>
                        {selected.includes(friend.id) && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" width="14" height="14">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {selected.length > 0 && (
              <button className="btn-primary share-send-btn" onClick={handleSend}>
                Send to {selected.length} friend{selected.length !== 1 ? 's' : ''}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
