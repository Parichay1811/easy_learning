# The digestive system from the front. The body's left is on the viewer's
# right: stomach on the right, liver on the left. Food goes oesophagus ->
# stomach -> small intestine -> large intestine -> rectum.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(11)
oes = mat('#f59fb0', rough=0.45, rim=0.3)
stom = mat('#fb7185', rough=0.4, rim=0.35)
liv = mat('#8f2f2a', rough=0.45, rim=0.15)
gall = mat('#34d399', rough=0.4, rim=0.3)
panc = mat('#fbbf24', rough=0.5, rim=0.3)
small = mat('#f9b4c4', rough=0.45, rim=0.3)
large = mat('#ff9f43', rough=0.45, rim=0.3)
glass = mat('#9fb8ff', rough=0.2, alpha=0.06, rim=0.5)

oesoph = tube([(0, 0.1, 3.4), (0.02, 0.1, 2.8), (0.15, 0.05, 2.1), (0.42, 0, 1.62)], 0.11, oes, kind='BEZIER', name='Oesophagus')
stomach = tube([(0.42, 0, 1.68), (0.78, 0, 1.55), (0.98, -0.05, 1.18), (0.85, -0.05, 0.78), (0.5, -0.05, 0.62), (0.15, -0.05, 0.7)], 0.38, stom,
               kind='BEZIER', radii=[0.5, 1.05, 1.1, 0.95, 0.65, 0.35], name='Stomach')
liver = blob((1.15, 0.55, 0.5), liv, loc=(-0.4, 0.0, 1.55), lumps=0.03, seed=2, subdiv=4)
for v in liver.data.vertices:   # a wedge: thick on the body's right, thin towards the stomach
    k = (v.co.x + 1.15) / 2.3
    v.co.z *= 1.2 - 0.75 * k
    v.co.z += 0.15 * k
    v.co.y *= 1.1 - 0.5 * k
liver.data.update()
gb = blob((0.12, 0.1, 0.2), gall, loc=(-0.38, -0.42, 1.1), rot=(0, 0.4, 0), subdiv=3)
pancreas = blob((0.6, 0.14, 0.13), panc, loc=(0.25, 0.25, 0.9), rot=(0, -0.2, 0), lumps=0.02, subdiv=4)
# large intestine: up, across, down, then the S-bend into the rectum
L = [(-0.82, -0.05, -0.85), (-0.88, -0.05, -0.2), (-0.85, -0.05, 0.45), (-0.6, -0.1, 0.62), (0.0, -0.15, 0.48), (0.6, -0.1, 0.6), (0.95, -0.05, 0.5),
     (0.98, -0.05, -0.2), (0.88, -0.05, -0.85), (0.55, -0.05, -1.15), (0.15, -0.05, -1.15), (0.0, 0.0, -1.45), (0.0, 0.05, -1.85)]
pts, rr = [], []
for i in range(len(L) - 1):
    for k in range(12):
        u = k / 12
        p = Vector(L[i]).lerp(Vector(L[i + 1]), u)
        pts.append(tuple(p))
        rr.append(1 + 0.12 * math.sin((i * 12 + k) * 1.3) if i < 10 else 0.85)
pts.append(L[-1]); rr.append(0.8)
colon = tube(pts, 0.17, large, radii=rr, name='Colon', kind='POLY')
colon.data.splines[0].type = 'NURBS'
colon.data.splines[0].order_u = 4
colon.data.splines[0].use_endpoint_u = True
tube([(-0.8, -0.05, -0.85), (-0.74, -0.08, -1.08), (-0.62, -0.12, -1.22)], 0.05, large, kind='BEZIER')   # appendix
# small intestine: a long coiled tube in the middle
sp = []
z = 0.25
row = 0
while z > -0.95:
    xs = (-0.55, 0.62) if row % 2 == 0 else (0.62, -0.55)
    for k in range(13):
        x = xs[0] + (xs[1] - xs[0]) * k / 12
        sp.append((x + random.uniform(-0.05, 0.05), -0.28 + 0.12 * math.sin(k * 1.7 + row), z + 0.07 * math.sin(k * 1.9 + row) ))
    z -= 0.2
    row += 1
si = tube(sp, 0.095, small, kind='BEZIER', res=6, name='SmallIntestine')

cam = camera((0, -10.0, 1.0), (0, 0, 0.8), lens=50)
lights((0, 0, 1.0), rim='#fb7185')
finish('digestive-system', 'The digestive system', ['digestive system', 'digestion', 'stomach', 'intestines', 'liver', 'food', 'gut', 'oesophagus', 'human body'], [
    P('Oesophagus', (0.04, 0.0, 2.6), 'The food pipe from the mouth to the stomach'),
    P('Liver', (-0.85, -0.55, 1.6), 'Makes bile and stores food energy'),
    P('Gall bladder', (-0.38, -0.52, 1.05), 'Stores bile, which breaks up fats'),
    P('Stomach', (0.9, -0.4, 1.15), 'Churns food with acid and enzymes'),
    P('Pancreas', (0.42, 0.05, 0.95), 'Makes digestive juices and insulin'),
    P('Small intestine', (0.05, -0.4, -0.35), 'Long coiled tube where food is absorbed'),
    P('Large intestine', (0.98, -0.2, -0.3), 'Takes water back out of the waste'),
    P('Rectum', (0.0, -0.15, -1.6), 'Holds waste until it leaves the body'),
])
