'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-full bg-secondary/50 animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative flex items-center justify-center w-10 h-10 rounded-full bg-secondary/50 hover:bg-secondary border border-border transition-all duration-300 group overflow-hidden"
      aria-label="Alternar tema"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun 
          className={`absolute w-full h-full text-primary transition-all duration-500 transform ${
            theme === 'dark' ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'
          }`} 
        />
        <Moon 
          className={`absolute w-full h-full text-primary transition-all duration-500 transform ${
            theme === 'dark' ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
          }`} 
        />
      </div>
      <span className="absolute inset-0 bg-primary/10 scale-0 group-hover:scale-100 rounded-full transition-transform duration-300" />
    </button>
  );
}
