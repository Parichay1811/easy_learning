# A slice through a leaf, as a block of cells: waxy cuticle, upper
# epidermis, tall palisade cells full of chloroplasts, loose spongy cells
# with air spaces, a vein (xylem and phloem), and a stoma between guard cells.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(5)
cuticle = mat('#bff5d6', rough=0.1, alpha=0.25, rim=0.3)
epi = mat('#9fdc8c', rough=0.5, rim=0.15)
pal = mat('#34c46a', rough=0.45, rim=0.35)
chl = mat('#0f6b33', rough=0.5)
spo = mat('#5cc779', rough=0.5, rim=0.2)
guard = mat('#22a95a', rough=0.45, rim=0.3)
xyl = mat('#5b8cff', rough=0.4, rim=0.3)
phl = mat('#ff9f43', rough=0.4, rim=0.3)
sheath = mat('#e6f7c8', rough=0.5, rim=0.2)

W, D = 4.2, 1.6
nx, ny = 11, 4
cw, cd = W / nx, D / ny
# epidermis: flat cells top and bottom
cell = box((cw * 0.94, cd * 0.94, 0.2), epi, bevel=0.05)
merge_instances(cell, [place((-W / 2 + cw * (i + 0.5), -D / 2 + cd * (j + 0.5), 1.55)) for i in range(nx) for j in range(ny)], 'UpperEpidermis', epi)
cell = box((cw * 0.94, cd * 0.94, 0.16), epi, bevel=0.05)
low = [place((-W / 2 + cw * (i + 0.5), -D / 2 + cd * (j + 0.5), 0.0)) for i in range(nx) for j in range(ny) if not (i == 5 and j == 0)]
merge_instances(cell, low, 'LowerEpidermis', epi)
box((W + 0.04, D + 0.04, 0.05), cuticle, loc=(0, 0, 1.68))
# palisade: tall cells packed side by side, each with chloroplasts
npx, npy = 15, 5
pc = cyl(0.12, 0.62, pal, verts=20)
bevel(pc, 0.06, 3); apply_mods(pc)
mats = [place((-W / 2 + W / npx * (i + 0.5), -D / 2 + D / npy * (j + 0.5), 1.09)) for i in range(npx) for j in range(npy)]
merge_instances(pc, mats, 'Palisade', pal)
dot = ico(0.035, chl, 1)
dm = []
for i in range(npx):
    for k in range(6):
        dm.append(place((-W / 2 + W / npx * (i + 0.5) + random.uniform(-0.06, 0.06), -D / 2 + D / npy * 0.5 - 0.12, 0.85 + 0.08 * k + random.uniform(-0.02, 0.02))))
merge_instances(dot, dm, 'Chloroplasts', chl)
# spongy cells: loose and round, with air between them
sp = []
for k in range(70):
    x = random.uniform(-W / 2 + 0.2, W / 2 - 0.2)
    if abs(x - 1.1) < 0.45:
        continue
    sp.append(place((x, random.uniform(-D / 2 + 0.15, D / 2 - 0.15), random.uniform(0.28, 0.6)), (random.random(), random.random(), 0), (random.uniform(0.16, 0.22), random.uniform(0.14, 0.2), 0.14)))
ball = ico(1.0, spo, 2)
merge_instances(ball, sp, 'Spongy', spo)
# a vein running through: xylem above phloem in a sheath
V = Vector((1.1, 0, 0.45))
vein = cyl(0.34, D, sheath, verts=32, loc=V, rot=(math.pi / 2, 0, 0))
for dx in (-0.12, 0.0, 0.12):
    cyl(0.07, D + 0.02, xyl, verts=16, loc=V + Vector((dx, 0, 0.1)), rot=(math.pi / 2, 0, 0))
for dx in (-0.09, 0.09):
    cyl(0.06, D + 0.02, phl, verts=16, loc=V + Vector((dx, 0, -0.14)), rot=(math.pi / 2, 0, 0))
# stoma: two guard cells round a pore in the lower epidermis
S = Vector((-W / 2 + cw * 5.5, -D / 2 + cd * 0.5, 0.0))
for s in (-1, 1):
    g = blob((0.07, 0.17, 0.09), guard, loc=S + Vector((s * 0.09, 0, 0)), subdiv=3)
    g.rotation_euler = (0, 0, s * 0.15)

cam = camera((5.0, -7.0, 3.5), (0.15, 0, 0.75), lens=50)
lights((0, 0, 0.8), rim='#34d399', power=0.6)
finish('leaf-section', 'Inside a leaf', ['leaf', 'photosynthesis', 'stomata', 'palisade', 'chloroplast', 'xylem', 'phloem', 'plants', 'leaf structure', 'biology'], [
    P('Cuticle', (-1.3, -0.82, 1.7), 'A waxy, see-through coat that stops water loss'),
    P('Upper epidermis', (-1.75, -0.8, 1.55), 'A clear skin that lets light through'),
    P('Palisade cells', (-0.5, -0.82, 1.1), 'Packed with chloroplasts: most food is made here'),
    P('Spongy layer', (-1.2, -0.7, 0.45), 'Loose cells with air spaces for gases'),
    P('Vein', V + Vector((0, -0.8, 0.1)), 'Xylem brings water; phloem carries food away'),
    P('Stoma', S + Vector((0, -0.18, -0.05)), 'A tiny pore: CO2 in, oxygen and water out'),
    P('Lower epidermis', (1.6, -0.82, 0.0), 'The underside skin, dotted with stomata'),
])
