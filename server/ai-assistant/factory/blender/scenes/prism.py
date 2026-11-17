# A glass prism splits white light into a spectrum. Light slows down and
# bends (refracts) as it enters and leaves the glass; each colour bends a
# different amount, violet the most and red the least, so they fan out.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
glass = mat('#cfe8ff', rough=0.05, alpha=0.28, rim=0.7)
screen = mat('#1b2240', rough=0.6, rim=0.1)
white = glowmat('#ffffff', 6)
inside = mat('#ffffff', alpha=0.5, emit=3)
SPEC = [('#ff3b3b', -17), ('#ff8c1a', -19), ('#ffe14d', -21), ('#3ddc6a', -23), ('#33b5ff', -25), ('#4f5bff', -27), ('#a64dff', -29)]
floor(5.5, -1.2, opacity=0.4)
A, B, C = Vector((-1.0, 0, -0.85)), Vector((1.0, 0, -0.85)), Vector((0.0, 0, 0.88))
pr = prism([(A.x, A.z), (B.x, B.z), (C.x, C.z)], 1.6, glass, rot=(math.pi / 2, 0, 0))
bevel(pr, 0.02, 2)
E = A.lerp(C, 0.45)
X = B.lerp(C, 0.45)
src = Vector((-4.2, 0, E.z - 0.95))
tube([tuple(src), tuple(E)], 0.05, white)
tube([tuple(E), tuple(X)], 0.04, inside)
SX = 4.0
box((0.1, 2.2, 2.6), screen, bevel=0.03, loc=(SX + 0.05, 0, -0.9))
ends = []
for c, deg in SPEC:
    d = Vector((math.cos(math.radians(deg)), 0, math.sin(math.radians(deg))))
    t = (SX - X.x) / d.x
    end = X + d * t
    tube([tuple(X), tuple(end)], 0.03, glowmat(c, 5))
    sphere(0.08, glowmat(c, 6), loc=end + Vector((-0.02, 0, 0)))
    ends.append(end)
# a torch on the left as the light source
lathe([(0.0, -0.3), (0.16, -0.3), (0.16, 0.25), (0.26, 0.45), (0.26, 0.55), (0.0, 0.55)], mat('#3a4470', rough=0.4, metal=0.5), seg=32,
      loc=src + Vector((-0.5, 0, -0.12)), rot=(0, math.atan2(E.x - src.x, E.z - src.z), 0))

cam = camera((0.35, -11.6, 1.2), (0.3, 0, -0.4), lens=46)
lights((0, 0, 0), power=0.6)
finish('prism', 'A prism splits light', ['prism', 'light', 'spectrum', 'rainbow', 'refraction', 'dispersion', 'colours', 'white light', 'optics', 'physics'], [
    P('White light', tuple(src.lerp(E, 0.45)), 'A mix of all the colours'),
    P('Prism', (0.0, -0.8, 0.3), 'A block of glass with flat, angled sides'),
    P('Refraction', tuple(E), 'Light bends as it slows down entering glass'),
    P('Red', tuple(ends[0]), 'Bends the least'),
    P('Violet', tuple(ends[-1]), 'Bends the most'),
    P('Spectrum', tuple(ends[3]), 'Red, orange, yellow, green, blue, indigo, violet'),
])
