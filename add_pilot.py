from PIL import Image, ImageDraw, ImageFont
import os

input_path = '/media/callidus/callidus2/ses/Ride-Booker-Flow/assets/images/mtrip-logo.png'
output_path = '/media/callidus/callidus2/ses/mtrip-pilot-logo.png'
font_path = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

img = Image.open(input_path).convert("RGBA")
width, height = img.size

# The original image might have a lot of white space at the bottom.
# We will hardly increase the canvas height, just 2%.
new_height = int(height * 1.02)
new_img = Image.new("RGBA", (width, new_height), (255, 255, 255, 255))
new_img.paste(img, (0, 0), img)

draw = ImageDraw.Draw(new_img)
text = "PILOT"
dark_blue = (0, 0, 128, 255) 

font_size = int(height * 0.15)
try:
    font = ImageFont.truetype(font_path, font_size)
except IOError:
    font = ImageFont.load_default()

bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]

# Move Y coordinate MUCH higher (up by 26% of original height)
y = height - (height * 0.26) 

# Calculate letter spacing by drawing letter by letter
letter_spacing = int(width * 0.02)
total_width_with_spacing = text_width + (len(text) - 1) * letter_spacing
x = (width - total_width_with_spacing) / 2

for char in text:
    draw.text((x, y), char, font=font, fill=dark_blue)
    char_bbox = draw.textbbox((0, 0), char, font=font)
    char_w = char_bbox[2] - char_bbox[0]
    x += char_w + letter_spacing

new_img.save(output_path)
print("Saved to", output_path)
