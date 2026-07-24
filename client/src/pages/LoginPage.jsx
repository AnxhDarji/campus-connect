import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { login } from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await login({ email: form.email, password: form.password });
      setMessage({ type: 'success', text: res.data?.message || 'Login successful.' });
    } catch (err) {
      const status = err.response?.status;
      let text;
      if (!status || status === 404) {
        text = 'Login service is currently under development. Please try again later.';
      } else if (status === 400 || status === 401) {
        text = 'Login Failed';
      } else {
        text = err.response?.data?.message || err.response?.data?.error || 'Something went wrong.';
      }
      setMessage({ type: 'error', text });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm px-8 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-1">
            CHARUSAT
          </p>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="text-xs text-gray-400 mt-1">Sign in to CampusConnect</p>
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Institution Email"
            type="email"
            name="email"
            placeholder="you@charusat.edu.in"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            required
          />
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
