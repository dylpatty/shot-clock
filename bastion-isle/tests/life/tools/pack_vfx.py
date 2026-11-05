# Packs the Babylon.js Assets VFX flipbooks (CC BY 4.0) into one channel-packed atlas for src/gfx/fx.js.
#   python3 -I tests/life/tools/pack_vfx.py /home/user/asset-src/candidates/vfx/babylonjs-assets assets/life/vfx_atlas.png [size]
# Layout (size x size RGBA, all channels are data -> NoColorSpace, decoded with premultiplyAlpha 'none'):
#   R = smoke shading (luminance of Smoke_SpriteSheet_8x8 RGB, 8x8 frames)
#   G = smoke density (alpha of Smoke_SpriteSheet_8x8, 8x8 frames)
#   B = flame density (alpha of Fire_SpriteSheet1_8x8, 8x8 frames)
#   A = blast density (alpha of FlameBlastSpriteSheet, 4x4 frames)
import sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
size = int(sys.argv[3]) if len(sys.argv) > 3 else 1024
smoke = Image.open(src + '/smoke/Smoke_SpriteSheet_8x8.png').convert('RGBA').resize((size, size), Image.LANCZOS)
fire = Image.open(src + '/fire/Fire_SpriteSheet1_8x8.png').convert('RGBA').resize((size, size), Image.LANCZOS)
blast = Image.open(src + '/explosion/FlameBlastSpriteSheet.png').convert('RGBA').resize((size, size), Image.LANCZOS)
sr, sg, sb, sa = smoke.split()
lum = Image.merge('RGB', (sr, sg, sb)).convert('L')
out_img = Image.merge('RGBA', (lum, sa, fire.split()[3], blast.split()[3]))
out_img.save(out, optimize=True)
print('wrote', out, out_img.size)
