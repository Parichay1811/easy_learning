# A four-stroke petrol engine cylinder, cut open. The piston slides up and
# down; the connecting rod turns the crankshaft. Intake (valve opens, fuel
# and air in), compression, power (the spark plug fires, the burning gas
# pushes the piston down), exhaust (valve opens, gas out). The loop shows
# the full cycle: two turns of the crankshaft.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
block = mat('#7c8296', rough=0.45, metal=0.5, rim=0.2)
blockcut = mat('#a9b0c4', rough=0.55, metal=0.3)
steel = mat('#d6dbe8', rough=0.25, metal=0.9)
rodm = mat('#5b8cff', rough=0.3, metal=0.6, rim=0.2)
crankm = mat('#ff9f43', rough=0.35, metal=0.5, rim=0.2)
ringm = mat('#3a3f55', rough=0.4, metal=0.7)
plug = mat('#e9eeff', rough=0.3)
inm = mat('#34d399', rough=0.3, metal=0.6, rim=0.2)
exm = mat('#fb7185', rough=0.3, metal=0.6, rim=0.2)
fire = mat('#ffb347', alpha=0.85, emit=6)
spark = glowmat('#9fd8ff', 12)
rc, L, bore = 0.5, 1.6, 0.55
half = lambda m: box((8, 4, 10), m, loc=(0, -2, 1.5))
# the block: cylinder walls, head and crankcase, cut in half
cylw = cyl(bore + 0.25, 2.0, block, verts=64, loc=(0, 0, 2.15))
cut(cylw, cyl(bore, 2.2, blockcut, verts=64, loc=(0, 0, 2.1)))
head = box((2.1, 1.6, 0.55), block, bevel=0.05, loc=(0, 0, 3.4))
cut(head, cyl(bore, 0.5, blockcut, verts=64, loc=(0, 0, 3.05)))
for x, m in ((-0.28, inm), (0.28, exm)):   # ports through the head
    cut(head, tube([(x, 0, 3.15), (x * 2.2, 0, 3.4), (x * 4.4, 0, 3.55)], 0.17, m, kind='BEZIER'))
case = cyl(1.15, 1.3, block, verts=64, loc=(0, 0, -0.1), rot=(math.pi / 2, 0, 0))
cut(case, cyl(1.0, 1.4, blockcut, verts=64, loc=(0, 0, -0.1), rot=(math.pi / 2, 0, 0)))
cut(case, cyl(bore + 0.05, 1.5, blockcut, verts=48, loc=(0, 0, 1.0)))
for ob in (cylw, head, case):
    cut(ob, half(blockcut))
sp = cyl(0.09, 0.5, plug, verts=24, loc=(0, 0, 3.75))
cyl(0.05, 0.2, steel, verts=16, loc=(0, 0, 3.4))
# moving parts
piston = empty('Piston')
pb = cyl(bore - 0.01, 0.6, steel, verts=64, parent=piston)
for k in range(3):
    torus(bore - 0.005, 0.018, ringm, seg=64, ring=8, loc=(0, 0, 0.18 - k * 0.09), parent=piston)
rod = empty('Rod')
rb = box((0.16, 0.12, L), rodm, bevel=0.03, loc=(0, 0, L / 2), parent=rod)
crank = empty('Crank', rot=(math.pi / 2, 0, 0))
cyl(0.14, 1.2, crankm, verts=32, parent=crank)
web = prism([(math.cos(a) * (0.75 if math.sin(a) < 0 else 0.25), math.sin(a) * (0.75 if math.sin(a) < 0 else 0.25)) for a in [TAU * i / 32 for i in range(32)]], 0.16, crankm, parent=crank)
cpin = cyl(0.11, 0.3, steel, verts=24, loc=(0, rc, 0), parent=crank)
valves = []
for x, m in ((-0.28, inm), (0.28, exm)):
    v = empty('Valve', loc=(x, 0, 3.12))
    cone(0.16, 0.06, m, verts=32, parent=v, rot=(math.pi, 0, 0))
    tube([(0, 0, 0.02), (0, 0, 0.75)], 0.03, m, parent=v)
    valves.append(v)
flame = blob((bore * 0.95, bore * 0.95, 0.25), fire, subdiv=3)
sparkb = sphere(0.06, spark, loc=(0, 0, 3.12))
no_shadow(flame, sparkb)

cam = camera((1.1, -7.9, 2.4), (0.0, 0, 1.6), lens=44)
lights((0, 0, 1.5), rim='#ff9f43')


def run(t):
    th = TAU * 2 * t   # two turns per cycle
    cp = Vector((rc * math.sin(th), 0, rc * math.cos(th)))
    pz = rc * math.cos(th) + math.sqrt(L * L - (rc * math.sin(th)) ** 2)
    piston.location = (0, 0, pz + 0.18)
    rod.location = cp
    d = Vector((0, 0, pz)) - cp
    rod.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    crank.rotation_euler = (math.pi / 2, th, 0)
    stroke = int((t % 1) * 4)    # 0 intake, 1 compression, 2 power, 3 exhaust
    phase = (t * 4) % 1
    lift = 0.14 * math.sin(phase * math.pi)
    valves[0].location.z = 3.12 - (lift if stroke == 0 else 0)
    valves[1].location.z = 3.12 - (lift if stroke == 3 else 0)
    top = pz + 0.48
    on = stroke == 2 and phase < 0.85
    flame.location = (0, 0, (top + 3.05) / 2)
    gap = max(0.05, 3.05 - top)
    flame.scale = ((1, 1, gap / 0.5) if on else (0.001,) * 3)
    sparkb.scale = (1, 1, 1) if (stroke == 2 and phase < 0.15) else (0.001,) * 3


run(0)
finish('piston-engine', 'A piston engine', ['engine', 'piston', 'four-stroke', 'crankshaft', 'internal combustion', 'spark plug', 'valves', 'car engine', 'energy', 'engineering'], [
    P('Spark plug', (0, -0.1, 3.85), 'Makes a spark that lights the fuel and air'),
    P('Intake valve', (-0.62, -0.05, 3.35), 'Opens to let fuel and air in'),
    P('Exhaust valve', (0.62, -0.05, 3.35), 'Opens to let burnt gas out'),
    P('Piston', (piston, (0, -0.4, 0.05)), 'Pushed down by the burning gas'),
    P('Cylinder', (-0.72, -0.02, 1.6), 'The tube the piston slides in'),
    P('Connecting rod', (rod, (0, -0.07, L * 0.5)), 'Links the piston to the crankshaft'),
    P('Crankshaft', (0, -0.65, 0.0), 'Turns the up-and-down motion into spinning'),
], anim=run)
