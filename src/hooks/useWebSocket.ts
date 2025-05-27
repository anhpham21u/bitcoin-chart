import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketTradeData {
  e: string; // Event type (e.g., "trade")
  E: number; // Event time
  s: string; // Symbol (e.g., "BTCUSDT")
  t: number; // Trade ID
  p: string; // Price
  q: string; // Quantity
  b: number; // Buyer order ID
  a: number; // Seller order ID
  T: number; // Trade time
  m: boolean; // Is the buyer the market maker?
  M: boolean; // Ignore
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
  const maxReconnectAttempts = 10; // Increased attempts
  const baseUrl = 'wss://stream.binance.com:9443/ws';

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Already connected
      return;
    }
    try {
      const streamName = `${symbol.toLowerCase()}@trade`;
      const wsUrl = `${baseUrl}/${streamName}`;
      wsRef.current = new WebSocket(wsUrl);
      console.log(`Connecting to WebSocket: ${wsUrl}`);

      wsRef.current.onopen = () => {
        console.log(`WebSocket connected to ${streamName}`);
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
              time: data.T, // Trade time
              quantity: parseFloat(data.q),
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket trade message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(`WebSocket disconnected from ${streamName}:`, event.code, event.reason);
        setIsConnected(false);
        
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000); // Exponential backoff up to 30s
          console.log(`Attempting to reconnect in ${delay}ms... (Attempt ${reconnectAttemptsRef.current + 1})`);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('Max WebSocket reconnect attempts reached.');
        }
      };

      wsRef.current.onerror = (error) => {
        console.error(`WebSocket error on ${streamName}:`, error);
        setIsConnected(false);
        // Error event will often be followed by a close event, which handles reconnection.
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setIsConnected(false);
    }
  }, [symbol]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      console.log('Manually disconnecting WebSocket...');
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect after manual disconnect
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