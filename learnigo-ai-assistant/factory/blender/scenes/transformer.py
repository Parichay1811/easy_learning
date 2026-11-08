# A single-phase core-type transformer. The core is a stack of thin, insulated
# steel sheets (laminations) that cut eddy-current losses. Alternating current
# in the primary coil sets up a changing magnetic flux in the core; the flux
# links the secondary coil and induces a voltage there. Here the secondary
# has fewer turns than the primary, so it is a step-down transformer.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
plate_a = mat('#9aa3b8', rough=0.5, metal=0.5, rim=0.1)
plate_b = mat('#5a627a', rough=0.5, metal=0.5, rim=0.05)
copper_p = mat('#e08a3c', rough=0.28, metal=0.9, rim=0.2)
copper_s = mat('#c8642a', rough=0.28, metal=0.9, rim=0.2)
base_m = mat('#2a3350', rough=0.6, rim=0.1)
insul = mat('#e9d9a8', rough=0.6)
term = mat('#d6dbe8', rough=0.25, metal=0.9)
flux = glowmat('#7cf0ff', 3.0)

W, H, a = 3.2, 3.6, 0.7          # core outside width and height, limb width
D, n = 0.8, 9                   # stack depth, number of sheets
z0 = 0.35                        # core bottom
t = D / n
for k in range(n):
    y = -D / 2 + t * (k + 0.5)
    m = plate_a if k % 2 == 0 else plate_b
    tk = t * 0.74
    box((W, tk, a), m, loc=(0, y, z0 + a / 2))                 # bottom yoke
    box((W, tk, a), m, loc=(0, y, z0 + H - a / 2))             # top yoke
    for s in (-1, 1):
        box((a, tk, H - 2 * a + 0.002), m, loc=(s * (W / 2 - a / 2), y, z0 + H / 2))   # limbs
box((W + 0.5, D + 0.6, 0.3), base_m, bevel=0.04, loc=(0, 0, 0.15))

xl, xr = -(W / 2 - a / 2), (W / 2 - a / 2)


def helix(xc, za, zb, turns, r, R):
    pts = []
    N = int(turns * 36)
    for i in range(N + 1):
        th = TAU * turns * i / N
        pts.append((xc + R * math.cos(th), R * math.sin(th), za + (zb - za) * i / N))
    return pts


# coil formers (insulating tubes) under the windings
for xc in (xl, xr):
    cyl(0.6, 2.05, insul, verts=48, loc=(xc, 0, z0 + H / 2), cap=True)
# primary: many turns of thin wire; secondary: fewer turns of thick wire
zA, zB = z0 + a + 0.12, z0 + H - a - 0.12
pp = helix(xl, zA, zB, 22, 0.035, 0.66)
tube(pp, 0.036, copper_p)
sp = helix(xr, zA + 0.04, zB - 0.04, 9, 0.075, 0.7)
tube(sp, 0.075, copper_s)
# leads to terminals on insulated posts
for xs, pts, m, rr in ((-1, pp, copper_p, 0.03), (1, sp, copper_s, 0.05)):
    for k, p in enumerate((pts[0], pts[-1])):
        tx = xs * (W / 2 + 0.55)
        ty = -0.25 + 0.5 * k
        tube([p, (p[0] + xs * 0.45, p[1] * 0.5 + ty * 0.5, p[2]), (tx, ty, 0.95)], rr, m, kind='BEZIER')
        cyl(0.09, 0.55, insul, verts=24, loc=(tx, ty, 0.58))
        cyl(0.06, 0.12, term, verts=24, loc=(tx, ty, 0.92))
for xs in (-1, 1):
    box((0.5, 1.1, 0.04), base_m, loc=(xs * (W / 2 + 0.55), 0, 0.31))
# the magnetic flux path round the core, drawn on its front face
yf = -D / 2 - 0.03
fz0, fz1 = z0 + a / 2, z0 + H - a / 2
r0 = 0.25
path = []
corners = [(xr, fz1), (xl, fz1), (xl, fz0), (xr, fz0)]
# a rounded rectangle traced clockwise as seen from the front
def rr_pts():
    pts = []
    cx = [(xr - r0, fz1 - r0, 0), (xl + r0, fz1 - r0, 90), (xl + r0, fz0 + r0, 180), (xr - r0, fz0 + r0, 270)]
    for x, z, a0 in cx:
        for i in range(9):
            ang = math.radians(a0 + 90 * i / 8)
            pts.append((x + r0 * math.cos(ang), yf, z + r0 * math.sin(ang)))
    return pts


fp = rr_pts()
tube(fp, 0.022, flux, closed=True)
# arrows along the path (anticlockwise as seen from the front)
for (x, z, rot) in ((0.0, fz1, (0, -math.pi / 2, 0)), (0.0, fz0, (0, math.pi / 2, 0)),
                    (xl, z0 + H / 2, (0, math.pi, 0)), (xr, z0 + H / 2, (0, 0, 0))):
    cone(0.075, 0.22, flux, verts=20, loc=(x, yf, z), rot=rot)
floor(6.0, 0.0)

cam = camera((-2.6, -9.6, 4.6), (0.0, 0, 1.95), lens=42)
lights((0, 0, 2.0), rim='#22d3ee')
finish('transformer', 'A transformer', ['transformer', 'step-down transformer', 'step-up transformer', 'laminated core', 'primary coil', 'secondary coil', 'mutual induction', 'electromagnetic induction', 'turns ratio', 'magnetic flux', 'eddy currents', 'ac power', 'electrical engineering'], [
    P('Laminated iron core', (0.6, -D / 2, z0 + H - 0.2), 'Thin insulated steel sheets carry the flux and cut eddy currents'),
    P('Primary coil', (xl - 0.2, -0.64, z0 + H / 2 + 0.3), 'Input AC here makes a changing magnetic flux'),
    P('Secondary coil', (xr + 0.25, -0.66, z0 + H / 2 - 0.3), 'Fewer turns, so the induced voltage is lower'),
    P('Magnetic flux', (0.0, yf, fz0), 'The flux runs round the core and links both coils'),
    P('Laminations', (-W / 2 + 0.25, -0.1, z0 + H), 'Each sheet is insulated from the next one'),
    P('AC input', (-(W / 2 + 0.55), -0.25, 0.98), 'Supply voltage V1 across N1 turns'),
    P('AC output', ((W / 2 + 0.55), 0.25, 0.98), 'V2 = V1 x N2 / N1'),
])
