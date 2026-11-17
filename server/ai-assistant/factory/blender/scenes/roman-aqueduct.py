# A Roman aqueduct bridge in three tiers of arches, like the Pont du Gard in
# France (built about 2,000 years ago). Water flowed in a covered channel
# along the top, sloping down very gently all the way to the town.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
stone = brickmat(scale=1.6, name='Stone')
stonecut = mat('#c9b48a', rough=0.85)
waterm = mat('#3b8fe8', rough=0.2, emit=0.4, rim=0.3)
grass = mat('#4c9a4a', rough=0.85, rim=0.1)
riverm = mat('#2f7fe0', rough=0.65, alpha=0.9, rim=0.15)
rockm = mat('#a8946e', rough=0.9)


def tier(z0, h, n, span, pier, depth, r):
    L = n * span
    wall = box((L, depth, h), stone, loc=(0, 0, z0 + h / 2))
    for k in range(n):
        x = -L / 2 + span * (k + 0.5)
        hole = cyl(r, depth + 0.4, stonecut, verts=48, loc=(x, 0, z0 + h - r - (h - 2 * r) * 0.15 - 0.12), rot=(math.pi / 2, 0, 0))
        legs = box((2 * r, depth + 0.4, z0 + h - r - 0.12 - z0 + 0.02), stonecut, loc=(x, 0, (z0 + z0 + h - r - (h - 2 * r) * 0.15 - 0.12) / 2))
        cut(wall, hole)
        cut(wall, legs)
    return wall


t1 = tier(0.0, 2.2, 6, 1.6, 0.4, 0.9, 0.6)
t2 = tier(2.2, 1.8, 6, 1.6, 0.4, 0.75, 0.6)
t3 = tier(4.0, 0.7, 18, 1.6 / 3, 0.12, 0.6, 0.18)
chan = box((9.6, 0.6, 0.35), stone, loc=(0, 0, 4.88))
cut(chan, box((9.8, 0.3, 0.3), stonecut, loc=(0, 0, 5.0)))
water = box((9.6, 0.28, 0.12), waterm, loc=(0, 0, 4.92))
# valley: river and banks
box((14, 6, 0.2), riverm, loc=(0, 0, -0.15))
def valley(x, y):
    d = abs(x) - 4.75
    return -0.4 if d < 0 else min(5.4, 2.2 * d ** 1.3) + 0.15 * noise.noise(Vector((x * 0.7, y * 0.7, 0)))


terrain((17, 6), (170, 60), valley, lambda x, y, z: '#4c9a4a' if z > 4.9 or z < 0.6 else mix('#9a8a64', '#7d8f4c', z / 5.4), name='Valley', m=vcolmat(rough=0.9, name='ValleyMat'))

cam = camera((3.4, -12.6, 6.0), (0.0, 0, 2.5), lens=40)
lights((0, 0, 2.4), key='#ffe2b8')
finish('roman-aqueduct', 'A Roman aqueduct', ['aqueduct', 'romans', 'ancient rome', 'arch', 'pont du gard', 'engineering', 'water supply', 'history'], [
    P('Water channel', (-1.5, -0.2, 4.95), 'Water flowed along the top, sloping gently down'),
    P('Small arches', (2.1, -0.32, 4.4), 'The top tier: many small arches carry the channel'),
    P('Arch', (-2.4, -0.45, 3.2), 'An arch carries weight round to its legs'),
    P('Pier', (-3.2, -0.48, 0.9), 'Thick stone legs set on rock'),
    P('Keystone', (-0.8, -0.46, 1.95), 'The top stone that locks the arch together'),
    P('River', (0.0, -2.2, 0.0), 'The aqueduct crosses the valley high above it'),
])
