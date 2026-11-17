# A volcano cut in half: magma chamber deep below, the main vent rising to
# the crater, a side vent, layers of old lava and ash, lava flowing down the
# slope and an ash cloud above. In the loop the magma rises and the lava flows.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(4)
rockout = mat('#6e5a4e', rough=0.85, rim=0.15)
strata = bandmat(['#7a5f4f', '#5a4840', '#8e7464', '#4c3d36', '#9a8270'], scale=0.55)
crust = bandmat(['#5d5a6e', '#4a4758', '#6c6880'], scale=0.45, name='Crust')
magma = flowmat('#ff3d00', '#ffc04d', scale=1.4, strength=4, distort=6, name='Magma')
lava = flowmat('#ff5a1f', '#ffc04d', scale=5, strength=4.5, distort=4, name='Lava')
ash = mat('#5f6375', rough=0.95, rim=0.25)
grass = mat('#3b8f4a', rough=0.8, rim=0.15)

H = 3.0
prof = [(0.0, -0.0), (4.2, 0.0), (3.6, 0.35), (2.6, 1.1), (1.6, 2.1), (0.95, 2.85), (0.7, H), (0.45, H - 0.25), (0.25, H - 0.35), (0.0, H - 0.4)]
mount = lathe(prof, rockout, seg=96)
wobble(mount, 0.08, 1.2, 2)
ground = box((9.4, 4.2, 2.2), crust, loc=(0, 0, -1.1))
grassy = box((9.4, 4.2, 0.08), grass, loc=(0, 0, 0.0))
half = lambda m, e=0.0: box((14, 6, 12), m, loc=(0, -3 - e, 2))
cut(mount, half(strata))
cut(ground, half(crust))
cut(grassy, half(grass))
# the plumbing: chamber, main vent, side vent (glowing, sitting just in front of the cut)
ch = blob((1.3, 0.6, 0.55), magma, loc=(0, 0.0, -1.2), lumps=0.08, subdiv=4)
cut(ch, half(magma, 0.02))
vent = tube([(0, 0, -0.8), (0.05, 0, 0.8), (-0.05, 0, 2.0), (0, 0, H - 0.3)], 0.2, magma, kind='BEZIER', radii=[1.4, 1, 0.9, 1.1])
side = tube([(0.02, 0, 0.9), (0.7, 0, 1.25), (1.35, 0, 1.6), (1.75, 0, 1.75)], 0.11, magma, kind='BEZIER')
for ob in (vent, side):
    ob2 = as_mesh(ob)
    cut(ob2, half(magma, 0.02))
# lava flowing down the outside (back half, so it shows beside the cut)
flows = []
for a in (0.3, 2.85):
    pts = []
    for i in range(14):
        r = 0.6 + i * 0.25
        zz = max(0.04, H - 0.05 - (r - 0.6) * 0.86) if r < 3.2 else 0.12
        ang = a + 0.05 * math.sin(i)
        pts.append((r * math.cos(ang), r * math.sin(ang), zz + 0.06))
    flows.append(tube(pts, 0.09, lava, kind='BEZIER', res=8))
# ash cloud: puffs above the crater
puffs = empty('Ash', loc=(0, 0, H + 0.2))
for k in range(40):
    z = 0.2 + (k / 40) ** 0.8 * 1.5
    spread = 0.15 + 0.9 * (k / 40)
    r = 0.18 + 0.22 * (k / 40) + random.uniform(-0.05, 0.05)
    ico(r, ash, 3, loc=(random.uniform(-spread, spread) + z * 0.25, random.uniform(-0.3, 0.3) + 0.4, z + random.uniform(-0.1, 0.1)), parent=puffs)

cam = camera((0.0, -13.6, 3.8), (0.0, 0, 1.35), lens=45)
lights((0, 0, 1.0), rim='#ff9f43')


def erupt(t):
    set_phase(magma, t, 2)
    set_phase(lava, -t, 2)
    puffs.rotation_euler = (0, 0, 0.15 * math.sin(TAU * t))
    puffs.scale = (1 + 0.04 * math.sin(TAU * t),) * 3


finish('volcano', 'Inside a volcano', ['volcano', 'magma', 'lava', 'eruption', 'crater', 'vent', 'magma chamber', 'ash cloud', 'geography', 'earth science'], [
    P('Ash cloud', (0.55, 0.0, H + 1.7), 'Tiny bits of rock and gas blasted into the sky'),
    P('Crater', (0.45, -0.05, H - 0.15), 'The bowl-shaped opening at the top'),
    P('Lava flow', tuple(Vector(flows[0].data.splines[0].bezier_points[6].co)), 'Magma that reaches the surface is called lava'),
    P('Main vent', (0.0, -0.05, 1.5), 'The pipe magma rises through'),
    P('Side vent', (1.3, -0.05, 1.58), 'A smaller branch to the side'),
    P('Layers of rock', (-1.9, -0.0, 0.8), 'Old lava and ash, layer on layer'),
    P('Magma chamber', (0.6, -0.05, -1.25), 'A pool of molten rock deep underground'),
], anim=erupt)
