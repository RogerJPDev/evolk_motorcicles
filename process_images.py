from PIL import Image
import os

SRC = "/mnt/user-data/uploads"
OUT = "/home/claude/evolk/assets/img"
os.makedirs(OUT, exist_ok=True)

# mapping: output_name -> (source_file, max_width)
mapping = {
    "logo-full":            ("ChatGPT_Image_3_jun_2026__16_31_38.png", 900),
    "logo-mark":            ("ChatGPT_Image_3_jun_2026__16_55_14.png", 400),
    "hero-rider-female-1":  ("ChatGPT_Image_4_jun_2026__17_07_54.png", 1800),
    "hero-rider-female-2":  ("ChatGPT_Image_4_jun_2026__17_27_15.png", 1800),
    "charging-lifestyle-1": ("ChatGPT_Image_14_may_2026__11_33_27.png", 1800),
    "charging-lifestyle-2": ("ChatGPT_Image_22_abr_2026__12_58_11.png", 1800),
    "studio-white":         ("ChatGPT_Image_17_abr_2026__11_27_42.png", 1400),
    "studio-black":         ("ChatGPT_Image_17_abr_2026__12_22_33.png", 1400),
    "studio-red":           ("ChatGPT_Image_17_abr_2026__12_24_18.png", 1400),
    "city-parked-1":        ("ChatGPT_Image_17_jun_2026__10_32_40.png", 1800),
    "city-parked-2":        ("ChatGPT_Image_17_jun_2026__10_33_49.png", 1800),
    "dashboard-detail":     ("ChatGPT_Image_17_jun_2026__11_45_23__1_.png", 1600),
    "seat-badge-detail":    ("ChatGPT_Image_17_jun_2026__12_01_30.png", 1600),
    "connector-detail":     ("ChatGPT_Image_17_jun_2026__12_59_47_copy.png", 1600),
    "garage-charging":      ("ChatGPT_Image_17_jun_2026__13_10_48.png", 1800),
    "engineering-team":     ("ChatGPT_Image_17_jun_2026__13_18_46.png", 1800),
    "lineup-three":         ("ChatGPT_Image_17_jun_2026__13_23_05.png", 1800),
    "hub-motor-detail":     ("roda_posterior.png", 1400),
}

for out_name, (src_file, max_w) in mapping.items():
    path = os.path.join(SRC, src_file)
    im = Image.open(path).convert("RGB")
    if im.width > max_w:
        ratio = max_w / im.width
        im = im.resize((max_w, int(im.height * ratio)), Image.LANCZOS)
    im.save(os.path.join(OUT, out_name + ".webp"), "WEBP", quality=78, method=6)
    im.save(os.path.join(OUT, out_name + ".jpg"), "JPEG", quality=80, optimize=True)
    print(out_name, im.size, os.path.getsize(os.path.join(OUT, out_name+'.webp'))//1024, "KB")

print("DONE")

# ---- additional high-quality replacement images ----
extra_mapping = {
    "connector-open":      ("connector.png", 1600),
    "rider-connector":     ("dona_type_2.png", 1400),
    "garage-charging-2":   ("garatge.png", 1400),
    "public-charging-bcn": ("noia_carregant.png", 1800),
    "rear-three-quarter":  ("posterior.png", 1400),
    "hub-motor-brake":     ("roda_posterior.png", 1400),
}
for out_name, (src_file, max_w) in extra_mapping.items():
    path = os.path.join(SRC, src_file)
    im = Image.open(path).convert("RGB")
    if im.width > max_w:
        ratio = max_w / im.width
        im = im.resize((max_w, int(im.height * ratio)), Image.LANCZOS)
    im.save(os.path.join(OUT, out_name + ".webp"), "WEBP", quality=80, method=6)
    im.save(os.path.join(OUT, out_name + ".jpg"), "JPEG", quality=82, optimize=True)
    print(out_name, im.size, os.path.getsize(os.path.join(OUT, out_name+'.webp'))//1024, "KB")
print("EXTRA DONE")
