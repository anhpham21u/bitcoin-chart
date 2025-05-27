'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

export function Header() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Bitcoin Logo */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-lg">
              ₿
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Bitcoin Chart
              </h1>
              <p className="text-sm text-muted-foreground">
                Real-time Bitcoin price analysis
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={cycleTheme}
              className={cn(
                "flex items-center justify-center rounded-md p-2",
                "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                "transition-colors duration-200"
              )}
              title={`Current theme: ${theme}. Click to cycle themes.`}
            >
              {getThemeIcon()}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 