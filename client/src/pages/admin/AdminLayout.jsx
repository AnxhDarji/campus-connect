import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { adminGetStats } from "../../services/eventService";

const NAV = [
  { label: "Dashboard", path: "/admin", icon: "⊞" },
  { label: "Pending", path: "/admin/pending", icon: "⏳" },
  { label: "Approved", path: "/admin/approved", icon: "✅" },
  { label: "Rejected", path: "/admin/rejected", icon: "✗" },
  { label: "All Requests", path: "/admin/all", icon: "☰" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    adminGetStats().then((r) => setStats(r.data.data)).catch(() => {});
  }, [location.pathname]);

  const isActive = (path) =>
    path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-100 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:flex`}
      >
        <div className="px-5 py-5 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">CampusConnect</p>
          <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map((n) => (
            <button
              key={n.path}
              onClick={() => { navigate(n.path); setSidebarOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition text-left w-full ${
                isActive(n.path)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-base leading-none">{n.icon}</span>
              {n.label}
              {n.path === "/admin/pending" && stats?.pending > 0 && (
                <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full">
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-700 truncate">{user?.fullName}</p>
          <p className="text-xs text-gray-400 truncate">{user?.role}</p>
          <button
            onClick={logout}
            className="mt-2 text-xs text-red-500 hover:text-red-600 font-medium"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            ☰
          </button>
          <p className="text-sm font-semibold text-gray-900">Admin Panel</p>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {location.pathname === "/admin" && stats && (
            <div className="mb-6">
              <h1 className="text-lg font-bold text-gray-900 mb-4">Dashboard</h1>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Pending", value: stats.pending, textColor: "text-amber-600", border: "border-amber-100" },
                  { label: "Approved Today", value: stats.approvedToday, textColor: "text-green-600", border: "border-green-100" },
                  { label: "Rejected", value: stats.rejected, textColor: "text-red-600", border: "border-red-100" },
                  { label: "Total", value: stats.total, textColor: "text-blue-600", border: "border-blue-100" },
                ].map((s) => (
                  <div key={s.label} className={`bg-white rounded-xl border ${s.border} p-4`}>
                    <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${s.textColor}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-white rounded-xl border border-gray-100 p-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => navigate("/admin/pending")} className="px-4 py-2 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition">
                    Review Pending ({stats.pending})
                  </button>
                  <button onClick={() => navigate("/admin/all")} className="px-4 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                    View All Requests
                  </button>
                </div>
              </div>
            </div>
          )}
          <Outlet context={{ stats }} />
        </main>
      </div>
    </div>
  );
}
