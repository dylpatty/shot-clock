# Offline texture preparation for the ground module (src/gfx/terrain.js, roads.js).
# Run:  python3 -I tests/ground/tools/prep_textures.py /home/user/asset-src/final assets/ground
# Sources: the asset curator's final, licence-checked picks (see assets/credits/ground.md).
#
# Palette rule (UX review): colour comes only from palette tokens; textures supply luminance detail only.
# Every output is a 512x512 single-channel JPEG holding a *detail ratio* (local luminance / mean, in linear
# light) stored as value = ratio * 0.5, so the shader multiplies palette albedo by 2*value (mean 1.0).
# Very low frequencies are removed (division by a wide wrap-around blur) so the tiles do not repeat visibly.
# All outputs tile seamlessly (wrap-padded resampling; FFT noise for the procedural layers).
import sys, os
import numpy as np
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
N = 512
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(1234)


def srgb_to_lin(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def load_lum(path):
    im = np.asarray(Image.open(path).convert('RGB')).astype(np.float64)
    lin = srgb_to_lin(im)
    return 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]


def resize_wrap(a, n):
    # tile 3x3, resample, keep the middle: keeps the result seamless for non-integer factors
    h, w = a.shape
    big = np.tile(a, (3, 3)).astype(np.float32)
    im = Image.fromarray(big, mode='F').resize((3 * n, 3 * n), Image.LANCZOS)
    r = np.asarray(im, dtype=np.float64)
    return r[n:2 * n, n:2 * n]


def blur_wrap(a, sigma):
    # gaussian blur with wrap-around via FFT
    n = a.shape[0]
    f = np.fft.fftfreq(n)
    fx, fy = np.meshgrid(f, f)
    g = np.exp(-2 * (np.pi ** 2) * (sigma ** 2) * (fx ** 2 + fy ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * g))


def detail(lum, sigma=48, lo=0.45, hi=1.6, gamma=1.0):
    base = blur_wrap(lum, sigma)
    r = lum / np.maximum(base, 1e-4)
    r = np.clip(r, lo, hi)
    r = r ** gamma
    return r / r.mean()


def fft_noise(n, beta, lowcut=1.0, seed=0):
    g = np.random.default_rng(seed)
    white = g.standard_normal((n, n))
    f = np.fft.fftfreq(n) * n
    fx, fy = np.meshgrid(f, f)
    k = np.sqrt(fx ** 2 + fy ** 2)
    k[0, 0] = 1
    filt = 1.0 / np.maximum(k, lowcut) ** beta
    filt[0, 0] = 0
    v = np.real(np.fft.ifft2(np.fft.fft2(white) * filt))
    v = (v - v.mean()) / v.std()
    return v


def save(name, ratio):
    v = np.clip(ratio * 0.5 * 255.0 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(v, mode='L').save(os.path.join(OUT, name), quality=86, optimize=True)
    print(name, 'mean %.3f std %.3f' % (ratio.mean(), ratio.std()))


T = os.path.join(SRC, 'terrain_tex')
R = os.path.join(SRC, 'road_tex')
WT = os.path.join(SRC, 'water')

# --- photo-derived detail layers (uDetail: R grass, G sand, B rock, A dirt)
grass = detail(resize_wrap(load_lum(os.path.join(T, 'grass_Grass001_color.jpg')), N), lo=0.55, hi=1.45)
sand = detail(resize_wrap(load_lum(os.path.join(T, 'sand_Ground080_color.jpg')), N), lo=0.6, hi=1.4)
rock = detail(resize_wrap(load_lum(os.path.join(T, 'rock_mossy_rock_color.jpg')), N), lo=0.45, hi=1.6)
dirt = detail(resize_wrap(load_lum(os.path.join(T, 'dirt_forrest_ground_03_color.jpg')), N), sigma=24, lo=0.55, hi=1.45)
save('grass_d.jpg', grass)
save('sand_d.jpg', sand)
save('rock_d.jpg', rock)
save('dirt_d.jpg', dirt)

# --- uDetail2: R asphalt (ambientCG Asphalt012), G concrete paving (Concrete034), B cliff (Rock Face 03), A macro
asph = detail(resize_wrap(load_lum(os.path.join(R, 'asphalt_Asphalt012_color.jpg')), N), sigma=40, lo=0.7, hi=1.35)
save('asphalt_d.jpg', asph)
conc = detail(resize_wrap(load_lum(os.path.join(R, 'concrete_Concrete034_color.jpg')), N), sigma=48, lo=0.7, hi=1.3)
save('paving_d.jpg', conc)
cliff = detail(resize_wrap(load_lum(os.path.join(T, 'cliff_rock_face_03_color.jpg')), N), sigma=64, lo=0.4, hi=1.7)
save('cliff_d.jpg', cliff)

# --- uDetail3: R sidewalk slabs (Tiles036), G gravel (rocky_trail), B caustics (water), A second macro noise
tiles = detail(resize_wrap(load_lum(os.path.join(R, 'sidewalk_Tiles036_color.jpg')), N), sigma=64, lo=0.6, hi=1.3)
save('sidewalk_d.jpg', tiles)
gravel = detail(resize_wrap(load_lum(os.path.join(T, 'gravel_rocky_trail_color.jpg')), N), lo=0.5, hi=1.6)
save('gravel_d.jpg', gravel)
ca = resize_wrap(np.asarray(Image.open(os.path.join(WT, 'caustics.jpg')).convert('L')).astype(np.float64) / 255.0, N)
Image.fromarray(np.clip(ca * 255 + 0.5, 0, 255).astype(np.uint8), mode='L').save(os.path.join(OUT, 'caustics.jpg'), quality=85, optimize=True)
print('caustics.jpg')
y, x = np.mgrid[0:N, 0:N].astype(np.float64)
grain = rock / rock.mean()

# --- macro variation noise (uDetail2.A): smooth fbm used at 1/23 and 1/7 scale, for warping the splat
# and for cloud shadows. Stored as plain 0..1 (not a ratio): value = 0.5 + 0.18 * n.
macro = fft_noise(N, 2.4, lowcut=2, seed=21)
mv = np.clip(0.5 + 0.2 * macro, 0, 1)
Image.fromarray((mv * 255 + 0.5).astype(np.uint8), mode='L').save(os.path.join(OUT, 'macro.jpg'), quality=90, optimize=True)
print('macro.jpg mean %.3f std %.3f' % (mv.mean(), mv.std()))
macro2 = fft_noise(N, 2.0, lowcut=3, seed=41)
mv2 = np.clip(0.5 + 0.2 * macro2, 0, 1)
Image.fromarray((mv2 * 255 + 0.5).astype(np.uint8), mode='L').save(os.path.join(OUT, 'macro2.jpg'), quality=90, optimize=True)
print('macro2.jpg')
