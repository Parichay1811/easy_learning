# A pile foundation, with the ground cut away in front to show the soil
# layers. The column's load goes into a reinforced concrete pile cap, which
# spreads it over a group of four piles. They pass down through weak soft
# clay and sand to bear on strong bedrock at their toes (end bearing); the
# soil also grips their sides (skin friction).
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)


def soilmat(c1, c2, scale=8.0, rough=0.9, name='Soil', bump=0.3):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = rough
    tc = N('ShaderNodeTexCoord')
    nz = N('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 6
    L(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = lin(c1); ramp.color_ramp.elements[1].color = lin(c2)
    L(nz.outputs['Fac'], ramp.inputs['Fac']); L(ramp.outputs['Color'], p.inputs['Base Color'])
    bp = N('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump
    L(nz.outputs['Fac'], bp.inputs['Height']); L(bp.outputs['Normal'], p.inputs['Normal'])
    return m


YF, YB, XW = -0.6, 3.0, 3.6           # soil block: front face, back, half width
layers = [(0.0, -0.4, soilmat('#4a3626', '#6b4f36', 14, name='Topsoil')),
          (-0.4, -2.3, soilmat('#7d7466', '#958b7b', 5, name='Clay')),
          (-2.3, -3.7, soilmat('#c9a45e', '#e2c27f', 30, name='Sand', bump=0.5)),
          (-3.7, -5.3, soilmat('#5f6270', '#83869a', 3.5, name='Rock', bump=0.6))]
for z0, z1, m in layers:
    box((2 * XW, YB - YF, z0 - z1), m, loc=(0, (YF + YB) / 2, (z0 + z1) / 2))
box((2 * XW, YB - YF, 0.04), mat('#3f8f4a', rough=0.85), loc=(0, (YF + YB) / 2, 0.02))
conc = mat('#b9bdc6', rough=0.75, rim=0.15)
concd = mat('#a3a8b3', rough=0.75, rim=0.15)
# pile cap just below ground, four piles to bedrock
cap = box((2.3, 2.1, 0.75), conc, bevel=0.02, loc=(0, 0.0, -0.55))
# the hole the cap sits in (soil dug away round it)
pile_xy = [(-0.72, -0.6), (0.72, -0.6), (-0.72, 0.6), (0.72, 0.6)]
toe = -4.15
for x, y in pile_xy:
    cyl(0.2, -0.9 - toe, concd, verts=48, loc=(x, y, (toe - 0.9) / 2))
    cone(0.2, 0.12, concd, verts=48, loc=(x, y, toe - 0.06), rot=(math.pi, 0, 0))
# the column and the load on it
col = box((0.6, 0.6, 2.4), conc, bevel=0.02, loc=(0, 0, 1.0))
loadm = glowmat('#ff9f43', 3.0)
tube([(0, 0, 3.3), (0, 0, 2.6)], 0.06, loadm)
cone(0.17, 0.35, loadm, verts=24, loc=(0, 0, 2.42), rot=(math.pi, 0, 0))
# the water table, marked on the cut face
wz = -1.25
wt = glowmat('#5aa8ff', 2.0)
for k in range(14):
    x = -XW + 0.1 + k * 0.5
    if -1.0 < x < 1.0:
        continue
    tube([(x, YF - 0.01, wz), (x + 0.32, YF - 0.01, wz)], 0.014, wt)
prism([(-0.12, 0.0), (0.12, 0.0), (0.0, -0.16)], 0.02, wt, loc=(-2.6, YF - 0.02, wz + 0.17), rot=(math.pi / 2, 0, 0))
floor(8.0, -5.31)

cam = camera((3.6, -10.2, 2.6), (0.0, 0, -1.25), lens=38)
lights((0, 0, -1.2), rim='#ff9f43')
finish('pile-foundation', 'A pile foundation', ['pile foundation', 'piles', 'pile cap', 'deep foundation', 'end bearing', 'skin friction', 'soil layers', 'bedrock', 'water table', 'geotechnical engineering', 'foundation engineering', 'soil mechanics', 'civil engineering'], [
    P('Column', (0, -0.3, 1.2), 'Carries the building load down to the foundation'),
    P('Pile cap', (0.0, -1.05, -0.55), 'A thick concrete block that spreads the load to the piles'),
    P('Pile', (-0.72, -0.8, -1.9), 'Long concrete columns driven or bored into the ground'),
    P('Soft clay', (2.4, YF, -1.8), 'Too weak to carry the load near the surface'),
    P('Dense sand', (2.4, YF, -3.0), 'Firmer, but still not enough on its own'),
    P('Bedrock', (2.4, YF, -4.5), 'Strong rock where the piles end'),
    P('Pile toe', (0.72, -0.8, toe + 0.05), 'End bearing: the toe rests on the rock'),
    P('Water table', (-2.6, YF, wz), 'Below this level the soil is full of water'),
])
