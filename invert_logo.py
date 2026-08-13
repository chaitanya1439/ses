from PIL import Image
import os

def recolor_icon(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    
    for item in data:
        r, g, b, a = item
        
        # Near white (Background) -> Navy Blue (0, 31, 87)
        if r > 200 and g > 200 and b > 200:
            # We want to keep anti-aliasing if possible, but simplest is just mapping
            new_data.append((0, 31, 87, a))
            
        # Near Navy Blue (Text) -> Pure White (255, 255, 255)
        elif r < 100 and g < 100 and b < 150:
            new_data.append((255, 255, 255, a))
            
        # Orange/Red (Dots) -> Bright Red (255, 0, 0)
        elif r > 150 and g < 150 and b < 100:
            new_data.append((255, 0, 0, a))
            
        else:
            # For edge pixels (anti-aliasing)
            # A more robust way: if it's light, map to dark. If it's dark, map to light.
            brightness = (r + g + b) / 3
            if brightness > 127:
                new_data.append((0, 31, 87, a))
            else:
                new_data.append((255, 255, 255, a))
                
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

input_icon = "/media/callidus/callidus2/ses/Ride-Booker-Flow/assets/images/icon.png"
customer_logo = "/media/callidus/callidus2/ses/Ride-Booker-Flow/assets/images/logo.png"
driver_logo = "/media/callidus/callidus2/ses/Driver-Mobile-Assets/assets/images/logo.png"

# We overwrite the logo.png files
recolor_icon(input_icon, customer_logo)
recolor_icon(input_icon, driver_logo)
