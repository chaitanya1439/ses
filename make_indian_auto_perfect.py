from PIL import Image

def remove_white_bg(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # If the pixel is very close to white
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(out_path, "PNG")

src = "/home/callidus/.gemini/antigravity-ide/brain/0bef2b06-c756-4359-a2d1-64ac0478e7df/indian_auto_top_perfect_1786365580837.png"
out = "/media/callidus/callidus2/ses/Ride-Booker-Flow/assets/images/auto-logo.png"

remove_white_bg(src, out)
print("Saved perfect indian auto to auto-logo.png")
