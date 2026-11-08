# A molar cut in half: enamel over the crown, dentine beneath, the soft pulp
# with its nerve and blood vessels, roots held in the jawbone, and the gum.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import common
common.SOLVER = 'MANIFOLD'

reset()
enam = mat('#dfe6f0', rough=0.4, rim=0.1)
dent = mat('#f6d98e', rough=0.5, rim=0.1)
pulpm = mat('#f0607a', rough=0.5, rim=0.1)
cem = mat('#d9b98a', rough=0.6, rim=0.1)
gum = mat('#f28ba0', rough=0.55, rim=0.25)
gumcut = mat('#e9788f', rough=0.6, rim=0)
bonem = mat('#e6d3ad', rough=0.8, rim=0.1)
bonecut = mat('#cdb68a', rough=0.85, rim=0)
red = mat('#ef4452', rough=0.4)
blue = mat('#4d7cf0', rough=0.4)
yel = mat('#fbbf24', rough=0.4)


def half(m, e=0.0):
    return box((8, 4, 8), m, loc=(0, -2 - e, 0))


def tooth_shape(m, crown, roots_r, root_len, cusp, z0=0.0, horns=False):
    parts = [blob(crown, m, loc=(0, 0, 0.95 + z0), subdiv=4)]
    for x in (-0.45, 0.45):
        if cusp:
            parts.append(sphere(cusp, m, loc=(x * 0.9, 0, 1.3 + z0)))
        if horns:
            parts.append(blob((0.1, 0.08, 0.14), m, loc=(x * 0.5, 0, 1.02 + z0), rot=(0, x * 0.3, 0), subdiv=3))
    for x in (-1, 1):   # roots: wide at the neck, narrow at the tip, splayed a little
        parts.append(cyl(roots_r * 0.28, root_len, m, verts=40, r2=roots_r, loc=(x * 0.42, 0, 0.6 - root_len / 2 + z0), rot=(0, -x * 0.14, 0)))
    base = parts[0]
    for p in parts[1:]:
        cut(base, p, op='UNION')
    return base


enamel = tooth_shape(enam, (1.0, 0.9, 0.68), 0.42, 2.1, 0.34)
cut(enamel, half(enam))
cut(enamel, box((4, 4, 4), enam, loc=(0, 0, -1.55)))       # enamel covers only the crown
cement = tooth_shape(cem, (0.85, 0.75, 0.5), 0.42, 2.15, 0)
cut(cement, box((4, 4, 4), cem, loc=(0, 0, 2.45)))
cut(cement, half(cem, 0.002))
dentine = tooth_shape(dent, (0.8, 0.7, 0.5), 0.36, 2.0, 0.22, z0=-0.02)
cut(dentine, half(dent, 0.004))
pulp = tooth_shape(pulpm, (0.46, 0.3, 0.2), 0.13, 1.85, 0, z0=-0.12, horns=True)
cut(pulp, half(pulpm, 0.006))
# nerve and blood vessels running up the root canals
for x in (-1, 1):
    for dx, m in ((-0.04, red), (0.0, yel), (0.04, blue)):
        tube([(x * 0.6 + dx * 0.5, -0.03, -1.6), (x * 0.5 + dx, -0.03, -0.4), (x * 0.25 + dx * 2, -0.03, 0.7)], 0.016, m, kind='BEZIER')
# gum and jawbone around the roots, cut in the same plane
gums = box((3.4, 2.2, 0.75), gum, bevel=0.3, loc=(0, 0, 0.2))
cut(gums, tooth_shape(gumcut, (0.95, 0.85, 0.62), 0.42, 2.1, 0.38))
cut(gums, half(gumcut, -0.004))
bone = box((3.4, 2.2, 2.1), bonem, bevel=0.15, loc=(0, 0, -1.1))
cut(bone, tooth_shape(bonecut, (0.95, 0.85, 0.62), 0.44, 2.15, 0.38))
cut(bone, half(bonecut, -0.004))

cam = camera((1.6, -7.8, 1.6), (0.15, 0, -0.1), lens=50)
lights((0, 0, 0), rim='#22d3ee')
finish('tooth', 'Layers of a tooth', ['tooth', 'teeth', 'enamel', 'dentine', 'pulp', 'gum', 'molar', 'dental health', 'human body'], [
    P('Enamel', (-0.75, -0.01, 1.2), 'The hardest material in the body: covers the crown'),
    P('Dentine', (0.62, -0.01, 0.85), 'Bone-like layer under the enamel'),
    P('Pulp', (0.0, -0.01, 0.85), 'Soft centre with nerves and blood vessels'),
    P('Gum', (-1.3, -0.01, 0.35), 'Pink tissue that seals round the tooth'),
    P('Root', (0.62, -0.01, -0.9), 'Anchors the tooth in the jawbone'),
    P('Nerve', (-0.48, -0.05, -0.6), 'Feels heat, cold and pain'),
    P('Jawbone', (1.3, -0.01, -1.6), 'Holds the roots firmly in place'),
])
