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

    if "<MapView" in content and 'userInterfaceStyle="light"' not in content:
        # replace "<MapView" with "<MapView userInterfaceStyle="light""
        content = content.replace("<MapView", "<MapView userInterfaceStyle=\"light\"")
        with open(file, "w") as f:
            f.write(content)
        print(f"Updated {file}")

print("Done patching MapViews")
