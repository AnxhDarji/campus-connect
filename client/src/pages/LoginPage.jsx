import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { login } from '../services/authService';
import { isValidInstitutionEmail } from '../utils/validation';
import { useAuth } from '../context/AuthContext';

const passwordRules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$...)', test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'email') {
      if (value && !isValidInstitutionEmail(value)) {
        setErrors((prev) => ({ ...prev, email: 'Only Charusat email is allowed!' }));
      } else {
        setErrors((prev) => ({ ...prev, email: null }));
      }
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidInstitutionEmail(form.email)) {
      setErrors({ email: 'Only Charusat email is allowed!' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await login({ email: form.email, password: form.password });
      setUser(res.data.user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      let text;
      if (!status || status === 404) {
        text = 'Login service is currently under development. Please try again later.';
      } else if (status === 400 || status === 401) {
        text = err.response?.data?.message || 'Invalid email or password.';
      } else {
        text = err.response?.data?.message || 'Something went wrong.';
      }
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm px-8 py-10">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-1">
            CHARUSAT
          </p>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-xs text-gray-400 mt-1">Sign in to CampusConnect</p>
        </div>

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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Input
              label="Institution Email"
              type="email"
              name="email"
              placeholder="you@charusat.edu.in"
              value={form.email}
              onChange={handleChange}
              required
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Input
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              required
            />
            {(passwordFocused || form.password) && (
              <ul className="mt-1 flex flex-col gap-1">
                {passwordRules.map((rule) => {
                  const passed = rule.test(form.password);
                  return (
                    <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-green-600' : 'text-gray-400'}`}>
                      <span>{passed ? '✓' : '○'}</span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-1">
            <Button type="submit" loading={loading}>
              {loading ? 'Logging In...' : 'Login'}
            </Button>
          </div>
        </form>

        <button
          onClick={() => navigate('/')}
          className="mt-5 w-full text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
