'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { Loader2 } from 'lucide-react';
import { CandlestickData, VolumeData, TimeFrame } from '@/types/chart';
import { createChart, IChartApi, ISeriesApi, LineStyle, PriceLineOptions, IPriceLine } from 'lightweight-charts';

interface BitcoinChartProps {
  candlestickData: CandlestickData[];
  volumeData: VolumeData[];
  timeFrame: TimeFrame;
  isLoading: boolean;
  currentPrice: number;
}

export function BitcoinChart({
  candlestickData,
  volumeData,
  timeFrame,
  isLoading,
  currentPrice,
}: BitcoinChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);

  const [mounted, setMounted] = useState(false);
  const [chartHeight] = useState(600);
  const [chartError, setChartError] = useState<string | null>(null);
  
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect for chart creation and theme changes
  useEffect(() => {
    if (!mounted) {
      return;
    }

    const currentHasValidCandlestickData = candlestickData && candlestickData.length > 0 && candlestickData.some(d => d && typeof d.close === 'number' && !isNaN(d.close));

    // If conditions to render the chart are NOT met, or there's already a chart error displayed,
    // ensure any existing chart is cleaned up and do not proceed.
    if (isLoading || !currentHasValidCandlestickData || chartError) {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        volumeSeriesRef.current = null;
        priceLineRef.current = null;
      }
      // If we are not loading and have no data, but no explicit chartError is set yet,
      // we don't set a chartError here as the JSX handles "No chart data available."
      // If chartError is already set (e.g. from previous failed init), we keep it.
      return;
    }

    // At this point: mounted=true, isLoading=false, currentHasValidCandlestickData=true, chartError=null (or will be overwritten on success).
    if (!chartContainerRef.current) {
      console.error('BitcoinChart [Critical]: chartContainerRef.current is NULL when chart rendering is expected.');
      // This state indicates a more severe issue, potentially a race condition or flawed JSX structure.
      setChartError('Chart container element is missing. Please refresh or contact support.');
      return;
    }

    const containerWidth = chartContainerRef.current.clientWidth;
    // chartHeight is from component state, defaults to 600.

    if (containerWidth <= 0 || chartHeight <= 0) {
      console.error(`BitcoinChart [Critical]: Invalid chart dimensions. Width: ${containerWidth}, Height: ${chartHeight}. Chart cannot be created.`);
      // Ensure any old chart is cleaned up if dimensions become invalid after it was created.
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      setChartError(`Chart dimensions are invalid (Width: ${containerWidth}px, Height: ${chartHeight}px). This might be due to the container not being visible or having zero size. Please ensure the chart container is correctly sized in the layout.`);
      return;
    }

    // If a chart instance already exists (e.g. due to theme change, but not data change),
    // remove it before creating a new one.
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      priceLineRef.current = null;
    }
    
    try {
      // Simplified isDark logic as 'system' theme is removed
      const isDark = theme === 'dark';
      
      const colors = {
        background: isDark ? '#0a0a0a' : '#ffffff',
        textColor: isDark ? '#d1d5db' : '#374151',
        gridColor: isDark ? '#1f2937' : '#e5e7eb',
        upColor: '#10b981',
        downColor: '#ef4444',
        borderColor: isDark ? '#374151' : '#d1d5db',
        volumeUpColor: isDark ? 'rgba(38, 166, 154, 0.5)' : 'rgba(76, 175, 80, 0.5)',
        volumeDownColor: isDark ? 'rgba(239, 83, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)',
      };

      const chart = createChart(chartContainerRef.current, {
        width: containerWidth, // Use the checked width
        height: chartHeight,   // Use the state height
        layout: {
          background: { color: colors.background },
          textColor: colors.textColor,
        },
        grid: {
          vertLines: { color: colors.gridColor },
          horzLines: { color: colors.gridColor },
        },
        timeScale: {
          borderColor: colors.borderColor,
          timeVisible: true,
          secondsVisible: false,
          rightBarStaysOnScroll: true,
        },
        rightPriceScale: {
          borderColor: colors.borderColor,
        },
      });
      chartRef.current = chart;

      candlestickSeriesRef.current = chart.addCandlestickSeries({
        upColor: colors.upColor,
        downColor: colors.downColor,
        borderUpColor: colors.upColor,
        borderDownColor: colors.downColor,
        wickUpColor: colors.upColor,
        wickDownColor: colors.downColor,
      });

      volumeSeriesRef.current = chart.addHistogramSeries({
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.7, bottom: 0 },
        borderVisible: false,
      });
      
      setChartError(null); // Important: Reset any previous chart error on successful creation.

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.resize(chartContainerRef.current.clientWidth, chartHeight);
        }
      };
      window.addEventListener('resize', handleResize);

      // Return cleanup function for this effect
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          // console.log('BitcoinChart [Debug]: Cleaning up chart from useEffect return.');
          chartRef.current.remove();
          chartRef.current = null;
          // Series refs will be implicitly invalid as they belong to the removed chart.
        }
      };

    } catch (error: any) {
      console.error('Chart Initialization Error during create/recreate:', error);
      setChartError(`Failed to initialize chart: ${error.message}. Please try refreshing.`);
      if (chartRef.current) { // Should be null if creation failed and was cleaned up, but defensive.
        chartRef.current.remove();
        chartRef.current = null;
      }
    }
  }, [mounted, theme, chartHeight, isLoading, chartError]);

  // Effect for updating candlestick data
  useEffect(() => {
    if (candlestickSeriesRef.current && candlestickData) {
      candlestickSeriesRef.current.setData(candlestickData.map(d => ({ ...d, time: d.time as any })));
    }
  }, [candlestickData]);

  // Effect for updating volume data
  useEffect(() => {
    if (volumeSeriesRef.current && volumeData && candlestickData) {
        // Simplified isDark logic as 'system' theme is removed
        const isDark = theme === 'dark';
        const currentColors = {
            volumeUpColor: isDark ? 'rgba(38, 166, 154, 0.5)' : 'rgba(76, 175, 80, 0.5)',
            volumeDownColor: isDark ? 'rgba(239, 83, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)',
        };

      const coloredVolumeData = volumeData.map((item, index) => {
        const candle = candlestickData[index] || candlestickData[candlestickData.length -1];
        const color = candle && typeof candle.open === 'number' && typeof candle.close === 'number' && candle.close >= candle.open ? currentColors.volumeUpColor : currentColors.volumeDownColor;
        return { ...item, time: item.time as any, color };
      });
      volumeSeriesRef.current.setData(coloredVolumeData);
    }
  }, [volumeData, candlestickData, theme]);

  // Effect for updating current price line
  useEffect(() => {
    if (candlestickSeriesRef.current && chartRef.current) {
      if (priceLineRef.current) {
        candlestickSeriesRef.current.removePriceLine(priceLineRef.current);
        priceLineRef.current = null;
      }
      if (currentPrice > 0 && typeof currentPrice === 'number' && !isNaN(currentPrice)) {
        const priceLineOptions: PriceLineOptions = {
          price: currentPrice,
          color: '#f59e0b',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: 'Current',
          lineVisible: true,
        };
        priceLineRef.current = candlestickSeriesRef.current.createPriceLine(priceLineOptions);
      }
    }
  }, [currentPrice]);

  const hasValidCandlestickData = candlestickData && candlestickData.length > 0 && candlestickData.some(d => d && typeof d.close === 'number' && !isNaN(d.close));

  // Conditional rendering logic
  if (!mounted) {
    return (
      <div 
        className="flex items-center justify-center rounded-lg border border-border bg-card"
        style={{ height: `${chartHeight}px` }}
      >
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-muted-foreground">Initializing chart...</span>
        </div>
      </div>
    );
  }

  if (isLoading && !hasValidCandlestickData) {
    return (
      <div 
        className="flex items-center justify-center rounded-lg border border-border bg-card"
        style={{ height: `${chartHeight}px` }}
      >
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-muted-foreground">Loading chart data...</span>
        </div>
      </div>
    );
  }

  if (chartError) {
    return (
      <div 
        className="flex items-center justify-center rounded-lg border border-border bg-card"
        style={{ height: `${chartHeight}px` }}
      >
        <div className="flex flex-col items-center space-y-2 px-4 text-center">
          <span className="text-red-500">❌ Chart Error</span>
          <span className="text-muted-foreground text-sm">{chartError}</span>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!isLoading && !hasValidCandlestickData && !chartError) {
    return (
      <div 
        className="flex items-center justify-center rounded-lg border border-border bg-card"
        style={{ height: `${chartHeight}px` }}
      >
        <span className="text-muted-foreground">No chart data available.</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Bitcoin Price Chart ({timeFrame})
        </h3>
      </div>
      
      <div 
        ref={chartContainerRef} 
        className="w-full"
        style={{ height: `${chartHeight}px` }}
      />
      
      <div className="mt-4 text-xs text-muted-foreground">
        <p>• Drag to pan • Scroll to zoom • Volume chart shows at bottom 30%</p>
        <p>• Green/Red candles indicate price movement • Real-time data via WebSocket</p>
      </div>
    </div>
  );
} 