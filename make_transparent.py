from PIL import Image
import os

def remove_white_bg(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # If the pixel is close to white, make it transparent
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(out_path, "PNG")
    print(f"Saved {out_path}")

bike_src = "/home/callidus/.gemini/antigravity-ide/brain/6a956523-4e4f-4939-8fa2-550a20350c70/normal_bike_1785814047575.png"
scooty_src = "/home/callidus/.gemini/antigravity-ide/brain/6a956523-4e4f-4939-8fa2-550a20350c70/yellow_green_scooty_1785814015116.png"

bike_out = "/media/callidus/callidus2/ses/Ride-Booker-Flow/assets/images/bike-saver.png"
scooty_out = "/media/callidus/callidus2/ses/Ride-Booker-Flow/assets/images/scooty.png"

remove_white_bg(bike_src, bike_out)
remove_white_bg(scooty_src, scooty_out)
