import re

with open("Ride-Booker-Flow/app/driver-search.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the ride_accepted listener
pattern1 = r'const unsub1 = subscribe\("ride_accepted", \(payload: any\) => \{.*?\n\s*\}\);'
replacement1 = """const unsub1 = subscribe("ride_accepted", (payload: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const routePath = selectedVehicle?.id === "parcel" ? "/parcel-confirmed" : "/booking-confirmed";
      router.replace({
        pathname: routePath as any,
        params: { payload: JSON.stringify(payload) }
      });
    });"""

content = re.sub(pattern1, replacement1, content, flags=re.DOTALL)

# Replace the matched UI block
pattern2 = r'\{\/\* ─── STATE 3: Driver matched ────────────────────────── \*\/\}\n\s*\{state === "matched" && driver && \(\n.*?\)\}'

# Let's verify we find pattern2 first
matches = re.findall(pattern2, content, re.DOTALL)
print(f"Found {len(matches)} matches for matched UI block")

content = re.sub(pattern2, '{/* ─── STATE 3: Driver matched (Handled by routing) ─── */}', content, flags=re.DOTALL)

with open("Ride-Booker-Flow/app/driver-search.tsx", "w", encoding="utf-8") as f:
    f.write(content)
