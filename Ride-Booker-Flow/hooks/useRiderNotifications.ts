import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useSocket } from '@/contexts/SocketContext';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: any = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    
    // ─── Configure notification behavior ─────────────────────────────────────────
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      }),
    });

    // ─── Android notification channel ────────────────────────────────────────────
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('ride-updates', {
        name: 'Ride Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A90D9',
        sound: 'default',
        enableVibrate: true,
      });
    }
  } catch (err) {
    console.warn('[Push] Failed to initialize expo-notifications:', err);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationData {
  type: string;
  driverId?: string;
  driverName?: string;
  status?: string;
  estimatedArrival?: number;
  [key: string]: unknown;
}

interface UseRiderNotificationsOptions {
  /** Called when a ride acceptance notification arrives while the app is open. */
  onRideAccepted?: (data: NotificationData) => void;
  /** Called when a trip status update notification arrives. */
  onTripStatusUpdate?: (data: NotificationData) => void;
  /** Called when any notification is tapped. */
  onNotificationTapped?: (data: NotificationData) => void;
}

interface UseRiderNotificationsReturn {
  expoPushToken: string | null;
  hasPermission: boolean;
  error: string | null;
  lastNotification: NotificationData | null;
}

// ─── Hook Implementation ─────────────────────────────────────────────────────

/**
 * useRiderNotifications
 *
 * Push notification setup for the ride-booker app.
 * Receives notifications about ride acceptance, driver arrival,
 * trip status changes, etc.
 *
 * Usage:
 * ```tsx
 * const { expoPushToken } = useRiderNotifications({
 *   onRideAccepted: (data) => {
 *     // Navigate to tracking screen
 *     router.push('/booking-confirmed');
 *   },
 *   onTripStatusUpdate: (data) => {
 *     if (data.status === 'arrived') {
 *       Alert.alert('Driver arrived!', 'Your driver is at the pickup point.');
 *     }
 *   },
 * });
 * ```
 */
export function useRiderNotifications({
  onRideAccepted,
  onTripStatusUpdate,
  onNotificationTapped,
}: UseRiderNotificationsOptions = {}): UseRiderNotificationsReturn {
  const { sendMessage, isConnected } = useSocket();

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<NotificationData | null>(null);

  const onAcceptedRef = useRef(onRideAccepted);
  const onStatusRef = useRef(onTripStatusUpdate);
  const onTappedRef = useRef(onNotificationTapped);
  onAcceptedRef.current = onRideAccepted;
  onStatusRef.current = onTripStatusUpdate;
  onTappedRef.current = onNotificationTapped;

  // ── Token registration ──────────────────────────────────────────────────────

  const registerToken = useCallback(async (): Promise<string | null> => {
    if (!Notifications) {
      console.warn('[Push] expo-notifications not available.');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setHasPermission(false);
        setError('Push notification permission denied.');
        return null;
      }

      setHasPermission(true);

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

      const token = tokenData.data;
      setExpoPushToken(token);
      setError(null);
      console.log('[Push] Rider Push Token:', token);
      return token;
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Failed to get push token';

      if (Platform.OS === 'android' && msg.includes('Default FirebaseApp is not initialized')) {
        msg = 'Android Firebase is not initialized. Rebuild the dev/production Android app after adding google-services.json; Expo Go or an old dev build cannot use this native Firebase config.';
      }

      setError(msg);
      // Only log as warning to prevent red screens for known missing config issues
      console.warn('[Push] Token registration skipped or failed:', msg);
      return null;
    }
  }, []);

  useEffect(() => {
    registerToken();
  }, [registerToken]);

  // Send token to server
  useEffect(() => {
    if (expoPushToken && isConnected) {
      sendMessage('register_push_token', { pushToken: expoPushToken });
      console.log('[Push] Sent rider push token to server');
    }
  }, [expoPushToken, isConnected, sendMessage]);

  // ── Notification listeners ──────────────────────────────────────────────────

  useEffect(() => {
    if (!Notifications) return;

    // Foreground notification handler
    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        const data = notification.request.content.data as NotificationData | undefined;
        if (!data) return;

        setLastNotification(data);
        console.log('[Push] Rider received notification:', data.type);

        // Route to the correct callback based on notification type
        switch (data.type) {
          case 'ride_accepted':
            onAcceptedRef.current?.(data);
            break;
          case 'trip_status_change':
            onStatusRef.current?.(data);
            break;
          default:
            break;
        }
      },
    );

    // Notification tap handler
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        const data = response.notification.request.content.data as NotificationData | undefined;
        if (data) {
          setLastNotification(data);
          console.log('[Push] Rider tapped notification:', data.type);
          onTappedRef.current?.(data);
        }
      },
    );

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  // Check if app was launched from a notification
  useEffect(() => {
    if (!Notifications) return;

    Notifications.getLastNotificationResponseAsync().then((response: any) => {
      if (response) {
        const data = response.notification.request.content.data as NotificationData | undefined;
        if (data) {
          setLastNotification(data);
          onTappedRef.current?.(data);
        }
      }
    });
  }, []);

  return {
    expoPushToken,
    hasPermission,
    error,
    lastNotification,
  };
}
