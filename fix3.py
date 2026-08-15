with open("Ride-Booker-Flow/app/driver-search.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("    });\n    });\n\n    // Live driver location", "    });\n\n    // Live driver location")

with open("Ride-Booker-Flow/app/driver-search.tsx", "w", encoding="utf-8") as f:
    f.write(content)
