# A river from source to sea: it starts high in the mountains, is joined by
# a tributary, winds across the flat floodplain in meanders and reaches the
# sea at its mouth. In the loop the water flows.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(3)
water = flowmat('#2f7fe0', '#74bdff', scale=3.0, strength=1.2, axis='X', distort=2.5, name='River')
seam = mat('#2a6fd1', rough=0.15, alpha=0.75, rim=0.4)


def catmull(P, n=12):
    out = []
    for i in range(len(P) - 1):
        p0, p1, p2, p3 = P[max(0, i - 1)], P[i], P[i + 1], P[min(len(P) - 1, i + 2)]
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-1])
    return out


main = catmull([Vector(p) for p in [(-3.6, 3.2), (-2.9, 2.2), (-2.2, 1.6), (-1.4, 0.9), (-0.9, 0.0), (-0.1, -0.2), (0.3, -0.9), (1.2, -0.7), (1.5, -1.5), (2.4, -1.6), (3.1, -2.4), (3.9, -2.9)]])
trib = catmull([Vector(p) for p in [(0.6, 3.4), (0.4, 2.4), (-0.3, 1.4), (-1.0, 0.7)]])


def seg_dist(p, pts):
    best, bi = 1e9, 0
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]
        ab = b - a
        t = max(0.0, min(1.0, (p - a).dot(ab) / ab.length_squared))
        d = (a + ab * t - p).length
        if d < best:
            best, bi = d, i + t
    return best, bi / (len(pts) - 1)


def land(x, y):
    g = (y + 4) / 8.0
    r = (x + 5) / 10.0
    h = 3.2 * g ** 1.8 * (1.1 - 0.5 * r) + 0.55 * noise.fractal(Vector((x * 0.45, y * 0.45, 2.0)), 0.6, 2.0, 4) * g + 0.25
    h -= 1.4 * max(0.0, (r - 0.72)) * 2.0 * max(0.0, 1 - g * 1.4)
    return h


def height(x, y):
    p = Vector((x, y))
    h = land(x, y)
    for pts, w0 in ((main, 0.1), (trib, 0.07)):
        d, s = seg_dist(p, pts)
        if d > 1.5:
            continue
        w = w0 + 0.25 * s                      # wider downstream
        depth = 0.12 + 0.55 * (1 - s) ** 2     # a deep V-valley upstream, shallow below
        h -= depth * math.exp(-(d / (w + 0.25 * (1 - s))) ** 2)
        if s > 0.45:                           # flatten the floodplain beside the meanders
            k = math.exp(-(d / 0.9) ** 2) * min(1, (s - 0.45) * 4)
            h = h * (1 - 0.5 * k) + (0.12 + 0.3 * (1 - s)) * 0.5 * k
    return h


def colour(x, y, z):
    if z < 0.06:
        return '#e8cf94'
    if z < 0.9:
        return mix('#4fae55', '#3c8f47', z / 0.9)
    if z < 1.9:
        return mix('#3c8f47', '#7c7f8f', (z - 0.9) / 1.0)
    return '#f2f5ff' if z > 2.9 else '#9aa0b5'


ter = terrain((10, 8), (150, 120), height, colour, name='Land', m=vcolmat(rough=0.75, name='LandMat'))
sea = box((3.4, 3.2, 0.3), seam, loc=(3.3, -2.4, -0.13))   # the sea fills the low corner
box((10, 8, 0.5), mat('#5a4636', rough=0.9), loc=(0, 0, -0.53))   # the base of the model


def ribbon(pts, w0, w1, name):
    verts, faces = [], []
    n = len(pts)
    for i, p in enumerate(pts):
        s = i / (n - 1)
        a, b = pts[max(0, i - 1)], pts[min(n - 1, i + 1)]
        d = (b - a).normalized()
        nrm = Vector((-d.y, d.x))
        w = w0 + (w1 - w0) * s
        for side in (-1, 1):
            q = p + nrm * w * side
            verts.append((q.x, q.y, height(p.x, p.y) + 0.035))
    for i in range(n - 1):
        faces.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
    return from_data(verts, faces, name, water)


river = ribbon(main, 0.06, 0.2, 'River')
tribr = ribbon(trib, 0.04, 0.08, 'Tributary')
# a few trees on the lower slopes
tree = cone(0.08, 0.26, mat('#2f7d3f', rough=0.7), verts=8)
spots = []
for _ in range(120):
    x, y = random.uniform(-4.5, 2.5), random.uniform(-3.5, 1.5)
    z = height(x, y)
    if 0.3 < z < 1.4 and seg_dist(Vector((x, y)), main)[0] > 0.4:
        spots.append(place((x, y, z + 0.12), (0, 0, 0), random.uniform(0.7, 1.2)))
merge_instances(tree, spots, 'Forest')

cam = camera((0.8, -13.2, 8.4), (0.0, 0.0, 0.2), lens=42)
lights((0, 0, 0.5), power=0.55)


def flow(t):
    set_phase(water, t, 2)


def at(pts, s, dz=0.06):
    p = pts[int(s * (len(pts) - 1))]
    return (p.x, p.y, height(p.x, p.y) + dz)


finish('river-course', 'A river from source to sea', ['river', 'river course', 'source', 'meander', 'tributary', 'mouth', 'floodplain', 'water cycle', 'geography', 'landforms'], [
    P('Source', at(main, 0.0), 'Where the river begins, high in the hills'),
    P('Upper course', at(main, 0.17), 'Steep and fast: it cuts a V-shaped valley'),
    P('Tributary', at(trib, 0.4), 'A smaller river that joins the main one'),
    P('Meander', at(main, 0.62), 'A wide bend on the flat land'),
    P('Floodplain', (0.9, -0.15, height(0.9, -0.15)), 'Flat land the river spreads over in a flood'),
    P('Mouth', at(main, 0.97), 'Where the river meets the sea'),
    P('Sea', (3.8, -3.6, 0.0), 'The water flows on into the sea'),
], anim=flow)
