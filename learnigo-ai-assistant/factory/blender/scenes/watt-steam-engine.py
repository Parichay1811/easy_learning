# A Boulton and Watt rotative beam engine (1780s), the engine of the
# Industrial Revolution. Steam pushes the piston in the cylinder (cut open
# here); the great beam rocks on its pivot. Watt's parallel motion keeps the
# piston rod moving in a straight line, and his separate condenser, in a
# tank of cold water beside the cylinder, condenses the used steam so the
# cylinder can stay hot. The sun-and-planet gears turn the beam's rocking
# into rotation (the flywheel turns twice per stroke), and the centrifugal
# governor's balls fly out when it speeds up, to close the steam valve.
# In the loop the engine runs.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
iron = mat('#4a5068', rough=0.45, metal=0.7, rim=0.2)
ironl = mat('#6b7390', rough=0.4, metal=0.7, rim=0.2)
brass = mat('#d8b04a', rough=0.3, metal=0.85, rim=0.2)
timber = mat('#7a5534', rough=0.7, rim=0.1)
brickm = brickmat('#9a5a3e', '#8a4c34', '#5a3426', scale=2.6, name='Brick')
stone = mat('#9c927c', rough=0.85, rim=0.1)
steel = mat('#cfd5e2', rough=0.25, metal=0.9)
cutm = mat('#a9b0c4', rough=0.5, metal=0.4)
waterm = mat('#3b82f6', rough=0.15, alpha=0.75, rim=0.2)
steamp = mat('#c9a06a', rough=0.5, metal=0.5, rim=0.2)
AXY = (math.pi / 2, 0, 0)             # a z-standing cylinder turned to lie along y

O = Vector((0.0, 0.0, 4.7))           # beam pivot
LH = 2.4                              # half length of the beam
S = Vector((LH, 0.0, 1.9))            # sun gear (flywheel shaft) centre
RQ, LC = 0.5, 2.8                     # planet orbit radius, connecting rod length
F = Vector((-2 * LH, 0.0, O.z - 0.8)) # radius-rod pivot (Watt's linkage)
CL = 0.8                              # link length


def solve_theta(phi):
    q = S + RQ * Vector((math.cos(phi), 0, math.sin(phi)))
    lo, hi = -0.7, 0.7
    for _ in range(50):
        th = (lo + hi) / 2
        r = O + LH * Vector((math.cos(th), 0, math.sin(th)))
        if (r - q).length > LC:
            hi = th
        else:
            lo = th
    return (lo + hi) / 2, q


def linkage(th):
    a = O + LH * Vector((-math.cos(th), 0, -math.sin(th)))
    # B on the circle about F (radius LH) at distance CL from A, below A
    d = (a - F).length
    x = (d * d + LH * LH - CL * CL) / (2 * d)
    h = math.sqrt(max(0.0, LH * LH - x * x))
    u = (a - F) / d
    perp = Vector((-u.z, 0, u.x))
    b1, b2 = F + u * x + perp * h, F + u * x - perp * h
    b = b1 if b1.z < b2.z else b2
    return a, b, (a + b) / 2


# foundations, the bob wall under the pivot, the post for the radius rod
box((10.8, 3.6, 0.3), stone, loc=(0.2, 0.3, -0.15))
box((0.7, 1.2, O.z - 0.25), brickm, loc=(0.0, 0.25, (O.z - 0.25) / 2))
box((0.6, 0.6, 0.25), iron, bevel=0.03, loc=(0.0, 0.0, O.z - 0.2))
box((0.3, 0.3, F.z + 0.1), timber, loc=(F.x - 0.25, 0.0, (F.z + 0.1) / 2))
box((0.5, 0.2, 0.12), iron, loc=(F.x - 0.1, 0.0, F.z))
# cylinder (front quarter cut away) on its base, valve chest and steam pipe
cx = -LH
box((1.3, 1.3, 1.5), stone, loc=(cx, 0.0, 0.75))
cylo = cyl(0.55, 2.1, iron, verts=64, loc=(cx, 0, 2.55))
cut(cylo, cyl(0.45, 2.3, cutm, verts=64, loc=(cx, 0, 2.55)))
cut(cylo, box((1.4, 1.4, 2.4), cutm, loc=(cx - 0.7, -0.7, 2.55)))
cap = cyl(0.62, 0.12, iron, verts=64, loc=(cx, 0, 3.66))
cut(cap, box((1.4, 1.4, 0.4), cutm, loc=(cx - 0.7, -0.7, 3.66)))
cyl(0.62, 0.12, iron, verts=64, loc=(cx, 0, 1.56))
cyl(0.12, 0.25, brass, verts=24, loc=(cx, 0, 3.82))
box((0.35, 0.5, 1.9), ironl, bevel=0.03, loc=(cx + 0.65, 0.25, 2.6))
tube([(cx + 0.65, 0.3, 3.55), (cx + 0.65, 0.5, 3.9), (cx + 0.2, 1.0, 3.95), (-5.4, 1.0, 3.95)], 0.12, steamp, kind='BEZIER')
piston = empty('Piston', loc=(cx, 0, 2.6))
cyl(0.445, 0.25, steel, verts=64, parent=piston)
for k in range(2):
    torus(0.445, 0.012, iron, seg=64, ring=6, loc=(0, 0, 0.06 - 0.12 * k), parent=piston)
rod = tube([(0, 0, 0), (0, 0, 1.75)], 0.05, steel, parent=piston)
# separate condenser and air pump in a cistern of cold water
kx = -0.95
cis = box((1.2, 1.3, 1.1), timber, loc=(kx, -0.1, 0.55))
cut(cis, box((1.1, 1.2, 1.1), timber, loc=(kx, -0.1, 0.65)))
cut(cis, box((1.3, 0.2, 0.9), timber, loc=(kx, -0.75, 0.7)))
box((1.08, 1.18, 0.82), waterm, loc=(kx, -0.1, 0.51))
cond = cyl(0.2, 0.75, ironl, verts=40, loc=(kx - 0.25, -0.1, 0.5))
pump = cyl(0.22, 0.85, ironl, verts=40, loc=(kx + 0.27, -0.1, 0.55))
tube([(cx + 0.4, -0.1, 1.2), (kx - 0.5, -0.1, 1.0), (kx - 0.25, -0.1, 0.9)], 0.07, iron, kind='BEZIER')
pr = empty('PumpRod', loc=(kx + 0.27, -0.1, 1.0))
tube([(0, 0, 0), (0, 0, 3.9)], 0.035, steel, parent=pr)
# the beam (rocks about O): timber with iron straps
beam = empty('Beam', loc=tuple(O))
box((2 * LH + 0.3, 0.3, 0.5), timber, bevel=0.02, parent=beam)
for x in (-LH, -1.2, -0.3, 0.3, 1.2, LH):
    box((0.08, 0.34, 0.54), iron, loc=(x, 0, 0), parent=beam)
cyl(0.1, 0.5, steel, verts=24, rot=AXY, parent=beam)
# links of the parallel motion and the radius rod (moved each frame)
link_a = tube([(0, 0, 0), (0, 0, 1)], 0.04, ironl)
radius = tube([(0, 0, 0), (1, 0, 0)], 0.045, ironl)
pump_link = tube([(0, 0, 0), (0, 0, 1)], 0.03, ironl)
crod = tube([(0, 0, 0), (0, 0, 1)], 0.07, iron)
# sun-and-planet gears and the flywheel


def gear(r, n, th, m, parent=None, loc=(0, 0, 0)):
    pts = []
    for i in range(n * 4):
        a = TAU * i / (n * 4)
        rr = r + (0.06 if i % 4 in (1, 2) else -0.04)
        pts.append((rr * math.cos(a), rr * math.sin(a)))
    return prism(pts, th, m, loc=loc, rot=AXY, parent=parent)


sun_g = empty('Sun', loc=tuple(S))
gear(RQ / 2, 14, 0.14, brass, parent=sun_g)
planet = empty('Planet')
gear(RQ / 2, 14, 0.14, brass, parent=planet)
fw = empty('Flywheel', loc=tuple(S + Vector((0, 0.75, 0))))
torus(1.45, 0.11, iron, seg=96, ring=12, rot=AXY, parent=fw)
cyl(0.18, 0.3, iron, verts=24, rot=AXY, parent=fw)
for k in range(6):
    a = TAU * k / 6
    tube([(0.15 * math.cos(a), 0, 0.15 * math.sin(a)), (1.4 * math.cos(a), 0, 1.4 * math.sin(a))], 0.05, iron, parent=fw)
cyl(0.07, 2.0, steel, verts=24, loc=(0, 0.45, 0), rot=AXY, parent=sun_g)
for y in (-0.35, 1.3):
    box((0.35, 0.3, S.z - 0.05), stone, loc=(S.x, y, (S.z - 0.05) / 2))
# a pulley on the shaft drives the governor through a belt and bevel gears
cyl(0.22, 0.12, timber, verts=32, loc=(0, -0.48, 0), rot=AXY, parent=sun_g)
gx, gy = 3.75, -0.48
tube([(S.x, gy, S.z + 0.22), (gx, gy, 0.82), (gx, gy, 0.52), (S.x, gy, S.z - 0.22), (S.x, gy, S.z + 0.22)], 0.025, mat('#3a2a1e', rough=0.8), kind='POLY')
cyl(0.15, 0.1, timber, verts=24, loc=(gx, gy, 0.67), rot=AXY)
box((0.5, 0.5, 0.5), stone, loc=(gx, gy + 0.45, 0.25))
gov = empty('Governor', loc=(gx, gy + 0.45, 0.5))
tube([(0, 0, 0), (0, 0, 1.6)], 0.03, steel, parent=gov)
balls = []
for s in (-1, 1):
    arm = empty('Arm', loc=(0, 0, 1.5), rot=(0, s * 0.55, 0), parent=gov)
    tube([(0, 0, 0), (0, 0, -0.6)], 0.018, steel, parent=arm)
    balls.append(sphere(0.11, brass, seg=24, rings=12, loc=(0, 0, -0.65), parent=arm))
    tube([(s * 0.18, 0, 0.95), (s * 0.3, 0, 1.25)], 0.012, steel, parent=gov)
cone(0.06, 0.12, brass, verts=16, loc=(0, 0, 1.62), parent=gov)
cyl(0.07, 0.1, brass, verts=16, loc=(0, 0, 0.95), parent=gov)
floor(9.0, -0.31)

cam = camera((2.6, -12.6, 4.4), (0.25, 0, 2.55), lens=38)
lights((0, 0, 2.4), rim='#ff9f43', key='#ffe2b8')


def set_tube(ob, a, b):
    sp = ob.data.splines[0]
    sp.points[0].co = (a.x, a.y, a.z, 1)
    sp.points[1].co = (b.x, b.y, b.z, 1)


def run(t):
    phi = -math.pi / 2 + TAU * t
    th, q = solve_theta(phi)
    beam.rotation_euler = (0, -th, 0)
    a, b, m = linkage(th)
    set_tube(link_a, a + Vector((0, -0.2, 0)), b + Vector((0, -0.2, 0)))
    set_tube(radius, F + Vector((0, -0.2, 0)), b + Vector((0, -0.2, 0)))
    piston.location = (m.x, 0, m.z - 1.75)
    pa = O + 0.68 * Vector((-math.cos(th), 0, -math.sin(th)))
    pr.location = (kx + 0.27, -0.1, pa.z - 3.9 - 0.05)
    set_tube(pump_link, pa + Vector((0, -0.2, 0)), Vector((kx + 0.27, -0.2, pa.z - 0.05)))
    r = O + LH * Vector((math.cos(th), 0, math.sin(th)))
    set_tube(crod, r + Vector((0, -0.25, 0)), q + Vector((0, -0.25, 0)))
    planet.location = tuple(q + Vector((0, -0.0, 0)))
    ang = math.atan2((r - q).z, (r - q).x)
    planet.rotation_euler = (0, -ang, 0)
    sun_g.rotation_euler = (0, -2 * phi, 0)
    fw.rotation_euler = (0, -2 * phi, 0)
    gov.rotation_euler = (0, 0, TAU * 3 * t)


run(0)
finish('watt-steam-engine', 'A Watt steam engine', ['steam engine', 'watt steam engine', 'james watt', 'beam engine', 'boulton and watt', 'separate condenser', 'parallel motion', 'sun and planet gear', 'centrifugal governor', 'flywheel', 'industrial revolution', 'history', 'thermodynamics', 'mechanical engineering'], [
    P('Beam', (beam, (0.9, -0.16, 0.1)), 'Rocks on its pivot, linking piston and wheel'),
    P('Cylinder', (cx - 0.3, -0.3, 2.0), 'Steam pushes the piston up and down inside'),
    P('Piston', (piston, (-0.2, -0.3, 0.0)), 'Driven by steam on alternate sides (double-acting)'),
    P('Parallel motion', (F.x + LH / 2, -0.2, F.z), "Watt's linkage keeps the piston rod straight"),
    P('Separate condenser', (kx - 0.25, -0.35, 0.6), 'Cold water condenses steam outside the hot cylinder'),
    P('Sun-and-planet gear', (S.x, -0.15, S.z - RQ / 2), 'Turns rocking into rotation, two turns per stroke'),
    P('Flywheel', (S.x - 1.0, 0.65, S.z + 1.0), 'A heavy wheel that keeps the turning smooth'),
    P('Governor', (gx + 0.3, gy + 0.45, 1.25), 'Spinning balls fly out to close the steam valve'),
], anim=run)
