import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import { verifyOtp, resendOtp } from '../services/authService';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState(null);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) navigate('/signup');
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // only digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // take only last char if pasted single digit
    setOtp(newOtp);
    setMessage(null);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < OTP_LENGTH) {
      setMessage({ type: 'error', text: 'Please enter the complete 6-digit OTP.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await verifyOtp({ email, otp: otpValue });
      setMessage({ type: 'success', text: res.data?.message || 'Account verified successfully!' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const status = err.response?.status;
      let text;
      if (status === 410) {
        text = 'OTP has expired. Please request a new one.';
      } else if (status === 401) {
        text = 'Invalid OTP. Please try again.';
      } else {
        text = err.response?.data?.message || 'Something went wrong.';
      }
      setMessage({ type: 'error', text });
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    setMessage(null);
    try {
      const res = await resendOtp({ email });
      setMessage({ type: 'success', text: res.data?.message || 'New OTP sent!' });
      setOtp(Array(OTP_LENGTH).fill(''));
      setCountdown(RESEND_COOLDOWN);
      setCanResend(false);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const status = err.response?.status;
      let text;
      if (status === 429) {
        text = 'Maximum resend attempts reached. Please sign up again.';
      } else {
        text = err.response?.data?.message || 'Failed to resend OTP.';
      }
      setMessage({ type: 'error', text });
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : '';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm px-8 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-1">
            CHARUSAT
          </p>
          <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            We sent a 6-digit code to<br />
            <span className="text-gray-600 font-medium">{maskedEmail}</span>
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`text-xs px-3 py-2.5 rounded-lg mb-5 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* OTP Boxes */}
          <div className="flex justify-between gap-2 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-11 h-12 text-center text-lg font-semibold text-gray-800 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
                  ${digit ? 'border-blue-400' : 'border-gray-200'}`}
              />
            ))}
          </div>

          <Button type="submit" loading={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </form>

        {/* Resend */}
        <div className="mt-5 text-center">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 cursor-pointer transition-colors"
            >
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          ) : (
            <p className="text-xs text-gray-400">
              Resend OTP in{' '}
              <span className="text-gray-600 font-medium tabular-nums">
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                {String(countdown % 60).padStart(2, '0')}
              </span>
            </p>
          )}
        </div>

        <button
          onClick={() => navigate('/signup')}
          className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          ← Back to Sign Up
        </button>
      </div>
    </div>
  );
}
