# A food web on a grassy island. Arrows point from the food to the eater
# (the way the energy flows): sun -> grass -> grasshopper, rabbit, mouse ->
# snake, fox -> hawk.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(9)
grassm = mat('#3fbf6a', rough=0.6, rim=0.25)
grass2 = mat('#2f9e5b', rough=0.6, rim=0.25)
soil = mat('#6b4a2f', rough=0.9, rim=0.1)
sunm = glowmat('#ffd166', 6)
greyb = mat('#b8a99a', rough=0.6, rim=0.3)
mousem = mat('#9aa0b5', rough=0.6, rim=0.3)
pink = mat('#f9a8c4', rough=0.5)
hop = mat('#8bd450', rough=0.5, rim=0.3)
foxm = mat('#ff8c3a', rough=0.55, rim=0.3)
white = mat('#f5f5f0', rough=0.6)
snk = mat('#b5d63a', rough=0.45, rim=0.3)
snk2 = mat('#4c7a1f', rough=0.5)
hawkm = mat('#8a5a3b', rough=0.55, rim=0.3)
dark = mat('#1a1530', rough=0.4)
yel = mat('#fbbf24', rough=0.4)
arrow = glowmat('#22d3ee', 2.5)

isl = cyl(3.1, 0.5, soil, verts=96, loc=(0, 0, -0.25))
top = cyl(3.12, 0.08, grassm, verts=96, loc=(0, 0, 0.0))
tuft = cone(0.06, 0.32, grass2, verts=6)
merge_instances(tuft, [place((r * math.cos(a), r * math.sin(a), 0.14), (random.uniform(-0.3, 0.3), random.uniform(-0.3, 0.3), 0), random.uniform(0.5, 0.9))
                       for r, a in [(2.95 * math.sqrt(random.random()), random.uniform(0, TAU)) for _ in range(240)]], 'Grass', grass2)
sun = sphere(0.55, sunm, loc=(-3.6, 1.5, 3.6))


def eye(p, r=0.035):
    sphere(r, dark, loc=p)


def rabbit(p, s=1.0):
    g = empty('Rabbit', loc=p, scale=s, rot=(0, 0, -2.5))
    blob((0.38, 0.28, 0.3), greyb, loc=(0, 0, 0.32), subdiv=3, parent=g)
    blob((0.2, 0.18, 0.18), greyb, loc=(0.32, 0, 0.58), subdiv=3, parent=g)
    for y in (-0.07, 0.07):
        blob((0.05, 0.03, 0.22), greyb, loc=(0.28, y, 0.88), rot=(y * 2, -0.2, 0), subdiv=2, parent=g)
    sphere(0.09, white, loc=(-0.38, 0, 0.38), parent=g)
    sphere(0.035, dark, loc=(0.44, -0.12, 0.64), parent=g)
    return g


def mouse(p, s=1.0, rz=0.0):
    g = empty('Mouse', loc=p, scale=s, rot=(0, 0, rz))
    blob((0.22, 0.13, 0.12), mousem, loc=(0, 0, 0.13), subdiv=3, parent=g)
    cone(0.09, 0.18, mousem, loc=(0.25, 0, 0.14), rot=(0, math.pi / 2, 0), parent=g)
    for y in (-0.07, 0.07):
        cyl(0.06, 0.01, pink, loc=(0.16, y, 0.27), rot=(0, 1.2, 0), parent=g)
    tube([(-0.2, 0, 0.1), (-0.4, 0.1, 0.05), (-0.55, -0.05, 0.12)], 0.012, pink, kind='BEZIER', parent=g)
    sphere(0.022, dark, loc=(0.24, -0.06, 0.19), parent=g)
    return g


def grasshopper(p):
    g = empty('Grasshopper', loc=p, rot=(0, 0, -0.6), scale=1.9)
    blob((0.24, 0.07, 0.07), hop, loc=(0, 0, 0.18), subdiv=3, parent=g)
    sphere(0.07, hop, loc=(0.24, 0, 0.21), parent=g)
    for y in (-1, 1):
        tube([(-0.02, y * 0.05, 0.2), (-0.1, y * 0.09, 0.36), (-0.3, y * 0.1, 0.06)], 0.018, hop, parent=g)
        tube([(0.26, y * 0.03, 0.26), (0.4, y * 0.1, 0.45)], 0.006, dark, parent=g)
    return g


def fox(p):
    g = empty('Fox', loc=p, rot=(0, 0, -2.5), scale=1.25)
    blob((0.5, 0.22, 0.22), foxm, loc=(0, 0, 0.55), subdiv=3, parent=g)
    blob((0.2, 0.18, 0.17), foxm, loc=(0.52, 0, 0.75), subdiv=3, parent=g)
    cone(0.1, 0.26, foxm, loc=(0.74, 0, 0.7), rot=(0, math.pi / 2, 0), parent=g)
    sphere(0.035, dark, loc=(0.87, 0, 0.7), parent=g)
    for y in (-0.08, 0.08):
        cone(0.07, 0.18, foxm, loc=(0.48, y, 0.95), parent=g)
        sphere(0.03, dark, loc=(0.66, y * 1.1, 0.82), parent=g)
    for x in (-0.3, 0.3):
        for y in (-0.1, 0.1):
            tube([(x, y, 0.45), (x, y, 0.0)], 0.05, foxm, parent=g)
    tube([(-0.45, 0, 0.6), (-0.75, 0, 0.75), (-0.95, 0, 0.6)], 0.12, foxm, kind='BEZIER', parent=g, radii=[0.7, 1.1, 0.8])
    sphere(0.1, white, loc=(-1.0, 0, 0.56), parent=g)
    return g


def snake(p):
    g = empty('Snake', loc=p, scale=1.5)
    pts = [(0.35 * (1 - i / 50) * math.cos(i * 0.35), 0.35 * (1 - i / 50) * math.sin(i * 0.35), 0.08 + 0.004 * i) for i in range(45)]
    pts += [(0.05, 0.05, 0.35), (0.12, -0.05, 0.5)]
    tube(pts, 0.07, snk, kind='POLY', parent=g)
    sphere(0.09, snk, loc=(0.15, -0.07, 0.52), parent=g)
    for y in (-0.04, 0.04):
        sphere(0.018, dark, loc=(0.2, -0.07 + y, 0.58), parent=g)
    return g


def hawk(p):
    g = empty('Hawk', loc=p, rot=(-0.45, 0.1, math.pi + 0.3), scale=1.25)
    blob((0.12, 0.42, 0.12), hawkm, subdiv=3, parent=g)
    sphere(0.12, hawkm, loc=(0, 0.42, 0.05), parent=g)
    cone(0.04, 0.12, yel, loc=(0, 0.56, 0.02), rot=(-math.pi / 2, 0, 0), parent=g)
    for s in (-1, 1):
        w = blob((0.66, 0.4, 0.03), hawkm, loc=(s * 0.68, -0.05, 0.08), rot=(0, s * -0.2, s * -0.15), subdiv=3, parent=g)
    blob((0.16, 0.25, 0.02), hawkm, loc=(0, -0.5, 0.0), subdiv=3, parent=g)
    return g


POS = {'grass': Vector((0.0, -1.6, 0.2)), 'hopper': Vector((-1.7, -1.2, 0.05)), 'rabbit': Vector((1.6, -1.0, 0.05)), 'mouse': Vector((-0.1, 0.1, 0.05)),
       'snake': Vector((-1.8, 1.0, 0.05)), 'fox': Vector((1.6, 1.2, 0.05)), 'hawk': Vector((0.0, 1.8, 3.0))}
grasshopper(POS['hopper']); rabbit(POS['rabbit'], 1.45); mouse(POS['mouse'], 1.7, -2.2); snake(POS['snake']); fox(POS['fox']); hawk(POS['hawk'])
LIFT = {'grass': 0.3, 'hopper': 0.5, 'rabbit': 1.0, 'mouse': 0.45, 'snake': 0.9, 'fox': 1.3, 'hawk': 0.0}


def link_arrow(a, b):
    p, q = POS[a] + Vector((0, 0, LIFT[a])), POS[b] + Vector((0, 0, LIFT[b]))
    d = q - p
    p = p + d.normalized() * 0.35; q = q - d.normalized() * 0.45
    mid = (p + q) / 2 + Vector((0, 0, 0.35 + d.length * 0.08))
    pts = [tuple((1 - u) ** 2 * p + 2 * (1 - u) * u * mid + u * u * q) for u in [i / 20 for i in range(21)]]
    tube(pts, 0.03, arrow)
    tip = Vector(pts[-1]); prev = Vector(pts[-2])
    hd = cone(0.08, 0.2, arrow, verts=20, loc=tip)
    hd.rotation_euler = (tip - prev).to_track_quat('Z', 'Y').to_euler()


for a, b in (('grass', 'hopper'), ('grass', 'rabbit'), ('grass', 'mouse'), ('hopper', 'snake'), ('mouse', 'snake'), ('rabbit', 'fox'), ('mouse', 'fox'), ('snake', 'hawk'), ('rabbit', 'hawk')):
    link_arrow(a, b)

cam = camera((0, -10.0, 5.4), (0, 0, 0.9), lens=45)
lights((0, 0, 0.6), rim='#34d399')
finish('food-web', 'A food web', ['food web', 'food chain', 'producer', 'consumer', 'predator', 'prey', 'ecosystem', 'energy flow', 'habitat', 'animals'], [
    P('Sun', sun, 'The energy for the whole web starts here'),
    P('Grass', POS['grass'] + Vector((0, 0, 0.1)), 'Producer: makes its own food from sunlight'),
    P('Grasshopper', POS['hopper'] + Vector((0, 0, 0.35)), 'Herbivore: eats plants'),
    P('Rabbit', POS['rabbit'] + Vector((0, 0, 0.5)), 'Herbivore: eats grass'),
    P('Mouse', POS['mouse'] + Vector((0, 0, 0.25)), 'Eats seeds and insects'),
    P('Snake', POS['snake'] + Vector((0.2, -0.1, 0.7)), 'Carnivore: eats mice and insects'),
    P('Fox', POS['fox'] + Vector((0, 0, 0.75)), 'Predator: hunts rabbits and mice'),
    P('Hawk', POS['hawk'], 'Top predator: nothing here eats it'),
])
