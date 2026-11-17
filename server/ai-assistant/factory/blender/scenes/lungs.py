# The lungs, seen through: trachea, bronchi, the branching bronchioles
# ending in air sacs, and the diaphragm that pulls air in. Right lung (on
# the viewer's left) has 3 lobes, the left lung 2 and a notch for the heart.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(4)
lungm = mat('#f08ba0', rough=0.5, alpha=0.42, rim=0.6)
airway = mat('#7fe3f5', rough=0.3, rim=0.4)
ringm = mat('#e8f6ff', rough=0.4)
sacs = mat('#ffb3c4', rough=0.4, emit=0.0, rim=0.5)
dia = mat('#c24a64', rough=0.55, rim=0.2)
fiss = mat('#b8526a', rough=0.6, rim=0)

chest = empty('Chest')
DOME = lambda r: -1.2 - 0.6 * (min(r, 2.2) / 2.1) ** 2.2   # height of the diaphragm's top at distance r


def lung(side):
    ob = blob((0.95, 0.7, 1.55), lungm, lumps=0.02, seed=side + 2, subdiv=5)
    for v in ob.data.vertices:
        z = v.co.z
        if z > 0.2:   # narrow apex
            k = 1 - 0.5 * ((z - 0.2) / 1.35) ** 1.5
            v.co.x *= k; v.co.y *= k
        floor_z = DOME(abs(v.co.x - side * 1.08)) + 0.04
        if z < floor_z + 0.25:  # the base follows the dome of the diaphragm
            v.co.z = max(z, floor_z + 0.25 * max(0, (z - floor_z + 0.25)) / 0.5)
        if v.co.x * side > 0.3:   # flat medial face
            v.co.x = side * (0.3 + (v.co.x * side - 0.3) * 0.4)
    ob.data.update()
    ob.location = (-side * 1.08, 0, 0)
    ob.parent = chest
    return ob


rl = lung(1)
ll = lung(-1)
notch = blob((0.42, 0.6, 0.5), lungm, loc=(0.5, -0.25, -0.5), subdiv=3)
cut(ll, notch)
# fissures: the lines between the lobes, drawn on each lung's front surface
def fissure(ob, x0, z0, x1, z1):
    q = []
    for i in range(24):
        x = x0 + (x1 - x0) * i / 23; z = z0 + (z1 - z0) * i / 23
        o = Vector((x, -3, z)) - ob.location
        ok, hit, nrm, _ = ob.ray_cast(o, Vector((0, 1, 0)))
        if ok:
            q.append(tuple(ob.location + hit + Vector((0, -0.012, 0))))
    if len(q) > 2:
        tube(q, 0.016, fiss, parent=chest)
bpy.context.view_layer.update()
fissure(rl, -2.1, 0.22, -0.75, 0.12)    # horizontal fissure (right lung)
fissure(rl, -2.1, -0.35, -0.75, -1.15)  # oblique fissure (right lung)
fissure(ll, 0.62, 0.55, 2.1, -0.75)     # oblique fissure (left lung)
# trachea with its cartilage rings, the two bronchi and a branching tree
tube([(0, 0, 2.3), (0, 0, 0.75)], 0.17, airway, parent=chest)
for i in range(10):
    torus(0.18, 0.03, ringm, seg=40, ring=8, loc=(0, 0, 0.85 + i * 0.15), parent=chest)
tips = []


def branch(p, d, length, r, depth):
    q = p + d * length
    tube([tuple(p), tuple(q)], r, airway, parent=chest)
    if depth == 0:
        tips.append(q)
        return
    for s in (-1, 1):
        a = random.uniform(0.35, 0.6) * s
        axis = Vector((0, 1, 0)) if depth % 2 else Vector((random.uniform(-0.3, 0.3), 1, 0)).normalized()
        nd = (Matrix.Rotation(a, 3, axis) @ d).normalized()
        nd.y += random.uniform(-0.25, 0.25)
        branch(q, nd.normalized(), length * 0.72, r * 0.72, depth - 1)


bron = []
for s in (-1, 1):
    d = Vector((s * 0.8, 0, -0.6)).normalized()
    p0 = Vector((0, 0, 0.78))
    p1 = p0 + d * 0.62
    tube([tuple(p0), tuple(p1)], 0.11, airway, parent=chest)
    bron.append(p0 + d * 0.35)
    for dd in (Vector((s * 0.5, 0, 1)), Vector((s * 1, 0.1, -0.1)), Vector((s * 0.45, -0.1, -1))):
        branch(p1, dd.normalized(), 0.38, 0.07, 3)
sac = ico(0.05, sacs, 2)
mats = []
for t in tips:
    for k in range(5):
        mats.append(place(t + Vector((random.uniform(-0.07, 0.07), random.uniform(-0.07, 0.07), random.uniform(-0.07, 0.07)))))
swarm = merge_instances(sac, mats, 'Alveoli', sacs, parent=chest)
# the diaphragm: a muscle dome under both lungs
prof = [(r * 2.15 / 12, DOME(r * 2.15 / 12)) for r in range(13)]
dome = lathe(prof + [(r, z - 0.09) for r, z in reversed(prof)], dia, seg=72)
dome.scale = (1.0, 0.6, 1.0)

cam = camera((0, -9.5, 0.5), (0, 0, 0.05), lens=50)
lights((0, 0, 0), rim='#22d3ee')
tip_l = max(tips, key=lambda v: v.x)


def breathe(t):
    s = 0.5 - 0.5 * math.cos(TAU * t)   # 0 out, 1 in
    chest.scale = (1 + 0.05 * s, 1 + 0.05 * s, 1 + 0.06 * s)
    chest.location.z = -0.06 * s
    dome.location.z = -0.22 * s
    dome.scale = (1.0 + 0.03 * s, 0.55, 1 - 0.25 * s)


finish('lungs', 'The lungs', ['lungs', 'breathing', 'respiration', 'trachea', 'windpipe', 'bronchi', 'alveoli', 'diaphragm', 'human body', 'respiratory system'], [
    P('Trachea', (chest, (0, -0.15, 1.6)), 'The windpipe: rings of cartilage keep it open'),
    P('Bronchus', (chest, (-0.32, -0.08, 0.55)), 'The windpipe splits into one tube for each lung'),
    P('Bronchioles', (chest, (1.15, -0.1, -0.1)), 'Smaller and smaller branches, like a tree'),
    P('Alveoli', (chest, tuple(tip_l)), 'Tiny air sacs where oxygen passes into the blood'),
    P('Right lung', (chest, (-1.5, -0.5, 0.6)), 'Has three lobes'),
    P('Left lung', (chest, (1.5, -0.5, 0.55)), 'Two lobes, with a notch to make room for the heart'),
    P('Diaphragm', (dome, (0.0, -1.2, -1.35)), 'This dome of muscle pulls down to draw air in'),
], anim=breathe)
