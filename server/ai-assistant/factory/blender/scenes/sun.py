# The Sun with a slice cut away: the core where hydrogen fuses into helium,
# the radiative zone, the churning convective zone, the glowing surface
# (photosphere) with sunspots, a prominence and the faint corona.
# In the loop the surface boils and the convection cells turn.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
R = 2.0
surf = flowmat('#e85a00', '#ffc23d', scale=6.0, strength=1.5, distort=9, name='Surface')
surf.node_tree.nodes[surf['wave']].wave_type = 'RINGS'
conv = flowmat('#c0300a', '#ff7a1a', scale=3.0, strength=1.4, distort=6, name='Convective')
conv.node_tree.nodes[conv['wave']].wave_type = 'RINGS'
rad = mat('#ffa030', rough=0.6, emit=1.3)
core = mat('#fff4c2', rough=0.5, emit=4)
spot = mat('#3a1203', rough=0.8)
prom = flowmat('#ff4d1a', '#ffb347', scale=6, strength=5, distort=2, name='Prominence')
corona = mat('#ffcf6b', alpha=0.05, emit=1.0)


def wedge(m, e=0.0):
    return box((6, 6, 6), m, loc=(3 + e, -3 - e, 3 + e))


sunb = sphere(R, surf, seg=128, rings=64)
cut(sunb, wedge(conv))
cz = sphere(R * 0.7, rad, seg=96, rings=48)
cut(cz, wedge(rad, 0.008))
cr = sphere(R * 0.25, core, seg=64, rings=32)
cut(cr, wedge(core, 0.016))
no_shadow(sunb, cz, cr)
for th, ph, r in ((-0.4, -2.0, 0.12), (-0.3, -2.25, 0.08), (-0.5, -1.0, 0.1)):
    d = Vector((math.cos(th) * math.cos(ph), math.cos(th) * math.sin(ph), math.sin(th)))
    s = cyl(r * 1.6, 0.04, spot, verts=24, loc=d * (R - 0.005))
    s.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
# a prominence: a glowing loop of gas on the edge
base = Vector((math.cos(1.4), math.sin(1.4), 0.0))
pts = []
for i in range(25):
    u = i / 24
    a = -2.8 + 0.5 * u
    h = 0.75 * math.sin(u * math.pi)
    pts.append(tuple(Vector((math.cos(a), math.sin(a) - 0.0, 0.25 * math.sin(u * math.pi) + 0.55)).normalized() * (R + h)))
pr = tube(pts, 0.07, prom, kind='POLY')
view = (Vector((6.0, -8.2, 4.4)) - Vector((0.05, -0.1, 0.25))).normalized()
cor = torus(R * 1.08, 0.12, mat('#ffcf6b', alpha=0.35, emit=2.0, rough=1.0), seg=128, ring=16)
cor.rotation_euler = view.to_track_quat('Z', 'Y').to_euler()
no_shadow(cor, pr)

cam = camera((6.0, -8.2, 4.4), (0.05, -0.1, 0.25), lens=50)
lights((0, 0, 0), power=0.2)


def boil(t):
    set_phase(surf, t, 1)
    set_phase(conv, t, 1)
    set_phase(prom, t, 2)


d0 = Vector((math.cos(-0.4) * math.cos(-2.0), math.cos(-0.4) * math.sin(-2.0), math.sin(-0.4)))
finish('sun', 'Inside the Sun', ['sun', 'star', 'nuclear fusion', 'core', 'photosphere', 'sunspots', 'solar flare', 'corona', 'energy', 'space'], [
    P('Core', (0.1, -0.1, 0.12), 'Hydrogen fuses into helium here at 15 million °C'),
    P('Radiative zone', (0.01, -0.85, 0.75), 'Energy creeps outwards as light'),
    P('Convective zone', (0.01, -1.45, 1.05), 'Hot gas rises, cools and sinks in huge loops'),
    P('Photosphere', (-1.2, -1.5, 0.3), 'The glowing surface we see, about 5,500 °C'),
    P('Sunspot', tuple(d0 * R), 'A cooler, darker patch caused by magnetism'),
    P('Prominence', pts[12], 'A giant loop of glowing gas'),
    P('Corona', tuple(Matrix.Rotation(0, 4, 'Z') @ (cor.rotation_euler.to_matrix() @ Vector((-R * 1.08, 0, 0)))), 'The Sun\'s thin outer atmosphere'),
], anim=boil)
