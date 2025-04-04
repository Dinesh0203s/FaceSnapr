import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize theme from theme.json (which is applied at build time)
  // The default here is a fallback only, the actual initial value comes from the document
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if document is defined (for SSR)
    if (typeof document !== 'undefined') {
      // Get the current theme from HTML data attribute or compute it
      const htmlElement = document.documentElement;
      const currentTheme = htmlElement.getAttribute('data-theme') as Theme;
      return currentTheme || 'dark';
    }
    return 'dark';
  });

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Update theme in the DOM and save to localStorage
  useEffect(() => {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-theme', theme);
    
    // Update class for Tailwind dark mode
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    
    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);
    
    // Attempt to update theme.json via API
    // This is optional and would need a corresponding API endpoint
    fetch('/api/theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appearance: theme }),
    }).catch(() => {
      // Silent fail - the theme will still work client-side
      // even if we can't update the JSON file
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}