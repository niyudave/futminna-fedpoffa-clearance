import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/src/context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  className = '',
}) => {
  const { theme, isDark, setTheme } = useTheme();

  const handleToggle = () => {
    // Explicitly toggle between 'light' and 'dark'
    const nextTheme = (theme === 'dark' || isDark) ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <button
      id="theme-toggle-btn"
      type="button"
      onClick={handleToggle}
      className={`relative p-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-[#1E162E] dark:hover:bg-[#281E3D] dark:text-[#E8DCFB] dark:border-[#382B54] focus:outline-none focus:ring-2 focus:ring-[#2E0854] dark:focus:ring-[#8A4FDC] ${className}`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-[#D4A359] transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-[#2E0854] transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}

      {showLabel && (
        <span className="text-xs font-semibold whitespace-nowrap">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
