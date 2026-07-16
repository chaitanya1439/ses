import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ioTClient } from '@/lib/aws-iot';

interface SocketContextType {
  socket: any | null; // Keeping for compatibility, but it will be ioTClient
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

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode, role: 'rider' | 'driver', userId: string, token?: string, vehicleType?: string }> = ({ children, role, userId, token, vehicleType }) => {
  const [isConnected, setIsConnected] = useState(false);
  const lastDriverStatusRef = useRef<string | null>(null);
  
  // Event Emitter pattern for components to easily subscribe to specific real-time events
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

  // Central MQTT message router
  const handleIncomingMessage = useCallback((message: any) => {
    try {
      if (message.type && listenersRef.current[message.type]) {
        listenersRef.current[message.type].forEach(cb => cb(message.payload || message));
      } else {
        console.log(`[IoT] Unhandled message type:`, message.type);
      }
    } catch (e) {
      console.error('[IoT] Failed to process message', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const connectIoT = async () => {
      if (!token || !userId) return;

      try {
        console.log(`[IoT] Connecting to AWS IoT Core for Driver ${userId}...`);
        await ioTClient.connect(token);
        
        if (!isMounted) return;
        setIsConnected(true);
        console.log(`[IoT] Connected to AWS IoT Core!`);

        // Re-send driver status on reconnect
        if (lastDriverStatusRef.current) {
           ioTClient.publish(`ridego/system/broadcast`, { type: 'driver_status', status: lastDriverStatusRef.current });
        }

        // Subscribe to Driver's personal inbox
        ioTClient.subscribe(`ridego/users/${userId}/inbox`, handleIncomingMessage);
        
        // Subscribe to global ride requests
        ioTClient.subscribe(`ridego/system/requests`, handleIncomingMessage);
        
        // Subscribe to global broadcasts
        ioTClient.subscribe(`ridego/system/broadcast`, handleIncomingMessage);
        
      } catch (error) {
        // Gracefully degrade - app continues to work, just without real-time features
        console.warn('[IoT] Failed to connect (app will work in offline mode):', error);
        if (isMounted) setIsConnected(false);
      }
    };

    // Wrap in setTimeout to prevent blocking app startup
    setTimeout(() => connectIoT(), 1000);

    return () => {
      isMounted = false;
      if (userId) {
        ioTClient.unsubscribe(`ridego/users/${userId}/inbox`, handleIncomingMessage);
        ioTClient.unsubscribe(`ridego/system/requests`, handleIncomingMessage);
        ioTClient.unsubscribe(`ridego/system/broadcast`, handleIncomingMessage);
      }
    };
  }, [token, userId, handleIncomingMessage]);

  const sendMessage = useCallback((type: string, payload: any = {}) => {
    if (type === 'driver_status' && payload.status) {
      lastDriverStatusRef.current = payload.status;
    }

    const message = { type, ...payload };
    
    if (type === 'ride_accepted') {
      ioTClient.publish(`ridego/users/${payload.riderId}/inbox`, message);
    } else if (type === 'CHAT_MESSAGE') {
      if (payload.to) {
        ioTClient.publish(`ridego/users/${payload.to}/inbox`, message);
      }
    } else if (type === 'trip_status_update' || type === 'ride_cancel') {
      // Driver publishes trip updates to the Rider's active event topic
      if (payload.riderId) {
        ioTClient.publish(`ridego/rides/${payload.riderId}/events`, message);
      }
    } else {
      ioTClient.publish(`ridego/system/broadcast`, message);
    }
  }, []);

  const lastSendRef = useRef<{ [type: string]: number }>({});
  const sendThrottledMessage = useCallback((type: string, payload: any = {}, throttleMs: number = 1000) => {
    const now = Date.now();
    if (!lastSendRef.current[type] || now - lastSendRef.current[type] >= throttleMs) {
      sendMessage(type, payload);
      lastSendRef.current[type] = now;
    }
  }, [sendMessage]);

  return (
    <SocketContext.Provider value={{ socket: ioTClient, isConnected, sendMessage, sendThrottledMessage, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
};
