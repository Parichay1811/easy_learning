# Common salt (sodium chloride) as a crystal lattice: small sodium ions
# (Na+) and bigger chloride ions (Cl-) alternate in a cube pattern that
# repeats in every direction, held by strong ionic bonds.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
na = mat('#a78bfa', rough=0.3, rim=0.4, coat=0.4)
cl = mat('#34d399', rough=0.3, rim=0.4, coat=0.4)
bondm = mat('#c9d2e8', rough=0.4, emit=0.3)
g = empty('Lattice', rot=(math.radians(-18), 0, math.radians(32)))
n = 4
s = 1.0
off = (n - 1) * s / 2
ions = {}
for i in range(n):
    for j in range(n):
        for k in range(n):
            p = Vector((i * s - off, j * s - off, k * s - off))
            is_na = (i + j + k) % 2 == 0
            ions[(i, j, k)] = sphere(0.24 if is_na else 0.38, na if is_na else cl, seg=32, rings=16, loc=p, parent=g)
stick = cyl(0.045, s, bondm, verts=12)
mats = []
for i in range(n):
    for j in range(n):
        for k in range(n):
            p = Vector((i * s - off, j * s - off, k * s - off))
            if i < n - 1:
                mats.append(place(p + Vector((s / 2, 0, 0)), (0, math.pi / 2, 0)))
            if j < n - 1:
                mats.append(place(p + Vector((0, s / 2, 0)), (math.pi / 2, 0, 0)))
            if k < n - 1:
                mats.append(place(p + Vector((0, 0, s / 2))))
bonds = merge_instances(stick, mats, 'Bonds', bondm, parent=g)
# a small salt grain beside it, to show the cube shape is visible to the eye
grain = box((0.9, 0.9, 0.9), mat('#f4f7ff', rough=0.2, alpha=0.75, rim=0.5), bevel=0.04, loc=(3.0, 0.5, -1.3), rot=(0.2, 0.3, 0.5))

cam = camera((0.7, -11.8, 3.0), (0.6, 0, -0.15), lens=48)
lights((0, 0, 0), rim='#34d399')
bpy.context.view_layer.update()
front_na = min((ions[key] for key in ions if sum(key) % 2 == 0), key=lambda o: (o.matrix_world.translation - cam.location).length)
front_cl = min((ions[key] for key in ions if sum(key) % 2 == 1), key=lambda o: (o.matrix_world.translation - front_na.matrix_world.translation).length + 0.3 * (o.matrix_world.translation - cam.location).length)
a, b = front_na.matrix_world.translation, front_cl.matrix_world.translation
finish('salt-lattice', 'Salt crystal lattice', ['salt', 'sodium chloride', 'nacl', 'ionic bond', 'crystal', 'lattice', 'ions', 'chemistry', 'giant ionic structure'], [
    P('Sodium ion', front_na, 'Na+: has given away one electron'),
    P('Chloride ion', front_cl, 'Cl-: has taken one electron, so it is bigger'),
    P('Ionic bond', tuple(a.lerp(b, 0.5)), 'Opposite charges pull strongly together'),
    P('Repeating cube', ions[(3, 3, 3)], 'The same pattern repeats millions of times'),
    P('Salt grain', grain, 'This is why salt grains are little cubes'),
])
