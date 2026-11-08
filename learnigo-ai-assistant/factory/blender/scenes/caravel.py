# A Portuguese caravel (caravela latina) of the 1400s, the ship of the Age of
# Discovery. A light, shallow hull about 20 m long, a raised sterncastle at
# the back, a sternpost rudder, and triangular lateen sails on long sloping
# yards, which let it sail closer to the wind than square-rigged ships, so it
# could beat home against the trade winds. The sails carry the red cross of
# the Order of Christ, which paid for many Portuguese voyages.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
hullm = vcolmat(rough=0.65, name='HullMat')
deckm = mat('#b08a5a', rough=0.7, rim=0.1)
woodd = mat('#4a3220', rough=0.7, rim=0.1)
sparm = mat('#7a5534', rough=0.6, rim=0.1)
rope = mat('#c9b48a', rough=0.8)
sailm = vcolmat(rough=0.85, name='SailMat')
waterm = mat('#17508c', rough=0.6, rim=0.1)
flagm = mat('#c8202a', rough=0.6, rim=0.2)
L2 = 3.0                       # half length (1 unit = about 3.3 m)


def half_beam(x):
    u = (x - 0.2) / (L2 + 0.25)
    b = 0.82 * max(0.0, 1 - u * u) ** 0.55 if x > 0.2 else 0.82 * max(0.0, 1 - ((x - 0.2) / 3.9) ** 2) ** 0.5
    return max(0.02, b)


def keel_z(x):
    return -0.55 + (0.45 * ((x - 1.6) / 1.4) ** 2 if x > 1.6 else 0.0)


def sheer_z(x):
    return 0.42 + 0.05 * ((x + 0.3) / 3.0) ** 2 + (0.18 * ((x - 1.5) / 1.5) ** 2 if x > 1.5 else 0.0)


NX, NZ = 48, 12
xs = [-L2 + 2 * L2 * i / NX for i in range(NX + 1)]
verts, faces, cols = [], [], []
for x in xs:
    zk, zs, B = keel_z(x), sheer_z(x), half_beam(x)
    ring_ = []
    for side in (-1, 1):
        rng = range(NZ, -1, -1) if side < 0 else range(1, NZ + 1)
        for j in rng:
            t = j / NZ
            y = side * B * (math.sin(t * math.pi / 2) ** 0.55) * (1 - 0.05 * t ** 6)
            z = zk + (zs - zk) * t
            ring_.append((x, y, z))
    verts += ring_
W_ = 2 * NZ + 1
for i in range(NX):
    for j in range(W_ - 1):
        a = i * W_ + j
        faces.append((a, a + 1, a + W_ + 1, a + W_))
faces.append(tuple(range(W_))[::-1])                 # the flat transom at the stern
hull = from_data(verts, faces, 'Hull', hullm)
at = hull.data.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
for k, v in enumerate(hull.data.vertices):
    z = v.co.z
    zs = sheer_z(v.co.x)
    c = '#3a2a1e' if z < 0.0 else ('#2a1d14' if abs(z - (zs - 0.18)) < 0.035 or abs(z - (zs - 0.36)) < 0.03 else '#7a5636')
    at.data[k].color = lin(c)
# deck, gunwale rail, sterncastle, rudder
deck = [(x, half_beam(x) * 0.97) for x in xs]
outline = [(x, -y) for x, y in deck] + [(x, y) for x, y in deck[::-1]]
dz = [sheer_z(x) - 0.03 for x in xs]
prism(outline, 0.04, deckm, loc=(0, 0, 0.42))
for side in (-1, 1):
    tube([(x, side * half_beam(x) * 0.99, sheer_z(x) + 0.06) for x in xs[1:-1]], 0.025, woodd)
cx0, cx1 = -2.95, -1.55
sc = box((cx1 - cx0, 2 * half_beam(-2.0) * 0.86, 0.55), mat('#6b4a2e', rough=0.7, rim=0.1), loc=((cx0 + cx1) / 2, 0, 0.72))
box((cx1 - cx0 + 0.06, 2 * half_beam(-2.0) * 0.86 + 0.06, 0.04), deckm, loc=((cx0 + cx1) / 2, 0, 1.01))
for k in range(3):
    box((0.12, 0.02, 0.1), woodd, loc=(cx0 + 0.3 + 0.4 * k, -half_beam(-2.0) * 0.86 - 0.005, 0.8))
for side in (-1, 1):
    y = side * half_beam(-2.0) * 0.86
    tube([(cx0, y, 1.2), (cx1, y, 1.2)], 0.02, woodd)
    for k in range(7):
        x = cx0 + (cx1 - cx0) * k / 6
        tube([(x, y, 1.02), (x, y, 1.2)], 0.012, woodd)
box((0.03, 0.22, 0.32), woodd, loc=(cx1 + 0.005, 0.0, 0.62))
rud = from_data([(-L2 - 0.02, 0, keel_z(-L2) - 0.02), (-L2 - 0.02, 0, 0.75), (-L2 - 0.28, 0, 0.6), (-L2 - 0.36, 0, keel_z(-L2) + 0.05)], [(0, 1, 2, 3)], 'Rudder', woodd, smooth=False)
sol = rud.modifiers.new('S', 'SOLIDIFY'); sol.thickness = 0.06; sol.offset = 0
# masts, lateen yards and sails (red cross of the Order of Christ)
masts = [(1.05, 4.2), (-0.55, 3.5), (-2.1, 2.6)]
yard_ends, mids = [], []


def sail(T, Pk, C, depth=0.28, n=64, cross=True):
    vs, fs, cl = [], [], []
    idx = {}
    cen = (T + Pk + C) / 3
    size = min((Pk - T).length, (C - T).length) * 0.22
    for i in range(n + 1):
        for j in range(n + 1 - i):
            u, v = i / n, j / n
            w = 1 - u - v
            p = T + (Pk - T) * u + (C - T) * v
            p = p + Vector((0, depth * 27 * u * v * w * 0.9, 0))
            idx[(i, j)] = len(vs)
            vs.append(tuple(p))
            q = p - cen
            ax, az = abs(q.x), abs(q.z - 0.1 * size)
            arm = lambda r: 0.16 * size + 0.42 * size * (r / size) ** 1.6
            red = (az < size and ax < arm(az)) or (ax < size and az < arm(ax))
            white = (az < size * 0.82 and ax < 0.045 * size) or (ax < size * 0.82 and az < 0.045 * size)
            cl.append('#e3d8bf' if not (cross and red) or white else '#b81c26')
    for i in range(n):
        for j in range(n - i):
            fs.append((idx[(i, j)], idx[(i + 1, j)], idx[(i, j + 1)]))
            if i + j + 1 < n:
                fs.append((idx[(i + 1, j)], idx[(i + 1, j + 1)], idx[(i, j + 1)]))
    ob = from_data(vs, fs, 'Sail', sailm)
    a = ob.data.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    for k, c in enumerate(cl):
        a.data[k].color = lin(c)
    sol = ob.modifiers.new('S', 'SOLIDIFY'); sol.thickness = 0.01
    return ob


for k, (xm, hm) in enumerate(masts):
    z0 = sheer_z(xm) - 0.03 if xm > cx1 else 1.02
    tube([(xm, 0, z0 - 0.4), (xm, 0, z0 + hm)], 0.06 - 0.01 * k, sparm)
    ly = 1.15 * hm
    th = math.radians(55)
    pivot = Vector((xm + 0.05, 0.08, z0 + hm * 0.8))
    d = Vector((-math.cos(th), 0, math.sin(th)))
    T = pivot - d * ly * 0.42
    Pk = pivot + d * ly * 0.58
    T.z = max(T.z, z0 + 0.25)
    tube([tuple(T), tuple(Pk)], 0.035 - 0.006 * k, sparm)
    C = Vector((xm - 0.62 * hm, 0.08, z0 + 0.42))
    sail(T + Vector((0, 0.01, 0)), Pk + Vector((0, 0.01, 0)), C, depth=0.3 - 0.05 * k, cross=True)
    yard_ends.append((T, Pk, C))
    for side in (-1, 1):                                  # shrouds
        for dx in (-0.25, 0.05):
            tube([(xm, 0, z0 + hm * 0.85), (xm + dx, side * half_beam(xm + dx) * 0.98, sheer_z(xm + dx) + 0.06)], 0.007, rope)
    tube([tuple(T), (xm + 0.6, 0, sheer_z(xm + 0.6) + 0.06)], 0.006, rope)
    tube([tuple(C), (C.x - 0.1, 0, z0 + 0.1)], 0.006, rope)
# a pennant at the mainmast head
xm, hm = masts[0]
pen = from_data([(xm, 0, sheer_z(xm) + hm), (xm - 0.7, 0, sheer_z(xm) + hm - 0.08), (xm, 0, sheer_z(xm) + hm - 0.16)], [(0, 1, 2)], 'Pennant', flagm, smooth=False)
pen.modifiers.new('S', 'SOLIDIFY').thickness = 0.01
# the sea
terrain((40, 40), (160, 160), lambda x, y: 0.05 * math.sin(x * 1.3 + y * 0.4) + 0.04 * math.sin(y * 1.7 - x * 0.6) + 0.03 * noise.noise(Vector((x * 0.6, y * 0.6, 0))),
        name='Sea', m=waterm, loc=(0, 0, 0.0))

cam = camera((7.4, -12.6, 3.4), (-0.35, 0.0, 1.95), lens=47)
lights((0, 0, 1.5), power=0.7, rim='#ffb347', key='#ffe2b8')
sun((-0.5, 0.6, -0.8), 1.0, '#fff1dc')
T0, P0, C0 = yard_ends[0]
finish('caravel', 'A caravel', ['caravel', 'caravela', 'lateen sail', 'age of discovery', 'age of exploration', 'portugal', 'henry the navigator', 'vasco da gama', 'columbus', 'nina', 'ship', 'navigation', 'voyages', 'history'], [
    P('Lateen sail', tuple((T0 + P0 + C0) / 3 + Vector((0.5, 0.25, -0.35))), 'Triangular sails that can sail close to the wind'),
    P('Yard', tuple(T0.lerp(P0, 0.82)), 'A long sloping spar that carries the sail'),
    P('Mainmast', (masts[0][0], 0, sheer_z(masts[0][0]) + 0.8), 'The tallest mast, set well forward'),
    P('Order of Christ cross', tuple((yard_ends[1][0] + yard_ends[1][1] + yard_ends[1][2]) / 3 + Vector((0, 0.3, 0.1))), 'The red cross of the order that funded voyages'),
    P('Sterncastle', ((cx0 + cx1) / 2 + 0.3, -half_beam(-2.0) * 0.86, 0.75), 'A raised deck at the stern for the captain'),
    P('Rudder', (-L2 - 0.25, 0, 0.2), 'Hung on the sternpost and steered with a tiller'),
    P('Hull', (0.6, -half_beam(0.6), 0.2), 'Light and shallow: about 20 m long, 50 tons'),
])
