# The rock cycle: magma cools into igneous rock; weathering breaks rock into
# sediment; layers of sediment are pressed into sedimentary rock; heat and
# pressure turn rock into metamorphic rock, which can melt back into magma.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(12)
magma = flowmat('#ff3d00', '#ffc04d', scale=2.0, strength=4, distort=5, name='Magma')
sedm = bandmat(['#e3c08a', '#c99b62', '#f0d7a8', '#b88654'], scale=1.6, name='Sandstone')
metam = bandmat(['#e9eef5', '#5b6075', '#c9ccd8', '#3e4254'], scale=2.4, name='Gneiss')
metam.node_tree.nodes['Wave Texture'].inputs['Distortion'].default_value = 8
sand = mat('#e2c48e', rough=0.9, rim=0.1)
pebm = mat('#a08a70', rough=0.8, rim=0.15)
arrow = glowmat('#22d3ee', 2.5)
floor(5.2, 0)


def rock(loc, m, r=0.75, seed=0):
    ob = blob((r, r * 0.85, r * 0.7), m, loc=loc, lumps=0.12, lump_scale=1.6, seed=seed, subdiv=4)
    for v in ob.data.vertices:
        v.co.z = max(v.co.z, -r * 0.45)
    ob.data.update()
    ob.location.z += r * 0.45
    return ob


R = 3.0
ang = {'magma': 90, 'igneous': 18, 'sediment': -54, 'sedimentary': -126, 'metamorphic': 162}
pos = {k: Vector((R * math.cos(math.radians(a)), R * math.sin(math.radians(a)) * 0.8, 0)) for k, a in ang.items()}
mag = rock(pos['magma'], magma, 0.8, 1)
ign = rock(pos['igneous'], vcolmat(rough=0.6, name='Granite'), 0.75, 2)
paint(ign, lambda p: '#1c1c24' if noise.noise(p * 9.0) > 0.35 else ('#f0d6d0' if noise.noise(p * 7 + Vector((5, 5, 5))) > 0 else '#c9a7a0'))
pile = cone(0.8, 0.7, sand, verts=48, loc=pos['sediment'] + Vector((0, 0, 0.35)))
wobble(pile, 0.04, 3, 1)
peb = ico(1.0, pebm, 2)
spots = []
for _ in range(26):
    a, r = random.uniform(0, TAU), random.uniform(0.15, 0.85)
    spots.append(place(pos['sediment'] + Vector((r * math.cos(a), r * math.sin(a), max(0.04, 0.7 * (1 - r / 0.8)) + 0.03)), (random.random(), random.random(), 0), random.uniform(0.05, 0.1)))
merge_instances(peb, spots, 'Pebbles', pebm)
sedr = box((1.3, 0.9, 0.95), sedm, bevel=0.12, loc=pos['sedimentary'] + Vector((0, 0, 0.47)))
wobble(apply_mods(sedr), 0.04, 2.0, 3)
met = rock(pos['metamorphic'], metam, 0.75, 4)
# arrows between them, round the circle
order = ['magma', 'igneous', 'sediment', 'sedimentary', 'metamorphic', 'magma']
mids = []
for a, b in zip(order, order[1:]):
    a0, a1 = math.radians(ang[a]), math.radians(ang[b])
    if a1 > a0:
        a1 -= TAU
    pts = []
    for i in range(17):
        u = 0.22 + 0.56 * i / 16
        t = a0 + (a1 - a0) * u
        pts.append((R * 1.0 * math.cos(t), R * 0.8 * math.sin(t), 0.35 + 0.35 * math.sin(u * math.pi)))
    tube(pts, 0.045, arrow)
    tip, prev = Vector(pts[-1]), Vector(pts[-2])
    c = cone(0.12, 0.3, arrow, verts=24, loc=tip)
    c.rotation_euler = (tip - prev).to_track_quat('Z', 'Y').to_euler()
    mids.append(Vector(pts[8]))

cam = camera((0, -8.2, 6.4), (0, -0.15, 0.25), lens=44)
lights((0, 0, 0.5), rim='#ff9f43')
finish('rock-cycle', 'The rock cycle', ['rock cycle', 'igneous', 'sedimentary', 'metamorphic', 'magma', 'weathering', 'erosion', 'rocks', 'geology'], [
    P('Magma', mag, 'Melted rock deep underground'),
    P('Igneous rock', ign, 'Forms when magma cools and hardens, like granite'),
    P('Sediment', pos['sediment'] + Vector((0, -0.3, 0.4)), 'Bits of rock worn away by weathering and erosion'),
    P('Sedimentary rock', pos['sedimentary'] + Vector((0, -0.45, 0.5)), 'Layers of sediment squashed and stuck together'),
    P('Metamorphic rock', met, 'Rock changed by great heat and pressure'),
    P('Cooling', mids[0], 'Magma cools down and turns solid'),
    P('Heat and pressure', mids[3], 'Deep underground rock is squeezed and baked'),
    P('Melting', mids[4], 'Very hot rock melts back into magma'),
])
