# Shakespeare's Globe theatre (London, 1599), with the near part cut away.
# A 20-sided timber-framed ring about 30 m across, with three tiers of
# roofed galleries and a thatched roof, round an open yard where the
# groundlings stood. The stage thrust out into the yard; two pillars held up
# the "heavens", a canopy painted with stars. Behind the stage, the tiring
# house: the actors' dressing rooms, with doors onto the stage and a balcony
# above. A flag on the hut showed that a play was on that day.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)


def strawmat(name='Thatch'):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = 0.95
    tc = N('ShaderNodeTexCoord')
    w = N('ShaderNodeTexWave'); w.wave_type = 'BANDS'; w.bands_direction = 'Z'
    w.inputs['Scale'].default_value = 40.0; w.inputs['Distortion'].default_value = 6.0; w.inputs['Detail'].default_value = 4
    L(tc.outputs['Object'], w.inputs['Vector'])
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = lin('#6e5428'); ramp.color_ramp.elements[1].color = lin('#a8864a')
    L(w.outputs['Fac'], ramp.inputs['Fac']); L(ramp.outputs['Color'], p.inputs['Base Color'])
    bp = N('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.4
    L(w.outputs['Fac'], bp.inputs['Height']); L(bp.outputs['Normal'], p.inputs['Normal'])
    return m


plaster = mat('#efe6d2', rough=0.85, rim=0.1)
timber = mat('#5a3a22', rough=0.75, rim=0.1)
floorm = mat('#8a6a48', rough=0.85)
benchm = mat('#7a5c3c', rough=0.85)
thatch = strawmat()
yardm = mat('#5e5040', rough=0.95)
stagem = mat('#9a6b3e', rough=0.7, rim=0.1)
marble = mat('#c9b8a0', rough=0.5, rim=0.15)
redm = mat('#a83a32', rough=0.6, rim=0.15)
gold = mat('#d8b04a', rough=0.35, metal=0.7, rim=0.2)
skym = mat('#1f3a7a', rough=0.6)
star = glowmat('#ffd27a', 2.0)
tiles = mat('#8a4a32', rough=0.8, rim=0.1)
flagm = mat('#e5484d', rough=0.6, rim=0.2)

NSEG = 20
RO, RI = 7.5, 5.6               # outer and inner radius of the gallery ring (1 unit = 2 m)
ZE = 4.5                        # eaves height
levels = [0.25, 1.75, 3.25]     # gallery floors


def ang(k):
    return math.radians(90 + 360 * k / NSEG)


def pt(r, a, z=0.0):
    return (r * math.cos(a), r * math.sin(a), z)


def quad_box(p0, p1, z0, z1, th, m):
    """A flat wall panel from p0 to p1 (x, y) between heights z0 and z1."""
    d = Vector((p1[0] - p0[0], p1[1] - p0[1], 0))
    c = ((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (z0 + z1) / 2)
    return box((d.length, th, z1 - z0), m, loc=c, rot=(0, 0, math.atan2(d.y, d.x)))


def beam(a, b, r=0.045):
    tube([a, b], r, timber)


box((20, 20, 0.1), yardm, loc=(0, 0, -0.05))
skip = lambda k: abs(((90 + 360 * k / NSEG) % 360) - 270) < 40      # the cut-away near segments
tiring = lambda k: abs(((90 + 360 * k / NSEG) % 360) - 90) < 20
for k in range(NSEG):
    if skip(k):
        continue
    a0, a1 = ang(k - 0.5), ang(k + 0.5)
    o0, o1 = pt(RO, a0), pt(RO, a1)
    i0, i1 = pt(RI, a0), pt(RI, a1)
    quad_box(o0, o1, 0.0, ZE, 0.12, plaster)
    # timber framing on the outer face: posts, rails and braces
    oo0, oo1 = pt(RO + 0.07, a0), pt(RO + 0.07, a1)
    for p in (oo0, oo1):
        beam((p[0], p[1], 0.0), (p[0], p[1], ZE), 0.06)
    for z in levels + [ZE - 0.05]:
        beam((oo0[0], oo0[1], z), (oo1[0], oo1[1], z))
    for j, z in enumerate(levels):
        zt = levels[j + 1] if j + 1 < len(levels) else ZE
        beam((oo0[0], oo0[1], z), (oo1[0], oo1[1], zt))
    # gallery floors and the inner posts with rails
    for z in levels:
        prism([i0[:2], i1[:2], o1[:2], o0[:2]], 0.1, floorm, loc=(0, 0, z))
        # tiered benches on each floor
        # solid stepped tiers rising towards the back wall, like the real degrees
        for s in range(4):
            r = RI + 0.3 + 0.36 * s
            h = 0.13 * (s + 1)
            prism([pt(r, a0)[:2], pt(r, a1)[:2], pt(RO - 0.08, a1)[:2], pt(RO - 0.08, a0)[:2]], h, benchm if s % 2 else floorm, loc=(0, 0, z + 0.05 + h / 2))
    if not tiring(k):
        for p in (i0, i1):
            box((0.12, 0.12, ZE), timber, loc=(p[0], p[1], ZE / 2))
        for z in levels[1:]:
            beam((i0[0], i0[1], z + 0.55), (i1[0], i1[1], z + 0.55), 0.035)
            beam((i0[0], i0[1], z), (i1[0], i1[1], z), 0.05)
    # thatched roof over the ring: a gabled ridge round the middle
    rm = (RI + RO) / 2
    pts = []
    for a in (a0, a1):
        pts += [pt(RI - 0.35, a, ZE - 0.15), pt(rm, a, ZE + 1.1), pt(RO + 0.35, a, ZE - 0.15)]
    from_data(pts, [(0, 1, 4, 3), (1, 2, 5, 4), (2, 1, 0), (3, 4, 5)], 'Roof', thatch, smooth=False)
    pts2 = [(x, y, z - 0.12) for x, y, z in pts]
    from_data(pts2, [(3, 4, 1, 0), (4, 5, 2, 1)], 'RoofUnder', timber, smooth=False)
# the thrust stage, its pillars, the heavens, and the tiring house
SY0, SY1, SW = 1.0, 5.15, 3.1
box((2 * SW, SY1 - SY0, 0.75), stagem, loc=(0, (SY0 + SY1) / 2, 0.375))
for x in [-SW + 0.3 * i for i in range(int(2 * SW / 0.3) + 1)]:
    box((0.02, 0.01, 0.75), timber, loc=(x, SY0 - 0.005, 0.375))
for x in (-2.1, 2.1):
    lathe([(0.0, 0.0), (0.22, 0.0), (0.22, 0.15), (0.15, 0.25), (0.13, 3.2), (0.2, 3.3), (0.2, 3.4), (0.0, 3.4)], marble, seg=24, loc=(x, 3.0, 0.75))
hz = 4.15
box((2 * SW + 0.4, SY1 - 2.75, 0.12), skym, loc=(0, (2.75 + SY1) / 2, hz))
for k in range(26):
    sphere(0.045, star, seg=8, rings=4, loc=(-SW + 0.2 + (k * 1.37) % (2 * SW - 0.4), 2.9 + (k * 0.73) % (SY1 - 3.1), hz - 0.065))
prism([(-SW - 0.3, 0), (SW + 0.3, 0), (0, 1.0)], SY1 - 2.6, tiles, loc=(0, (2.6 + SY1) / 2, hz + 0.06), rot=(math.pi / 2, 0, 0))
prism([(-SW - 0.2, 0), (SW + 0.2, 0), (0, 0.95)], 0.08, gold, loc=(0, 2.63, hz + 0.08), rot=(math.pi / 2, 0, 0))
# frons scenae: the tiring house front, two doors, a central opening and the balcony
FY = SY1 + 0.02
front = box((2 * SW + 0.6, 0.15, ZE - 0.2), marble, loc=(0, FY + 0.075, (ZE - 0.2) / 2))
for x in (-1.6, 0.0, 1.6):
    cut(front, box((0.9 if x else 1.3, 0.4, 1.5), marble, loc=(x, FY, 0.75 + 0.75)))
for x in (-1.6, 1.6):
    box((0.86, 0.04, 1.46), redm, loc=(x, FY + 0.1, 1.48))
box((1.26, 0.04, 1.46), mat('#3a2418', rough=0.8), loc=(0.0, FY + 0.12, 1.48))
box((2 * SW + 0.6, 0.6, 0.1), timber, loc=(0, FY - 0.2, 2.3))
for x in [-SW + 0.25 * i for i in range(int(2 * SW / 0.25) + 1)]:
    box((0.04, 0.04, 0.5), gold, loc=(x, FY - 0.47, 2.6))
box((2 * SW + 0.6, 0.06, 0.06), gold, loc=(0, FY - 0.47, 2.86))
for x in (-SW - 0.2, -1.0, 1.0, SW + 0.2):
    cyl(0.07, ZE - 0.2, marble, verts=16, loc=(x, FY - 0.06, (ZE - 0.2) / 2))
# the hut on top with its flag
box((2.6, 1.6, 1.0), plaster, loc=(0, 5.9, ZE + 1.0))
prism([(-1.4, 0), (1.4, 0), (0, 0.7)], 1.7, tiles, loc=(0, 5.9, ZE + 1.5), rot=(math.pi / 2, 0, 0))
tube([(0, 5.9, ZE + 2.1), (0, 5.9, ZE + 3.3)], 0.03, timber)
flag = from_data([(0, 5.9, ZE + 3.25), (0.7, 5.9, ZE + 3.1), (0.65, 5.9, ZE + 2.8), (0, 5.9, ZE + 2.85)], [(0, 1, 2, 3)], 'Flag', flagm, smooth=False)
sol = flag.modifiers.new('S', 'SOLIDIFY'); sol.thickness = 0.02
floor(12.0, -0.1, color='#3a3128', opacity=0.9)

cam = camera((2.8, -14.2, 7.2), (0.0, 2.4, 1.9), lens=34)
lights((0, 0, 2.0), rim='#ff9f43', key='#ffe2b8')
sun((-0.4, 0.3, -1), 1.2, '#fff1dc')
a_g = ang(5.5)
finish('globe-theatre', "Shakespeare's Globe theatre", ['globe theatre', 'globe theater', 'shakespeare', 'elizabethan theatre', 'renaissance drama', 'thrust stage', 'groundlings', 'tiring house', 'english literature', 'drama', 'history of theatre', 'london'], [
    P('Stage', (1.2, 1.4, 0.76), 'A thrust stage, with the audience on three sides'),
    P('Yard', (-2.6, -2.2, 0.05), 'The groundlings paid a penny to stand here'),
    P('Galleries', pt(RI + 0.2, ang(-3), levels[1] + 0.6), 'Three tiers of seats for those who paid more'),
    P('Thatched roof', pt((RI + RO) / 2, ang(-2.3), ZE + 1.0), 'Reed thatch over the galleries; the yard was open'),
    P('Tiring house', (-1.6, FY, 1.5), 'Dressing rooms behind; actors came on through doors'),
    P('The heavens', (-1.5, 3.4, hz - 0.08), 'A painted canopy that sheltered the stage'),
    P('Pillars', (2.1, 3.0, 2.4), 'Two great posts held up the heavens'),
    P('Flag', (0.4, 5.9, ZE + 3.0), 'Flown to show a play was on that day'),
])
