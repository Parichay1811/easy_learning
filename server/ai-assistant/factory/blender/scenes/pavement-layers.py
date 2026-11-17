# The layers of a flexible (asphalt) road pavement, cut back in steps.
# Each layer spreads the wheel loads over a wider area, so the stress is
# small enough by the time it reaches the soil: surface course, binder
# course, base course, sub-base, and the compacted subgrade (natural soil).
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(64)


def aggmat(c1, c2, gap, scale, rough=0.85, name='Agg', gapw=0.06, bump=0.4):
    """Stones in a binder: Voronoi cells of varied tone, darker gaps."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = rough
    tc = N('ShaderNodeTexCoord')
    vo = N('ShaderNodeTexVoronoi'); vo.inputs['Scale'].default_value = scale
    ve = N('ShaderNodeTexVoronoi'); ve.feature = 'DISTANCE_TO_EDGE'; ve.inputs['Scale'].default_value = scale
    L(tc.outputs['Object'], vo.inputs['Vector']); L(tc.outputs['Object'], ve.inputs['Vector'])
    bw = N('ShaderNodeRGBToBW'); L(vo.outputs['Color'], bw.inputs['Color'])
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = lin(c1); ramp.color_ramp.elements[1].color = lin(c2)
    L(bw.outputs['Val'], ramp.inputs['Fac'])
    eg = N('ShaderNodeValToRGB'); eg.color_ramp.interpolation = 'LINEAR'
    eg.color_ramp.elements[0].color = lin(gap); eg.color_ramp.elements[1].position = gapw; eg.color_ramp.elements[1].color = (1, 1, 1, 1)
    L(ve.outputs['Distance'], eg.inputs['Fac'])
    mx = N('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1.0
    L(ramp.outputs['Color'], mx.inputs['A']); L(eg.outputs['Color'], mx.inputs['B'])
    L(mx.outputs['Result'], p.inputs['Base Color'])
    bp = N('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump
    L(ve.outputs['Distance'], bp.inputs['Height']); L(bp.outputs['Normal'], p.inputs['Normal'])
    return m


surf = aggmat('#2b2d33', '#4a4d55', '#15161a', 90, rough=0.7, name='Surface', gapw=0.12, bump=0.15)
binder = aggmat('#3a3c44', '#62656f', '#1b1c21', 45, rough=0.8, name='Binder', gapw=0.12)
base = aggmat('#8d8f96', '#c3c5cb', '#4b4d55', 22, name='Base', gapw=0.18)
subb = aggmat('#a88a63', '#d2b88e', '#6b5539', 14, name='Subbase', gapw=0.15)
subg = aggmat('#6a4a31', '#86603f', '#6a4a31', 9, name='Subgrade', gapw=0.01, bump=0.1)
white = mat('#f2f4f8', rough=0.5, rim=0.1)
yellow = mat('#f2c230', rough=0.5, rim=0.1)

W = 4.0                         # road width (y)
XL = -3.4                       # the far end of the block
layers = [  # name, top z, thickness, how far it reaches towards the camera (x), material
    ('surface', 0.0, 0.14, -0.2, surf),
    ('binder', -0.14, 0.2, 0.45, binder),
    ('base', -0.34, 0.38, 1.15, base),
    ('subbase', -0.72, 0.5, 1.95, subb),
    ('subgrade', -1.22, 0.9, 2.9, subg),
]
for name, zt, th, xr, m in layers:
    box((xr - XL, W, th), m, loc=((xr + XL) / 2, 0, zt - th / 2))
# road markings on the surface: dashed centre line, solid edge lines
for k in range(4):
    x0 = XL + 0.25 + 0.85 * k
    box((0.5, 0.1, 0.006), white, loc=(x0 + 0.25, 0.0, 0.003))
for y in (-W / 2 + 0.2, W / 2 - 0.2):
    box((-0.2 - XL, 0.08, 0.006), white, loc=((-0.2 + XL) / 2, y, 0.003))
floor(7.5, -2.13)

cam = camera((6.6, -6.4, 3.4), (-0.2, 0, -0.8), lens=40)
lights((0, 0, -0.6), rim='#ff9f43')
mid = lambda xr, nxt: (xr + nxt) / 2
finish('pavement-layers', 'Road pavement layers', ['pavement', 'pavement layers', 'flexible pavement', 'road construction', 'asphalt', 'surface course', 'binder course', 'base course', 'sub-base', 'subgrade', 'highway engineering', 'transportation engineering', 'civil engineering'], [
    P('Surface course', (-1.2, -W / 2, -0.04), 'Smooth, waterproof asphalt that takes the wear'),
    P('Binder course', (0.15, -W / 2 + 0.3, -0.14), 'Asphalt with larger stones, binding surface to base'),
    P('Base course', (0.8, -W / 2 + 0.3, -0.34), 'Crushed stone that spreads the wheel loads'),
    P('Sub-base', (1.55, -W / 2 + 0.3, -0.72), 'Cheaper granular layer that spreads load and drains'),
    P('Subgrade', (2.45, -W / 2 + 0.3, -1.22), 'The natural soil, compacted; it carries it all'),
    P('Road markings', (-1.0, 0.0, 0.01), 'Painted lines guide the traffic'),
])
