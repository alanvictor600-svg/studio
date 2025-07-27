
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import type { FC, ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  enableSystem?: boolean;
}

interface ThemeProviderState {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
  resolvedTheme: string;
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export const ThemeProvider: FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  enableSystem = true,
}) => {
  const [theme, setTheme] = useState<string>('system');
  const [resolvedTheme, setResolvedTheme] = useState<string>('light');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedTheme = localStorage.getItem(storageKey);
      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        setTheme(storedTheme);
      } else {
        setTheme(defaultTheme);
      }
    } catch (e) {
      console.error('Could not access localStorage for theme.', e);
      setTheme(defaultTheme);
    }
  }, [storageKey, defaultTheme]);

  useEffect(() => {
    if (!isMounted) return;

    const applyTheme = (currentTheme: string) => {
      let effectiveTheme = currentTheme;
      if (currentTheme === 'system' && enableSystem) {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(effectiveTheme);
      setResolvedTheme(effectiveTheme);
    };

    applyTheme(theme); // Apply on initial mount and when theme preference changes

    if (theme === 'system' && enableSystem) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, isMounted, enableSystem]);

  const value = {
    theme,
    setTheme: (newTheme: string) => {
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (e) {
        console.error('Could not save theme to localStorage.', e);
      }
      setTheme(newTheme);
    },
    toggleTheme: () => {
      // Toggle based on the actual theme being shown
      const nextTheme = resolvedTheme === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem(storageKey, nextTheme);
      } catch (e) {
        console.error('Could not save theme to localStorage.', e);
      }
      setTheme(nextTheme);
    },
    resolvedTheme: isMounted ? resolvedTheme : 'light', // Provide a default during SSR
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
};

export const useTheme = (): ThemeProviderState => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

    