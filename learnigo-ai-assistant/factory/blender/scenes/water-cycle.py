# The water cycle: the sun warms the sea and water evaporates; the vapour
# cools and condenses into clouds; rain and snow fall on the hills; rivers
# and ground water carry it back to the sea. In the loop rain falls and
# vapour rises.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(6)
seam = mat('#2f86e0', rough=0.25, alpha=0.85, rim=0.3)
cloudm = mat('#f4f7ff', rough=0.9, rim=0.4)
raincl = mat('#9aa3bd', rough=0.9, rim=0.3)
drop = mat('#7cc4ff', rough=0.2, emit=1.2)
vap = mat('#d9f2ff', rough=0.5, alpha=0.6, emit=0.8)
sunm = glowmat('#ffd166', 6)
arrow = glowmat('#fbbf24', 3)
river = mat('#3b8fe8', rough=0.2, rim=0.3)


def height(x, y):
    if x < -0.6:
        return -0.3
    k = min(1, (x + 0.6) / 4.0)
    h = 2.6 * math.exp(-((x - 3.0) / 1.3) ** 2 - ((y - 0.4) / 1.6) ** 2) + 0.35 * k + 0.25 * noise.fractal(Vector((x * 0.6, y * 0.6, 1)), 0.6, 2, 3)
    return max(-0.3, h - 0.35 * max(0.0, 1 - (x + 0.6) / 0.8))


def colour(x, y, z):
    if z < 0.05:
        return '#e8cf94'
    if z > 2.15:
        return '#f2f5ff'
    if z > 1.4:
        return '#8e93a8'
    return mix('#4fae55', '#3c8f47', z / 1.4)


box((10, 5, 0.5), mat('#5a4636', rough=0.9), loc=(0, 0, -0.6))
terrain((10, 5), (140, 70), height, colour, name='Land')
sea = box((4.4, 5, 0.3), seam, loc=(-2.8, 0, -0.15))
path = [Vector(p) for p in [(2.6, -0.6), (2.0, -1.1), (1.2, -1.2), (0.5, -1.6), (-0.2, -1.7), (-0.9, -1.9)]]
pts = []
for i in range(len(path) - 1):
    for k in range(10):
        q = path[i].lerp(path[i + 1], k / 10) + Vector((0.08 * math.sin(i * 3 + k * 0.6), 0))
        pts.append((q.x, q.y, max(0.0, height(q.x, q.y)) + 0.05))
rv = tube(pts, 0.08, river)
rv.data.splines[0].type = 'NURBS'; rv.data.splines[0].use_endpoint_u = True
sun = sphere(0.6, sunm, loc=(-4.0, 1.0, 4.2))


def cloud(c, s, m):
    g = empty('Cloud', loc=c)
    for k in range(12):
        ico(s * random.uniform(0.35, 0.55), m, 3, loc=(random.uniform(-1, 1) * s, random.uniform(-0.3, 0.3) * s, random.uniform(-0.1, 0.35) * s), parent=g)
    return g


c1 = cloud((-0.6, 0.6, 3.6), 1.0, cloudm)
c2 = cloud((2.6, 0.2, 3.5), 1.15, raincl)
# arrows: evaporation up, condensation across, rain down, runoff back
def arc(pts, r=0.05):
    tube(pts, r, arrow, kind='BEZIER')
    a, b = Vector(pts[-2]), Vector(pts[-1])
    c = cone(0.14, 0.32, arrow, verts=24, loc=b)
    c.rotation_euler = (b - a).to_track_quat('Z', 'Y').to_euler()


arc([(-3.0, -1.2, 0.5), (-3.2, -1.2, 1.6), (-2.6, -1.2, 2.9)])
arc([(-1.4, -1.0, 4.3), (0.5, -1.0, 4.75), (1.6, -1.0, 4.35)])
arc([(3.9, -1.1, 2.7), (4.1, -1.1, 2.0), (3.9, -1.1, 1.2)])
arc([(-0.3, -2.25, 0.55), (-1.2, -2.25, 0.45), (-2.2, -2.25, 0.3)])
# rain streaks under the grey cloud, rising vapour over the sea
streak = cyl(0.018, 0.22, drop, verts=8)
rain = []
for k in range(70):
    o = bpy.data.objects.new('Rain', streak.data)
    link(o)
    o['x'], o['y'], o['ph'] = random.uniform(1.6, 3.6), random.uniform(-0.6, 1.0), random.random()
    rain.append(o)
bpy.data.objects.remove(streak, do_unlink=True)
blobv = ico(0.05, vap, 2)
vapour = []
for k in range(40):
    o = bpy.data.objects.new('Vapour', blobv.data)
    link(o)
    o['x'], o['y'], o['ph'] = random.uniform(-4.2, -1.4), random.uniform(-1.5, 1.5), random.random()
    vapour.append(o)
bpy.data.objects.remove(blobv, do_unlink=True)

cam = camera((0.0, -12.5, 4.6), (0.0, 0, 1.9), lens=42)
lights((0, 0, 1.5), power=0.7)


def cycle(t):
    for o in rain:
        u = (o['ph'] + t * 3) % 1.0
        top, ground = 3.1, max(0.0, height(o['x'], o['y']))
        o.location = (o['x'], o['y'], top - u * (top - ground))
    for o in vapour:
        u = (o['ph'] + t * 2) % 1.0
        o.location = (o['x'] + 0.15 * math.sin(u * 6 + o['ph'] * 9), o['y'], 0.05 + u * 2.6)
        s = math.sin(u * math.pi)
        o.scale = (s, s, s)


finish('water-cycle', 'The water cycle', ['water cycle', 'evaporation', 'condensation', 'precipitation', 'rain', 'clouds', 'runoff', 'collection', 'weather', 'geography'], [
    P('Sun', sun, 'Its heat powers the whole cycle'),
    P('Evaporation', (-3.2, -1.2, 1.6), 'Warm water turns into invisible vapour and rises'),
    P('Condensation', (c1, (0.0, -0.5, 0.2)), 'Vapour cools into tiny drops that make clouds'),
    P('Precipitation', (2.9, -0.7, 2.0), 'Water falls back as rain, snow or hail'),
    P('Snow on the peaks', (3.0, -0.2, 2.45), 'Some is stored as snow and ice'),
    P('Runoff', (1.0, -1.5, 0.5), 'Rivers carry the water downhill'),
    P('Collection', (-2.4, -1.6, 0.05), 'Water gathers in the sea, ready to rise again'),
], anim=cycle)
