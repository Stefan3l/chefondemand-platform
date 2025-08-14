'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = (theme ?? resolvedTheme) === 'dark';
  const [animating, setAnimating] = useState(false);

  const handleToggle = () => {
    if (animating) return; // prevenim click-uri repetate
    setAnimating(true);

    // La 45% din animație (~360ms din 800ms) schimbăm tema
    setTimeout(() => {
      setTheme(isDark ? 'light' : 'dark');
    }, 360);

    // Elimin overlay după animație
    setTimeout(() => {
      setAnimating(false);
    }, 800);
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className="relative flex items-center w-16 h-8 rounded-full bg-gray-300 dark:bg-gray-700 transition-colors duration-300 p-1"
      >
        <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        <span
          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-500`}
          style={{
            transform: isDark ? 'translateX(32px)' : 'translateX(0px)',
          }}
        />
        <div className="ml-auto">
          <Sun className="w-4 h-4 text-yellow-500" />
        </div>
      </button>

      {animating && <div className="theme-wipe animate" />}
    </>
  );
}
