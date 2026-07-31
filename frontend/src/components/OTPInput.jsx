import React, { useState, useRef } from 'react';
import './OTPInput.css';

export default function OTPInput({ length = 6, onComplete, disabled = false, error = false }) {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    const otpString = newOtp.join('');
    if (otpString.length === length) {
      onComplete(otpString);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1].focus();
      }
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length).replace(/\D/g, '');
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    const focusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[focusIndex].focus();

    if (pastedData.length === length) {
      onComplete(newOtp.join(''));
    }
  };

  const isSuccess = !error && otp.join('').length === length;

  return (
    <div className={`otp-container ${error ? 'has-error' : ''} ${isSuccess ? 'is-success' : ''}`}>
      {otp.map((data, index) => (
        <input
          className="otp-input"
          type="text"
          inputMode="numeric"
          name="otp"
          maxLength="1"
          key={index}
          value={data}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          ref={(ref) => inputRefs.current[index] = ref}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
