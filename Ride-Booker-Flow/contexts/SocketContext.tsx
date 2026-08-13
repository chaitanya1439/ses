import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

interface SocketContextType {
  socket: any | null; // Keeping for compatibility, but it will be ioTClient
  isConnected: boolean;
  sendMessage: (type: string, payload?: any) => void;
  sendThrottledMessage: (type: string, payload?: any, throttleMs?: number) => void;
  subscribe: (type: string, callback: (payload: any) => void) => () => void;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  sendMessage: () => {},
  sendThrottledMessage: () => {},
  subscribe: () => () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode, role: 'rider' | 'driver', userId: string, token?: string, onForceLogout?: () => void }> = ({ children, role, userId, token, onForceLogout }) => {
  const [isConnected, setIsConnected] = useState(false);
  
  // Event Emitter pattern for components to easily subscribe to specific real-time events
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

  const wsRef = useRef<WebSocket | null>(null);

  // Central message router
  const handleIncomingMessage = useCallback((message: any) => {
    try {
      if (message.type === 'force_logout') {
        if (onForceLogout) onForceLogout();
      }
      
      if (message.type && listenersRef.current[message.type]) {
        listenersRef.current[message.type].forEach(cb => cb(message.payload || message));
      } else {
        console.log(`[WS] Unhandled message type:`, message.type);
      }
    } catch (e) {
      console.error('[WS] Failed to process message', e);
    }
  }, []);

  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isComponentMounted = useRef(true);

  const connect = useCallback(() => {
    if (!token || !userId) return;

    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const wsUrl = `wss://real.shelteric.com?token=${token}`;
    console.log(`[WS] Connecting to Realtime-Server at ${wsUrl}...`);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = async () => {
      console.log(`[WS] Connected!`);
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      let deviceId = 'unknown';
      try {
        if (Platform.OS === 'android') {
          deviceId = Application.getAndroidId();
        } else {
          deviceId = await Application.getIosIdForVendorAsync() || 'unknown';
        }
      } catch (e) {
        console.warn('Could not get device ID', e);
      }
      
      // Authenticate with role
      ws.send(JSON.stringify({ type: 'auth', role: role || 'rider', id: userId, deviceId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleIncomingMessage(data);
      } catch (e) {
        console.error('[WS] Failed to parse incoming data:', event.data);
      }
    };

    ws.onclose = () => {
      console.log(`[WS] Disconnected`);
      setIsConnected(false);
      wsRef.current = null;
      
      if (isComponentMounted.current && token && userId) {
        console.log(`[WS] Attempting to reconnect in 3s...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    ws.onerror = (e) => {
      console.error(`[WS] Error:`, e);
    };
  }, [token, userId, role, handleIncomingMessage]);

  useEffect(() => {
    isComponentMounted.current = true;
    connect();

    return () => {
      isComponentMounted.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          console.log('[WS] App became active, reconnecting...');
          connect();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [connect]);

  const sendMessage = useCallback((type: string, payload: any = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...payload }));
    } else {
      console.warn(`[WS] Cannot send message '${type}', socket is not open`);
    }
  }, []);

  // Client-Side Event Throttling
  const lastSendRef = useRef<{ [type: string]: number }>({});
  const sendThrottledMessage = useCallback((type: string, payload: any = {}, throttleMs: number = 1000) => {
    const now = Date.now();
    if (!lastSendRef.current[type] || now - lastSendRef.current[type] >= throttleMs) {
      sendMessage(type, payload);
      lastSendRef.current[type] = now;
    }
  }, [sendMessage]);

  return (
    <SocketContext.Provider value={{ socket: wsRef.current, isConnected, sendMessage, sendThrottledMessage, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
};
