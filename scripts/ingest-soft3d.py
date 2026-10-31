"""Pull Critiquito soft-3D art from /workspace/toba/art/soft3d/ into assets/art.

If a slot is missing, write a clear soft-3D sticker placeholder and record it
in assets/art/ART-STATUS.json. Placeholders are not final art.
"""
import json
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "assets", "art")
os.makedirs(OUT, exist_ok=True)

SOURCE_DIRS = [
    os.environ.get("SOFT3D_SRC") or "",
    "/home/ubuntu/.cursor/projects/workspace/uploads/soft3d-batch1/soft3d",
    "/workspace/toba/art/soft3d",
]

# Production ART map slots. p1/ is intentionally not ingested.
SLOTS = [
    "hub-bubbles",
    "hub-balloons",
    "hub-feed",
    "hub-memory",
    "hub-puzzle",
    "hub-counting",
    "hub-patterns",
    "hub-sorter",
    "title-landscape",
    "title-portrait",
    "leo-cheer",
    "leo-wave",
    "logo-toba",
    "banana",
]


def source_roots():
    roots = []
    for path in SOURCE_DIRS:
        if path and os.path.isdir(path) and path not in roots:
            roots.append(path)
    return roots


def find_source(slot, sub=""):
    rel = os.path.join(sub, slot) if sub else slot
    for root in source_roots():
        for ext in (".webp", ".png", ".jpg", ".jpeg"):
            path = os.path.join(root, rel + ext)
            if os.path.isfile(path):
                return path
    return None


def save_webp(im, slot, max_side=512):
    im = im.convert("RGBA")
    if max_side and max(im.size) > max_side:
        im.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    path = os.path.join(OUT, slot + ".webp")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, "WEBP", quality=86, method=6)
    return path


def derive_banana(feed_path):
    """Fruit crop from hub-feed so the counting button is real art, not a watermark."""
    im = Image.open(feed_path).convert("RGBA")
    # The big banana sits in the bowl, right of center.
    crop = im.crop((500, 340, 860, 700))
    return crop


def sticker_disc(fill, label, motif):
    S = 640
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # soft drop shadow
    shadow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.ellipse([48, 64, 592, 608], fill=(120, 70, 30, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    im.alpha_composite(shadow)
    d = ImageDraw.Draw(im)
    d.ellipse([18, 18, 622, 622], fill=fill)
    # inner shade + highlight for a soft-3D disc
    shade = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sh = ImageDraw.Draw(shade)
    sh.ellipse([68, 60, 572, 564], fill=(255, 255, 255, 0))
    sh.pieslice([68, 60, 572, 564], 20, 200, fill=(255, 255, 255, 70))
    sh.pieslice([90, 300, 560, 620], 10, 170, fill=(120, 70, 20, 35))
    im.alpha_composite(shade)
    d = ImageDraw.Draw(im)
    motif(d)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
    except Exception:
        font = ImageFont.load_default()
    caption = "preview · " + label
    d.rounded_rectangle([150, 470, 490, 522], 18, fill=(255, 255, 255, 210))
    d.text((176, 480), caption, fill=(120, 80, 40, 255), font=font)
    return im


def blob(d, box, color):
    d.ellipse(box, fill=color)


def motifs():
    def bubbles(d):
        blob(d, [150, 150, 310, 310], (255, 255, 255, 230))
        blob(d, [280, 190, 470, 380], (186, 230, 255, 255))
        blob(d, [210, 300, 360, 450], (255, 210, 230, 255))

    def balloons(d):
        blob(d, [140, 140, 250, 280], (255, 110, 130, 255))
        blob(d, [250, 110, 390, 280], (255, 210, 80, 255))
        blob(d, [360, 150, 490, 300], (110, 190, 255, 255))

    def feed(d):
        blob(d, [150, 120, 490, 470], (150, 96, 58, 255))
        blob(d, [210, 200, 430, 420], (255, 214, 170, 255))
        blob(d, [230, 230, 290, 290], (255, 255, 255, 255))
        blob(d, [340, 230, 400, 290], (255, 255, 255, 255))
        blob(d, [248, 252, 270, 274], (50, 36, 28, 255))
        blob(d, [358, 252, 380, 274], (50, 36, 28, 255))

    def memory(d):
        d.rounded_rectangle([150, 160, 310, 420], 28, fill=(255, 255, 255, 255))
        d.rounded_rectangle([320, 180, 490, 440], 28, fill=(126, 196, 240, 255))

    def puzzle(d):
        d.rounded_rectangle([150, 150, 310, 310], 24, fill=(255, 130, 100, 255))
        d.rounded_rectangle([320, 150, 480, 310], 24, fill=(255, 206, 80, 255))
        d.rounded_rectangle([150, 320, 310, 480], 24, fill=(110, 190, 255, 255))
        d.rounded_rectangle([320, 320, 480, 480], 24, fill=(120, 210, 140, 255))

    def counting(d):
        for i, col in enumerate([(255, 255, 255, 255), (255, 214, 70, 255), (255, 170, 80, 255)]):
            x = 140 + i * 130
            blob(d, [x, 200, x + 110, 310], col)

    def patterns(d):
        blob(d, [140, 230, 240, 330], (240, 90, 100, 255))
        d.rounded_rectangle([260, 230, 360, 330], 16, fill=(80, 150, 240, 255))
        blob(d, [380, 230, 480, 330], (240, 90, 100, 255))

    def sorter(d):
        blob(d, [130, 200, 250, 320], (255, 120, 140, 255))
        d.rounded_rectangle([270, 190, 390, 330], 18, fill=(255, 200, 70, 255))
        d.polygon([(430, 340), (500, 180), (560, 340)], fill=(90, 190, 120, 255))

    return {
        "hub-bubbles": ((186, 224, 255, 255), bubbles),
        "hub-balloons": ((255, 214, 228, 255), balloons),
        "hub-feed": ((255, 226, 176, 255), feed),
        "hub-memory": ((230, 220, 255, 255), memory),
        "hub-puzzle": ((255, 214, 180, 255), puzzle),
        "hub-counting": ((255, 236, 176, 255), counting),
        "hub-patterns": ((214, 242, 206, 255), patterns),
        "hub-sorter": ((206, 230, 255, 255), sorter),
    }


def scene(w, h, caption):
    im = Image.new("RGBA", (w, h), (255, 236, 196, 255))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w, int(h * 0.62)], fill=(186, 224, 255, 255))
    d.ellipse([int(w * 0.72), int(h * 0.08), int(w * 0.72) + 140, int(h * 0.08) + 140], fill=(255, 236, 150, 255))
    d.ellipse([-80, int(h * 0.48), int(w * 0.55), int(h * 0.95)], fill=(168, 214, 120, 255))
    d.ellipse([int(w * 0.35), int(h * 0.52), w + 80, int(h * 1.05)], fill=(126, 190, 96, 255))
    d.rectangle([0, int(h * 0.78), w, h], fill=(234, 201, 122, 255))
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
    except Exception:
        font = ImageFont.load_default()
    d.rounded_rectangle([24, 24, 420, 78], 16, fill=(255, 255, 255, 210))
    d.text((40, 34), "preview · " + caption, fill=(120, 80, 40, 255), font=font)
    return im


def leo(wave=False):
    S = 640
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for i in range(12):
        import math
        a = math.radians(i * 30 - 80)
        cx = 320 + math.cos(a) * 190
        cy = 330 + math.sin(a) * 180
        d.ellipse([cx - 58, cy - 58, cx + 58, cy + 58], fill=(196, 120, 48, 255))
    d.ellipse([150, 160, 490, 520], fill=(255, 204, 80, 255))
    d.ellipse([210, 250, 280, 320], fill=(255, 255, 255, 255))
    d.ellipse([360, 250, 430, 320], fill=(255, 255, 255, 255))
    d.ellipse([230, 274, 258, 302], fill=(50, 36, 28, 255))
    d.ellipse([380, 274, 408, 302], fill=(50, 36, 28, 255))
    d.arc([230, 340, 400, 450], 20, 160, fill=(120, 70, 40, 255), width=10)
    if wave:
        d.ellipse([430, 80, 580, 240], fill=(255, 196, 100, 255))
        d.ellipse([455, 110, 545, 200], fill=(255, 226, 180, 255))
    else:
        d.ellipse([80, 360, 200, 500], fill=(255, 196, 100, 255))
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
    except Exception:
        font = ImageFont.load_default()
    tag = "preview · leo-wave" if wave else "preview · leo-cheer"
    d.rounded_rectangle([150, 540, 490, 600], 18, fill=(255, 255, 255, 220))
    d.text((175, 552), tag, fill=(120, 80, 40, 255), font=font)
    return im


def logo():
    im = Image.new("RGBA", (900, 320), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 140)
    except Exception:
        font = ImageFont.load_default()
    d.text((80, 60), "Toba", fill=(90, 50, 24, 255), font=font)
    d.text((78, 56), "Toba", fill=(255, 248, 230, 255), font=font)
    return im


def banana():
    im = Image.new("RGBA", (640, 640), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([40, 40, 600, 600], 80, fill=(255, 244, 190, 255))
    d.pieslice([60, 40, 620, 620], 200, 340, fill=(255, 214, 60, 255))
    d.pieslice([150, 130, 540, 530], 200, 340, fill=(255, 244, 190, 255))
    d.ellipse([150, 360, 230, 440], fill=(110, 72, 36, 255))
    d.ellipse([430, 150, 510, 230], fill=(110, 72, 36, 255))
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
    except Exception:
        font = ImageFont.load_default()
    d.text((180, 520), "preview · banana", fill=(120, 80, 40, 255), font=font)
    return im


def placeholder(slot):
    table = motifs()
    if slot in table:
        fill, motif = table[slot]
        return sticker_disc(fill, slot, motif)
    if slot == "title-landscape":
        return scene(1280, 720, "title-landscape")
    if slot == "title-portrait":
        return scene(800, 1200, "title-portrait")
    if slot == "leo-wave":
        return leo(True)
    if slot == "leo-cheer":
        return leo(False)
    if slot == "logo-toba":
        return logo()
    if slot == "banana":
        return banana()
    raise KeyError(slot)


def ingest_one(slot, src):
    im = Image.open(src).convert("RGBA")
    return save_webp(im, slot)


# Kid-facing slots. A missing one stops the ingest. No watermarked stand-ins.
REQUIRED = [
    "hub-bubbles", "hub-balloons", "hub-feed", "hub-memory", "hub-puzzle",
    "hub-counting", "hub-patterns", "hub-sorter",
    "leo-wave", "leo-cheer", "logo-toba",
    "title-landscape", "title-portrait",
]
EXTRA = ["hub-dressup", "hub-camel", "leo-hello", "leo-talk"]
P1 = [
    "avatar-1", "avatar-2", "avatar-3", "avatar-4", "avatar-5", "avatar-6",
    "avatar-add", "lang-english", "lang-somali",
]
# Titles stay nearer to source size. Hub circles and characters cap at 512.
TITLE_SLOTS = {"title-landscape", "title-portrait"}


def main():
    roots = source_roots()
    status = {"sourceDirs": roots, "sourceDirExists": bool(roots), "slots": {}}
    missing = []
    if not roots:
        missing = REQUIRED + EXTRA
        status["missing"] = missing
        status["finalArt"] = False
        with open(os.path.join(OUT, "ART-STATUS.json"), "w", encoding="utf-8") as f:
            json.dump(status, f, indent=2)
        print(json.dumps({"finalArt": False, "missing": missing, "dir": False}))
        raise SystemExit(1)

    def take(slot, sub="", max_side=512):
        src = find_source(slot, sub)
        rel = (sub + "/" if sub else "") + slot
        if not src:
            missing.append(rel)
            status["slots"][rel] = {"state": "missing"}
            return None
        cap = None if slot in TITLE_SLOTS else max_side
        save_webp(Image.open(src), rel, cap)
        status["slots"][rel] = {"state": "ingested", "from": src, "file": "assets/art/" + rel + ".webp"}
        return src

    for slot in REQUIRED + EXTRA:
        take(slot)
    for slot in P1:
        take(slot, "p1")

    feed = find_source("hub-feed")
    banana_src = find_source("banana")
    if banana_src:
        save_webp(Image.open(banana_src), "banana", 512)
        status["slots"]["banana"] = {"state": "ingested", "from": banana_src, "file": "assets/art/banana.webp"}
    elif feed and "hub-feed" not in missing:
        save_webp(derive_banana(feed), "banana", 512)
        status["slots"]["banana"] = {
            "state": "derived",
            "from": feed,
            "file": "assets/art/banana.webp",
            "note": "Cropped from hub-feed. No banana plate was in the batch.",
        }
    else:
        missing.append("banana")

    # Required art must be real files. Do not write preview watermarks.
    required_missing = [name for name in missing if not name.startswith("p1/") and name not in ("banana",)]
    status["missing"] = missing
    status["finalArt"] = len(required_missing) == 0
    with open(os.path.join(OUT, "ART-STATUS.json"), "w", encoding="utf-8") as f:
        json.dump(status, f, indent=2)
    print(json.dumps({"finalArt": status["finalArt"], "missing": missing, "dirs": roots}))
    if required_missing:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
