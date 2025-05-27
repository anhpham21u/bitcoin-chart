import { useState, useEffect, useCallback } from 'react';
import { ChartData, TimeFrame, BinanceKlineData } from '@/types/chart';
import { convertBinanceData, getBinanceInterval } from '@/lib/utils';

interface UseBinanceDataReturn {
  data: ChartData | null;
  loading: boolean;
  error: string | null;
  fetchData: () => Promise<void>;
}

export function useBinanceData(timeFrame: TimeFrame): UseBinanceDataReturn {
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const interval = getBinanceInterval(timeFrame);
      const limit = 500; // Lấy 500 nến cuối cùng
      
      // Endpoint API Binance cho klines (dữ liệu nến)
      const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Lỗi HTTP! status: ${response.status}`);
      }
      
      const rawData = await response.json();
      
      // Chuyển đổi dữ liệu thô từ Binance sang định dạng của chúng ta
      const klineData: BinanceKlineData[] = rawData.map((item: any[]) => ({
        openTime: item[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: item[5],
        closeTime: item[6],
        quoteAssetVolume: item[7],
        numberOfTrades: item[8],
        takerBuyBaseAssetVolume: item[9],
        takerBuyQuoteAssetVolume: item[10],
      }));

      const { candlestick, volume } = convertBinanceData(klineData);
      
      setData({
        candlestick,
        volume,
      });
      
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu Binance:', err);
      setError(err instanceof Error ? err.message : 'Không thể lấy dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [timeFrame]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, fetchData };
} 