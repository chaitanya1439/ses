from PIL import Image, ImageDraw, ImageFont
import os

def create_logo(output_path, is_pilot=False):
    # Navy blue background
    width = 1024
    height = 512
    img = Image.new("RGBA", (width, height), (0, 0, 128, 255))  # Dark/Navy Blue
    draw = ImageDraw.Draw(img)
    
    font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
    try:
        font = ImageFont.truetype(font_path, 160)
        pilot_font = ImageFont.truetype(font_path, 80)
    except IOError:
        font = ImageFont.load_default()
        pilot_font = font

    text = "My Trip"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (width - text_width) / 2
    y = (height - text_height) / 2 - (40 if is_pilot else 0)

    # Draw main text in white
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))
    
    # Let's add a red dot at the end
    dot_radius = 20
    dot_x = x + text_width + 10
    dot_y = y + text_height - dot_radius * 2
    draw.ellipse([dot_x, dot_y, dot_x + dot_radius * 2, dot_y + dot_radius * 2], fill=(255, 0, 0, 255))

    if is_pilot:
        pilot_text = "PILOT"
        p_bbox = draw.textbbox((0, 0), pilot_text, font=pilot_font)
        p_w = p_bbox[2] - p_bbox[0]
        # Draw pilot smaller to ensure it doesn't get cut
        px = (width - p_w) / 2
        py = y + text_height + 40
        draw.text((px, py), pilot_text, font=pilot_font, fill=(200, 200, 255, 255))

    # Resize to standard sizes
    img = img.resize((512, 256), Image.Resampling.LANCZOS)
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

# Customer App Logo
create_logo('/media/callidus/callidus2/ses/Ride-Booker-Flow/assets/images/mtrip-logo.png', is_pilot=False)
# Pilot App Logo
create_logo('/media/callidus/callidus2/ses/Driver-Mobile-Assets/assets/images/mtrip-logo.png', is_pilot=True)
create_logo('/media/callidus/callidus2/ses/mtrip-pilot-logo.png', is_pilot=True)

print("Logo generation complete.")
