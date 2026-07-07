import { useState, useEffect } from 'react';

const LS_KEY = 'langbridge_theme';

export function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem(LS_KEY) || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(LS_KEY, theme);
  }, [theme]);

  const toggle = () => setThemeState(t => t === 'dark' ? 'light' : 'dark');
  const isDark = theme === 'dark';

  return { theme, toggle, isDark };
}
