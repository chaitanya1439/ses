import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  useEffect,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, signOut } from "@react-native-firebase/auth";

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  token?: string;
  gender?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, token?: string, id?: string) => Promise<void>;
  register: (name: string, phone: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
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
          const parsedUser = JSON.parse(stored);
          
          if (parsedUser.token && !parsedUser.token.includes('dummy_token')) {
            // Try to refresh token in background
            try {
              const res = await fetch("https://real.shelteric.com/auth/refresh", {
                method: 'POST',
                headers: { Authorization: `Bearer ${parsedUser.token}` }
              });
              const data = await res.json();
              if (res.ok && data.token) {
                parsedUser.token = data.token;
                await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(parsedUser));
                console.log("Token successfully refreshed on app load");
              }
            } catch (e) {
              console.log("Failed to refresh token in background", e);
            }
          }
          
          setUser(parsedUser);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (phone: string, token?: string, id?: string) => {
    const newUser: User = {
      id: id || "temp-" + Date.now().toString(),
      name: "Chaitanya Vellanki", // Ideally this should come from backend or profile
      phone,
      email: "chaitanya@email.com",
      rating: 4.9,
      token: token || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const register = async (name: string, phone: string, email: string) => {
    const newUser: User = { 
      id: user?.id || "temp-" + Date.now().toString(),
      name, 
      phone, 
      email, 
      rating: 5.0,
      token: user?.token || ""
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (e) {
      console.log("Firebase sign out error", e);
    }
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
      updateUser,
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
