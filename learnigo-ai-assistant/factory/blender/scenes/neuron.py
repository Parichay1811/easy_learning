# A nerve cell (neuron): dendrites, cell body with nucleus, the axon wrapped
# in myelin with gaps (nodes), and axon terminals. In the loop a signal runs
# from the cell body down the axon, jumping node to node.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(3)
cellm = mat('#a78bfa', rough=0.4, rim=0.5)
nucm = mat('#5b21b6', rough=0.4, rim=0.3)
myel = mat('#fbbf24', rough=0.35, rim=0.4)
term = mat('#22d3ee', rough=0.35, rim=0.5)
pulse = glowmat('#7df9ff', 12)

S = Vector((-1.7, 0, 1.15))
soma = blob((0.62, 0.55, 0.55), cellm, loc=S, lumps=0.08, seed=5, subdiv=4)
nucleus = sphere(0.24, nucm, loc=S + Vector((-0.05, -0.42, 0.05)))


DEND = []


def dend(p, d, L, r, depth):
    n = 6
    pts, rr = [], []
    q = Vector(p)
    for i in range(n + 1):
        pts.append(tuple(q)); rr.append(1 - 0.5 * i / n)
        d = (d + Vector((random.uniform(-0.25, 0.25), random.uniform(-0.15, 0.15), random.uniform(-0.25, 0.25)))).normalized()
        q = q + d * (L / n)
    pts[-1] = tuple(q)
    tube(pts, r, cellm, radii=rr)
    DEND.append(pts)
    if depth:
        for s in (-1, 1):
            nd = (Matrix.Rotation(s * random.uniform(0.35, 0.7), 3, Vector((0, 1, 0))) @ d).normalized()
            dend(q, nd, L * 0.7, r * 0.55, depth - 1)


for a in (100, 140, 180, 215, 250, 60, 290):
    ang = math.radians(a)
    d = Vector((math.cos(ang), random.uniform(-0.2, 0.2), math.sin(ang))).normalized()
    dend(S + d * 0.5, d, 0.7, 0.11, 2)
# the axon: a gentle curve from the cell body down to the right
path = [S + Vector((0.5, 0, -0.3)), Vector((-0.6, 0, 0.45)), Vector((0.6, 0, -0.05)), Vector((1.5, 0, -0.95)), Vector((2.5, 0, -1.7))]
P0 = [Vector(p) for p in path]
def bez(u):   # a Catmull-Rom curve through the path points, u in 0..1
    n = len(P0) - 1
    f = min(n - 1e-6, max(0.0, u * n)); i = int(f); t = f - i
    p0 = P0[max(0, i - 1)]; p1 = P0[i]; p2 = P0[i + 1]; p3 = P0[min(n, i + 2)]
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)
ax = tube([tuple(bez(i / 80)) for i in range(81)], 0.075, cellm, name='Axon')
hill = cone(0.24, 0.5, cellm, loc=S + Vector((0.42, 0, -0.27)), rot=(0, math.radians(122), 0))
seg_starts = [0.16 + k * 0.105 for k in range(7)]
sheaths = []
for u0 in seg_starts:
    pts = [tuple(bez(u0 + 0.085 * i / 8)) for i in range(9)]
    sh = tube(pts, 0.16, myel, res=16, name='Myelin')
    sheaths.append(sh)
# axon terminals with knobs at the end
end = bez(1.0)
knobs = []
for a in (-60, -25, 10, 45):
    ang = math.radians(a - 20)
    d = Vector((math.cos(ang), 0.1 * random.uniform(-1, 1), math.sin(ang)))
    q = end + d * 0.55
    tube([tuple(end), tuple(end + d * 0.3 + Vector((0, 0, 0.05))), tuple(q)], 0.04, term, kind='BEZIER')
    knobs.append(sphere(0.1, term, loc=q))
spark = sphere(0.12, pulse, loc=tuple(bez(0)))
glowball = sphere(0.24, mat('#7df9ff', alpha=0.25, emit=3), loc=tuple(bez(0)))

cam = camera((0, -13.6, 0.0), (0.2, 0, 0.1), lens=55)
lights((0, 0, 0), rim='#a78bfa')


def signal(t):
    u = t   # one signal per loop, along the axon
    p = bez(u)
    for ob in (spark, glowball):
        ob.location = p
        ob.scale = (1, 1, 1) if 0.02 < u < 0.98 else (0.01, 0.01, 0.01)


finish('neuron', 'Nerve cell (neuron)', ['neuron', 'nerve cell', 'nervous system', 'axon', 'dendrite', 'myelin', 'synapse', 'brain', 'nerve impulse', 'biology'], [
    P('Dendrites', DEND[0][4], 'Branches that pick up signals from other cells'),
    P('Cell body', S + Vector((0.25, -0.45, 0.25)), 'Holds the nucleus and keeps the cell alive'),
    P('Nucleus', nucleus, 'The control centre with the DNA'),
    P('Axon', tuple(bez(0.255) + Vector((0, -0.08, 0))), 'A long wire carrying the signal away'),
    P('Myelin sheath', tuple(bez(0.5) + Vector((0, -0.16, 0.02))), 'Fatty wrapping: makes signals travel faster'),
    P('Axon terminals', knobs[1], 'Pass the signal on to the next cell'),
], anim=signal, frames=120)
