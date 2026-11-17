# Pulleys: a fixed pulley at the top changes the direction of the pull; a
# movable pulley hangs on the rope with the load, so two rope sections share
# the weight and you pull with about half the force (but twice as far).
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
beam = mat('#8a5a3b', rough=0.6, rim=0.2)
wheel = mat('#5b8cff', rough=0.35, metal=0.3, rim=0.3)
hub = mat('#c9d2e8', rough=0.3, metal=0.8)
rope = mat('#f0d9a8', rough=0.7, rim=0.15)
loadm = mat('#ff9f43', rough=0.45, rim=0.3)
pull = glowmat('#34d399', 3)
up = glowmat('#22d3ee', 3)

box((5.0, 0.9, 0.4), beam, bevel=0.05, loc=(0, 0, 4.2))
r = 0.5
P1 = Vector((1.0, 0, 3.4))          # fixed pulley, hung from the beam
P2 = Vector((0.0, 0, 1.6))           # movable pulley, rises with the load


def pulley(c, rr):
    w = cyl(rr, 0.18, wheel, verts=64, loc=c, rot=(math.pi / 2, 0, 0))
    cut(w, torus(rr, 0.06, wheel, seg=64, ring=12, loc=c, rot=(math.pi / 2, 0, 0)))
    cyl(0.08, 0.26, hub, verts=24, loc=c, rot=(math.pi / 2, 0, 0))
    return w


fixed = pulley(P1, r)
tube([tuple(P1), tuple(P1 + Vector((0, 0, 0.6)))], 0.05, hub)
for s in (-1, 1):
    tube([tuple(P1 + Vector((0, s * 0.14, 0))), tuple(P1 + Vector((0, s * 0.14, 0.62)))], 0.025, hub)
mov = pulley(P2, r)
for s in (-1, 1):
    tube([tuple(P2 + Vector((0, s * 0.14, 0))), tuple(P2 + Vector((0, s * 0.14, -0.7)))], 0.025, hub)
ld = box((1.1, 1.1, 0.9), loadm, bevel=0.06, loc=P2 + Vector((0, 0, -1.2)))
tube([tuple(P2 + Vector((0, 0, -0.7))), tuple(P2 + Vector((0, 0, -0.75)))], 0.04, hub)
# the rope: tied to the beam, down round the movable pulley, up over the fixed one, down to the hand
anchor = Vector((-0.5, 0, 4.0))
pts = [anchor, Vector((-0.5, 0, P2.z))]
for i in range(1, 16):   # under the movable pulley
    a = math.pi + math.pi * i / 16
    pts.append(P2 + Vector((r * math.cos(a), 0, r * math.sin(a))))
pts += [Vector((0.5, 0, P2.z)), Vector((P1.x - r, 0, P1.z))]
for i in range(1, 16):   # over the fixed pulley
    a = math.pi - math.pi * i / 16
    pts.append(P1 + Vector((r * math.cos(a), 0, r * math.sin(a))))
hand = Vector((P1.x + r, 0, 0.6))
pts.append(hand)
tube([tuple(p) for p in pts], 0.035, rope)
# arrows: pull down on the free end; the load rises
for p, d, m in ((hand + Vector((0.35, 0, 1.2)), Vector((0, 0, -1)), pull), (P2 + Vector((-1.0, 0, -1.4)), Vector((0, 0, 1)), up)):
    tube([tuple(p), tuple(p + d * 0.75)], 0.045, m)
    c = cone(0.13, 0.3, m, verts=20, loc=p + d * 0.85)
    c.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()

cam = camera((0.5, -10.6, 2.4), (0.45, 0, 2.15), lens=46)
lights((0, 0, 2.0))
finish('pulley', 'Pulleys', ['pulley', 'simple machines', 'block and tackle', 'force', 'load', 'effort', 'rope', 'lifting', 'physics'], [
    P('Fixed pulley', (P1.x, -0.15, P1.z + 0.25), 'Stays put: changes the direction of your pull'),
    P('Movable pulley', (P2.x, -0.15, P2.z - 0.25), 'Rises with the load, sharing its weight'),
    P('Rope', (-0.5, -0.05, 2.9), 'Two rope sections hold the load up'),
    P('Load', ld, 'The weight being lifted'),
    P('Effort', tuple(hand + Vector((0.35, 0, 0.9))), 'You pull with about half the force'),
    P('Beam', (-1.6, -0.45, 4.2), 'A strong support holding everything up'),
])
