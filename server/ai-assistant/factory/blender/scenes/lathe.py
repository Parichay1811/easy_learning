# A centre lathe turning a steel bar. The headstock's spindle spins the
# chuck, whose three jaws grip the workpiece; the tailstock's centre
# supports the far end. A single-point cutting tool, clamped in the tool
# post on the carriage, is fed along the bed by the lead screw and peels
# a chip off the spinning bar, so its diameter gets smaller.
# In the loop the chuck and workpiece spin.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
AX = (0, math.pi / 2, 0)
body = mat('#3f7d6b', rough=0.5, metal=0.2, rim=0.2)
body2 = mat('#356a5b', rough=0.55, metal=0.2, rim=0.15)
ways = mat('#d6dbe8', rough=0.25, metal=0.9, rim=0.1)
steel = mat('#cfd5e2', rough=0.2, metal=0.95)
darks = mat('#2a2f3d', rough=0.4, metal=0.6)
workm = mat('#dfe4ee', rough=0.3, metal=0.55, rim=0.2)
toolm = mat('#ffcf4a', rough=0.3, metal=0.6, rim=0.2)
chipm = mat('#6d8cff', rough=0.25, metal=0.9, rim=0.3)
redm = mat('#e5484d', rough=0.4, rim=0.2)
ZC = 0.95                                  # spindle centre height above the bed top


def xcyl(r, length, m, x, y=0.0, z=ZC, verts=48, **kw):
    return cyl(r, length, m, verts=verts, loc=(x, y, z), rot=AX, **kw)


def wheel(loc, r, rot, m=steel):
    g = empty('Wheel', loc=loc, rot=rot)
    torus(r, 0.035, m, seg=48, ring=10, parent=g)
    cyl(0.07, 0.12, m, verts=24, parent=g)
    for k in range(3):
        a = TAU * k / 3
        tube([(0, 0, 0), (r * math.cos(a), r * math.sin(a), 0)], 0.022, m, parent=g)
    a = 0.3
    cyl(0.03, 0.2, redm, verts=12, loc=(r * math.cos(a), r * math.sin(a), 0.1), parent=g)
    return g


# stand, chip tray and bed with its ways
for x in (-2.45, 2.35):
    box((1.0, 1.0, 1.8), body2, bevel=0.03, loc=(x, 0, -1.45))
box((6.4, 1.3, 0.1), darks, loc=(0, 0, -0.62))
box((6.2, 1.0, 0.55), body, bevel=0.03, loc=(0, 0, -0.27))
for y in (-0.33, 0.33):
    box((6.2, 0.12, 0.07), ways, loc=(0, y, 0.035))
# lead screw and feed rod along the front of the bed
xcyl(0.045, 6.0, steel, 0.0, -0.56, -0.18)
xcyl(0.035, 6.0, steel, 0.0, -0.56, -0.38)
pts = [(-3.0 + 6.0 * i / 600, -0.56 + 0.05 * math.cos(i * 0.9), -0.18 + 0.05 * math.sin(i * 0.9)) for i in range(601)]
tube(pts, 0.012, steel)
# headstock with gear cover and levers
box((1.25, 1.05, 1.45), body, bevel=0.05, loc=(-2.42, 0, 0.72))
box((0.25, 1.15, 1.35), body2, bevel=0.04, loc=(-3.15, 0, 0.62))
for k, (x, z) in enumerate(((-2.75, 1.1), (-2.4, 1.1), (-2.05, 1.1), (-2.6, 0.5))):
    tube([(x, -0.52, z), (x, -0.75, z + 0.12)], 0.022, steel)
    sphere(0.06, darks if k < 3 else redm, seg=16, rings=8, loc=(x, -0.77, z + 0.13))
xcyl(0.3, 0.2, body2, -1.72)
# chuck, jaws and workpiece (spin together)
spin = empty('Spindle', loc=(0, 0, ZC))
xcyl(0.5, 0.32, steel, -1.48, z=0).parent = spin
xcyl(0.52, 0.06, darks, -1.62, z=0).parent = spin
for k in range(3):
    a = TAU * k / 3 + math.pi / 2
    j = empty('Jaw', rot=(a, 0, 0), parent=spin)
    box((0.12, 0.12, 0.2), darks, loc=(-1.28, 0, 0.32), parent=j)
    box((0.12, 0.12, 0.14), darks, loc=(-1.18, 0, 0.26), parent=j)
    cyl(0.035, 0.05, steel, verts=12, loc=(-1.31, 0, 0.42), rot=AX, parent=j)
xt = 0.35                                  # where the tool is cutting
xcyl(0.2, xt + 1.3, workm, (-1.3 + xt) / 2, z=0).parent = spin
xcyl(0.155, 1.45 - xt, workm, (xt + 1.45) / 2, z=0).parent = spin
cone(0.2, 0.045, workm, verts=48, loc=(xt + 0.01, 0, 0), rot=(0, -math.pi / 2, 0), parent=spin)
for k in range(2):                         # flats, so the turning shows
    box((0.6, 0.02, 0.06), mat('#9aa3b8', rough=0.4, metal=0.8), loc=(-0.7, 0, 0.19 if k == 0 else -0.19), parent=spin)
# tailstock: body, quill, live centre and handwheel
box((0.75, 0.75, 0.75), body, bevel=0.04, loc=(2.25, 0, 0.42))
box((0.85, 0.95, 0.12), body2, bevel=0.02, loc=(2.25, 0, 0.13))
xcyl(0.2, 0.6, body, 2.15, z=ZC)
xcyl(0.12, 0.45, steel, 1.75, z=ZC)
cone(0.12, 0.2, steel, verts=32, loc=(1.48, 0, ZC), rot=(0, -math.pi / 2, 0))
wheel((2.7, 0, ZC), 0.24, AX)
# carriage: saddle, apron, cross-slide, compound, tool post and tool
box((0.9, 1.15, 0.16), body, bevel=0.02, loc=(xt + 0.2, 0, 0.15))
box((0.85, 0.18, 0.7), body2, bevel=0.03, loc=(xt + 0.2, -0.62, -0.2))
wheel((xt + 0.05, -0.75, -0.1), 0.2, (math.pi / 2, 0, 0))
box((0.6, 0.85, 0.14), body, bevel=0.02, loc=(xt + 0.2, -0.05, 0.3))
box((0.45, 0.45, 0.12), body2, bevel=0.02, loc=(xt + 0.2, -0.25, 0.43))
post = box((0.3, 0.3, 0.3), darks, bevel=0.02, loc=(xt + 0.2, -0.38, 0.64))
toolz = ZC - 0.03
box((0.09, 0.5, 0.09), toolm, loc=(xt + 0.05, -0.45, toolz))
prism([(-0.045, 0), (0.045, 0), (-0.04, 0.05)], 0.09, toolm, loc=(xt + 0.05, -0.2, toolz))
cyl(0.04, 0.16, steel, verts=12, loc=(xt + 0.12, -0.42, 0.85))
wheel((xt + 0.2, -0.62, 0.3), 0.14, (math.pi / 2, 0, 0))
# the chip curling off the tool tip
chip = [(xt + 0.02 + 0.02 * i / 40, -0.17 - 0.12 * math.sin(i * 0.33) * (i / 40), toolz + 0.06 + 0.12 * (1 - math.cos(i * 0.33)) * (i / 40)) for i in range(41)]
tube(chip, 0.012, chipm, kind='POLY')
floor(7.5, -2.36)

cam = camera((-1.6, -8.8, 3.9), (0.05, 0, 0.15), lens=40)
lights((0, 0, 0.3), power=0.85, rim='#5b8cff')


def run(t):
    spin.rotation_euler = (TAU * 2 * t, 0, 0)


finish('lathe', 'A centre lathe', ['lathe', 'centre lathe', 'center lathe', 'turning', 'machining', 'chuck', 'tailstock', 'headstock', 'cutting tool', 'machine tool', 'manufacturing', 'workshop', 'production engineering', 'mechanical engineering'], [
    P('Headstock', (-2.42, -0.53, 0.8), 'Holds the motor-driven spindle and speed gears'),
    P('Chuck', (-1.48, -0.5, ZC - 0.1), 'Three jaws grip the workpiece and spin it'),
    P('Workpiece', (-0.55, -0.2, ZC), 'The bar being turned to a smaller diameter'),
    P('Cutting tool', (xt + 0.05, -0.3, toolz + 0.05), 'A hard tool bit that peels a chip off the bar'),
    P('Carriage', (xt + 0.2, -0.72, -0.25), 'Feeds the tool along the bed'),
    P('Tailstock', (2.25, -0.38, 0.5), 'Its centre supports the far end of the bar'),
    P('Bed and ways', (-1.0, -0.33, 0.07), 'Precise rails that guide the carriage'),
    P('Lead screw', (-0.9, -0.6, -0.18), 'Turns to move the carriage at a set feed'),
], anim=run)
