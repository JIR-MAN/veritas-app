"""Creates metadata test fixtures with known ground truth (python3 scripts/make-metadata-fixtures.py)."""
from pathlib import Path
from PIL import Image, PngImagePlugin

root = Path(__file__).resolve().parent.parent / "fixtures" / "generated"
src = Image.open(root / "no-credentials.jpg").convert("RGB")

# 1. PNG with Stable Diffusion (AUTOMATIC1111-style) generation settings.
info = PngImagePlugin.PngInfo()
info.add_text("parameters", "a red bicycle in the rain\nSteps: 20, Sampler: Euler a, CFG scale: 7, Seed: 1234, Model: sd_xl_base_1.0")
src.save(root / "ai-metadata-sd.png", pnginfo=info)

# 2. JPEG with an XMP packet declaring AI generation (IPTC DigitalSourceType) and a creator tool.
xmp = (
    '<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>'
    '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
    '<rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:xmp="http://ns.adobe.com/xap/1.0/" '
    'Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia" xmp:CreatorTool="Adobe Firefly"/>'
    '</rdf:RDF></x:xmpmeta><?xpacket end="w"?>'
).encode("utf-8")
src.save(root / "ai-metadata-xmp.jpg", quality=90, xmp=xmp)

# 3. JPEG with ordinary camera EXIF including a location (no AI labels).
exif = Image.Exif()
exif[0x010F] = "Canon"            # Make
exif[0x0110] = "Canon EOS R6"     # Model
exif[0x0131] = "Firmware 1.8.1"   # Software
gps = {1: "N", 2: (5.0, 33.0, 0.0), 3: "W", 4: (0.0, 13.0, 0.0)}
exif[0x8825] = gps
src.save(root / "camera-exif.jpg", quality=90, exif=exif)
print("written to", root)
