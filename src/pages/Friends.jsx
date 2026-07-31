import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  searchUsers, getFriendRequests, getFriends,
  sendFriendRequest, acceptFriendRequest, rejectFriendRequest,
  removeFriend, getUserById
} from '../services/api';
import Toast from '../components/Toast';
import './Friends.css';

export default function Friends() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sentReqMap, setSentReqMap] = useState({});
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const refreshData = useCallback(async () => {
    if (!user) return;
    try {
      const incomingRaw = await getFriendRequests(user.id);
      const incomingEnriched = await Promise.all(
        (incomingRaw || []).map(async req => {
          const senderUser = await getUserById(req.from);
          return { ...req, senderUser };
        })
      );
      setIncomingRequests(incomingEnriched);

      const friends = await getFriends(user.id);
      setFriendsList(friends || []);
    } catch (err) {
      console.error('Error refreshing friends data:', err);
    }
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData, activeTab]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        const results = await searchUsers(searchQuery);
        setSearchResults((results || []).filter(u => u.id !== user?.id));
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  const handleAddFriend = async (targetId) => {
    await sendFriendRequest(user.id, targetId);
    setSentReqMap(prev => ({ ...prev, [targetId]: true }));
    showToast('Friend request sent!', 'success');
  };

  const handleAccept = async (requestId) => {
    await acceptFriendRequest(requestId);
    refreshData();
    showToast('Friend request accepted!', 'success');
  };

  const handleReject = async (requestId) => {
    await rejectFriendRequest(requestId);
    refreshData();
    showToast('Request declined', 'info');
  };

  const handleRemoveFriend = async (friendId) => {
    await removeFriend(user.id, friendId);
    refreshData();
    showToast('Friend removed', 'info');
  };

  const isFriendWith = (id) => (friendsList || []).some(f => f.id === id);
  const pendingCount = incomingRequests.length;

  const getAvatar = (u) => u?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.fullName || 'U')}&background=8B5324&color=fff&size=40`;

  return (
    <div className="friends-page">
      {/* Header */}
      <header className="friends-header">
        <h1>Friends</h1>
      </header>

      {/* Tabs */}
      <div className="friends-tabs">
        {[
          { id: 'search', label: 'Search' },
          { id: 'requests', label: `Requests${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { id: 'friends', label: 'My Friends' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`friends-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'requests' && pendingCount > 0 && (
              <span className="req-badge">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: Search */}
      {activeTab === 'search' && (
        <div className="friends-tab-content">
          <div className="search-input-wrap">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="input-field search-input"
              placeholder="Search by name or username…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
            )}
          </div>

          {searchQuery.trim() === '' ? (
            <div className="friends-empty">
              <div style={{ fontSize: '3rem' }}>🔍</div>
              <p>Search for people on The Corn</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="friends-empty">
              <div style={{ fontSize: '3rem' }}>😕</div>
              <p>No users found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="user-list">
              {searchResults.map(u => {
                const friend = isFriendWith(u.id);
                const requested = sentReqMap[u.id];
                return (
                  <div key={u.id} className="user-card">
                    <img src={getAvatar(u)} alt={u.fullName} className="user-card-avatar"
                      onError={e => { e.target.src = `https://ui-avatars.com/api/?name=U&background=8B5324&color=fff&size=40`; }} />
                    <div className="user-card-info">
                      <span className="user-card-name">{u.fullName}</span>
                      <span className="user-card-username">@{u.username}</span>
                    </div>
                    {friend ? (
                      <span className="friend-badge">Friends ✓</span>
                    ) : requested ? (
                      <span className="requested-badge">Sent</span>
                    ) : (
                      <button className="btn-add-friend" onClick={() => handleAddFriend(u.id)}>
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Requests */}
      {activeTab === 'requests' && (
        <div className="friends-tab-content">
          <h3 className="section-heading">Incoming Requests</h3>
          {incomingRequests.length === 0 ? (
            <div className="friends-empty">
              <div style={{ fontSize: '3rem' }}>📬</div>
              <p>No pending friend requests</p>
            </div>
          ) : (
            <div className="user-list">
              {incomingRequests.map(req => (
                <div key={req.id} className="user-card">
                  <img src={getAvatar(req.senderUser)} alt={req.senderUser?.fullName} className="user-card-avatar"
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=U&background=8B5324&color=fff&size=40`; }} />
                  <div className="user-card-info">
                    <span className="user-card-name">{req.senderUser?.fullName || 'Unknown'}</span>
                    <span className="user-card-username">@{req.senderUser?.username || '?'}</span>
                  </div>
                  <div className="req-actions">
                    <button className="btn-accept" onClick={() => handleAccept(req.id)}>Accept</button>
                    <button className="btn-reject" onClick={() => handleReject(req.id)}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: My Friends */}
      {activeTab === 'friends' && (
        <div className="friends-tab-content">
          <h3 className="section-heading">{friendsList.length} Friend{friendsList.length !== 1 ? 's' : ''}</h3>
          {friendsList.length === 0 ? (
            <div className="friends-empty">
              <div style={{ fontSize: '3rem' }}>👥</div>
              <p>You haven't added any friends yet</p>
              <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setActiveTab('search')}>
                Find Friends
              </button>
            </div>
          ) : (
            <div className="user-list">
              {friendsList.map(friend => (
                <div key={friend.id} className="user-card">
                  <img src={getAvatar(friend)} alt={friend.fullName} className="user-card-avatar"
                    onError={e => { e.target.src = `https://ui-avatars.com/api/?name=U&background=8B5324&color=fff&size=40`; }} />
                  <div className="user-card-info">
                    <span className="user-card-name">{friend.fullName}</span>
                    <span className="user-card-username">@{friend.username}</span>
                  </div>
                  <button className="btn-remove" onClick={() => handleRemoveFriend(friend.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible}
        onClose={() => setToast(t => ({ ...t, visible: false }))} />
    </div>
  );
}
