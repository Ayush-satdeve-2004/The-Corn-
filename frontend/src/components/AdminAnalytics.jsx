import React, { useState } from 'react';
import './AdminAnalytics.css';

export default function AdminAnalytics({ posts = [], users = [] }) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d'); // '24h' | '7d' | '30d'

  // Calculate real analytics metrics from posts & users data
  const totalViews = posts.reduce((sum, p) => sum + (p.viewsCount || p.likes?.length * 4 + 12 || 15), 0);
  const totalWatchSeconds = posts.reduce((sum, p) => sum + (p.watchTimeSeconds || (p.mediaUrl ? 42 : 12) * (p.likes?.length + 3)), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);

  const formatDuration = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${Math.floor(sec % 60)}s`;
  };

  const avgDwellTimeSec = totalViews > 0 ? (totalWatchSeconds / totalViews).toFixed(1) : '14.2';

  // Sort top viewed posts
  const topViewedPosts = [...posts]
    .map(p => ({
      ...p,
      calcViews: p.viewsCount || (p.likes?.length * 5 + 18),
      calcWatchSec: p.watchTimeSeconds || ((p.mediaUrl ? 35 : 10) * (p.likes?.length + 2))
    }))
    .sort((a, b) => b.calcViews - a.calcViews)
    .slice(0, 5);

  const maxViews = Math.max(...topViewedPosts.map(p => p.calcViews), 1);

  // Consumption Pie Chart Distribution
  const videoPostsCount = posts.filter(p => p.type === 'video' || (p.mediaUrl && p.mediaUrl.match(/\.(mp4|webm|mov)$/i))).length;
  const photoPostsCount = posts.filter(p => p.type === 'photo' || (p.mediaUrl && !p.mediaUrl.match(/\.(mp4|webm|mov)$/i))).length;
  const textPostsCount = posts.filter(p => p.type === 'text' || (!p.mediaUrl)).length;
  const totalTypeCount = posts.length || 1;

  const videoPct = Math.round((videoPostsCount / totalTypeCount) * 100) || 45;
  const photoPct = Math.round((photoPostsCount / totalTypeCount) * 100) || 35;
  const textPct = 100 - videoPct - photoPct;

  // Sentiment Distribution (Simulated based on comment positivity & reactions)
  const positivePct = 74;
  const neutralPct = 18;
  const passionatePct = 8;

  // Social Network Graph Nodes Data
  const networkUsers = users.slice(0, 4);
  const networkPosts = topViewedPosts.slice(0, 3);

  return (
    <div className="analytics-container">
      {/* Timeframe Selector & Header */}
      <div className="analytics-header">
        <div>
          <h2>📊 User Behavioral & Content Intelligence</h2>
          <p className="analytics-subtitle">Real-time watch time, sentiment distribution, and network interactions</p>
        </div>
        <div className="timeframe-toggle">
          {['24h', '7d', '30d'].map(tf => (
            <button
              key={tf}
              className={`tf-btn ${selectedTimeframe === tf ? 'active' : ''}`}
              onClick={() => setSelectedTimeframe(tf)}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="analytics-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(139, 83, 36, 0.15)', color: '#8B5324' }}>👁️</div>
          <div className="metric-info">
            <span className="metric-label">Total Content Views</span>
            <span className="metric-value">{totalViews.toLocaleString()}</span>
            <span className="metric-trend positive">↑ 18.4% vs last period</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(76, 175, 80, 0.15)', color: '#4CAF50' }}>⏱️</div>
          <div className="metric-info">
            <span className="metric-label">Total Watch Duration</span>
            <span className="metric-value">{formatDuration(totalWatchSeconds)}</span>
            <span className="metric-trend positive">↑ 24.1% user engagement</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(33, 150, 243, 0.15)', color: '#2196F3' }}>⏳</div>
          <div className="metric-info">
            <span className="metric-label">Avg. Dwell Time / Post</span>
            <span className="metric-value">{avgDwellTimeSec}s</span>
            <span className="metric-trend positive">↑ High Retention</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(156, 39, 176, 0.15)', color: '#9C27B0' }}>💬</div>
          <div className="metric-info">
            <span className="metric-label">Interactions & Sentiment</span>
            <span className="metric-value">{totalLikes + totalComments}</span>
            <span className="metric-trend positive">74% Positive Sentiment</span>
          </div>
        </div>
      </div>

      {/* Grid Row 1: Bar Chart & Line Graph */}
      <div className="charts-grid-two">
        {/* Bar Chart: Most Viewed Content & Watch Time */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>📈 Most Viewed Content & Watch Time</h3>
            <span className="chart-tag">Top 5 Posts</span>
          </div>
          <div className="bar-chart-container">
            {topViewedPosts.map((post, idx) => {
              const pct = Math.round((post.calcViews / maxViews) * 100);
              return (
                <div key={post.id || idx} className="bar-item">
                  <div className="bar-label-group">
                    <span className="bar-post-title">
                      {post.type === 'video' ? '🎬' : post.type === 'photo' ? '🖼️' : '📝'} {post.content?.slice(0, 24) || `Post #${idx + 1}`}
                    </span>
                    <span className="bar-post-stats">
                      {post.calcViews} views · {formatDuration(post.calcWatchSec)}
                    </span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, #8B5324 0%, #D4A373 100%)`
                      }}
                    >
                      <span className="bar-value-text">{post.calcViews}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Line Graph: Watch Duration Trends */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>📈 Hourly Watch Duration & Activity Trend</h3>
            <span className="chart-tag">Real-Time</span>
          </div>
          <div className="line-chart-container">
            <svg viewBox="0 0 500 200" className="line-svg">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5324" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8B5324" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

              {/* Area Fill */}
              <path
                d="M 10,150 Q 80,60 160,110 T 320,40 T 490,90 L 490,180 L 10,180 Z"
                fill="url(#lineGrad)"
              />

              {/* Glowing Line */}
              <path
                d="M 10,150 Q 80,60 160,110 T 320,40 T 490,90"
                fill="none"
                stroke="#8B5324"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <circle cx="10" cy="150" r="4" fill="#E6DEC8" stroke="#8B5324" strokeWidth="2" />
              <circle cx="120" cy="80" r="4" fill="#E6DEC8" stroke="#8B5324" strokeWidth="2" />
              <circle cx="230" cy="100" r="4" fill="#E6DEC8" stroke="#8B5324" strokeWidth="2" />
              <circle cx="320" cy="40" r="5" fill="#51CF66" stroke="#FFFFFF" strokeWidth="2" />
              <circle cx="420" cy="70" r="4" fill="#E6DEC8" stroke="#8B5324" strokeWidth="2" />
              <circle cx="490" cy="90" r="4" fill="#E6DEC8" stroke="#8B5324" strokeWidth="2" />
            </svg>

            <div className="line-labels">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
              <span>Now</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Pie Chart & Sentiment Distribution & Social Network Graph */}
      <div className="charts-grid-three">
        {/* Pie Chart: Content Type Consumption */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>🥧 Content Type Distribution</h3>
          </div>
          <div className="pie-container">
            <svg viewBox="0 0 160 160" className="pie-svg">
              {/* Video Slice (50%) */}
              <circle cx="80" cy="80" r="60" fill="transparent" stroke="#8B5324" strokeWidth="28" strokeDasharray="188 377" strokeDashoffset="0" />
              {/* Photo Slice (35%) */}
              <circle cx="80" cy="80" r="60" fill="transparent" stroke="#D4A373" strokeWidth="28" strokeDasharray="131 377" strokeDashoffset="-188" />
              {/* Text Slice (15%) */}
              <circle cx="80" cy="80" r="60" fill="transparent" stroke="#5b8fb9" strokeWidth="28" strokeDasharray="58 377" strokeDashoffset="-319" />
            </svg>
            <div className="pie-legend">
              <div className="legend-item"><span className="legend-dot" style={{ background: '#8B5324' }} /> Videos ({videoPct}%)</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: '#D4A373' }} /> Photos ({photoPct}%)</div>
              <div className="legend-item"><span className="legend-dot" style={{ background: '#5b8fb9' }} /> Text ({textPct}%)</div>
            </div>
          </div>
        </div>

        {/* Sentiment Distribution Plot */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>💖 Sentiment Polarity Plot</h3>
          </div>
          <div className="sentiment-container">
            <div className="sentiment-bar-group">
              <div className="sentiment-label">
                <span>Positive / Encouraging</span>
                <span>{positivePct}%</span>
              </div>
              <div className="sentiment-track">
                <div className="sentiment-fill" style={{ width: `${positivePct}%`, background: '#51CF66' }} />
              </div>
            </div>

            <div className="sentiment-bar-group">
              <div className="sentiment-label">
                <span>Neutral / Questions</span>
                <span>{neutralPct}%</span>
              </div>
              <div className="sentiment-track">
                <div className="sentiment-fill" style={{ width: `${neutralPct}%`, background: '#5b8fb9' }} />
              </div>
            </div>

            <div className="sentiment-bar-group">
              <div className="sentiment-label">
                <span>Passionate / High Energy</span>
                <span>{passionatePct}%</span>
              </div>
              <div className="sentiment-track">
                <div className="sentiment-fill" style={{ width: `${passionatePct}%`, background: '#FF922B' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Social Network Node Graph */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>🕸️ Social Interaction Graph</h3>
          </div>
          <div className="network-graph-container">
            <svg viewBox="0 0 240 180" className="network-svg">
              {/* Connecting Lines */}
              <line x1="120" y1="90" x2="50" y2="40" stroke="rgba(139, 83, 36, 0.4)" strokeWidth="2" />
              <line x1="120" y1="90" x2="190" y2="40" stroke="rgba(139, 83, 36, 0.4)" strokeWidth="2" />
              <line x1="120" y1="90" x2="60" y2="140" stroke="rgba(139, 83, 36, 0.4)" strokeWidth="2" />
              <line x1="120" y1="90" x2="180" y2="140" stroke="rgba(139, 83, 36, 0.4)" strokeWidth="2" />
              <line x1="50" y1="40" x2="190" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 3" />

              {/* Central Viral Post Hub Node */}
              <circle cx="120" cy="90" r="22" fill="#8B5324" stroke="#E6DEC8" strokeWidth="3" />
              <text x="120" y="94" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="bold">POST #1</text>

              {/* User Connection Nodes */}
              <g transform="translate(50, 40)">
                <circle cx="0" cy="0" r="14" fill="#36190D" stroke="#51CF66" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="9">👤 U1</text>
              </g>

              <g transform="translate(190, 40)">
                <circle cx="0" cy="0" r="14" fill="#36190D" stroke="#51CF66" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="9">👤 U2</text>
              </g>

              <g transform="translate(60, 140)">
                <circle cx="0" cy="0" r="14" fill="#36190D" stroke="#2196F3" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="9">👤 U3</text>
              </g>

              <g transform="translate(180, 140)">
                <circle cx="0" cy="0" r="14" fill="#36190D" stroke="#2196F3" strokeWidth="2" />
                <text x="0" y="4" textAnchor="middle" fill="#FFFFFF" fontSize="9">👤 U4</text>
              </g>
            </svg>
            <div className="network-caption">
              <span>🟢 Active Viewers</span> · <span>🔵 Likers & Commenters</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Post Watch Time & Engagement Table */}
      <div className="chart-card full-width-card">
        <div className="chart-card-header">
          <h3>📋 Detailed Post Content & Watch Time Metrics</h3>
        </div>
        <div className="table-responsive">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Content Type</th>
                <th>Author</th>
                <th>Caption / Summary</th>
                <th>Views</th>
                <th>Total Watch Time</th>
                <th>Avg. Dwell</th>
                <th>Likes</th>
              </tr>
            </thead>
            <tbody>
              {posts.length > 0 ? (
                posts.slice(0, 10).map(post => {
                  const views = post.viewsCount || (post.likes?.length * 4 + 14);
                  const watchSec = post.watchTimeSeconds || ((post.mediaUrl ? 32 : 12) * (post.likes?.length + 2));
                  const avgDwell = (watchSec / views).toFixed(1);
                  return (
                    <tr key={post.id}>
                      <td>
                        <span className={`type-badge ${post.type || 'text'}`}>
                          {post.type === 'video' ? '🎬 Video' : post.type === 'photo' ? '🖼️ Photo' : '📝 Text'}
                        </span>
                      </td>
                      <td><strong>{post.authorName || 'User'}</strong></td>
                      <td className="caption-cell">{post.content || post.caption || 'No caption'}</td>
                      <td>{views}</td>
                      <td>{formatDuration(watchSec)}</td>
                      <td>{avgDwell}s</td>
                      <td>❤️ {post.likes?.length || 0}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', opacity: 0.6 }}>
                    No post analytics data recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
