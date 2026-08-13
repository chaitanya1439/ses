from PIL import Image

def floodfill_transparent(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    data = img.load()
    
    # Target color (from the top-left pixel)
    target_color = data[0, 0]
    
    # We'll use a simple BFS to find all connected background pixels
    queue = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    visited = set(queue)
    
    # Threshold for color matching
    def is_match(c1, c2, tolerance=30):
        return all(abs(c1[i] - c2[i]) <= tolerance for i in range(3))
        
    pixels_to_clear = []
    
    while queue:
        x, y = queue.pop(0)
        pixels_to_clear.append((x, y))
        
        for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                visited.add((nx, ny))
                if is_match(data[nx, ny], target_color):
                    queue.append((nx, ny))
                    
    # Make them transparent
    for x, y in pixels_to_clear:
        data[x, y] = (255, 255, 255, 0)
        
    img.save(out_path, "PNG")

src = "/media/callidus/callidus2/ses/Ride-Booker-Flow/assets/images/auto-logo.png"
out = "/media/callidus/callidus2/ses/Ride-Booker-Flow/assets/images/auto-logo.png"

floodfill_transparent(src, out)
print("Background made transparent successfully")
