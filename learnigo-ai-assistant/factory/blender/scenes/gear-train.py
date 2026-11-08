# A gear train: the big driver gear (24 teeth) turns a small gear (12 teeth)
# twice as fast the other way, which turns a third gear (18 teeth) the same
# way as the driver. Teeth lock together so no turning is lost. In the loop
# the gears turn (6 teeth pass each mesh).
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
MOD = 0.16
board = mat('#1e2a52', rough=0.6, rim=0.1)
axlem = mat('#c9d2e8', rough=0.3, metal=0.8)
arrowm = glowmat('#fbbf24', 2.5)


def gear(N, m, thick=0.3):
    rp = MOD * N / 2
    ra, rd = rp + MOD, rp - 1.25 * MOD
    pts = []
    for k in range(N):
        a0 = TAU * k / N
        w = TAU / N
        for f, rr in ((-0.5, rd), (-0.3, rd), (-0.17, ra), (0.17, ra), (0.3, rd), (0.5, rd)):
            pts.append((rr * math.cos(a0 + f * w), rr * math.sin(a0 + f * w)))
    ob = prism(pts[:-1] if False else pts, thick, m)
    bevel(ob, 0.015, 2)
    cut(ob, cyl(0.1, thick + 0.2, m, verts=32))
    for k in range(5 if N > 14 else 0):   # spokes: cut windows
        a = TAU * k / 5
        cut(ob, cyl(rp * 0.22, thick + 0.2, m, verts=32, loc=(rp * 0.55 * math.cos(a), rp * 0.55 * math.sin(a), 0)))
    return ob, rp


box((7.6, 6.0, 0.1), board, bevel=0.05, loc=(0, 0, -0.35))
spec = [(24, '#5b8cff'), (12, '#ff9f43'), (18, '#34d399')]
G = []
for N, c in spec:
    ob, rp = gear(N, mat(c, rough=0.35, metal=0.35, rim=0.35))
    G.append([ob, rp, N, 0.0])
C1 = Vector((-1.45, -0.2, 0))
C2 = C1 + Vector((G[0][1] + G[1][1], 0, 0))
d23 = Vector((math.cos(math.radians(55)), math.sin(math.radians(55)), 0))
C3 = C2 + d23 * (G[1][1] + G[2][1])
for g, c in zip(G, (C1, C2, C3)):
    g[0].location = c
    cyl(0.1, 0.7, axlem, verts=24, loc=c + Vector((0, 0, -0.05)))
    cyl(0.2, 0.06, axlem, verts=32, loc=c + Vector((0, 0, 0.18)))
# phases so the teeth mesh: tooth of gear 1 on the line to gear 2, a gap of gear 2 facing back
a12 = 0.0
G[0][3] = a12
G[1][3] = math.pi + math.pi / 12
a23 = math.radians(55)
delta = (a23 - G[1][3]) % (TAU / 12)
G[2][3] = a23 + math.pi + math.pi / 18 - delta * 12 / 18
# curved arrows showing which way each turns
for c, rp, sgn, z in ((C1, G[0][1], 1, 0.3), (C2, G[1][1], -1, 0.3), (C3, G[2][1], 1, 0.3)):
    R = rp + 0.38
    a0 = math.radians(200) if c is not C2 else math.radians(250)
    pts = [tuple(c + Vector((R * math.cos(a0 + sgn * 0.9 * i / 10), R * math.sin(a0 + sgn * 0.9 * i / 10), z))) for i in range(11)]
    tube(pts, 0.035, arrowm)
    tip, prev = Vector(pts[-1]), Vector(pts[-2])
    cn = cone(0.1, 0.24, arrowm, verts=20, loc=tip)
    cn.rotation_euler = (tip - prev).to_track_quat('Z', 'Y').to_euler()

cam = camera((0.6, -7.4, 8.6), (0.15, 0.35, 0), lens=42)
lights((0, 0, 0))


def turn(t):
    th1 = TAU * 6 / 24 * t
    G[0][0].rotation_euler.z = G[0][3] + th1
    G[1][0].rotation_euler.z = G[1][3] - th1 * 24 / 12
    G[2][0].rotation_euler.z = G[2][3] + th1 * 24 / 18


mesh_pt = C1 + Vector((G[0][1], 0, 0.15))
finish('gear-train', 'Gears', ['gears', 'gear train', 'gear ratio', 'teeth', 'machines', 'rotation', 'speed', 'force', 'engineering'], [
    P('Driver gear', C1 + Vector((-G[0][1] * 0.55, -G[0][1] * 0.6, 0.15)), '24 teeth: the gear you turn'),
    P('Small gear', C2 + Vector((0, -0.25, 0.2)), '12 teeth: turns twice as fast, the other way'),
    P('Third gear', C3 + Vector((0.4, 0.3, 0.15)), '18 teeth: turns the same way as the driver'),
    P('Teeth', tuple(mesh_pt), 'Teeth lock together so the turning is passed on'),
    P('Axle', C1 + Vector((0, 0, 0.22)), 'Each gear spins round its own axle'),
], anim=turn)
