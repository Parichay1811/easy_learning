# An end-suction centrifugal pump with the front half of its casing cut away.
# Water enters along the shaft at the impeller's eye. The spinning vanes fling
# it outwards, giving it speed; the volute, a spiral channel that widens
# towards the outlet, slows it down again and turns that speed into pressure.
# The cutwater (tongue) splits the flow where the volute starts.
# In the loop the impeller turns and the water moves round to the outlet.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
casem = mat('#2f63d6', rough=0.45, metal=0.15, rim=0.15)
casecut = mat('#a9c0f2', rough=0.6, metal=0.1)   # the sawn face of the cut
impm = mat('#e3b34a', rough=0.3, metal=0.85, rim=0.2)
steel = mat('#cfd5e2', rough=0.2, metal=0.95)
basem = mat('#2a3350', rough=0.6, rim=0.1)
waterg = glowmat('#7cc8ff', 1.6)
arrowm = glowmat('#9fd8ff', 2.5)

PHS = math.radians(14)                  # where the volute starts (the cutwater)


def rc(ph):                             # the channel radius grows round the spiral
    return 0.08 + 0.32 * (ph - PHS) / (TAU - PHS)


def spiral(off=0.0, n=60, wall=0.0):
    pts, rad = [], []
    for i in range(n + 1):
        ph = PHS + (TAU - PHS) * i / n
        r = rc(ph)
        R = 1.04 + r
        pts.append((R * math.cos(ph), 0.0, R * math.sin(ph)))
        rad.append(r + wall)
    return pts, rad


R_end = 1.04 + rc(TAU)
r_end = rc(TAU)
zt = 2.35                              # top of the discharge nozzle
# outer shells
sp, sr = spiral(wall=0.11)
outer = as_mesh(tube(sp, 1.0, casem, kind='POLY', res=16, radii=sr))
dout = cyl(r_end + 0.11, zt, casem, verts=48, loc=(R_end, 0, zt / 2))
flange = cyl(r_end + 0.26, 0.12, casem, verts=48, loc=(R_end, 0, zt - 0.06))
disc = cyl(1.2, 0.72, casem, verts=96, loc=(0, 0.08, 0), rot=(math.pi / 2, 0, 0))
backp = cyl(0.42, 0.9, casem, verts=48, loc=(0, 0.8, 0), rot=(math.pi / 2, 0, 0))


def hollow():
    """The inner spaces: the spiral channel, the impeller chamber and the
    discharge bore (fresh cutters each time; cut() removes them)."""
    a, b = spiral()
    a = [(a[0][0], 0, a[0][2] - 0.02)] + a
    b = [b[0]] + b
    return [tube(a, 1.0, casecut, kind='POLY', res=16, radii=b),
            cyl(1.07, 0.5, casecut, verts=96, loc=(0, -0.05, 0), rot=(math.pi / 2, 0, 0)),
            cyl(r_end, zt + 0.4, casecut, verts=48, loc=(R_end, 0, zt / 2 + 0.05))]


for ob in (outer, dout, flange, disc):
    for c in hollow():
        cut(ob, c)
cut(backp, cyl(0.2, 1.2, casecut, verts=32, loc=(0, 0.8, 0), rot=(math.pi / 2, 0, 0)))
for ob in (outer, dout, flange, disc, backp):
    cut(ob, box((5, 3, 6), casecut, loc=(0, -1.5, 0.6)))
    # only the flat face of the cut is the light 'sawn' colour; the channel
    # walls inside stay the casing's blue
    for poly in ob.data.polygons:
        if poly.material_index == 1 and not (poly.normal.y < -0.9 and abs(poly.center.y) < 0.02):
            poly.material_index = 0
# pedestal, bearing frame and shaft
box((0.7, 1.2, 0.9), casem, bevel=0.04, loc=(0, 0.6, -1.55))
box((3.6, 3.4, 0.16), basem, bevel=0.03, loc=(0.3, 1.0, -2.08))
cyl(0.36, 1.4, casem, verts=48, loc=(0, 1.95, -0.0), rot=(math.pi / 2, 0, 0))
box((0.5, 1.2, 1.7), casem, bevel=0.04, loc=(0, 1.95, -1.15))
# impeller: back shroud, hub and backward-curved vanes (turns about y)
imp = empty('Impeller')
cyl(1.0, 0.06, impm, verts=96, loc=(0, 0.13, 0), rot=(math.pi / 2, 0, 0), parent=imp)
cyl(0.22, 0.42, impm, verts=48, loc=(0, -0.0, 0), rot=(math.pi / 2, 0, 0), parent=imp)
cone(0.16, 0.18, impm, verts=32, loc=(0, -0.3, 0), rot=(math.pi / 2, 0, 0), parent=imp)
for k in range(6):
    a0 = TAU * k / 6
    cl = [(r, a0 - 1.35 * (r - 0.25)) for r in [0.25 + 0.75 * i / 16 for i in range(17)]]
    th = lambda r: 0.022 + 0.025 * math.sin(math.pi * (r - 0.25) / 0.75)
    left = [((r) * math.cos(a) + th(r) * -math.sin(a), (r) * math.sin(a) + th(r) * math.cos(a)) for r, a in cl]
    right = [((r) * math.cos(a) - th(r) * -math.sin(a), (r) * math.sin(a) - th(r) * math.cos(a)) for r, a in cl]
    prism(left + right[::-1], 0.26, impm, loc=(0, 0.0, 0), rot=(math.pi / 2, 0, 0), parent=imp)
cyl(0.1, 3.6, steel, verts=32, loc=(0, 1.6, 0), rot=(math.pi / 2, 0, 0), parent=imp)
# water: dots along the inlet, round the volute and up the outlet
vp, _ = spiral(n=80)
path = [Vector((0.0, -2.4 + 1.9 * i / 8, 0.0)) for i in range(9)]
vol = [Vector(p) for p in vp] + [Vector((R_end, 0, 0.3 + (zt + 0.5) * i / 10)) for i in range(1, 11)]
lens_ = lambda P: [0.0] + [sum((P[i + 1] - P[i]).length for i in range(j + 1)) for j in range(len(P) - 1)]
def walk(P, L, d):
    for i in range(len(P) - 1):
        if d <= L[i + 1]:
            k = (d - L[i]) / max(1e-6, L[i + 1] - L[i])
            return P[i].lerp(P[i + 1], k)
    return P[-1]
Lin, Lvol = lens_(path), lens_(vol)
drops_in = [sphere(0.04, waterg, seg=12, rings=8) for _ in range(5)]
drops_v = [sphere(0.035, waterg, seg=12, rings=8) for k in range(22)]
no_shadow(*drops_in, *drops_v)
tube([(0, -2.6, 0), (0, -2.05, 0)], 0.03, arrowm)
cone(0.1, 0.24, arrowm, verts=20, loc=(0, -1.95, 0), rot=(-math.pi / 2, 0, 0))
tube([(R_end, 0, zt + 0.25), (R_end, 0, zt + 0.7)], 0.03, arrowm)
cone(0.1, 0.24, arrowm, verts=20, loc=(R_end, 0, zt + 0.8))
floor(6.5, -2.17)

cam = camera((2.6, -7.8, 2.4), (0.45, 0, 0.15), lens=42)
lights((0, 0, 0.2), power=0.8, rim='#5b8cff')


def run(t):
    imp.rotation_euler = (0, -TAU * t, 0)
    for k, d in enumerate(drops_in):
        d.location = walk(path, Lin, Lin[-1] * ((k + t) / len(drops_in)))
    for k, d in enumerate(drops_v):
        d.location = walk(vol, Lvol, Lvol[-1] * ((k + t) / len(drops_v)))
    for k, d in enumerate(drops_v):
        s = 1.0 + 0.8 * ((k + t) / len(drops_v))
        d.scale = (s, s, s)


run(0)
ph_mid = math.radians(150)
finish('centrifugal-pump', 'A centrifugal pump', ['centrifugal pump', 'pump', 'impeller', 'volute', 'volute casing', 'fluid mechanics', 'hydraulics', 'turbomachinery', 'pump head', 'water pump', 'mechanical engineering'], [
    P('Impeller', (0.0, -0.13, 0.62), 'Spins and flings the water outwards, adding energy'),
    P('Vanes', (0.62 * math.cos(math.radians(-60)), -0.13, 0.62 * math.sin(math.radians(-60))), 'Curved backwards, against the direction of turning'),
    P('Eye (inlet)', (0.0, -0.55, 0.0), 'Water enters along the shaft at the centre'),
    P('Volute casing', ((1.04 + rc(ph_mid)) * math.cos(ph_mid) - 0.0, 0.0, (1.04 + rc(ph_mid)) * math.sin(ph_mid) + rc(ph_mid) + 0.08), 'A widening spiral that turns speed into pressure'),
    P('Outlet', (R_end, 0.0, zt + 0.05), 'Water leaves at high pressure'),
    P('Cutwater', (1.18, 0.0, 0.2), 'The tongue where the volute begins'),
], anim=run)
