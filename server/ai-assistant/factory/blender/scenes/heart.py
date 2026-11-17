# The heart, cut open from the front: four chambers, septum, valves and the
# great vessels. Blue = blood low in oxygen (right side), red = rich in oxygen.
# Seen from the front, the heart's right side is on the viewer's LEFT.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
muscle = mat('#c2415a', rough=0.5, rim=0.2)
cutface = mat('#e8798a', rough=0.65, rim=0.05)
blue_in = mat('#3b6fd8', rough=0.35, rim=0.3)
red_in = mat('#e0344f', rough=0.35, rim=0.3)
bluev = mat('#4d7cf0', rough=0.35, rim=0.3)
redv = mat('#ef4452', rough=0.35, rim=0.3)
valve = mat('#ffe7b0', rough=0.4, rim=0.2)
fat = mat('#f4c25b', rough=0.6, rim=0.1)

heart = empty('Heart')
body = blob((1.3, 1.0, 1.5), muscle, lumps=0.03, seed=3)
for v in body.data.vertices:   # taper to the apex, which points down to the viewer's right
    t = max(0.0, min(1.0, (1.1 - v.co.z) / 2.6))
    k = 1 - 0.6 * t ** 1.4
    v.co.x = v.co.x * k + 0.4 * t - 0.05
    v.co.y *= 0.75 + 0.25 * k
body.data.update()
front = box((6, 2, 6), cutface, loc=(0, -1.0 - 0.02, 0))
cut(body, front)   # the front comes off first, then the chambers are hollowed
RA = blob((0.34, 0.45, 0.38), blue_in, loc=(-0.5, 0.05, 0.6), subdiv=4)
LA = blob((0.36, 0.42, 0.28), red_in, loc=(0.42, 0.12, 0.8), subdiv=4)
RV = blob((0.3, 0.45, 0.58), blue_in, loc=(-0.28, 0.0, -0.3), rot=(0, math.radians(-34), 0), subdiv=4)
LV = blob((0.25, 0.4, 0.62), red_in, loc=(0.47, 0.0, -0.33), rot=(0, math.radians(-24), 0), subdiv=4)
TV = cyl(0.17, 0.5, blue_in, loc=(-0.42, 0.05, 0.24), rot=(0, 0.3, 0))   # openings where the valves sit
MV = cyl(0.17, 0.5, red_in, loc=(0.47, 0.08, 0.42), rot=(0, -0.2, 0))
for c in (RA, LA, RV, LV, TV, MV):
    cut(body, c)
body.parent = heart
# the valve leaflets (tricuspid on the right side, mitral on the left)
for x, z, w in ((-0.42, 0.24, 0.17), (0.47, 0.42, 0.16)):
    for k in (-1, 1):
        box((w * 0.85, 0.035, 0.26), valve, loc=(x + k * w * 0.5, 0.06, z - 0.16), rot=(0, k * 0.4, 0), parent=heart)
# great vessels, behind the cut plane so they stay whole
aorta = tube([(0.15, 0.3, 0.45), (0.1, 0.35, 1.45), (0.35, 0.5, 2.0), (0.85, 0.6, 2.0), (1.15, 0.65, 1.45), (1.2, 0.65, 0.6)], 0.22, redv, kind='BEZIER', parent=heart, name='Aorta')
for x in (0.3, 0.6, 0.88):
    tube([(x, 0.55, 1.95), (x - 0.05, 0.55, 2.5)], 0.07, redv, parent=heart)
pulm = tube([(-0.12, 0.25, 0.75), (-0.12, 0.05, 1.35), (0.05, 0.45, 1.72)], 0.2, bluev, kind='BEZIER', parent=heart, name='Pulmonary')
tube([(0.0, 0.5, 1.72), (-0.7, 0.8, 1.62), (-1.3, 0.85, 1.5)], 0.12, bluev, kind='BEZIER', parent=heart)
tube([(0.1, 0.5, 1.72), (0.7, 0.95, 1.5), (1.65, 0.95, 1.3)], 0.12, bluev, kind='BEZIER', parent=heart)
svc = tube([(-0.72, 0.25, 0.8), (-0.75, 0.3, 1.5), (-0.75, 0.3, 2.3)], 0.19, bluev, kind='BEZIER', parent=heart, name='SVC')
tube([(-0.7, 0.3, 0.4), (-0.68, 0.4, -0.6), (-0.66, 0.45, -1.5)], 0.19, bluev, kind='BEZIER', parent=heart)
for z in (0.75, 0.98):
    tube([(0.6, 0.35, z), (1.2, 0.5, z + 0.05), (1.75, 0.5, z + 0.1)], 0.085, redv, kind='BEZIER', parent=heart)

cam = camera((0.3, -8.8, 1.6), (0.3, 0, 0.3), lens=55)
lights((0, 0, 0.3), rim='#fb7185')
heart.rotation_euler = (math.radians(8), 0, math.radians(-14))


def beat(t):
    ph = (t * 4) % 1  # four beats a loop
    p = math.exp(-((ph - 0.12) / 0.06) ** 2) + 0.55 * math.exp(-((ph - 0.32) / 0.05) ** 2)
    s = 1 - 0.04 * p
    heart.scale = (s, 1 - 0.02 * p, s)


finish('heart', 'The human heart', ['heart', 'circulation', 'blood', 'chambers', 'atrium', 'ventricle', 'valves', 'aorta', 'human body', 'organ'], [
    P('Right atrium', (body, (-0.56, 0.3, 0.66)), 'Collects used blood from the body'),
    P('Right ventricle', (body, (-0.33, 0.3, -0.38)), 'Pumps blood to the lungs to pick up oxygen'),
    P('Left atrium', (body, (0.45, 0.35, 0.82)), 'Collects oxygen-rich blood from the lungs'),
    P('Left ventricle', (body, (0.47, 0.3, -0.4)), 'Thickest wall: pumps blood to the whole body'),
    P('Septum', (body, (0.12, 0.0, -0.3)), 'The wall that keeps the two sides apart'),
    P('Aorta', (aorta, (0.55, 0.5, 2.1)), 'The biggest artery, carrying blood to the body'),
    P('Pulmonary artery', (pulm, (-0.1, 0.0, 1.4)), 'Takes blood from the heart to the lungs'),
    P('Vena cava', (svc, (-0.75, 0.3, 2.0)), 'Big veins bringing blood back to the heart'),
], anim=beat)
