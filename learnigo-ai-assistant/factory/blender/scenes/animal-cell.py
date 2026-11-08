# An animal cell with one eighth cut away: membrane, cytoplasm, the nucleus
# (cut too, showing the nucleolus), mitochondria, ER, Golgi and lysosomes.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(7)
membrane = mat('#fb7185', rough=0.45, rim=0.5)
cyto = mat('#e9a3b3', rough=0.75, rim=0.0)
nucm = mat('#8b5cf6', rough=0.4, rim=0.4)
nucin = mat('#b39dfb', rough=0.6, rim=0.0)
nucleolm = mat('#5b21b6', rough=0.5)
mito = mat('#ff9f43', rough=0.45, rim=0.3)
cristae = mat('#ffd08a', rough=0.5)
erm = mat('#5b8cff', rough=0.45, rim=0.3)
golgim = mat('#fbbf24', rough=0.45, rim=0.3)
lyso = mat('#34d399', rough=0.35, rim=0.3)
ribo = mat('#1e3a8a', rough=0.5)


def octant(m, s=6, e=0.0):
    return box((s, s, s), m, loc=(s / 2 + e, -s / 2 - e, s / 2 + e))


cell = blob((2.3, 2.3, 2.0), membrane, lumps=0.06, seed=1)
cut(cell, octant(cyto))
nuc = sphere(1.0, nucm, seg=64, rings=32)
cut(nuc, octant(nucin, e=0.012))   # its cut faces sit just in front of the cell's
nucleolus = sphere(0.36, nucleolm, loc=(0.0, -0.0, 0.0))
nuc_pore = []
# mitochondria: capsules with folded inner membranes, sitting in the open part
def mitochondrion(loc, rot, L=0.75, r=0.2):
    g = empty('Mito', loc=loc, rot=rot)
    body = lathe([(0, -L / 2 - r)] + [(r * math.sin(a / 8 * math.pi / 2), -L / 2 - r * math.cos(a / 8 * math.pi / 2)) for a in range(1, 9)] +
                 [(r * math.sin(a / 8 * math.pi / 2), L / 2 + r * math.cos(a / 8 * math.pi / 2)) for a in range(8, 0, -1)] + [(0, L / 2 + r)], mito, seg=32, parent=g)
    body.rotation_euler = (0, math.pi / 2, 0)
    bpy.context.view_layer.update()
    rings = []
    for k in range(5):
        x = -L / 2 + L * (k + 0.5) / 5
        rings.append(torus(r * 0.62, 0.03, cristae, seg=24, ring=6, loc=(x, 0, 0), rot=(0, math.pi / 2, 0), parent=g))
    bpy.context.view_layer.update()
    half = box((3, 3, 3), cristae, parent=g, loc=(0, 0, 1.5 + 0.0))   # cut open lengthwise to show the folds
    bpy.context.view_layer.update()
    cut_many([body] + rings, half)
    return g
m1 = mitochondrion((1.75, -0.45, 0.85), (0.3, 0.2, 1.2))
m2 = mitochondrion((0.75, -1.75, 0.3), (0.0, -0.2, 0.2), L=0.6)
m3 = mitochondrion((1.65, -1.35, 0.25), (0.0, 0.0, -0.75), L=0.5, r=0.17)
# rough ER: folded bands wrapped round the nucleus, studded with ribosomes
er = []
for k, R in enumerate((1.18, 1.36, 1.54)):
    pts = []
    for i in range(40):
        a = math.radians(-5 + 100 * i / 39)
        pts.append((R * math.cos(a) * 0.95, -R * math.sin(a) * 0.95, 0.12 + 0.08 * math.sin(i * 0.9 + k)))
    er.append(tube(pts, 0.05, erm, res=8))
    er[-1].data.extrude = 0.18
ribo_dot = ico(0.035, ribo, 1)
mats = []
for i in range(220):
    a = math.radians(random.uniform(-5, 95)); R = random.choice((1.18, 1.36, 1.54)) + random.choice((-0.06, 0.06))
    mats.append(place((R * math.cos(a) * 0.95, -R * math.sin(a) * 0.95, random.uniform(0.0, 0.3))))
for i in range(90):
    p = Vector((random.uniform(0.2, 1.9), random.uniform(-1.9, -0.2), random.uniform(0.05, 1.6)))
    if p.length < 1.9:
        mats.append(place(p))
merge_instances(ribo_dot, mats, 'Ribosomes', ribo)
# Golgi body: a stack of curved flattened sacs
golgi = empty('Golgi', loc=(0.35, -1.5, 1.35), rot=(0.3, 0.0, 0.5))
for k in range(5):
    t = torus(0.42 - k * 0.03, 0.045, golgim, seg=32, ring=8, arc=math.radians(150), loc=(0, 0, k * 0.11), rot=(0, 0, math.radians(195)), parent=golgi)
    t.scale = (1, 1, 0.6)
for k, p in enumerate(((1.05, -1.0, 1.4), (1.6, -0.3, 1.45), (0.45, -0.75, 1.75))):
    sphere(0.16 - 0.03 * k, lyso, loc=p)

cam = camera((6.6, -8.4, 5.6), (0.25, -0.25, 0.1), lens=64)
lights((0, 0, 0.3), rim='#a78bfa')
finish('animal-cell', 'Animal cell', ['animal cell', 'cell', 'nucleus', 'mitochondria', 'organelles', 'cytoplasm', 'cell membrane', 'golgi', 'biology'], [
    P('Cell membrane', (1.2, -1.25, -1.4), 'A thin skin that controls what goes in and out'),
    P('Cytoplasm', (1.45, -0.02, 1.25), 'Jelly that fills the cell; work happens here'),
    P('Nucleus', (0.5, -0.02, 0.62), 'The control centre: holds the DNA'),
    P('Nucleolus', (0.2, -0.2, 0.2), 'Makes the parts for ribosomes'),
    P('Mitochondrion', m1, 'Releases energy from food (respiration)'),
    P('Endoplasmic reticulum', (1.3, -0.45, 0.2), 'Folded tubes that make and move proteins'),
    P('Golgi body', golgi, 'Packs proteins and sends them out'),
    P('Lysosome', (1.05, -1.0, 1.4), 'Breaks down waste and worn-out parts'),
])
