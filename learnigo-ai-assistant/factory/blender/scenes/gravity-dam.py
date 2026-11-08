# A concrete gravity dam, cut through to show its cross-section. Its own
# great weight holds back the reservoir: the water pushes sideways on the
# vertical upstream face, and the wide triangular base resists sliding and
# overturning. Flood water passes over the ogee-shaped spillway and leaves
# the bucket at its foot. A grout curtain under the heel seals the rock, and
# a gallery inside lets engineers inspect and drain the dam.
# In the loop water flows over the spillway.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
ROT = (math.pi / 2, 0, math.pi / 2)    # prism outline (y, z), extruded along x


def concretemat(c1='#9a9fa8', c2='#bfc3ca', name='Concrete'):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = 0.85
    tc = N('ShaderNodeTexCoord')
    nz = N('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 9.0; nz.inputs['Detail'].default_value = 5
    L(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = lin(c1); ramp.color_ramp.elements[1].color = lin(c2)
    L(nz.outputs['Fac'], ramp.inputs['Fac']); L(ramp.outputs['Color'], p.inputs['Base Color'])
    return m


conc = concretemat()
concut = concretemat('#b3b7bf', '#cfd2d8', 'ConcCut')
rockm = concretemat('#6b5f55', '#8a7d70', 'Rock')
waterm = mat('#2f7fe0', rough=0.08, alpha=0.82, rim=0.3)
grout = mat('#4d4f5c', rough=0.8)
dark = mat('#2a2f3d', rough=0.7)
rail = mat('#d6dbe8', rough=0.3, metal=0.8)
flow = flowmat('#4f9fff', '#cfeaff', scale=3.0, strength=1.6, axis='Y', distort=4.0, name='Spill')

XA, XB = -4.2, 2.4                     # the dam runs along x; XB is the cut face
XS0, XS1 = -2.4, -0.4                  # the spillway bay
full = [(0.0, 0.0), (0.0, 4.0), (0.7, 4.0), (0.7, 3.4), (3.0, 0.0)]
slope = -3.4 / 2.3
ogee = [(0.0, 0.0), (0.0, 3.0), (0.06, 3.15), (0.2, 3.26), (0.36, 3.3), (0.56, 3.26), (0.8, 3.12), (1.1, 2.85)]
yb = 1.1 + (0.6 - 2.85) / slope
ogee += [(yb, 0.6), (yb + 0.15, 0.4), (yb + 0.35, 0.33), (yb + 0.55, 0.38), (yb + 0.7, 0.55), (yb + 0.72, 0.0)]
for x0, x1 in ((XA, XS0), (XS1, XB)):
    prism(full, x1 - x0, conc, loc=((x0 + x1) / 2, 0, 0), rot=ROT)
spill = prism(ogee, XS1 - XS0, conc, loc=((XS0 + XS1) / 2, 0, 0), rot=ROT)
# training walls either side of the spillway
for x in (XS0, XS1):
    prism([(0.3, 3.2), (0.7, 3.6), (yb + 0.75, 0.9), (yb + 0.75, 0.0), (2.9, 0.0)], 0.12, conc, loc=(x, 0, 0), rot=ROT)
# the section at the cut end: a lighter face, the gallery and the drain
endface = prism(full, 0.02, concut, loc=(XB + 0.01, 0, 0), rot=ROT)
gal = (0.75, 0.7)
gallery = prism([(gal[0] - 0.22, gal[1] - 0.25), (gal[0] + 0.22, gal[1] - 0.25), (gal[0] + 0.22, gal[1] + 0.1)] +
                [(gal[0] + 0.22 * math.cos(a), gal[1] + 0.1 + 0.22 * math.sin(a)) for a in [math.pi * k / 10 for k in range(1, 10)]] +
                [(gal[0] - 0.22, gal[1] + 0.1)], 0.06, dark, loc=(XB + 0.02, 0, 0), rot=ROT)
# crest road and railings on the non-overflow parts
for x0, x1 in ((XA, XS0), (XS1, XB)):
    box((x1 - x0, 0.5, 0.03), dark, loc=((x0 + x1) / 2, 0.35, 4.015))
    for y in (0.04, 0.66):
        tube([(x0, y, 4.25), (x1, y, 4.25)], 0.015, rail)
        n = int((x1 - x0) / 0.4)
        for k in range(n + 1):
            tube([(x0 + (x1 - x0) * k / n, y, 4.0), (x0 + (x1 - x0) * k / n, y, 4.25)], 0.012, rail)
# foundation rock, grout curtain under the heel
box((XB - XA + 0.4, 11.0, 1.6), rockm, loc=((XA + XB) / 2 + 0.2, 0.5, -0.8))
box((0.02, 0.18, 1.45), grout, loc=(XB + 0.41, 0.3, -0.75))
for k in range(6):
    cyl(0.025, 1.4, grout, verts=12, loc=(XB + 0.42, 0.24 + 0.03 * k, -0.75))
# reservoir, tailwater, and the water pouring over the spillway
H_RES = 3.55
box((XB - XA, 4.8, H_RES), waterm, loc=((XA + XB) / 2, -2.4, H_RES / 2))
box((XB - XA, 2.2, 0.45), waterm, loc=((XA + XB) / 2, 4.6, 0.225))
# the nappe: a ribbon following the ogee, a little above it
pts = [(-0.6, H_RES), (-0.15, H_RES - 0.02)] + [(y, z + 0.11) for y, z in ogee[2:-5]] + [(ogee[-5][0] + 0.05, 0.72), (ogee[-4][0], 0.52), (ogee[-3][0], 0.46), (ogee[-2][0], 0.52), (ogee[-1][0] - 0.02, 0.7), (yb + 1.15, 0.95), (yb + 1.6, 0.75)]
verts, faces = [], []
for i, (y, z) in enumerate(pts):
    for x in (XS0 + 0.07, XS1 - 0.07):
        verts.append((x, y, z))
for i in range(len(pts) - 1):
    a = 2 * i
    faces.append((a, a + 1, a + 3, a + 2))
sheet = from_data(verts, faces, 'Nappe', flow, smooth=True)
sol = sheet.modifiers.new('S', 'SOLIDIFY'); sol.thickness = 0.06
floor(9.0, -1.61)

cam = camera((9.8, 5.6, 6.4), (-0.6, 0.6, 1.3), lens=36)
lights((0, 0, 1.5), power=0.9, rim='#5b8cff')


def run(t):
    set_phase(flow, t, 2)


finish('gravity-dam', 'A concrete gravity dam', ['gravity dam', 'dam', 'concrete dam', 'spillway', 'ogee spillway', 'reservoir', 'hydraulic structures', 'hydropower', 'uplift', 'grout curtain', 'water resources engineering', 'hydraulics', 'civil engineering'], [
    P('Reservoir', (XB, -1.6, 2.4), 'Water pressure grows with depth and pushes on the dam'),
    P('Dam body', (XB + 0.02, 1.6, 1.3), 'Its weight resists sliding and overturning'),
    P('Spillway', ((XS0 + XS1) / 2, 1.0, 3.1), 'Lets floods pass safely over the top'),
    P('Gallery', (XB + 0.02, gal[0], gal[1]), 'A tunnel for inspection and drainage'),
    P('Grout curtain', (XB + 0.42, 0.3, -0.7), 'Grouted rock under the heel stops seepage'),
    P('Foundation rock', (XB + 0.4, 2.6, -0.9), 'Sound rock that carries the dam'),
    P('Tailwater', (XB - 0.2, 4.8, 0.45), 'The river level below the dam'),
    P('Crest', (XB - 0.6, 0.35, 4.03), 'The top of the dam, with a road across'),
], anim=run)
