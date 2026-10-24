import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import EventCompletionPage from './pages/events/EventCompletionPage';
import EventReportPage from './pages/events/EventReportPage';
import ProfilePage from './pages/ProfilePage';
import MainLayout from './components/MainLayout';
import AdminLayout from './pages/admin/AdminLayout';
import AdminRequestsPage from './pages/admin/AdminRequestsPage';
import AdminRequestDetailPage from './pages/admin/AdminRequestDetailPage';
import ChatBot from './components/ChatBot';
import { SignOutProvider } from './components/SignOutConfirmation';
import LoadingState from './components/LoadingState';

const ADMIN_ROLES = ["Super Admin", "Dept Admin", "Admin"];

function AuthenticatedChatBot() {
  const { user, loading, setUser } = useAuth();
  const { pathname } = useLocation();
  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('campusconnect:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('campusconnect:unauthorized', handleUnauthorized);
  }, [setUser]);

  const isStudentRoute =
    pathname === "/dashboard" ||
    pathname === "/profile" ||
    pathname.startsWith("/events/") ||
    pathname === "/events" ||
    pathname.startsWith("/festivals/");
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const canAccessRoute = isStudentRoute || (isAdminRoute && ADMIN_ROLES.includes(user?.role));

  if (loading || !user || !canAccessRoute) return null;
  return <ChatBot />;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <LoadingState message="Restoring your session..." fullScreen />
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <LoadingState message="Restoring your session..." fullScreen />
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!ADMIN_ROLES.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <SignOutProvider>
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
            <Route path="/events/:id/complete" element={<EventCompletionPage />} />
            <Route path="/events/:id/report" element={<EventReportPage />} />
            <Route path="/festivals/:festivalName" element={<FestivalPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={null} />
            <Route path="pending" element={<AdminRequestsPage statusFilter="Pending Approval" title="Pending Requests" />} />
            <Route path="approved" element={<AdminRequestsPage statusFilter="Approved" title="Approved Requests" />} />
            <Route path="rejected" element={<AdminRequestsPage statusFilter="Rejected" title="Rejected Requests" />} />
            <Route path="completed" element={<AdminRequestsPage statusFilter="Approved" completionFilter="COMPLETED" title="Completion & AI Posters" />} />
            <Route path="all" element={<AdminRequestsPage title="All Requests" />} />
            <Route path="requests/:id" element={<AdminRequestDetailPage />} />
          </Route>
        </Routes>
        <AuthenticatedChatBot />
      </SignOutProvider>
    </BrowserRouter>
  );
}
