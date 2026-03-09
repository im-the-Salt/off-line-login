from PIL import Image, ImageDraw, ImageFont
from escpos.printer import Usb
import sys
from datetime import datetime
import textwrap

account = sys.argv[1].replace(" User", "").strip()
ip = sys.argv[2]
now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

# ✅ 建立內容文字
content = f"""\
+--------------------+
|   ！帳戶安全警示！   
|--------------------|
|  帳號名稱：{account}
|
|  IP 位址：{ip}
|  工作階段：登入失敗
|  時間：{now}
| 
+--------------------+ 
| 謹記:
| 若您在虛擬世界遇到困難，
| 請尋求紙張的協助，
| 紙會「復原」一切。
| 
He2Re80am429i
"""

# ✅ 字體與寬度設定
font_path = r"C:\Users\e5896\Desktop\box\font\TaipeiSansTCBeta-Bold.ttf"
font = ImageFont.truetype(font_path, 28)
padding = 12
max_width_px = 384
max_chars_per_line = 22  # 可依實際字體大小微調

# ✅ 自動換行處理
wrapped_lines = []
for line in content.split("\n"):
    wrapped_lines.extend(textwrap.wrap(line, width=max_chars_per_line) or [""])

line_height = font.getbbox("測試")[3] + 10
img_height = line_height * len(wrapped_lines) + padding * 2
img = Image.new("L", (max_width_px, img_height), color=255)
draw = ImageDraw.Draw(img)

# ✅ 逐行寫入
y = padding
for line in wrapped_lines:
    draw.text((padding, y), line, font=font, fill=0)
    y += line_height

# ✅ 傳送至印表機
try:
    p = Usb(0x04b8, 0x0202)
    p.image(img)
    p.cut()
    print("✅ 成功列印圖片文字")
except Exception as e:
    print("❌ 列印圖片失敗：", e)
