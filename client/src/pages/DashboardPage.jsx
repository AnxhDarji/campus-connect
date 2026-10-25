import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarIcon, ClipboardAddIcon, ClipboardListIcon, UserCircleIcon, ArrowRightIcon } from '@solar-icons/react/linear';

const shortcuts = [
  {
    title: 'Campus events',
    description: 'Browse events available through CampusConnect.',
    path: '/events',
    action: 'Browse events',
    Icon: CalendarIcon,
  },
  {
    title: 'Create an event request',
    description: 'Start a request to organize a campus event.',
    path: '/events/create',
    action: 'Create request',
    Icon: ClipboardAddIcon,
  },
  {
    title: 'My requests',
    description: 'Review the event requests you have submitted.',
    path: '/events/my',
    action: 'View my requests',
    Icon: ClipboardListIcon,
  },
  {
    title: 'Profile',
    description: 'Review your account details and profile information.',
    path: '/profile',
    action: 'View profile',
    Icon: UserCircleIcon,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const heading = user?.fullName ? `Welcome back, ${user.fullName}` : 'Welcome to CampusConnect';
  const [typedState, setTypedState] = useState(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return { heading, text: isReducedMotion ? heading : '' };
  });
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const typedHeading = typedState.heading === heading
    ? typedState.text
    : isReducedMotion ? heading : '';

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timeout;
    let index = 0;
    const typeNextCharacter = () => {
      index += 1;
      setTypedState({ heading, text: heading.slice(0, index) });
      if (index < heading.length) {
        const lastCharacter = heading[index - 1];
        const delay = /[,!?.]/.test(lastCharacter) ? 150 : 48 + Math.random() * 20;
        timeout = window.setTimeout(typeNextCharacter, delay);
      }
    };

    const handleMotionPreferenceChange = (event) => {
      if (event.matches) {
        window.clearTimeout(timeout);
        setTypedState({ heading, text: heading });
      }
    };

    motionPreference.addEventListener('change', handleMotionPreferenceChange);
    if (!motionPreference.matches) {
      timeout = window.setTimeout(typeNextCharacter, 140);
    }
    return () => {
      window.clearTimeout(timeout);
      motionPreference.removeEventListener('change', handleMotionPreferenceChange);
    };
  }, [heading]);

  return (
    <div className="mx-auto w-full max-w-5xl py-6 sm:py-10">
      <header className="border-b border-gray-200 pb-7 sm:pb-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
          Student workspace
        </p>
        <h1
          aria-label={heading}
          className="cc-dashboard-typewriter mt-3 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl"
        >
          <span aria-hidden="true" className="cc-dashboard-typewriter-reserve">{heading}</span>
          <span aria-hidden="true" className="cc-dashboard-typewriter-text">
            <span className="cc-dashboard-typewriter-cursor">{typedHeading}</span>
          </span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
          Find campus events, manage your event requests, and review your account.
        </p>
      </header>

      <section className="pt-7 sm:pt-9" aria-labelledby="dashboard-shortcuts">
        <div className="mb-5">
          <h2 id="dashboard-shortcuts" className="text-lg font-semibold text-gray-900">
            Shortcuts
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Go directly to a CampusConnect feature.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {shortcuts.map(({ Icon, ...shortcut }) => (
            <li key={shortcut.path}>
              <Link
                to={shortcut.path}
                className="cc-interactive-card group flex h-full min-h-36 flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 transition-[transform,border-color,background-color,box-shadow] duration-200 hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              >
                <div className="flex items-start gap-3.5">
                  <span className="cc-icon-tile" aria-hidden="true">
                    <Icon size={22} strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 transition group-hover:text-blue-800">
                      {shortcut.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-gray-600">
                      {shortcut.description}
                    </p>
                  </div>
                </div>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                  {shortcut.action}
                  <ArrowRightIcon aria-hidden="true" size={16} strokeWidth={1.8} className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
