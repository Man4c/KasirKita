"""
Generate KasirKita POS Android App Icons with Official Brand Text "Kasir Kita"
Using official Poppins_700Bold.ttf / Poppins_800ExtraBold.ttf.
"""

import os
from PIL import Image, ImageDraw, ImageFont

SIZE = 4096
CX, CY = SIZE // 2, SIZE // 2

FONT_BOLD_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "node_modules", "@expo-google-fonts", "poppins", "700Bold", "Poppins_700Bold.ttf")
)
FONT_EXTRA_BOLD_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "node_modules", "@expo-google-fonts", "poppins", "800ExtraBold", "Poppins_800ExtraBold.ttf")
)

def create_red_background():
    bg = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(bg)

    # Smooth vertical gradient from Rose-600 #E11D48 to Rose-800 #9F1239
    for y in range(SIZE):
        ratio = y / SIZE
        r = int(225 - (225 - 159) * (ratio ** 1.3))
        g = int(29 - (29 - 18) * (ratio ** 1.3))
        b = int(72 - (72 - 57) * (ratio ** 1.3))
        draw.line([(0, y), (SIZE, y)], fill=(r, g, b, 255))

    # Ambient radial highlight at top
    highlight = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    h_draw = ImageDraw.Draw(highlight)
    max_radius = int(SIZE * 0.65)
    for rad in range(max_radius, 0, -12):
        alpha = int(40 * (1.0 - (rad / max_radius) ** 1.4))
        if alpha > 0:
            h_draw.ellipse(
                [CX - rad, CY - int(SIZE * 0.18) - rad,
                 CX + rad, CY - int(SIZE * 0.18) + rad],
                fill=(255, 255, 255, alpha)
            )

    return Image.alpha_composite(bg, highlight)

def draw_pos_store_symbol(img, is_monochrome=False):
    draw = ImageDraw.Draw(img)

    # Colors
    white = (255, 255, 255, 255)
    off_white = (255, 241, 242, 255) if not is_monochrome else white
    rose_light = (254, 205, 211, 255) if not is_monochrome else (220, 220, 220, 255)
    rose_deep = (159, 18, 57, 255) if not is_monochrome else (40, 40, 40, 255)
    emerald = (52, 211, 153, 255) if not is_monochrome else white
    shadow_col = (110, 10, 35, 80) if not is_monochrome else (0, 0, 0, 0)

    # Load Poppins font for brand text
    font_brand = ImageFont.truetype(FONT_EXTRA_BOLD_PATH, 280)
    font_pos = ImageFont.truetype(FONT_EXTRA_BOLD_PATH, 140)

    # Shift symbol slightly upward to make room for brand text "Kasir Kita" below
    # Total span: Awning top (Y=860) to Brand Text bottom (Y=2956)
    # Optical center is beautifully balanced just slightly above geometric center.

    # -----------------------------------------------------------------
    # 1. Retail Canopy / Awning
    # -----------------------------------------------------------------
    awning_top = 860
    awning_bot = 1260
    awning_w = 1600
    ax1 = CX - awning_w // 2
    ax2 = CX + awning_w // 2

    # Roof top bar
    roof_cap_top = awning_top - 55
    draw.polygon([
        (CX - 670, roof_cap_top),
        (CX + 670, roof_cap_top),
        (ax2, awning_top),
        (ax1, awning_top)
    ], fill=white)

    # Awning Stripes (5 stripes: White, Rose, White, Rose, White)
    stripes = 5
    sw = awning_w / stripes
    top_sw = 1340 / stripes

    for i in range(stripes):
        s_left = ax1 + i * sw
        s_right = s_left + sw
        s_top_left = (CX - 670) + i * top_sw
        s_top_right = s_top_left + top_sw

        col = white if i % 2 == 0 else rose_light

        draw.polygon([
            (s_top_left, roof_cap_top),
            (s_top_right, roof_cap_top),
            (s_right, awning_bot),
            (s_left, awning_bot)
        ], fill=col)

        # Scalloped rounded bottom
        sc_r = sw / 2
        draw.ellipse([
            s_left, awning_bot - sc_r * 0.75,
            s_right, awning_bot + sc_r * 0.75
        ], fill=col)

    # -----------------------------------------------------------------
    # 2. Receipt Paper emerging from Terminal
    # -----------------------------------------------------------------
    rw = 400
    rx1 = CX - rw // 2
    rx2 = CX + rw // 2
    rtop = awning_bot + 35
    rbot = 1480

    # Zig-zag top
    teeth = 5
    tw = rw / teeth
    rpts = [(rx1, rbot)]
    for t in range(teeth + 1):
        tx = rx1 + t * tw
        ty = rtop if t % 2 == 0 else rtop + 30
        rpts.append((tx, ty))
    rpts.append((rx2, rbot))

    draw.polygon(rpts, fill=white)

    # Receipt printed lines
    draw.rounded_rectangle([rx1 + 60, rtop + 85, rx2 - 60, rtop + 115], radius=15, fill=rose_deep)
    draw.rounded_rectangle([rx1 + 60, rtop + 135, rx2 - 120, rtop + 165], radius=15, fill=rose_deep)

    # -----------------------------------------------------------------
    # 3. Modern POS Terminal Screen
    # -----------------------------------------------------------------
    tw_box = 1520
    th_box = 780
    tx1 = CX - tw_box // 2
    tx2 = CX + tw_box // 2
    ty1 = 1460
    ty2 = ty1 + th_box
    bezel_radius = 110

    # Terminal White Bezel
    draw.rounded_rectangle([tx1, ty1, tx2, ty2], radius=bezel_radius, fill=white)

    # Inner Display Glass
    d_pad = 70
    dx1, dy1 = tx1 + d_pad, ty1 + d_pad
    dx2, dy2 = tx2 - d_pad, ty2 - d_pad
    screen_color = rose_deep if not is_monochrome else (45, 45, 45, 255)
    draw.rounded_rectangle([dx1, dy1, dx2, dy2], radius=bezel_radius - 35, fill=screen_color)

    # Screen Graphics:
    # A) Circular Emerald Checkmark (Verified Payment)
    badge_r = 135
    bcx = dx1 + 240
    bcy = dy1 + (dy2 - dy1) // 2

    draw.ellipse([bcx - badge_r, bcy - badge_r, bcx + badge_r, bcy + badge_r], fill=emerald)

    # Crisp Checkmark
    check_pts = [
        (bcx - 60, bcy + 5),
        (bcx - 12, bcy + 52),
        (bcx + 60, bcy - 45)
    ]
    draw.line(check_pts, fill=white, width=28, joint="curve")

    # B) Modern Transaction Metrics Lines on Display
    line_x1 = bcx + badge_r + 70
    line_x2 = dx2 - 70
    line_cy = bcy

    draw.rounded_rectangle([line_x1, line_cy - 80, line_x2, line_cy - 35], radius=22, fill=white)
    draw.rounded_rectangle([line_x1, line_cy - 12, line_x1 + int((line_x2 - line_x1) * 0.72), line_cy + 28], radius=20, fill=rose_light)
    draw.rounded_rectangle([line_x1, line_cy + 50, line_x1 + int((line_x2 - line_x1) * 0.45), line_cy + 85], radius=18, fill=rose_light)

    # -----------------------------------------------------------------
    # 4. Stand Neck & Cash Drawer Base
    # -----------------------------------------------------------------
    neck_w = 380
    draw.polygon([
        (CX - neck_w // 2, ty2),
        (CX + neck_w // 2, ty2),
        (CX + int(neck_w * 0.7), ty2 + 100),
        (CX - int(neck_w * 0.7), ty2 + 100)
    ], fill=white)

    # Cash Drawer Solid Base
    base_w = 1340
    base_h = 210
    bx1 = CX - base_w // 2
    bx2 = CX + base_w // 2
    by1 = ty2 + 100
    by2 = by1 + base_h

    draw.rounded_rectangle([bx1, by1, bx2, by2], radius=65, fill=white)

    # Cash slot line
    draw.rounded_rectangle([bx1 + 120, by1 + 65, bx2 - 120, by1 + 95], radius=15, fill=rose_deep)

    # Circular drawer lock keyhole
    key_r = 26
    draw.ellipse([CX - key_r, by1 + 125, CX + key_r, by1 + 175], fill=rose_deep)

    # -----------------------------------------------------------------
    # 5. Bold "POS" Pill Badge (Lower Right Overlay of Terminal)
    # -----------------------------------------------------------------
    badge_w = 580
    badge_h = 230
    badge_x1 = bx2 - badge_w + 30
    badge_y1 = by1 - 80
    badge_x2 = badge_x1 + badge_w
    badge_y2 = badge_y1 + badge_h

    # Badge Shadow
    if not is_monochrome:
        draw.rounded_rectangle([
            badge_x1 + 12, badge_y1 + 20,
            badge_x2 + 12, badge_y2 + 20
        ], radius=badge_h // 2, fill=(80, 8, 25, 95))

    # Badge Background
    draw.rounded_rectangle([badge_x1, badge_y1, badge_x2, badge_y2], radius=badge_h // 2, fill=white)
    draw.rounded_rectangle([badge_x1, badge_y1, badge_x2, badge_y2], radius=badge_h // 2, outline=rose_deep, width=14)

    # "POS" text inside badge using Poppins
    pos_text = "POS"
    pos_bbox = draw.textbbox((0, 0), pos_text, font=font_pos)
    pos_tw = pos_bbox[2] - pos_bbox[0]
    pos_th = pos_bbox[3] - pos_bbox[1]
    pos_tx = badge_x1 + (badge_w - pos_tw) // 2
    pos_ty = badge_y1 + (badge_h - pos_th) // 2 - 15
    draw.text((pos_tx, pos_ty), pos_text, font=font_pos, fill=rose_deep)

    # -----------------------------------------------------------------
    # 6. Official Brand Text "Kasir Kita" (Beneath the Cash Drawer)
    # -----------------------------------------------------------------
    text_brand = "Kasir Kita"
    bbox = draw.textbbox((0, 0), text_brand, font=font_brand)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    text_x = CX - (bbox[0] + bbox[2]) // 2
    text_y = by2 + 110

    # Soft ambient drop-shadow beneath typography for readability and separation
    if not is_monochrome:
        draw.text((text_x + 10, text_y + 18), text_brand, font=font_brand, fill=(90, 8, 28, 110))

    # Crisp pure white "Kasir Kita" in official Poppins Extra Bold
    draw.text((text_x, text_y), text_brand, font=font_brand, fill=white)

def generate_all_icons(output_dir):
    os.makedirs(output_dir, exist_ok=True)

    print("1. Generating 4096px Base Elements with 'Kasir Kita' Brand Typography...")
    red_bg = create_red_background()

    # Foreground on Transparent
    fg_canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw_pos_store_symbol(fg_canvas, is_monochrome=False)

    # Monochrome on Transparent
    mono_canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw_pos_store_symbol(mono_canvas, is_monochrome=True)

    # Combined Full Icon (Red BG + Symbol)
    full_canvas = Image.alpha_composite(red_bg, fg_canvas)

    print("2. Downsampling to 1024x1024 with high-fidelity Lanczos resampling...")
    icon_1024 = full_canvas.resize((1024, 1024), Image.Resampling.LANCZOS)
    fg_1024 = fg_canvas.resize((1024, 1024), Image.Resampling.LANCZOS)
    bg_1024 = red_bg.resize((1024, 1024), Image.Resampling.LANCZOS)
    mono_1024 = mono_canvas.resize((1024, 1024), Image.Resampling.LANCZOS)

    # Splash Icon (Centered Symbol on transparent, 1024x1024)
    splash_1024 = fg_1024.copy()

    # Favicon 48x48
    favicon_48 = icon_1024.resize((48, 48), Image.Resampling.LANCZOS)

    # Save to target paths
    icon_path = os.path.join(output_dir, "icon.png")
    fg_path = os.path.join(output_dir, "android-icon-foreground.png")
    bg_path = os.path.join(output_dir, "android-icon-background.png")
    mono_path = os.path.join(output_dir, "android-icon-monochrome.png")
    splash_path = os.path.join(output_dir, "splash-icon.png")
    favicon_path = os.path.join(output_dir, "favicon.png")

    icon_1024.save(icon_path, "PNG", optimize=True)
    fg_1024.save(fg_path, "PNG", optimize=True)
    bg_1024.save(bg_path, "PNG", optimize=True)
    mono_1024.save(mono_path, "PNG", optimize=True)
    splash_1024.save(splash_path, "PNG", optimize=True)
    favicon_48.save(favicon_path, "PNG", optimize=True)

    print(f"[SUCCESS] All icons with 'Kasir Kita' typography generated in {output_dir}:")
    print(f"   - {icon_path}")
    print(f"   - {fg_path}")
    print(f"   - {bg_path}")
    print(f"   - {mono_path}")
    print(f"   - {splash_path}")
    print(f"   - {favicon_path}")

if __name__ == "__main__":
    assets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets"))
    generate_all_icons(assets_dir)
