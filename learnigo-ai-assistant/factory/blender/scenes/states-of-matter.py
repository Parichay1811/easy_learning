# Solid, liquid and gas as particles in three boxes. In a solid they sit in
# rows and only jiggle; in a liquid they touch but slide past each other; in
# a gas they are far apart and fly about. Heating melts and then boils it.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(5)
glass = mat('#bfe3ff', rough=0.1, alpha=0.1, rim=0.6)
edge = mat('#9fb8ff', rough=0.4, emit=0.8)
cols = {'solid': '#5b8cff', 'liquid': '#22d3ee', 'gas': '#fb7185'}
arrow = glowmat('#fbbf24', 3)
S = 1.8
X = {'solid': -2.6, 'liquid': 0.0, 'gas': 2.6}
floor(5.5, -S / 2 - 0.02)


def glass_box(cx):
    box((S, S, S), glass, loc=(cx, 0, 0))
    h = S / 2
    for a in (-h, h):
        for b in (-h, h):
            tube([(cx - h, a, b), (cx + h, a, b)], 0.018, edge)
            tube([(cx + a, -h, b), (cx + a, h, b)], 0.018, edge)
            tube([(cx + a, b, -h), (cx + a, b, h)], 0.018, edge)


parts = []
for k in X:
    glass_box(X[k])
r = 0.17
# solid: neat rows
for i in range(4):
    for j in range(4):
        for k in range(4):
            base = Vector((X['solid'] - 0.6 + i * 0.4, -0.6 + j * 0.4, -0.72 + k * 0.4))
            o = sphere(r, mat(cols['solid'], rough=0.3, rim=0.35), seg=24, rings=12, loc=base)
            parts.append(('solid', o, base, [random.uniform(0, TAU) for _ in range(3)], [random.choice((3, 4, 5)) for _ in range(3)]))
# liquid: close together in the bottom of the box, wandering
for n in range(34):
    base = Vector((random.uniform(-0.6, 0.6), random.uniform(-0.6, 0.6), random.uniform(-0.7, -0.05)))
    o = sphere(r, mat(cols['liquid'], rough=0.3, rim=0.35), seg=24, rings=12, loc=base + Vector((X['liquid'], 0, 0)))
    parts.append(('liquid', o, base, [random.uniform(0, TAU) for _ in range(3)], [random.choice((1, 2)) for _ in range(3)]))
# gas: few and far apart, zooming round the whole box
for n in range(10):
    o = sphere(r, mat(cols['gas'], rough=0.3, rim=0.35, emit=0.0), seg=24, rings=12)
    parts.append(('gas', o, Vector(), [random.uniform(0, TAU) for _ in range(3)], [random.choice((1, 2, 3)) for _ in range(3)]))
for x0, x1 in ((-1.55, -1.05), (1.05, 1.55)):
    tube([(x0, 0, 1.25), (x1 - 0.15, 0, 1.25)], 0.04, arrow)
    cone(0.1, 0.24, arrow, verts=20, loc=(x1 - 0.08, 0, 1.25), rot=(0, math.pi / 2, 0))

cam = camera((0, -11.2, 4.0), (0, 0, 0.1), lens=42)
lights((0, 0, 0), rim='#22d3ee')


def move(t):
    for kind, o, base, ph, f in parts:
        w = [TAU * f[i] * t + ph[i] for i in range(3)]
        if kind == 'solid':
            o.location = base + Vector([0.035 * math.sin(a) for a in w])
        elif kind == 'liquid':
            q = base + Vector((0.18 * math.sin(w[0]), 0.18 * math.sin(w[1]), 0.06 * math.sin(w[2])))
            q.x = max(-0.7, min(0.7, q.x)); q.y = max(-0.7, min(0.7, q.y)); q.z = max(-0.72, min(-0.02, q.z))
            o.location = q + Vector((X['liquid'], 0, 0))
        else:
            o.location = Vector((X['gas'] + 0.7 * math.sin(w[0]), 0.7 * math.sin(w[1]), 0.7 * math.sin(w[2])))


move(0)
first = parts[0][1]
finish('states-of-matter', 'Solid, liquid and gas', ['states of matter', 'solid', 'liquid', 'gas', 'particles', 'melting', 'boiling', 'evaporation', 'particle model', 'chemistry', 'physics'], [
    P('Solid', (X['solid'], -0.9, -0.5), 'Particles packed in rows: they only vibrate'),
    P('Liquid', (X['liquid'], -0.9, -0.45), 'Particles touch but slide past each other'),
    P('Gas', (X['gas'], -0.9, 0.5), 'Particles far apart, moving fast in all directions'),
    P('Melting', (-1.3, 0, 1.25), 'Heat makes the particles shake free of their rows'),
    P('Boiling', (1.3, 0, 1.25), 'More heat lets particles escape and fly apart'),
], anim=move)
