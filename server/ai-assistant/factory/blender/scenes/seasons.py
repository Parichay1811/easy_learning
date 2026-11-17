# Why we have seasons: the Earth's axis is tilted 23.5 degrees and always
# points the same way in space. In June the north is tipped towards the Sun
# (northern summer); in December it is tipped away (northern winter).
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
sunm = glowmat('#ffb43a', 5)
orbitm = mat('#5b8cff', rough=0.5, emit=0.8, alpha=0.7)
axism = glowmat('#e9eeff', 2)
earthm = earthmat(scale=1.4, rim=0.12)
tilt = math.radians(23.5)
sun = sphere(0.9, sunm, seg=64, rings=32)
no_shadow(sun, sphere(1.1, mat('#ffcf6b', alpha=0.15, emit=2), seg=48, rings=24))
point((0, 0, 0), 2500, '#fff1d0', 0.9)
A, B = 4.6, 3.0
tube([(A * math.cos(TAU * i / 256), B * math.sin(TAU * i / 256), 0) for i in range(256)], 0.014, orbitm, closed=True)
earths = {}
# angle 0 = right of the Sun. The axis leans towards +x, so the north pole
# faces the Sun when the Earth is on the left of it.
for key, ang in (('june', 180), ('sept', 270), ('dec', 0), ('march', 90)):
    a = math.radians(ang)
    g = empty('Earth', loc=(A * math.cos(a), B * math.sin(a), 0), rot=(0, tilt, 0))
    e = sphere(0.48, earthm, seg=64, rings=32, parent=g)
    cyl(0.018, 1.45, axism, verts=12, parent=g)
    sphere(0.035, axism, loc=(0, 0, 0.73), parent=g)
    earths[key] = g
# arrows showing the way round
arrow = glowmat('#22d3ee', 2)
for a0 in (200, 290, 20, 110):
    pts = [(A * math.cos(math.radians(a)), B * math.sin(math.radians(a)), 0) for a in [a0 + 50 * i / 12 for i in range(13)]]
    tube(pts, 0.03, arrow)
    tip, prev = Vector(pts[-1]), Vector(pts[-2])
    c = cone(0.09, 0.24, arrow, verts=20, loc=tip)
    c.rotation_euler = (tip - prev).to_track_quat('Z', 'Y').to_euler()

cam = camera((0, -9.4, 7.6), (0, -0.2, -0.3), lens=36)
lights((0, 0, 0), power=0.12, rim='#5b8cff')
E = earths
finish('seasons', "Earth's tilt and the seasons", ['seasons', 'earth tilt', 'axis', 'summer', 'winter', 'equinox', 'solstice', 'orbit', 'sun', 'astronomy', 'geography'], [
    P('Sun', (0, 0, 0.7), 'Lights and warms the side of the Earth facing it'),
    P('Tilted axis', (E['dec'], (0, 0, 0.72)), 'Leans 23.5 degrees and always points the same way'),
    P('June', (E['june'], (0, 0, 0.3)), 'North tipped towards the Sun: northern summer'),
    P('December', (E['dec'], (0, 0, -0.25)), 'North tipped away: northern winter'),
    P('March equinox', E['march'], 'Neither half tipped to the Sun: day equals night'),
    P('September equinox', E['sept'], 'Day and night are the same length again'),
    P('Orbit', (A * math.cos(math.radians(235)), B * math.sin(math.radians(235)), 0), 'One trip round the Sun takes a year'),
])
