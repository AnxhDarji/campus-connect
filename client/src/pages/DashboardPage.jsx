import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ["Super Admin", "Dept Admin", "Admin"];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (user && ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/admin" replace />;
  }

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

        <div className="flex flex-col gap-2 mb-6">
          <button
            onClick={() => navigate('/events/create')}
            className="w-full py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + Create Event Request
          </button>
          <button
            onClick={() => navigate('/events/my')}
            className="w-full py-2 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition"
          >
            My Event Requests
          </button>
        </div>

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
