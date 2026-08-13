import os
from PIL import Image, ImageDraw, ImageFont

def create_adaptive_foreground(filename, text="m! tr!p", sub_text="PILOT", size=1024):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    try:
        font_path = "/media/callidus/callidus2/ses/Roboto-Bold.ttf"
        font_size = int(size * 0.18)
        sub_font_size = int(size * 0.08)
        font = ImageFont.truetype(font_path, font_size)
        sub_font = ImageFont.truetype(font_path, sub_font_size)
    except Exception:
        font = ImageFont.load_default()
        sub_font = ImageFont.load_default()
        
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_w = text_bbox[2] - text_bbox[0]
    text_h = text_bbox[3] - text_bbox[1]
    
    sub_bbox = draw.textbbox((0, 0), sub_text, font=sub_font)
    sub_w = sub_bbox[2] - sub_bbox[0]
    sub_h = sub_bbox[3] - sub_bbox[1]
    
    total_h = text_h + 20 + sub_h
    
    x = (size - text_w) / 2
    y = (size - total_h) / 2 - text_bbox[1]
    
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    
    bbox_m = draw.textbbox((0, 0), "m", font=font)
    w_m = bbox_m[2] - bbox_m[0]
    
    bbox_m_bang = draw.textbbox((0, 0), "m!", font=font)
    w_m_bang = bbox_m_bang[2] - bbox_m_bang[0]
    
    bbox_m_bang_tr = draw.textbbox((0, 0), "m! tr", font=font)
    w_m_bang_tr = bbox_m_bang_tr[2] - bbox_m_bang_tr[0]
    
    bbox_m_bang_tr_bang = draw.textbbox((0, 0), "m! tr!", font=font)
    w_m_bang_tr_bang = bbox_m_bang_tr_bang[2] - bbox_m_bang_tr_bang[0]
    
    dot_size = int(font_size * 0.25)
    dot_y = y + text_h - dot_size
    
    x1 = x + w_m + (w_m_bang - w_m)/2 - dot_size/2
    draw.ellipse([x1, dot_y, x1 + dot_size, dot_y + dot_size], fill=(255, 0, 0, 255))
    
    x2 = x + w_m_bang_tr + (w_m_bang_tr_bang - w_m_bang_tr)/2 - dot_size/2
    draw.ellipse([x2, dot_y, x2 + dot_size, dot_y + dot_size], fill=(255, 0, 0, 255))
    
    px = (size - sub_w) / 2
    py = y + text_h + 20
    draw.text((px, py), sub_text, font=sub_font, fill=(255, 255, 255, 255))
    
    img.save(filename)

def create_full_icon(filename, bg_color=(0, 0, 128, 255), size=1024):
    img = Image.new('RGBA', (size, size), bg_color)
    draw = ImageDraw.Draw(img)
    
    try:
        font_path = "/media/callidus/callidus2/ses/Roboto-Bold.ttf"
        font_size = int(size * 0.18)
        sub_font_size = int(size * 0.08)
        font = ImageFont.truetype(font_path, font_size)
        sub_font = ImageFont.truetype(font_path, sub_font_size)
    except Exception:
        font = ImageFont.load_default()
        sub_font = ImageFont.load_default()
        
    text = "m! tr!p"
    sub_text = "PILOT"
        
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_w = text_bbox[2] - text_bbox[0]
    text_h = text_bbox[3] - text_bbox[1]
    
    sub_bbox = draw.textbbox((0, 0), sub_text, font=sub_font)
    sub_w = sub_bbox[2] - sub_bbox[0]
    sub_h = sub_bbox[3] - sub_bbox[1]
    
    total_h = text_h + 20 + sub_h
    
    x = (size - text_w) / 2
    y = (size - total_h) / 2 - text_bbox[1]
    
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    
    bbox_m = draw.textbbox((0, 0), "m", font=font)
    w_m = bbox_m[2] - bbox_m[0]
    
    bbox_m_bang = draw.textbbox((0, 0), "m!", font=font)
    w_m_bang = bbox_m_bang[2] - bbox_m_bang[0]
    
    bbox_m_bang_tr = draw.textbbox((0, 0), "m! tr", font=font)
    w_m_bang_tr = bbox_m_bang_tr[2] - bbox_m_bang_tr[0]
    
    bbox_m_bang_tr_bang = draw.textbbox((0, 0), "m! tr!", font=font)
    w_m_bang_tr_bang = bbox_m_bang_tr_bang[2] - bbox_m_bang_tr_bang[0]
    
    dot_size = int(font_size * 0.25)
    dot_y = y + text_h - dot_size
    
    x1 = x + w_m + (w_m_bang - w_m)/2 - dot_size/2
    draw.ellipse([x1, dot_y, x1 + dot_size, dot_y + dot_size], fill=(255, 0, 0, 255))
    
    x2 = x + w_m_bang_tr + (w_m_bang_tr_bang - w_m_bang_tr)/2 - dot_size/2
    draw.ellipse([x2, dot_y, x2 + dot_size, dot_y + dot_size], fill=(255, 0, 0, 255))
    
    px = (size - sub_w) / 2
    py = y + text_h + 20
    draw.text((px, py), sub_text, font=sub_font, fill=(255, 255, 255, 255))
    
    img.save(filename)

base_dir = "/media/callidus/callidus2/ses/Driver-Mobile-Assets/assets/images"

create_adaptive_foreground(os.path.join(base_dir, "android-icon-foreground.png"))
create_full_icon(os.path.join(base_dir, "icon.png"), size=1024)
create_full_icon(os.path.join(base_dir, "splash-icon.png"), size=2048)

print("Icons fixed and generated successfully!")
