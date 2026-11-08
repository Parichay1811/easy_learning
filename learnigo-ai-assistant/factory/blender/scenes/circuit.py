# A simple circuit: a battery pushes current round a closed loop of wire,
# through a switch and a bulb, which lights up. Open the switch and the loop
# breaks, so the bulb goes out. In the loop the current flows (dots move
# from the + end of the battery, round the circuit, back to the - end).
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
board = mat('#1e2a52', rough=0.6, rim=0.1)
wire = mat('#ff7a45', rough=0.35, rim=0.3)
cell = mat('#2b2f45', rough=0.4, rim=0.25)
cellband = mat('#fbbf24', rough=0.4, rim=0.2)
metal = mat('#c9d2e8', rough=0.3, metal=0.9)
glass = mat('#fff3c4', rough=0.05, alpha=0.18, rim=0.5, emit=1.4)
fil = glowmat('#ffd166', 18)
dotm = glowmat('#7df9ff', 4)
red = mat('#fb7185', rough=0.4)

box((6.4, 4.6, 0.12), board, bevel=0.05, loc=(0, 0, -0.06))
# battery on the left, lying along y
B = Vector((-2.2, 0, 0.42))
bat = cyl(0.4, 1.7, cell, verts=48, loc=B, rot=(math.pi / 2, 0, 0))
cyl(0.405, 0.5, cellband, verts=48, loc=B + Vector((0, 0.55, 0)), rot=(math.pi / 2, 0, 0))
cyl(0.14, 0.14, metal, verts=24, loc=B + Vector((0, 0.9, 0)), rot=(math.pi / 2, 0, 0))   # + terminal
cyl(0.3, 0.04, metal, verts=24, loc=B + Vector((0, -0.86, 0)), rot=(math.pi / 2, 0, 0))  # - terminal
plus = text('+', 0.32, red, loc=B + Vector((0.0, 0.55, 0.42)), rot=(0, 0, 0))
# bulb on the right
Lb = Vector((2.2, 0.0, 0.0))
lathe([(0.0, 0.0), (0.3, 0.0), (0.3, 0.12), (0.28, 0.18), (0.3, 0.24), (0.28, 0.3), (0.3, 0.36), (0.26, 0.45), (0.0, 0.45)], metal, seg=48, loc=Lb)
bulb = lathe([(0.24, 0.45), (0.3, 0.7)] + [(0.58 * math.sin(a), 1.2 - 0.56 * math.cos(a)) for a in [math.radians(40 + 140 * i / 14) for i in range(15)]] + [(0.0, 1.76)], glass, seg=64, loc=Lb)
coil = [(Lb.x + 0.18 * (i / 30 - 0.5) * 2, 0.06 * math.sin(i * 1.3), Lb.z + 1.12 + 0.06 * math.cos(i * 1.3)) for i in range(31)]
tube(coil, 0.012, fil)
for s in (-1, 1):
    tube([(Lb.x + s * 0.18, 0, Lb.z + 1.12), (Lb.x + s * 0.12, 0, Lb.z + 0.5)], 0.01, metal)
point(Lb + Vector((0, 0, 1.12)), 60, '#ffd166', 0.2)
no_shadow(bulb)
# the switch at the front
S = Vector((0.0, -1.7, 0.1))
box((0.9, 0.5, 0.12), mat('#3a4470', rough=0.5), loc=S)
cyl(0.07, 0.2, metal, loc=S + Vector((-0.32, 0, 0.12)))
cyl(0.07, 0.2, metal, loc=S + Vector((0.32, 0, 0.12)))
lever = box((0.72, 0.08, 0.04), metal, loc=S + Vector((0.0, 0, 0.24)))
# the wire path, as a loop: + terminal -> bulb -> switch -> - terminal
path = [B + Vector((0, 0.98, 0)), Vector((-2.2, 1.7, 0.1)), Vector((2.2, 1.7, 0.1)), Vector((2.2, 0.0, 0.2)),
        Vector((2.2, -1.7, 0.1)), S + Vector((0.32, 0, 0.05)), S + Vector((-0.32, 0, 0.05)), Vector((-2.2, -1.7, 0.1)), B + Vector((0, -0.9, 0))]
seg = []
for i in range(len(path) - 1):
    if i in (2, 5):   # the bulb and the switch are in the way: no wire drawn through them
        continue
    seg.append((path[i], path[i + 1]))
    tube([tuple(path[i]), tuple(path[i + 1])], 0.045, wire)
# dots for the current along the whole loop
L = [path[i] for i in range(len(path))]
lengths = [(L[i + 1] - L[i]).length for i in range(len(L) - 1)]
total = sum(lengths)


def along(u):
    d = (u % 1.0) * total
    for i, l in enumerate(lengths):
        if d <= l:
            return L[i].lerp(L[i + 1], d / l)
        d -= l
    return L[-1]


dots = [sphere(0.06, dotm, seg=16, rings=8) for _ in range(24)]
cam = camera((0.3, -7.6, 6.0), (0.1, 0.0, 0.25), lens=42)
lights((0, 0, 0), power=0.7)


def flow(t):
    for k, d in enumerate(dots):
        d.location = along(k / len(dots) + t)


finish('circuit', 'A simple circuit', ['circuit', 'electricity', 'battery', 'cell', 'bulb', 'switch', 'wire', 'current', 'conductor', 'physics'], [
    P('Battery', B + Vector((0, -0.2, 0.4)), 'Pushes the current round: it stores energy'),
    P('Positive end', B + Vector((0, 0.95, 0.15)), 'Current leaves the + end and returns to the - end'),
    P('Wire', (0.0, 1.7, 0.15), 'Copper inside lets the current flow'),
    P('Bulb', Lb + Vector((0, -0.4, 1.2)), 'The thin filament gets hot and glows'),
    P('Switch', S + Vector((0, -0.1, 0.25)), 'Closed: the loop is complete, so current flows'),
    P('Current', tuple(along(0.22)), 'A flow of tiny charged particles'),
], anim=flow)
