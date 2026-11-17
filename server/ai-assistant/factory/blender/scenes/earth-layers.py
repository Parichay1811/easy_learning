# The Earth cut open: the thin rocky crust, the mantle (upper and lower),
# the liquid outer core and the solid inner core. Thicknesses are to scale:
# crust about 1% of the radius (drawn a little thicker so it shows),
# mantle to 55%, outer core to 19%.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
R = 2.0
crustcut = mat('#8b6b4a', rough=0.8, rim=0)
um = mat('#e8663a', rough=0.7, rim=0.1)
lm = mat('#c2412d', rough=0.7, rim=0.1)
oc = mat('#ff9f43', rough=0.5, emit=1.2)
ic = mat('#ffe08a', rough=0.4, emit=3.0)


def octant(m, e=0.0, s=6):
    return box((s, s, s), m, loc=(s / 2 + e, -s / 2 - e, s / 2 + e))


earth = sphere(R, earthmat(), seg=128, rings=64)
cut(earth, octant(crustcut))
upper = sphere(R * 0.965, um, seg=96, rings=48)
cut(upper, octant(um, 0.006))
lower = sphere(R * 0.8, lm, seg=96, rings=48)
cut(lower, octant(lm, 0.012))
outer = sphere(R * 0.55, oc, seg=96, rings=48)
cut(outer, octant(oc, 0.018))
inner = sphere(R * 0.19, ic, seg=64, rings=32)
# clouds of atmosphere: a faint shell

cam = camera((5.8, -7.4, 4.6), (0.1, -0.1, 0.05), lens=55)
lights((0, 0, 0), rim='#5b8cff')
d = Vector((1, -1, 1)).normalized()
finish('earth-layers', "Layers of the Earth", ['earth layers', 'structure of the earth', 'crust', 'mantle', 'outer core', 'inner core', 'geology', 'planet earth'], [
    P('Crust', (-1.2, -1.5, 0.45), 'Thin rocky skin we live on: 5 to 70 km thick'),
    P('Upper mantle', (0.02, -1.62, 0.9), 'Hot, slowly flowing rock'),
    P('Lower mantle', (0.03, -1.2, 0.6), 'Solid but very hot rock, down to 2,900 km'),
    P('Outer core', (0.04, -0.7, 0.45), 'Liquid iron and nickel: makes the magnetic field'),
    P('Inner core', (0.05, -0.2, 0.25), 'Solid iron ball, as hot as the Sun\'s surface'),
], )
