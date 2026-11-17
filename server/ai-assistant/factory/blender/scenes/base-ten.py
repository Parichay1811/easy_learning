# Base-ten blocks showing 1,234: one thousand-cube, two hundred-flats,
# three ten-rods and four ones. Ten of each block make the next one up.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
u = 0.16          # one small cube
g = 0.012         # gap so the grid shows
cube1 = box((u - g, u - g, u - g), mat('#fbbf24', rough=0.4, rim=0.3), bevel=0.012, seg=2)


def block(nx, ny, nz, color, loc, name):
    m = mat(color, rough=0.4, rim=0.3)
    mats = [place((loc[0] + (i + 0.5) * u, loc[1] + (j + 0.5) * u, loc[2] + (k + 0.5) * u)) for i in range(nx) for j in range(ny) for k in range(nz)]
    src = box((u - g, u - g, u - g), m, bevel=0.012, seg=2)
    return merge_instances(src, mats, name, m)


floor(5.0, 0, opacity=0.5)
th = block(10, 10, 10, '#ff9f43', (-3.3, -0.6, 0), 'Thousand')
for k in range(2):
    block(10, 1, 10, '#5b8cff', (-1.25 + k * 0.32, -0.6, 0), 'Hundred')
rods = []
for k in range(3):
    rods.append(block(1, 1, 10, '#34d399', (0.55 + k * 0.32, -0.3, 0), 'Ten'))
ones = []
for k in range(4):
    ones.append(block(1, 1, 1, '#fbbf24', (1.75 + (k % 2) * 0.3, -0.2 + (k // 2) * 0.3, 0), 'One'))
bpy.data.objects.remove(cube1, do_unlink=True)

cam = camera((-0.6, -7.6, 3.5), (-0.75, 0.1, 0.6), lens=46)
lights((-0.6, 0, 0.6))
finish('base-ten', 'Base-ten blocks: 1,234', ['base ten', 'place value', 'thousands', 'hundreds', 'tens', 'ones', 'counting', 'numbers', 'maths'], [
    P('Thousand', (-2.5, -0.62, 1.0), '1 cube = 1,000: ten hundreds stacked up'),
    P('Hundreds', (-1.0, -0.62, 1.0), '2 flats = 200: each is ten tens side by side'),
    P('Tens', (0.71, -0.31, 1.2), '3 rods = 30: each is ten ones in a row'),
    P('Ones', (1.98, -0.21, 0.16), '4 small cubes = 4'),
])
