import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import DashboardPage from './pages/DashboardPage';
import CreateEventPage from './pages/events/CreateEventPage';
import MyRequestsPage from './pages/events/MyRequestsPage';
import EditEventPage from './pages/events/EditEventPage';
import EventDetailsPage from './pages/events/EventDetailsPage';
import EventsFeedPage from './pages/events/EventsFeedPage';
import FestivalPage from './pages/events/FestivalPage';
import ProfilePage from './pages/ProfilePage';
import MainLayout from './components/MainLayout';
import AdminLayout from './pages/admin/AdminLayout';
import AdminRequestsPage from './pages/admin/AdminRequestsPage';
import AdminRequestDetailPage from './pages/admin/AdminRequestDetailPage';

const ADMIN_ROLES = ["Super Admin", "Dept Admin", "Admin"];

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!ADMIN_ROLES.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        
        {/* Main User Portal Layout */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/events" element={<EventsFeedPage />} />
          <Route path="/events/create" element={<CreateEventPage />} />
          <Route path="/events/my" element={<MyRequestsPage />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="/events/:id/edit" element={<EditEventPage />} />
          <Route path="/festivals/:festivalName" element={<FestivalPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={null} />
          <Route path="pending" element={<AdminRequestsPage statusFilter="Pending Approval" title="Pending Requests" />} />
          <Route path="approved" element={<AdminRequestsPage statusFilter="Approved" title="Approved Requests" />} />
          <Route path="rejected" element={<AdminRequestsPage statusFilter="Rejected" title="Rejected Requests" />} />
          <Route path="all" element={<AdminRequestsPage title="All Requests" />} />
          <Route path="requests/:id" element={<AdminRequestDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
