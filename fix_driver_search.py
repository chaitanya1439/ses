import re

with open("Ride-Booker-Flow/app/driver-search.tsx", "r") as f:
    content = f.read()

# Fix the ride_accepted listener
old_listener = """    const unsub1 = subscribe("ride_accepted", (payload: any) => {
      const d: DriverInfo = {
        name: payload.driverName ?? payload.driverId ?? "Driver",
        rating: payload.rating ?? 4.9,
        vehicle: payload.vehicle ?? "Honda Shine",
        plate: payload.plate ?? "TG10E7584",
        photoUrl: payload.photoUrl ?? "",
        lat: payload.driverLat ?? pickupLat + 0.003,
        lng: payload.driverLng ?? pickupLng + 0.002,
        languages: payload.languages ?? ["English", "Hindi"],
      };
      setDriver(d);
      setDriverLat(d.lat);
      setDriverLng(d.lng);
      setEtaMinutes(payload.eta ?? 5);
      setState("matched");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Auto-navigate to booking-confirmed once matched (instant transition)
      router.replace({
        pathname: "/booking-confirmed",
        params: { payload: JSON.stringify(payload) }
      });
    });"""

new_listener = """    const unsub1 = subscribe("ride_accepted", (payload: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const routePath = selectedVehicle === "parcel" ? "/parcel-confirmed" : "/booking-confirmed";
      router.replace({
        pathname: routePath as any,
        params: { payload: JSON.stringify(payload) }
      });
    });"""

content = content.replace(old_listener, new_listener)

# Remove the matched JSX block
import re
matched_pattern = r'\{\/\* ─── STATE 3: Driver matched ────────────────────────── \*\/.*?\}\s*\)\}'
content = re.sub(matched_pattern, '{/* ─── STATE 3: Driver matched (Handled by routing) ─── */}', content, flags=re.DOTALL)

with open("Ride-Booker-Flow/app/driver-search.tsx", "w") as f:
    f.write(content)

