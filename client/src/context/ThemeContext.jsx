import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'campusconnect-theme';
const ThemeContext = createContext(null);

const getSavedTheme = () => {
  try {
    const preference = localStorage.getItem(STORAGE_KEY);
    return ['system', 'light', 'dark'].includes(preference) ? preference : 'system';
  } catch {
    return 'system';
  }
};

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(getSavedTheme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark = preference === 'dark' || (preference === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    };

    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [preference]);

  const value = useMemo(() => ({
    preference,
    setPreference: (nextPreference) => {
      if (!['system', 'light', 'dark'].includes(nextPreference)) return;
      try {
        localStorage.setItem(STORAGE_KEY, nextPreference);
      } catch {
        // Theme preference remains active for this session if storage is unavailable.
      }
      setPreference(nextPreference);
    },
  }), [preference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Keep this hook export alongside the provider so the theme state remains centralized.
// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider.');
  return context;
};
