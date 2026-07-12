import { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useSocket } from '@/context/SocketContext';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: any = null;

if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    
    // ─── Configure notification behavior ─────────────────────────────────────────
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,  // Show banner even when app is open
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      }),
    });

    // ─── Android-specific notification channel ────────────────────────────────────
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('ride-alerts', {
        name: 'Ride Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
      });
    }
  } catch (err) {
    console.warn('[Push] Failed to initialize expo-notifications:', err);
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationData {
  type: string;
  riderId?: string;
  riderName?: string;
  pickupAddress?: string;
  fare?: number;
  distance?: number;
  vehicleType?: string;
  pickupLat?: number;
  pickupLng?: number;
  [key: string]: unknown;
}

interface UsePushNotificationsOptions {
  /** Called when a notification is received while the app is in the foreground. */
  onNotificationReceived?: (data: NotificationData) => void;
  /** Called when the user taps on a notification (app was backgrounded or closed). */
  onNotificationTapped?: (data: NotificationData) => void;
}

interface UsePushNotificationsReturn {
  /** The Expo Push Token string (e.g., "ExponentPushToken[xxxx]"). */
  expoPushToken: string | null;
  /** Whether push notification permissions have been granted. */
  hasPermission: boolean;
  /** Any error from token retrieval or permission. */
  error: string | null;
  /** The most recent notification data received. */
  lastNotification: NotificationData | null;
}

// ─── Hook Implementation ─────────────────────────────────────────────────────

/**
 * usePushNotifications
 *
 * Sets up Expo Push Notifications for the driver app:
 * 1. Requests notification permissions
 * 2. Retrieves the Expo Push Token
 * 3. Sends the token to the realtime-server via WebSocket
 * 4. Listens for incoming notifications (foreground + tap)
 *
 * Usage:
 * ```tsx
 * const { expoPushToken, lastNotification } = usePushNotifications({
 *   onNotificationReceived: (data) => {
 *     if (data.type === 'new_ride_request') {
 *       setIncomingRide(parseRideFromNotification(data));
 *       setShowRidePopup(true);
 *     }
 *   },
 *   onNotificationTapped: (data) => {
 *     if (data.type === 'new_ride_request') {
 *       router.push('/active-ride');
 *     }
 *   },
 * });
 * ```
 */
export function usePushNotifications({
  onNotificationReceived,
  onNotificationTapped,
}: UsePushNotificationsOptions = {}): UsePushNotificationsReturn {
  const { sendMessage, isConnected } = useSocket();

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<NotificationData | null>(null);

  // Use refs for callbacks to avoid re-subscribing on every render
  const onReceivedRef = useRef(onNotificationReceived);
  const onTappedRef = useRef(onNotificationTapped);
  onReceivedRef.current = onNotificationReceived;
  onTappedRef.current = onNotificationTapped;

  // ── Token Registration ──────────────────────────────────────────────────────

  const registerToken = useCallback(async (): Promise<string | null> => {
    if (!Notifications) {
      console.warn('[Push] expo-notifications not available.');
      return null;
    }

    try {
      // 1. Check/request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setHasPermission(false);
        setError('Push notification permission denied.');
        console.warn('[Push] Notification permission not granted');
        return null;
      }

      setHasPermission(true);

      // 2. Get the Expo Push Token. On Android, google-services.json is wired
      // through app.config.js as android.googleServicesFile at native build time.
      const androidGoogleServicesFile = (
        Constants.expoConfig?.android as { googleServicesFile?: string } | undefined
      )?.googleServicesFile;

      if (Platform.OS === 'android' && !androidGoogleServicesFile) {
        console.warn('[Push] Android googleServicesFile is not configured. Token registration may fail.');
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenData.data;
      setExpoPushToken(token);
      setError(null);
      console.log('[Push] Expo Push Token:', token);

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

  // ── Register token on mount and send to server when connected ───────────────

  useEffect(() => {
    registerToken();
  }, [registerToken]);

  // Send the push token to the server whenever we have both token and connection
  useEffect(() => {
    if (expoPushToken && isConnected) {
      sendMessage('register_push_token', { pushToken: expoPushToken });
      console.log('[Push] Sent push token to server');
    }
  }, [expoPushToken, isConnected, sendMessage]);

  // ── Notification Listeners ──────────────────────────────────────────────────

  useEffect(() => {
    if (!Notifications) return;

    // Foreground notification listener
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification: any) => {
        const data = notification.request.content.data as NotificationData | undefined;
        if (data) {
          setLastNotification(data);
          console.log('[Push] Notification received in foreground:', data.type);
          onReceivedRef.current?.(data);
        }
      },
    );

    // Notification tap/interaction listener (background or killed state)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response: any) => {
        const data = response.notification.request.content.data as NotificationData | undefined;
        if (data) {
          setLastNotification(data);
          console.log('[Push] Notification tapped:', data.type);
          onTappedRef.current?.(data);
        }
      },
    );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  // ── Handle app launch via notification tap ──────────────────────────────────

  useEffect(() => {
    if (!Notifications) return;

    // Check if the app was launched by tapping a notification
    Notifications.getLastNotificationResponseAsync().then((response: any) => {
      if (response) {
        const data = response.notification.request.content.data as NotificationData | undefined;
        if (data) {
          setLastNotification(data);
          console.log('[Push] App launched from notification:', data.type);
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
