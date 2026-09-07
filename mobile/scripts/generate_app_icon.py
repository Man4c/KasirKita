"""
Generate Studio-Quality KasirKita POS Android App Icons (Konsep A - Vibrant Red)
Refined with perfect Android Adaptive Icon Safe Zone compliance (central 60% zone).
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont

SIZE = 4096
CX, CY = SIZE // 2, SIZE // 2

def create_red_background():
    # Rich gradient from #E11D48 to #9F1239
    bg = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(bg)

    for y in range(SIZE):
        ratio = y / SIZE
        r = int(225 - (225 - 159) * (ratio ** 1.3))
        g = int(29 - (29 - 18) * (ratio ** 1.3))
        b = int(72 - (72 - 57) * (ratio ** 1.3))
        draw.line([(0, y), (SIZE, y)], fill=(r, g, b, 255))

    # Soft radial ambient glow at center-top
    highlight = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    h_draw = ImageDraw.Draw(highlight)
    max_radius = int(SIZE * 0.65)
    for rad in range(max_radius, 0, -12):
        alpha = int(40 * (1.0 - (rad / max_radius) ** 1.4))
        if alpha > 0:
            h_draw.ellipse(
                [CX - rad, CY - int(SIZE * 0.15) - rad,
                 CX + rad, CY - int(SIZE * 0.15) + rad],
                fill=(255, 255, 255, alpha)
            )

    return Image.alpha_composite(bg, highlight)

def draw_pos_store_symbol(img, is_monochrome=False):
    """
    Draws the KasirKita POS Symbol centered at (CX, CY).
    Total symbol height ~2200px, width ~2000px.
    Fits comfortably inside a circle of radius 1150px (safe area limit is 1350px).
    """
    draw = ImageDraw.Draw(img)

    # Colors
    white = (255, 255, 255, 255)
    off_white = (255, 241, 242, 255) if not is_monochrome else white
    rose_light = (254, 205, 211, 255) if not is_monochrome else (220, 220, 220, 255)
    rose_brand = (225, 29, 72, 255) if not is_monochrome else (60, 60, 60, 255)
    rose_deep = (159, 18, 57, 255) if not is_monochrome else (40, 40, 40, 255)
    emerald = (52, 211, 153, 255) if not is_monochrome else white
    shadow_col = (110, 10, 35, 80) if not is_monochrome else (0, 0, 0, 0)

    # Vertical layout anchor points (total height from Y=1000 to Y=3100, span=2100)
    # 1. Canopy / Awning: Y: 1020 -> 1480
    # 2. Receipt slot & paper: Y: 1400 -> 1680
    # 3. POS Terminal Screen: Y: 1680 -> 2540
    # 4. Stand Neck: Y: 2540 -> 2660
    # 5. Cash Drawer Base: Y: 2660 -> 2940

    # -----------------------------------------------------------------
    # Soft Ground Shadow
    # -----------------------------------------------------------------
    if not is_monochrome:
        draw.ellipse([CX - 850, 2960, CX + 850, 3100], fill=shadow_col)

    # -----------------------------------------------------------------
    # 1. Retail Canopy / Awning
    # -----------------------------------------------------------------
    awning_top = 1040
    awning_bot = 1460
    awning_w = 1720
    ax1 = CX - awning_w // 2
    ax2 = CX + awning_w // 2

    # Roof top bar
    roof_cap_top = awning_top - 60
    draw.polygon([
        (CX - 720, roof_cap_top),
        (CX + 720, roof_cap_top),
        (ax2, awning_top),
        (ax1, awning_top)
    ], fill=white)

    # Awning Stripes (5 stripes: White, Rose, White, Rose, White)
    stripes = 5
    sw = awning_w / stripes
    top_sw = 1440 / stripes

    for i in range(stripes):
        s_left = ax1 + i * sw
        s_right = s_left + sw
        s_top_left = (CX - 720) + i * top_sw
        s_top_right = s_top_left + top_sw

        col = white if i % 2 == 0 else rose_light

        draw.polygon([
            (s_top_left, roof_cap_top),
            (s_top_right, roof_cap_top),
            (s_right, awning_bot),
            (s_left, awning_bot)
        ], fill=col)

        # Scalloped rounded bottom for each stripe
        sc_r = sw / 2
        draw.ellipse([
            s_left, awning_bot - sc_r * 0.75,
            s_right, awning_bot + sc_r * 0.75
        ], fill=col)

    # -----------------------------------------------------------------
    # 2. Receipt Paper emerging from Terminal
    # -----------------------------------------------------------------
    rw = 440
    rx1 = CX - rw // 2
    rx2 = CX + rw // 2
    rtop = awning_bot + 40
    rbot = 1720

    # Zig-zag top of receipt paper
    teeth = 5
    tw = rw / teeth
    rpts = [(rx1, rbot)]
    for t in range(teeth + 1):
        tx = rx1 + t * tw
        ty = rtop if t % 2 == 0 else rtop + 35
        rpts.append((tx, ty))
    rpts.append((rx2, rbot))

    draw.polygon(rpts, fill=white)

    # Receipt printed lines
    draw.rounded_rectangle([rx1 + 70, rtop + 100, rx2 - 70, rtop + 130], radius=15, fill=rose_deep)
    draw.rounded_rectangle([rx1 + 70, rtop + 155, rx2 - 130, rtop + 185], radius=15, fill=rose_deep)

    # -----------------------------------------------------------------
    # 3. Modern POS Terminal Screen
    # -----------------------------------------------------------------
    tw_box = 1640
    th_box = 860
    tx1 = CX - tw_box // 2
    tx2 = CX + tw_box // 2
    ty1 = 1680
    ty2 = ty1 + th_box
    bezel_radius = 120

    # Terminal White Bezel
    draw.rounded_rectangle([tx1, ty1, tx2, ty2], radius=bezel_radius, fill=white)

    # Inner Display Glass
    d_pad = 80
    dx1, dy1 = tx1 + d_pad, ty1 + d_pad
    dx2, dy2 = tx2 - d_pad, ty2 - d_pad
    screen_color = rose_deep if not is_monochrome else (45, 45, 45, 255)
    draw.rounded_rectangle([dx1, dy1, dx2, dy2], radius=bezel_radius - 40, fill=screen_color)

    # Screen Graphics:
    # A) Circular Emerald Checkmark (Payment Success / Verified)
    badge_r = 150
    bcx = dx1 + 260
    bcy = dy1 + (dy2 - dy1) // 2

    draw.ellipse([bcx - badge_r, bcy - badge_r, bcx + badge_r, bcy + badge_r], fill=emerald)

    # Crisp Checkmark
    check_pts = [
        (bcx - 70, bcy + 5),
        (bcx - 15, bcy + 60),
        (bcx + 70, bcy - 50)
    ]
    draw.line(check_pts, fill=white, width=32, joint="curve")

    # B) Modern Transaction Metrics Lines on Display
    line_x1 = bcx + badge_r + 80
    line_x2 = dx2 - 80
    line_cy = bcy

    # Line 1 (Full Bar)
    draw.rounded_rectangle([line_x1, line_cy - 90, line_x2, line_cy - 40], radius=25, fill=white)
    # Line 2 (Sub-bar 75%)
    draw.rounded_rectangle([line_x1, line_cy - 15, line_x1 + int((line_x2 - line_x1) * 0.72), line_cy + 30], radius=22, fill=rose_light)
    # Line 3 (Sub-bar 45%)
    draw.rounded_rectangle([line_x1, line_cy + 55, line_x1 + int((line_x2 - line_x1) * 0.45), line_cy + 95], radius=20, fill=rose_light)

    # -----------------------------------------------------------------
    # 4. Stand Neck & Cash Drawer Base
    # -----------------------------------------------------------------
    neck_w = 420
    draw.polygon([
        (CX - neck_w // 2, ty2),
        (CX + neck_w // 2, ty2),
        (CX + int(neck_w * 0.7), ty2 + 120),
        (CX - int(neck_w * 0.7), ty2 + 120)
    ], fill=white)

    # Cash Drawer Solid Base
    base_w = 1440
    base_h = 240
    bx1 = CX - base_w // 2
    bx2 = CX + base_w // 2
    by1 = ty2 + 120
    by2 = by1 + base_h

    draw.rounded_rectangle([bx1, by1, bx2, by2], radius=75, fill=white)

    # Cash slot line
    draw.rounded_rectangle([bx1 + 140, by1 + 75, bx2 - 140, by1 + 105], radius=15, fill=rose_deep)

    # Circular drawer lock keyhole
    key_r = 30
    draw.ellipse([CX - key_r, by1 + 140, CX + key_r, by1 + 200], fill=rose_deep)

    # -----------------------------------------------------------------
    # 5. Bold & Iconic "POS" Badge (Lower Right Overlay)
    # -----------------------------------------------------------------
    # Position badge overlapping bottom right of base and terminal
    badge_w = 680
    badge_h = 270
    badge_x1 = bx2 - badge_w + 40
    badge_y1 = by1 - 90
    badge_x2 = badge_x1 + badge_w
    badge_y2 = badge_y1 + badge_h

    # Badge Shadow
    if not is_monochrome:
        draw.rounded_rectangle([
            badge_x1 + 15, badge_y1 + 25,
            badge_x2 + 15, badge_y2 + 25
        ], radius=badge_h // 2, fill=(80, 8, 25, 95))

    # Badge Pill Background
    draw.rounded_rectangle([badge_x1, badge_y1, badge_x2, badge_y2], radius=badge_h // 2, fill=white)
    # Badge Red Border
    draw.rounded_rectangle([badge_x1, badge_y1, badge_x2, badge_y2], radius=badge_h // 2, outline=rose_deep, width=16)

    # POS Typography (Drawn with smooth geometric paths)
    letter_top = badge_y1 + 55
    letter_h = 160
    stem_w = 38

    # Letter P
    px = badge_x1 + 95
    draw.rounded_rectangle([px, letter_top, px + stem_w, letter_top + letter_h], radius=stem_w // 2, fill=rose_deep)
    loop_w = 95
    loop_h = 95
    draw.rounded_rectangle([px, letter_top, px + stem_w + loop_w, letter_top + loop_h], radius=loop_h // 2, fill=rose_deep)
    draw.rounded_rectangle([px + stem_w, letter_top + 28, px + loop_w + 10, letter_top + loop_h - 28], radius=18, fill=white)

    # Letter O
    ox = px + stem_w + loop_w + 55
    ow = 140
    draw.rounded_rectangle([ox, letter_top, ox + ow, letter_top + letter_h], radius=ow // 2, fill=rose_deep)
    draw.rounded_rectangle([ox + stem_w, letter_top + stem_w, ox + ow - stem_w, letter_top + letter_h - stem_w], radius=(ow - stem_w * 2) // 2, fill=white)

    # Letter S
    sx = ox + ow + 55
    sw = 120
    sh = letter_h
    sb = stem_w

    draw.rounded_rectangle([sx, letter_top, sx + sw, letter_top + sb], radius=sb // 2, fill=rose_deep)
    draw.rounded_rectangle([sx, letter_top, sx + sb, letter_top + sh // 2], radius=sb // 2, fill=rose_deep)
    draw.rounded_rectangle([sx, letter_top + sh // 2 - sb // 2, sx + sw, letter_top + sh // 2 + sb // 2], radius=sb // 2, fill=rose_deep)
    draw.rounded_rectangle([sx + sw - sb, letter_top + sh // 2, sx + sw, letter_top + sh], radius=sb // 2, fill=rose_deep)
    draw.rounded_rectangle([sx, letter_top + sh - sb, sx + sw, letter_top + sh], radius=sb // 2, fill=rose_deep)

def generate_all_icons(output_dir):
    os.makedirs(output_dir, exist_ok=True)

    print("1. Generating 4096px Base Elements...")
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

    print(f"[SUCCESS] All icons generated successfully in {output_dir}:")
    print(f"   - {icon_path}")
    print(f"   - {fg_path}")
    print(f"   - {bg_path}")
    print(f"   - {mono_path}")
    print(f"   - {splash_path}")
    print(f"   - {favicon_path}")

if __name__ == "__main__":
    assets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets"))
    generate_all_icons(assets_dir)
