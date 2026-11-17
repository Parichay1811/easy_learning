# The solar system: the Sun and eight planets on their orbits, with the
# asteroid belt between Mars and Jupiter. Sizes and distances are not to
# scale (the real gaps are far bigger). In the loop the inner planets go
# round faster than the outer ones.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(1)
sunm = glowmat('#ffb43a', 5)
orbitm = mat('#5b8cff', rough=0.5, emit=0.6, alpha=0.6)
jup = bandmat(['#e8c9a0', '#c98f5a', '#f2e3c8', '#b0744a', '#e0b88a'], scale=2.2, axis='Z', rough=0.6, name='Jupiter')
sat = bandmat(['#efdcae', '#d8bf86', '#f5e8c8'], scale=2.0, axis='Z', rough=0.6, name='Saturn')
ringm = mat('#d9c79a', rough=0.6, alpha=0.8, rim=0.2)
rockm = mat('#8b8478', rough=0.8)
PLANETS = [  # name, orbit radius, size, material, orbits per loop, start angle
    ('Mercury', 1.45, 0.11, mat('#9a9590', rough=0.7, rim=0.3), 4, 200),
    ('Venus', 1.95, 0.19, mat('#e8c27a', rough=0.6, rim=0.3), 3, 300),
    ('Earth', 2.5, 0.2, earthmat(scale=1.5), 2, 245),
    ('Mars', 3.05, 0.15, mat('#d0603a', rough=0.7, rim=0.3), 1, 160),
    ('Jupiter', 4.15, 0.5, jup, 1, 290),
    ('Saturn', 5.2, 0.42, sat, 1, 20),
    ('Uranus', 6.1, 0.29, mat('#8fe3ef', rough=0.5, rim=0.3), 1, 120),
    ('Neptune', 6.9, 0.28, mat('#4f73e8', rough=0.5, rim=0.3), 1, 230),
]
sun = sphere(0.85, sunm, seg=64, rings=32)
halo = sphere(1.05, mat('#ffcf6b', alpha=0.15, emit=2), seg=48, rings=24)
no_shadow(sun, halo)
bodies = []
for name, R, s, m, n, a0 in PLANETS:
    ring(R, 0.012, orbitm, n=192)
    p = sphere(s, m, seg=48, rings=24, name=name)
    p.rotation_euler = (math.radians(15), 0, 0)
    bodies.append((p, R, n, math.radians(a0)))
    if name == 'Saturn':
        r = lathe([(0.55, 0), (0.85, 0)], ringm, seg=96, parent=p)
        r.rotation_euler = (math.radians(-35), 0, 0)
rock = ico(1.0, rockm, 1)
merge_instances(rock, [place((r * math.cos(a), r * math.sin(a), random.uniform(-0.06, 0.06)), (random.random(), random.random(), 0), random.uniform(0.015, 0.035))
                       for r, a in [(random.uniform(3.4, 3.75), random.uniform(0, TAU)) for _ in range(500)]], 'Asteroids', rockm)
point((0, 0, 0), 900, '#fff1d0', 0.8)

cam = camera((0, -14.6, 8.8), (0, -0.3, -0.6), lens=34)
lights((0, 0, 0), power=0.35, rim='#5b8cff')


def orbit(t):
    for p, R, n, a0 in bodies:
        a = a0 + TAU * n * t
        p.location = (R * math.cos(a), R * math.sin(a), 0)
        if p.name != 'Saturn':   # its ring would wobble
            p.rotation_euler.z = TAU * 2 * t


B = {p.name: p for p, *_ in bodies}
finish('solar-system', 'The solar system', ['solar system', 'planets', 'sun', 'orbit', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'space', 'astronomy'], [
    P('Sun', (0, 0, 0.6), 'Our star: everything here goes round it'),
    P('Mercury', B['Mercury'], 'Closest and fastest: a year is 88 days'),
    P('Venus', B['Venus'], 'Hottest planet, wrapped in thick clouds'),
    P('Earth', B['Earth'], 'Our home: the only planet known to have life'),
    P('Mars', B['Mars'], 'The red planet: rusty dust and huge volcanoes'),
    P('Jupiter', B['Jupiter'], 'Biggest planet: a giant ball of gas'),
    P('Saturn', B['Saturn'], 'Famous for its bright rings of ice and rock'),
    P('Neptune', B['Neptune'], 'Farthest planet: cold, blue and windy'),
], anim=orbit, frames=144)
