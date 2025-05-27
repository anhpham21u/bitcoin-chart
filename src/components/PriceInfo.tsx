'use client';

import { RefreshCw, Wifi, WifiOff, TrendingUp, TrendingDown } from 'lucide-react';
import { formatPrice, formatPercentage, cn } from '@/lib/utils';

interface PriceInfoProps {
  currentPrice: number;
  priceChange: number;
  isConnected: boolean;
}

export function PriceInfo({ 
  currentPrice, 
  priceChange, 
  isConnected, 
}: PriceInfoProps) {
  const priceChangePercent = currentPrice > 0 ? (priceChange / currentPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        {/* Thông tin giá */}
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-bold text-foreground">
              ${currentPrice > 0 ? formatPrice(currentPrice) : '--'}
            </h2>
            {priceChange !== 0 && (
              <div className={cn(
                "flex items-center space-x-1 rounded-md px-2 py-1 text-sm font-medium",
                isPositive 
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
              )}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {formatPercentage(priceChangePercent)}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>BTC/USDT</span>
            {priceChange !== 0 && (
              <span className={cn(
                "font-medium",
                isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {isPositive ? '+' : ''}${formatPrice(Math.abs(priceChange))}
              </span>
            )}
          </div>
        </div>

        {/* Điều khiển */}
        <div className="flex items-center space-x-4">
          {/* Trạng thái kết nối */}
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <>
                <Wifi className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600 dark:text-green-400">Trực tiếp</span>
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-600 dark:text-red-400">Ngắt kết nối</span>
              </>
            )}
          </div>
          
          {/* Nút refresh */}
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>
    </div>
  );
} 