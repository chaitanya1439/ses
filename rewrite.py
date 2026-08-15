with open("Ride-Booker-Flow/app/driver-search.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_listener = """    const unsub1 = subscribe("ride_accepted", (payload: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const routePath = selectedVehicle?.id === "parcel" ? "/parcel-confirmed" : "/booking-confirmed";
      router.replace({
        pathname: routePath as any,
        params: { payload: JSON.stringify(payload) }
      });
    });\n"""

lines[127:151] = [new_listener]
# Wait, after replacing lines 127:151, the indices for the rest of the file SHIFT!
# Original line 151 was index 150. We replaced 24 lines with 1 line.
# This means indices shift by -23.
# Let's just do it from the end to avoid shifting!

with open("Ride-Booker-Flow/app/driver-search.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Matched UI is lines 315 to 407 (indices 314 to 407)
# Replace with a single line
lines[314:407] = ["        {/* ─── STATE 3: Driver matched (Handled by routing) ─── */}\n"]

# Listener is lines 128 to 151 (indices 127 to 151)
lines[127:151] = [new_listener]

with open("Ride-Booker-Flow/app/driver-search.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
