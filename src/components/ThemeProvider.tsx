'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'bitcoin-chart-theme',
  ...props
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>(defaultTheme); // Initialize with defaultTheme for SSR and initial client render

  // Effect to set mounted and load theme from localStorage on client side
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem(storageKey) as Theme;
    // Validate storedTheme against allowed types before setting
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    } else {
      // If stored theme is invalid (e.g., old 'system'), fallback to defaultTheme and update localStorage
      setTheme(defaultTheme);
      localStorage.setItem(storageKey, defaultTheme);
    }
  }, [defaultTheme, storageKey]);

  // Effect to apply theme to DOM
  useEffect(() => {
    // Only run this effect if mounted, to prevent trying to access document on server
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme, mounted]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (!mounted) return; // Prevent setting theme if not yet mounted (e.g. during SSR)
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  // To prevent hydration mismatch, we can return a placeholder or null if not mounted,
  // or ensure the initial render matches SSR. Here, we ensure initial `theme` state matches SSR.
  // The actual theme update from localStorage happens in useEffect after mount.

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
}; 