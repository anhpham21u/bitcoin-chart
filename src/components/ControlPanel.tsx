'use client';

import { Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { TimeFrame, TechnicalIndicators } from '@/types/chart';
import { getTimeFrameDisplayName, cn } from '@/lib/utils';

interface ControlPanelProps {
  timeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  indicators: TechnicalIndicators;
  onIndicatorToggle: (indicator: keyof TechnicalIndicators) => void;
}

const timeFrames: TimeFrame[] = [
  '1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'
];

export function ControlPanel({
  timeFrame,
  onTimeFrameChange,
  indicators,
  onIndicatorToggle,
}: ControlPanelProps) {
  return (
    <div className="space-y-4">
      {/* Timeframe Selection */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center space-x-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Time Frame</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {timeFrames.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeFrameChange(tf)}
              disabled={timeFrame === tf}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
                timeFrame === tf
                  ? "bg-primary text-primary-foreground cursor-not-allowed"
                  : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              )}
              title={getTimeFrameDisplayName(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Technical Indicators */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Technical Indicators</h3>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* RSI Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={indicators.rsi}
              onChange={() => onIndicatorToggle('rsi')}
              className="sr-only"
            />
            <div className={cn(
              "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
              indicators.rsi
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            )}>
              <BarChart3 className="h-4 w-4" />
              <span>RSI</span>
            </div>
          </label>

          {/* MACD Toggle */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={indicators.macd}
              onChange={() => onIndicatorToggle('macd')}
              className="sr-only"
            />
            <div className={cn(
              "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
              indicators.macd
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            )}>
              <TrendingUp className="h-4 w-4" />
              <span>MACD</span>
            </div>
          </label>
        </div>
        
        <div className="mt-3 text-xs text-muted-foreground">
          <p>RSI: Relative Strength Index (14-period)</p>
          <p>MACD: Moving Average Convergence Divergence (12,26,9)</p>
        </div>
      </div>
    </div>
  );
} 