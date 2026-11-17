# The parts of a flower, with the front petals taken away and the ovary cut
# open: petals, sepals, stamens (anther on a filament), the carpel (stigma,
# style, ovary with ovules), receptacle and stalk.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
petm = mat('#f472b6', rough=0.45, rim=0.45, sss=0.0)
sepm = mat('#3fbf6a', rough=0.5, rim=0.3)
stem = mat('#2f9e5b', rough=0.5, rim=0.25)
fil = mat('#fde68a', rough=0.4, rim=0.2)
anth = mat('#ff9f43', rough=0.45, rim=0.3)
pollen = mat('#fbbf24', rough=0.5, emit=0.6)
carp = mat('#a3e635', rough=0.45, rim=0.3)
carpin = mat('#d9f99d', rough=0.6, rim=0)
ovule = mat('#fff7d6', rough=0.4, rim=0.2)
stig = mat('#facc15', rough=0.5, rim=0.3)


def petal(angle, tilt, m, L=1.5, W=0.62, z0=0.55, name='Petal'):
    ob = blob((W, 0.07, L / 2), m, subdiv=4, name=name)
    for v in ob.data.vertices:
        t = (v.co.z + L / 2) / L                 # 0 at the base, 1 at the tip
        v.co.x *= 0.35 + 0.65 * math.sin(min(1, t * 1.3) * math.pi / 2 + 0.2)
        v.co.y += 0.35 * (v.co.x / W) ** 2 - 0.25 * t * t   # cupped, and curling back at the tip
        v.co.z += L / 2
    ob.data.update()
    ob.location = (0, 0, z0)
    ob.rotation_euler = (tilt, 0, angle)
    return ob


tube([(0, 0.1, -1.3), (0.05, 0, -0.5), (0, 0, 0.3)], 0.12, stem, kind='BEZIER')
rec = blob((0.38, 0.38, 0.28), sepm, loc=(0, 0, 0.35), subdiv=4)
sepals = []
for k in range(5):   # sepals: small green leaves under the petals
    a = math.radians(90 + k * 72)
    if math.sin(a) > -0.5:
        sepals.append(petal(a - math.pi / 2, math.radians(70), sepm, L=0.75, W=0.28, z0=0.3, name='Sepal'))
pets = []
for k in range(6):
    a = math.radians(30 + k * 60)
    if math.sin(a) > -0.6:   # only the back petals, so the inside shows
        pets.append(petal(a - math.pi / 2, math.radians(-38 if math.sin(a) > 0 else -62), petm))
# carpel: ovary (cut open with its ovules), style and stigma
ov = blob((0.34, 0.34, 0.42), carp, loc=(0, 0, 0.82), subdiv=4)
cut(ov, blob((0.24, 0.24, 0.31), carpin, loc=(0, 0, 0.82), subdiv=4))
cut(ov, box((2, 2, 3), carpin, loc=(0, -1.0, 0.8)))
for z in (0.62, 0.78, 0.94, 1.08):
    for x in (-0.1, 0.1):
        sphere(0.06, ovule, loc=(x, 0.05, z))
style = tube([(0, 0.05, 1.2), (0, 0.05, 2.15)], 0.045, carp)
sg = blob((0.17, 0.17, 0.09), stig, loc=(0, 0.05, 2.2), lumps=0.03, subdiv=3)
# stamens: filaments topped with pollen-filled anthers
anthers = []
fils = []
for k in range(6):
    a = math.radians(15 + k * 60)
    d = Vector((math.cos(a), math.sin(a), 0))
    if d.y < -0.6:
        continue
    base = Vector((0, 0, 0.6)) + d * 0.3
    top = Vector((0, 0, 1.75)) + d * 0.62
    tube([tuple(base), tuple(base + d * 0.12 + Vector((0, 0, 0.6))), tuple(top)], 0.022, fil, kind='BEZIER')
    an = blob((0.07, 0.07, 0.16), anth, loc=top + Vector((0, 0, 0.1)), subdiv=3)
    anthers.append(an)
    fils.append(base + d * 0.12 + Vector((0, 0, 0.45)))
    for j in range(5):
        sphere(0.02, pollen, loc=top + Vector((0.07 * math.cos(j * 1.3), 0.07 * math.sin(j * 1.3) - 0.04, 0.05 + 0.04 * j)))

cam = camera((0.0, -6.4, 2.2), (0, 0, 0.75), lens=50)
lights((0, 0, 0.8), rim='#f472b6')
bpy.context.view_layer.update()
fi = min(range(len(anthers)), key=lambda k: anthers[k].location.y)
sep = min(sepals, key=lambda o: (o.matrix_world @ Vector((0, 0, 0.5))).y)
finish('flower', 'Parts of a flower', ['flower', 'plant reproduction', 'pollination', 'petal', 'stamen', 'pistil', 'carpel', 'ovary', 'botany', 'plants'], [
    P('Petal', (pets[0], (0.0, 0.1, 1.1)), 'Bright colours attract insects'),
    P('Sepal', (sep, (0, -0.06, 0.5)), 'Protects the bud before it opens'),
    P('Anther', anthers[fi], 'Makes pollen (the male part)'),
    P('Filament', tuple(fils[fi]), 'The stalk that holds up the anther'),
    P('Stigma', sg, 'Sticky top that catches pollen'),
    P('Style', (0, 0.0, 1.65), 'Tube from the stigma down to the ovary'),
    P('Ovary', (0.0, 0.0, 0.82), 'Holds the ovules, which become seeds'),
    P('Stalk', (0.04, -0.1, -0.6), 'Holds the flower up and carries water'),
])
