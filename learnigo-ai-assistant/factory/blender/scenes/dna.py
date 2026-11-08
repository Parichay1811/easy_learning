# DNA: the double helix. Two sugar-phosphate backbones twist round each
# other; pairs of bases (A with T, G with C) join them like ladder rungs.
# The strands sit about 150 degrees apart, which makes the major and minor grooves.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
bb1 = mat('#5b8cff', rough=0.35, rim=0.5)
bb2 = mat('#22d3ee', rough=0.35, rim=0.5)
phos = mat('#e9eeff', rough=0.3, rim=0.3)
BASE = {'A': mat('#34d399', rough=0.4, rim=0.3), 'T': mat('#fb7185', rough=0.4, rim=0.3),
        'G': mat('#fbbf24', rough=0.4, rim=0.3), 'C': mat('#a78bfa', rough=0.4, rim=0.3)}
PAIR = {'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G'}
seq = 'ATGCGTACGATTGCAGCTAG'
N = len(seq)
R, rise, turn, off = 1.0, 0.34, math.radians(36), math.radians(150)
dna = empty('DNA')
z0 = -rise * (N - 1) / 2


def at(i, strand):
    a = i * turn + (off if strand else 0)
    return Vector((R * math.cos(a), R * math.sin(a), z0 + i * rise))


for s, m in ((0, bb1), (1, bb2)):
    pts = []
    for k in range(N * 6 + 1):
        u = k / 6 - 0.25
        a = u * turn + (off if s else 0)
        pts.append((R * math.cos(a), R * math.sin(a), z0 + u * rise))
    tube(pts, 0.085, m, parent=dna, name='Backbone%d' % s)
ball = ico(0.13, phos, 2)
merge_instances(ball, [place(at(i, s)) for i in range(N) for s in (0, 1)], 'Phosphates', phos, parent=dna)
rungs = []
for i, b in enumerate(seq):
    p, q = at(i, 0), at(i, 1)
    mid = (p + q) / 2
    for a, c, base in ((p, mid, b), (mid, q, PAIR[b])):
        d = c - a
        ob = cyl(0.075, d.length - 0.02, BASE[base], verts=16, parent=dna)
        ob.location = (a + c) / 2
        ob.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    rungs.append((p, q, mid))
dna.rotation_euler = (0, math.radians(14), 0)
cam = camera((0, -16.0, 0.3), (0, 0, 0), lens=55)
lights((0, 0, 0), rim='#22d3ee')
k_at, k_gc = 10, 13  # an A-T pair and a G-C pair near the middle, at the front


def spin(t):
    dna.rotation_euler = (0, math.radians(14), TAU * t + math.radians(-50))


finish('dna', 'DNA double helix', ['dna', 'double helix', 'genes', 'genetics', 'base pairs', 'chromosome', 'heredity', 'nucleotide', 'biology'], [
    P('Double helix', (dna, tuple(at(17, 0))), 'Two strands twisted round each other like a ladder'),
    P('Backbone', (dna, tuple(at(4, 1))), 'Sugar and phosphate links: the sides of the ladder'),
    P('Base pair', (dna, tuple(rungs[7][2])), 'Two bases joined in the middle: one rung'),
    P('A and T', (dna, tuple((rungs[k_at][0] * 0.7 + rungs[k_at][1] * 0.3))), 'Adenine always pairs with thymine'),
    P('G and C', (dna, tuple((rungs[k_gc][0] * 0.7 + rungs[k_gc][1] * 0.3))), 'Guanine always pairs with cytosine'),
    P('Hydrogen bonds', (dna, tuple(rungs[2][2])), 'Weak bonds in the middle let the strands unzip'),
], anim=spin, frames=144)
