from PIL import Image
import glob

files = glob.glob("/media/callidus/callidus2/ses/*/assets/images/*.png")

for f in files:
    if "mtrip-logo" in f or "icon" in f or "splash" in f or "foreground" in f:
        try:
            img = Image.open(f).convert("RGBA")
            img.save(f, format="PNG", optimize=True)
            print("Optimized:", f)
        except Exception as e:
            print("Error on", f, e)
