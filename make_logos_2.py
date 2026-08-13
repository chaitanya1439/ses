import os
from PIL import Image, ImageDraw, ImageFont

def create_logo(text, width, height, filename):
    img = Image.new('RGBA', (width, height), (0, 0, 128, 255))
    draw = ImageDraw.Draw(img)
    
    # Try to load a font, otherwise use default
    try:
        font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        font = ImageFont.truetype(font_path, int(height * 0.4))
    except Exception:
        font = ImageFont.load_default()
        
    # We want "m! tr!p" where the dot of the ! is red.
    # To do this, we draw "m" "!" " tr" "!" "p" separately or just draw the text and then overwrite the dots.
    # It's easier to just draw the text normally, then manually draw red dots over the exclamation dots.
    # We can estimate the position.
    
    # Draw "m! tr!p" in white
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_w = text_bbox[2] - text_bbox[0]
    text_h = text_bbox[3] - text_bbox[1]
    
    x = (width - text_w) / 2
    y = (height - text_h) / 2 - text_bbox[1]
    
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    
    # Let's find the '!' characters and draw a red rectangle over their dots.
    # We can measure the widths of segments
    # segment 1: "m"
    bbox_m = draw.textbbox((0, 0), "m", font=font)
    w_m = bbox_m[2] - bbox_m[0]
    
    # segment 2: "m!"
    bbox_m_bang = draw.textbbox((0, 0), "m!", font=font)
    w_m_bang = bbox_m_bang[2] - bbox_m_bang[0]
    
    # segment 3: "m! tr"
    bbox_m_bang_tr = draw.textbbox((0, 0), "m! tr", font=font)
    w_m_bang_tr = bbox_m_bang_tr[2] - bbox_m_bang_tr[0]
    
    # segment 4: "m! tr!"
    bbox_m_bang_tr_bang = draw.textbbox((0, 0), "m! tr!", font=font)
    w_m_bang_tr_bang = bbox_m_bang_tr_bang[2] - bbox_m_bang_tr_bang[0]
    
    # The dot of '!' is at the bottom.
    dot_size = int(height * 0.08)
    dot_y = y + text_h - dot_size
    
    # First exclamation dot
    x1 = x + w_m + (w_m_bang - w_m)/2 - dot_size/2
    draw.ellipse([x1, dot_y, x1 + dot_size, dot_y + dot_size], fill=(255, 0, 0, 255))
    
    # Second exclamation dot
    x2 = x + w_m_bang_tr + (w_m_bang_tr_bang - w_m_bang_tr)/2 - dot_size/2
    draw.ellipse([x2, dot_y, x2 + dot_size, dot_y + dot_size], fill=(255, 0, 0, 255))

    img.save(filename)

customer_path = "/media/callidus/callidus2/ses/Ride-Booker-Flow/assets/images/logo.png"
pilot_path = "/media/callidus/callidus2/ses/Driver-Mobile-Assets/assets/images/logo.png"

create_logo("m! tr!p", 200, 200, customer_path)

# For pilot logo, we can add a smaller "PILOT" text at the bottom right.
def create_pilot_logo(text, width, height, filename):
    img = Image.new('RGBA', (width, height), (0, 0, 128, 255))
    draw = ImageDraw.Draw(img)
    
    try:
        font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        font = ImageFont.truetype(font_path, int(height * 0.35))
        font_small = ImageFont.truetype(font_path, int(height * 0.15))
    except Exception:
        font = ImageFont.load_default()
        font_small = ImageFont.load_default()
        
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_w = text_bbox[2] - text_bbox[0]
    text_h = text_bbox[3] - text_bbox[1]
    
    x = (width - text_w) / 2
    y = (height - text_h) / 2 - text_bbox[1] - 15
    
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    
    bbox_m = draw.textbbox((0, 0), "m", font=font)
    w_m = bbox_m[2] - bbox_m[0]
    
    bbox_m_bang = draw.textbbox((0, 0), "m!", font=font)
    w_m_bang = bbox_m_bang[2] - bbox_m_bang[0]
    
    bbox_m_bang_tr = draw.textbbox((0, 0), "m! tr", font=font)
    w_m_bang_tr = bbox_m_bang_tr[2] - bbox_m_bang_tr[0]
    
    bbox_m_bang_tr_bang = draw.textbbox((0, 0), "m! tr!", font=font)
    w_m_bang_tr_bang = bbox_m_bang_tr_bang[2] - bbox_m_bang_tr_bang[0]
    
    dot_size = int(height * 0.08)
    dot_y = y + text_h - dot_size
    
    x1 = x + w_m + (w_m_bang - w_m)/2 - dot_size/2
    draw.ellipse([x1, dot_y, x1 + dot_size, dot_y + dot_size], fill=(255, 0, 0, 255))
    
    x2 = x + w_m_bang_tr + (w_m_bang_tr_bang - w_m_bang_tr)/2 - dot_size/2
    draw.ellipse([x2, dot_y, x2 + dot_size, dot_y + dot_size], fill=(255, 0, 0, 255))

    pilot_bbox = draw.textbbox((0, 0), "PILOT", font=font_small)
    p_w = pilot_bbox[2] - pilot_bbox[0]
    draw.text(((width - p_w)/2, y + text_h + 10), "PILOT", font=font_small, fill=(255, 255, 255, 255))
    
    img.save(filename)

create_pilot_logo("m! tr!p", 200, 200, pilot_path)
print("Logos created successfully!")
