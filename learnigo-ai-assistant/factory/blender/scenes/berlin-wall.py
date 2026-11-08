# The Berlin Wall as it was in the 1980s (built 1961, opened 9 November
# 1989), seen from the West. The border wall's L-shaped concrete segments,
# 3.6 m tall with a round pipe on top that was hard to grip, were covered in
# graffiti on the Western side. Behind it, on the Eastern side, lay the
# "death strip": an anti-vehicle ditch, raked sand that showed footprints,
# a patrol road, floodlights, watchtowers and a signal fence, closed off by
# the inner (hinterland) wall facing East Berlin.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)


def rakedmat():
    m = bpy.data.materials.new('Raked')
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = 0.95
    tc = N('ShaderNodeTexCoord')
    w = N('ShaderNodeTexWave'); w.wave_type = 'BANDS'; w.bands_direction = 'X'
    w.inputs['Scale'].default_value = 1.2; w.inputs['Distortion'].default_value = 0.6
    L(tc.outputs['Object'], w.inputs['Vector'])
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = lin('#a8956e'); ramp.color_ramp.elements[1].color = lin('#c2ae86')
    L(w.outputs['Fac'], ramp.inputs['Fac']); L(ramp.outputs['Color'], p.inputs['Base Color'])
    bp = N('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.3
    L(w.outputs['Fac'], bp.inputs['Height']); L(bp.outputs['Normal'], p.inputs['Normal'])
    return m


conc = mat('#cfd2d6', rough=0.8, rim=0.12)
concd = mat('#a9adb5', rough=0.85, rim=0.1)
grass = mat('#4c7a45', rough=0.9)
paveW = mat('#5f636c', rough=0.85)
sand = rakedmat()
road = mat('#9a9ea8', rough=0.85)
roadj = mat('#6a6e78', rough=0.9)
steel = mat('#5a5f6c', rough=0.5, metal=0.6, rim=0.15)
lampm = glowmat('#ffe2a0', 4.0)
glass = mat('#2a3550', rough=0.1, metal=0.4)
graf = vcolmat(rough=0.6, name='Graffiti')
XL, XR = -14.0, 14.0
SEG = 1.2

# ground: the West (pavement and grass), the strip, the East
box((XR - XL, 10, 0.1), paveW, loc=(0, -5.0, -0.05))
box((XR - XL, 2.0, 0.1), grass, loc=(0, 1.0, -0.05))
# the border wall: L-shaped segments with a pipe on top, graffiti on the West face
for k in range(int((XR - XL) / SEG)):
    x = XL + SEG * (k + 0.5)
    box((SEG - 0.02, 0.2, 3.4), conc, loc=(x, 0.0, 1.7))
    box((SEG - 0.02, 2.1, 0.25), concd, loc=(x, 1.05, 0.125))
tube([(XL, 0.0, 3.55), (XR, 0.0, 3.55)], 0.26, conc, kind='POLY')
nx, nz = 560, 64
verts, faces, cols = [], [], []
for j in range(nz + 1):
    for i in range(nx + 1):
        x = XL + (XR - XL) * i / nx
        z = 0.05 + 3.25 * j / nz
        verts.append((x, -0.105, z))
pal = ['#e5484d', '#fbbf24', '#34d399', '#5b8cff', '#a78bfa', '#ff9f43', '#22d3ee', '#ffffff', '#1a1a1a', '#f472b6']
for v in verts:
    x, _, z = v
    n1 = noise.noise(Vector((x * 0.25, z * 0.35, 1.3)))
    n2 = noise.noise(Vector((x * 0.6, z * 0.8, 7.7)))
    n3 = noise.noise(Vector((x * 1.6, z * 1.3, 3.1)))
    if z > 2.3 + 0.6 * n1 or (n1 < -0.25 and n2 < 0):
        c = '#cfd2d6'                        # bare concrete
    else:
        c = pal[int((n1 * 5 + n2 * 3 + 10) * 1.7) % len(pal)]
        if abs(n3) < 0.05:
            c = '#111111'                    # outlines of letters
    cols.append(c)
for j in range(nz):
    for i in range(nx):
        a = j * (nx + 1) + i
        faces.append((a, a + 1, a + nx + 2, a + nx + 1))
panel = from_data(verts, faces, 'Graffiti', graf, smooth=False)
at = panel.data.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
for k, c in enumerate(cols):
    at.data[k].color = lin(c)
# the death strip, from west to east
# anti-vehicle ditch (concrete-lined on its western side)
ditch = [(2.2, 0.0), (3.0, -1.1), (3.6, -1.1), (5.2, 0.0)]
gd = box((XR - XL, 3.2, 1.4), sand, loc=(0, 3.6, -0.7))
cut(gd, prism([(2.2, 0.01), (3.0, -1.1), (3.6, -1.1), (5.2, 0.01), (5.2, 0.5), (2.2, 0.5)], XR - XL + 0.2, sand, rot=(math.pi / 2, 0, math.pi / 2)))
prism([(2.2, 0.02), (3.0, -1.08), (3.12, -1.08), (2.34, 0.02)], XR - XL, concd, loc=(0, 0, 0.0), rot=(math.pi / 2, 0, math.pi / 2))
# the control strip of raked sand, Czech hedgehogs on it
box((XR - XL, 4.6, 0.1), sand, loc=(0, 7.5, -0.05))
for x in (-9.0, -3.5, 4.5, 10.0):
    g = empty('Hedgehog', loc=(x, 7.0, 0.55))
    for r in ((0.6, 0.0, 0.0), (0.0, 0.6, 1.2), (-0.6, -0.4, 2.2)):
        box((0.14, 0.14, 1.5), steel, rot=r, parent=g)
# patrol road of concrete slabs
box((XR - XL, 3.0, 0.12), road, loc=(0, 11.3, -0.04))
for x in [XL + 2.0 * k for k in range(int((XR - XL) / 2.0) + 1)]:
    box((0.04, 3.0, 0.125), roadj, loc=(x, 11.3, -0.035))
box((XR - XL, 0.04, 0.125), roadj, loc=(0, 11.3, -0.035))
box((XR - XL, 6.0, 0.1), grass, loc=(0, 15.8, -0.05))
# floodlights on tall poles over the strip
for x in [XL + 2.5 + 6.0 * k for k in range(5)]:
    tube([(x, 9.6, 0.0), (x, 9.6, 4.6), (x, 9.0, 5.0), (x, 8.4, 5.0)], 0.07, steel, kind='BEZIER')
    box((0.5, 0.3, 0.12), steel, loc=(x, 8.3, 4.95))
    box((0.4, 0.22, 0.03), lampm, loc=(x, 8.3, 4.88))
# watchtower (BT-9 type): a square concrete shaft and an observation room
wx, wy = 3.0, 13.6
box((2.0, 2.0, 8.0), conc, loc=(wx, wy, 4.0))
for z in (2.0, 4.0, 6.0):
    box((2.04, 2.04, 0.04), concd, loc=(wx, wy, z))
box((0.7, 0.04, 1.8), mat('#5a5f6c', rough=0.6), loc=(wx, wy - 1.02, 0.9))
cab = box((3.0, 3.0, 1.6), conc, loc=(wx, wy, 8.8))
for s_ in (-1, 1):
    box((2.6, 0.06, 0.9), glass, loc=(wx, wy + s_ * 1.5, 8.95))
    box((0.06, 2.6, 0.9), glass, loc=(wx + s_ * 1.5, wy, 8.95))
box((3.3, 3.3, 0.18), concd, loc=(wx, wy, 9.69))
box((0.8, 0.8, 0.3), steel, loc=(wx, wy, 9.93))
cyl(0.22, 0.3, steel, verts=24, loc=(wx, wy - 0.3, 10.25), rot=(math.pi / 2, 0, 0))
cyl(0.18, 0.02, lampm, verts=24, loc=(wx, wy - 0.46, 10.25), rot=(math.pi / 2, 0, 0))
# signal fence and the inner (hinterland) wall facing East Berlin
for x in [XL + 0.5 + 2.5 * k for k in range(12)]:
    tube([(x, 15.0, 0.0), (x, 15.0, 2.2)], 0.035, steel)
    tube([(x, 15.0, 2.2), (x, 15.3, 2.4)], 0.025, steel)
for z in (0.5, 0.9, 1.3, 1.7, 2.1):
    tube([(XL + 0.5, 15.0, z), (XL + 0.5 + 2.5 * 11, 15.0, z)], 0.008, steel)
for k in range(int((XR - XL) / 2.0)):
    x = XL + 2.0 * (k + 0.5)
    box((1.98, 0.3, 3.0), mat('#e6e8ec', rough=0.8, rim=0.1), loc=(x, 17.5, 1.5))
# a few blocks of flats in East Berlin, beyond
for k, x in enumerate((-9.0, -1.0, 8.0)):
    box((6.0, 2.5, 6.0 + 2 * (k % 2)), mat('#b9bdc6', rough=0.8, rim=0.1), loc=(x, 22.0, 3.0 + (k % 2)))
floor(26.0, -0.11, color='#1c2232', opacity=0.9)

cam = camera((23.0, -9.5, 15.0), (0.5, 7.0, 0.6), lens=32)
lights((0, 6, 2.0), power=0.8, rim='#5b8cff', key='#fff0d8')
sun((-0.3, 0.6, -1), 1.2, '#fff1dc')
finish('berlin-wall', 'The Berlin Wall', ['berlin wall', 'cold war', 'iron curtain', 'east germany', 'gdr', 'west berlin', 'east berlin', 'death strip', 'watchtower', 'checkpoint charlie', 'fall of the berlin wall', '1989', 'germany', 'history'], [
    P('Border wall', (8.0, -0.11, 2.0), 'Concrete segments 3.6 m tall; graffiti on the West side'),
    P('Round pipe', (-6.0, -0.2, 3.6), 'A smooth pipe on top that was hard to grip'),
    P('Anti-vehicle ditch', (10.0, 3.3, -1.0), 'Stopped vehicles from crashing through'),
    P('Death strip', (-2.0, 7.0, 0.0), 'Raked sand showed the footprints of anyone crossing'),
    P('Patrol road', (-6.0, 11.3, 0.05), 'Guards drove along it day and night'),
    P('Floodlights', (XL + 2.5 + 6.0 * 2, 8.3, 4.88), 'Lit the strip brightly all night'),
    P('Watchtower', (wx, wy - 1.52, 8.9), 'Guards watched the strip from towers like this'),
    P('Inner wall', (-8.0, 17.35, 2.0), 'The hinterland wall on the East Berlin side'),
])
