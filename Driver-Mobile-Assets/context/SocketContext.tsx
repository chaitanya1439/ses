import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SOCKET_URL } from '@/constants/config';

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

const EXPECTED_BACKGROUND_EVENTS = new Set(['auth_success', 'demand_heatmap', 'sync_state', 'ride_request_cancelled']);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode, role: 'rider' | 'driver', userId: string, token?: string, vehicleType?: string }> = ({ children, role, userId, token, vehicleType }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const pendingMessagesRef = useRef<string[]>([]);
  /** Track the last known driver status so we can re-send it on reconnect. */
  const lastDriverStatusRef = useRef<string | null>(null);
  
  // 3. Event Emitter pattern for components to easily subscribe to specific real-time events
  const listenersRef = useRef<{ [type: string]: Set<(payload: any) => void> }>({});

  const subscribe = useCallback((type: string, callback: (payload: any) => void) => {
    if (!listenersRef.current[type]) {
      listenersRef.current[type] = new Set();
    }
    listenersRef.current[type].add(callback);
    
    return () => {
      listenersRef.current[type]?.delete(callback);
    };
  }, []);

  // Track whether we should reconnect. Refs for the connect/cleanup lifecycle.
  const shouldReconnectRef = useRef(true);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectFnRef = useRef<(() => void) | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      const urlWithAuth = token ? `${SOCKET_URL}?token=${encodeURIComponent(token)}` : SOCKET_URL;
      
      console.log(`[Socket] ═══ DRIVER AUTH DEBUG ═══`);
      console.log(`[Socket] SOCKET_URL: ${SOCKET_URL}`);
      console.log(`[Socket] Token present: ${!!token}`);
      console.log(`[Socket] Token value: ${token ? token.substring(0, 40) + '...' : 'NONE'}`);
      console.log(`[Socket] Role: ${role}, UserId: ${userId}`);
      console.log(`[Socket] Full connect URL: ${urlWithAuth.substring(0, 80)}...`);
      
      const ws = new WebSocket(urlWithAuth);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log(`[Socket] ✓ Connected to ${SOCKET_URL}`);
        setIsConnected(true);
        retryCountRef.current = 0; // Reset backoff on success
        
        const authMsg = { type: 'auth', role, id: userId, vehicleType };
        console.log(`[Socket] Sending auth message:`, JSON.stringify(authMsg));
        ws.send(JSON.stringify(authMsg));

        // Re-send driver status on reconnect so the server knows we're available
        if (role === 'driver' && lastDriverStatusRef.current) {
          ws.send(JSON.stringify({ type: 'driver_status', status: lastDriverStatusRef.current }));
          console.log(`[Socket] Re-sent driver_status: ${lastDriverStatusRef.current} on reconnect`);
        }

        // Flush pending messages
        while (pendingMessagesRef.current.length > 0 && ws.readyState === WebSocket.OPEN) {
          const queuedMessage = pendingMessagesRef.current.shift();
          if (queuedMessage) ws.send(queuedMessage);
        }

        // Start application-level ping to prevent idle connection drops
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Always log auth_success for debugging
          if (data.type === 'auth_success') {
            console.log(`[Socket] ✓ AUTH_SUCCESS from server — id: ${data.id}, role: ${data.role}`);
          }
          
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
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
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
        console.error('[Socket] ✗ WebSocket ERROR:', {
          url: SOCKET_URL,
          readyState: ws.readyState,
          type: error.type,
          message: (error as any).message || 'Unknown error',
        });
        console.error('[Socket] This may indicate: wrong URL, server down, or token rejected (401)');
        ws.close();
      };
    };

    connectFnRef.current = connect;
    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (socketRef.current) socketRef.current.close();
      socketRef.current = null;
    };
  }, [role, userId, token, vehicleType]);

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
    // Track driver_status messages so we can replay on reconnect
    if (type === 'driver_status' && payload.status) {
      lastDriverStatusRef.current = payload.status;
    }

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
  // Prevents mobile device from flooding server if GPS triggers thousands of times a minute
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
