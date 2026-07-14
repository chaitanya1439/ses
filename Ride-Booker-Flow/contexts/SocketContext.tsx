import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { PUBLIC_WEBSOCKET_URL } from '@/constants/config';

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (type: string, payload?: any) => void;
  sendThrottledMessage: (type: string, payload?: any, throttleMs?: number) => void;
  subscribe: (type: string, callback: (payload: any) => void) => () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  sendMessage: () => {},
  sendThrottledMessage: () => {},
  subscribe: () => () => {},
});

const EXPECTED_BACKGROUND_EVENTS = new Set(['auth_success', 'nearby_drivers', 'sync_state']);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode, role: 'rider' | 'driver', userId: string, token?: string }> = ({ children, role, userId, token }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const pendingMessagesRef = useRef<string[]>([]);
  
  // 3. Event Emitter pattern for components to easily subscribe to specific real-time events
  const listenersRef = useRef<{ [type: string]: Set<(payload: any) => void> }>({});

  const subscribe = useCallback((type: string, callback: (payload: any) => void) => {
    if (!listenersRef.current[type]) {
      listenersRef.current[type] = new Set();
    }
    listenersRef.current[type].add(callback);
    
    // Return unsubscribe function
    return () => {
      listenersRef.current[type]?.delete(callback);
    };
  }, []);

  // Track whether we should reconnect. Refs for the connect/cleanup lifecycle.
  const shouldReconnectRef = useRef(true);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    shouldReconnectRef.current = true;

    const connect = () => {
      // Don't create a new connection if one is already open/connecting
      if (
        socketRef.current &&
        (socketRef.current.readyState === WebSocket.OPEN ||
         socketRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      // Pass token in URL for HTTP Upgrade authentication
      const urlWithAuth = token ? `${PUBLIC_WEBSOCKET_URL}?token=${encodeURIComponent(token)}` : PUBLIC_WEBSOCKET_URL;
      
      console.log(`[Socket] ═══ RIDER AUTH DEBUG ═══`);
      console.log(`[Socket] PUBLIC_WEBSOCKET_URL: ${PUBLIC_WEBSOCKET_URL}`);
      console.log(`[Socket] Token present: ${!!token}`);
      console.log(`[Socket] Token value: ${token ? token.substring(0, 40) + '...' : 'NONE'}`);
      console.log(`[Socket] Role: ${role}, UserId: ${userId}`);
      console.log(`[Socket] Full connect URL: ${urlWithAuth.substring(0, 80)}...`);
      
      const ws = new WebSocket(urlWithAuth);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log(`[Socket] Connected to ${PUBLIC_WEBSOCKET_URL}`);
        setIsConnected(true);
        retryCountRef.current = 0; // Reset backoff on success
        ws.send(JSON.stringify({ type: 'auth', role, id: userId }));

        // Flush pending messages
        while (pendingMessagesRef.current.length > 0 && ws.readyState === WebSocket.OPEN) {
          const queuedMessage = pendingMessagesRef.current.shift();
          if (queuedMessage) ws.send(queuedMessage);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Dispatch to components that subscribed to this specific event type
          if (data.type && listenersRef.current[data.type]) {
            listenersRef.current[data.type].forEach(cb => cb(data.payload || data));
          } else if (!EXPECTED_BACKGROUND_EVENTS.has(data.type)) {
            console.log(`[Socket] Unhandled message:`, data);
          }
        } catch (e) {
          console.error('[Socket] Failed to parse message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        if (!shouldReconnectRef.current) return;
        // Exponential Backoff with Jitter (prevents 'Thundering Herd' DDoS on server restart)
        const baseDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        const jitter = Math.random() * 1000;
        const totalDelay = baseDelay + jitter;
        
        console.log(`[Socket] Disconnected. Reconnecting in ${Math.round(totalDelay)}ms...`);
        retryCountRef.current += 1;
        
        reconnectTimeoutRef.current = setTimeout(connect, totalDelay);
      };

      ws.onerror = (error) => {
        console.warn('[Socket] Connection issue — will retry', {
          readyState: ws.readyState,
        });
        ws.close();
      };
    };

    connectFnRef.current = connect;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
      socketRef.current = null;
    };
  }, [role, token, userId]);

  // ── AppState-aware reconnection ────────────────────────────────────────────
  // When the app returns from background, the OS may have silently dropped
  // the WebSocket. Force an immediate reconnect attempt.
  useEffect(() => {
    let lastState: AppStateStatus = AppState.currentState;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (lastState.match(/inactive|background/) && nextState === 'active') {
        console.log('[Socket] App returned to foreground — checking connection…');
        const ws = socketRef.current;
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          retryCountRef.current = 0; // Reset backoff for immediate reconnect
          connectFnRef.current?.();
        }
      }
      lastState = nextState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const sendMessage = useCallback((type: string, payload: any = {}) => {
    const message = JSON.stringify({ type, ...payload });
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
    } else {
      pendingMessagesRef.current.push(message);
      if (pendingMessagesRef.current.length > 50) {
        pendingMessagesRef.current.shift();
      }
      console.warn('[Socket] Queued message until socket reconnects');
    }
  }, []);

  // 4. Client-Side Event Throttling
  const lastSendRef = useRef<{ [type: string]: number }>({});
  const sendThrottledMessage = useCallback((type: string, payload: any = {}, throttleMs: number = 1000) => {
    const now = Date.now();
    if (!lastSendRef.current[type] || now - lastSendRef.current[type] >= throttleMs) {
      sendMessage(type, payload);
      lastSendRef.current[type] = now;
    }
  }, [sendMessage]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, sendMessage, sendThrottledMessage, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
};
