import os
import glob
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
from escpos.printer import Usb
import sys

# ✅ 從參數接收帳號與成就比例
account = sys.argv[1]
percent = sys.argv[2]

# ✅ 建立前段說明文字
text = f"{account}，帳戶救援成功。\n{percent}% 的使用者擁有此成就。"
font_path = r"C:\Users\e5896\Desktop\box\font\TaipeiSansTCBeta-Regular.ttf"
font = ImageFont.truetype(font_path, 24)
padding = 20
lines = text.split("\n")
line_height = font.getbbox("測試")[3] + 10
img_height = line_height * len(lines) + padding * 2
text_img = Image.new("L", (384, img_height), color=255)
draw = ImageDraw.Draw(text_img)

y = padding
for line in lines:
    draw.text((padding, y), line, font=font, fill=0)
    y += line_height

# ✅ 找最新圖片
photos = sorted(
    [f for f in glob.glob("*.jpg") + glob.glob("*.png") if not f.startswith("preview_")],
    key=os.path.getmtime
)
if not photos:
    raise FileNotFoundError("找不到任何圖片")
latest = photos[-1]
img = Image.open(latest)

if img.mode == "RGBA":
    white_bg = Image.new("RGB", img.size, (255, 255, 255))
    white_bg.paste(img, mask=img.split()[3])
    img = white_bg

img = img.convert("L")
img = ImageEnhance.Contrast(img).enhance(1.5)
max_width = 512
if img.width != max_width:
    ratio = max_width / img.width
    new_height = int(img.height * ratio)
    img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

# ✅ 送到印表機
p = Usb(0x04b8, 0x0202)
p.image(text_img)
p.image(img)
p.cut()
