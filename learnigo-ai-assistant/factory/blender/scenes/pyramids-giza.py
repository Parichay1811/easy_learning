# The pyramids of Giza, Egypt (built about 4,500 years ago as tombs for
# pharaohs): the Great Pyramid of Khufu, the pyramid of Khafre (still with
# some smooth casing stones at its tip), the smaller pyramid of Menkaure,
# three queens' pyramids and the Great Sphinx. Sizes and layout to scale
# (1 unit = 50 m); the Sphinx is drawn a little larger and the Nile, really
# several kilometres east, is brought close.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(3)
stone = bandmat(['#d9b77a', '#c9a464', '#e2c48a'], scale=10.0, rough=0.85, name='Courses')
casing = mat('#efe0bf', rough=0.6, rim=0.15)
sand = mat('#e2c08a', rough=0.95, rim=0.05)
sphinxm = mat('#cfa968', rough=0.85, rim=0.15)
river = mat('#2f86e0', rough=0.3, rim=0.2)
palm = mat('#3c8f47', rough=0.7)


def pyramid(c, base, h, m, rot=0.0):
    b = base / 2
    ob = from_data([(-b, -b, 0), (b, -b, 0), (b, b, 0), (-b, b, 0), (0, 0, h)], [(3, 2, 1, 0), (0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)], 'Pyramid', m, smooth=False,
                   loc=c, rot=(0, 0, rot))
    return ob


ground = terrain((20, 18), (120, 100), lambda x, y: 0.12 * noise.fractal(Vector((x * 0.25, y * 0.25, 1)), 0.6, 2, 3) + (0.2 if x < 2 else 0.2 - 0.1 * (x - 2)) * 0, lambda x, y, z: '#e2c08a' if x < 6.5 else '#5fae55',
                 name='Desert', m=vcolmat(rough=0.95, name='Sand'), loc=(0, 0, -0.05))
box((1.2, 22, 0.1), river, loc=(8.0, 0, -0.02))
khufu = pyramid(Vector((2.4, 2.6, 0)), 4.6, 2.92, stone)
khafre = pyramid(Vector((-1.2, -1.0, 0.15)), 4.3, 2.87, stone)
cap = pyramid(Vector((-1.2, -1.0, 0.15 + 2.87 * 0.78)), 4.3 * 0.22, 2.87 * 0.22 + 0.01, casing)
menk = pyramid(Vector((-4.3, -4.3, 0.1)), 2.06, 1.3, stone)
queens = [pyramid(Vector((5.3, 1.0 + k * 1.1, 0)), 0.95, 0.6, stone) for k in range(3)]
# the Sphinx: a lion's body lying down, facing east (+x), with a head
sph = empty('Sphinx', loc=(3.4, -3.3, 0), scale=1.0)
box((1.3, 0.38, 0.32), sphinxm, bevel=0.1, loc=(-0.1, 0, 0.17), parent=sph)            # lion body lying down
box((0.36, 0.34, 0.42), sphinxm, bevel=0.06, loc=(0.52, 0, 0.5), parent=sph)            # chest and head
box((0.26, 0.4, 0.3), mat('#b98f4f', rough=0.85), bevel=0.04, loc=(0.5, 0, 0.62), parent=sph)  # headdress
for y in (-0.11, 0.11):
    box((0.55, 0.1, 0.08), sphinxm, bevel=0.03, loc=(0.9, y, 0.05), parent=sph)         # front paws
# palms along the river
trunk = mat('#8a5a3b', rough=0.7)
for k in range(9):
    p = Vector((7.0 + random.uniform(-0.3, 0.2), -8 + k * 2.0 + random.uniform(-0.5, 0.5), 0))
    tube([tuple(p), tuple(p + Vector((0.05, 0, 0.7)))], 0.04, trunk)
    for j in range(5):
        a = TAU * j / 5
        tube([tuple(p + Vector((0.05, 0, 0.7))), tuple(p + Vector((0.05 + 0.3 * math.cos(a), 0.3 * math.sin(a), 0.55)))], 0.03, palm, kind='BEZIER')

cam = camera((10.5, -11.0, 5.2), (0.2, -0.8, 0.9), lens=38)
lights((0, 0, 1.0), power=0.42, key='#ffe2b8')
finish('pyramids-giza', 'Pyramids of Giza', ['pyramids', 'giza', 'ancient egypt', 'pharaoh', 'khufu', 'great pyramid', 'sphinx', 'tomb', 'history', 'wonders of the world'], [
    P('Great Pyramid', (2.4, 2.6 - 1.2, 1.5), 'Built for Pharaoh Khufu: 146 m tall when finished'),
    P('Pyramid of Khafre', (-1.2, -1.0 - 1.1, 1.5), 'Looks taller because it stands on higher ground'),
    P('Casing stones', (-1.2, -1.0 - 0.2, 0.15 + 2.6), 'Smooth white limestone once covered them all'),
    P('Pyramid of Menkaure', (-4.3, -4.3 - 0.5, 0.6), 'The smallest of the three big pyramids'),
    P("Queens' pyramids", (5.3, 1.0, 0.35), 'Small pyramids for royal wives'),
    P('Great Sphinx', (3.4 + 0.55, -3.3, 0.75), 'A lion with a human head, guarding the pyramids'),
    P('River Nile', (7.5, -3.0, 0.0), 'Stone came by boat along the river'),
])
