import os

app_dir = '/media/callidus/callidus2/ses/Ride-Booker-Flow/app'
for root, _, files in os.walk(app_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            
            new_content = content.replace('/(tabs)/home', '/home')
            new_content = new_content.replace('/(tabs)/profile', '/profile')
            new_content = new_content.replace('/(tabs)/parcel', '/parcel')
            new_content = new_content.replace('/(tabs)/travel', '/travel')
            
            if new_content != content:
                with open(path, 'w') as f:
                    f.write(new_content)
                print(f"Updated {path}")
