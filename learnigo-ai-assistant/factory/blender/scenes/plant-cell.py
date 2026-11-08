# A plant cell with one eighth cut away: the stiff cell wall, membrane,
# the big central vacuole, nucleus, chloroplasts (cut to show grana) and
# mitochondria.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
wallm = mat('#2f9e5b', rough=0.6, rim=0.3)
wallcut = mat('#5fd08a', rough=0.7, rim=0)
memb = mat('#a7f3d0', rough=0.5, rim=0.2)
cyto = mat('#a9dc98', rough=0.75, rim=0)
vac = mat('#7cc4ff', rough=0.3, rim=0.3)
vacin = mat('#a9dcff', rough=0.5, rim=0)
nucm = mat('#8b5cf6', rough=0.4, rim=0.3)
nucin = mat('#b39dfb', rough=0.6, rim=0)
nucleolm = mat('#5b21b6', rough=0.5)
chl = mat('#22a95a', rough=0.4, rim=0.3)
chlin = mat('#9be7a8', rough=0.6, rim=0)
grana = mat('#126b37', rough=0.5)
mito = mat('#ff9f43', rough=0.45, rim=0.3)
cristae = mat('#ffd08a', rough=0.5)

W, D, H = 3.8, 2.8, 2.1


C = Vector((-0.3, 0.3, -0.05))   # the corner of the cut-away part


def octant(m, e=0.0, s=8):
    return box((s, s, s), m, loc=(C.x + s / 2 + e, C.y - s / 2 - e, C.z + s / 2 + e))


wall = box((W + 0.36, D + 0.36, H + 0.36), wallm, bevel=0.25, seg=4)
cut(wall, box((W, D, H), wallcut, bevel=0.18, seg=4))
cut(wall, octant(wallcut))
cell = box((W, D, H), memb, bevel=0.18, seg=4)
cut(cell, octant(cyto, e=0.004))
v = blob((1.6, 0.95, 0.75), vac, loc=(0.25, 0.6, 0.0), lumps=0.05, seed=2)
cut(v, octant(vacin, e=0.012))
nuc = sphere(0.5, nucm, loc=(-0.3, -0.85, 0.45), seg=48, rings=24)
nl = sphere(0.18, nucleolm, loc=(-0.3, -0.8, 0.5))
cut(nuc, octant(nucin, e=0.012))
cut(nl, octant(nucleolm, e=0.016))
# chloroplasts, each cut open to show its stacks of grana
chls = []
for loc, rot in (((1.2, -0.95, 0.1), (0, 0, 0.4)), ((0.55, -0.4, 0.1), (0, 0, -0.5)), ((1.5, -0.1, 0.1), (0, 0, 1.2)),
                 ((-0.15, -0.1, 0.75), (0, 1.57, 0.3)), ((0.9, 0.17, 0.7), (1.57, 0, 0.2)), ((0.3, -1.15, 0.1), (0, 0, 1.4))):
    g = empty('Chloroplast', loc=loc, rot=rot)
    body = blob((0.36, 0.2, 0.14), chl, subdiv=4, parent=g)
    parts = [body]
    for k in range(4):
        x = -0.24 + k * 0.16
        for j in range(4):
            parts.append(cyl(0.055, 0.02, grana, verts=16, loc=(x, 0, -0.045 + j * 0.03), parent=g))
    bpy.context.view_layer.update()
    top = box((2, 2, 2), chlin, loc=(0, 0, 1.0 + 0.0), parent=g)
    bpy.context.view_layer.update()
    cut(body, top)
    chls.append(g)
# a mitochondrion
mg = empty('Mito', loc=(1.5, -0.8, 0.75), rot=(0.4, 0.3, 0.9))
r, L = 0.16, 0.5
mb = lathe([(0, -L / 2 - r)] + [(r * math.sin(a / 8 * math.pi / 2), -L / 2 - r * math.cos(a / 8 * math.pi / 2)) for a in range(1, 9)] +
           [(r * math.sin(a / 8 * math.pi / 2), L / 2 + r * math.cos(a / 8 * math.pi / 2)) for a in range(8, 0, -1)] + [(0, L / 2 + r)], mito, seg=32, parent=mg, rot=(0, math.pi / 2, 0))

cam = camera((7.0, -8.6, 7.6), (0.2, -0.2, -0.1), lens=58)
lights((0, 0, 0.3), rim='#34d399')
finish('plant-cell', 'Plant cell', ['plant cell', 'cell', 'cell wall', 'chloroplast', 'vacuole', 'nucleus', 'photosynthesis', 'organelles', 'biology'], [
    P('Cell wall', (-1.2, -1.58, -0.3), 'A stiff outer layer of cellulose that holds the shape'),
    P('Cell membrane', (-0.29, -1.38, 0.15), 'Just inside the wall: controls what goes in and out'),
    P('Vacuole', (0.6, 0.31, 0.3), 'A big sac of watery sap that keeps the cell firm'),
    P('Nucleus', (-0.29, -0.85, 0.65), 'The control centre: holds the DNA'),
    P('Chloroplast', chls[0], 'Uses sunlight to make food (photosynthesis)'),
    P('Cytoplasm', (1.4, 0.3, 0.75), 'Jelly where the cell does its work'),
    P('Mitochondrion', mg, 'Releases energy from food'),
])
