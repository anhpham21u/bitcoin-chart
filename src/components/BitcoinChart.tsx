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

  // Effect để tạo biểu đồ và thay đổi theme
  useEffect(() => {
    if (!mounted) {
      return;
    }

    const currentHasValidCandlestickData = candlestickData && candlestickData.length > 0 && candlestickData.some(d => d && typeof d.close === 'number' && !isNaN(d.close));

    // Nếu điều kiện để render biểu đồ KHÔNG được đáp ứng, hoặc đã có lỗi biểu đồ được hiển thị,
    // đảm bảo biểu đồ hiện tại được dọn dẹp và không tiếp tục.
    if (isLoading || !currentHasValidCandlestickData || chartError) {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        volumeSeriesRef.current = null;
        priceLineRef.current = null;
      }
      // Nếu chúng ta không đang loading và không có dữ liệu, nhưng chưa có chartError được set,
      // chúng ta không set chartError ở đây vì JSX xử lý "No chart data available."
      // Nếu chartError đã được set (ví dụ từ lần init thất bại trước), chúng ta giữ nó.
      return;
    }

    // Tại điểm này: mounted=true, isLoading=false, currentHasValidCandlestickData=true, chartError=null (hoặc sẽ được ghi đè khi thành công).
    if (!chartContainerRef.current) {
      console.error('BitcoinChart [Nghiêm trọng]: chartContainerRef.current là NULL khi render biểu đồ được mong đợi.');
      // Trạng thái này cho thấy vấn đề nghiêm trọng hơn, có thể là race condition hoặc cấu trúc JSX có lỗi.
      setChartError('Phần tử container biểu đồ bị thiếu. Vui lòng refresh hoặc liên hệ hỗ trợ.');
      return;
    }

    const containerWidth = chartContainerRef.current.clientWidth;
    // chartHeight từ component state, mặc định là 600.

    if (containerWidth <= 0 || chartHeight <= 0) {
      console.error(`BitcoinChart [Nghiêm trọng]: Kích thước biểu đồ không hợp lệ. Width: ${containerWidth}, Height: ${chartHeight}. Không thể tạo biểu đồ.`);
      // Đảm bảo biểu đồ cũ được dọn dẹp nếu kích thước trở nên không hợp lệ sau khi nó được tạo.
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      setChartError(`Kích thước biểu đồ không hợp lệ (Width: ${containerWidth}px, Height: ${chartHeight}px). Điều này có thể do container không hiển thị hoặc có kích thước bằng 0. Vui lòng đảm bảo container biểu đồ được định kích thước chính xác trong layout.`);
      return;
    }

    // Nếu instance biểu đồ đã tồn tại (ví dụ do thay đổi theme, nhưng không phải thay đổi dữ liệu),
    // xóa nó trước khi tạo cái mới.
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      priceLineRef.current = null;
    }
    
    try {
      // Logic isDark đơn giản hóa vì theme 'system' đã được loại bỏ
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
        width: containerWidth, // Sử dụng width đã kiểm tra
        height: chartHeight,   // Sử dụng height từ state
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
      
      setChartError(null); // Quan trọng: Reset lỗi biểu đồ trước đó khi tạo thành công.

      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.resize(chartContainerRef.current.clientWidth, chartHeight);
        }
      };
      window.addEventListener('resize', handleResize);

      // Trả về hàm cleanup cho effect này
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          // console.log('BitcoinChart [Debug]: Dọn dẹp biểu đồ từ useEffect return.');
          chartRef.current.remove();
          chartRef.current = null;
          // Series refs sẽ không hợp lệ ngầm định vì chúng thuộc về biểu đồ đã bị xóa.
        }
      };

    } catch (error: any) {
      console.error('Lỗi khởi tạo biểu đồ trong quá trình tạo/tái tạo:', error);
      setChartError(`Không thể khởi tạo biểu đồ: ${error.message}. Vui lòng thử refresh.`);
      if (chartRef.current) { // Nên là null nếu việc tạo thất bại và đã được dọn dẹp, nhưng để phòng thủ.
        chartRef.current.remove();
        chartRef.current = null;
      }
    }
  }, [mounted, theme, chartHeight, isLoading, chartError]);

  // Effect để cập nhật dữ liệu candlestick
  useEffect(() => {
    if (candlestickSeriesRef.current && candlestickData) {
      candlestickSeriesRef.current.setData(candlestickData.map(d => ({ ...d, time: d.time as any })));
    }
  }, [candlestickData]);

  // Effect để cập nhật dữ liệu volume
  useEffect(() => {
    if (volumeSeriesRef.current && volumeData && candlestickData) {
        // Logic isDark đơn giản hóa vì theme 'system' đã được loại bỏ
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

  // Effect để cập nhật đường giá hiện tại
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
          title: 'Hiện tại',
          lineVisible: true,
        };
        priceLineRef.current = candlestickSeriesRef.current.createPriceLine(priceLineOptions);
      }
    }
  }, [currentPrice]);

  const hasValidCandlestickData = candlestickData && candlestickData.length > 0 && candlestickData.some(d => d && typeof d.close === 'number' && !isNaN(d.close));

  // Logic render có điều kiện
  if (!mounted) {
    return (
      <div 
        className="flex items-center justify-center rounded-lg border border-border bg-card"
        style={{ height: `${chartHeight}px` }}
      >
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-muted-foreground">Đang khởi tạo biểu đồ...</span>
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
          <span className="text-muted-foreground">Đang tải dữ liệu biểu đồ...</span>
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
          <span className="text-red-500">❌ Lỗi biểu đồ</span>
          <span className="text-muted-foreground text-sm">{chartError}</span>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Refresh trang
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
        <span className="text-muted-foreground">Không có dữ liệu biểu đồ.</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Biểu đồ giá Bitcoin ({timeFrame})
        </h3>
      </div>
      
      <div 
        ref={chartContainerRef} 
        className="w-full"
        style={{ height: `${chartHeight}px` }}
      />
      
      <div className="mt-4 text-xs text-muted-foreground">
        <p>• Kéo để di chuyển • Cuộn để zoom • Biểu đồ volume hiển thị ở 30% dưới cùng</p>
        <p>• Nến xanh/đỏ cho biết chuyển động giá • Dữ liệu real-time qua WebSocket</p>
      </div>
    </div>
  );
} 