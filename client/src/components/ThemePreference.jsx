import { useTheme } from '../context/ThemeContext';

export default function ThemePreference({ className = '' }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme preference"
      className={`inline-flex w-fit items-center gap-1 rounded-full border border-[var(--cc-border)] bg-[var(--cc-surface)] p-1 shadow-sm max-[360px]:gap-0.5 max-[360px]:p-0.5 ${className}`}
    >
      {[
        {
          value: 'system',
          label: 'Use system theme',
          icon: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
        },
        {
          value: 'light',
          label: 'Use light theme',
          icon: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
        },
        {
          value: 'dark',
          label: 'Use dark theme',
          icon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
        },
      ].map(({ value, label, icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={preference === value}
          title={label}
          onClick={() => setPreference(value)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-[background-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 active:scale-95 max-[360px]:h-7 max-[360px]:w-7 sm:h-9 sm:w-9 ${
            preference === value
              ? 'bg-[var(--cc-raised)] text-blue-700 shadow-sm ring-1 ring-[var(--cc-border)] dark:text-blue-200'
              : 'text-gray-500 hover:bg-[var(--cc-raised)] hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            {icon}
          </svg>
        </button>
      ))}
    </div>
  );
}
