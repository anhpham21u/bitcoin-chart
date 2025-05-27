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
import { getBinanceInterval } from '@/lib/utils'; // For timeframe to ms conversion

// Helper to get timeframe duration in milliseconds
const getTimeFrameDurationMs = (tf: TimeFrame): number => {
  const unit = tf.slice(-1);
  const value = parseInt(tf.slice(0, -1));
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  if (unit === 'w') return value * 7 * 24 * 60 * 60 * 1000;
  if (unit === 'M') return value * 30 * 24 * 60 * 60 * 1000; // Approx
  return 60 * 1000; // Default to 1 minute
};

export default function Home() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('1m');
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0); // This will represent change from initialPriceForDay
  const [initialPriceForDay, setInitialPriceForDay] = useState<number>(0); // Store a reference price for % change calculation
  const [isLoading, setIsLoading] = useState(true);

  const { data: historicalData, loading: dataLoading } = useBinanceData(timeFrame);
  const { latestTrade, isConnected } = useWebSocket('BTCUSDT');

  // Effect for fetching initial data for the day (e.g., open price of the day or a recent kline)
  useEffect(() => {
    const fetchInitialDailyData = async () => {
      try {
        // Fetch a recent 1-day kline to get an opening price for reference
        // Or use the /api/bitcoin-price which gives current and 1-min ago price.
        // For a true 24h change, you might need a dedicated endpoint or logic.
        const response = await fetch('https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=1');
        const data = await response.json();
        if (data && data.length > 0) {
          const openPriceToday = parseFloat(data[0][1]); // Index 1 is Open price for the kline
          setInitialPriceForDay(openPriceToday);
          if (currentPrice > 0) { // if currentPrice is already set by historical data
            setPriceChange(currentPrice - openPriceToday);
          }
        }
      } catch (error) {
        console.error('Error fetching initial daily data:', error);
      }
    };
    fetchInitialDailyData();
  }, []); // Runs once on mount

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

  // Update chart data and PriceInfo with latest trade from WebSocket
  useEffect(() => {
    if (latestTrade) {
      const { price, time: tradeTimeMs, quantity } = latestTrade;
      const tradeTimeSec = Math.floor(tradeTimeMs / 1000);

      setCurrentPrice(price);
      if (initialPriceForDay > 0) {
        setPriceChange(price - initialPriceForDay);
      }

      // Use functional updates for setCandlestickData and setVolumeData
      // and move the length check inside the callback to use prev state.
      setCandlestickData(prevCandles => {
        if (prevCandles.length === 0) return prevCandles; // Do not update if no historical data yet

        const lastCandle = prevCandles[prevCandles.length - 1];
        // No need to check !lastCandle again as we checked prevCandles.length

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
           // To get the correct open price for the new candle, access the last candle of the *current* state.
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
        if (prevVolumes.length === 0) return prevVolumes; // Do not update if no historical data yet

        const lastVolume = prevVolumes[prevVolumes.length - 1];
        // No need to check !lastVolume again

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
  // Only depend on latestTrade and timeFrame. 
  // CandlestickData and VolumeData updates are handled via functional setState.
  }, [latestTrade, timeFrame, initialPriceForDay]); // Added initialPriceForDay because it's used directly.
  
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
