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

export const SocketProvider: React.FC<{ children: React.ReactNode, role: 'rider' | 'driver', userId: string, token?: string }> = ({ children, role, userId, token }) => {
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

  // Central MQTT message router
  const handleIncomingMessage = useCallback((message: any) => {
    try {
      // Dispatch to components that subscribed to this specific event type
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
        console.log(`[IoT] Connecting to AWS IoT Core for Rider ${userId}...`);
        await ioTClient.connect(token);
        
        if (!isMounted) return;
        setIsConnected(true);
        console.log(`[IoT] Connected to AWS IoT Core!`);

        // Subscribe to Rider's personal inbox
        ioTClient.subscribe(`ridego/users/${userId}/inbox`, handleIncomingMessage);
        
        // Subscribe to global broadcasts (e.g., nearby drivers)
        ioTClient.subscribe(`ridego/system/broadcast`, handleIncomingMessage);
        
        // Subscribe to Rider's active trip events (status updates, cancellation)
        ioTClient.subscribe(`ridego/rides/${userId}/events`, handleIncomingMessage);
        
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
        ioTClient.unsubscribe(`ridego/system/broadcast`, handleIncomingMessage);
        ioTClient.unsubscribe(`ridego/rides/${userId}/events`, handleIncomingMessage);
      }
    };
  }, [token, userId, handleIncomingMessage]);

  const sendMessage = useCallback((type: string, payload: any = {}) => {
    const message = { type, ...payload };
    
    // Route messages to specific MQTT topics based on type
    if (type === 'ride_request') {
      ioTClient.publish(`ridego/system/requests`, message);
    } else if (type === 'CHAT_MESSAGE') {
      // Payload for chat has 'to' (driverId)
      if (payload.to) {
        ioTClient.publish(`ridego/users/${payload.to}/inbox`, message);
      }
    } else if (type === 'ride_cancel') {
      // Publish to the specific ride's event topic (Driver will be listening to it)
      ioTClient.publish(`ridego/rides/${userId}/events`, message);
    } else {
      // Default fallback
      ioTClient.publish(`ridego/system/broadcast`, message);
    }
  }, [userId]);

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
    <SocketContext.Provider value={{ socket: ioTClient, isConnected, sendMessage, sendThrottledMessage, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
};
