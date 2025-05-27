'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      default:
        return <Moon className="h-5 w-5" />;
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        "flex items-center justify-center rounded-md p-2",
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        "transition-colors duration-200"
      )}
      title={`Theme hiện tại: ${theme === 'light' ? 'Sáng' : 'Tối'}. Click để chuyển đổi theme.`}
    >
      {getThemeIcon()}
    </button>
  );
} 