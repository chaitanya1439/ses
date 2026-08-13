import re
import subprocess
import os

def run_lint():
    result = subprocess.run(["npm", "run", "lint"], cwd="/media/callidus/callidus2/ses/Driver-Mobile-Assets", capture_output=True, text=True)
    return result.stdout

def fix_file(filepath, lines_to_fix):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        lines = f.readlines()
        
    for item in lines_to_fix:
        line_num = item['line'] - 1
        var_name = item['var']
        
        if line_num >= len(lines):
            continue
            
        text = lines[line_num]
        
        # Unused imports (e.g. import { Link, View } from 'expo-router')
        # This is complex to do perfectly in regex, but we can try simple cases:
        if var_name in ['Link', 'useCallback', 'ScrollView', 'useMemo', 'Platform', 'MaterialCommunityIcons', 'Image', 'StyleSheet']:
            text = re.sub(rf'\b{var_name}\b,\s*', '', text)
            text = re.sub(rf',\s*\b{var_name}\b', '', text)
            text = re.sub(r'\{\s*\b' + var_name + r'\b\s*\}', '{}', text)
            text = re.sub(rf'\b{var_name}\b\s+from', ' from', text)
            if 'import {} from' in text or 'import  from' in text:
                text = ''
                
        # Unused catch (e) -> catch
        elif var_name in ['e', 'err']:
            text = re.sub(rf'catch\s*\(\s*{var_name}\s*\)', 'catch', text)
            
        # Unused assignments
        elif var_name in ['screenHeight', 'rideTimerRef', 'stars', 'scannedData', 'driver', 'RAZORPAY_KEY_SECRET', 'subscribed', 'setSubscribed']:
            # we can prepend an underscore to ignore it if it's not an import
            text = re.sub(rf'\b{var_name}\b', f'_{var_name}', text)
            
        # Unused functions
        elif var_name == 'generateMockRide':
            text = text.replace(var_name, f'_{var_name}')
            
        lines[line_num] = text
        
    with open(filepath, 'w') as f:
        f.writelines(lines)

lint_output = run_lint()

current_file = None
fixes = {}

for line in lint_output.split('\n'):
    if line.startswith('/media/callidus/'):
        current_file = line.strip()
        if current_file not in fixes:
            fixes[current_file] = []
    elif current_file and 'warning' in line and 'defined but never used' in line or 'assigned a value but never used' in line:
        # e.g., "  44:14  warning  'e' is defined but never used"
        match = re.search(r'(\d+):\d+\s+warning\s+\'([a-zA-Z0-9_]+)\'', line)
        if match:
            line_num = int(match.group(1))
            var_name = match.group(2)
            fixes[current_file].append({'line': line_num, 'var': var_name})

for file, items in fixes.items():
    fix_file(file, items)
    print(f"Fixed {len(items)} issues in {file}")

