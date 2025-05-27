import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BinanceKlineData, CandlestickData, VolumeData, TimeFrame } from '@/types/chart';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert Binance kline data to our chart format
export function convertBinanceData(klineData: BinanceKlineData[]): {
  candlestick: CandlestickData[];
  volume: VolumeData[];
} {
  const candlestick: CandlestickData[] = [];
  const volume: VolumeData[] = [];

  klineData.forEach((kline) => {
    const time = Math.floor(kline.openTime / 1000); // Convert to seconds
    const open = parseFloat(kline.open);
    const high = parseFloat(kline.high);
    const low = parseFloat(kline.low);
    const close = parseFloat(kline.close);
    const vol = parseFloat(kline.volume);

    candlestick.push({
      time,
      open,
      high,
      low,
      close,
    });

    volume.push({
      time,
      value: vol,
      color: close >= open ? '#26a69a' : '#ef5350', // Green for bullish, red for bearish
    });
  });

  return { candlestick, volume };
}

// Get Binance interval string from TimeFrame
export function getBinanceInterval(timeFrame: TimeFrame): string {
  const intervalMap: Record<TimeFrame, string> = {
    '1m': '1m',
    '3m': '3m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1h',
    '2h': '2h',
    '4h': '4h',
    '6h': '6h',
    '8h': '8h',
    '12h': '12h',
    '1d': '1d',
    '3d': '3d',
    '1w': '1w',
    '1M': '1M',
  };
  
  return intervalMap[timeFrame] || '5m';
}

// Format price with appropriate decimal places
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else if (price >= 1) {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  } else {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 6,
      maximumFractionDigits: 8,
    });
  }
}

// Format volume with K, M, B suffixes
export function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return (volume / 1e9).toFixed(2) + 'B';
  } else if (volume >= 1e6) {
    return (volume / 1e6).toFixed(2) + 'M';
  } else if (volume >= 1e3) {
    return (volume / 1e3).toFixed(2) + 'K';
  }
  return volume.toFixed(2);
}

// Format percentage change
export function formatPercentage(percentage: number): string {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(2)}%`;
}

// Get time frame display name
export function getTimeFrameDisplayName(timeFrame: TimeFrame): string {
  const displayMap: Record<TimeFrame, string> = {
    '1m': '1 Minute',
    '3m': '3 Minutes',
    '5m': '5 Minutes',
    '15m': '15 Minutes',
    '30m': '30 Minutes',
    '1h': '1 Hour',
    '2h': '2 Hours',
    '4h': '4 Hours',
    '6h': '6 Hours',
    '8h': '8 Hours',
    '12h': '12 Hours',
    '1d': '1 Day',
    '3d': '3 Days',
    '1w': '1 Week',
    '1M': '1 Month',
  };
  
  return displayMap[timeFrame] || timeFrame;
} 