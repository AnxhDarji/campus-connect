import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm px-8 py-10 text-center">
        <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-1">CHARUSAT</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome, {user?.fullName}!</h2>
        <p className="text-xs text-gray-400 mb-1">{user?.email}</p>
        <p className="text-xs text-gray-400 mb-6">Role: <span className="font-medium text-gray-600">{user?.role}</span></p>
        <button
          onClick={handleLogout}
          className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
