# A magnetic compass. The needle is a tiny magnet balanced on a pivot: its
# red end turns to point north, so you can find every other direction on the
# compass rose. In the loop the needle wobbles gently as it settles.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
case = mat('#c9a464', rough=0.25, metal=0.85, rim=0.2)
face = mat('#d9d3c3', rough=0.6)
ink = mat('#1a2240', rough=0.5)
red = mat('#fb5a6e', rough=0.3, rim=0.3)
white = mat('#e9eeff', rough=0.3, rim=0.2)
rose1 = mat('#5b8cff', rough=0.5)
rose2 = mat('#9fb8ff', rough=0.5)
glass = mat('#dff1ff', rough=0.03, alpha=0.1, rim=0.5)
R = 2.0
floor(4.5, -0.25, opacity=0.5)
torus(R + 0.12, 0.16, case, seg=96, ring=24)
cyl(R + 0.25, 0.22, case, verts=96, loc=(0, 0, -0.14))
cyl(R + 0.02, 0.06, face, verts=96, loc=(0, 0, -0.02))
for k in range(72):
    a = math.pi / 2 - TAU * k / 72
    big = k % 9 == 0
    L = 0.2 if big else 0.1
    p = Vector((math.cos(a), math.sin(a), 0))
    box((0.03 if big else 0.015, L, 0.01), ink, loc=p * (R - 0.1 - L / 2) + Vector((0, 0, 0.015)), rot=(0, 0, a - math.pi / 2))
# the compass rose: an 8-pointed star
for k in range(8):
    a = math.pi / 2 - TAU * k / 8
    L = 1.35 if k % 2 == 0 else 0.85
    w = 0.22 if k % 2 == 0 else 0.16
    for s, m in ((1, rose1), (-1, rose2)):
        tri = [(0, 0), (L * math.cos(a), L * math.sin(a)), (w * math.cos(a + s * math.pi / 2), w * math.sin(a + s * math.pi / 2))]
        prism(tri, 0.01, m, loc=(0, 0, 0.012 + (0.002 if k % 2 == 0 else 0)))
for txt, a in (('N', 90), ('E', 0), ('S', 270), ('W', 180)):
    p = Vector((math.cos(math.radians(a)), math.sin(math.radians(a)), 0)) * (R - 0.48)
    text(txt, 0.34, red if txt == 'N' else ink, loc=p + Vector((0, 0, 0.03)), rot=(0, 0, 0), extrude=0.01)
needle = empty('Needle', loc=(0, 0, 0.12))
prism([(-0.13, 0), (0, 1.55), (0.13, 0)], 0.04, red, parent=needle)
prism([(-0.13, 0), (0, -1.55), (0.13, 0)], 0.04, white, parent=needle)
cyl(0.1, 0.12, case, verts=24, loc=(0, 0, 0.16))
cyl(R + 0.05, 0.02, glass, verts=96, loc=(0, 0, 0.3))
cam = camera((0.0, -5.8, 6.6), (0, 0.15, 0), lens=44)
lights((0, 0, 0), power=0.6)


def wobble_needle(t):
    needle.rotation_euler = (0, 0, math.radians(7) * math.sin(TAU * t) * (0.6 + 0.4 * math.cos(TAU * t)))


finish('compass', 'A magnetic compass', ['compass', 'magnetism', 'north', 'directions', 'compass rose', 'navigation', 'maps', 'magnetic field', 'geography'], [
    P('Needle', (needle, (0, -0.9, 0.03)), 'A tiny magnet that can swing freely'),
    P('North end', (needle, (0, 1.2, 0.03)), 'The red end points to magnetic north'),
    P('Compass rose', (0.62, -0.62, 0.02), 'Shows north, east, south and west'),
    P('Degree marks', (math.cos(math.radians(30)) * (R - 0.15), math.sin(math.radians(30)) * (R - 0.15), 0.02), '360 degrees all the way round'),
    P('Pivot', (0, 0, 0.22), 'The needle balances and turns on this point'),
    P('Case', (-R - 0.2, -0.1, 0.05), 'Keeps the needle level and safe'),
], anim=wobble_needle)
