import React, { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleYear?: string;
  seatingCapacity?: number;
  vehiclePhotos?: {
    front?: string;
    back?: string;
    side?: string;
  };
  rating: number;
  totalRides: number;
  hoursOnline: number;
  earningsThisMonth: number;
  avatar?: string;
  token?: string;
  isVerified?: boolean;
  verifiedDocuments?: Record<string, {
    number: string;
    verifiedAt: string;
    expiry?: string;
    imageUri: string;
  }>;
  isVehicleVerified?: boolean;
}

interface AuthContextValue {
  driver: Driver | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string) => Promise<void>;
  requestOTP: (phone: string) => Promise<void>;
  verifyOTP: (code: string, phone: string) => Promise<void>;
  register: (data: Omit<Driver, 'id' | 'rating' | 'totalRides' | 'hoursOnline' | 'earningsThisMonth' | 'token' | 'isVerified' | 'verifiedDocuments'>) => Promise<void>;
  logout: () => Promise<void>;
  updateDriver: (updates: Partial<Driver>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_DRIVER: Driver = {
  id: 'ffe12862-83d8-468b-8c56-1481cf18b818',
  name: 'Rahul Sharma',
  phone: '+91 98765 43210',
  email: 'rahul.sharma@example.com',
  vehicleType: 'Bike',
  vehicleNumber: 'TS09AB1234',
  rating: 4.8,
  totalRides: 342,
  hoursOnline: 186,
  earningsThisMonth: 12450,
  isVerified: false,
  verifiedDocuments: {},
  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZmUxMjg2Mi04M2Q4LTQ2OGItOGM1Ni0xNDgxY2YxOGI4MTgiLCJpYXQiOjE3NjEyMTg3MjUsImV4cCI6MTc2MTgyMzUyNX0.Ny5Gt3TFZvX-mLpBdQJ8nWR0rqIbQGpXPGrcEWWNlVs'
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmResult, setConfirmResult] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('driver_session').then((data) => {
      if (data) {
        try {
          setDriver(JSON.parse(data));
        } catch {
          setDriver(DEFAULT_DRIVER); // Auto-login for dev
        }
      } else {
        setDriver(DEFAULT_DRIVER); // Auto-login for dev
      }
      setIsLoading(false);
    });
  }, []);

  const login = async (phone: string) => {
    const d = { ...DEFAULT_DRIVER, phone };
    await AsyncStorage.setItem('driver_session', JSON.stringify(d));
    setDriver(d);
  };

  const requestOTP = async (phone: string) => {
    try {
      const confirmation = await auth().signInWithPhoneNumber(phone);
      setConfirmResult(confirmation);
    } catch (e) {
      console.error('Firebase requestOTP error:', e);
      throw e;
    }
  };

  const verifyOTP = async (code: string, phone: string) => {
    try {
      if (confirmResult) {
        await confirmResult.confirm(code);
      }
      const d = { ...DEFAULT_DRIVER, phone };
      await AsyncStorage.setItem('driver_session', JSON.stringify(d));
      setDriver(d);
    } catch (e) {
      console.error('Firebase verifyOTP error:', e);
      throw e;
    }
  };

  const register = async (data: Omit<Driver, 'id' | 'rating' | 'totalRides' | 'hoursOnline' | 'earningsThisMonth' | 'token' | 'isVerified' | 'verifiedDocuments'>) => {
    const d: Driver = {
      ...data,
      id: 'ffe12862-83d8-468b-8c56-1481cf18b818',
      rating: 0,
      totalRides: 0,
      hoursOnline: 0,
      earningsThisMonth: 0,
      isVerified: false,
      verifiedDocuments: {},
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmZmUxMjg2Mi04M2Q4LTQ2OGItOGM1Ni0xNDgxY2YxOGI4MTgiLCJpYXQiOjE3NjEyMTg3MjUsImV4cCI6MTc2MTgyMzUyNX0.Ny5Gt3TFZvX-mLpBdQJ8nWR0rqIbQGpXPGrcEWWNlVs'
    };
    await AsyncStorage.setItem('driver_session', JSON.stringify(d));
    setDriver(d);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('driver_session');
    setDriver(null);
  };

  const updateDriver = (updates: Partial<Driver>) => {
    if (!driver) return;
    const updated = { ...driver, ...updates };
    setDriver(updated);
    AsyncStorage.setItem('driver_session', JSON.stringify(updated));
  };

  const value = useMemo(() => ({
    driver,
    isAuthenticated: !!driver,
    isLoading,
    login,
    requestOTP,
    verifyOTP,
    register,
    logout,
    updateDriver,
  }), [driver, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
