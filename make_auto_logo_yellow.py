from PIL import Image

def remove_white_bg(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(out_path, "PNG")

src = "/home/callidus/.gemini/antigravity-ide/brain/0bef2b06-c756-4359-a2d1-64ac0478e7df/auto_top_down_yellow_1786363973860.png"
out = "/media/callidus/callidus2/ses/Ride-Booker-Flow/assets/images/auto-logo.png"

remove_white_bg(src, out)
print("Saved transparent yellow auto to auto-logo.png")
