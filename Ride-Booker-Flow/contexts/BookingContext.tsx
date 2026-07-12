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

interface BookingContextValue {
  pickup: Location | null;
  drop: Location | null;
  selectedVehicle: string;
  bookingFor: string;
  fare: number;
  routeDetails: RouteDetails | null;
  setPickup: (loc: Location | null) => void;
  setDrop: (loc: Location | null) => void;
  setSelectedVehicle: (id: string) => void;
  setBookingFor: (name: string) => void;
  setFare: (fare: number) => void;
  setRouteDetails: (details: RouteDetails | null) => void;
  clearBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [drop, setDrop] = useState<Location | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState("bike");
  const [bookingFor, setBookingFor] = useState("Myself");
  const [fare, setFare] = useState(0);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);

  const clearBooking = () => {
    setPickup(null);
    setDrop(null);
    setSelectedVehicle("bike");
    setBookingFor("Myself");
    setFare(0);
    setRouteDetails(null);
  };

  const value = useMemo(
    () => ({
      pickup,
      drop,
      selectedVehicle,
      bookingFor,
      fare,
      routeDetails,
      setPickup,
      setDrop,
      setSelectedVehicle,
      setBookingFor,
      setFare,
      setRouteDetails,
      clearBooking,
    }),
    [pickup, drop, selectedVehicle, bookingFor, fare, routeDetails]
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
