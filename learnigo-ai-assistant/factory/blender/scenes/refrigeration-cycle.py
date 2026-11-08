# The vapour-compression refrigeration cycle (a fridge or air conditioner).
# The compressor squeezes the refrigerant vapour into a hot, high-pressure
# gas; in the condenser coil it gives heat to the room and condenses to a
# liquid; the expansion valve drops its pressure so it turns cold; in the
# evaporator coil it boils, taking heat from the space being cooled, and the
# cool vapour returns to the compressor. In the loop the refrigerant moves
# round: red hot gas, orange warm liquid, pale blue cold mix, cyan vapour.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
compm = mat('#2b2f3c', rough=0.35, metal=0.5, rim=0.3)
finm = mat('#c9d2e8', rough=0.35, metal=0.7, alpha=0.75)
valvem = mat('#d8b04a', rough=0.3, metal=0.85, rim=0.2)
boardm = mat('#1a2240', rough=0.7)
hotP = mat('#ff5a4a', rough=0.2, alpha=0.5, rim=0.4)
warmP = mat('#ff9f43', rough=0.2, alpha=0.5, rim=0.4)
coldP = mat('#7cc8ff', rough=0.2, alpha=0.5, rim=0.4)
vapP = mat('#22d3ee', rough=0.2, alpha=0.5, rim=0.4)
G = {'hot': glowmat('#ff5a3a', 3.0), 'warm': glowmat('#ffb347', 3.0), 'cold': glowmat('#a8dcff', 3.0), 'vap': glowmat('#22d3ee', 3.0)}
heatout = glowmat('#ff8a3a', 2.2)
heatin = glowmat('#9fd8ff', 2.2)


def serpentine(x0, x1, ztop, rows, dz, start_right=True):
    """A coil: straight runs joined by U-bends, from the top row down."""
    pts = []
    rb = dz / 2
    for i in range(rows):
        z = ztop - i * dz
        right_to_left = (i % 2 == 0) == start_right
        xa, xb = (x1, x0) if right_to_left else (x0, x1)
        pts += [(xa, 0, z), (xb, 0, z)]
        if i < rows - 1:
            cx = xb
            sgn = -1 if right_to_left else 1
            for k in range(1, 8):
                a = math.pi / 2 + math.pi * k / 8
                pts.append((cx + sgn * rb * math.cos(a) * -1, 0, z - rb + rb * math.sin(a)))
    return pts


box((8.4, 0.2, 4.4), boardm, loc=(0, 0.55, 1.55))
# condenser at the top (hot), evaporator at the bottom (cold), with fins
ZC, ZE, DZ, ROWS = 3.05, 1.3, 0.2, 5
cond = serpentine(-1.9, 1.9, ZC, ROWS, DZ, True)
evap = serpentine(-1.9, 1.9, ZE, ROWS, DZ, False)
for k in range(17):
    x = -1.75 + 3.5 * k / 16
    box((0.014, 0.42, ROWS * DZ + 0.12), finm, loc=(x, 0, ZC - (ROWS - 1) * DZ / 2))
    box((0.014, 0.42, ROWS * DZ + 0.12), finm, loc=(x, 0, ZE - (ROWS - 1) * DZ / 2))
# compressor on the right: a hermetic dome on feet
cx = 3.15
lathe([(0.0, 0.75), (0.5, 0.75), (0.55, 0.85), (0.55, 1.75), (0.45, 2.0), (0.25, 2.1), (0.0, 2.13)], compm, seg=64, loc=(cx, 0, 0))
for dx in (-0.4, 0.4):
    box((0.15, 0.7, 0.12), compm, loc=(cx + dx, 0, 0.72))
box((1.5, 1.0, 0.1), mat('#5a6380', rough=0.5, metal=0.4), bevel=0.02, loc=(cx, 0.05, 0.61))
for dy in (-0.35, 0.35):
    tube([(cx - 0.6, dy, 0.56), (cx - 0.6, dy, -0.6)], 0.03, mat('#5a6380', rough=0.5, metal=0.4))
    tube([(cx + 0.6, dy, 0.56), (cx + 0.6, dy, -0.6)], 0.03, mat('#5a6380', rough=0.5, metal=0.4))
cyl(0.12, 0.08, mat('#8b95b5', rough=0.4, metal=0.6), verts=24, loc=(cx + 0.25, -0.5, 1.4), rot=(math.pi / 2, 0, 0))
# expansion valve on the left: brass body, sensing bulb on its capillary
vx, vz = -3.15, 1.95
box((0.34, 0.34, 0.4), valvem, bevel=0.04, loc=(vx, 0, vz))
cyl(0.14, 0.3, valvem, verts=24, loc=(vx, 0, vz + 0.32))
cyl(0.18, 0.06, valvem, verts=24, loc=(vx, 0, vz + 0.5))
# the loop: pieces (points, pipe material, dot colour)
pieces = [
    ([(cx, 0, 2.12), (cx, 0, ZC), (1.9, 0, ZC)], hotP, 'hot'),
    (cond[:len(cond) // 2], hotP, 'hot'),
    (cond[len(cond) // 2 - 1:], warmP, 'warm'),
    ([cond[-1], (vx, 0, cond[-1][2]), (vx, 0, vz + 0.2)], warmP, 'warm'),
    ([(vx, 0, vz - 0.2), (vx, 0, ZE), (-1.9, 0, ZE)], coldP, 'cold'),
    (evap[:len(evap) * 2 // 3], coldP, 'cold'),
    (evap[len(evap) * 2 // 3 - 1:], vapP, 'vap'),
    ([evap[-1], (cx - 0.9, 0, evap[-1][2]), (cx - 0.9, 0, 1.15), (cx - 0.55, 0, 1.15)], vapP, 'vap'),
]
segs = []
for pts, pm, key in pieces:
    tube([tuple(p) for p in pts], 0.06, pm, kind='POLY')
    for a, b in zip(pts, pts[1:]):
        segs.append((Vector(a), Vector(b), key, True))
segs.append((Vector((cx - 0.55, 0, 1.15)), Vector((cx, 0, 2.12)), 'vap', False))   # inside the compressor
Ls = [0.0]
for a, b, _, _ in segs:
    Ls.append(Ls[-1] + (b - a).length)


def walk(d):
    d %= Ls[-1]
    for i, (a, b, key, seen) in enumerate(segs):
        if d <= Ls[i + 1]:
            return a.lerp(b, (d - Ls[i]) / max(1e-6, Ls[i + 1] - Ls[i])), key, seen
    return segs[-1][1], segs[-1][2], False


# heat leaving the condenser (up) and entering the evaporator (from below)
def wavy(x, z0, z1, m, up=True):
    pts = [(x + 0.07 * math.sin(i * 1.3), -0.05, z0 + (z1 - z0) * i / 12) for i in range(13)]
    tube(pts, 0.025, m, kind='BEZIER')
    cone(0.08, 0.2, m, verts=16, loc=(pts[-1][0], -0.05, z1 + (0.08 if up else 0.08)), rot=(0, 0, 0) if up else (0, 0, 0))


for x in (-1.2, 0.0, 1.2):
    wavy(x, ZC + 0.3, ZC + 0.9, heatout)
    wavy(x, ZE - (ROWS - 1) * DZ - 0.95, ZE - (ROWS - 1) * DZ - 0.3, heatin)
N = 70
dots = [sphere(0.055, G['cold'], seg=12, rings=8) for _ in range(N)]
no_shadow(*dots)
floor(7.0, -0.6)

cam = camera((-1.2, -10.6, 3.2), (0.0, 0, 1.55), lens=40)
lights((0, 0, 1.5), rim='#a78bfa')


def run(t):
    for k, d in enumerate(dots):
        p, key, seen = walk(Ls[-1] * (k + t) / N)
        d.location = (p.x, p.y - 0.0, p.z)
        d.data.materials.clear()
        d.data.materials.append(G[key])
        d.scale = (1, 1, 1) if seen else (0.001,) * 3


run(0)
finish('refrigeration-cycle', 'The refrigeration cycle', ['refrigeration cycle', 'vapour compression', 'vapor compression', 'refrigerator', 'fridge', 'air conditioner', 'heat pump', 'compressor', 'condenser', 'evaporator', 'expansion valve', 'refrigerant', 'thermodynamics', 'coefficient of performance', 'mechanical engineering'], [
    P('Compressor', (cx, -0.56, 1.4), 'Squeezes the vapour into a hot, high-pressure gas'),
    P('Condenser coil', (0.6, -0.1, ZC - DZ), 'The gas gives off heat and condenses to liquid'),
    P('Expansion valve', (vx, -0.18, vz), 'Drops the pressure, so the liquid turns very cold'),
    P('Evaporator coil', (-0.6, -0.1, ZE - DZ), 'The refrigerant boils, taking in heat'),
    P('Hot gas', (cx, -0.06, 2.6), 'High pressure and hot after compression'),
    P('Heat out', (0.0, -0.05, ZC + 0.65), 'Heat goes out to the room (Q out)'),
    P('Heat in', (0.0, -0.05, ZE - (ROWS - 1) * DZ - 0.6), 'Heat taken from inside the fridge (Q in)'),
], anim=run)
