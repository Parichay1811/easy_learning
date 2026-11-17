# A section of the Great Wall of China, following the tops of the hills.
# Soldiers walked along the top behind the battlements; watchtowers stood
# within signalling distance of each other, and fires or smoke passed
# warnings along the wall.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(7)
stone = brickmat('#b9ab92', '#a6987e', '#7d725f', scale=3.0, name='WallStone', w=0.5, h=0.25)
top = mat('#9a8e78', rough=0.85)
roofm = mat('#7a3b2e', rough=0.6, rim=0.2)
smoke = mat('#c9ccd8', alpha=0.5, rough=1.0)

ridge = [Vector(p) for p in [(-7.5, 3.0), (-5.0, 1.2), (-2.8, 1.8), (-0.8, -0.2), (1.2, 0.4), (3.0, -1.4), (5.0, -0.8), (7.5, -2.6)]]


def catmull(P, n=20):
    out = []
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = P[max(0, i - 1)], P[i], P[i + 1], P[min(len(P) - 1, i + 2)]
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-1])
    return out


path = catmull(ridge)


def dist_to_path(x, y):
    p = Vector((x, y))
    return min((q - p).length for q in path[::2])


def height(x, y):
    d = dist_to_path(x, y)
    crest = 1.6 + 0.9 * math.sin(x * 0.55 + 1.0) + 0.5 * math.sin(x * 1.3)
    return crest * math.exp(-(d / 2.6) ** 2) + 0.25 * noise.fractal(Vector((x * 0.4, y * 0.4, 3)), 0.6, 2, 3) - 0.3


ter = terrain((17, 13), (140, 110), height, lambda x, y, z: mix('#2f7d3f', '#5fae55', min(1, max(0, (z + 0.3) / 2.8))), name='Hills', m=vcolmat(rough=0.9, name='HillMat'))
W, Hw = 0.45, 0.55
segs = []
merlon = box((0.12, 0.08, 0.14), top)
mm = []
for i in range(len(path) - 1):
    a, b = path[i], path[i + 1]
    za, zb = height(a.x, a.y), height(b.x, b.y)
    A, B = Vector((a.x, a.y, za)), Vector((b.x, b.y, zb))
    d = B - A
    mid = (A + B) / 2
    ang = math.atan2(d.y, d.x)
    pitch = math.atan2(d.z, Vector((d.x, d.y)).length)
    seg = box((d.length + 0.06, W, Hw + 0.5), stone, loc=mid + Vector((0, 0, Hw / 2 - 0.25)), rot=(0, -pitch, ang))
    segs.append(seg)
    side = Vector((-math.sin(ang), math.cos(ang), 0))
    for k in range(2):
        for s in (-1, 1):
            p = A.lerp(B, (k + 0.5) / 2) + side * s * (W / 2 - 0.05) + Vector((0, 0, Hw + 0.07))
            mm.append(place(p, (0, -pitch, ang)))
merge_instances(merlon, mm, 'Battlements', top)
towers = []
for i in range(6, len(path) - 4, 26):
    p = path[i]
    z = height(p.x, p.y)
    t = box((0.95, 0.95, 1.25), stone, bevel=0.02, loc=(p.x, p.y, z + 0.4))
    box((1.0, 1.0, 0.12), top, loc=(p.x, p.y, z + 1.06))
    roof = cone(0.78, 0.4, roofm, verts=4, loc=(p.x, p.y, z + 1.35), rot=(0, 0, math.pi / 4))
    for k in (-1, 1):
        box((0.12, 0.14, 0.28), mat('#2a2030'), loc=(p.x + k * 0.22, p.y - 0.48, z + 0.55))
    towers.append(Vector((p.x, p.y, z)))
sig = towers[2]
for k in range(5):
    sphere(0.16 + k * 0.05, smoke, loc=sig + Vector((0.1 * k, 0.05 * k, 1.7 + k * 0.28)))

cam = camera((0.5, -9.4, 4.8), (0.0, 1.0, 1.5), lens=38)
lights((0, 0, 0.8), power=0.55)
mid_i = len(path) // 2 + 6
pm = path[mid_i]
zm = height(pm.x, pm.y)
finish('great-wall', 'The Great Wall of China', ['great wall', 'china', 'ancient china', 'defence', 'watchtower', 'ming dynasty', 'history', 'wonders of the world'], [
    P('Wall', (pm.x, pm.y - 0.3, zm + 0.1), 'Thousands of km of stone and earth walls'),
    P('Watchtower', tuple(towers[1] + Vector((0, -0.5, 0.6))), 'Soldiers kept watch and stored weapons here'),
    P('Battlements', (path[mid_i + 12].x, path[mid_i + 12].y - 0.2, height(path[mid_i + 12].x, path[mid_i + 12].y) + Hw + 0.1), 'Gaps to look and shoot through, walls to hide behind'),
    P('Smoke signal', tuple(sig + Vector((0.3, 0.1, 2.4))), 'Fires and smoke passed warnings from tower to tower'),
    P('Hilltops', (-4.6, 4.0, height(-4.6, 4.0) + 0.1), 'The wall follows the ridges, hard to climb'),
])
