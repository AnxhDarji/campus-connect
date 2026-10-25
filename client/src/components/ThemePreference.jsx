import { useTheme } from '../context/ThemeContext';
import { MonitorIcon, Sun2Icon, MoonIcon } from '@solar-icons/react/linear';

const themeOptions = [
  {
    value: 'system',
    label: 'Use system theme',
    Icon: MonitorIcon,
  },
  {
    value: 'light',
    label: 'Use light theme',
    Icon: Sun2Icon,
  },
  {
    value: 'dark',
    label: 'Use dark theme',
    Icon: MoonIcon,
  },
];

export default function ThemePreference({ className = '' }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="group"
      aria-label="Theme preference"
      className={`inline-flex w-fit items-center gap-1 rounded-full border border-[var(--cc-border)] bg-[var(--cc-surface)] p-1 shadow-sm max-[360px]:gap-0.5 max-[360px]:p-0.5 ${className}`}
    >
      {themeOptions.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={preference === value}
          title={label}
          onClick={() => setPreference(value)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-[background-color,color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2078C0] focus-visible:ring-offset-1 active:scale-95 max-[360px]:h-7 max-[360px]:w-7 sm:h-9 sm:w-9 ${
            preference === value
              ? 'bg-[var(--cc-raised)] text-[#2078C0] shadow-sm ring-1 ring-[#2078C0]/25 dark:text-[#3894DC]'
              : 'text-gray-500 hover:bg-[var(--cc-raised)] hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
