import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemePreference from './ThemePreference';
import { useSignOut } from '../context/SignOutContext';
import { HamburgerMenuIcon, CloseIcon, UserCircleIcon, LogoutIcon } from '@solar-icons/react/linear';

const links = [
  { label: 'Home', path: '/dashboard' },
  { label: 'Events', path: '/events' },
  { label: 'My requests', path: '/events/my' },
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
      className={`block rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-focus)] ${
        isActive(link.path)
          ? 'bg-[var(--cc-ice)] text-[var(--cc-ocean)] font-semibold'
          : 'text-[var(--cc-muted)] hover:bg-[var(--cc-raised)] hover:text-[var(--cc-text)]'
      } ${mobile ? 'w-full' : ''}`}
    >
      {link.label}
    </Link>
  ));

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--cc-border)] bg-[var(--cc-surface)]/95 backdrop-blur transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-7">
          <Link
            to="/dashboard"
            aria-label="CampusConnect Dashboard"
            className="shrink-0 flex items-center py-1 transition-opacity hover:opacity-95"
          >
            <img
              src="/CampusConnect_logo.png"
              alt="CampusConnect"
              className="cc-brand-logo"
            />
          </Link>
          <div className="hidden items-center gap-1 lg:flex">
            {renderLinks()}
          </div>
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemePreference />
          {isAdmin && (
            <Link
              to="/admin"
              className="rounded-lg border border-[var(--cc-border)] px-3 py-1.5 text-xs font-semibold text-[var(--cc-text)] transition hover:bg-[var(--cc-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-focus)]"
            >
              Admin Panel
            </Link>
          )}
          <div className="flex items-center gap-2">
            <div className="max-w-36 text-right">
              <p className="truncate text-sm font-semibold text-[var(--cc-text)]">{user?.fullName}</p>
              <p className="truncate text-[11px] font-medium text-[var(--cc-muted)]">{user?.role}</p>
            </div>
            <Link
              to="/profile"
              aria-label="Profile"
              title="Profile"
              className="cc-icon-button cc-icon-button--profile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-focus)]"
            >
              <UserCircleIcon size={20} strokeWidth={1.8} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
              className="cc-icon-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-focus)] cursor-pointer"
            >
              <LogoutIcon size={20} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--cc-border)] text-[var(--cc-text)] transition hover:bg-[var(--cc-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-focus)] lg:hidden cursor-pointer"
        >
          {mobileMenuOpen ? (
            <CloseIcon size={20} strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <HamburgerMenuIcon size={20} strokeWidth={1.8} aria-hidden="true" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-navigation" className="border-t border-[var(--cc-border)] bg-[var(--cc-surface)] px-4 py-4 lg:hidden shadow-lg animate-in fade-in slide-in-from-top-1">
          <div className="space-y-1">{renderLinks(true)}</div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--cc-border)] pt-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--cc-text)]">{user?.fullName}</p>
              <p className="truncate text-xs text-[var(--cc-muted)]">{user?.role}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemePreference />
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Profile"
                title="Profile"
                className="cc-icon-button cc-icon-button--profile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-focus)]"
              >
                <UserCircleIcon size={20} strokeWidth={1.8} aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign out"
                title="Sign out"
                className="cc-icon-button focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-focus)] cursor-pointer"
              >
                <LogoutIcon size={20} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          </div>
          {isAdmin && (
            <div className="mt-4 flex items-center justify-between gap-3 pt-2">
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border border-[var(--cc-border)] px-3 py-2 text-xs font-semibold text-[var(--cc-text)] transition hover:bg-[var(--cc-raised)]"
              >
                Admin Panel
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
