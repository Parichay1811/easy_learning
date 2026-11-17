# A carbon atom in the Bohr model: a nucleus of 6 protons and 6 neutrons,
# with 2 electrons in the inner shell and 4 in the outer shell. (Real atoms
# are mostly empty space and electrons move in fuzzy clouds, not neat rings.)
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(2)
prot = mat('#fb7185', rough=0.35, rim=0.4)
neut = mat('#8b95b5', rough=0.35, rim=0.4)
elec = mat('#22d3ee', rough=0.3, emit=3)
shellm = mat('#5b8cff', rough=0.5, emit=1.0, alpha=0.7)
plus = mat('#ffffff', rough=0.4, emit=0.5)

atom = empty('Atom', rot=(math.radians(62), 0, math.radians(8)))
# nucleus: 12 balls packed together
pts = []
for k in range(12):
    while True:
        p = Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(-1, 1))) * 0.32
        if p.length < 0.36 and all((p - q).length > 0.2 for q in pts):
            pts.append(p)
            break
nuc = []
for k, p in enumerate(sorted(pts, key=lambda v: v.y)):
    b = sphere(0.16, prot if k % 2 == 0 else neut, loc=p, seg=32, rings=16, parent=atom)
    nuc.append(b)
SH = [(1.35, 2, 2), (2.45, 4, 1)]   # radius, electrons, turns per loop
electrons = []
for R, n, turns in SH:
    tube([(R * math.cos(TAU * i / 160), R * math.sin(TAU * i / 160), 0) for i in range(160)], 0.016, shellm, closed=True, parent=atom)
    for k in range(n):
        e = sphere(0.11, elec, seg=24, rings=12, parent=atom)
        electrons.append((e, R, TAU * k / n + (0.5 if R > 2 else 0.2), turns))
cam = camera((0, -9.2, 0.6), (0, 0, 0.0), lens=50)
lights((0, 0, 0), rim='#22d3ee')


def spin(t):
    for e, R, a0, turns in electrons:
        a = a0 + TAU * turns * t
        e.location = (R * math.cos(a), R * math.sin(a), 0)


front_p = min((b for b in nuc if b.active_material == prot), key=lambda b: (b.matrix_world.translation.y if False else b.location.y))
front_n = min((b for b in nuc if b.active_material == neut), key=lambda b: b.location.y)
spin(0)
outer = electrons[2][0]
finish('atom', 'Atom (Bohr model)', ['atom', 'bohr model', 'electron', 'proton', 'neutron', 'nucleus', 'electron shell', 'carbon', 'chemistry', 'particles'], [
    P('Nucleus', (atom, (0, 0, 0.36)), 'The tiny heavy centre of the atom'),
    P('Proton', front_p, 'Positive charge: 6 protons make it carbon'),
    P('Neutron', front_n, 'No charge: adds mass to the nucleus'),
    P('Electron', outer, 'Tiny and negative: whizzes round the nucleus'),
    P('Inner shell', (atom, (0, -1.35, 0)), 'Holds up to 2 electrons'),
    P('Outer shell', (atom, (-2.45 * 0.7, 2.45 * 0.71, 0)), 'Carbon has 4 here, so it can make 4 bonds'),
], anim=spin)
