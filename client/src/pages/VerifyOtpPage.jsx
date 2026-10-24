import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import ThemePreference from '../components/ThemePreference';
import { verifyOtp, resendOtp } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState(null);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/signup', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = setTimeout(() => setCountdown((previous) => previous - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);
    setMessage(null);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const nextOtp = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((digit, index) => {
      nextOtp[index] = digit;
    });
    setOtp(nextOtp);
    setMessage(null);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < OTP_LENGTH) {
      setMessage({ type: 'error', text: 'Please enter the complete 6-digit code.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await verifyOtp({ email, otp: otpValue });
      setUser(response.data.user);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const status = error.response?.status;
      let text;
      if (status === 410) {
        text = 'This code has expired. Request a new one to continue.';
      } else if (status === 401) {
        text = 'The code is incorrect. Check it and try again.';
      } else {
        text = error.response?.data?.message || 'We could not verify the code right now. Please try again.';
      }
      setMessage({ type: 'error', text });
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setMessage(null);
    try {
      const response = await resendOtp({ email });
      setMessage({ type: 'success', text: response.data?.message || 'A new code has been sent.' });
      setOtp(Array(OTP_LENGTH).fill(''));
      setCountdown(RESEND_COOLDOWN);
      inputRefs.current[0]?.focus();
    } catch (error) {
      const text = error.response?.status === 429
        ? 'The maximum number of resend attempts has been reached. Please sign up again.'
        : error.response?.data?.message || 'We could not resend the code. Please try again.';
      setMessage({ type: 'error', text });
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, first, middle, domain) => first + '*'.repeat(middle.length) + domain)
    : '';

  return (
    <PageTransition>
      <main className="min-h-dvh bg-gray-50 px-5 py-8 text-gray-900 sm:px-8">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link to="/" className="text-base font-semibold tracking-tight text-gray-900">
          CampusConnect
        </Link>
        <ThemePreference />
      </header>

      <section className="mx-auto w-full max-w-md py-10 sm:py-14">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Email verification
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            Verify your email
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Enter the 6-digit code sent to{' '}
            <span className="font-medium text-gray-800">{maskedEmail}</span>.
          </p>
        </div>

        {message && (
          <div
            role={message.type === 'error' ? 'alert' : 'status'}
            aria-live={message.type === 'error' ? 'assertive' : 'polite'}
            className={`mb-5 rounded-lg border px-3.5 py-3 text-sm ${
              message.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset className="m-0 min-w-0 border-0 p-0" disabled={loading}>
            <legend className="sr-only">6-digit verification code</legend>
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                  className={`h-12 min-w-0 w-10 rounded-lg border bg-white text-center text-lg font-semibold text-gray-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 sm:h-14 sm:w-12 ${
                    digit ? 'border-blue-400' : 'border-gray-300'
                  }`}
                />
              ))}
            </div>
          </fieldset>

          <div className="mt-6">
            <Button type="submit" loading={loading}>
              {loading ? 'Verifying...' : 'Verify email'}
            </Button>
          </div>
        </form>

        <div className="mt-5 text-center text-sm">
          {countdown <= 0 ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-semibold text-blue-700 transition hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          ) : (
            <p className="text-gray-500">
              You can request another code in{' '}
              <span className="font-medium tabular-nums text-gray-700">
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                {String(countdown % 60).padStart(2, '0')}
              </span>
            </p>
          )}
        </div>

        <Link
          to="/signup"
          className="mt-6 block text-center text-sm text-gray-500 transition hover:text-gray-700"
        >
          Back to sign up
        </Link>
      </section>
      </main>
    </PageTransition>
  );
}
