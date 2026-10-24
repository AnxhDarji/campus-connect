import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemePreference from './ThemePreference';
import { useSignOut } from '../context/SignOutContext';

const links = [
  { label: 'Home', path: '/dashboard' },
  { label: 'Events', path: '/events' },
  { label: 'My requests', path: '/events/my' },
  { label: 'Profile', path: '/profile' },
];

export default function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const requestSignOut = useSignOut();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    setMobileMenuOpen(false);
    requestSignOut();
  };

  const isActive = (path) => (
    path === '/events'
      ? location.pathname === path
        || (location.pathname.startsWith('/events/') && location.pathname !== '/events/my')
      : location.pathname === path
  );

  const isAdmin = user && ['Super Admin', 'Dept Admin', 'Admin'].includes(user.role);

  const renderLinks = (mobile = false) => links.map((link) => (
    <Link
      key={link.path}
      to={link.path}
      onClick={() => mobile && setMobileMenuOpen(false)}
      aria-current={isActive(link.path) ? 'page' : undefined}
      className={`block rounded-md px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${
        isActive(link.path)
          ? 'bg-blue-50 text-blue-800'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      } ${mobile ? 'w-full' : ''}`}
    >
      {link.label}
    </Link>
  ));

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-7">
          <Link to="/dashboard" className="shrink-0 text-base font-semibold tracking-tight text-gray-900">
            CampusConnect
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {renderLinks()}
          </div>
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <ThemePreference />
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              Admin
            </Link>
          )}
          <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
            <div className="max-w-36">
              <p className="truncate text-sm font-medium text-gray-800">{user?.fullName}</p>
              <p className="truncate text-xs text-gray-500">{user?.role}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md px-2.5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              Sign out
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 md:hidden"
        >
          {mobileMenuOpen ? 'Close' : 'Menu'}
        </button>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-navigation" className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
          <div className="space-y-1">{renderLinks(true)}</div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">{user?.fullName}</p>
              <p className="truncate text-xs text-gray-500">{user?.role}</p>
            </div>
            <ThemePreference />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
