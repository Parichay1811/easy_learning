# A wooden screw printing press like the one Johannes Gutenberg used (about
# 1450). Metal letters (movable type) are locked in a frame and inked; paper
# is laid on top; pulling the bar turns the screw, which presses the platen
# down hard so the ink prints on the paper.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(4)
wood = mat('#9a6a42', rough=0.6, rim=0.2)
woodp = mat('#8a5a3b', rough=0.6, rim=0.2)
iron = mat('#7c8296', rough=0.35, metal=0.85, rim=0.2)
typem = mat('#c9ccd8', rough=0.3, metal=0.9)
inkm = mat('#1a1d2b', rough=0.3)
paper = mat('#f4efe2', rough=0.7, rim=0.1)
leather = mat('#6e3b2a', rough=0.6, rim=0.2)
floor(4.6, 0, opacity=0.5)
# frame: two uprights, head beam and the bed rails
for x in (-1.1, 1.1):
    box((0.3, 0.4, 4.4), wood, bevel=0.03, loc=(x, 0, 2.2))
    box((0.5, 1.8, 0.2), woodp, bevel=0.03, loc=(x, 0, 0.1))
box((2.8, 0.45, 0.45), wood, bevel=0.03, loc=(0, 0, 4.2))
box((2.5, 0.4, 0.3), wood, bevel=0.03, loc=(0, 0, 3.2))   # the beam the screw runs through
box((2.4, 1.4, 0.15), woodp, bevel=0.02, loc=(0, -0.35, 1.25))   # bed
# the screw and bar
S = Vector((0, 0, 2.9))
pts = [(0.12 * math.cos(i * 0.7), 0.12 * math.sin(i * 0.7), 2.25 + i * 0.022) for i in range(48)]
tube(pts, 0.04, iron)
cyl(0.1, 1.1, iron, verts=24, loc=(0, 0, 2.8))
bar = tube([(0, 0, 2.55), (0.4, -0.5, 2.55), (1.3, -1.4, 2.5)], 0.045, iron, kind='BEZIER')
sphere(0.08, iron, loc=(1.3, -1.4, 2.5))
platen = box((1.0, 0.8, 0.12), woodp, bevel=0.02, loc=(0, -0.2, 2.15))
# the forme: rows of metal type, inked, with a sheet of paper beside it
for i in range(10):
    for j in range(6):
        h = 0.08 + 0.01 * random.random()
        box((0.07, 0.07, h), typem, loc=(-0.38 + i * 0.085, -0.45 + j * 0.085, 1.32 + h / 2))
        box((0.06, 0.06, 0.01), inkm, loc=(-0.38 + i * 0.085, -0.45 + j * 0.085, 1.32 + h + 0.005))
sheet = box((0.9, 0.65, 0.01), paper, loc=(0.0, -0.9, 1.33), rot=(0.35, 0, 0))
# ink balls (leather pads on handles) resting on the bed
for x in (0.8, 1.0):
    sphere(0.14, leather, loc=(x, -0.75, 1.47))
    tube([(x, -0.75, 1.55), (x + 0.05, -0.8, 1.9)], 0.025, woodp)
cam = camera((3.4, -7.4, 3.0), (0.1, -0.2, 2.0), lens=42)
lights((0, 0, 2.0), key='#ffe2b8')
finish('printing-press', 'Gutenberg printing press', ['printing press', 'gutenberg', 'movable type', 'books', 'printing', 'inventions', 'renaissance', 'history'], [
    P('Bar', (1.0, -1.1, 2.51), 'Pulling it turns the screw'),
    P('Screw', (0.0, -0.15, 2.7), 'Turns the pull into a strong push downwards'),
    P('Platen', (0.0, -0.62, 2.15), 'A flat block that presses the paper onto the type'),
    P('Movable type', (-0.2, -0.47, 1.42), 'Metal letters that can be rearranged and reused'),
    P('Paper', (0.0, -1.0, 1.36), 'Laid over the inked type to take the print'),
    P('Ink balls', (0.9, -0.85, 1.5), 'Leather pads used to dab ink on the type'),
    P('Frame', (-1.1, -0.2, 3.4), 'Heavy wooden posts keep the press steady'),
])
