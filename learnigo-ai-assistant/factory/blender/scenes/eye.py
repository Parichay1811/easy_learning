# The human eye cut in half from the side: light enters through the cornea
# and pupil, the lens focuses it onto the retina, and the optic nerve takes
# the message to the brain. The front of the eye faces left.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
scl = mat('#f3f1ea', rough=0.5, rim=0.2)
sclcut = mat('#e6e0d2', rough=0.6, rim=0)
chor = mat('#7a2b3b', rough=0.6, rim=0)
ret = mat('#ff8a7a', rough=0.5, rim=0.2)
corn = mat('#bfefff', rough=0.05, alpha=0.35, rim=0.6)
irism = mat('#4f8de8', rough=0.5, rim=0.3)
lensm = mat('#d6f3ff', rough=0.1, alpha=0.6, rim=0.6)
vit = mat('#9ad8ff', rough=0.2, alpha=0.08, rim=0.15)
nerve = mat('#fbbf24', rough=0.5, rim=0.3)
cili = mat('#c05a6a', rough=0.5, rim=0.2)
ray = glowmat('#fff3a0', 6)


def half(m):
    return box((8, 4, 8), m, loc=(0, -2, 0))


def shell(r_out, r_in, m, mcut, front_cut=-0.9):
    ob = sphere(r_out, m, seg=96, rings=48)
    cut(ob, sphere(r_in, mcut, seg=96, rings=48))
    cut(ob, box((2, 3, 3), mcut, loc=(front_cut - 1, 0, 0)))   # the opening at the front
    cut(ob, half(mcut))
    return ob


sclera = shell(1.2, 1.12, scl, sclcut, -0.95)
choroid = shell(1.118, 1.08, chor, chor, -0.86)
retina = shell(1.078, 1.045, ret, ret, -0.8)
cornea = sphere(0.72, corn, loc=(-0.6, 0, 0), seg=64, rings=32)
cut(cornea, sphere(0.68, corn, loc=(-0.6, 0, 0), seg=64, rings=32))
cut(cornea, box((2, 3, 3), corn, loc=(-0.96 + 1, 0, 0)))
cut(cornea, half(corn))
iris = cyl(0.66, 0.04, irism, verts=96, loc=(-0.9, 0, 0), rot=(0, math.pi / 2, 0))
cut(iris, cyl(0.22, 0.2, irism, verts=64, loc=(-0.9, 0, 0), rot=(0, math.pi / 2, 0)))
cut(iris, half(irism))
lens = sphere(1.0, lensm, loc=(-0.72, 0, 0), seg=64, rings=32)
lens.scale = (0.17, 0.44, 0.44)
bpy.context.view_layer.update()
cut(lens, half(lensm))
body = torus(0.5, 0.07, cili, loc=(-0.78, 0, 0), rot=(0, math.pi / 2, 0), seg=64)
cut(body, half(cili))
v = sphere(1.044, vit, seg=64, rings=32)
cut(v, box((2, 3, 3), vit, loc=(-0.66 - 1, 0, 0)))
cut(v, half(vit))
on = cyl(0.2, 1.0, nerve, loc=(1.55, 0, -0.15), rot=(0, math.pi / 2 + 0.15, 0))
cut(on, sphere(1.1, nerve))
cut(on, half(nerve))
# two rays of light from a distant object, bent by the cornea and lens onto the retina
F = Vector((1.045, 0.02, 0.0))
for zz in (0.36, -0.36):
    tube([(-3.0, 0.02, zz), (-1.28, 0.02, zz), (-0.9, 0.02, zz * 0.53), (-0.72, 0.02, zz * 0.46), F + Vector((-0.004, 0, 0))], 0.018, ray)

cam = camera((0.15, -6.9, 1.3), (0.15, 0, 0.0), lens=50)
lights((0, 0, 0), rim='#22d3ee')
finish('eye', 'The human eye', ['eye', 'sight', 'vision', 'retina', 'lens', 'cornea', 'iris', 'pupil', 'optic nerve', 'light', 'human body'], [
    P('Cornea', (-1.31, 0.0, 0.25), 'Clear front window that starts to bend the light'),
    P('Iris', (-0.9, 0.0, 0.5), 'Coloured muscle ring that sets the pupil size'),
    P('Pupil', (-0.95, 0.0, 0.0), 'The hole in the iris that lets light in'),
    P('Lens', (-0.72, 0.0, -0.2), 'Changes shape to focus light on the retina'),
    P('Retina', (0.7, 0.4, 0.75), 'Light-sensing layer: rods and cones'),
    P('Sclera', (0.2, 0.0, -1.16), 'The tough white outer coat'),
    P('Optic nerve', (1.75, 0.0, -0.18), 'Carries signals from the retina to the brain'),
    P('Vitreous humour', (0.25, 0.3, -0.4), 'Clear jelly that keeps the eyeball round'),
])
