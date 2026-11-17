# The electricity grid, from power station to homes. The generator's output
# (about 25 kV) is stepped up to hundreds of kilovolts for the long-distance
# transmission lines on pylons, because a higher voltage means a smaller
# current and less I^2R loss. A substation steps it down again; distribution
# lines on poles carry it to homes at 230 V (or 120 V).
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
ground = mat('#3f7f4a', rough=0.9, rim=0.05)
concrete = mat('#c7ccd8', rough=0.7, rim=0.15)
hall = mat('#8fa2c8', rough=0.6, rim=0.2)
roofm = mat('#4a5578', rough=0.6)
steelm = mat('#c9d2e8', rough=0.35, metal=0.7, rim=0.15)
wire = mat('#e9eeff', rough=0.3, metal=0.8, rim=0.3)
insm = mat('#8fd3c7', rough=0.2, rim=0.2)
tankm = mat('#7f8aa6', rough=0.45, metal=0.5, rim=0.2)
porcelain = mat('#e8e2d4', rough=0.35)
wood = mat('#8a5a3b', rough=0.8)
steam = mat('#d9e1ee', rough=0.95, alpha=0.5, rim=0.05)
housem = [mat('#f2e6d0', rough=0.7, rim=0.1), mat('#e9c9a4', rough=0.7, rim=0.1), mat('#d7e3f2', rough=0.7, rim=0.1)]
roofh = mat('#b5523b', rough=0.7, rim=0.1)
win = glowmat('#ffd27a', 3.0)
fence = mat('#9aa3b8', rough=0.5, metal=0.5)

G = None          # the group (an empty) the helpers build into, or None
def at(loc, rz=0.0):
    """Start a group at loc turned by rz about z; returns its matrix."""
    global G, GM
    loc = (loc[0], loc[1], 0.0)
    G = empty('G', loc=loc, rot=(0, 0, rz))
    GM = Matrix.Translation(loc) @ Matrix.Rotation(rz, 4, 'Z')
    return GM
def Wp(p):
    return tuple(GM @ Vector(p))
def K():
    return dict(parent=G)


floor(17.0, 0.0, color='#2a5e37', opacity=0.97)
# power station: turbine hall, boiler house, chimney and a cooling tower
at((-8.4, -1.2), math.radians(-25))
box((2.6, 1.6, 1.1), hall, bevel=0.03, loc=(0.4, 0.0, 0.55), **K())
box((2.62, 1.62, 0.08), roofm, loc=(0.4, 0.0, 1.12), **K())
box((1.2, 1.4, 1.9), hall, bevel=0.03, loc=(-1.3, 0.0, 0.95), **K())
cyl(0.2, 3.6, concrete, verts=32, r2=0.14, loc=(-1.3, 0.9, 1.8), **K())
prof = [(1.25 * math.sqrt(1 + ((z - 2.3) / 1.3) ** 2) * 0.62, z) for z in [i * 3.2 / 20 for i in range(21)]]
ct = lathe(prof, concrete, seg=64, loc=(0.2, 2.4, 0), **K())
sol = ct.modifiers.new('S', 'SOLIDIFY'); sol.thickness = 0.06
blob((1.0, 1.0, 0.75), steam, subdiv=4, lumps=0.25, loc=(0.35, 2.4, 3.9), **K())
blob((0.7, 0.7, 0.5), steam, subdiv=4, lumps=0.25, loc=(1.0, 2.5, 4.5), **K())
for k in range(5):
    box((0.18, 0.02, 0.2), win, loc=(-0.5 + 0.45 * k, -0.81, 0.6), **K())
station_pt = Wp((0.4, -0.8, 0.8))


def transformer(x, y, s=1.0, n_bush=3):
    """A power transformer: tank, radiator fins, conservator, bushings."""
    box((1.1 * s, 0.8 * s, 0.9 * s), tankm, bevel=0.03, loc=(x, y, 0.45 * s + 0.1), **K())
    for k in range(6):
        box((0.04 * s, 0.25 * s, 0.7 * s), tankm, loc=(x - 0.45 * s + 0.18 * s * k, y - 0.52 * s, 0.45 * s + 0.1), **K())
    cyl(0.14 * s, 0.9 * s, tankm, verts=24, loc=(x, y + 0.3 * s, 1.15 * s + 0.1), rot=(0, math.pi / 2, 0), **K())
    tops = []
    for k in range(n_bush):
        bx = x + (k - (n_bush - 1) / 2) * 0.34 * s
        for j in range(6):
            cyl(0.07 * s, 0.05 * s, porcelain, verts=20, loc=(bx, y - 0.1 * s, 1.0 * s + 0.1 + j * 0.075 * s), **K())
        cyl(0.035 * s, 0.5 * s, porcelain, verts=12, loc=(bx, y - 0.1 * s, 1.15 * s + 0.1), **K())
        tops.append(Wp((bx, y - 0.1 * s, 1.42 * s + 0.1)))
    return tops


at((-5.7, -0.3), math.radians(-30))
box((1.8, 1.5, 0.1), concrete, loc=(0, 0.0, 0.05), **K())
su_tops = transformer(0, 0.0, 1.0)
su_pt = Wp((0, -0.45, 0.7))


def pylon(H=4.4):
    """A lattice steel tower at the group's origin, double circuit: three
    cross-arms each side (along the group's y)."""
    def leg(sx, sy, z):
        if z <= 3.0:
            w = 0.5 - 0.38 * z / 3.0
        else:
            w = 0.12 * (1 - 0.4 * (z - 3.0) / (H - 3.3))
        return (sx * w * 0.8, sy * w, z)
    zs = [0.0, 0.7, 1.3, 1.85, 2.35, 2.8, 3.25, 3.7, H - 0.3]
    for sx in (-1, 1):
        for sy in (-1, 1):
            tube([leg(sx, sy, z) for z in zs], 0.028, steelm, **K())
    for (a, b) in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
        for i in range(len(zs) - 1):
            p0 = leg(*a, zs[i]) if i % 2 == 0 else leg(*b, zs[i])
            p1 = leg(*b, zs[i + 1]) if i % 2 == 0 else leg(*a, zs[i + 1])
            tube([p0, p1], 0.012, steelm, **K())
    tube([(0, 0, H - 0.3), (0, 0, H + 0.1)], 0.02, steelm, **K())
    pts = []
    for z, L in ((2.5, 1.0), (3.05, 1.25), (3.6, 1.0)):
        for s in (-1, 1):
            w = leg(1, 1, z)[1]
            tube([(-0.1, s * w, z), (0, s * L, z + 0.05), (0.1, s * w, z)], 0.018, steelm, **K())
            tube([(0, s * w, z + 0.12), (0, s * L, z + 0.05)], 0.014, steelm, **K())
            for j in range(5):
                cyl(0.045, 0.03, insm, verts=16, loc=(0, s * L, z - 0.06 - j * 0.06), **K())
            pts.append(Wp((0, s * L, z - 0.36)))
    return pts, Wp((0, 0, H + 0.1))


def span(a, b, sag=0.35, r=0.014, m=wire):
    pts = []
    for i in range(17):
        t = i / 16
        p = Vector(a).lerp(Vector(b), t)
        p.z -= sag * 4 * t * (1 - t)
        pts.append(tuple(p))
    tube(pts, r, m)


towers = [((-3.3, 1.2), -48), ((-0.2, 3.0), -15), ((3.0, 2.6), 25)]
attach, peaks = [], []
for (x, y), deg in towers:
    at((x, y), math.radians(deg))
    a, pk = pylon()
    attach.append(a); peaks.append(pk)
for i in range(len(towers) - 1):
    for a, b in zip(attach[i], attach[i + 1]):
        span(a, b)
    span(peaks[i], peaks[i + 1], 0.25, 0.01)
for k, top in enumerate(su_tops):
    span(top, attach[0][[0, 2, 4][k]], 0.2)
# substation: fence, gantry, two step-down transformers
at((5.6, 0.6), math.radians(40))
box((3.4, 2.6, 0.06), concrete, loc=(0, 0, 0.03), **K())
for (a, b) in (((-1.7, -1.3), (1.7, -1.3)), ((1.7, -1.3), (1.7, 1.3)), ((1.7, 1.3), (-1.7, 1.3)), ((-1.7, 1.3), (-1.7, -1.3))):
    n = 9
    for i in range(n + 1):
        px = a[0] + (b[0] - a[0]) * i / n; py = a[1] + (b[1] - a[1]) * i / n
        tube([(px, py, 0), (px, py, 0.5)], 0.012, fence, **K())
    tube([(a[0], a[1], 0.5), (b[0], b[1], 0.5)], 0.01, fence, **K())
    tube([(a[0], a[1], 0.25), (b[0], b[1], 0.25)], 0.008, fence, **K())
gx = -1.1
for y in (-1.0, 1.0):
    tube([(gx, y, 0), (gx, y, 2.6)], 0.04, steelm, **K())
tube([(gx, -1.0, 2.6), (gx, 1.0, 2.6)], 0.04, steelm, **K())
gtops = []
for y in (-1.0, 0.0, 1.0):
    for j in range(4):
        cyl(0.045, 0.03, insm, verts=16, loc=(gx, y * 0.8, 2.52 - j * 0.06), **K())
    gtops.append(Wp((gx, y * 0.8, 2.3)))
sd1 = transformer(0.4, -0.5, 0.6)
sd2 = transformer(0.4, 0.7, 0.6)
sub_pt = Wp((0.4, -0.85, 0.5))
for a, b in zip([attach[-1][1], attach[-1][3], attach[-1][5]], gtops):
    span(a, b, 0.25)
for g, t in zip(gtops, sd1):
    span(g, t, 0.1, 0.01)
# distribution: wooden poles with a cross-arm, lines to houses
ptops = []
for (px, py), deg in (((6.6, -1.6), 60), ((7.4, -3.4), 70)):
    at((px, py), math.radians(deg))
    cyl(0.07, 2.2, wood, verts=16, loc=(0, 0, 1.1), **K())
    box((0.08, 0.8, 0.08), wood, loc=(0, 0, 2.05), **K())
    ptops.append([Wp((0, dy, 2.12)) for dy in (-0.33, 0.0, 0.33)])
    for dy in (-0.33, 0.0, 0.33):
        cyl(0.035, 0.08, porcelain, verts=12, loc=(0, dy, 2.12), **K())
for a, b in zip(ptops[0], ptops[1]):
    span(a, b, 0.12, 0.01)
for a, b in zip(sd1, ptops[0]):
    span(a, b, 0.15, 0.01)
homes = []
for k, ((hx, hy), deg) in enumerate((((5.6, -4.3), 10), ((7.0, -5.1), 0), ((8.6, -4.4), -10))):
    at((hx, hy), math.radians(deg))
    w, d, h = 1.0, 0.9, 0.75
    box((w, d, h), housem[k], loc=(0, 0, h / 2), **K())
    prism([(-w / 2 - 0.08, 0), (w / 2 + 0.08, 0), (0, 0.45)], d + 0.12, roofh, loc=(0, 0, h), rot=(math.pi / 2, 0, 0), **K())
    box((0.2, 0.02, 0.2), win, loc=(-0.2, -d / 2 - 0.01, 0.42), **K())
    box((0.2, 0.02, 0.2), win, loc=(0.2, -d / 2 - 0.01, 0.42), **K())
    homes.append(Wp((0, -d / 2, 0.3)))
    span(ptops[1][k], Wp((0, 0.2, h + 0.25)), 0.08, 0.008)

cam = camera((0.0, -19.5, 11.5), (0.2, -0.2, 1.0), lens=36)
lights((0, 0, 1.0), power=0.9, rim='#5b8cff')
sun((-0.3, 0.4, -1), 1.5, '#fff1dc')
finish('power-grid', 'The electricity grid', ['power grid', 'electricity grid', 'national grid', 'transmission lines', 'power transmission', 'pylons', 'substation', 'step-up transformer', 'step-down transformer', 'distribution', 'power station', 'high voltage', 'power systems', 'electrical engineering'], [
    P('Power station', station_pt, 'Generators make AC at about 25 kV'),
    P('Step-up transformer', su_pt, 'Raises the voltage to hundreds of kV'),
    P('Transmission lines', tuple(Vector(attach[0][3]).lerp(Vector(attach[1][3]), 0.5) - Vector((0, 0, 0.35))), 'High voltage, low current: less I squared R loss'),
    P('Pylon', (-0.2, 3.0, 1.4), 'A lattice steel tower holding the lines up'),
    P('Substation', sub_pt, 'Transformers step the voltage down for local use'),
    P('Distribution lines', tuple(Vector(ptops[0][0]).lerp(Vector(ptops[1][0]), 0.5) - Vector((0, 0, 0.12))), 'Lower-voltage lines on poles run along streets'),
    P('Homes', homes[1], 'Supplied at 230 V (120 V in North America)'),
])
