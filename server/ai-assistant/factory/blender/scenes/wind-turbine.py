# A wind turbine with its nacelle opened up. Wind pushes on the blades and
# turns the rotor; a gearbox speeds up the turning and the generator makes
# electricity, which runs down cables in the tower. In the loop the rotor turns.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
white = mat('#cdd3e2', rough=0.5, rim=0.2)
shell = mat('#d9dde8', rough=0.35, alpha=0.35, rim=0.5)
gearm = mat('#ff9f43', rough=0.35, metal=0.5, rim=0.25)
genm = mat('#5b8cff', rough=0.35, metal=0.5, rim=0.3)
coil = mat('#d98a3a', rough=0.35, metal=0.8)
shaft = mat('#c9d2e8', rough=0.25, metal=0.9)
grass = mat('#3b8f4a', rough=0.8, rim=0.1)
cable = glowmat('#fbbf24', 2.5)
wind = glowmat('#9fd8ff', 2)
H = 5.0
hill = sphere(4.5, grass, seg=96, rings=48, loc=(0, 0, -1.85))
hill.scale = (1.0, 1.0, 0.35)
tower = cyl(0.22, H, white, verts=48, r2=0.13, loc=(0, 0, H / 2 - 0.3))
# nacelle: a see-through shell over the gearbox and generator; it faces the wind (-x)
N = Vector((0.25, 0, H))
nac = box((1.7, 0.6, 0.6), shell, bevel=0.2, loc=N + Vector((0.2, 0, 0)))
tube([tuple(N + Vector((-0.75, 0, 0))), tuple(N + Vector((0.95, 0, 0)))], 0.045, shaft)
gb = box((0.42, 0.4, 0.4), gearm, bevel=0.04, loc=N + Vector((0.0, 0, 0)))
gen = cyl(0.2, 0.5, genm, verts=40, loc=N + Vector((0.55, 0, 0)), rot=(0, math.pi / 2, 0))
for k in range(5):
    torus(0.205, 0.015, coil, seg=40, ring=6, loc=N + Vector((0.37 + k * 0.09, 0, 0)), rot=(0, math.pi / 2, 0))
tube([tuple(N + Vector((0.55, 0, -0.2))), tuple(N + Vector((0.1, 0, -0.32))), (0.0, -0.0, H - 0.6), (0.0, -0.0, 0.0)], 0.03, cable, kind='BEZIER')
# rotor: hub and three blades, turning about the x axis
rotor = empty('Rotor', loc=N + Vector((-0.85, 0, 0)))
cone(0.22, 0.45, white, verts=40, loc=(-0.12, 0, 0), rot=(0, -math.pi / 2, 0), parent=rotor)
blades = []
for k in range(3):
    g = empty('Blade', rot=(TAU * k / 3, 0, 0), parent=rotor)
    b = blob((0.05, 0.22, 1.6), white, subdiv=4, parent=g)
    for v in b.data.vertices:
        t = (v.co.z + 1.6) / 3.2
        v.co.y *= 1.2 - 0.9 * t
        v.co.y += 0.12 * (1 - t)
        v.co.z += 1.75
    b.data.update()
    b.rotation_euler = (0, 0.25, 0)
    blades.append(b)
# wind arrows streaming in from the left
for z in (H - 1.6, H, H + 1.6):
    tube([(-3.7, 0.6, z), (-2.5, 0.6, z)], 0.035, wind)
    cone(0.1, 0.25, wind, verts=16, loc=(-2.4, 0.6, z), rot=(0, math.pi / 2, 0))

cam = camera((-4.4, -12.6, 4.8), (-0.4, 0, 3.15), lens=38)
lights((0, 0, 3.0), power=0.7)


def spin(t):
    rotor.rotation_euler = (TAU / 3 * t * 2, 0, 0)


finish('wind-turbine', 'A wind turbine', ['wind turbine', 'wind power', 'renewable energy', 'generator', 'electricity', 'blades', 'gearbox', 'energy', 'engineering'], [
    P('Blades', (blades[0], (0.0, -0.1, 1.3)), 'Shaped like wings so the wind makes them turn'),
    P('Hub', rotor, 'Holds the blades on the main shaft'),
    P('Gearbox', N + Vector((0.0, -0.25, 0.1)), 'Makes the slow turning much faster'),
    P('Generator', N + Vector((0.55, -0.25, 0.1)), 'Turns spinning into electricity'),
    P('Nacelle', N + Vector((0.9, -0.3, 0.25)), 'The housing on top that turns to face the wind'),
    P('Tower', (0.0, -0.2, 2.0), 'Lifts the blades high where the wind is strong'),
    P('Wind', (-3.1, 0.6, H + 1.6), 'Moving air carries energy'),
], anim=spin)
