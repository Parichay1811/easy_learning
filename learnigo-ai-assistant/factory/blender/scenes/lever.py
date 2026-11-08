# A lever: a plank balanced on a pivot (the fulcrum). A small effort far
# from the fulcrum lifts a heavy load close to it: effort x its distance =
# load x its distance.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
wood = mat('#c08a55', rough=0.55, rim=0.2)
grain = mat('#a8743f', rough=0.6)
fulm = mat('#5b8cff', rough=0.35, rim=0.35)
load = mat('#8b95b5', rough=0.4, metal=0.6, rim=0.2)
eff = glowmat('#34d399', 3)
lw = glowmat('#fb7185', 3)
dist = mat('#fbbf24', rough=0.4, emit=1.2)
floor(5.5, 0, opacity=0.45)
F = Vector((-0.9, 0, 0.0))
tilt = math.radians(7)   # the effort side has just pushed down
plank = empty('Plank', loc=(F.x, 0, 0.85), rot=(0, tilt, 0))
box((5.6, 0.7, 0.14), wood, bevel=0.03, loc=(0.4, 0, 0), parent=plank)
for k in range(5):
    box((5.5, 0.02, 0.01), grain, loc=(0.4, -0.351, -0.04 + k * 0.02), parent=plank)
ful = prism([(-0.55, 0), (0.55, 0), (0, 0.78)], 0.8, fulm, rot=(math.pi / 2, 0, 0), loc=(F.x, 0, 0.0))
bevel(ful, 0.03, 2)
# the load: a heavy block near the fulcrum (left), the effort far out (right)
lb = box((0.8, 0.8, 0.8), load, bevel=0.05, loc=(-1.2, 0, 0.47), parent=plank)
box((0.5, 0.5, 0.06), load, bevel=0.02, loc=(-1.2, 0, 0.9), parent=plank)
# arrows: effort pushes down on the right end; the load's weight acts down
def arrow(p, d, L, m):
    p, d = Vector(p), Vector(d).normalized()
    tube([tuple(p), tuple(p + d * (L - 0.25))], 0.05, m)
    c = cone(0.14, 0.32, m, verts=24, loc=p + d * (L - 0.12))
    c.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()


bpy.context.view_layer.update()
end = plank.matrix_world @ Vector((3.0, 0, 0.07))
mid_load = plank.matrix_world @ Vector((-1.2, 0, 0.9))
arrow(end + Vector((0, 0, 1.5)), (0, 0, -1), 1.45, eff)
arrow(plank.matrix_world @ Vector((-1.2, -0.6, 0.0)), (0, 0, -1), 1.0, lw)
# distance markers along the front of the plank
for x0, x1 in ((-1.2, 0.0), (0.0, 3.0)):
    a, b = plank.matrix_world @ Vector((x0, -0.5, -0.25)), plank.matrix_world @ Vector((x1, -0.5, -0.25))
    tube([tuple(a), tuple(b)], 0.015, dist)
    for q in (a, b):
        tube([tuple(q + Vector((0, 0, -0.1))), tuple(q + Vector((0, 0, 0.1)))], 0.015, dist)

cam = camera((-0.4, -10.8, 2.8), (-0.45, 0, 0.9), lens=44)
lights((-0.45, 0, 0.8), power=0.8)
finish('lever', 'A lever', ['lever', 'fulcrum', 'effort', 'load', 'simple machines', 'moments', 'force', 'seesaw', 'physics'], [
    P('Fulcrum', (F.x, -0.4, 0.4), 'The pivot the lever turns on'),
    P('Load', lb, 'The heavy thing being lifted'),
    P('Effort', tuple(end + Vector((0, 0, 0.9))), 'The push you give: small, but far from the pivot'),
    P('Lever', (plank, (1.4, -0.36, 0.07)), 'A stiff bar that turns about the fulcrum'),
    P('Load distance', tuple((plank.matrix_world @ Vector((-0.6, -0.5, -0.25)))), 'Short: the load is close to the fulcrum'),
    P('Effort distance', tuple((plank.matrix_world @ Vector((1.5, -0.5, -0.25)))), 'Long: so a small push lifts a big load'),
])
