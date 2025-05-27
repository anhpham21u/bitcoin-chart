'use client';

import { useState, useEffect, useCallback } from 'react';
import { BitcoinChart } from '@/components/BitcoinChart';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Header } from '@/components/Header';
import { ControlPanel } from '@/components/ControlPanel';
import { PriceInfo } from '@/components/PriceInfo';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useBinanceData } from '@/hooks/useBinanceData';
import { CandlestickData, VolumeData, TimeFrame } from '@/types/chart';
// import { getBinanceInterval } from '@/lib/utils'; // Để chuyển đổi timeframe sang ms

// Hàm hỗ trợ để lấy thời lượng timeframe tính bằng milliseconds
const getTimeFrameDurationMs = (tf: TimeFrame): number => {
  const unit = tf.slice(-1);
  const value = parseInt(tf.slice(0, -1));
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  if (unit === 'w') return value * 7 * 24 * 60 * 60 * 1000;
  if (unit === 'M') return value * 30 * 24 * 60 * 60 * 1000; // Xấp xỉ
  return 60 * 1000; // Mặc định là 1 phút
};

export default function Home() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1m');
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0); // Đại diện cho sự thay đổi từ initialPriceForDay
  const [initialPriceForDay, setInitialPriceForDay] = useState<number>(0); // Lưu giá tham chiếu để tính % thay đổi
  const [isLoading, setIsLoading] = useState(true);

  const { data: historicalData, loading: dataLoading } = useBinanceData(timeFrame);
  const { latestTrade, isConnected } = useWebSocket('BTCUSDT');

  // Effect để lấy dữ liệu ban đầu của ngày (ví dụ: giá mở cửa của ngày hoặc kline gần đây)
  useEffect(() => {
    const fetchInitialDailyData = async () => {
      try {
        // Lấy kline 1 ngày gần đây để có giá mở cửa làm tham chiếu
        // Hoặc sử dụng /api/bitcoin-price để lấy giá hiện tại và giá 1 phút trước.
        // Để có sự thay đổi 24h thực sự, bạn có thể cần endpoint hoặc logic chuyên dụng.
        const response = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=1');
        const data = await response.json();
        if (data && data.length > 0) {
          const openPriceToday = parseFloat(data[0][1]); // Index 1 là giá Open của kline
          setInitialPriceForDay(openPriceToday);
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu ban đầu của ngày:', error);
      }
    };
    fetchInitialDailyData();
  }, []); // Chạy một lần khi mount

  useEffect(() => {
    if (historicalData) {
      setCandlestickData(historicalData.candlestick);
      setVolumeData(historicalData.volume);
      if (historicalData.candlestick.length > 0) {
        const lastCandle = historicalData.candlestick[historicalData.candlestick.length - 1];
        const newCurrentPrice = lastCandle.close;
        setCurrentPrice(newCurrentPrice);
        if (initialPriceForDay > 0) {
          setPriceChange(newCurrentPrice - initialPriceForDay);
        }
      }
      setIsLoading(false);
    }
  }, [historicalData, initialPriceForDay]);

  // Cập nhật dữ liệu biểu đồ và PriceInfo với giao dịch mới nhất từ WebSocket
  useEffect(() => {
    if (latestTrade) {
      const { price, time: tradeTimeMs, quantity } = latestTrade;
      const tradeTimeSec = Math.floor(tradeTimeMs / 1000);

      setCurrentPrice(price);
      if (initialPriceForDay > 0) {
        setPriceChange(price - initialPriceForDay);
      }

      // Sử dụng functional updates cho setCandlestickData và setVolumeData
      // và di chuyển kiểm tra length vào trong callback để sử dụng prev state.
      setCandlestickData(prevCandles => {
        if (prevCandles.length === 0) return prevCandles; // Không cập nhật nếu chưa có dữ liệu lịch sử

        const lastCandle = prevCandles[prevCandles.length - 1];
        // Không cần kiểm tra !lastCandle nữa vì đã kiểm tra prevCandles.length

        const timeFrameMs = getTimeFrameDurationMs(timeFrame);
        const lastCandleStartTimeSec = lastCandle.time;
        const nextCandleStartTimeSec = lastCandleStartTimeSec + timeFrameMs / 1000;

        let updatedCandles = [...prevCandles];

        if (tradeTimeSec >= lastCandleStartTimeSec && tradeTimeSec < nextCandleStartTimeSec) {
          const updatedLastCandle: CandlestickData = {
            ...lastCandle,
            high: Math.max(lastCandle.high, price),
            low: Math.min(lastCandle.low, price),
            close: price,
          };
          updatedCandles[updatedCandles.length - 1] = updatedLastCandle;
        } else if (tradeTimeSec >= nextCandleStartTimeSec) {
           // Để có giá mở cửa chính xác cho nến mới, truy cập nến cuối của state *hiện tại*.
           const currentLastCandleOpen = prevCandles[prevCandles.length - 1]?.close || price;
          const newCandle: CandlestickData = {
            time: nextCandleStartTimeSec, 
            open: currentLastCandleOpen, 
            high: price,
            low: price,
            close: price,
          };
          updatedCandles = [...prevCandles.slice(1), newCandle]; 
        }
        return updatedCandles;
      });

      setVolumeData(prevVolumes => {
        if (prevVolumes.length === 0) return prevVolumes; // Không cập nhật nếu chưa có dữ liệu lịch sử

        const lastVolume = prevVolumes[prevVolumes.length - 1];
        // Không cần kiểm tra !lastVolume nữa

        const timeFrameMs = getTimeFrameDurationMs(timeFrame);
        const lastVolumeStartTimeSec = lastVolume.time;
        const nextVolumeStartTimeSec = lastVolumeStartTimeSec + timeFrameMs / 1000;

        let updatedVolumes = [...prevVolumes];

        if (tradeTimeSec >= lastVolumeStartTimeSec && tradeTimeSec < nextVolumeStartTimeSec) {
          const updatedLastVolume: VolumeData = {
            ...lastVolume,
            value: lastVolume.value + quantity, 
          };
          updatedVolumes[updatedVolumes.length - 1] = updatedLastVolume;
        } else if (tradeTimeSec >= nextVolumeStartTimeSec) {
          const newVolume: VolumeData = {
            time: nextVolumeStartTimeSec,
            value: quantity,
          };
          updatedVolumes = [...prevVolumes.slice(1), newVolume];
        }
        return updatedVolumes;
      });
    }
  // Chỉ phụ thuộc vào latestTrade và timeFrame. 
  // Cập nhật CandlestickData và VolumeData được xử lý qua functional setState.
  }, [latestTrade, timeFrame, initialPriceForDay]); // Thêm initialPriceForDay vì nó được sử dụng trực tiếp.
  
  const handleTimeFrameChange = useCallback((newTimeFrame: TimeFrame) => {
    setIsLoading(true);
    setTimeFrame(newTimeFrame);
  }, []);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto space-y-6 px-4 py-6">
          <PriceInfo 
            currentPrice={currentPrice} 
            priceChange={priceChange}   
            isConnected={isConnected}
          />
          <ControlPanel
            timeFrame={timeFrame}
            onTimeFrameChange={handleTimeFrameChange}
          />
          <div className="w-full">
            <BitcoinChart
              key={timeFrame}
              candlestickData={candlestickData}
              volumeData={volumeData}
              timeFrame={timeFrame}
              isLoading={isLoading || dataLoading} 
              currentPrice={currentPrice} 
            />
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}
