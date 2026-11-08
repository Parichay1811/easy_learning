# The life cycle of a butterfly, clockwise from the top: eggs on a leaf,
# caterpillar (larva), chrysalis (pupa), adult butterfly, and round again.
# In the loop the butterfly slowly opens and closes its wings.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
leafm = mat('#34c46a', rough=0.5, rim=0.3)
vein = mat('#1f8a45', rough=0.5)
eggm = mat('#fff2b3', rough=0.35, rim=0.3)
cat_g = mat('#a3e635', rough=0.45, rim=0.3)
cat_k = mat('#1a2240', rough=0.4, rim=0.2)
cat_y = mat('#fbbf24', rough=0.4, rim=0.3)
chrys = mat('#4ade80', rough=0.3, rim=0.5)
gold = mat('#fcd34d', rough=0.3, metal=0.6, emit=0.4)
twig = mat('#8a5a3b', rough=0.7, rim=0.2)
wing_o = mat('#e9771c', rough=0.6, rim=0.2)
wing_k = mat('#1a1530', rough=0.5, rim=0.2)
spot = mat('#ffffff', rough=0.4)
arrow = glowmat('#22d3ee', 3)

R = 2.0
P_EGG, P_CAT, P_CHR, P_BUT = Vector((0, 0, R)), Vector((R * 1.15, 0, 0)), Vector((0, 0, -R)), Vector((-R * 1.15, 0, 0))


def leaf(loc, rot, s=1.0):
    l = blob((0.75 * s, 0.05, 0.38 * s), leafm, loc=loc, rot=rot, subdiv=4)
    for v in l.data.vertices:
        v.co.z *= 1 - 0.55 * abs(v.co.x / (0.75 * s)) ** 1.5
        v.co.y += 0.12 * (v.co.x / (0.75 * s)) ** 2
    l.data.update()
    tube([tuple(Vector(loc) + Euler(rot).to_matrix() @ Vector((x, -0.06, 0))) for x in (-0.7 * s, 0.7 * s)], 0.015, vein)
    return l


# eggs on a leaf
leaf(P_EGG + Vector((0, 0.05, -0.05)), (math.radians(-12), 0, 0.1))
eggs = []
for k in range(7):
    a = k * 2.4
    e = blob((0.075, 0.07, 0.1), eggm, loc=P_EGG + Vector((0.16 * math.cos(a) * (k > 0), -0.08, -0.05 + 0.12 * math.sin(a) * (k > 0))), subdiv=3)
    eggs.append(e)
# caterpillar on a leaf
leaf(P_CAT + Vector((0, 0.05, -0.1)), (math.radians(-12), 0, 0.12), 1.1)
segs = []
for i in range(10):
    x = -0.6 + i * 0.13
    z = -0.18 + 0.06 * math.sin(i * 0.8)
    m = (cat_g, cat_k, cat_y)[i % 3] if i < 9 else cat_g
    segs.append(sphere(0.1 if i < 9 else 0.13, m, loc=P_CAT + Vector((x, -0.12, z + 0.05))))
head = segs[-1].location
for s in (-1, 1):
    tube([tuple(head + Vector((0.03, -0.02 * s, 0.1))), tuple(head + Vector((0.12, -0.05 * s, 0.25)))], 0.012, cat_k)
# chrysalis hanging from a twig
tube([tuple(P_CHR + Vector((-0.7, 0, 0.75))), tuple(P_CHR + Vector((0.7, 0, 0.82)))], 0.05, twig)
ch = lathe([(0, 0.7), (0.06, 0.62), (0.2, 0.42), (0.26, 0.15), (0.24, -0.1), (0.16, -0.3), (0.06, -0.42), (0, -0.46)], chrys, seg=40, loc=P_CHR)
tube([tuple(P_CHR + Vector((0, 0, 0.7))), tuple(P_CHR + Vector((0, 0, 0.8)))], 0.02, twig)
for k in range(6):
    a = k * 0.5 - 1.2
    sphere(0.025, gold, loc=P_CHR + Vector((0.24 * math.sin(a), -0.24 * math.cos(a) * 0.4 - 0.08, 0.3)))
# the butterfly: body and four wings
bf = empty('Butterfly', loc=P_BUT, rot=(math.radians(65), 0, 0))
body = lathe([(0, -0.42), (0.04, -0.35), (0.05, 0.0), (0.06, 0.2), (0.07, 0.3), (0, 0.38)], cat_k, seg=20, parent=bf, rot=(-math.pi / 2, 0, 0))
wings = []
for s in (-1, 1):
    hinge = empty('Hinge', parent=bf)
    for (w, h, oy, oz), m in (((0.55, 0.36, 0.2, 0.0), wing_o), ((0.4, 0.3, -0.18, 0.0), wing_o)):
        wg = blob((w, h, 0.02), m, loc=(s * (w * 0.9), oy, oz), rot=(0, 0, s * (0.35 if oy > 0 else -0.4)), subdiv=4, parent=hinge)
        rim = blob((w * 1.06, h * 1.06, 0.012), wing_k, loc=(s * (w * 0.9), oy, oz - 0.012), rot=(0, 0, s * (0.35 if oy > 0 else -0.4)), subdiv=4, parent=hinge)
        for k in range(3):
            sphere(0.03, spot, loc=(s * (w * 1.55 - k * 0.12), oy + (0.12 if oy > 0 else -0.1), oz + 0.015), parent=hinge).scale = (1, 1, 0.3)
    wings.append((hinge, s))
for s in (-1, 1):
    tube([(s * 0.02, 0.36, 0.0), (s * 0.15, 0.62, 0.02)], 0.01, cat_k, parent=bf)
# arrows round the circle, clockwise
for a0 in (62, -28, -118, -205):
    a1 = a0 - 48
    pts = [(R * 1.3 * math.cos(math.radians(a)) * 1.0, 0.2, R * 1.12 * math.sin(math.radians(a))) for a in [a0 - (a0 - a1) * i / 16 for i in range(17)]]
    tube(pts, 0.035, arrow)
    p1, p0 = Vector(pts[-1]), Vector(pts[-3])
    c = cone(0.09, 0.22, arrow, verts=24, loc=p1)
    c.rotation_euler = (p1 - p0).to_track_quat('Z', 'Y').to_euler()

cam = camera((0, -11.0, 1.2), (0, 0, 0.0), lens=50)
lights((0, 0, 0), rim='#ff9f43')


def flap(t):
    a = math.radians(10 + 55 * (0.5 - 0.5 * math.cos(TAU * t * 2)))
    for h, s in wings:
        h.rotation_euler = (0, -s * a, 0)


finish('butterfly-life-cycle', 'Life cycle of a butterfly', ['butterfly', 'life cycle', 'metamorphosis', 'caterpillar', 'larva', 'chrysalis', 'pupa', 'egg', 'insects', 'minibeasts'], [
    P('Eggs', eggs[0], 'Laid on a leaf the caterpillar can eat'),
    P('Caterpillar', segs[5], 'The larva: eats and grows, shedding its skin'),
    P('Chrysalis', (ch, (0, -0.25, 0.1)), 'The pupa: inside, the body is rebuilt'),
    P('Butterfly', (bf, (0, 0.0, 0.05)), 'The adult: it flies, feeds and lays eggs'),
], anim=flap)
