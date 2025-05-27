import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BinanceKlineData, CandlestickData, VolumeData, TimeFrame } from '@/types/chart';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Chuyển đổi dữ liệu kline Binance sang định dạng biểu đồ của chúng ta
export function convertBinanceData(klineData: BinanceKlineData[]): {
  candlestick: CandlestickData[];
  volume: VolumeData[];
} {
  const candlestick: CandlestickData[] = [];
  const volume: VolumeData[] = [];

  klineData.forEach((kline) => {
    const time = Math.floor(kline.openTime / 1000); // Chuyển đổi sang giây
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
      color: close >= open ? '#26a69a' : '#ef5350', // Xanh cho tăng giá, đỏ cho giảm giá
    });
  });

  return { candlestick, volume };
}

// Lấy chuỗi interval Binance từ TimeFrame
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

// Định dạng giá
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

// Định dạng volume với hậu tố K, M, B
export function formatVolume(volume: number): string {
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(1)}B`;
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(1)}M`;
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(1)}K`;
  } else {
    return volume.toFixed(0);
  }
}

// Định dạng phần trăm
export function formatPercentage(percentage: number): string {
  return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
}

// Lấy tên hiển thị cho timeframe
export function getTimeFrameDisplayName(timeFrame: TimeFrame): string {
  const displayNames: Record<TimeFrame, string> = {
    '1m': '1 Phút',
    '3m': '3 Phút',
    '5m': '5 Phút',
    '15m': '15 Phút',
    '30m': '30 Phút',
    '1h': '1 Giờ',
    '2h': '2 Giờ',
    '4h': '4 Giờ',
    '6h': '6 Giờ',
    '8h': '8 Giờ',
    '12h': '12 Giờ',
    '1d': '1 Ngày',
    '3d': '3 Ngày',
    '1w': '1 Tuần',
    '1M': '1 Tháng',
  };
  
  return displayNames[timeFrame] || timeFrame;
} 