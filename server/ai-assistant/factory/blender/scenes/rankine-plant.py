# A steam power plant laid out as the Rankine cycle. The feed pump raises
# the water's pressure (1-2); the boiler heats it to superheated steam
# (2-3); the steam expands through the turbine, which turns the generator
# (3-4); the condenser cools the exhaust back to water with cooling water
# (4-1), and the cycle repeats. In the loop the working fluid moves round:
# blue water, red high-pressure steam, pale exhaust steam.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
AX = (0, math.pi / 2, 0)
boilm = mat('#8b95b5', rough=0.45, metal=0.4, rim=0.2)
boilcut = mat('#3a4466', rough=0.7)
brick = brickmat('#b5523b', '#a3482f', '#5a2a20', scale=3.0, name='Firebrick')
tubem = mat('#c9d2e8', rough=0.3, metal=0.8)
fire = glowmat('#ff8a2a', 3.2)
fire2 = glowmat('#ffd27a', 4.0)
turbm = mat('#d6dbe8', rough=0.3, metal=0.8, rim=0.2)
genm = mat('#3d6fd9', rough=0.45, metal=0.3, rim=0.2)
condm = mat('#5b8cff', rough=0.45, metal=0.3, rim=0.2)
pumpm = mat('#34d399', rough=0.4, metal=0.3, rim=0.2)
deck = mat('#2a3350', rough=0.6, rim=0.1)
steamP = mat('#ff5a4a', rough=0.2, alpha=0.45, rim=0.4)
exhP = mat('#c9d6ee', rough=0.2, alpha=0.45, rim=0.4)
waterP = mat('#3b82f6', rough=0.2, alpha=0.5, rim=0.4)
coolP = mat('#22d3ee', rough=0.3, metal=0.3, rim=0.3)
G_W, G_S, G_E = glowmat('#5aa8ff', 3.0), glowmat('#ff6a4a', 3.0), glowmat('#e8f0ff', 2.0)


def xcyl(r, length, m, loc, verts=48, **kw):
    return cyl(r, length, m, verts=verts, loc=loc, rot=AX, **kw)


box((9.6, 3.4, 0.16), deck, bevel=0.03, loc=(0.0, 0.2, -0.08))
# boiler: casing cut open at the front to show the furnace and water tubes
bx = -3.1
boiler = box((1.7, 1.5, 3.0), boilm, bevel=0.04, loc=(bx, 0, 1.5))
cut(boiler, box((1.5, 1.4, 2.6), boilcut, loc=(bx, -0.05, 1.45)))
cut(boiler, box((1.3, 1.0, 2.3), boilcut, loc=(bx, -0.7, 1.45)))
box((1.48, 0.06, 2.58), brick, loc=(bx, 0.62, 1.45))
for k in range(9):
    tube([(bx - 0.6 + 0.15 * k, 0.4, 0.35), (bx - 0.6 + 0.15 * k, 0.4, 2.85)], 0.045, tubem)
for i, (dx, s) in enumerate(((-0.35, 0.55), (0.0, 0.75), (0.35, 0.5))):
    blob((0.22, 0.22, s), fire, subdiv=3, lumps=0.25, seed=i, loc=(bx + dx, 0.05, 0.55 + s * 0.6))
    blob((0.11, 0.11, s * 0.6), fire2, subdiv=3, lumps=0.2, seed=i + 5, loc=(bx + dx, -0.05, 0.45 + s * 0.4))
point((bx, -0.2, 0.9), 60, '#ff8a2a', 0.3)
drum = xcyl(0.36, 1.6, boilm, (bx, 0, 3.32))
for x in (bx - 0.5, bx + 0.5):
    cyl(0.12, 0.3, boilm, verts=24, loc=(x, 0, 3.0))
# turbine (cone) and generator on a raised deck, condenser below
tx0, tx1, tz = -0.4, 1.4, 2.25
lathe([(0.0, 0.0), (0.34, 0.0), (0.38, 0.1), (0.78, tx1 - tx0 - 0.1), (0.7, tx1 - tx0), (0.0, tx1 - tx0)], turbm, seg=64, loc=(tx0, 0, tz), rot=AX)
xcyl(0.08, 4.4, mat('#cfd5e2', rough=0.2, metal=0.95), (1.4, 0, tz))
gen = xcyl(0.6, 1.4, genm, (2.55, 0, tz))
for x in (1.85, 3.25):
    xcyl(0.63, 0.1, genm, (x, 0, tz))
for x, w in ((-0.65, 0.4), (1.7, 0.3), (3.45, 0.4)):
    box((w, 1.1, tz - 0.5), deck, bevel=0.03, loc=(x, 0, (tz - 0.5) / 2))
box((4.4, 1.3, 0.14), deck, bevel=0.03, loc=(1.4, 0, tz - 0.62))
cx0, cx1, cz = 0.0, 2.6, 0.62
cond = xcyl(0.52, cx1 - cx0, condm, (1.3, 0.0, cz))
for x in (cx0, cx1):
    xcyl(0.56, 0.08, condm, (x, 0, cz))
# cooling water in and out of the condenser
for y, z, d in ((-0.25, cz - 0.2, 1), (0.25, cz + 0.2, -1)):
    tube([(cx1 + 0.04, y, z), (cx1 + 0.7, y, z), (cx1 + 0.9, y + d * 0.0, z), (cx1 + 0.9, 1.9 if d < 0 else 1.6, z)], 0.09, coolP, kind='POLY')
cone(0.12, 0.25, glowmat('#22d3ee', 2.5), verts=20, loc=(cx1 + 0.9, 1.75, cz - 0.2), rot=(math.pi / 2, 0, 0))
cone(0.12, 0.25, glowmat('#22d3ee', 2.5), verts=20, loc=(cx1 + 0.9, 2.0, cz + 0.2), rot=(-math.pi / 2, 0, 0))
# feed pump: a small volute and motor
px = -1.25
pump = cyl(0.3, 0.25, pumpm, verts=40, loc=(px, -0.15, 0.4), rot=(math.pi / 2, 0, 0))
cyl(0.2, 0.55, pumpm, verts=32, loc=(px, 0.25, 0.4), rot=(math.pi / 2, 0, 0))
box((0.5, 0.8, 0.12), deck, loc=(px, 0.1, 0.06))
# the pipes of the cycle (see-through) and the path the fluid takes
steam_path = [(bx, 0, 3.68), (bx, 0, 4.1), (bx + 0.8, 0, 4.3), (tx0 - 0.6, 0, 4.0), (tx0 - 0.6, 0, tz), (tx0 + 0.05, 0, tz)]
exh_path = [(1.05, 0, tz - 0.5), (1.05, 0, cz + 0.45)]
cond_path = [(0.3, 0, cz - 0.5), (0.3, 0, 0.18), (px + 0.3, -0.15, 0.18), (px + 0.3, -0.15, 0.4)]
feed_path = [(px, -0.45, 0.4), (px, -0.75, 0.4), (bx + 0.95, -0.75, 0.4), (bx + 0.95, 0, 0.4)]
tube(steam_path, 0.11, steamP, kind='POLY')
tube([(1.05, 0, tz - 0.3), (1.05, 0, cz + 0.4)], 0.2, exhP, kind='POLY')
tube(cond_path, 0.08, waterP, kind='POLY')
tube(feed_path, 0.08, waterP, kind='POLY')
# the loop as pieces: (points, colour, seen); a dot is hidden inside equipment
pieces = [(feed_path, G_W, True),
          ([(bx + 0.95, 0, 0.4), (bx + 0.3, 0, 0.4), (bx + 0.3, 0, 3.32), (bx, 0, 3.32), (bx, 0, 3.68)], G_W, False),
          (steam_path, G_S, True),
          ([(tx0 + 0.05, 0, tz), (tx1 - 0.35, 0, tz), (1.05, 0, tz - 0.45)], G_S, False),
          (exh_path, G_E, True),
          ([(1.05, 0, cz + 0.45), (0.3, 0, cz), (0.3, 0, cz - 0.5)], G_E, False),
          (cond_path, G_W, True),
          ([(px + 0.3, -0.15, 0.4), (px, -0.45, 0.4)], G_W, False)]
loop, info = [], []
for pts, m, seen in pieces:
    for a, b in zip(pts, pts[1:]):
        loop.append((Vector(a), Vector(b)))
        info.append((m, seen))
Ls = [0.0]
for a, b in loop:
    Ls.append(Ls[-1] + (b - a).length)


def walk(d):
    d %= Ls[-1]
    for i, (a, b) in enumerate(loop):
        if d <= Ls[i + 1]:
            return a.lerp(b, (d - Ls[i]) / max(1e-6, Ls[i + 1] - Ls[i])), info[i]
    return loop[-1][1], info[-1]


N = 54
dots = [sphere(0.07, G_W, seg=12, rings=8) for _ in range(N)]
no_shadow(*dots)
floor(8.5, -0.17)

cam = camera((-1.0, -11.4, 5.6), (0.05, 0, 1.75), lens=40)
lights((0, 0, 1.6), rim='#ff9f43')


def run(t):
    for k, d in enumerate(dots):
        p, (m, seen) = walk(Ls[-1] * (k + t) / N)
        d.location = p
        d.data.materials.clear()
        d.data.materials.append(m)
        d.scale = (1, 1, 1) if seen else (0.001,) * 3


run(0)
finish('rankine-plant', 'A steam power plant (Rankine cycle)', ['rankine cycle', 'steam power plant', 'thermal power plant', 'steam cycle', 'boiler', 'steam turbine', 'condenser', 'feed pump', 'thermodynamic cycle', 'thermodynamics', 'thermal efficiency', 'power plant', 'mechanical engineering'], [
    P('Boiler', (bx + 0.85, -0.76, 2.4), 'Heat turns high-pressure water into superheated steam'),
    P('Furnace (heat in)', (bx, 0.0, 0.9), 'Burning fuel supplies the heat Q in'),
    P('High-pressure steam', (bx + 1.5, 0, 4.25), 'Hot, high-pressure steam goes to the turbine'),
    P('Turbine', (0.5, -0.55, tz), 'Steam expands and does work turning the shaft'),
    P('Generator', (2.55, -0.6, tz), 'The turbine turns it to make electricity'),
    P('Condenser', (1.6, -0.52, cz), 'Cools exhaust steam back to water (Q out)'),
    P('Cooling water', (cx1 + 0.9, 1.0, cz + 0.2), 'Carries the rejected heat away'),
    P('Feed pump', (px, -0.3, 0.4), 'Pushes the water back up to boiler pressure'),
], anim=run)
