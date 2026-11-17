# An illuminated manuscript of the kind made in medieval monasteries: an
# open book of vellum (calfskin) pages, written by hand in Latin with a
# quill and ink. The page opens with a large decorated initial in gold leaf
# and coloured pigments, red rubrics mark the headings, and a border of
# vines runs down the margin. The text is the start of Psalm 1 from the
# Latin Vulgate ("Beatus vir..."), which often opened a psalter with a big B.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(64)
FONT = '/System/Library/Fonts/Supplemental/Apple Chancery.ttf'
INIT = '/System/Library/Fonts/Supplemental/BigCaslon.ttf'
fnt = bpy.data.fonts.load(FONT) if os.path.exists(FONT) else None
fini = bpy.data.fonts.load(INIT) if os.path.exists(INIT) else None


def vellummat():
    m = bpy.data.materials.new('Vellum')
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = 0.8
    tc = N('ShaderNodeTexCoord')
    nz = N('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.0; nz.inputs['Detail'].default_value = 6
    L(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = lin('#e6d3a8'); ramp.color_ramp.elements[1].color = lin('#f6ead0')
    L(nz.outputs['Fac'], ramp.inputs['Fac']); L(ramp.outputs['Color'], p.inputs['Base Color'])
    return m


vellum = vellummat()
woodm = brickmat('#5a3a22', '#6b4529', '#4a2f1b', scale=1.2, rough=0.6, name='Desk', w=3.0, h=0.2)
coverm = mat('#6b2a22', rough=0.6, rim=0.15)
inkm = mat('#0b0806', rough=0.6, rim=0.0)
redink = mat('#a51d16', rough=0.6, rim=0.0)
blueink = mat('#1f4fb0', rough=0.5)
goldm = mat('#f0c050', rough=0.3, metal=0.55, rim=0.3)
greenm = mat('#2f7a3a', rough=0.5)
ruling = mat('#cdb88a', rough=0.8)
feather = mat('#f2efe8', rough=0.7, rim=0.15)
quillshaft = mat('#e8dcc0', rough=0.4)
potm = mat('#3a3f52', rough=0.25, metal=0.2, rim=0.3)
TOP = 0.13                      # page surface height (flat part)


def page_mesh(x0, x1, y0, y1, nx=24):
    verts, faces = [], []
    for i in range(nx + 1):
        x = x0 + (x1 - x0) * i / nx
        d = min(abs(x), 0.4) / 0.4
        z = TOP * math.sqrt(d) - 0.004 * (abs(x) > 1.9)
        verts += [(x, y0, z), (x, y1, z)]
    for i in range(nx):
        faces.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
    ob = from_data(verts, faces, 'Page', vellum)
    sol = ob.modifiers.new('S', 'SOLIDIFY'); sol.thickness = 0.06; sol.offset = -1
    return ob


def write(s, x, y, size=0.105, m=inkm, font=None):
    t = text(s, size, m, loc=(x, y, TOP + 0.002), rot=(0, 0, 0), extrude=0.0, align='LEFT')
    if font or fnt:
        t.data.font = font or fnt
    return t


# desk, binding and the two pages
box((7.5, 5.5, 0.2), woodm, loc=(0, 0.3, -0.16))
box((4.5, 3.25, 0.06), coverm, bevel=0.02, loc=(0, 0, -0.03))
for sgn in (-1, 1):
    page_mesh(0.0 if sgn > 0 else -2.1, 2.1 if sgn > 0 else 0.0, -1.5, 1.5)
    for k in range(5):
        box((2.08, 0.01, 0.012), vellum, loc=(sgn * 1.05, -1.5 - 0.004, 0.01 + k * 0.014))
# ruled lines
for side in (-1, 1):
    for k in range(14):
        y = 1.05 - k * 0.17
        x0 = -1.85 if side < 0 else 0.25
        box((1.6, 0.006, 0.002), ruling, loc=(x0 + 0.8, y - 0.045, TOP + 0.001))
# the initial B: gold letter on a blue panel with a red frame, white dots
ix, iy, isz = -1.45, 0.72, 0.62
box((isz + 0.08, isz + 0.08, 0.004), redink, loc=(ix, iy, TOP + 0.002))
box((isz, isz, 0.006), blueink, loc=(ix, iy, TOP + 0.004))
for k in range(16):
    a = TAU * k / 16
    sphere(0.012, mat('#f6f2e8', rough=0.5), seg=8, rings=4, loc=(ix + 0.24 * math.cos(a) * 1.15, iy + 0.24 * math.sin(a) * 1.15, TOP + 0.009))
initial = text('B', 0.62, goldm, loc=(ix, iy - 0.02, TOP + 0.008), rot=(0, 0, 0), extrude=0.012)
if fini:
    initial.data.font = fini
# rubric and text (Psalm 1, Latin Vulgate)
write('Psalmus primus', -1.05, 1.02, 0.1, redink)
left = ['eatus vir qui non', 'abiit in consilio', 'impiorum, et in via',
        'peccatorum non stetit, et in', 'cathedra pestilentiae non', 'sedit; sed in lege Domini',
        'voluntas ejus, et in lege', 'ejus meditabitur die ac', 'nocte. Et erit tamquam', 'lignum quod plantatum est',
        'secus decursus aquarum,', 'quod fructum suum dabit']
for k, s in enumerate(left):
    x = -1.05 if k < 3 else -1.74
    write(s, x, 0.85 - k * 0.17)
right = ['in tempore suo: et folium', 'ejus non defluet; et omnia', 'quaecumque faciet', 'prosperabuntur. Non sic',
         'impii, non sic; sed tamquam', 'pulvis quem projicit ventus', 'a facie terrae.']
write('Psalmus secundus', 0.3, 1.02 - 7 * 0.17 - 0.0, 0.1, redink)
for k, s in enumerate(right):
    write(s, 0.28, 1.02 - k * 0.17)
for k, s in enumerate(['uare fremuerunt gentes,', 'et populi meditati sunt', 'inania? Astiterunt reges', 'terrae, et principes', 'convenerunt in unum']):
    write(s, 0.28 + (0.36 if k < 2 else 0.0), 1.02 - (8 + k) * 0.17)
# a smaller initial Q for Psalm 2
qx, qy = 0.43, 1.02 - 8.5 * 0.17
box((0.32, 0.32, 0.005), redink, loc=(qx, qy, TOP + 0.003))
q = text('Q', 0.3, goldm, loc=(qx, qy - 0.01, TOP + 0.007), rot=(0, 0, 0), extrude=0.008)
if fini:
    q.data.font = fini
# the vine border down the left margin, with ivy leaves and gold dots
bx = -1.9
box((0.035, 2.3, 0.004), goldm, loc=(bx, -0.15, TOP + 0.003))
box((0.02, 2.3, 0.005), blueink, loc=(bx + 0.04, -0.15, TOP + 0.003))
leaf = [(0, 0), (0.05, 0.03), (0.07, 0.08), (0.04, 0.12), (0.0, 0.16), (-0.04, 0.12), (-0.07, 0.08), (-0.05, 0.03)]
for k in range(8):
    y = 0.36 - k * 0.22
    s = -1
    pts = [(bx + 0.0, y), (bx + s * 0.06, y - 0.05), (bx + s * 0.05, y - 0.11)]
    tube([(p[0], p[1], TOP + 0.006) for p in pts], 0.006, greenm, kind='BEZIER')
    lm = [redink, greenm, blueink][k % 3]
    prism([(bx + s * 0.05 + 0.6 * lx, y - 0.11 - 0.6 * ly) for lx, ly in leaf], 0.004, lm, loc=(0, 0, TOP + 0.006))
    sphere(0.016, goldm, seg=10, rings=5, loc=(bx + 0.09, y - 0.06, TOP + 0.008))
# the ink pot and the quill resting in it
px, py = 2.75, 0.9
lathe([(0.0, 0.0), (0.28, 0.0), (0.3, 0.08), (0.3, 0.3), (0.2, 0.42), (0.14, 0.45), (0.14, 0.5), (0.0, 0.5)], potm, seg=48, loc=(px, py, -0.06))
cyl(0.12, 0.02, inkm, verts=32, loc=(px, py, 0.43))
nib = Vector((px - 0.02, py + 0.0, 0.38))
top = Vector((px - 0.75, py + 1.0, 1.55))
shaft = [tuple(nib.lerp(top, t)) for t in (0.0, 1.0)]
tube(shaft, 0.018, quillshaft, kind='POLY')
cone(0.018, 0.08, quillshaft, verts=12, loc=tuple(nib + (nib - top).normalized() * 0.04), rot=(nib - top).to_track_quat('Z', 'Y').to_euler())
d = (top - nib).normalized()
side = d.cross(Vector((0, 0, 1))).normalized()
verts, faces = [], []
N = 16
for i in range(N + 1):
    t = 0.3 + 0.7 * i / N
    c = nib.lerp(top, t)
    w = 0.13 * math.sin(math.pi * (t - 0.3) / 0.72) ** 0.7 + 0.015
    verts += [tuple(c - side * w * 0.55 + Vector((0, 0, 0.02))), tuple(c), tuple(c + side * w + Vector((0, 0, 0.04)))]
for i in range(N):
    a = 3 * i
    faces += [(a, a + 3, a + 4, a + 1), (a + 1, a + 4, a + 5, a + 2)]
vane = from_data(verts, faces, 'Vane', feather)
sol = vane.modifiers.new('S', 'SOLIDIFY'); sol.thickness = 0.008
floor(7.0, -0.26)

cam = camera((0.3, -4.3, 4.3), (0.25, 0.2, 0.1), lens=38)
lights((0, 0, 0.2), power=0.55, rim='#ffb347', key='#ffe2b8')
rim = bpy.data.objects['Rim']          # lift the rim light above the frame (area lights show in view)
rim.location = (rim.location.x, rim.location.y + 2.0, rim.location.z + 4.0)
rim.rotation_euler = (Vector((0.25, 0.2, 0.1)) - rim.location).to_track_quat('-Z', 'Y').to_euler()
finish('illuminated-manuscript', 'An illuminated manuscript', ['illuminated manuscript', 'manuscript', 'medieval manuscript', 'vellum', 'parchment', 'scriptorium', 'scribe', 'quill', 'gold leaf', 'decorated initial', 'rubric', 'psalter', 'book of hours', 'medieval literature', 'english literature', 'history of the book'], [
    P('Decorated initial', (ix + 0.12, iy + 0.12, TOP + 0.01), 'A big first letter, painted and gilded'),
    P('Gold leaf', (ix - 0.06, iy - 0.18, TOP + 0.02), 'Beaten gold laid on the page, so it shines'),
    P('Rubric', (-0.8, 1.02, TOP), 'Headings in red ink (Latin ruber, red)'),
    P('Script', (-1.0, 0.85 - 6 * 0.17, TOP), 'Latin written by hand by a trained scribe'),
    P('Vine border', (bx, -0.55, TOP), 'Painted vines and leaves decorate the margin'),
    P('Vellum page', (1.4, -1.3, TOP), 'Writing material made from calfskin'),
    P('Quill pen', tuple(nib.lerp(top, 0.55)), 'A goose feather cut to a nib'),
    P('Ink pot', (px, py - 0.29, 0.15), 'Ink made from oak galls and iron salts'),
])
