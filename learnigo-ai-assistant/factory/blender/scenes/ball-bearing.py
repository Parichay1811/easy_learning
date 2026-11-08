# A deep-groove ball bearing with a wedge cut out to show its cross-section.
# Hardened steel balls roll in curved grooves (raceways) between the inner
# race, which fits on the shaft, and the outer race, which sits in the
# housing. Rolling replaces sliding, so friction is small. The cage keeps
# the balls evenly spaced so they never rub on each other.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(64)
racem = mat('#d6dbe8', rough=0.18, metal=0.95, rim=0.15)
racecut = mat('#7d87a3', rough=0.6, metal=0.2)
ballm = mat('#f2f5fb', rough=0.06, metal=1.0, rim=0.1)
cagem = mat('#e3a64a', rough=0.3, metal=0.85, rim=0.2)
ROT = (math.pi / 2, 0, 0)            # the bearing's axis along y (facing the camera)
Rp, rb, W = 1.6, 0.3, 0.75           # pitch radius, ball radius, width
rg = rb * 1.04                       # groove radius, a little bigger than the ball
zg = math.sqrt(rg ** 2 - 0.18 ** 2)


def groove(sign, n=14):
    """Points of the raceway arc (sign -1 inner race, +1 outer race)."""
    pts = []
    for i in range(n + 1):
        z = -zg + 2 * zg * i / n
        pts.append((Rp + sign * math.sqrt(max(0.0, rg * rg - z * z)), z))
    return pts


h = W / 2
inner_prof = [(1.0, -h), (Rp - 0.18 - 0.02, -h), (Rp - 0.18, -h + 0.02)] + [(Rp - 0.18, -zg)] + groove(-1)[1:-1] + [(Rp - 0.18, zg), (Rp - 0.18, h - 0.02), (Rp - 0.2, h), (1.0, h), (1.0, -h)]
outer_prof = [(2.2, -h), (2.2, h), (Rp + 0.18 + 0.02, h), (Rp + 0.18, h - 0.02), (Rp + 0.18, zg)] + groove(1)[::-1][1:-1] + [(Rp + 0.18, -zg), (Rp + 0.18, -h + 0.02), (Rp + 0.2, -h), (2.2, -h)]
inner = lathe(inner_prof, racem, seg=128, rot=ROT)
outer = lathe(outer_prof, racem, seg=128, rot=ROT)
# cage: a band at the pitch circle with pockets round the balls
cage = lathe([(Rp - 0.1, -0.1), (Rp + 0.1, -0.1), (Rp + 0.1, 0.1), (Rp - 0.1, 0.1), (Rp - 0.1, -0.1)], cagem, seg=128, rot=ROT)
nb = 9
angs = [TAU * k / nb for k in range(nb)]
pockets = merge_instances(sphere(rb + 0.035, cagem, seg=24, rings=12), [Matrix.Translation((Rp * math.cos(a), 0, Rp * math.sin(a))) for a in angs], 'Pockets', cagem)
cut(cage, pockets)
# rivets between the pockets, like a pressed-steel cage
for a in angs:
    am = a + TAU / nb / 2
    if math.radians(50) < am % TAU < math.radians(110):
        continue
    cyl(0.04, 0.32, cagem, verts=12, loc=(Rp * math.cos(am), 0, Rp * math.sin(am)), rot=ROT)
# the wedge cut (from 55 to 135 degrees, at the top) and the balls outside it
a0, a1 = math.radians(56), math.radians(104)
fan = [(0, 0)] + [(4 * math.cos(a0 + (a1 - a0) * i / 8), 4 * math.sin(a0 + (a1 - a0) * i / 8)) for i in range(9)]
for ob in (inner, outer, cage):
    cut(ob, prism(fan, 2.0, racecut, rot=ROT))
balls = []
for a in angs:
    if a0 - 0.05 < a % TAU < a1 + 0.05:
        continue
    balls.append(sphere(rb, ballm, seg=64, rings=32, loc=(Rp * math.cos(a), 0, Rp * math.sin(a))))
floor(5.5, -2.21)

cam = camera((3.0, -8.6, 4.6), (0.0, 0, 0.05), lens=62)
lights((0, 0, 0), rim='#a78bfa')
P_face = lambda r, z, a=a1: (r * math.cos(a), z, r * math.sin(a))
finish('ball-bearing', 'A ball bearing', ['ball bearing', 'bearing', 'deep groove ball bearing', 'rolling element bearing', 'inner race', 'outer race', 'cage', 'friction', 'machine elements', 'machine design', 'mechanical engineering'], [
    P('Outer race', P_face(2.0, -0.0), 'Fits in the housing and stays still'),
    P('Inner race', P_face(1.2, 0.0), 'Fits on the shaft and turns with it'),
    P('Balls', (Rp * math.cos(angs[0]), -rb * 0.7, Rp * math.sin(angs[0])), 'Hardened steel balls roll instead of sliding'),
    P('Cage', (Rp * math.cos(angs[-1] + TAU / nb / 2), -0.17, Rp * math.sin(angs[-1] + TAU / nb / 2) + 0.06), 'Keeps the balls evenly spaced'),
    P('Raceway', P_face(Rp + rg * 0.98, 0.0, a1), 'A curved groove the balls run in'),
    P('Bore', (0.0, -0.3, -0.55), 'The hole that fits on the shaft'),
])
