import os
import glob

workspace = "/media/callidus/callidus2/ses"
extensions = ["*.tsx", "*.ts", "*.js", "*.jsx"]
files_to_check = []

for ext in extensions:
    files_to_check.extend(glob.glob(f"{workspace}/**/{ext}", recursive=True))

for file in files_to_check:
    if "node_modules" in file or ".expo" in file:
        continue
    with open(file, "r") as f:
        content = f.read()

    if 'useRef<MapView userInterfaceStyle="light">' in content:
        content = content.replace('useRef<MapView userInterfaceStyle="light">', 'useRef<MapView>')
        with open(file, "w") as f:
            f.write(content)
        print(f"Fixed {file}")

print("Done fixing MapView syntax errors")
