# A tree above and below the ground: the leafy crown, branches, trunk with
# its bark, and the spreading roots in the soil (seen through a cut).
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(8)
soil = mat('#6b4a2f', rough=0.9, rim=0.05)
grass = mat('#4c8a3a', rough=0.8, rim=0.1)
bark = mat('#8a5a3b', rough=0.7, rim=0.25)
rootm = mat('#c9a06a', rough=0.6, rim=0.25)
leafs = [mat(h, rough=0.55, rim=0.3) for h in ('#2fb25b', '#3fbf6a', '#27a35a', '#4cc96f')]
fruit = mat('#fb7185', rough=0.35, rim=0.3)
pebble = mat('#8a6a4c', rough=0.8)

box((7.6, 2.4, 2.6), soil, bevel=0.06, loc=(0, 1.0, -1.3))
box((7.6, 2.4, 0.1), grass, bevel=0.04, loc=(0, 1.0, 0.05))
peb = ico(1.0, pebble, 1)
merge_instances(peb, [place((random.uniform(-3.7, 3.7), -0.2, random.uniform(-2.5, -0.25)), (random.random(), random.random(), 0), random.uniform(0.04, 0.08)) for _ in range(50)], 'Pebbles', pebble)
trunk = lathe([(0.0, -0.1), (0.42, -0.1), (0.36, 0.25), (0.27, 0.8), (0.24, 1.8), (0.2, 2.4), (0.0, 2.4)], bark, seg=40, loc=(0, 0.3, 0))
for k in range(16):   # bark ridges
    a = TAU * k / 16
    tube([(0.3 * math.cos(a), 0.3 + 0.3 * math.sin(a), 0.1), (0.25 * math.cos(a), 0.3 + 0.25 * math.sin(a), 1.2), (0.2 * math.cos(a), 0.3 + 0.2 * math.sin(a), 2.3)], 0.025, bark, kind='BEZIER')
tips = []


def grow(p, d, L, r, depth, m, out, down=False):
    q = p + d * L
    tube([tuple(p), tuple(p + d * L * 0.5 + Vector((random.uniform(-0.1, 0.1), 0, random.uniform(-0.06, 0.06)))), tuple(q)], r, m, kind='BEZIER', radii=[1, 0.85, 0.7])
    if depth == 0:
        out.append(q)
        return
    for s in (-1, 1):
        a = s * random.uniform(0.35, 0.7)
        nd = (Matrix.Rotation(a, 3, Vector((0, 1, 0))) @ d)
        nd.y += random.uniform(-0.3, 0.3)
        if down:
            nd.z = min(nd.z, -0.15)
        grow(q, nd.normalized(), L * 0.72, r * 0.68, depth - 1, m, out, down)


top = Vector((0, 0.3, 2.3))
for a in (-0.55, 0.0, 0.5):
    grow(top, Vector((math.sin(a), 0, math.cos(a))).normalized(), 0.9, 0.11, 3, bark, tips)
crown = []
for t in tips:
    crown.append(place(t + Vector((random.uniform(-0.2, 0.2), random.uniform(-0.3, 0.3), random.uniform(0, 0.2))), (random.random(), 0, random.random()), random.uniform(0.45, 0.62)))
for k, m in enumerate(leafs):
    merge_instances(ico(1.0, m, 3), crown[k::4], 'Crown', m)
for k in range(6):
    sphere(0.09, fruit, loc=tips[k * 3 % len(tips)] + Vector((0, -0.62, -0.25)))
rtips = []
for a in (-1.1, -0.55, 0.0, 0.55, 1.1):
    d = Vector((math.sin(a), 0, -math.cos(a) * 0.8)).normalized()
    grow(Vector((math.sin(a) * 0.25, -0.15, -0.05)), d, 0.75, 0.09, 3, rootm, rtips, down=True)

cam = camera((0, -14.2, 1.8), (0, 0, 1.15), lens=50)
lights((0, 0, 0.8), rim='#34d399')
leftmost = min(tips, key=lambda v: v.x)
finish('tree-roots', 'A tree and its roots', ['tree', 'roots', 'trunk', 'branches', 'leaves', 'plants', 'bark', 'soil', 'parts of a plant'], [
    P('Crown', tuple(max(tips, key=lambda v: v.z) + Vector((0, -0.6, 0.0))), 'All the leaves: they make food from sunlight'),
    P('Branch', tuple(top + Vector((math.sin(-0.55), 0, math.cos(-0.55))) * 0.55), 'Holds the leaves up to the light'),
    P('Trunk', (0.0, 0.0, 1.3), 'Carries water up and food down'),
    P('Bark', (0.3, 0.05, 0.6), 'Tough outer skin that protects the tree'),
    P('Roots', tuple(min(rtips, key=lambda v: v.x + v.z * 0.2) + Vector((0, -0.1, 0))), 'Hold the tree in the ground'),
    P('Root tips', tuple(max(rtips, key=lambda v: -v.z) + Vector((0, -0.1, 0))), 'Soak up water and minerals from the soil'),
    P('Soil', (2.9, -0.2, -1.9), 'Holds water, air and food for the roots'),
])
