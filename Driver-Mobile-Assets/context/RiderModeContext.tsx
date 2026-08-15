import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
} from "react";

interface Location {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

interface RouteDetails {
  distanceMeters: number;
  durationSeconds: number;
}

interface RiderModeContextValue {
  pickup: Location | null;
  drop: Location | null;
  selectedVehicle: string;
  bookingFor: string;
  fare: number;
  activeTrip: any | null;
  routeDetails: RouteDetails | null;
  setPickup: (loc: Location | null) => void;
  setDrop: (loc: Location | null) => void;
  setSelectedVehicle: (id: string) => void;
  setBookingFor: (name: string) => void;
  setFare: (fare: number) => void;
  setRouteDetails: (details: RouteDetails | null) => void;
  setActiveTrip: (trip: any | null) => void;
  clearBooking: () => void;
}

const RiderModeContext = createContext<RiderModeContextValue | null>(null);

export function RiderModeProvider({ children }: { children: ReactNode }) {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [drop, setDrop] = useState<Location | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState("bike");
  const [bookingFor, setBookingFor] = useState("Myself");
  const [fare, setFare] = useState(0);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [activeTrip, setActiveTrip] = useState<any | null>(null);

  const clearBooking = () => {
    setPickup(null);
    setDrop(null);
    setSelectedVehicle("bike");
    setBookingFor("Myself");
    setFare(0);
    setRouteDetails(null);
    setActiveTrip(null);
  };

  const value = useMemo(
    () => ({
      pickup,
      drop,
      selectedVehicle,
      bookingFor,
      fare,
      routeDetails,
      activeTrip,
      setPickup,
      setDrop,
      setSelectedVehicle,
      setBookingFor,
      setFare,
      setRouteDetails,
      setActiveTrip,
      clearBooking,
    }),
    [pickup, drop, selectedVehicle, bookingFor, fare, routeDetails, activeTrip]
  );

  return (
    <RiderModeContext.Provider value={value}>{children}</RiderModeContext.Provider>
  );
}

export function useRiderMode() {
  const context = useContext(RiderModeContext);
  if (!context) {
    throw new Error("useRiderMode must be used within a RiderModeProvider");
  }
  return context;
}
