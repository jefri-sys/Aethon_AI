import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import glob

def add_corners(im, rad):
    circle = Image.new('L', (rad * 2, rad * 2), 0)
    draw = ImageDraw.Draw(circle)
    draw.ellipse((0, 0, rad * 2 - 1, rad * 2 - 1), fill=255)
    alpha = Image.new('L', im.size, 255)
    w, h = im.size
    alpha.paste(circle.crop((0, 0, rad, rad)), (0, 0))
    alpha.paste(circle.crop((rad, 0, rad * 2, rad)), (w - rad, 0))
    alpha.paste(circle.crop((0, rad, rad, rad * 2)), (0, h - rad))
    alpha.paste(circle.crop((rad, rad, rad * 2, rad * 2)), (w - rad, h - rad))
    im.putalpha(alpha)
    return im

def create_mockup(screenshot_path):
    screen = Image.open(screenshot_path).convert("RGBA")
    screen_radius = 80
    screen = add_corners(screen, screen_radius)
    
    border = 60
    w, h = screen.size
    frame_w = w + border * 2
    frame_h = h + border * 2
    frame_radius = screen_radius + border // 2
    
    phone_color = (25, 25, 30, 255)
    frame = Image.new("RGBA", (frame_w, frame_h), (0,0,0,0))
    draw = ImageDraw.Draw(frame)
    draw.rounded_rectangle([0, 0, frame_w, frame_h], radius=frame_radius, fill=phone_color)
    
    bezel_color = (70, 70, 80, 255)
    draw.rounded_rectangle([2, 2, frame_w-2, frame_h-2], radius=frame_radius, outline=bezel_color, width=4)
    
    frame.paste(screen, (border, border), screen)
    
    camera_w = 260
    camera_h = 70
    camera_x = (frame_w - camera_w) // 2
    camera_y = border + 20
    draw.rounded_rectangle([camera_x, camera_y, camera_x + camera_w, camera_y + camera_h], radius=camera_h//2, fill=(10,10,10,255))
    
    target_mockup_w = 700
    target_mockup_h = int(frame_h * (target_mockup_w / frame_w))
    frame = frame.resize((target_mockup_w, target_mockup_h), Image.Resampling.LANCZOS)
    return frame

def create_gradient_bg(width, height):
    # A beautiful dark purple to dark blue gradient background
    base = Image.new('RGBA', (width, height), (15, 10, 30, 255))
    draw = ImageDraw.Draw(base)
    # Draw simple vertical gradient
    for y in range(height):
        # Interpolate between (20, 15, 40) and (10, 5, 20)
        r = int(25 - (15 * (y / height)))
        g = int(20 - (15 * (y / height)))
        b = int(50 - (30 * (y / height)))
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
        
    # Add some soft decorative glowing orbs (like in the user's sample)
    orb = Image.new('RGBA', (1000, 1000), (0,0,0,0))
    orb_draw = ImageDraw.Draw(orb)
    orb_draw.ellipse((0,0,1000,1000), fill=(100, 50, 150, 30))
    orb = orb.filter(ImageFilter.GaussianBlur(150))
    
    base.paste(orb, (-200, -200), orb)
    base.paste(orb, (width-800, height-800), orb)
    
    return base

def create_showcase(mockups, headings, output_path):
    canvas_w = 3840
    canvas_h = 2160
    canvas = create_gradient_bg(canvas_w, canvas_h)
    
    num_mockups = len(mockups)
    if num_mockups == 0:
        return None
        
    mockup_w, mockup_h = mockups[0].size
    total_mockup_w = mockup_w * num_mockups
    spacing = (canvas_w - total_mockup_w) // (num_mockups + 1)
    
    start_x = spacing
    start_y = (canvas_h - mockup_h) // 2 + 50 # Shifted down slightly to make room for headings
    
    # Try loading a system font (Windows)
    try:
        # Using Segoe UI Bold for headings
        font = ImageFont.truetype("seguiemj.ttf", 75)
        # fallback if bold not found
    except IOError:
        try:
            font = ImageFont.truetype("arialbd.ttf", 75)
        except IOError:
            font = ImageFont.load_default()
            
    try:
        num_font = ImageFont.truetype("seguiemj.ttf", 55)
    except:
        try:
            num_font = ImageFont.truetype("arialbd.ttf", 55)
        except:
            num_font = font

    draw = ImageDraw.Draw(canvas)
    
    for i, mockup in enumerate(mockups):
        x = start_x + i * (mockup_w + spacing)
        
        # Shadow
        shadow_blur = 60
        shadow = Image.new("RGBA", mockup.size, (0,0,0,0))
        shadow_draw = ImageDraw.Draw(shadow)
        shadow_draw.rectangle([0, 0, mockup_w, mockup_h], fill=(0,0,0, 180))
        shadow = shadow.filter(ImageFilter.GaussianBlur(shadow_blur))
        
        canvas.paste(shadow, (x, start_y + 40), shadow)
        canvas.paste(mockup, (x, start_y), mockup)
        
        # Draw heading above the mockup
        heading = headings[i]
        
        # Create a number pill like in the sample (e.g. "1", "2")
        # Global index from headings list or just simple numbering
        # We'll just put the title centered above the phone for elegance
        
        # Calculate text width
        bbox = draw.textbbox((0, 0), heading, font=font)
        text_w = bbox[2] - bbox[0]
        text_x = x + (mockup_w - text_w) // 2
        text_y = start_y - 120
        
        # Draw text shadow / glow for readability
        draw.text((text_x+3, text_y+3), heading, font=font, fill=(0,0,0,150))
        draw.text((text_x, text_y), heading, font=font, fill=(255,255,255,255))
        
    canvas_rgb = canvas.convert("RGB")
    canvas.save(output_path, format="PNG")
    print(f"Saved {output_path}")
    return canvas_rgb

def main():
    import json
    directory = r"D:\Synapse\Screenshot synapse"
    files = sorted(glob.glob(os.path.join(directory, "*.jpg")) + glob.glob(os.path.join(directory, "*.png")))
    # Exclude any showcase images if they ended up here
    files = [f for f in files if "showcase" not in os.path.basename(f)]
    
    print(f"Found {len(files)} screenshots.")
    
    titles_file = os.path.join(directory, "titles.json")
    all_headings = []
    
    if os.path.exists(titles_file):
        with open(titles_file, 'r', encoding='utf-8') as f:
            titles_dict = json.load(f)
            
            # Filter files to only those present in titles.json
            valid_files = []
            for f_path in files:
                basename = os.path.basename(f_path)
                if basename in titles_dict:
                    valid_files.append(f_path)
                    all_headings.append(titles_dict[basename])
            
            files = valid_files
    else:
        # Fallback headings
        all_headings = [f"Feature {i+1}" for i in range(len(files))]
        
    groups = [files[i:i + 4] for i in range(0, len(files), 4)]
    heading_groups = [all_headings[i:i + 4] for i in range(0, len(files), 4)]
    
    output_dir = os.path.join(directory, "showcase_images")
    os.makedirs(output_dir, exist_ok=True)
    
    all_canvases = []
    
    for i, group in enumerate(groups):
        print(f"Processing group {i+1} with {len(group)} screenshots...")
        mockups = [create_mockup(f) for f in group]
        out_path = os.path.join(output_dir, f"showcase_part_{i+1}.png")
        canvas = create_showcase(mockups, heading_groups[i], out_path)
        if canvas:
            all_canvases.append(canvas)
            
    if all_canvases:
        pdf_path = os.path.join(output_dir, "showcase_full.pdf")
        all_canvases[0].save(pdf_path, save_all=True, append_images=all_canvases[1:])
        print(f"Saved combined PDF at {pdf_path}")

if __name__ == "__main__":
    main()
