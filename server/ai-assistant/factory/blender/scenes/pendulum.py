# A pendulum: a bob on a string swinging from a pivot. It is fastest at the
# bottom and stops for an instant at each end of its swing; the time for one
# swing depends on the string's length, not on the bob's weight.
# In the loop it swings back and forth (two full swings).
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
wood = mat('#8a5a3b', rough=0.6, rim=0.2)
metal = mat('#c9d2e8', rough=0.25, metal=0.9)
string = mat('#e9eeff', rough=0.5, emit=0.3)
bobm = mat('#ff9f43', rough=0.25, metal=0.6, rim=0.35)
arcm = mat('#5b8cff', rough=0.5, emit=1.0, alpha=0.8)
ghost = mat('#ff9f43', alpha=0.25, emit=0.6)
L = 3.2
A = math.radians(30)
P0 = Vector((0, 0, 3.6))
floor(4.0, 0, opacity=0.5)
box((0.4, 0.8, 0.2), wood, bevel=0.03, loc=(-2.7, 0, 0.1))
tube([(-2.7, 0, 0.2), (-2.7, 0, 3.75)], 0.07, wood)
tube([(-2.75, 0, 3.75), (0.25, 0, 3.75)], 0.07, wood)
cyl(0.06, 0.3, metal, verts=24, loc=P0, rot=(math.pi / 2, 0, 0))
arm = empty('Arm', loc=P0)
tube([(0, 0, 0), (0, 0, -L)], 0.012, string, parent=arm)
bob = sphere(0.28, bobm, seg=48, rings=24, loc=(0, 0, -L - 0.2), parent=arm)
# the swing's path and the two end positions, faint
tube([tuple(P0 + Vector((math.sin(a) * (L + 0.2), 0.0, -math.cos(a) * (L + 0.2)))) for a in [-A + 2 * A * i / 40 for i in range(41)]], 0.015, arcm)
for s in (-1, 1):
    sphere(0.28, ghost, seg=32, rings=16, loc=P0 + Vector((math.sin(s * A) * (L + 0.2), 0.05, -math.cos(A) * (L + 0.2))))
    tube([tuple(P0), tuple(P0 + Vector((math.sin(s * A) * L, 0.05, -math.cos(A) * L)))], 0.006, ghost)
tube([tuple(P0), tuple(P0 + Vector((0, 0.05, -L - 0.48)))], 0.005, mat('#8b95b5', emit=0.4, alpha=0.6))

cam = camera((-0.3, -9.2, 2.2), (-0.5, 0, 1.9), lens=46)
lights((0, 0, 2.0))


def swing(t):
    arm.rotation_euler = (0, -A * math.cos(TAU * 2 * t) * -1, 0)


finish('pendulum', 'A pendulum', ['pendulum', 'swing', 'oscillation', 'gravity', 'energy', 'time period', 'clock', 'forces', 'physics'], [
    P('Pivot', P0 + Vector((0, -0.2, 0)), 'The fixed point it swings from'),
    P('String', (arm, (0, -0.02, -L * 0.45)), 'Its length sets how long each swing takes'),
    P('Bob', bob, 'The weight on the end'),
    P('End of swing', tuple(P0 + Vector((math.sin(A) * (L + 0.2), -0.2, -math.cos(A) * (L + 0.2)))), 'It stops for an instant, then swings back'),
    P('Lowest point', tuple(P0 + Vector((0, -0.1, -L - 0.5))), 'The bob moves fastest here'),
], anim=swing)
