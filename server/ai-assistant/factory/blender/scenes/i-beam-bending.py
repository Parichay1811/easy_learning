# A simply supported steel I-beam bending under a point load at midspan
# (the bend is exaggerated). Colour shows the bending stress: the top is
# squeezed (compression, red), the bottom stretched (tension, blue), and the
# neutral axis through the middle has no bending stress. The stress grows
# with distance from the neutral axis (sigma = M y / I) and with the bending
# moment, which is largest under the load, so the colour is strongest there.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
L, h, b, tf, tw = 8.0, 0.8, 0.55, 0.1, 0.07
DMAX = 0.42                                  # exaggerated midspan deflection
NEUTRAL, COMP, TENS = '#c3c9d8', '#e01f2a', '#1650d8'


def w(x):                                    # elastic curve, point load at midspan
    u = L / 2 - abs(x)                       # distance from the nearer support
    return -DMAX * u * (3 * L * L - 4 * u * u) / (L ** 3)


def slope(x, e=1e-3):
    return (w(x + e) - w(x - e)) / (2 * e)


def moment(x):                               # 0 at the supports, 1 under the load
    return (L / 2 - abs(x)) / (L / 2)


def stress_col(x, z):
    s = moment(x) * z / (h / 2)              # + compression (top), - tension (bottom)
    s = max(-1.0, min(1.0, s))
    return mix(NEUTRAL, COMP, s ** 0.55) if s >= 0 else mix(NEUTRAL, TENS, (-s) ** 0.55)


# the I-section outline (y, z), anticlockwise
H2, B2, T2 = h / 2, b / 2, tw / 2
sec = [(-B2, -H2), (B2, -H2), (B2, -H2 + tf), (T2, -H2 + tf), (T2, H2 - tf), (B2, H2 - tf),
       (B2, H2), (-B2, H2), (-B2, H2 - tf), (-T2, H2 - tf), (-T2, -H2 + tf), (-B2, -H2 + tf)]
nx = 120
xs = [-L / 2 + L * i / nx for i in range(nx + 1)]
verts, cols, faces = [], [], []
for x in xs:
    th = math.atan(slope(x))
    for y, z in sec:
        verts.append((x - z * math.sin(th), y, w(x) + z * math.cos(th)))
        cols.append(stress_col(x, z))
n = len(sec)
for i in range(nx):
    for j in range(n):
        j2 = (j + 1) % n
        faces.append((i * n + j, i * n + j2, (i + 1) * n + j2, (i + 1) * n + j))
faces.append(tuple(range(n))[::-1])
faces.append(tuple(nx * n + j for j in range(n)))
me = bpy.data.meshes.new('Beam')
me.from_pydata(verts, [], faces)
at = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
for k, c in enumerate(cols):
    at.data[k].color = lin(c)
beam = bpy.data.objects.new('Beam', me)
me.materials.append(vcolmat(rough=0.45, name='Stress'))
link(beam)
# the neutral axis, a bright line along the web
na = [(x, -T2 - 0.012, w(x)) for x in xs]
tube(na, 0.014, glowmat('#ffffff', 3.0))
# supports: a pin at the left, a roller at the right
supm = mat('#8b95b5', rough=0.4, metal=0.5, rim=0.2)
groundm = mat('#3a4466', rough=0.7)
for x, roller in ((-L / 2 + 0.25, False), (L / 2 - 0.25, True)):
    zt = w(x) - H2
    prism([(-0.32, 0), (0.32, 0), (0, 0.45)], 0.7, supm, loc=(x, 0, zt - 0.45), rot=(math.pi / 2, 0, 0))
    if roller:
        for dx in (-0.2, 0.0, 0.2):
            cyl(0.07, 0.6, mat('#d6dbe8', rough=0.2, metal=0.9), verts=24, loc=(x + dx, 0, zt - 0.52), rot=(math.pi / 2, 0, 0))
    else:
        cyl(0.07, 0.75, mat('#d6dbe8', rough=0.2, metal=0.9), verts=24, loc=(x, 0, zt - 0.02), rot=(math.pi / 2, 0, 0))
    box((1.1, 1.0, 0.12 if roller else 0.26), groundm, loc=(x, 0, zt - 0.65 if roller else zt - 0.58))
# the load: an arrow pressing down at midspan
loadm = glowmat('#ff9f43', 3.0)
tube([(0, 0, w(0) + H2 + 1.6), (0, 0, w(0) + H2 + 0.45)], 0.05, loadm)
cone(0.16, 0.35, loadm, verts=24, loc=(0, 0, w(0) + H2 + 0.26), rot=(math.pi, 0, 0))
box((0.6, 0.5, 0.06), mat('#d6dbe8', rough=0.3, metal=0.8), loc=(0, 0, w(0) + H2 + 0.03))
floor(7.5, w(-L / 2 + 0.25) - H2 - 0.715)

cam = camera((-2.2, -10.6, 3.2), (0.0, 0, -0.3), lens=42)
lights((0, 0, -0.2), power=0.75, rim='#5b8cff')
x1 = -0.9
finish('i-beam-bending', 'A bending I-beam', ['i-beam', 'beam bending', 'bending stress', 'neutral axis', 'compression', 'tension', 'simply supported beam', 'point load', 'bending moment', 'flexure formula', 'strength of materials', 'structural engineering', 'civil engineering', 'mechanical engineering'], [
    P('Compression', (x1, -B2 * 0.6, w(x1) + H2), 'The top flange is squeezed shorter'),
    P('Tension', (x1, -B2, w(x1) - H2 + 0.05), 'The bottom flange is stretched longer'),
    P('Neutral axis', (-2.4, -T2 - 0.012, w(-2.4)), 'No bending stress along this line'),
    P('Web', (1.4, -T2, w(1.4) - 0.17), 'The thin middle plate; it carries the shear'),
    P('Point load', (0, 0, w(0) + H2 + 1.2), 'A load P at midspan: the moment is largest here'),
    P('Pin support', (-L / 2 + 0.25, -0.35, w(-L / 2 + 0.25) - H2 - 0.25), 'Holds the beam up and in place but lets it turn'),
    P('Roller support', (L / 2 - 0.25, -0.35, w(L / 2 - 0.25) - H2 - 0.3), 'Lets the end slide sideways as the beam bends'),
])
