import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  token?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string) => Promise<void>;
  register: (name: string, phone: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_KEY = "ridego_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (phone: string) => {
    const newUser: User = {
      id: "048489ad-c0d8-4978-9a0b-136d0b27d8f6",
      name: "Chaitanya Vellanki",
      phone,
      email: "chaitanya@email.com",
      rating: 4.9,
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNDg0ODlhZC1jMGQ4LTQ5NzgtOWEwYi0xMzZkMGIyN2Q4ZjYiLCJpYXQiOjE3NjE5MTI4NDQsImV4cCI6MTc2MjUxNzY0NH0.US8Apz5qHuRkybCwdDT8XHTPBycLo66JHUIPEV6is1Y"
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const register = async (name: string, phone: string, email: string) => {
    const newUser: User = { 
      id: "048489ad-c0d8-4978-9a0b-136d0b27d8f6",
      name, 
      phone, 
      email, 
      rating: 5.0,
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwNDg0ODlhZC1jMGQ4LTQ5NzgtOWEwYi0xMzZkMGIyN2Q4ZjYiLCJpYXQiOjE3NjE5MTI4NDQsImV4cCI6MTc2MjUxNzY0NH0.US8Apz5qHuRkybCwdDT8XHTPBycLo66JHUIPEV6is1Y"
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
