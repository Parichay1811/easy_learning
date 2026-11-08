# A shell-and-tube heat exchanger (one shell pass, one tube pass), a quarter
# of the shell and heads cut away. The hot fluid flows through the bundle of
# tubes and cools along the way; the cold fluid flows the other way round the
# outside of the tubes, inside the shell. Baffles make the shell-side fluid
# zigzag across the tubes, which mixes it and improves heat transfer, and
# they hold the tubes up. The tube sheets seal the tube ends into the heads.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
AX = (0, math.pi / 2, 0)
shellm = mat('#8b95b5', rough=0.4, metal=0.6, rim=0.2)
shellcut = mat('#c9d0e2', rough=0.5, metal=0.3)
bafm = mat('#a78bfa', rough=0.4, metal=0.4, rim=0.2)
sheetm = mat('#d6dbe8', rough=0.3, metal=0.8, rim=0.15)
hotm = mat('#e5484d', rough=0.35, metal=0.4, rim=0.25)
warmm = mat('#ff9f43', rough=0.35, metal=0.4, rim=0.25)
coldm = mat('#3b82f6', rough=0.35, metal=0.4, rim=0.25)
coolm = mat('#22d3ee', rough=0.35, metal=0.4, rim=0.25)
flowc = glowmat('#7cf0ff', 2.5)
basem = mat('#2a3350', rough=0.6, rim=0.1)
Ls, Rs = 5.0, 1.0


def xcyl(r, length, m, x=0.0, verts=64, **kw):
    return cyl(r, length, m, verts=verts, loc=(x, 0, 0), rot=AX, **kw)


def quarter(x0=-3.6, x1=3.6):
    return box((x1 - x0, 2.5, 2.5), shellcut, loc=((x0 + x1) / 2, -1.25, 1.25))


shell = xcyl(Rs, Ls, shellm)
cut(shell, xcyl(Rs - 0.06, Ls + 0.2, shellcut))
heads = []
for s in (-1, 1):
    hd = lathe([(0.0, 0.0), (Rs * 0.98, 0.0), (Rs * 0.98, 0.25), (Rs * 0.85, 0.55), (Rs * 0.55, 0.75), (0.0, 0.82)], shellm, seg=64, loc=(s * (Ls / 2 + 0.1), 0, 0), rot=(0, s * math.pi / 2, 0))
    cut(hd, lathe([(0.0, -0.05), (Rs * 0.92, -0.05), (Rs * 0.92, 0.25), (Rs * 0.8, 0.5), (Rs * 0.5, 0.69), (0.0, 0.76)], shellcut, seg=64, loc=(s * (Ls / 2 + 0.1), 0, 0), rot=(0, s * math.pi / 2, 0)))
    heads.append(hd)
    xcyl(Rs + 0.12, 0.16, shellm, x=s * (Ls / 2 + 0.05))
sheets = [xcyl(Rs + 0.02, 0.1, sheetm, x=s * (Ls / 2 - 0.02)) for s in (-1, 1)]
# tubes on a triangular pitch, coloured hot (left) to warmer-cool (right)
centres = []
p = 0.24
for j in range(-4, 5):
    for i in range(-5, 6):
        y = (i + (0.5 if j % 2 else 0.0)) * p
        z = j * p * 0.866
        if y * y + z * z <= 0.86 ** 2:
            centres.append((y, z))
src = xcyl(0.07, Ls, None, verts=16)
tubes = merge_instances(src, [Matrix.Translation((0, y, z)) @ Matrix.Rotation(math.pi / 2, 4, 'Y') for y, z in centres], 'Tubes', vcolmat(rough=0.3, name='TubeMat'))
paint(tubes, lambda v: mix('#ff4a3d', '#ffb36b', (v.x + Ls / 2) / Ls))
# segmental baffles (25 % cut), alternating, then the cutaway
bxs = [-1.65, -0.85, -0.05, 0.75, 1.55]
bafs = []
for k, x in enumerate(bxs):
    b = xcyl(Rs - 0.07, 0.05, bafm, x=x)
    s = 1 if k % 2 == 0 else -1
    cut(b, box((0.3, 2.2, 0.6), bafm, loc=(x, 0, s * (Rs - 0.22))))
    bafs.append(b)
for ob in [shell] + heads:
    cut(ob, quarter())
# nozzles: hot in/out on the heads (axial), cold in/out on the shell
for x0, x1, m in ((-4.3, -Ls / 2 - 0.85, hotm), (Ls / 2 + 0.85, 4.3, warmm)):
    tube([(x0, 0, 0), (x1, 0, 0)], 0.2, m)
    xcyl(0.3, 0.08, m, x=x0 if x0 < 0 else x1)
tube([(1.95, 0, Rs - 0.05), (1.95, 0, Rs + 0.75)], 0.18, coldm)
cyl(0.28, 0.08, coldm, verts=32, loc=(1.95, 0, Rs + 0.75))
tube([(-1.95, 0, -Rs + 0.05), (-1.95, 0, -Rs - 0.55)], 0.18, coolm)
# the shell-side path: in at the top right, zigzag past the baffles, out bottom left
zig = [(1.95, -0.0, Rs + 0.4), (1.95, -0.02, 0.55)]
for k, x in enumerate([1.15, 0.35, -0.45, -1.25]):
    zig.append((x, -0.02, -0.55 if k % 2 == 0 else 0.55))
zig += [(-1.95, -0.02, -0.55), (-1.95, 0.0, -Rs - 0.35)]
tube(zig, 0.035, flowc, kind='BEZIER')
cone(0.1, 0.25, flowc, verts=20, loc=(-1.95, 0, -Rs - 0.45), rot=(math.pi, 0, 0))
for x, col in ((-4.6, '#ff6a5a'), (4.6, '#ffb36b')):
    tube([(x - 0.55, 0, 0), (x - 0.15, 0, 0)], 0.035, glowmat(col, 2.5))
    cone(0.11, 0.26, glowmat(col, 2.5), verts=20, loc=(x, 0, 0), rot=(0, math.pi / 2, 0))
tube([(1.95, 0, Rs + 1.55), (1.95, 0, Rs + 1.15)], 0.035, flowc)
cone(0.11, 0.26, flowc, verts=20, loc=(1.95, 0, Rs + 1.0), rot=(math.pi, 0, 0))
# saddles and base
for x in (-1.6, 1.6):
    sd = box((0.3, 1.5, 0.75), basem, loc=(x, 0, -Rs - 0.12))
    cut(sd, xcyl(Rs + 0.01, 0.5, basem, x=x))
box((4.6, 1.9, 0.12), basem, bevel=0.03, loc=(0, 0, -Rs - 0.52))
floor(7.5, -Rs - 0.6)

cam = camera((-2.4, -8.6, 4.6), (0.0, 0, -0.1), lens=40)
lights((0, 0, 0), rim='#ff9f43')
c = math.cos(math.radians(135)); s_ = math.sin(math.radians(135))
finish('heat-exchanger', 'A shell-and-tube heat exchanger', ['heat exchanger', 'shell and tube', 'shell-and-tube heat exchanger', 'baffles', 'tube sheet', 'counterflow', 'heat transfer', 'thermodynamics', 'lmtd', 'condenser', 'mechanical engineering', 'chemical engineering'], [
    P('Shell', (-0.4, Rs * math.cos(math.radians(-60)) * -1, Rs * math.sin(math.radians(-60))), 'The outer vessel; the cold fluid flows inside it'),
    P('Tubes', (-1.2, -0.62, 0.36), 'Hot fluid inside; heat passes through the tube walls'),
    P('Baffles', (0.75, (Rs - 0.1) * c, (Rs - 0.1) * s_), 'Make the shell fluid zigzag across the tubes'),
    P('Tube sheet', (Ls / 2 - 0.02, (Rs - 0.05) * c, (Rs - 0.05) * s_), 'Holds and seals the tube ends'),
    P('Hot fluid in', (-3.9, 0, 0.2), 'Enters the head and flows through the tubes'),
    P('Hot fluid out', (3.9, 0, 0.2), 'Leaves cooler after giving up heat'),
    P('Cold fluid in', (1.95, 0, Rs + 0.6), 'Enters the shell at the far end: counterflow'),
    P('Cold fluid out', (-1.95, -0.2, -Rs - 0.4), 'Leaves warmer after taking up heat'),
])
