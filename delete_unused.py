import os
import re

files_to_clean = {
    'app/(tabs)/home.tsx': ['_generateMockRide', '_screenHeight', '_rideTimerRef'],
    'app/active-ride.tsx': ['_screenHeight', '_stars'],
    'app/driver-scanner.tsx': ['_scannedData'],
    'app/registration-fee.tsx': ['_driver'],
    'app/subscription-plans.tsx': ['_RAZORPAY_KEY_SECRET', '_driver'],
    'app/subscription.tsx': ['_subscribed', '_setSubscribed']
}

for file, vars_to_remove in files_to_clean.items():
    filepath = os.path.join('/media/callidus/callidus2/ses/Driver-Mobile-Assets', file)
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        lines = f.readlines()
        
    new_lines = []
    for line in lines:
        if any(var in line for var in vars_to_remove):
            continue
        new_lines.append(line)
        
    with open(filepath, 'w') as f:
        f.writelines(new_lines)

print("Done")
