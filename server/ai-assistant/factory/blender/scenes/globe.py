# A globe with lines of latitude and longitude. Latitude lines run east-west
# and measure how far north or south (the Equator is 0 degrees); longitude
# lines run pole to pole and measure east-west from the Prime Meridian
# (0 degrees, through Greenwich). The axis tilts 23.5 degrees.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
R = 1.8
lat = mat('#e9eeff', rough=0.4, emit=1.0)
eq = glowmat('#fbbf24', 3)
pm = glowmat('#fb7185', 3)
trop = mat('#22d3ee', rough=0.4, emit=1.6)
standm = mat('#c9a464', rough=0.3, metal=0.8, rim=0.2)
basem = mat('#3a3150', rough=0.4, rim=0.2)
tilt = math.radians(23.5)
g = empty('Globe', loc=(0, 0, 0.35), rot=(0, tilt, 0))
earth = sphere(R, earthmat(scale=1.0, rim=0.25, ice=0.9), seg=128, rings=64, parent=g)
earth.rotation_euler = (0, 0, math.radians(-110))
for d in (-60, -30, 30, 60):
    a = math.radians(d)
    ring(R * math.cos(a) + 0.004, 0.008, lat, n=160, z=R * math.sin(a), parent=g)
for d in (-23.44, 23.44, 66.56):
    a = math.radians(d)
    pts = []
    for i in range(80):
        if i % 2 == 0:
            t0, t1 = TAU * i / 80, TAU * (i + 1) / 80
            tube([((R * math.cos(a) + 0.004) * math.cos(t), (R * math.cos(a) + 0.004) * math.sin(t), R * math.sin(a)) for t in (t0, t1)], 0.01, trop, parent=g)
ring(R + 0.006, 0.016, eq, n=192, parent=g)
for k in range(12):
    th = TAU * k / 12
    pts = [((R + 0.005) * math.cos(p) * math.cos(th), (R + 0.005) * math.cos(p) * math.sin(th), (R + 0.005) * math.sin(p)) for p in [math.radians(-90 + 180 * i / 60) for i in range(61)]]
    tube(pts, 0.016 if k == 9 else 0.008, pm if k == 9 else lat, parent=g)
# axis, meridian arc and stand
tube([(0, 0, -R - 0.25), (0, 0, R + 0.25)], 0.03, standm, parent=g)
arc = [((R + 0.18) * math.cos(p), 0, (R + 0.18) * math.sin(p)) for p in [math.radians(-100 + 200 * i / 60) for i in range(61)]]
tube([(-x, y, z) for x, y, z in arc], 0.05, standm, parent=g)
lathe([(0.0, -2.35), (0.9, -2.35), (0.95, -2.25), (0.4, -2.15), (0.12, -1.95), (0.12, -1.75), (0.0, -1.75)], basem, seg=64)
tube([(0, 0, -1.8), (0, 0, -1.2)], 0.06, standm)

cam = camera((0.3, -9.6, 0.6), (0, 0, 0.05), lens=46)
lights((0, 0, 0))
bpy.context.view_layer.update()
M = g.matrix_world


def on(latd, lond, r=R):
    a, b = math.radians(latd), math.radians(lond)
    return tuple(M @ Vector((r * math.cos(a) * math.cos(b), r * math.cos(a) * math.sin(b), r * math.sin(a))))


finish('globe', 'Latitude and longitude', ['globe', 'latitude', 'longitude', 'equator', 'prime meridian', 'tropics', 'north pole', 'maps', 'geography', 'earth'], [
    P('Equator', on(0, -100), '0 degrees latitude: halfway between the poles'),
    P('Prime Meridian', on(25, -90 + 0.0 * 270 + 0, R) if False else on(18, 270 - 0), '0 degrees longitude, through Greenwich in London'),
    P('Latitude lines', on(-30, -60), 'Run east to west: how far north or south'),
    P('Longitude lines', on(-45, -120), 'Run pole to pole: how far east or west'),
    P('Tropic of Cancer', on(23.44, -60), '23.5 degrees north: the Sun is overhead in June'),
    P('North Pole', on(90, 0, R + 0.02), '90 degrees north: the top of the Earth\'s axis'),
    P('Tilted axis', tuple(M @ Vector((0, 0, -R - 0.18))), 'The Earth leans 23.5 degrees'),
])
