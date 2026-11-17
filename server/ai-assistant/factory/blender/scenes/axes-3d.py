# Three-dimensional coordinates: x, y and z axes at right angles from the
# origin, and the point (3, 2, 4) found by going 3 along x, 2 along y and
# up 4, with dashed guide lines back to the axes and the floor (xy) plane.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
X = glowmat('#fb7185', 2.5)
Y = glowmat('#34d399', 2.5)
Z = glowmat('#5b8cff', 2.5)
grid = mat('#5b8cff', rough=0.5, emit=0.4, alpha=0.35)
plane = mat('#5b8cff', rough=0.5, alpha=0.08, emit=0.2)
ptm = mat('#fbbf24', rough=0.3, emit=2.5)
dash = mat('#fbbf24', rough=0.4, emit=1.2)
s = 0.55   # one unit
L = 5.6 * s
for m, d, name in ((X, Vector((1, 0, 0)), 'x'), (Y, Vector((0, 1, 0)), 'y'), (Z, Vector((0, 0, 1)), 'z')):
    tube([(0, 0, 0), tuple(d * L)], 0.035, m)
    c = cone(0.1, 0.28, m, verts=24, loc=d * (L + 0.1))
    c.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    for k in range(1, 6):
        q = d * k * s
        sphere(0.045, m, loc=q, seg=16, rings=8)
    text(name, 0.42, m, loc=d * (L + 0.5) + Vector((0, 0, 0.0)), rot=(math.pi / 2, 0, math.radians(20)), extrude=0.02)
for k in range(6):   # floor grid in the xy plane
    tube([(k * s, 0, 0), (k * s, 5 * s, 0)], 0.008, grid)
    tube([(0, k * s, 0), (5 * s, k * s, 0)], 0.008, grid)
box((5 * s, 5 * s, 0.01), plane, loc=(2.5 * s, 2.5 * s, -0.01))
P_ = Vector((3, 2, 4)) * s
pt = sphere(0.13, ptm, loc=P_)
F = Vector((3 * s, 2 * s, 0))


def dashed(a, b, n=14):
    a, b = Vector(a), Vector(b)
    for i in range(n):
        if i % 2 == 0:
            tube([tuple(a.lerp(b, i / n)), tuple(a.lerp(b, (i + 1) / n))], 0.018, dash)


dashed(P_, F)
dashed(F, (3 * s, 0, 0), 8)
dashed(F, (0, 2 * s, 0), 10)
sphere(0.06, dash, loc=F)
sphere(0.08, mat('#e9eeff', emit=2), loc=(0, 0, 0))

cam = camera((5.6, -4.2, 3.2), (1.15, 1.1, 1.05), lens=40)
lights((1.2, 1.2, 1.0))
finish('axes-3d', '3D coordinates', ['coordinates', '3d axes', 'x axis', 'y axis', 'z axis', 'origin', 'point', 'graphs', 'geometry', 'maths'], [
    P('Origin', (0, 0, 0), '(0, 0, 0): where the three axes meet'),
    P('x-axis', (L * 0.85, 0, 0), 'Left to right'),
    P('y-axis', (0, L * 0.85, 0), 'Front to back'),
    P('z-axis', (0, 0, L * 0.85), 'Up and down'),
    P('Point (3, 2, 4)', pt, '3 along x, 2 along y, then up 4'),
    P('xy-plane', (4.3 * s, 4.3 * s, 0), 'The flat floor where z = 0'),
])
