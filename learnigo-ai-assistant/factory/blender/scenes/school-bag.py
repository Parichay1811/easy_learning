# Packing a school bag: the backpack with its things laid out beside it:
# reading book, exercise book, pencil case, ruler, water bottle and lunch box.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
bagm = mat('#5b8cff', rough=0.6, rim=0.25)
bag2 = mat('#3f6fe0', rough=0.6, rim=0.2)
strap = mat('#2a3a78', rough=0.6)
zipm = mat('#fbbf24', rough=0.3, metal=0.6)
floor(5.0, 0, opacity=0.5)
bag = empty('Bag', loc=(-1.5, 0.4, 0), rot=(0, 0, 0.15))
body = box((1.5, 0.8, 1.9), bagm, bevel=0.35, seg=5, loc=(0, 0, 0.95), parent=bag)
pocket = box((1.1, 0.3, 0.8), bag2, bevel=0.2, seg=4, loc=(0, -0.48, 0.6), parent=bag)
tube([(-0.45, -0.64, 0.95), (0.45, -0.64, 0.95)], 0.02, zipm, parent=bag)
tube([(-0.5, 0.42, 1.85), (-0.55, 0.65, 1.2), (-0.5, 0.45, 0.2)], 0.07, strap, kind='BEZIER', parent=bag)
tube([(0.5, 0.42, 1.85), (0.55, 0.65, 1.2), (0.5, 0.45, 0.2)], 0.07, strap, kind='BEZIER', parent=bag)
torus(0.15, 0.03, strap, seg=24, ring=8, loc=(0, 0.05, 1.95), rot=(math.pi / 2, 0, 0), parent=bag)
# the things that go in it
rb = box((0.9, 1.2, 0.12), mat('#fb7185', rough=0.5, rim=0.2), bevel=0.02, loc=(0.6, -0.5, 0.06), rot=(0, 0, -0.25))
box((0.84, 1.14, 0.1), mat('#f4efe2', rough=0.6), loc=(0.63, -0.5, 0.06), rot=(0, 0, -0.25))
eb = box((0.8, 1.05, 0.05), mat('#34d399', rough=0.5, rim=0.2), bevel=0.01, loc=(0.75, -0.45, 0.15), rot=(0, 0, 0.1))
pc = empty('PencilCase', loc=(1.9, -0.8, 0), rot=(0, 0, 0.4))
blob((0.5, 0.18, 0.14), mat('#a78bfa', rough=0.5, rim=0.25), loc=(0, 0, 0.14), subdiv=4, parent=pc)
for k, c in enumerate(('#fbbf24', '#fb7185', '#22d3ee')):
    tube([(-0.3, -0.35 - k * 0.1, 0.05), (0.35, -0.35 - k * 0.1, 0.05)], 0.035, mat(c, rough=0.4), parent=pc)
    cone(0.035, 0.1, mat('#f2c29b', rough=0.5), verts=12, loc=(0.4, -0.35 - k * 0.1, 0.05), rot=(0, math.pi / 2, 0), parent=pc)
ruler = box((1.6, 0.18, 0.02), mat('#ffe08a', rough=0.4, alpha=0.9), loc=(0.6, 0.75, 0.01), rot=(0, 0, 0.05))
for k in range(16):
    box((0.01, 0.06 if k % 5 else 0.1, 0.005), mat('#1a2240'), loc=(0.6 - 0.75 + k * 0.1, 0.75 - 0.05, 0.025), rot=(0, 0, 0.05))
bottle = lathe([(0, 0), (0.22, 0), (0.24, 0.05), (0.24, 0.9), (0.18, 1.0), (0.12, 1.05), (0.12, 1.15), (0, 1.15)], mat('#22d3ee', rough=0.25, alpha=0.75, rim=0.4), seg=48, loc=(2.3, 0.6, 0))
cyl(0.13, 0.12, mat('#1a2240', rough=0.5), verts=24, loc=(2.3, 0.6, 1.2))
lbx = box((1.0, 0.7, 0.4), mat('#ff9f43', rough=0.5, rim=0.25), bevel=0.08, loc=(-1.0, -1.6, 0.2), rot=(0, 0, -0.2))
box((1.02, 0.72, 0.08), mat('#e07a20', rough=0.5), bevel=0.04, loc=(-1.0, -1.6, 0.42), rot=(0, 0, -0.2))

cam = camera((1.0, -6.0, 4.2), (0.35, -0.2, 0.6), lens=42)
lights((0, 0, 0.6), power=0.8)
finish('school-bag', 'Packing a school bag', ['school bag', 'backpack', 'school', 'packing', 'routine', 'getting ready', 'stationery', 'daily routine', 'organisation'], [
    P('Backpack', (-1.4, -0.05, 1.6), 'Two straps spread the weight on both shoulders'),
    P('Reading book', (0.35, -0.95, 0.13), 'Your book for reading time'),
    P('Exercise book', (0.95, -0.3, 0.19), 'For writing and sums'),
    P('Pencil case', (1.9, -0.8, 0.28), 'Pencils, rubber and sharpener'),
    P('Ruler', (1.1, 0.75, 0.03), 'For measuring and straight lines'),
    P('Water bottle', (2.3, 0.4, 0.7), 'Drink water to help you think'),
    P('Lunch box', (-1.0, -1.95, 0.35), 'A healthy lunch for later'),
])
