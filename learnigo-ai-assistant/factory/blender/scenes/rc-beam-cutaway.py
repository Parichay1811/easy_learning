# A reinforced concrete beam with the concrete stopped short so the steel
# cage shows. Concrete is strong in compression but weak in tension, so
# thick main bars run along the bottom, where a loaded beam is stretched.
# Stirrups (links) wrap round the bars to resist shear and hold the cage
# together; light top bars carry the stirrups. The cover, a layer of
# concrete outside the steel, protects it from rust and fire.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(64)


def concretemat(name='Concrete'):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = 0.85
    tc = N('ShaderNodeTexCoord')
    nz = N('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 60.0; nz.inputs['Detail'].default_value = 4
    vo = N('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = 28.0
    L(tc.outputs['Object'], nz.inputs['Vector']); L(tc.outputs['Object'], vo.inputs['Vector'])
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = lin('#80858f'); ramp.color_ramp.elements[1].color = lin('#a9adb5')
    L(nz.outputs['Fac'], ramp.inputs['Fac'])
    r2 = N('ShaderNodeValToRGB'); r2.color_ramp.interpolation = 'CONSTANT'
    r2.color_ramp.elements[0].color = lin('#7f8590'); r2.color_ramp.elements[1].position = 0.1; r2.color_ramp.elements[1].color = (1, 1, 1, 1)
    L(vo.outputs['Distance'], r2.inputs['Fac'])
    mx = N('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 0.6
    L(ramp.outputs['Color'], mx.inputs['A']); L(r2.outputs['Color'], mx.inputs['B'])
    L(mx.outputs['Result'], p.inputs['Base Color'])
    bump = N('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.25
    L(nz.outputs['Fac'], bump.inputs['Height']); L(bump.outputs['Normal'], p.inputs['Normal'])
    return m


conc = concretemat()
rebar = mat('#9b5a3a', rough=0.55, metal=0.7, rim=0.15)
rebar2 = mat('#b5734d', rough=0.5, metal=0.7, rim=0.15)
dimm = glowmat('#fbbf24', 2.5)
B, H = 0.8, 1.2                 # width (y), depth (z)
X0, XC, X1 = -3.2, 1.0, 2.5      # beam start, where the concrete stops, cage end
c, rs, rm, rt = 0.07, 0.022, 0.055, 0.035      # cover to the stirrups, bar radii
beam = box((XC - X0, B, H), conc, bevel=0.015, loc=((X0 + XC) / 2, 0, H / 2))
# stirrups: rounded rectangles with 135-degree hooks at the top corner
yi, zi0, zi1 = B / 2 - c - rs, c + rs, H - c - rs
rr = 0.06


def stirrup(x):
    pts = []
    corners = [(yi - rr, zi1 - rr, 0), (-yi + rr, zi1 - rr, 90), (-yi + rr, zi0 + rr, 180), (yi - rr, zi0 + rr, 270)]
    for cy, cz, a0 in corners:
        for k in range(5):
            a = math.radians(a0 + 90 * k / 4)
            pts.append((x, cy + rr * math.cos(a), cz + rr * math.sin(a)))
    pts.append((x + 0.006, yi, zi1 - rr))
    # close past the first corner, then the hook bent inwards at 135 degrees
    for k in range(5):
        a = math.radians(0 + 90 * k / 4)
        pts.append((x + 0.012, yi - rr + rr * math.cos(a), zi1 - rr + rr * math.sin(a)))
    pts.append((x + 0.02, yi - rr - 0.12, zi1 - 0.12 - 0.02))
    tube(pts, rs, rebar2, kind='POLY')


st_x = []
x = X0 + 0.12
while x < X1 - 0.05:
    stirrup(x)
    st_x.append(x)
    x += 0.28
# main bars at the bottom (inside the stirrups), top bars in the top corners
zm = zi0 + rs + rm
ym = [-(yi - rs - rm), 0.0, yi - rs - rm]
for y in ym:
    tube([(X0 + 0.05, y, zm), (X1 + 0.25, y, zm)], rm, rebar, kind='POLY')
    # deformed-bar ribs
    tube([(XC + 0.02 + 0.05 * i, y + rm * 0.98 * math.cos(i * 1.6), zm + rm * 0.98 * math.sin(i * 1.6)) for i in range(int((X1 + 0.22 - XC) / 0.05))], 0.01, rebar, kind='POLY')
zt = zi1 - rs - rt
for y in (-(yi - rs - rt), yi - rs - rt):
    tube([(X0 + 0.05, y, zt), (X1 + 0.15, y, zt)], rt, rebar, kind='POLY')
# the cover, marked on the end face: from the bottom face up to the stirrup
xe = XC + 0.006
yc = -B / 2 + 0.16
tube([(xe, yc, 0.0), (xe, yc, c)], 0.008, dimm)
for z in (0.0, c):
    tube([(xe, yc - 0.06, z), (xe, yc + 0.06, z)], 0.008, dimm)
floor(6.5, 0.0)

cam = camera((7.2, -3.3, 3.1), (0.2, 0, 0.5), lens=44)
lights((0, 0, 0.6), power=0.7, rim='#ff9f43')
finish('rc-beam-cutaway', 'A reinforced concrete beam', ['reinforced concrete', 'rc beam', 'concrete beam', 'rebar', 'reinforcement', 'stirrups', 'links', 'main bars', 'cover', 'concrete cover', 'tension steel', 'shear reinforcement', 'structural engineering', 'concrete design', 'civil engineering'], [
    P('Concrete', (-0.6, -B / 2, H * 0.62), 'Strong in compression, weak in tension'),
    P('Main bars', (XC + 1.2, ym[0], zm), 'Thick steel at the bottom carries the tension'),
    P('Stirrups', ([v for v in st_x if v > XC + 0.5][0], -yi, H * 0.55), 'Loops of steel that resist shear and hold the cage'),
    P('Top bars', (XC + 1.5, -(yi - rs - rt), zt + rt), 'Hanger bars that carry the stirrups'),
    P('Cover', (xe, yc + 0.05, c / 2), 'Concrete outside the steel stops rust and fire'),
    P('Tension zone', (-1.6, -B / 2, 0.16), 'Under load the bottom stretches; the steel takes it'),
])
