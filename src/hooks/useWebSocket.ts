import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketTradeData {
  e: string; // Loại sự kiện (ví dụ: "trade")
  E: number; // Thời gian sự kiện
  s: string; // Symbol (ví dụ: "BTCUSDT")
  t: number; // ID giao dịch
  p: string; // Giá
  q: string; // Số lượng
  b: number; // ID lệnh mua
  a: number; // ID lệnh bán
  T: number; // Thời gian giao dịch
  m: boolean; // Người mua có phải là market maker không?
  M: boolean; // Bỏ qua
}

interface UseWebSocketReturn {
  latestTrade: { price: number; time: number; quantity: number } | null;
  isConnected: boolean;
  reconnect: () => void;
}

export function useWebSocket(symbol: string = 'BTCUSDT'): UseWebSocketReturn {
  const [latestTrade, setLatestTrade] = useState<{ price: number; time: number; quantity: number } | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = 10; // Tăng số lần thử
  const baseUrl = 'wss://stream.binance.com:9443/ws';

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Đã kết nối rồi
      return;
    }
    try {
      const streamName = `${symbol.toLowerCase()}@trade`;
      const wsUrl = `${baseUrl}/${streamName}`;
      wsRef.current = new WebSocket(wsUrl);
      console.log(`Đang kết nối tới WebSocket: ${wsUrl}`);

      wsRef.current.onopen = () => {
        console.log(`WebSocket đã kết nối tới ${streamName}`);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketTradeData = JSON.parse(event.data as string);
          if (data.s === symbol) {
            setLatestTrade({
              price: parseFloat(data.p),
              time: data.T, // Thời gian giao dịch
              quantity: parseFloat(data.q),
            });
          }
        } catch (error) {
          console.error('Lỗi khi phân tích tin nhắn WebSocket trade:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(`WebSocket đã ngắt kết nối khỏi ${streamName}:`, event.code, event.reason);
        setIsConnected(false);
        
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // Exponential backoff tối đa 30s
          console.log(`Đang thử kết nối lại sau ${delay}ms... (Lần thử ${reconnectAttemptsRef.current + 1})`);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('Đã đạt số lần thử kết nối lại WebSocket tối đa.');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error(`Lỗi WebSocket trên ${streamName}:`, error);
        setIsConnected(false);
        // Sự kiện lỗi thường được theo sau bởi sự kiện đóng, sự kiện đóng sẽ xử lý việc kết nối lại.
      };

    } catch (error) {
      console.error('Lỗi khi tạo kết nối WebSocket:', error);
      setIsConnected(false);
    }
  }, [symbol]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      console.log('Đang ngắt kết nối WebSocket thủ công...');
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
    reconnectAttemptsRef.current = maxReconnectAttempts; // Ngăn auto-reconnect sau khi ngắt kết nối thủ công
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0; // Reset attempts for manual reconnect
    disconnect(); 
    // A slight delay before reconnecting might be beneficial
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    latestTrade,
    isConnected,
    reconnect,
  };
} 