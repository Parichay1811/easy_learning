# A satellite in orbit round the Earth (drawn far bigger than life). Gravity
# pulls it towards the Earth while its speed carries it sideways, so it
# keeps falling round the planet instead of into it. In the loop it goes
# once round its orbit.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
orbitm = mat('#5b8cff', rough=0.5, emit=0.8, alpha=0.7)
gold = mat('#e0a82e', rough=0.35, metal=0.8, rim=0.2)
panel = mat('#1f3f9e', rough=0.25, metal=0.3, rim=0.3)
frame = mat('#c9d2e8', rough=0.4, metal=0.6)
white = mat('#eef2fb', rough=0.35, rim=0.2)
grav = glowmat('#fb7185', 3)
vel = glowmat('#34d399', 3)

earth = sphere(1.6, earthmat(scale=1.3, rim=0.35, ice=0.93), seg=96, rings=48)
earth.rotation_euler = (math.radians(23.5), 0, math.radians(-30))
atmo = sphere(1.68, mat('#7fb8ff', alpha=0.12, emit=0.6, rim=0.8), seg=64, rings=32)
R = 3.2
tilt = Euler((math.radians(66), 0, math.radians(-18)))
M = tilt.to_matrix()
tube([tuple(M @ Vector((R * math.cos(TAU * i / 192), R * math.sin(TAU * i / 192), 0))) for i in range(192)], 0.014, orbitm, closed=True)

sat = empty('Satellite', scale=0.62)
box((0.7, 0.6, 0.6), gold, bevel=0.03, parent=sat)
for s in (-1, 1):
    tube([(s * 0.35, 0, 0), (s * 0.55, 0, 0)], 0.03, frame, parent=sat)
    pn = box((1.3, 0.04, 0.55), panel, loc=(s * 1.22, 0, 0), parent=sat)
    for k in range(1, 4):
        box((0.015, 0.05, 0.56), frame, loc=(s * (0.57 + 0.325 * k), 0, 0), parent=sat)
dish = lathe([(0.0, 0.0), (0.12, 0.01), (0.25, 0.05), (0.35, 0.12), (0.33, 0.13), (0.0, 0.02)], white, seg=48, parent=sat, loc=(0, 0, 0.32))
tube([(0, 0, 0.32), (0, 0, 0.62)], 0.012, frame, parent=sat)
arrows = empty('Arrows', parent=None)


def arrow(m, length):
    g = empty('Arrow')
    tube([(0, 0, 0), (0, 0, length - 0.18)], 0.035, m, parent=g)
    cone(0.09, 0.22, m, verts=20, loc=(0, 0, length - 0.1), parent=g)
    return g


ga = arrow(grav, 1.0)
va = arrow(vel, 1.1)
cam = camera((0.3, -11.6, 2.6), (0.25, 0, -0.05), lens=46)
lights((0, 0, 0), power=0.6)
sun((-1, 0.6, -0.3), 2.0)


def go(t):
    a = TAU * t + math.radians(-35)
    p = M @ Vector((R * math.cos(a), R * math.sin(a), 0))
    tang = M @ Vector((-math.sin(a), math.cos(a), 0))
    sat.location = p
    sat.rotation_euler = (-p).to_track_quat('Z', 'X').to_euler()   # dish faces the Earth
    ga.location = p
    ga.rotation_euler = (-p).to_track_quat('Z', 'Y').to_euler()
    va.location = p
    va.rotation_euler = tang.to_track_quat('Z', 'Y').to_euler()


go(0)
finish('satellite-orbit', 'A satellite in orbit', ['satellite', 'orbit', 'gravity', 'space', 'earth', 'solar panels', 'communication', 'forces', 'physics'], [
    P('Earth', (-0.9, -1.25, 0.35), 'Its gravity reaches far out into space'),
    P('Satellite', sat, 'A machine sent up to circle the Earth'),
    P('Solar panels', (sat, (1.3, 0, 0)), 'Turn sunlight into electricity'),
    P('Dish antenna', (sat, (0, 0, 0.42)), 'Sends and receives radio signals'),
    P('Gravity', (ga, (0, 0, 0.75)), 'Pulls the satellite towards the Earth'),
    P('Speed', (va, (0, 0, 0.85)), 'Carries it sideways, so it keeps missing the Earth'),
    P('Orbit', tuple(M @ Vector((R * math.cos(2.3), R * math.sin(2.3), 0))), 'The path it follows round and round'),
], anim=go)
