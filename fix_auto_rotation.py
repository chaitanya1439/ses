from PIL import Image

def process_and_save(img_path, out_path):
    # Open and convert
    img = Image.open(img_path).convert("RGBA")
    
    # Rotate 180 degrees because the wheel was at the bottom, it should be at the top
    img = img.rotate(180, expand=True)
    
    width, height = img.size
    data = img.load()
    
    target_color = data[0, 0]
    queue = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    visited = set(queue)
    
    def is_match(c1, c2, tolerance=40):
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
                    
    for x, y in pixels_to_clear:
        data[x, y] = (255, 255, 255, 0)
        
    img.save(out_path, "PNG")

src = "/home/callidus/.gemini/antigravity-ide/brain/0bef2b06-c756-4359-a2d1-64ac0478e7df/auto_icon_flat_1786365142451.png"
out = "/media/callidus/callidus2/ses/Ride-Booker-Flow/assets/images/auto-logo.png"

process_and_save(src, out)
print("Rotated 180 degrees, made transparent, and saved to auto-logo.png")
