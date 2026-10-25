from pathlib import Path
from io import BytesIO
from PIL import Image, ImageOps, ImageFilter
import urllib.request

# Crops reproduce the artwork selected for the original invitation.
# The source image was supplied by the host and stored in an image CDN.
SOURCE = "https://d2ol7oe51mr4n9.cloudfront.net/user_3J38HEBAGYQ4cmA8faRDj18RI2a/50ef4d29-2e87-46a3-acb1-61b8166a3772.png"

destination = Path("dist/assets")
destination.mkdir(parents=True, exist_ok=True)
# First successful deployment saves the approved artwork in this repository.
# Later builds use those self-hosted assets and no longer need the source CDN.
saved = Path("assets")
if (saved / "house-illustration.webp").is_file():
    import shutil
    for asset in saved.iterdir():
        if asset.is_file():
            shutil.copy2(asset, destination / asset.name)
    print("Reused", len(list(destination.iterdir())), "self-hosted artworks.")
    raise SystemExit(0)
request = urllib.request.Request(SOURCE, headers={"User-Agent":"Housewarming-RSVP-GitHub-Pages/1.0"})
with urllib.request.urlopen(request, timeout=45) as response:
    original = Image.open(BytesIO(response.read())).convert("RGB")
if original.size != (1122, 1402):
    raise ValueError("Invitation artwork dimensions changed; refusing inaccurate crops.")

ART = {
    "house-illustration.webp": ((111,412,1007,785), (1400,583)),
    "folk-arch.webp": ((82,3,1042,228), (1500,352)),
    "bird-left.webp": ((82,75,289,256), None),
    "bird-right.webp": ((839,78,1038,266), None),
    "flower-footer.webp": ((145,1168,984,1315), None),
    "side-border-left.webp": ((4,367,90,1116), None),
    "side-border-right.webp": ((1032,367,1118,1116), None),
}

for filename, (crop, size) in ART.items():
    image = original.crop(crop)
    if size is not None:
        image = image.resize(size, Image.Resampling.LANCZOS)
    image.save(destination / filename, "WEBP", quality=88, method=6)

grain = original.crop((340,390,700,750)).filter(ImageFilter.GaussianBlur(12))
grain.save(destination / "paper-grain.webp", "WEBP", quality=72, method=6)

sun = original.crop((457,72,662,270))
icon = ImageOps.pad(sun, (256,256), Image.Resampling.LANCZOS, color="#f7eed7")
icon.save(destination / "favicon.png", optimize=True)

# Social sharing card: genuine house image with readable captions baked on top.
from PIL import ImageDraw, ImageFont
poster = Image.new("RGB", (1200, 630), "#f7eed7")
design = original.crop((111,412,1007,785)).resize((960,401),Image.Resampling.LANCZOS)
poster.paste(design, (120,30))
draw = ImageDraw.Draw(poster)
draw.rectangle((16,16,1184,614), outline="#98282d", width=7)
font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
font = ImageFont.truetype(font_path, 45)
small = ImageFont.truetype(font_path, 24)
heading = "A NEW CHAPTER BEGINS"
bbox = draw.textbbox((0,0), heading, font=font)
draw.text(((1200-(bbox[2]-bbox[0]))/2,447), heading, font=font, fill="#98282d")
caption = "Housewarming  |  Saturday, November 7  |  6 PM"
bbox = draw.textbbox((0,0), caption, font=small)
draw.text(((1200-(bbox[2]-bbox[0]))/2,522), caption, font=small, fill="#243b53")
poster.save(destination/"social-preview.jpg", quality=89, optimize=True)
print("Generated", len(list(destination.iterdir())), "artwork assets.")
