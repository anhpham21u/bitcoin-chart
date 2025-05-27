'use client';

import { Clock } from 'lucide-react';
import { TimeFrame } from '@/types/chart';
import { getTimeFrameDisplayName, cn } from '@/lib/utils';

interface ControlPanelProps {
  timeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
}

const timeFrames: TimeFrame[] = [
  '1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'
];

export function ControlPanel({
  timeFrame,
  onTimeFrameChange,
}: ControlPanelProps) {
  return (
    <div className="space-y-4">
      {/* Lựa chọn khung thời gian */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-center space-x-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Khung thời gian</h3>
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
                  : "border border-input bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer"
              )}
              title={getTimeFrameDisplayName(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 