import { useEffect, useRef, useCallback } from 'react';

type MessageHandler = (data: any) => void;

export function useWebSocket(endpoint: string, onMessage: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number>(0);

  const connect = useCallback(() => {
    const apiHost = import.meta.env.VITE_API_BASE_URL || `${window.location.protocol}//${window.location.host}`;
    const wsProtocol = apiHost.startsWith('https') ? 'wss:' : 'ws:';
    const host = apiHost.replace(/^https?:\/\//, '');
    const ws = new WebSocket(`${wsProtocol}//${host}${endpoint}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {}
    };

    ws.onclose = () => {
      reconnectTimer.current = window.setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [endpoint, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}
