# How a bean seed germinates, in four stages left to right, seen against a
# cut through the soil: the seed swells, the root (radicle) grows down, the
# shoot hooks up through the soil, and the seedling opens its first leaves.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(2)
soil = mat('#6b4a2f', rough=0.9, rim=0.05)
soiltop = mat('#4c8a3a', rough=0.8, rim=0.1)
coat = mat('#c98b5a', rough=0.5, rim=0.3)
coty = mat('#e6e08a', rough=0.5, rim=0.25)
root = mat('#f7ecd2', rough=0.5, rim=0.25)
shoot = mat('#5fcf6a', rough=0.45, rim=0.3)
leafm = mat('#2fb25b', rough=0.45, rim=0.3)
pebble = mat('#8a6a4c', rough=0.8)

box((7.4, 2.0, 2.4), soil, bevel=0.06, loc=(0, 1.0, -1.2))
box((7.4, 2.0, 0.08), soiltop, bevel=0.03, loc=(0, 1.0, 0.04))
peb = ico(1.0, pebble, 1)
merge_instances(peb, [place((random.uniform(-3.6, 3.6), -0.0, random.uniform(-2.3, -0.2)), (random.random(), random.random(), 0), random.uniform(0.04, 0.09)) for _ in range(60)], 'Pebbles', pebble)


def bean(loc, rot=(0, 0, 0), s=1.0, open_=0.0):
    g = empty('Bean', loc=loc, rot=rot, scale=s)
    b = blob((0.34, 0.2, 0.22), coat, subdiv=4, parent=g)
    for v in b.data.vertices:   # a kidney shape
        v.co.z += 0.06 * (1 - (v.co.x / 0.34) ** 2) - 0.03
    b.data.update()
    return g


def roots(top, n, length, spread, hairs=0):
    main = [Vector(top) + Vector((0.04 * math.sin(i), 0, -length * i / 8)) for i in range(9)]
    tube([tuple(p) for p in main], 0.05, root, radii=[1 - 0.7 * i / 8 for i in range(9)])
    for k in range(n):
        p = main[2 + k % 5]
        s = 1 if k % 2 else -1
        q = p + Vector((s * spread * random.uniform(0.6, 1.0), 0, -spread * 0.6))
        tube([tuple(p), tuple((p + q) / 2 + Vector((0, 0, 0.05))), tuple(q)], 0.022, root, kind='BEZIER')
    return main


X = (-2.85, -0.95, 0.95, 2.8)
# 1: a swollen seed
b1 = bean((X[0], -0.1, -0.9), s=1.1)
# 2: the radicle pushes down
b2 = bean((X[1], -0.1, -0.85), rot=(0, 0.3, 0), s=1.1)
r2 = roots((X[1] + 0.25, -0.1, -0.95), 0, 0.7, 0)
# 3: roots spread, the shoot hooks up through the soil
b3 = bean((X[2] - 0.05, -0.1, -0.8), rot=(0, 0.6, 0), s=1.05)
roots((X[2] + 0.15, -0.1, -0.95), 4, 1.1, 0.35)
hook = tube([(X[2] + 0.15, -0.1, -0.85), (X[2] + 0.2, -0.1, -0.3), (X[2] + 0.15, -0.1, 0.15), (X[2] - 0.05, -0.1, 0.32), (X[2] - 0.2, -0.1, 0.15)], 0.055, shoot, kind='BEZIER')
# 4: the seedling: cotyledons and first leaves above, a root system below
roots((X[3], -0.1, -0.15), 7, 1.9, 0.5)
stem4 = tube([(X[3], -0.1, -0.15), (X[3] + 0.04, -0.1, 0.6), (X[3], -0.1, 1.35)], 0.06, shoot, kind='BEZIER')
cots = []
for s in (-1, 1):
    c = blob((0.24, 0.12, 0.13), coty, loc=(X[3] + s * 0.22, -0.1, 0.55), rot=(0, s * 0.3, 0), subdiv=3)
    cots.append(c)
leaves = []
for s in (-1, 1):
    l = blob((0.42, 0.04, 0.22), leafm, loc=(X[3] + s * 0.42, -0.1, 1.45), rot=(0, -s * 0.35, 0), subdiv=4)
    for v in l.data.vertices:
        v.co.z += 0.12 * (v.co.x / 0.42) ** 2 * s * 0
        v.co.y += 0.06 * (v.co.z / 0.22) ** 2
    l.data.update()
    leaves.append(l)

cam = camera((0, -11.8, 0.8), (0, 0, -0.2), lens=50)
lights((0, 0, 0), rim='#34d399')
finish('seed-germination', 'How a seed germinates', ['germination', 'seed', 'seedling', 'plant growth', 'radicle', 'cotyledon', 'roots', 'shoot', 'plants', 'life cycle'], [
    P('Seed', (b1, (0, -0.2, 0.05)), 'Takes in water and swells'),
    P('Radicle', (X[1] + 0.27, -0.15, -1.45), 'The first root: always grows down'),
    P('Shoot', (X[2] + 0.05, -0.15, 0.3), 'Hooks up through the soil towards light'),
    P('Cotyledon', (cots[0], (0, -0.12, 0)), 'Seed leaf: food store for the young plant'),
    P('First leaves', (leaves[1], (0.1, -0.05, 0.05)), 'Start making food by photosynthesis'),
    P('Roots', (X[3] + 0.35, -0.15, -1.2), 'Take in water and minerals; hold the plant'),
])
