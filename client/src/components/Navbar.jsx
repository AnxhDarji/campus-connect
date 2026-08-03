import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ onShowPlaceholder }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  const links = [
    { label: "Home", path: "/dashboard", type: "route" },
    { label: "Announcements & Events", path: "/events", type: "route" },
    { label: "Lost & Found", path: "lost-found", type: "placeholder" },
    { label: "CHARUSAT News", path: "news", type: "placeholder" },
    { label: "Profile", path: "/profile", type: "route" },
  ];

  const isAdmin = user && ["Super Admin", "Dept Admin", "Admin"].includes(user.role);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                CampusConnect
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <button
                  key={link.label}
                  onClick={() => {
                    if (link.type === "placeholder") {
                      onShowPlaceholder(link.label);
                    } else {
                      navigate(link.path);
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive(link.path)
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="px-4 py-2 rounded-lg text-sm font-medium text-amber-700 bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-all duration-200"
              >
                Admin Dashboard
              </Link>
            )}
            <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-700 truncate max-w-[120px]">{user?.fullName}</p>
                <p className="text-[10px] text-gray-400 font-mono truncate max-w-[120px]">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                title="Log Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-2 pt-2 pb-4 space-y-1 shadow-inner">
          {links.map((link) => (
            <button
              key={link.label}
              onClick={() => {
                setMobileMenuOpen(false);
                if (link.type === "placeholder") {
                  onShowPlaceholder(link.label);
                } else {
                  navigate(link.path);
                }
              }}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-base font-medium transition-all ${
                isActive(link.path)
                  ? "bg-blue-50 text-blue-600 font-semibold"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {link.label}
            </button>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-base font-medium text-amber-700 bg-amber-50 hover:bg-amber-100"
            >
              Admin Dashboard
            </Link>
          )}
          <div className="border-t border-gray-100 pt-3 mt-3 px-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">{user?.fullName}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
