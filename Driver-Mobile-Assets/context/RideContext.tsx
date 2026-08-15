import React, { createContext, useCallback, useContext, useState, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
}

export interface RideRequest {
  id: string;
  customer: Customer;
  pickup: Location;
  drop: Location;
  distance: string;
  fare: number;
  type: string;
  otp?: string;
}

export interface CompletedRide {
  id: string;
  date: string;
  pickup: string;
  drop: string;
  fare: number;
  status: 'completed' | 'cancelled';
  timestamp: number;
}

type ActiveRideStep = 'navigate' | 'arrived' | 'started' | 'completed';

interface RideContextValue {
  isOnDuty: boolean;
  setIsOnDuty: (v: boolean) => void;
  incomingRide: RideRequest | null;
  setIncomingRide: (r: RideRequest | null) => void;
  showRidePopup: boolean;
  setShowRidePopup: (v: boolean) => void;
  activeRide: RideRequest | null;
  activeRideStep: ActiveRideStep;
  acceptRide: (ride: RideRequest) => void;
  syncRide: (ride: RideRequest, step?: ActiveRideStep) => void;
  rejectRide: () => void;
  advanceRideStep: () => void;
  completeRide: () => void;
  todayEarnings: number;
  completedRides: CompletedRide[];
  loadRides: () => Promise<void>;
}

const RideContext = createContext<RideContextValue | null>(null);

const HYDERABAD_LOCATIONS = [
  { address: 'Dilsukhnagar Metro Station', lat: 17.3688, lng: 78.5247 },
  { address: 'LB Nagar, Hyderabad', lat: 17.3469, lng: 78.5542 },
  { address: 'Ameerpet X Roads', lat: 17.4374, lng: 78.4487 },
  { address: 'Hitech City, Madhapur', lat: 17.4477, lng: 78.3748 },
  { address: 'Kukatpally Housing Board', lat: 17.4849, lng: 78.3941 },
  { address: 'Secunderabad Railway Station', lat: 17.4399, lng: 78.4983 },
  { address: 'Jubilee Hills Check Post', lat: 17.4314, lng: 78.4091 },
  { address: 'Mehdipatnam Bus Stop', lat: 17.3939, lng: 78.4337 },
  { address: 'Koti, Hyderabad', lat: 17.3834, lng: 78.4759 },
  { address: 'SR Nagar Colony', lat: 17.4415, lng: 78.4304 },
  { address: 'Abids, Hyderabad', lat: 17.3942, lng: 78.4741 },
  { address: 'Banjara Hills Road No. 12', lat: 17.4239, lng: 78.4380 },
];

const CUSTOMER_NAMES = ['Rahul K.', 'Priya S.', 'Arun M.', 'Kavita R.', 'Suresh P.', 'Meena V.', 'Raj C.'];

export function generateMockRide(): RideRequest {
  const pickupIdx = Math.floor(Math.random() * HYDERABAD_LOCATIONS.length);
  let dropIdx = Math.floor(Math.random() * HYDERABAD_LOCATIONS.length);
  while (dropIdx === pickupIdx) dropIdx = Math.floor(Math.random() * HYDERABAD_LOCATIONS.length);

  const pickup = HYDERABAD_LOCATIONS[pickupIdx];
  const drop = HYDERABAD_LOCATIONS[dropIdx];
  const dist = (Math.random() * 7 + 1.5).toFixed(1);
  const fare = Math.floor(parseFloat(dist) * 18 + 20);

  return {
    id: `R${Date.now()}`,
    customer: {
      id: 'CUST-1234',
      name: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
    },
    pickup,
    drop,
    distance: `${dist} km`,
    fare,
    type: 'Bike',
  };
}

export function RideProvider({ children }: { children: ReactNode }) {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [incomingRide, setIncomingRide] = useState<RideRequest | null>(null);
  const [showRidePopup, setShowRidePopup] = useState(false);
  const [activeRide, setActiveRide] = useState<RideRequest | null>(null);
  const [activeRideStep, setActiveRideStep] = useState<ActiveRideStep>('navigate');
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [completedRides, setCompletedRides] = useState<CompletedRide[]>([]);

  const loadRides = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('completed_rides');
      if (stored) {
        const rides: CompletedRide[] = JSON.parse(stored);
        setCompletedRides(rides);
        const today = new Date().toDateString();
        const todayTotal = rides
          .filter(r => r.status === 'completed' && new Date(r.timestamp).toDateString() === today)
          .reduce((sum, r) => sum + r.fare, 0);
        setTodayEarnings(todayTotal);
      }
    } catch {}
  }, []);

  const saveRide = useCallback(async (ride: CompletedRide) => {
    try {
      const stored = await AsyncStorage.getItem('completed_rides');
      const rides: CompletedRide[] = stored ? JSON.parse(stored) : [];
      const updated = [ride, ...rides];
      await AsyncStorage.setItem('completed_rides', JSON.stringify(updated));
      setCompletedRides(updated);
    } catch {}
  }, []);

  const acceptRide = useCallback((ride: RideRequest) => {
    setActiveRide(ride);
    setIncomingRide(null);
    setShowRidePopup(false);
    setActiveRideStep('navigate');
  }, []);

  const syncRide = useCallback((ride: RideRequest, step: ActiveRideStep = 'navigate') => {
    setActiveRide(ride);
    setActiveRideStep(step);
    setIsOnDuty(true);
  }, []);

  const rejectRide = useCallback(() => {
    const ride = incomingRide;
    if (ride) {
      const cr: CompletedRide = {
        id: ride.id,
        date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        pickup: ride.pickup.address,
        drop: ride.drop.address,
        fare: ride.fare,
        status: 'cancelled',
        timestamp: Date.now(),
      };
      saveRide(cr);
    }
    setIncomingRide(null);
    setShowRidePopup(false);
  }, [incomingRide, saveRide]);

  const advanceRideStep = useCallback(() => {
    setActiveRideStep(prev => {
      if (prev === 'navigate') return 'arrived';
      if (prev === 'arrived') return 'started';
      return prev;
    });
  }, []);

  const completeRide = useCallback(() => {
    if (!activeRide) return;
    const cr: CompletedRide = {
      id: activeRide.id,
      date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      pickup: activeRide.pickup.address,
      drop: activeRide.drop.address,
      fare: activeRide.fare,
      status: 'completed',
      timestamp: Date.now(),
    };
    saveRide(cr);
    setTodayEarnings(prev => prev + activeRide.fare);
    setActiveRide(null);
    setActiveRideStep('navigate');
  }, [activeRide, saveRide]);

  const value = useMemo(() => ({
    isOnDuty, setIsOnDuty,
    incomingRide, setIncomingRide,
    showRidePopup, setShowRidePopup,
    activeRide, activeRideStep,
    acceptRide, syncRide, rejectRide, advanceRideStep, completeRide,
    todayEarnings, completedRides, loadRides,
  }), [
    isOnDuty,
    incomingRide,
    showRidePopup,
    activeRide,
    activeRideStep,
    acceptRide,
    syncRide,
    rejectRide,
    advanceRideStep,
    completeRide,
    todayEarnings,
    completedRides,
    loadRides,
  ]);

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
}

export function useRide() {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error('useRide must be used within RideProvider');
  return ctx;
}
