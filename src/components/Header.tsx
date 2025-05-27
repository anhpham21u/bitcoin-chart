'use client';

import { Bitcoin } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500">
            <Bitcoin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Biểu đồ Bitcoin</h1>
            <p className="text-sm text-muted-foreground">Phân tích giá Bitcoin real-time</p>
          </div>
        </div>
        
        <ThemeToggle />
      </div>
    </header>
  );
} 