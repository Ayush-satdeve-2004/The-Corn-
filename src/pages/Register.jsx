import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, sendEmailOTP, verifyEmailOTP, checkExistingUser } from '../services/api';
import Toast from '../components/Toast';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

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

  const showToast = (message, type = 'error') => {
    setToast({ visible: true, message, type });
  };

  const validateMobileNumber = (mobile) => {
    const clean = String(mobile || '').trim();
    if (!/^\d{10}$/.test(clean)) {
      return { valid: false, message: 'enter valid number' };
    }
    // Case 3: Mobile number must NEVER start with 0, 1, 2, 3, 4, 5, 6
    if (['0', '1', '2', '3', '4', '5', '6'].includes(clean[0])) {
      return { valid: false, message: 'enter valid number' };
    }
    // Case 1: Mobile number cannot be NNNNNNNNNN (all 10 digits identical e.g. 1111111111, 9999999999)
    if (/^(\d)\1{9}$/.test(clean)) {
      return { valid: false, message: 'enter valid number' };
    }
    // Case 2: Mobile number cannot be NMNMNMNMNM or MNMNMNMNMN (e.g. 1212121212, 9898989898)
    const pattern = clean.slice(0, 2);
    if (clean === pattern.repeat(5) && pattern[0] !== pattern[1]) {
      return { valid: false, message: 'enter valid number' };
    }
    return { valid: true };
  };

  // Step 1: Submit Details & Proceed to Email Verification
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid email is required';

    const mobileCheck = validateMobileNumber(formData.mobile);
    if (!mobileCheck.valid) {
      newErrors.mobile = mobileCheck.message;
      showToast(mobileCheck.message);
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const checkRes = await checkExistingUser(formData.email, formData.mobile);
      if (checkRes && checkRes.exists) {
        const errMsg = checkRes.message || 'Email or mobile number already registered.';
        showToast(errMsg);
        setErrors({ submit: errMsg });
        setLoading(false);
        return;
      }
      setErrors({});
      setStep(2);
    } catch (err) {
      showToast('Error checking user details');
    } finally {
      setLoading(false);
    }
  };

  // Timer for Email OTP
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Automatically send Brevo OTP email when step becomes 2
  useEffect(() => {
    if (step === 2 && formData.email) {
      setLoading(true);
      sendEmailOTP(formData.email)
        .then(res => {
          showToast(res?.message || 'OTP code sent to your email inbox.', 'info');
          setTimer(60);
        })
        .catch(() => {
          showToast('Error sending OTP email');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [step]);

  const handleSendEmailOTP = async () => {
    setLoading(true);
    try {
      const res = await sendEmailOTP(formData.email);
      showToast(res.message || 'OTP code sent to your email inbox.', 'info');
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
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible}
        onClose={() => setToast(t => ({ ...t, visible: false }))} />
      
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
            <div className="register-header" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <img src="/logo.png" alt="The Corn" style={{ width: '70px', height: '70px', borderRadius: '10px', objectFit: 'contain', marginBottom: '6px' }} />
              <h1 className="register-logo">The Corn</h1>
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
                  <h3 style={{ margin: '0 0 4px 0', color: '#000000' }}>Verify Email</h3>
                  <p style={{ margin: 0, color: '#36190D', fontSize: '0.9rem' }}>
                    Enter the 6-digit OTP code sent to <strong>{formData.email}</strong>.
                  </p>
                </div>

                <div className="otp-container">
                  {emailOTP.map((digit, idx) => (
                    <input
                      key={`email-${idx}`}
                      ref={el => emailInputRefs.current[idx] = el}
                      type="text"
                      maxLength={1}
                      className={`otp-box ${errors.emailOtp ? 'error' : ''}`}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                    />
                  ))}
                </div>
                {errors.emailOtp && <p className="error-text" style={{ textAlign: 'center', margin: '4px 0' }}>{errors.emailOtp}</p>}

                <div className="resend-text" style={{ textAlign: 'center', margin: '0.8rem 0' }}>
                  {timer > 0 ? (
                    <span style={{ color: '#8B5324', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      Resend OTP available in {timer}s
                    </span>
                  ) : (
                    <button type="button" onClick={handleSendEmailOTP} className="resend-link" disabled={loading}>
                      {loading ? 'Sending...' : 'Resend OTP'}
                    </button>
                  )}
                </div>

                <div className="button-group">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    className="btn-primary"
                    disabled={loading || emailOTP.join('').length !== 6}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
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
