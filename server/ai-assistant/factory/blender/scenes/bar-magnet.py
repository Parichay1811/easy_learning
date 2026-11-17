# A bar magnet and its magnetic field. Field lines leave the north pole,
# loop round and enter the south pole; they are closest together (field
# strongest) at the poles. Little compasses line up along the field.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
north = mat('#fb5a6e', rough=0.35, rim=0.3)
south = mat('#5b8cff', rough=0.35, rim=0.3)
white = mat('#f4f7ff', rough=0.4, emit=0.4)
field = mat('#fbbf24', rough=0.4, emit=1.6)
arrow = glowmat('#fbbf24', 2.5)
case = mat('#d9dde8', rough=0.3, metal=0.6)
face = mat('#1e2a52', rough=0.5)
floor(5.0, -0.5, opacity=0.5)
Lm, W = 3.0, 0.7
box((Lm / 2, W, W * 0.6), north, bevel=0.04, loc=(Lm / 4, 0, 0))
box((Lm / 2, W, W * 0.6), south, bevel=0.04, loc=(-Lm / 4, 0, 0))
text('N', 0.38, white, loc=(Lm / 4, 0, W * 0.3 + 0.001), rot=(0, 0, 0), extrude=0.01)
text('S', 0.38, white, loc=(-Lm / 4, 0, W * 0.3 + 0.001), rot=(0, 0, 0), extrude=0.01)
# field lines of a dipole: r = k sin^2(theta), drawn in several planes round the axis
lines = []
for k in (0.8, 1.1, 1.5, 2.0, 2.7, 3.6):
    for phi in (0, 180):
        pts = []
        for i in range(1, 80):
            th = math.radians(8 + 164 * i / 80)
            r = k * math.sin(th) ** 2 * 1.25
            x = r * math.cos(th) * 1.1
            rho = r * math.sin(th)
            p = Vector((x, rho * math.cos(math.radians(phi)), rho * math.sin(math.radians(phi)) * 0.55))
            if abs(p.x) < Lm / 2 + 0.05 and abs(p.y) < W / 2 + 0.05 and abs(p.z) < W * 0.3 + 0.05:
                continue
            pts.append(tuple(p))
        if len(pts) > 4:
            tube(pts, 0.014, field)
            lines.append((k, phi, pts))
            mid = len(pts) // 2
            a, b = Vector(pts[mid]), Vector(pts[mid + 1])   # pointing from N (+x) towards S (-x)
            c = cone(0.06, 0.16, arrow, verts=16, loc=a)
            c.rotation_euler = (b - a).to_track_quat('Z', 'Y').to_euler()
# compasses on the floor, needles along the field
def compass(p):
    x, y = p
    r2 = x * x + y * y
    m = Vector((1, 0, 0))
    rv = Vector((x, y, 0))
    B = (3 * rv * m.dot(rv) / max(1e-6, r2) - m) / max(0.3, r2 ** 1.5)
    ang = math.atan2(B.y, B.x)
    cyl(0.24, 0.06, case, verts=32, loc=(x, y, -0.45))
    cyl(0.21, 0.02, face, verts=32, loc=(x, y, -0.41))
    g = empty('Needle', loc=(x, y, -0.39), rot=(0, 0, ang))
    prism([(0, -0.045), (0.19, 0), (0, 0.045)], 0.02, north, parent=g)
    prism([(0, -0.045), (-0.19, 0), (0, 0.045)], 0.02, south, parent=g)
    return g


comps = [compass(p) for p in ((2.6, 0.0), (-2.6, 0.0), (0.0, -1.5), (1.7, -1.3), (-1.7, -1.3), (0.0, 1.6))]
cam = camera((0.3, -7.4, 6.0), (0.0, -0.1, -0.2), lens=40)
lights((0, 0, 0), rim='#fbbf24')
k, phi, pts = lines[5]
finish('bar-magnet', 'A bar magnet', ['magnet', 'magnetism', 'magnetic field', 'north pole', 'south pole', 'field lines', 'compass', 'physics', 'forces'], [
    P('North pole', (Lm / 2 - 0.2, -W / 2, 0.0), 'Field lines come out here'),
    P('South pole', (-Lm / 2 + 0.2, -W / 2, 0.0), 'Field lines go back in here'),
    P('Field lines', pts[len(pts) // 3], 'Show the shape and direction of the field'),
    P('Strong field', (Lm / 2 + 0.3, -0.2, 0.15), 'Lines bunch up at the poles: the pull is strongest'),
    P('Compass', comps[2], 'Its needle lines up with the field'),
])
