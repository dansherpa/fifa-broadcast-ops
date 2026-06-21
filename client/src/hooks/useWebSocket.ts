import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState } from '../types';
import { useNotifications } from './useNotifications';

export function useWebSocket() {
  const [state, setState] = useState<AppState | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number>();
  const prevStateRef = useRef<AppState | null>(null);
  const { notify, requestPermission } = useNotifications();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'state') {
        const newState = msg.data as AppState;
        const prev = prevStateRef.current;

        if (prev) {
          // New announcement
          if (newState.announcements.length > prev.announcements.length) {
            const latest = newState.announcements[newState.announcements.length - 1];
            notify('New Alert', latest.message);
          }

          // New escort request
          const newPending = newState.escorts.filter(e => e.status === 'pending');
          const oldPending = prev.escorts.filter(e => e.status === 'pending');
          if (newPending.length > oldPending.length) {
            const latest = newPending[0];
            notify('Escort Needed', `${latest.mediaPartner}: ${latest.from} → ${latest.to}`);
          }
        }

        prevStateRef.current = newState;
        setState(newState);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = window.setTimeout(connect, 2000);
    };

    ws.onerror = () => ws.close();

    wsRef.current = ws;
  }, [notify]);

  useEffect(() => {
    requestPermission();
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect, requestPermission]);

  return { state, connected };
}
