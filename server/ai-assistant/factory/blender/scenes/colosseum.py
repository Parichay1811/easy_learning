# The Colosseum in Rome (the Flavian Amphitheatre, opened AD 80), shown as
# built. An ellipse about 188 m by 156 m and 48 m high, with three storeys of
# 80 arches (framed by Doric, Ionic and Corinthian half-columns) and a solid
# attic on top, whose brackets held the masts of the velarium awning. Inside,
# tiers of seats (the cavea) rose from a podium round the arena. Part of the
# arena floor is left off to show the hypogeum, the tunnels and cages below.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
trav = mat('#cdb88e', rough=0.8, rim=0.12)
travd = mat('#8c7c5e', rough=0.9, rim=0.05)
innerm = mat('#6f6450', rough=0.9, rim=0.0)
seatm = mat('#bfae8a', rough=0.85, rim=0.08)
sandm = mat('#e2cc94', rough=0.95)
brick = mat('#a86a4a', rough=0.9)
darkm = mat('#3a3328', rough=0.9)
woodm = mat('#7a5a3a', rough=0.8)
A, B = 9.4, 7.8                    # outer semi-axes (1 unit = 10 m)
AA, AB = 4.15, 2.4                 # arena semi-axes
storeys = [(0.0, 1.05), (1.05, 1.18), (2.23, 1.16)]
ZA = 3.39                          # attic base; attic 1.4 high
NB = 80
T = 0.24                           # wall thickness


def ellipse_pts(a, b, n=720):
    return [(a * math.cos(TAU * i / n), b * math.sin(TAU * i / n)) for i in range(n)]


def bays(a, b, n=NB):
    """n points spaced equally along the ellipse, with tangent angle and spacing."""
    P = ellipse_pts(a, b, 2000)
    L = [0.0]
    for i in range(len(P)):
        p0, p1 = P[i], P[(i + 1) % len(P)]
        L.append(L[-1] + math.hypot(p1[0] - p0[0], p1[1] - p0[1]))
    out, total, j = [], L[-1], 0
    for k in range(n):
        s = total * (k + 0.5) / n
        while L[j + 1] < s:
            j += 1
        p0, p1 = P[j % len(P)], P[(j + 1) % len(P)]
        f = (s - L[j]) / (L[j + 1] - L[j])
        x, y = p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f
        out.append((x, y, math.atan2(p1[1] - p0[1], p1[0] - p0[0]), total / n))
    return out


def module(h, open_w=0.62, sill=0.0, col_r=0.055, m=trav):
    """One arched bay, 1 unit wide (x), T deep (y), h high; the outer face is -y."""
    bm = box((1.0, T, h), m, loc=(0, 0, h / 2))
    oh = 0.8 * h - sill
    r = open_w / 2
    cut(bm, box((open_w, T + 0.3, oh - r + 0.01), travd, loc=(0, 0, sill + (oh - r) / 2)))
    cut(bm, cyl(r, T + 0.3, travd, verts=24, loc=(0, 0, sill + oh - r), rot=(math.pi / 2, 0, 0)))
    parts = [bm]
    parts.append(cyl(col_r, h * 0.82, m, verts=12, loc=(-0.5, -T / 2, h * 0.41)))
    parts.append(box((1.0, 0.08, 0.07), m, loc=(0, -T / 2 - 0.03, h - 0.035)))
    for sx in (-1, 1):                   # impost blocks on the piers, where the arch springs
        parts.append(box((0.5 - r, 0.05, 0.04), m, loc=(sx * (0.5 + r) / 2, -T / 2 - 0.02, sill + oh - r)))
    bpy.context.view_layer.update()     # so matrix_world holds each part's place
    me = bpy.data.meshes.new('Module')
    bmx = bmesh.new()
    for ob in parts:
        tmp = ob.data.copy()
        tmp.transform(ob.matrix_world)
        bmx.from_mesh(tmp)
        bpy.data.meshes.remove(tmp)
        bpy.data.objects.remove(ob, do_unlink=True)
    bmx.to_mesh(me); bmx.free()
    return me


def ring_of(me, a, b, z0, m, name, n=NB):
    mats = []
    for x, y, ang, w in bays(a, b, n):
        mats.append(Matrix.Translation((x, y, z0)) @ Matrix.Rotation(ang, 4, 'Z') @ Matrix.Diagonal((w * 1.003, 1, 1, 1)))
    ob = merge_instances(me, mats, name, m)
    for p in ob.data.polygons:          # flat faces: smooth shading makes the boxes look puffy
        p.use_smooth = False
    return ob


bpy.context.view_layer.update()
for k, (z0, h) in enumerate(storeys):
    me = module(h, sill=0.0 if k == 0 else 0.12 * h)
    ring_of(me, A, B, z0, trav, 'Arcade%d' % k)
    me2 = module(h * 0.9, open_w=0.55, sill=0.0 if k == 0 else 0.1 * h, col_r=0.0001)
    ring_of(me2, A - 0.55, B - 0.55, z0, innerm, 'Inner%d' % k)
# the attic: solid, with a window in every other bay and brackets for the masts
att = box((1.0, T, 1.4), trav, loc=(0, 0, 0.7))
cut(att, box((0.14, T + 0.3, 0.32), travd, loc=(-0.25, 0, 0.62)))
for x in (-0.5, 0.0):
    pl = box((0.05, 0.05, 1.3), trav, loc=(x, -T / 2 - 0.02, 0.65))
    bpy.context.view_layer.update()
    tmpm = pl.data.copy(); tmpm.transform(pl.matrix_world)
    bpy.data.objects.remove(pl, do_unlink=True)
    pilasters = globals().setdefault('PIL', [])
    pilasters.append(tmpm)
bpy.context.view_layer.update()
me = bpy.data.meshes.new('Attic')
bmx = bmesh.new()
tmp = att.data.copy(); tmp.transform(att.matrix_world); bmx.from_mesh(tmp); bpy.data.meshes.remove(tmp)
bpy.data.objects.remove(att, do_unlink=True)
for tm in PIL:
    bmx.from_mesh(tm); bpy.data.meshes.remove(tm)
for dz in (1.2,):
    c = box((0.06, 0.08, 0.08), trav, loc=(0.25, -T / 2 - 0.04, dz))
    bpy.context.view_layer.update()
    tmp = c.data.copy(); tmp.transform(c.matrix_world); bmx.from_mesh(tmp); bpy.data.meshes.remove(tmp)
    bpy.data.objects.remove(c, do_unlink=True)
bmx.to_mesh(me); bmx.free()
ring_of(me, A, B, ZA, trav, 'Attic', NB // 2)
# floors over the corridors between the rings
for z in [s[0] + s[1] for s in storeys]:
    verts, faces = [], []
    n = 240
    for i in range(n):
        c, s_ = math.cos(TAU * i / n), math.sin(TAU * i / n)
        verts += [((A - 0.62) * c, (B - 0.62) * s_, z - 0.05), ((A - 0.1) * c, (B - 0.1) * s_, z - 0.05)]
    for i in range(n):
        j = (i + 1) % n
        faces.append((2 * i, 2 * j, 2 * j + 1, 2 * i + 1))
    from_data(verts, faces, 'Floor', innerm, smooth=False)
# the cavea: stepped seating from the podium up to the inner ring
steps = 26
D0, D1 = 0.0, (A - 0.6) - AA
verts, faces = [], []
n = 240
prof = []
for i in range(steps + 1):
    d = D0 + (D1 - D0) * i / steps
    z = 0.45 + 3.15 * (i / steps) ** 1.05
    if i:
        prof.append((d, prof[-1][1]))
    prof.append((d, z))
prof = [(0.0, 0.0)] + prof + [(D1, 0.0)]
for i in range(n):
    c, s_ = math.cos(TAU * i / n), math.sin(TAU * i / n)
    for d, z in prof:
        verts.append(((AA + d) * c, (AB + d * (B - 0.6 - AB) / D1) * s_, z))
m_ = len(prof)
for i in range(n):
    j = (i + 1) % n
    for q in range(m_ - 1):
        faces.append((i * m_ + q, j * m_ + q, j * m_ + q + 1, i * m_ + q + 1))
cavea = from_data(verts, faces, 'Cavea', seatm, smooth=False)
# stairways (radial) and two walkways with a low wall, dividing the seating
stair = mat('#9d8e6e', rough=0.9)
def cav_pt(d, a):
    return ((AA + d) * math.cos(a), (AB + d * (B - 0.6 - AB) / D1) * math.sin(a))
def cav_z(d):
    return 0.45 + 3.15 * (d / D1) ** 1.05
for k in range(40):
    a = TAU * (k + 0.5) / 40
    p0, p1 = cav_pt(0.05, a), cav_pt(D1 - 0.05, a)
    tube([(p0[0], p0[1], cav_z(0.05) + 0.03), (p1[0], p1[1], cav_z(D1 - 0.05) + 0.03)], 0.035, stair)
for d in (D1 * 0.42, D1 * 0.74):
    pts = []
    for i in range(241):
        a = TAU * i / 240
        x, y = cav_pt(d, a)
        pts.append((x, y, cav_z(d) + 0.1))
    tube(pts, 0.05, trav)
# the podium wall round the arena, with a parapet
pod = []
for i in range(n):
    c, s_ = math.cos(TAU * i / n), math.sin(TAU * i / n)
    pod += [(AA * c, AB * s_, 0.0), (AA * c, AB * s_, 0.5)]
from_data(pod, [(2 * i, 2 * ((i + 1) % n), 2 * ((i + 1) % n) + 1, 2 * i + 1) for i in range(n)], 'Podium', trav, smooth=False)
# arena: a sand floor over the west half; the hypogeum shows in the east half
floor_pts = [(AA * math.cos(a), AB * math.sin(a)) for a in [math.pi / 2 + math.pi * i / 60 for i in range(61)]]
prism(floor_pts, 0.08, sandm, loc=(0, 0, 0.3))
box((2 * AA, 2 * AB, 0.05), darkm, loc=(0, 0, -0.5))
for k in range(-4, 5):                      # the hypogeum's parallel walls (east half)
    y = k * 0.48
    if abs(y) > AB - 0.1:
        continue
    xm = AA * math.sqrt(max(0.0, 1 - (y / AB) ** 2)) - 0.05
    box((xm, 0.07, 0.75), brick, loc=(xm / 2, y, -0.12))
for x in (0.6, 1.5, 2.4, 3.3):
    ym = AB * math.sqrt(max(0.0, 1 - (x / AA) ** 2)) - 0.05
    box((0.07, 2 * ym, 0.75), brick, loc=(x, 0, -0.12))
box((0.12, 2 * AB, 0.08), woodm, loc=(0.0, 0, 0.28))
floor(14.0, -0.52, color='#2a2f3a', opacity=0.9)
ground = cyl(13.0, 0.5, mat('#6f6650', rough=0.95), verts=96, loc=(0, 0, -0.26))
cut(ground, prism([(AA * math.cos(TAU * i / 96), AB * math.sin(TAU * i / 96)) for i in range(96)], 1.2, darkm, loc=(0, 0, -0.1)))

cam = camera((3.0, -19.6, 13.4), (0.0, 0.6, 1.0), lens=38)
lights((0, 0, 1.5), power=0.8, rim='#ff9f43', key='#ffe2b8')
sun((-0.4, 0.5, -1), 0.9, '#fff1dc')
bpy.context.view_layer.update()
bx = bays(A, B)
front = min(bx, key=lambda p: p[1])
finish('colosseum', 'The Colosseum', ['colosseum', 'flavian amphitheatre', 'amphitheatre', 'ancient rome', 'roman empire', 'gladiators', 'arena', 'hypogeum', 'roman architecture', 'arches', 'vespasian', 'titus', 'history'], [
    P('Arena', (-2.2, 0.2, 0.34), 'A wooden floor covered in sand for the games'),
    P('Hypogeum', (2.0, -0.95, -0.2), 'Tunnels and cages under the floor; lifts raised animals'),
    P('Seating (cavea)', ((AA + 2.4) * math.cos(math.radians(100)), (AB + 2.4 * (B - 0.6 - AB) / D1) * math.sin(math.radians(100)), 0.45 + 3.15 * (2.4 / D1)), 'Tiers of seats for about 50,000 people, ranked by class'),
    P('Podium', (AA * math.cos(math.radians(250)), AB * math.sin(math.radians(250)), 0.45), 'The front rows, kept for the emperor and senators'),
    P('Arches', (front[0] + 0.0, front[1] - 0.14, 0.45), '80 arches on each level; numbered gates for the crowd'),
    P('Half-columns', (front[0] - 0.5 * math.cos(front[2]) * front[3], front[1] - 0.18, 1.7), 'Doric, Ionic and Corinthian orders, level by level'),
    P('Attic', (bx[25][0] * 1.0, bx[25][1] * 1.0, ZA + 0.8), 'The solid top storey; brackets held velarium masts'),
])
