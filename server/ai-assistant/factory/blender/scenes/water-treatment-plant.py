# A drinking-water treatment plant, the front walls of its tanks cut away.
# River water comes in through a screened intake. A coagulant (such as alum)
# is mixed in fast; slow paddles in the flocculation tank help the tiny
# particles clump into flocs, which sink in the settling tank as sludge.
# A sand filter takes out what is left, chlorine kills germs, and the clean
# water is stored before it is pumped to homes.
# In the loop the water moves, the paddles turn and the flocs settle.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
conc = mat('#b9bdc6', rough=0.75, rim=0.15)
conccut = mat('#d2d5dc', rough=0.8)
waterm = mat('#3b8fe8', rough=0.1, alpha=0.55, rim=0.3)
river = mat('#2f7fe0', rough=0.3, rim=0.15)
murky = mat('#7a8f6a', rough=0.2, alpha=0.6, rim=0.2)
sludgem = mat('#6b4f36', rough=0.9)


def aggmat(c1, c2, gap, scale, name):
    """Grains: Voronoi cells of varied tone with darker gaps."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = 0.85
    tc = N('ShaderNodeTexCoord')
    vo = N('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = scale
    ve = N('ShaderNodeTexVoronoi'); ve.feature = 'DISTANCE_TO_EDGE'; ve.inputs['Scale'].default_value = scale
    L(tc.outputs['Object'], vo.inputs['Vector']); L(tc.outputs['Object'], ve.inputs['Vector'])
    bw = N('ShaderNodeRGBToBW'); L(vo.outputs['Color'], bw.inputs['Color'])
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = lin(c1); ramp.color_ramp.elements[1].color = lin(c2)
    L(bw.outputs['Val'], ramp.inputs['Fac'])
    eg = N('ShaderNodeValToRGB')
    eg.color_ramp.elements[0].color = lin(gap); eg.color_ramp.elements[1].position = 0.15; eg.color_ramp.elements[1].color = (1, 1, 1, 1)
    L(ve.outputs['Distance'], eg.inputs['Fac'])
    mx = N('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1.0
    L(ramp.outputs['Color'], mx.inputs['A']); L(eg.outputs['Color'], mx.inputs['B'])
    L(mx.outputs['Result'], p.inputs['Base Color'])
    return m


gravelm = aggmat('#7d828e', '#b3b8c2', '#3e424b', 12, 'Gravel')
anthm = aggmat('#14161c', '#3a3e48', '#050608', 30, 'Anthracite')
sandm = aggmat('#c9a45e', '#e6c98a', '#9c7c43', 80, 'Sand')
steel = mat('#cfd5e2', rough=0.3, metal=0.8)
paddlem = mat('#ff9f43', rough=0.45, rim=0.2)
pipe = mat('#5b8cff', rough=0.2, alpha=0.45, rim=0.4)
groundm = mat('#3f6f45', rough=0.9)
clm = mat('#d9e04a', rough=0.4, metal=0.3, rim=0.2)
tankm = mat('#8b95b5', rough=0.45, metal=0.4, rim=0.2)
flocm = mat('#8a6a45', rough=0.8)
G_W = glowmat('#7cc8ff', 2.4)
D, WL, T = 1.1, 0.88, 0.1                 # tank depth, water level, wall thickness
Wy = 1.8                                  # tank width (y)


YB, YF = 1.35, -1.75                      # the back row and the front row (y)


def basin(x0, x1, yc, water=waterm, w=Wy, lip=True):
    """An open concrete tank; its front wall is cut away to show inside
    (down to a low lip, or to the floor with lip=False)."""
    b = box((x1 - x0, w, D), conc, loc=((x0 + x1) / 2, yc, D / 2))
    cut(b, box((x1 - x0 - 2 * T, w - 2 * T, D), conccut, loc=((x0 + x1) / 2, yc, D / 2 + T)))
    z0 = 0.24 if lip else T
    cut(b, box((x1 - x0 + 0.2, T + 0.02, D - z0 + 0.1), conccut, loc=((x0 + x1) / 2, yc - w / 2 + T / 2 - 0.005, z0 + (D - z0 + 0.1) / 2)))
    if water:
        box((x1 - x0 - 2 * T, w - 2 * T, WL - T), water, loc=((x0 + x1) / 2, yc, T + (WL - T) / 2))
    return b


box((11.6, 6.4, 0.2), groundm, loc=(-1.9, 0.0, -0.1))
# back row: river, screened intake, flash mixer, flocculation, settling
box((1.6, 6.4, 0.25), river, loc=(-8.5, 0.0, 0.0))
ix = -7.45
for k in range(9):
    tube([(ix, YB - 0.4 + 0.1 * k, 0.05), (ix, YB - 0.4 + 0.1 * k, 0.75)], 0.012, steel)
box((0.08, 0.95, 0.06), steel, loc=(ix, YB, 0.75))
fx = -6.3
fm = cyl(0.55, D, conc, verts=48, loc=(fx, YB, D / 2))
cut(fm, cyl(0.45, D, conccut, verts=48, loc=(fx, YB, D / 2 + T)))
cut(fm, box((1.4, 0.7, D - 0.1), conccut, loc=(fx, YB - 0.55, D / 2 + 0.15)))
cyl(0.45, WL - T, murky, verts=48, loc=(fx, YB, T + (WL - T) / 2))
mixer = empty('Mixer', loc=(fx, YB, 0.45))
tube([(0, 0, 0), (0, 0, 1.0)], 0.03, steel, parent=mixer)
for a in (0, math.pi / 2):
    box((0.55, 0.04, 0.12), paddlem, loc=(0, 0, 0), rot=(0, 0, a), parent=mixer)
box((0.3, 0.3, 0.3), tankm, bevel=0.03, loc=(fx, YB, D + 0.5))
box((1.3, 0.12, 0.06), steel, loc=(fx, YB, D + 0.32))
cyl(0.22, 0.6, mat('#e9eeff', rough=0.4), verts=24, loc=(fx - 0.2, YB + 0.9, D / 2 + 0.25))
tube([(fx - 0.2, YB + 0.9, D + 0.55), (fx - 0.2, YB + 0.9, D + 0.75), (fx - 0.1, YB + 0.3, D + 0.75), (fx - 0.1, YB + 0.3, WL + 0.05)], 0.02, steel)
fl0, fl1 = -5.5, -3.75
basin(fl0, fl1, YB, murky)
paddles = []
for k in range(3):
    x = fl0 + 0.3 + 0.58 * k
    g = empty('Paddle', loc=(x, YB, 0.48))
    tube([(0, -Wy / 2 + T, 0), (0, Wy / 2 - T, 0)], 0.025, steel, parent=g)
    for j in range(4):
        arm = empty('Arm', rot=(0, TAU * j / 4, 0), parent=g)
        box((0.05, 1.3, 0.06), paddlem, loc=(0, 0, 0.26), parent=arm)
        box((0.03, 0.04, 0.28), paddlem, loc=(0, -0.55, 0.13), parent=arm)
        box((0.03, 0.04, 0.28), paddlem, loc=(0, 0.55, 0.13), parent=arm)
    paddles.append(g)
st0, st1 = -3.45, 0.4
basin(st0, st1, YB)
y0, y1 = YB - Wy / 2 + T, YB + Wy / 2 - T
verts = [(st0 + T, y0, T), (st1 - T, y0, T), (st1 - T, y1, T), (st0 + T, y1, T),
         (st0 + T, y0, T + 0.22), (st1 - T, y0, T + 0.05), (st1 - T, y1, T + 0.05), (st0 + T, y1, T + 0.22)]
from_data(verts, [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)], 'Sludge', sludgem, smooth=False)
box((0.25, Wy - 2 * T, 0.18), steel, loc=(st1 - 0.35, YB, WL - 0.04))
flocs = [ico(0.035 + 0.01 * (k % 3), flocm, 1) for k in range(26)]
# front row (flowing right to left): sand filter, chlorine, clear water tank
fi0, fi1 = -1.2, 0.7
basin(fi0, fi1, YF, water=None, lip=False)
fy0, fy1 = YF - Wy / 2 + T, YF + Wy / 2 - T
fw = fi1 - fi0 - 2 * T
for z0, z1, m in ((T, 0.3, gravelm), (0.3, 0.56, sandm), (0.56, 0.72, anthm)):
    box((fw, fy1 - fy0, z1 - z0), m, loc=((fi0 + fi1) / 2, YF, (z0 + z1) / 2))
box((fw, fy1 - fy0, WL - 0.72), waterm, loc=((fi0 + fi1) / 2, YF, (0.72 + WL) / 2))
for k in range(5):                          # underdrain pipes in the gravel
    tube([(fi0 + 0.2 + 0.3 * k, fy0 - 0.005, T + 0.06), (fi0 + 0.2 + 0.3 * k, fy1, T + 0.06)], 0.035, steel)
cx = -2.1
lathe([(0.0, 0.0), (0.22, 0.0), (0.22, 0.9), (0.15, 1.05), (0.06, 1.1), (0.0, 1.1)], clm, seg=40, loc=(cx, YF + 0.7, 0.0))
cyl(0.05, 0.12, steel, verts=16, loc=(cx, YF + 0.7, 1.15))
tube([(cx, YF + 0.7, 1.2), (cx, YF + 0.7, 1.35), (cx, YF + 0.3, 1.35), (cx, YF, 0.95), (cx, YF, 0.75)], 0.018, mat('#e9eeff', rough=0.4), kind='POLY')
tx = -3.4
ct = cyl(0.75, 0.9, tankm, verts=64, loc=(tx, YF, 0.45))
lathe([(0.0, 0.22), (0.77, 0.0), (0.77, 0.04), (0.0, 0.26)], tankm, seg=64, loc=(tx, YF, 0.9))
cut(ct, box((1.8, 0.9, 0.7), conccut, loc=(tx, YF - 0.75, 0.5)))
cyl(0.7, 0.65, waterm, verts=64, loc=(tx, YF, 0.42))
# (point, is the segment from here to the next one in a visible pipe?)
route = [((ix + 0.1, YB, 0.3), True), ((fx - 0.55, YB, 0.3), False), ((fx, YB, 0.3), False), ((fx, YB, 0.62), False),
         ((fx + 0.55, YB, 0.62), True), ((fl0 + 0.05, YB, 0.62), False), ((fl1 - 0.05, YB, 0.7), False),
         ((st0 + 0.05, YB, 0.7), False), ((st1 - 0.35, YB, WL - 0.05), True), ((st1 + 0.05, YB, 0.75), True),
         ((st1 + 0.6, YB, 0.75), True), ((st1 + 0.6, YF, 0.75), True), ((fi1 - 0.05, YF, 0.75), False),
         ((fi1 - 0.3, YF, 0.75), False), ((fi1 - 0.3, YF, T + 0.06), False), ((fi0 + 0.1, YF, T + 0.06), False),
         ((fi0 - 0.05, YF, T + 0.06), True), ((fi0 - 0.4, YF, T + 0.06), True), ((fi0 - 0.4, YF, 0.75), True),
         ((cx, YF, 0.75), True), ((tx + 0.75, YF, 0.75), False), ((tx, YF, 0.3), False), ((tx - 0.75, YF, 0.3), True),
         ((-5.6, YF, 0.3), False)]
path = [p for p, _ in route]
seen = [v for _, v in route][:-1]
run_ = []
for i in range(len(path) - 1):
    if seen[i]:
        run_ = run_ or [path[i]]
        run_.append(path[i + 1])
    if run_ and (not seen[i] or i == len(path) - 2):
        tube(run_, 0.08, pipe, kind='POLY')
        run_ = []
cone(0.14, 0.3, glowmat('#7cc8ff', 2.5), verts=20, loc=(-5.75, YF, 0.3), rot=(0, -math.pi / 2, 0))
P_ = [Vector(p) for p in path]
Ls = [0.0]
for a, b in zip(P_, P_[1:]):
    Ls.append(Ls[-1] + (b - a).length)


def walk(d):
    d %= Ls[-1]
    for i in range(len(P_) - 1):
        if d <= Ls[i + 1]:
            return P_[i].lerp(P_[i + 1], (d - Ls[i]) / max(1e-6, Ls[i + 1] - Ls[i])), seen[i]
    return P_[-1], True


N = 60
dots = [sphere(0.05, G_W, seg=12, rings=8) for _ in range(N)]
no_shadow(*dots)
floor(10.0, -0.21)

cam = camera((-2.7, -8.6, 6.1), (-2.95, -0.6, 0.95), lens=40)
lights((-2, 0, 0.5), rim='#5b8cff')
sun((-0.3, 0.5, -1), 0.8, '#fff1dc')


def run(t):
    mixer.rotation_euler = (0, 0, TAU * 4 * t)
    for k, g in enumerate(paddles):
        g.rotation_euler = (0, TAU * 0.5 * t + k * 0.4, 0)
    for k, d in enumerate(dots):
        p, ok = walk(Ls[-1] * (k + t) / N)
        d.location = p
        d.scale = (1, 1, 1) if ok else (0.001,) * 3
    for k, f in enumerate(flocs):
        u = (k / len(flocs) + t) % 1.0
        x0 = st0 + 0.2 + (k * 0.37) % 2.6
        f.location = (x0 + 0.6 * u, YB - 0.5 + 0.9 * ((k * 0.61) % 1.0), WL - 0.12 - (WL - 0.42) * u)
        s = 1.0 if 0.05 < u < 0.95 else 0.001
        f.scale = (s, s, s)


run(0)
finish('water-treatment-plant', 'A water treatment plant', ['water treatment', 'water treatment plant', 'drinking water', 'coagulation', 'flocculation', 'sedimentation', 'settling tank', 'sand filter', 'filtration', 'chlorination', 'disinfection', 'water supply', 'environmental engineering', 'public health engineering', 'civil engineering'], [
    P('Intake', (ix, YB - 0.42, 0.5), 'River water comes in through a screen'),
    P('Coagulant mixing', (fx, YB - 0.3, 0.45), 'Alum is stirred in fast to make particles stick'),
    P('Flocculation', (fl0 + 0.3 + 0.58, YB - 0.75, 0.74), 'Slow paddles help the particles clump into flocs'),
    P('Settling tank', (-1.9, YB - 0.8, 0.7), 'The water moves slowly so the flocs sink'),
    P('Sludge', (-0.9, YB - 0.8, 0.18), 'Settled flocs, removed from the tank floor'),
    P('Sand filter', ((fi0 + fi1) / 2, YF - 0.8, 0.4), 'Anthracite, sand and gravel strain out the last particles'),
    P('Chlorination', (cx, YF + 0.48, 0.7), 'A small dose of chlorine kills germs'),
    P('Clear water tank', (tx, YF - 0.78, 0.6), 'Clean water is stored, then pumped to homes'),
], anim=run)
