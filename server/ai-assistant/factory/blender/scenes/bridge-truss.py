# A truss bridge (Warren truss) over a river. Triangles cannot change shape
# without a member stretching or squashing, so the frame is stiff and light.
# Under a load the top chord is squeezed (compression, red) and the bottom
# chord stretched (tension, blue); the diagonals take turns.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
comp = mat('#fb7185', rough=0.35, metal=0.5, rim=0.3)
tens = mat('#5b8cff', rough=0.35, metal=0.5, rim=0.3)
diag = mat('#c9d2e8', rough=0.35, metal=0.6, rim=0.2)
deckm = mat('#4a5070', rough=0.6, rim=0.1)
bank = mat('#7a8a4a', rough=0.85, rim=0.1)
stone = mat('#b8a88a', rough=0.8, rim=0.1)
water = mat('#2f86e0', rough=0.55, alpha=0.85, rim=0.2)
truck = mat('#ff9f43', rough=0.45, rim=0.3)
Lb, Hb, n, Wd = 8.0, 1.4, 6, 1.6
box((Lb + 6, 4.5, 0.4), water, loc=(0, 0, -1.7))
for s in (-1, 1):
    box((3.2, 4.5, 2.6), bank, loc=(s * (Lb / 2 + 1.4), 0, -0.7))
    box((0.8, Wd + 0.6, 1.0), stone, bevel=0.05, loc=(s * (Lb / 2 - 0.1), 0, -0.25))
deck = box((Lb + 0.4, Wd, 0.14), deckm, loc=(0, 0, 0.3))
bottom = [Vector((-Lb / 2 + Lb * i / n, 0, 0.38)) for i in range(n + 1)]
top = [Vector((-Lb / 2 + Lb * (i + 0.5) / n, 0, 0.38 + Hb)) for i in range(n)]
for y in (-Wd / 2, Wd / 2):
    off = Vector((0, y, 0))
    tube([tuple(p + off) for p in bottom], 0.07, tens)
    tube([tuple(p + off) for p in top], 0.08, comp)
    for i in range(n):
        tube([tuple(bottom[i] + off), tuple(top[i] + off)], 0.05, diag)
        tube([tuple(top[i] + off), tuple(bottom[i + 1] + off)], 0.05, diag)
for p in top:
    tube([tuple(p + Vector((0, -Wd / 2, 0))), tuple(p + Vector((0, Wd / 2, 0)))], 0.04, diag)
# a truck crossing: the load
tr = empty('Truck', loc=(0.6, 0, 0.37))
box((1.3, 0.8, 0.6), truck, bevel=0.06, loc=(0, 0, 0.42), parent=tr)
box((0.45, 0.75, 0.45), mat('#fbbf24', rough=0.45), bevel=0.05, loc=(0.85, 0, 0.35), parent=tr)
for x in (-0.4, 0.4, 0.85):
    for y in (-0.38, 0.38):
        cyl(0.13, 0.08, mat('#1a1d2b', rough=0.6), verts=24, loc=(x, y, 0.13), rot=(math.pi / 2, 0, 0), parent=tr)

cam = camera((1.8, -10.6, 3.2), (0.0, 0, 0.3), lens=40)
lights((0, 0, 0.5))
F = -Wd / 2
finish('bridge-truss', 'A truss bridge', ['bridge', 'truss', 'triangles', 'compression', 'tension', 'structures', 'forces', 'engineering', 'warren truss'], [
    P('Top chord', tuple(top[1] + Vector((0, F, 0))), 'Squeezed by the load: compression'),
    P('Bottom chord', tuple(bottom[4] + Vector((0, F, 0))), 'Stretched by the load: tension'),
    P('Triangle', tuple((bottom[2] + top[2] + bottom[3]) / 3 + Vector((0, F, 0))), 'A shape that cannot be pushed out of shape'),
    P('Deck', (-2.5, F, 0.3), 'The road surface the traffic drives on'),
    P('Load', tr, 'The weight of traffic pushing down'),
    P('Abutment', (Lb / 2 - 0.1, F - 0.3, -0.25), 'Strong supports at each end'),
])
