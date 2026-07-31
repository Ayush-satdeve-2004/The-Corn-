import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendEmailOTP, verifyEmailOTP, resetPassword, getUserByUsername, getAllUsers } from '../services/mockBackend';
import Toast from '../components/Toast';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Forgot Password Modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email/Username, 2: OTP, 3: New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotTargetUser, setForgotTargetUser] = useState(null);
  const [forgotOtp, setForgotOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const showToast = (message, type = 'info') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const result = await login(identifier, password);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          if (!result.user.username || result.user.username.startsWith('user_')) {
            navigate('/onboarding');
          } else {
            navigate('/');
          }
        }, 200);
      } else {
        setError(result.message || 'Invalid credentials');
        if (result.remainingAttempts === 0) {
          setError('Account locked for 6 hours due to too many failed attempts.');
        } else if (result.remainingAttempts !== undefined) {
          setError(`${result.message} (${result.remainingAttempts} attempt${result.remainingAttempts !== 1 ? 's' : ''} left)`);
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send OTP to email
  const handleForgotSendOtp = (e) => {
    e.preventDefault();
    setForgotError('');
    const emailInput = forgotEmail.trim().toLowerCase();
    if (!emailInput) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    const all = getAllUsers();
    const target = all.find(u => u.email.toLowerCase() === emailInput);

    if (!target) {
      setForgotError('No registered account found with that email address.');
      return;
    }

    setForgotTargetUser(target);
    const res = sendEmailOTP(target.email);
    if (res.success) {
      setGeneratedOtp(res.otp);
      showToast(`OTP sent to ${target.email}! (Demo OTP: ${res.otp})`, 'info');
      setForgotStep(2);
    }
  };

  // Step 2: Verify OTP
  const handleForgotVerifyOtp = (e) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotOtp.trim()) {
      setForgotError('Please enter the OTP.');
      return;
    }

    const isValid = verifyEmailOTP(forgotTargetUser.email, forgotOtp.trim()) || forgotOtp.trim() === generatedOtp;
    if (isValid) {
      setForgotStep(3);
    } else {
      setForgotError('Incorrect or expired OTP. Please try again.');
    }
  };

  // Step 3: Reset password
  const handleForgotReset = (e) => {
    e.preventDefault();
    setForgotError('');
    if (newPassword.length < 6) {
      setForgotError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    resetPassword(forgotTargetUser.id, newPassword);
    showToast('Password reset successfully! You can now log in.', 'success');
    setForgotOpen(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="login-bg">
      {/* Decorative blobs */}
      <div className="login-blob blob-1" />
      <div className="login-blob blob-2" />

      <div className="login-card fade-in">
        <div className="login-logo-wrap">
          <span className="login-corn-emoji">🌽</span>
          <h1 className="login-title">The Corn</h1>
          <p className="login-sub">Welcome back to the field</p>
        </div>

        {success ? (
          <div className="login-success slide-up">
            <div className="success-check">✓</div>
            <p>Logged in! Redirecting…</p>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleLogin} noValidate>
            {/* Identifier */}
            <div className="form-group">
              <label htmlFor="identifier">Email or Username</label>
              <div className="input-icon-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="identifier"
                  type="text"
                  className="input-field"
                  placeholder="Enter email or username"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-icon-wrap">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error shake">{error}</div>
            )}

            <div className="login-meta">
              <span />
              <button
                type="button"
                className="forgot-link-btn"
                onClick={() => { setForgotOpen(true); setForgotStep(1); setForgotError(''); }}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="btn-primary login-btn" disabled={loading}>
              {loading ? <span className="spinner-sm" /> : 'Log In'}
            </button>
          </form>
        )}

        <div className="login-footer">
          Don't have an account?{' '}
          <Link to="/register" className="link-cinnamon">Create Account</Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="modal-overlay" onClick={() => setForgotOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Reset Password</h3>
              <button className="modal-close-btn" onClick={() => setForgotOpen(false)}>×</button>
            </div>

            {forgotStep === 1 && (
              <form onSubmit={handleForgotSendOtp}>
                <p className="modal-desc">Enter your registered email address to receive a 6-digit OTP code.</p>
                <div className="form-group">
                  <input
                    type="email"
                    className="input-field"
                    placeholder="Enter your email address"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    autoFocus
                  />
                </div>
                {forgotError && <p className="field-error">{forgotError}</p>}
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setForgotOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Send OTP</button>
                </div>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleForgotVerifyOtp}>
                <p className="modal-desc">OTP sent to <strong>{forgotTargetUser?.email}</strong>.</p>
                {generatedOtp && <p className="demo-otp-hint">Demo OTP: <strong>{generatedOtp}</strong></p>}
                <div className="form-group">
                  <input
                    className="input-field"
                    placeholder="Enter 6-digit OTP"
                    value={forgotOtp}
                    onChange={e => setForgotOtp(e.target.value)}
                    maxLength={6}
                    autoFocus
                  />
                </div>
                {forgotError && <p className="field-error">{forgotError}</p>}
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setForgotStep(1)}>Back</button>
                  <button type="submit" className="btn-primary">Verify OTP</button>
                </div>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleForgotReset}>
                <p className="modal-desc">Set a new password for your account.</p>
                <div className="form-group">
                  <input
                    type="password"
                    className="input-field"
                    placeholder="New password (min 6 chars)"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
                {forgotError && <p className="field-error">{forgotError}</p>}
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setForgotOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Reset Password</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible}
        onClose={() => setToast(t => ({ ...t, visible: false }))} />
    </div>
  );
}
