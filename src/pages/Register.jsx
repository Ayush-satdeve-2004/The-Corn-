import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, sendEmailOTP, verifyEmailOTP } from '../services/mockBackend';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: ''
  });

  // Errors
  const [errors, setErrors] = useState({});

  // Email OTP State
  const [emailOTP, setEmailOTP] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const emailInputRefs = useRef([]);

  // Password rules
  const [pwdRules, setPwdRules] = useState({
    length: false,
    letters: false,
    numbers: false,
    special: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }

    if (name === 'password') {
      validatePassword(value);
    }
  };

  const validatePassword = (pwd) => {
    const rules = {
      length: pwd.length >= 9,
      letters: (pwd.match(/[a-zA-Z]/g) || []).length >= 5,
      numbers: (pwd.match(/[0-9]/g) || []).length >= 3,
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };
    setPwdRules(rules);
  };

  const getStrengthClass = () => {
    const score = Object.values(pwdRules).filter(Boolean).length;
    if (score <= 1) return 'weak';
    if (score <= 3) return 'medium';
    return 'strong';
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3300);
  };

  // Step 1: Submit Details & Proceed to Email Verification
  const handleStep1Submit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required';
    if (!formData.mobile.trim() || formData.mobile.length < 10) newErrors.mobile = 'Valid 10-digit mobile number is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setStep(2);
  };

  // Timer for Email OTP
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendEmailOTP = async () => {
    setLoading(true);
    try {
      const res = await sendEmailOTP(formData.email);
      showToast(res.message || 'OTP sent to your email inbox');
      setTimer(60);
    } catch (e) {
      showToast('Error sending OTP email');
    }
    setLoading(false);
  };

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]*$/.test(value)) return;
    
    const newOtp = [...emailOTP];
    newOtp[index] = value;
    setEmailOTP(newOtp);

    // Auto focus next
    if (value && index < 5) {
      emailInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      emailInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyEmail = async () => {
    const otp = emailOTP.join('');
    if (otp.length !== 6) {
      setErrors({ emailOtp: 'Please enter 6-digit OTP' });
      return;
    }
    setLoading(true);
    try {
      const res = await verifyEmailOTP(formData.email, otp);
      if (res.success) {
        setErrors({});
        setStep(3); // Advance straight to Password Creation!
        setTimer(0);
      } else {
        setErrors({ emailOtp: 'Invalid OTP' });
      }
    } catch (e) {
      setErrors({ emailOtp: 'Verification failed' });
    }
    setLoading(false);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!Object.values(pwdRules).every(Boolean)) return;
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser(formData);
      if (res && res.success) {
        setIsSuccess(true);
      } else {
        setErrors({ submit: res?.message || 'Registration failed. Email or mobile may already be registered.' });
      }
    } catch (e) {
      setErrors({ submit: 'Registration failed. Please try again.' });
    }
    setLoading(false);
  };

  return (
    <div className="register-container">
      {toast && <div className="toast">{toast}</div>}
      
      <div className="register-card">
        {isSuccess ? (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="check-icon">✓</div>
              <h2 className="modal-title">Registration Complete</h2>
              <p className="modal-desc">
                Your account has been submitted for review.<br/>
                You will be activated within 24 hours after Admin approval.
              </p>
              <button className="btn-primary" onClick={() => navigate('/login')}>
                Go to Login
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="register-header">
              <h1 className="register-logo">The Corn 🌽</h1>
              <p style={{ color: 'var(--cinnamon-light)' }}>Join the community</p>
            </div>

            {/* 3-Step Progress Indicator */}
            <div className="progress-container">
              <div className="progress-line-fill" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
              {[1, 2, 3].map(num => (
                <div key={num} className={`progress-step ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                  {step > num ? '✓' : num}
                </div>
              ))}
            </div>

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <form className="step-container register-form" onSubmit={handleStep1Submit}>
                <div className="input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    className="register-input"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                  {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                </div>

                <div className="input-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="register-input"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </div>

                <div className="input-group">
                  <label>Mobile Number</label>
                  <div className="phone-input-group">
                    <span className="phone-prefix">+91</span>
                    <input
                      type="tel"
                      name="mobile"
                      className="register-input"
                      placeholder="9876543210"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      maxLength={10}
                    />
                  </div>
                  {errors.mobile && <span className="error-text">{errors.mobile}</span>}
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
                  Next Step
                </button>
                <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
                  Already have an account? <Link to="/login" style={{ color: 'var(--sage-dark)', fontWeight: 'bold', textDecoration: 'none' }}>Log In</Link>
                </div>
              </form>
            )}

            {/* Step 2: Email Verification (Brevo OTP) */}
            {step === 2 && (
              <div className="step-container">
                <div className="verify-info">
                  <p>We need to verify your email address.</p>
                  <strong>{formData.email}</strong>
                </div>

                {!timer && emailOTP.join('').length === 0 ? (
                  <button onClick={handleSendEmailOTP} className="btn-primary" disabled={loading}>
                    Send OTP to Email
                  </button>
                ) : (
                  <>
                    <div className="otp-container">
                      {emailOTP.map((digit, idx) => (
                        <input
                          key={`email-${idx}`}
                          ref={el => emailInputRefs.current[idx] = el}
                          type="text"
                          maxLength={1}
                          className={`otp-input ${errors.emailOtp ? 'error' : ''}`}
                          value={digit}
                          onChange={e => handleOtpChange(idx, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(idx, e)}
                        />
                      ))}
                    </div>
                    {errors.emailOtp && <p className="error-text" style={{textAlign: 'center'}}>{errors.emailOtp}</p>}
                    
                    <button onClick={handleVerifyEmail} className="btn-primary" disabled={loading || emailOTP.join('').length !== 6}>
                      Verify Email
                    </button>

                    <div className="resend-text">
                      {timer > 0 ? (
                        <span>Resend OTP in {timer}s</span>
                      ) : (
                        <button onClick={handleSendEmailOTP} className="resend-link">Resend OTP</button>
                      )}
                    </div>
                  </>
                )}

                <div className="button-group">
                  <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
                </div>
              </div>
            )}

            {/* Step 3: Create Password */}
            {step === 3 && (
              <form className="step-container register-form" onSubmit={handleFinalSubmit}>
                <div className="input-group">
                  <label>Create Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className="register-input"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cinnamon-light)' }}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="password-rules">
                  <div className={`rule-item ${pwdRules.length ? 'met' : ''}`}>
                    <span className="rule-icon">{pwdRules.length ? '✓' : '✗'}</span> Minimum 9 characters
                  </div>
                  <div className={`rule-item ${pwdRules.letters ? 'met' : ''}`}>
                    <span className="rule-icon">{pwdRules.letters ? '✓' : '✗'}</span> At least 5 letters
                  </div>
                  <div className={`rule-item ${pwdRules.numbers ? 'met' : ''}`}>
                    <span className="rule-icon">{pwdRules.numbers ? '✓' : '✗'}</span> At least 3 numbers
                  </div>
                  <div className={`rule-item ${pwdRules.special ? 'met' : ''}`}>
                    <span className="rule-icon">{pwdRules.special ? '✓' : '✗'}</span> At least 1 special character
                  </div>
                  
                  <div className="strength-bar-container">
                    <div className={`strength-bar ${formData.password ? getStrengthClass() : ''}`}></div>
                  </div>
                </div>

                <div className="input-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="register-input"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>

                {errors.submit && <p className="error-text" style={{textAlign: 'center'}}>{errors.submit}</p>}

                <div className="button-group">
                  <button type="button" onClick={() => setStep(2)} className="btn-secondary">Back</button>
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={loading || !Object.values(pwdRules).every(Boolean) || formData.password !== formData.confirmPassword}
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
