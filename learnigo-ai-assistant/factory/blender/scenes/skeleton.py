# The human skeleton from the front, simplified: skull, backbone, ribcage,
# collarbones, pelvis and the long bones of the arms and legs.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
bonem = mat('#f4ead2', rough=0.45, rim=0.35)
dark = mat('#2a2140', rough=0.8)
disc = mat('#9fd8ff', rough=0.4, rim=0.2)


def bone(p, q, r, knob=1.5):
    p, q = Vector(p), Vector(q)
    tube([tuple(p), tuple(q)], r, bonem)
    for e in (p, q):
        blob((r * knob, r * knob * 0.8, r * knob * 0.9), bonem, loc=e, subdiv=3)


# skull and jaw
skull = blob((0.48, 0.55, 0.58), bonem, loc=(0, 0, 8.05), subdiv=4)
for x in (-0.18, 0.18):
    cut(skull, sphere(0.13, dark, loc=(x, -0.5, 7.98)))
cut(skull, blob((0.06, 0.2, 0.10), dark, loc=(0, -0.55, 7.78), subdiv=2))
jaw = torus(0.3, 0.07, bonem, seg=40, ring=10, arc=math.pi, loc=(0, -0.2, 7.55), rot=(0, 0, math.pi))
jaw.scale = (1, 1.1, 1)
for x in (-0.12, -0.04, 0.04, 0.12):
    box((0.06, 0.04, 0.07), bonem, loc=(x, -0.5, 7.66))
# backbone: neck to tailbone, with discs between
spine_pts = []
for i in range(26):
    z = 7.5 - i * 0.13
    y = 0.15 + 0.08 * math.sin(i / 23 * 2 * math.pi)
    spine_pts.append((0, y, z))
    cyl(0.12 if i < 7 else 0.15, 0.09, bonem, verts=24, loc=(0, y, z))
    if i:
        cyl(0.1, 0.03, disc, verts=24, loc=(0, y, z + 0.065))
sacrum = cone(0.28, 0.5, bonem, verts=24, loc=(0, 0.15, 4.00), rot=(math.pi, 0, 0))
# ribcage: 10 pairs curving from the spine round to the breastbone
for i in range(10):
    z = 6.9 - i * 0.2
    w = 0.65 + 0.35 * math.sin(min(1, (i + 1) / 6) * math.pi / 2)
    for s in (-1, 1):
        pts = []
        for k in range(17):
            a = math.pi * k / 16
            pts.append((s * w * math.sin(a), 0.15 - 0.6 * math.cos(a) * (0.55 + 0.45 * math.sin(a)) - 0.0, z - 0.25 * math.sin(a / 2) + (0.12 * (1 - math.cos(a)) if i > 6 else 0)))
        pts = [p for p in pts if p[1] > -0.62 + 0.01 or True]
        tube(pts[: (15 if i < 7 else 12)], 0.045, bonem)
breast = box((0.18, 0.08, 1.35), bonem, bevel=0.04, loc=(0, -0.66, 6.30))
for s in (-1, 1):
    tube([(s * 0.08, -0.6, 7.00), (s * 0.5, -0.45, 7.10), (s * 0.95, -0.15, 7.05)], 0.05, bonem, kind='BEZIER')   # collarbones
# pelvis: two wings and a ring
for s in (-1, 1):
    wing = blob((0.42, 0.07, 0.3), bonem, loc=(s * 0.5, 0.05, 4.25), rot=(0.25, s * -0.55, s * 0.45), subdiv=4)
pring = torus(0.36, 0.08, bonem, seg=48, ring=12, loc=(0, -0.05, 3.85), rot=(math.radians(72), 0, 0))
# arms
for s in (-1, 1):
    sh = Vector((s * 1.05, 0.0, 6.95))
    el = Vector((s * 1.35, 0.05, 5.55))
    wr = Vector((s * 1.55, -0.1, 4.30))
    bone(sh, el, 0.075)
    tube([tuple(el + Vector((s * -0.06, 0, 0))), tuple(wr + Vector((s * -0.06, 0, 0)))], 0.045, bonem)
    tube([tuple(el + Vector((s * 0.06, 0, 0))), tuple(wr + Vector((s * 0.06, 0, 0)))], 0.05, bonem)
    blob((0.14, 0.06, 0.18), bonem, loc=wr + Vector((s * 0.02, 0, -0.18)), subdiv=3)
    for f in range(4):
        tube([tuple(wr + Vector((s * (0.08 - f * 0.05), 0, -0.3))), tuple(wr + Vector((s * (0.1 - f * 0.065), -0.02, -0.62 + abs(f - 1.5) * 0.06)))], 0.022, bonem)
    blob((0.08, 0.05, 0.08), bonem, loc=sh + Vector((s * 0.02, 0, 0.06)), subdiv=3)
# legs
for s in (-1, 1):
    hip = Vector((s * 0.46, 0.0, 3.85))
    knee = Vector((s * 0.4, -0.05, 1.95))
    ank = Vector((s * 0.4, 0.05, 0.12))
    bone(hip, knee, 0.1)
    tube([tuple(knee + Vector((s * -0.04, 0, -0.1))), tuple(ank + Vector((s * -0.03, 0, 0.08)))], 0.075, bonem)
    tube([tuple(knee + Vector((s * 0.12, 0.05, -0.12))), tuple(ank + Vector((s * 0.1, 0.05, 0.08)))], 0.04, bonem)
    blob((0.13, 0.09, 0.08), bonem, loc=knee + Vector((0, 0, -0.14)), subdiv=3)
    blob((0.09, 0.05, 0.1), bonem, loc=knee + Vector((0, -0.14, 0.02)), subdiv=3)   # kneecap
    blob((0.14, 0.42, 0.09), bonem, loc=ank + Vector((s * 0.03, -0.25, -0.05)), subdiv=3)

floor(4.0, -0.05, opacity=0.5)
cam = camera((0, -16.8, 4.6), (0, 0, 4.2), lens=50)
lights((0, 0, 3.8))
finish('skeleton', 'The human skeleton', ['skeleton', 'bones', 'skull', 'ribcage', 'spine', 'pelvis', 'femur', 'human body', 'joints'], [
    P('Skull', (0.0, -0.45, 8.35), 'Protects the brain'),
    P('Ribcage', (0.65, -0.45, 6.2), 'Curved ribs that guard the heart and lungs'),
    P('Backbone', (0.0, 0.0, 5.0), '33 small bones (vertebrae) that hold you up'),
    P('Collarbone', (-0.5, -0.45, 7.1), 'Joins the arm to the body'),
    P('Pelvis', (0.55, -0.12, 4.25), 'Hip bones: carry the weight of the upper body'),
    P('Humerus', (-1.2, 0.0, 6.25), 'The upper arm bone'),
    P('Femur', (0.43, -0.1, 2.9), 'The thigh bone: the longest bone in the body'),
    P('Kneecap', (-0.4, -0.2, 1.97), 'A small bone that protects the knee joint'),
])
