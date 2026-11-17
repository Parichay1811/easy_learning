# A convex (converging) lens making an image. Rays from the tip of an
# object beyond twice the focal length cross after the lens to form a real
# image that is upside down and smaller. Drawn to scale: f = 1.4,
# object 3.4 away, so the image forms 2.38 away, 0.7 times as tall.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
glass = mat('#bfe3ff', rough=0.05, alpha=0.35, rim=0.8)
axis = mat('#8b95b5', rough=0.5, emit=0.6)
rays = [glowmat(c, 3) for c in ('#fbbf24', '#22d3ee', '#fb7185')]
objm = mat('#34d399', rough=0.35, rim=0.3, emit=0.4)
imgm = mat('#ff9f43', rough=0.35, alpha=0.65, emit=0.8)
fpt = glowmat('#e9eeff', 3)
f, u, h = 1.4, -3.4, 1.0
v = 1 / (1 / f + 1 / u)
m = v / u
Rl = 1.6
th = lambda r: 0.24 * (1 - (r / Rl) ** 2) + 0.015
prof = [(Rl * i / 16, -th(Rl * i / 16)) for i in range(17)] + [(Rl * i / 16, th(Rl * i / 16)) for i in range(16, -1, -1)]
lens = lathe(prof, glass, seg=64, rot=(0, math.pi / 2, 0))
tube([(-4.6, 0, 0), (4.0, 0, 0)], 0.012, axis)
for x in (-f, f, -2 * f, 2 * f):
    sphere(0.06 if abs(x) == f else 0.04, fpt, loc=(x, 0, 0))


def arrow3(x, hh, mm):
    s = 1 if hh > 0 else -1
    tube([(x, 0, 0), (x, 0, hh - s * 0.2)], 0.05, mm)
    c = cone(0.14, 0.28, mm, verts=24, loc=(x, 0, hh - s * 0.12))
    if s < 0:
        c.rotation_euler = (math.pi, 0, 0)


arrow3(u, h, objm)
arrow3(v, m * h, imgm)
T = Vector((u, 0, h)); I = Vector((v, 0, m * h))
tube([tuple(T), (0, 0, h), tuple(I), tuple(I + (I - Vector((0, 0, h))).normalized() * 0.9)], 0.02, rays[0])
tube([tuple(T), (0, 0, 0), tuple(I), tuple(I + (I - T).normalized() * 0.9)], 0.02, rays[1])
z0 = h + (0 - u) * (0 - h) / (-f - u)
tube([tuple(T), (0, 0, z0), tuple(I), (I.x + 0.9, 0, m * h)], 0.02, rays[2])

cam = camera((-0.2, -8.6, 0.9), (-0.3, 0, 0.05), lens=46)
lights((0, 0, 0), power=0.6)
finish('lens', 'A convex lens', ['lens', 'convex lens', 'converging lens', 'focal point', 'image', 'refraction', 'ray diagram', 'light', 'optics', 'physics'], [
    P('Convex lens', (0.0, -0.1, 1.05), 'Thicker in the middle: it bends light inwards'),
    P('Object', (u, 0, h * 0.55), 'The thing we are looking at'),
    P('Focal point', (f, 0, 0), 'Parallel rays meet here after the lens'),
    P('Principal axis', (-2.45, 0, 0), 'The line through the centre of the lens'),
    P('Light rays', (-1.7, 0, h), 'Straight lines showing where the light goes'),
    P('Image', (v, 0, m * h * 0.55), 'Real, upside down and smaller'),
])
