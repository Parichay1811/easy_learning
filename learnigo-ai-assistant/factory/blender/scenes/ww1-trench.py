# A First World War front-line trench (Western Front, 1914-1918), cut
# through to show its cross-section. Facing the enemy, a parapet of earth
# and sandbags; soldiers stood on the fire step to look and shoot over it.
# Duckboards kept them out of the mud and water in the sump below. Behind,
# a lower parados guarded against shells bursting to the rear, and steps led
# down to a dugout, a shelter cut deep into the ground. Belts of barbed wire
# lay out in no man's land, the cratered ground between the two front lines.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)


def soilmat(c1, c2, scale=6.0, name='Soil', bump=0.35):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = 0.95
    tc = N('ShaderNodeTexCoord')
    nz = N('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 6
    L(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = lin(c1); ramp.color_ramp.elements[1].color = lin(c2)
    L(nz.outputs['Fac'], ramp.inputs['Fac']); L(ramp.outputs['Color'], p.inputs['Base Color'])
    bp = N('ShaderNodeBump'); bp.inputs['Strength'].default_value = bump
    L(nz.outputs['Fac'], bp.inputs['Height']); L(bp.outputs['Normal'], p.inputs['Normal'])
    return m


earth = soilmat('#3e3024', '#5c4a36', 3.0, 'Earth')
mud = soilmat('#3a2e22', '#54432f', 9.0, 'Mud')
bagm = soilmat('#7d6e4e', '#988762', 14.0, 'Hessian', bump=0.2)
plank = mat('#7a5a3a', rough=0.8, rim=0.08)
plankd = mat('#5a4029', rough=0.85)
plankl = mat('#b08a5a', rough=0.75, rim=0.12)
waterm = mat('#4a4a3a', rough=0.08, alpha=0.9)
wire = mat('#3a3a40', rough=0.5, metal=0.7)
iron = mat('#6a6f7a', rough=0.5, metal=0.6)
XL, XR = -4.5, 4.0                    # the trench runs along x; XR is the cut face
ROT = (math.pi / 2, 0, math.pi / 2)  # prism outline (y, z) extruded along x
prof = [(-7.0, 0.0), (-1.7, 0.0), (-1.55, 0.2), (-0.95, 0.3), (-0.9, 0.0), (-0.9, -1.5), (-0.42, -1.5),
        (-0.42, -2.1), (0.9, -2.1), (0.9, 0.0), (1.05, 0.15), (1.7, 0.2), (2.2, 0.0), (5.0, 0.0), (5.0, -4.6), (-7.0, -4.6)]
block = prism(prof[::-1], XR - XL, earth, loc=((XL + XR) / 2, 0, 0), rot=ROT)
# a traverse: a block of earth across the trench, which zigzags round behind it,
# so a shell burst or an enemy in one bay cannot sweep along the whole line
TX0, TX1 = -2.9, -1.1                 # the traverse
DX0, DX1 = TX0 - 0.55, TX1 + 0.55     # the detour behind it
cut(block, box((DX1 - DX0, 1.2, 3.1), earth, loc=((DX0 + DX1) / 2, 1.5, -0.55)))
box((TX1 - TX0, 1.85, 2.45), earth, loc=((TX0 + TX1) / 2, 0.025, -0.875))
# the dugout: steps down from the trench's back wall to a timbered room
dx0, dx1 = 2.2, XR + 0.2
cut(block, box((dx1 - dx0, 1.1, 1.0), earth, loc=((dx0 + dx1) / 2, 1.35, -2.55)))
stair = prism([(0.9, -2.1), (0.9, -1.1), (1.8, -2.4), (1.8, -3.0), (1.4, -2.95)], dx1 - dx0, earth, loc=((dx0 + dx1) / 2, 0, 0), rot=ROT)
cut(block, stair)
cut(block, box((dx1 - dx0, 2.4, 1.6), earth, loc=((dx0 + dx1) / 2, 2.7, -3.75)))
for k in range(5):
    z = -2.2 - 0.17 * k
    box((dx1 - dx0 - 0.1, 0.2, 0.05), plank, loc=((dx0 + dx1) / 2, 1.0 + 0.17 * k, z))
for x in (dx0 + 0.1, (dx0 + dx1) / 2, dx1 - 0.15):
    for y in (1.55, 3.85):
        box((0.12, 0.12, 1.6), plank, loc=(x, y, -3.75))
    box((0.12, 2.4, 0.12), plank, loc=(x, 2.7, -2.98))
box((dx1 - dx0, 2.4, 0.05), plankd, loc=((dx0 + dx1) / 2, 2.7, -4.53))
box((0.5, 0.9, 0.35), plank, loc=(dx0 + 0.6, 3.3, -4.33))
box((0.12, 0.12, 1.1), plank, loc=(dx0 + 0.06, 0.92, -1.55))
box((0.12, 0.12, 1.1), plank, loc=(dx1 - 0.1, 0.92, -1.55))
box((dx1 - dx0, 0.14, 0.12), plank, loc=((dx0 + dx1) / 2, 0.92, -1.0))
# revetment: planks on the front wall and fire step, hurdles on the back wall
for k in range(int((XR - XL) / 0.22)):
    x = XL + 0.11 + 0.22 * k
    box((0.2, 0.04, 1.75), plank if k % 2 else plankd, loc=(x, -0.88, -0.65))
    box((0.2, 0.04, 0.6), plank if k % 2 else plankd, loc=(x, -0.4, -1.8))
for k in range(9):
    z = -2.0 + 0.22 * k
    for a, b, y in ((XL, DX0, 0.88), (DX1, dx0, 0.88), (DX0, DX1, 2.08)):
        box((b - a, 0.05, 0.15), plankd if k % 2 else plank, loc=((a + b) / 2, y, z))
    for x in (TX0 - 0.025, TX1 + 0.025):               # revetted ends of the traverse
        box((0.05, 1.3, 0.15), plankd if k % 2 else plank, loc=(x, 0.25, z))
    box((TX1 - TX0, 0.05, 0.15), plankd if k % 2 else plank, loc=((TX0 + TX1) / 2, 0.97, z))
for x in [XL + 0.5 + 1.0 * k for k in range(int((XR - XL) / 1.0))]:
    if not (DX0 - 0.05 < x < DX1 + 0.05):
        box((0.1, 0.1, 2.2), plank, loc=(x, 0.86, -1.0))
    box((0.1, 0.1, 2.0), plank, loc=(x, -0.85, -0.6))
# the fire step: a timber tread and a pale edge beam along its front
box((XR - XL, 0.48, 0.04), plankl, loc=((XL + XR) / 2, -0.66, -1.48))
box((XR - XL, 0.09, 0.09), plankl, loc=((XL + XR) / 2, -0.44, -1.49))
# the sump with water, the A-frames and the duckboards
box((XR - XL, 1.2, 0.25), waterm, loc=((XL + XR) / 2, 0.22, -2.0))
for x in [XL + 0.4 + 1.2 * k for k in range(int((XR - XL) / 1.2) + 1)]:
    tube([(x, -0.35, -2.1), (x, 0.22, -1.75), (x, 0.8, -2.1)], 0.035, plankd, kind='POLY')
for y in (-0.15, 0.6):
    box((XR - XL, 0.07, 0.06), plank, loc=((XL + XR) / 2, y, -1.73))
for k in range(int((XR - XL) / 0.14)):
    box((0.09, 0.95, 0.03), plank, loc=(XL + 0.07 + 0.14 * k, 0.22, -1.69))
# duckboards round the back of the traverse
for k in range(int((DX1 - DX0 - 0.1) / 0.14)):
    box((0.09, 0.8, 0.03), plank, loc=(DX0 + 0.12 + 0.14 * k, 1.5, -1.95))
for x in (DX0 + 0.27, DX1 - 0.27):
    for k in range(6):
        box((0.45, 0.09, 0.03), plank, loc=(x, 0.8 + 0.14 * k, -1.8 - 0.025 * k))
# sandbags on the parapet (three courses) and the parados


def bags(y0, z0, rows, along=(XL, XR), m=bagm):
    src = blob((0.29, 0.17, 0.1), m, subdiv=3)
    mats = []
    for r, (dy, dz) in enumerate(rows):
        x = along[0] + (0.0 if r % 2 == 0 else 0.3) + 0.3
        while x < along[1] - 0.2:
            mats.append(Matrix.Translation((x, y0 + dy, z0 + dz)) @ Matrix.Rotation(0.06 * math.sin(x * 7.1 + r), 4, 'Z'))
            x += 0.6
    return merge_instances(src, mats, 'Bags', m)


bags(-1.25, 0.32, [(0.15, 0.0), (-0.18, 0.0), (0.0, 0.19), (0.12, 0.38), (-0.1, 0.38)])
for a, b in ((XL, DX0 - 0.1), (DX1 + 0.1, XR)):
    bags(1.4, 0.22, [(0.0, 0.0), (0.3, 0.0), (0.15, 0.19)], along=(a, b))
bags(2.5, 0.08, [(0.0, 0.0), (0.0, 0.19)], along=(DX0 - 0.3, DX1 + 0.3))
bags(0.1, 0.42, [(-0.3, 0.0), (0.3, 0.0), (0.0, 0.19)], along=(TX0 - 0.3, TX1 + 0.2))
# loopholes are left out; a duckboard-level shelf, a corrugated iron sheet at the back
# barbed wire: screw pickets, strands and a concertina coil in no man's land
for yrow in (-3.0, -4.2):
    for x in [XL + 0.6 + 1.1 * k for k in range(8)]:
        tube([(x, yrow, 0.0), (x, yrow, 0.95)], 0.025, iron)
    for z in (0.3, 0.6, 0.9):
        tube([(XL + 0.6, yrow, z), (XL + 0.6 + 1.1 * 7, yrow, z)], 0.008, wire)
    for k in range(7):
        x = XL + 0.6 + 1.1 * k
        tube([(x, yrow, 0.9), (x + 1.1, yrow, 0.2)], 0.008, wire)
        tube([(x, yrow, 0.2), (x + 1.1, yrow, 0.9)], 0.008, wire)
coil = [(XL + 0.4 + 7.9 * i / 900, -3.6 + 0.42 * math.cos(i * 0.5), 0.42 + 0.42 * math.sin(i * 0.5)) for i in range(901)]
tube(coil, 0.008, wire)
# shell craters in no man's land: rims of thrown-up earth, one with water
for cxy, r in (((-2.0, -5.6), 0.8), ((2.4, -5.2), 0.6), ((0.6, -2.4), 0.4)):
    torus(r, 0.16, mud, seg=48, ring=12, loc=(cxy[0], cxy[1], 0.02))
    cyl(r - 0.05, 0.02, waterm if r > 0.5 else mud, verts=48, loc=(cxy[0], cxy[1], 0.01))
floor(11.0, -4.61, color='#14182a', opacity=0.9)

cam = camera((11.2, -2.4, 2.3), (2.4, -0.1, -1.55), lens=40)
lights((XR, -0.5, -1.5), power=0.9, rim='#ff9f43', key='#ffe2b8')
point((XR + 1.6, 0.1, -0.6), 260, '#ffe8c8', 0.8)      # light into the trench and the dugout
point((XR + 1.4, 2.6, -3.2), 120, '#ffd8a8', 0.4)
finish('ww1-trench', 'A First World War trench', ['trench', 'trench warfare', 'first world war', 'world war one', 'ww1', 'western front', 'fire step', 'parapet', 'parados', 'duckboards', 'dugout', 'no mans land', 'barbed wire', 'somme', 'history', 'war poets', 'english literature'], [
    P('Parapet', (XR, -1.25, 0.35), 'The front bank of earth and sandbags, facing the enemy'),
    P('Sandbags', (XR - 1.5, -1.4, 0.5), 'Bags of earth that could stop bullets'),
    P('Fire step', (XR, -0.66, -1.5), 'A ledge to stand on to look and fire over the top'),
    P('Duckboards', (XR - 0.4, 0.22, -1.67), 'Wooden slats over the mud and water below'),
    P('Parados', (XR, 1.45, 0.25), 'A lower bank behind, against shell bursts'),
    P('Dugout', (XR, 2.7, -3.6), 'A shelter dug deep underground, reached by steps'),
    P('Barbed wire', (XR - 1.6, -3.6, 0.84), 'Belts of wire to slow an attack'),
    P("No man's land", (XR - 0.6, -2.3, 0.0), 'The ground between the two front lines'),
])
