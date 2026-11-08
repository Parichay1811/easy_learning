# An analogue clock showing half past three (3:30). The short hand shows the
# hour (halfway between 3 and 4); the long hand shows the minutes (on the 6
# means 30 minutes); the thin hand counts the seconds.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
rimm = mat('#5b8cff', rough=0.3, metal=0.4, rim=0.3)
face = mat('#f4f7ff', rough=0.5, rim=0.05)
ink = mat('#1a2240', rough=0.5)
hourm = mat('#1a2240', rough=0.4, rim=0.2)
minm = mat('#2b3a78', rough=0.4, rim=0.2)
secm = mat('#fb7185', rough=0.4, emit=0.6)
glass = mat('#dff1ff', rough=0.05, alpha=0.08, rim=0.4)
R = 2.0
clk = empty('Clock', rot=(math.pi / 2, 0, 0))   # face towards -y
torus(R + 0.08, 0.16, rimm, seg=96, ring=24, parent=clk)
cyl(R + 0.02, 0.12, face, verts=96, loc=(0, 0, -0.06), parent=clk)
for k in range(60):
    a = math.pi / 2 - TAU * k / 60
    big = k % 5 == 0
    L = 0.22 if big else 0.1
    p = Vector((math.cos(a), math.sin(a), 0))
    b = box((0.05 if big else 0.022, L, 0.01), ink, loc=p * (R - 0.12 - L / 2) + Vector((0, 0, 0.005)), rot=(0, 0, a - math.pi / 2), parent=clk)
for h in range(1, 13):
    a = math.pi / 2 - TAU * h / 12
    p = Vector((math.cos(a), math.sin(a), 0)) * (R - 0.6)
    text(str(h), 0.34, ink, loc=p + Vector((0, 0, 0.01)), rot=(0, 0, 0), extrude=0.01, parent=clk)


def hand(angle, L, w, m, z, tail=0.25):
    g = empty('Hand', rot=(0, 0, angle), loc=(0, 0, z), parent=clk)
    prism([(-w, -tail), (w, -tail), (w * 0.6, L), (0, L + w * 1.5), (-w * 0.6, L)], 0.03, m, parent=g)
    return g


H, M, S = 3, 30, 8
ha = -TAU * ((H % 12) + M / 60) / 12
ma = -TAU * M / 60
sa = -TAU * S / 60
hh = hand(ha, R * 0.5, 0.08, hourm, 0.03)
mh = hand(ma, R * 0.76, 0.055, minm, 0.07)
sh = hand(sa, R * 0.84, 0.015, secm, 0.11, tail=0.4)
cyl(0.1, 0.1, secm, verts=24, loc=(0, 0, 0.13), parent=clk)
cyl(R, 0.02, glass, verts=96, loc=(0, 0, 0.2), parent=clk)

cam = camera((0.0, -8.0, 0.4), (0, 0, 0.0), lens=50)
lights((0, 0, 0))
bpy.context.view_layer.update()
finish('clock', 'An analogue clock (3:30)', ['clock', 'telling the time', 'time', 'hour hand', 'minute hand', 'half past', 'analogue clock', 'maths'], [
    P('Hour hand', (hh, (0, R * 0.32, 0)), 'Short hand: halfway between 3 and 4'),
    P('Minute hand', (mh, (0, R * 0.55, 0)), 'Long hand on the 6: 30 minutes past'),
    P('Second hand', (sh, (0, R * 0.7, 0)), 'Thin hand: goes round once a minute'),
    P('Twelve', (clk, (0, R - 0.6, 0.02)), 'The top: the start of each hour'),
    P('Minute marks', (clk, (math.cos(math.radians(70)) * (R - 0.15), math.sin(math.radians(70)) * (R - 0.15), 0.01)), '60 small marks, one for each minute'),
])
