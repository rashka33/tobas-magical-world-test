"""Soft toy-style hub art for the Bluey-inspired overlay. Original drawings, not show assets."""
import math
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "art")
os.makedirs(OUT, exist_ok=True)
S = 512


def canvas(bg=None):
    im = Image.new("RGBA", (S, S), bg or (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def eye(d, x, y, s=22):
    d.ellipse([x - s, y - s, x + s, y + s], fill=(255, 255, 255, 255))
    d.ellipse([x - s * 0.42, y - s * 0.05, x + s * 0.28, y + s * 0.62], fill=(45, 32, 28, 255))
    d.ellipse([x - s * 0.05, y - s * 0.42, x + s * 0.28, y - s * 0.08], fill=(255, 255, 255, 255))


def smile(d, x, y, w=70, h=36):
    d.arc([x - w, y - h, x + w, y + h], 20, 160, fill=(90, 50, 40, 255), width=8)


def save(im, name):
    path = os.path.join(OUT, name)
    im.save(path, "WEBP", quality=86, method=6)
    print(path)


def disc(fill):
    im, d = canvas()
    d.ellipse([8, 8, S - 8, S - 8], fill=fill)
    d.ellipse([28, 18, 220, 150], fill=(255, 255, 255, 70))
    return im, d


def monkey():
    im, d = disc((255, 228, 170, 255))
    d.ellipse([70, 150, 190, 300], fill=(120, 72, 42, 255))
    d.ellipse([322, 150, 442, 300], fill=(120, 72, 42, 255))
    d.ellipse([118, 188, 176, 270], fill=(255, 214, 170, 255))
    d.ellipse([336, 188, 394, 270], fill=(255, 214, 170, 255))
    d.ellipse([120, 90, 392, 400], fill=(138, 84, 48, 255))
    d.ellipse([168, 168, 344, 360], fill=(255, 220, 176, 255))
    eye(d, 210, 230, 28)
    eye(d, 302, 230, 28)
    d.ellipse([236, 268, 276, 300], fill=(90, 52, 40, 255))
    smile(d, 256, 300, 54, 28)
    # little banana so the feed tile reads
    d.polygon([(330, 330), (400, 300), (430, 340), (360, 390)], fill=(255, 214, 50, 255))
    save(im, "hub-feed.webp")


def leo():
    im, d = disc((255, 236, 190, 255))
    for i in range(14):
        a = math.radians(i * (360 / 14) - 80)
        cx = 256 + math.cos(a) * 150
        cy = 250 + math.sin(a) * 145
        d.ellipse([cx - 48, cy - 48, cx + 48, cy + 48], fill=(196, 112, 42, 255))
    d.ellipse([130, 120, 382, 390], fill=(255, 196, 70, 255))
    eye(d, 200, 230, 26)
    eye(d, 312, 230, 26)
    d.polygon([(256, 250), (236, 300), (276, 300)], fill=(214, 130, 60, 255))
    smile(d, 256, 310, 50, 24)
    # waving paw
    d.ellipse([360, 70, 470, 190], fill=(255, 186, 90, 255))
    d.ellipse([378, 88, 452, 168], fill=(255, 220, 170, 255))
    d.ellipse([392, 108, 410, 126], fill=(90, 50, 40, 255))
    d.ellipse([418, 112, 436, 130], fill=(90, 50, 40, 255))
    d.ellipse([404, 132, 422, 150], fill=(90, 50, 40, 255))
    save(im, "leo-wave.webp")


def banana():
    im, d = canvas((255, 248, 220, 255))
    d.rounded_rectangle([16, 16, S - 16, S - 16], 80, fill=(255, 243, 190, 255))

    def band(a0, a1, r1, r2, fill):
        pts = []
        steps = 28
        for i in range(steps + 1):
            a = math.radians(a0 + (a1 - a0) * i / steps)
            pts.append((256 + r1 * math.cos(a), 300 + r1 * math.sin(a)))
        for i in range(steps + 1):
            a = math.radians(a1 - (a1 - a0) * i / steps)
            pts.append((256 + r2 * math.cos(a), 300 + r2 * math.sin(a)))
        d.polygon(pts, fill=fill)

    band(200, 340, 150, 230, (242, 176, 40, 255))
    band(206, 334, 168, 214, (255, 226, 70, 255))
    d.ellipse([96, 300, 150, 354], fill=(110, 72, 36, 255))
    d.ellipse([392, 168, 446, 222], fill=(110, 72, 36, 255))
    save(im, "banana.webp")


def bubbles():
    im, d = disc((186, 230, 255, 255))
    specs = [(180, 200, 110, (120, 200, 255, 255)), (320, 230, 86, (255, 255, 255, 230)),
             (230, 320, 70, (255, 190, 230, 255)), (140, 300, 48, (190, 255, 230, 255))]
    for x, y, r, col in specs:
        d.ellipse([x - r, y - r, x + r, y + r], fill=col, outline=(255, 255, 255, 255), width=6)
        d.ellipse([x - r * 0.4, y - r * 0.55, x - r * 0.05, y - r * 0.2], fill=(255, 255, 255, 200))
    save(im, "hub-bubbles.webp")


def balloons():
    im, d = disc((255, 214, 230, 255))
    cols = [(255, 90, 110, 255), (255, 200, 60, 255), (90, 180, 255, 255)]
    xs = [150, 256, 362]
    for i, x in enumerate(xs):
        d.rounded_rectangle([x - 48, 90, x + 48, 230], 48, fill=cols[i])
        d.polygon([(x - 12, 220), (x + 12, 220), (x, 248)], fill=cols[i])
        d.line([(x, 248), (x + (i - 1) * 18, 360)], fill=(120, 80, 70, 255), width=4)
    d.ellipse([150, 330, 360, 360], fill=(255, 255, 255, 180))
    save(im, "hub-balloons.webp")


def memory():
    im, d = disc((230, 214, 255, 255))
    d.rounded_rectangle([70, 110, 250, 390], 28, fill=(255, 255, 255, 255))
    d.rounded_rectangle([250, 140, 440, 400], 28, fill=(126, 200, 240, 255))
    # tiny leo hint on the blue card
    d.ellipse([300, 210, 390, 310], fill=(255, 196, 70, 255))
    d.ellipse([318, 240, 338, 262], fill=(255, 255, 255, 255))
    d.ellipse([354, 240, 374, 262], fill=(255, 255, 255, 255))
    save(im, "hub-memory.webp")


def puzzle():
    im, d = disc((255, 214, 170, 255))
    d.rounded_rectangle([96, 96, 250, 250], 24, fill=(255, 120, 90, 255))
    d.rounded_rectangle([262, 96, 416, 250], 24, fill=(255, 200, 70, 255))
    d.rounded_rectangle([96, 262, 250, 416], 24, fill=(100, 190, 255, 255))
    d.rounded_rectangle([262, 262, 416, 416], 24, fill=(120, 210, 140, 255))
    d.ellipse([214, 150, 298, 234], fill=(255, 236, 200, 255))
    save(im, "hub-puzzle.webp")


def counting():
    im, d = disc((255, 236, 170, 255))
    cols = [(255, 255, 255, 255), (255, 214, 70, 255), (255, 160, 70, 255)]
    for i, col in enumerate(cols):
        x = 120 + i * 130
        d.ellipse([x, 150, x + 110, 260], fill=col, outline=(255, 255, 255, 255), width=6)
        # digit block
        d.rounded_rectangle([x + 40, 190, x + 70, 230], 8, fill=(120, 70, 30, 255))
    save(im, "hub-counting.webp")


def patterns():
    im, d = disc((210, 245, 200, 255))
    shapes = ["c", "s", "c", "s"]
    colors = [(240, 80, 90, 255), (80, 150, 240, 255), (240, 80, 90, 255), (80, 150, 240, 255)]
    for i, kind in enumerate(shapes):
        x = 70 + i * 110
        y = 200
        if kind == "c":
            d.ellipse([x, y, x + 80, y + 80], fill=colors[i])
        else:
            d.rounded_rectangle([x, y, x + 80, y + 80], 12, fill=colors[i])
    save(im, "hub-patterns.webp")


def sorter():
    im, d = disc((200, 230, 255, 255))
    d.ellipse([70, 150, 200, 280], fill=(255, 120, 140, 255))
    d.rounded_rectangle([220, 150, 340, 280], 16, fill=(255, 200, 60, 255))
    d.polygon([(390, 280), (450, 150), (500, 280)], fill=(90, 190, 120, 255))
    save(im, "hub-sorter.webp")


if __name__ == "__main__":
    monkey()
    leo()
    banana()
    bubbles()
    balloons()
    memory()
    puzzle()
    counting()
    patterns()
    sorter()
