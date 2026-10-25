import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemePreference from '../components/ThemePreference';
import Button from '../components/Button';
import PageTransition from '../components/PageTransition';
import { register } from '../services/authService';
import {
  isValidInstitutionEmail,
  getInstitutionIdFromEmail,
  validatePassword,
} from '../utils/validation';

const passwordRules = [
  { label: 'At least 8 characters', test: (password) => password.length >= 8 },
  { label: 'One uppercase letter', test: (password) => /[A-Z]/.test(password) },
  { label: 'One lowercase letter', test: (password) => /[a-z]/.test(password) },
  { label: 'One number', test: (password) => /[0-9]/.test(password) },
  {
    label: 'One special character',
    test: (password) => [...password].some((character) => "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?".includes(character)),
  },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    institutionId: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'fullName') {
      setErrors((previous) => ({
        ...previous,
        fullName:
          value && !/^[a-zA-Z ]+$/.test(value)
            ? 'Name can only contain letters and spaces.'
            : null,
      }));
      setForm((previous) => ({ ...previous, fullName: value }));
      return;
    }

    if (name === 'email') {
      setForm((previous) => ({
        ...previous,
        email: value,
        institutionId: getInstitutionIdFromEmail(value),
      }));
      setErrors((previous) => ({
        ...previous,
        email: value && !isValidInstitutionEmail(value)
          ? 'Only Charusat email is allowed.'
          : null,
      }));
      return;
    }

    if (name === 'password') {
      setErrors((previous) => ({
        ...previous,
        password: value ? validatePassword(value) : null,
      }));
    }

    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const newErrors = {};
    if (!isValidInstitutionEmail(form.email)) {
      newErrors.email = 'Only Charusat email is allowed.';
    }
    const passwordError = validatePassword(form.password);
    if (passwordError) newErrors.password = passwordError;
    if (form.fullName && !/^[a-zA-Z ]+$/.test(form.fullName)) {
      newErrors.fullName = 'Name can only contain letters and spaces.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await register(form);
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (error) {
      const status = error.response?.status;
      const text = !status || status === 404
        ? 'Registration service is currently unavailable. Please try again later.'
        : error.response?.data?.message || error.response?.data?.error || 'Something went wrong.';
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <main className="min-h-dvh bg-[var(--cc-bg)] px-5 py-8 text-[var(--cc-text)] sm:px-8">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/CampusConnect_logo.png" alt="CampusConnect" className="cc-brand-logo cc-brand-logo--auth" />
        </Link>
        <ThemePreference />
      </header>

      <section className="mx-auto w-full max-w-md py-10 sm:py-14">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2078C0]">
            CHARUSAT account
          </p>
          <h1 className="font-heading mt-2 text-3xl font-bold tracking-tight text-[var(--cc-text)]">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--cc-muted)]">
            Use your institution email to get started with CampusConnect.
          </p>
        </div>

        {message && (
          <div
            role="alert"
            className={`mb-5 rounded-lg border px-3.5 py-3 text-sm ${
              message.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="signup-full-name" className="mb-1.5 block text-sm font-medium text-[var(--cc-text)]">
              Full name
            </label>
            <input
              id="signup-full-name"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={form.fullName}
              onChange={handleChange}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? 'signup-name-error' : undefined}
              className="h-11 w-full rounded-lg border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3.5 text-sm text-[var(--cc-text)] outline-none transition placeholder:text-[var(--cc-muted)] hover:border-[#2078C0]/50 focus:border-[#2078C0] focus:ring-4 focus:ring-[#2078C0]/10"
              required
            />
            {errors.fullName && (
              <p id="signup-name-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {errors.fullName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-[var(--cc-text)]">
              Institution email
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@charusat.edu.in"
              value={form.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'signup-email-error' : undefined}
              className="h-11 w-full rounded-lg border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3.5 text-sm text-[var(--cc-text)] outline-none transition placeholder:text-[var(--cc-muted)] hover:border-[#2078C0]/50 focus:border-[#2078C0] focus:ring-4 focus:ring-[#2078C0]/10"
              required
            />
            {errors.email && (
              <p id="signup-email-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="signup-institution-id" className="mb-1.5 block text-sm font-medium text-[var(--cc-text)]">
              Institution ID
            </label>
            <input
              id="signup-institution-id"
              name="institutionId"
              type="text"
              value={form.institutionId}
              placeholder="Automatically filled from your email"
              readOnly
              className="h-11 w-full rounded-lg border border-[var(--cc-border)] bg-[var(--cc-raised)] px-3.5 text-sm text-[var(--cc-muted)] outline-none cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-[var(--cc-text)]">
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'signup-password-error' : 'signup-password-rules'}
              className="h-11 w-full rounded-lg border border-[var(--cc-border)] bg-[var(--cc-surface)] px-3.5 text-sm text-[var(--cc-text)] outline-none transition placeholder:text-[var(--cc-muted)] hover:border-[#2078C0]/50 focus:border-[#2078C0] focus:ring-4 focus:ring-[#2078C0]/10"
              required
            />
            {errors.password && (
              <p id="signup-password-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
            {(passwordFocused || form.password) && (
              <ul id="signup-password-rules" className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
                {passwordRules.map((rule) => {
                  const passed = rule.test(form.password);
                  return (
                    <li
                      key={rule.label}
                      className={`text-xs flex items-center gap-1.5 ${passed ? 'text-[#48A090]' : 'text-[var(--cc-muted)]'}`}
                    >
                      <span aria-hidden="true">{passed ? '✓' : '·'}</span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" loading={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--cc-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#2078C0] hover:text-[#1a68a8]">
            Sign in
          </Link>
        </p>
        <Link
          to="/"
          className="mt-5 block text-center text-sm text-[var(--cc-muted)] transition hover:text-[#2078C0]"
        >
          Back to home
        </Link>
      </section>
      </main>
    </PageTransition>
  );
}
