import { useState, useEffect, useRef } from 'react';

export interface Alert {
  id: number;
  module: 'graph' | 'scam' | 'currency' | 'chatbot' | 'map';
  type: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
}

export const useAlertWebSocket = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<number | null>(null);

  const connect = () => {
    try {
      ws.current = new WebSocket('ws://localhost:8000/api/ws/alerts');

      ws.current.onopen = () => {
        setConnected(true);
        console.log('VYUH WebSocket connected.');
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'backlog') {
            setAlerts(message.data);
          } else if (message.type === 'live') {
            setAlerts((prev) => {
              // Prepend live alert and slice to max 50
              const updated = [message.data, ...prev];
              return updated.slice(0, 50);
            });
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.current.onclose = () => {
        setConnected(false);
        console.log('VYUH WebSocket disconnected. Reconnecting in 3s...');
        triggerReconnect();
      };

      ws.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        ws.current?.close();
      };
    } catch (e) {
      console.error('WebSocket connection failed:', e);
      triggerReconnect();
    }
  };

  const triggerReconnect = () => {
    if (reconnectTimeout.current) window.clearTimeout(reconnectTimeout.current);
    reconnectTimeout.current = window.setTimeout(() => {
      connect();
    }, 3000);
  };

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        // Prevent reconnect loop on unmount
        ws.current.onclose = null;
        ws.current.close();
      }
      if (reconnectTimeout.current) {
        window.clearTimeout(reconnectTimeout.current);
      }
    };
  }, []);

  return { alerts, connected };
};
