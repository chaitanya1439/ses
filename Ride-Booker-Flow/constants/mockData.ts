export const recentLocations = [
  {
    id: "1",
    name: "Tirumala Enclave",
    address: "1-6-44/1/6, Tirumala Enclave, Alwal, Hyderabad",
    saved: false,
  },
  {
    id: "2",
    name: "Prasanth Residency",
    address: "197, Rd Number 7, Prasanth Residency, Arunodaya Colony",
    saved: false,
  },
  {
    id: "3",
    name: "Manikonda",
    address: "70, Manikonda Rd, Shirdi Sai Nagar, Manikonda, Hyderabad",
    saved: true,
  },
];

export const vehicleOptions = [
  {
    id: "bike",
    name: "Bike",
    tagline: "Quick Bike rides",
    capacity: 1,
    eta: "3 mins away",
    dropTime: "2:41 pm",
    fare: 48,
    iconName: "motorbike" as const,
    iconSet: "MaterialCommunityIcons" as const,
  },
  {
    id: "scooty",
    name: "Scooty",
    tagline: "Spacious and comfortable",
    capacity: 1,
    eta: "3 mins away",
    dropTime: "2:41 pm",
    fare: 56,
    iconName: "scooter" as const,
    iconSet: "MaterialCommunityIcons" as const,
  },
  {
    id: "she-bike",
    name: "She Bike",
    tagline: "Safe rides for women",
    capacity: 1,
    eta: "4 mins away",
    dropTime: "2:43 pm",
    fare: 55,
    iconName: "motorbike" as const,
    iconSet: "MaterialCommunityIcons" as const,
    useCustomImage: true,
  },
  /*
  {
    id: "auto",
    name: "Auto",
    tagline: "Affordable 3-wheeler",
    capacity: 3,
    eta: "3 mins away",
    dropTime: "2:42 pm",
    fare: 77,
    iconName: "rickshaw" as const,
    iconSet: "MaterialCommunityIcons" as const,
  },
  */
  {
    id: "parcel",
    name: "Parcel",
    tagline: "Send anything, anywhere",
    capacity: 1,
    eta: "5 mins away",
    dropTime: "2:45 pm",
    fare: 40,
    iconName: "package-variant-closed" as const,
    iconSet: "MaterialCommunityIcons" as const,
    useCustomImage: true,
  },
];

export const savedRiders = [
  { id: "1", name: "Myself", phone: "+91 9XXXXXXXXX" },
];

export const mockDriver = {
  name: "Ravi Kumar",
  rating: 4.8,
  photo: null,
  vehicle: "Honda CB Shine",
  plateNumber: "TS 09 EX 4521",
  otp: "2847",
  eta: 3,
};

export const mockRides = [
  {
    id: "r1",
    date: "25 Feb 2026",
    time: "10:30 AM",
    pickup: "Tirumala Enclave, Alwal",
    drop: "Prasanth Residency, Arunodaya Colony",
    vehicle: "Bike",
    fare: 48,
    status: "completed" as const,
  },
  {
    id: "r2",
    date: "23 Feb 2026",
    time: "3:15 PM",
    pickup: "Manikonda, Hyderabad",
    drop: "HITEC City, Hyderabad",
    vehicle: "Auto",
    fare: 77,
    status: "completed" as const,
  },
  {
    id: "r3",
    date: "20 Feb 2026",
    time: "9:00 AM",
    pickup: "Jubilee Hills, Hyderabad",
    drop: "Banjara Hills, Hyderabad",
    vehicle: "Cab AC",
    fare: 149,
    status: "cancelled" as const,
  },
  {
    id: "r4",
    date: "18 Feb 2026",
    time: "6:45 PM",
    pickup: "Kondapur, Hyderabad",
    drop: "Gachibowli, Hyderabad",
    vehicle: "Scooty",
    fare: 56,
    status: "completed" as const,
  },
];
