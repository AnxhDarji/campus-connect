import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import ThemePreference from '../components/ThemePreference';
import PageTransition from '../components/PageTransition';

const ADMIN_ROLES = ['Super Admin', 'Dept Admin', 'Admin'];

function getLoginError(error) {
  const status = error.response?.status;
  const responseMessage = error.response?.data?.message;

  if (!error.response) {
    return 'The sign-in service is not reachable right now. Please try again in a moment.';
  }

  if (status === 400) {
    if (responseMessage === 'Institution email or ID is required.') {
      return 'Enter your institution email or ID.';
    }
    if (responseMessage === 'Password is required.') {
      return 'Enter your password.';
    }
    return 'Check your sign-in details and try again.';
  }

  if (status === 401) {
    return responseMessage === 'Your account has been deactivated.'
      ? 'This account is currently deactivated. Contact your administrator for help.'
      : 'The institution email/ID or password is incorrect.';
  }

  if (status === 403) {
    return 'Please verify your email address before signing in.';
  }

  if (status === 404) {
    return 'The sign-in service is temporarily unavailable. Please try again later.';
  }

  return 'We could not sign you in right now. Please try again.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError('');
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const identifier = form.identifier.trim();
    if (!identifier) {
      setError('Enter your institution email or ID.');
      return;
    }
    if (!form.password) {
      setError('Enter your password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await login({ identifier, password: form.password });
      const user = response.data.user;
      setUser(user);
      navigate(ADMIN_ROLES.includes(user?.role) ? '/admin' : '/dashboard', {
        replace: true,
      });
    } catch (requestError) {
      setError(getLoginError(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <main className="min-h-dvh bg-slate-50 lg:grid lg:grid-cols-2">
      <section className="relative flex min-h-[230px] flex-col justify-between overflow-hidden bg-[var(--cc-navy)] px-6 py-7 text-white sm:px-10 sm:py-9 lg:min-h-dvh lg:px-14 lg:py-12 xl:px-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full border border-white/[0.07]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border border-white/[0.07]"
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="cc-login-brand-mark flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold">
            C
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">CampusConnect</p>
            <p className="mt-0.5 text-[10px] font-medium tracking-[0.16em] text-white/55">
              CHARUSAT
            </p>
          </div>
        </div>

        <div className="relative z-10 hidden max-w-lg py-12 lg:block">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200/75">
            CHARUSAT campus portal
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Your campus,
            <br />
            connected.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-300/75">
            Sign in to stay up to date with campus events and manage your
            university activities in one place.
          </p>
        </div>

        <p className="relative z-10 hidden text-xs text-white/45 lg:block">
          CHARUSAT University, Anand, Gujarat
        </p>
      </section>

      <section className="relative flex items-center justify-center px-5 py-16 sm:px-8 lg:px-12">
        <div className="absolute right-5 top-5 sm:right-8 lg:right-12">
          <ThemePreference />
        </div>
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold text-blue-700 lg:hidden">
              CHARUSAT CampusConnect
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Sign in
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to CampusConnect with your university account.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="login-identifier"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Institution email or ID
              </label>
              <input
                id="login-identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                placeholder="Email address or institution ID"
                value={form.identifier}
                onChange={handleChange}
                aria-invalid={Boolean(error && !form.identifier.trim())}
                aria-describedby="login-identifier-help"
                className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                required
              />
              <span id="login-identifier-help" className="sr-only">
                Enter your CHARUSAT email address or institution ID.
              </span>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(error && !form.password)}
                  className="h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 pr-16 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 rounded-r-lg px-3 text-xs font-semibold text-slate-500 outline-none hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="min-h-[48px]">
              {error && (
                <p
                  role="alert"
                  aria-live="polite"
                  className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-700/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading && (
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-90"
                    fill="currentColor"
                    d="M12 3a9 9 0 0 0-9 9h3a6 6 0 0 1 6-6V3Z"
                  />
                </svg>
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Need an account?{' '}
            <Link to="/signup" className="font-semibold text-blue-700 hover:text-blue-800">
              Create one
            </Link>
          </p>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-7 w-full rounded-md py-2 text-sm font-medium text-slate-500 outline-none transition hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Back to home
          </button>
        </div>
      </section>
      </main>
    </PageTransition>
  );
}
