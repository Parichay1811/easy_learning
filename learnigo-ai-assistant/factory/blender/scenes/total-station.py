# A surveyor's total station on its tripod, aimed at a reflector prism. It
# measures horizontal and vertical angles with its rotating telescope, and
# distance with an electronic distance meter (EDM) that times a beam bounced
# back from the prism; from these it works out positions and heights. The
# tribrach's three levelling screws and bubble set it level over a point.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(64)
wood = mat('#c9a36b', rough=0.6, rim=0.15)
alu = mat('#c9d2e8', rough=0.3, metal=0.85)
blackm = mat('#23262f', rough=0.45, rim=0.15)
whitem = mat('#e9edf4', rough=0.35, rim=0.2)
greym = mat('#5a6178', rough=0.4, metal=0.3, rim=0.2)
accent = mat('#ff9f43', rough=0.4, rim=0.2)
glassm = mat('#7fb8ff', rough=0.05, metal=0.3, emit=0.6)
screen = glowmat('#9fe3c0', 1.6)
bubble = mat('#c8ff6a', rough=0.1, emit=0.8)
groundm = mat('#3f6f45', rough=0.9)
prismm = mat('#cfe8ff', rough=0.02, metal=1.0)
beam = glowmat('#ff4040', 3.0)
ZH = 1.45                                    # top of the tripod head

# tripod: three legs, upper wooden part, lower metal extension, shoes
for k in range(3):
    a = math.radians(90 + 120 * k)
    top = Vector((0.16 * math.cos(a), 0.16 * math.sin(a), ZH - 0.05))
    foot = Vector((0.95 * math.cos(a), 0.95 * math.sin(a), 0.0))
    mid = top.lerp(foot, 0.62)
    side = Vector((-math.sin(a), math.cos(a), 0)) * 0.035
    for sgn in (-1, 1):
        tube([tuple(top + side * sgn), tuple(mid + side * sgn)], 0.024, wood)
    tube([tuple(mid), tuple(foot.lerp(mid, 0.06))], 0.018, alu)
    box((0.05, 0.05, 0.08), blackm, loc=tuple(mid + Vector((0, 0, 0.03))))
    cone(0.03, 0.09, alu, verts=16, loc=tuple(foot + Vector((0, 0, 0.04))), rot=(math.pi, 0, 0))
cyl(0.2, 0.08, wood, verts=6, loc=(0, 0, ZH - 0.04))
cyl(0.1, 0.06, alu, verts=24, loc=(0, 0, ZH + 0.02))
# tribrach: triangular base, three levelling screws, circular bubble
tri = [(0.2 * math.cos(math.radians(90 + 120 * k)), 0.2 * math.sin(math.radians(90 + 120 * k))) for k in range(3)]
base = prism(tri, 0.05, blackm, loc=(0, 0, ZH + 0.075))
bevel(base, 0.03, 3)
prism(tri, 0.04, blackm, loc=(0, 0, ZH + 0.19), rot=(0, 0, 0))
screws = []
for x, y in tri:
    p = (x * 0.78, y * 0.78, ZH + 0.135)
    cyl(0.04, 0.06, greym, verts=24, loc=p)
    cyl(0.012, 0.08, alu, verts=12, loc=p)
    screws.append(p)
cyl(0.03, 0.02, blackm, verts=24, loc=(0.0, -0.12, ZH + 0.215))
sphere(0.016, bubble, seg=16, rings=8, loc=(0.0, -0.12, ZH + 0.222))
# the instrument (turns about z to aim; the telescope tilts about x)
target = Vector((1.9, 3.4, 1.62))
az = -math.atan2(target.x, target.y)
inst = empty('Alidade', loc=(0, 0, ZH + 0.21), rot=(0, 0, az))
cyl(0.16, 0.08, greym, verts=48, loc=(0, 0, 0.04), parent=inst)
body = box((0.34, 0.26, 0.16), whitem, bevel=0.025, loc=(0, 0, 0.16), parent=inst)
box((0.22, 0.012, 0.09), blackm, loc=(0, -0.132, 0.17), parent=inst)
box((0.12, 0.006, 0.05), screen, loc=(-0.035, -0.139, 0.18), parent=inst)
for i in range(3):
    for j in range(2):
        box((0.018, 0.006, 0.014), whitem, loc=(0.055 + 0.022 * i, -0.139, 0.16 + 0.025 * j), parent=inst)
for s in (-1, 1):
    st = box((0.06, 0.2, 0.3), whitem, bevel=0.02, loc=(s * 0.14, 0, 0.38), parent=inst)
    cyl(0.04, 0.03, greym, verts=24, loc=(s * 0.175, 0, 0.44), rot=(0, math.pi / 2, 0), parent=inst)
box((0.34, 0.06, 0.04), greym, bevel=0.01, loc=(0, 0, 0.58), parent=inst)
for s in (-1, 1):
    box((0.03, 0.05, 0.06), greym, loc=(s * 0.155, 0, 0.55), parent=inst)
elev = math.atan2(target.z - (ZH + 0.65), Vector((target.x, target.y)).length)
tel = empty('Telescope', loc=(0, 0, 0.44), rot=(elev, 0, 0), parent=inst)
cyl(0.075, 0.3, whitem, verts=40, loc=(0, 0.02, 0), rot=(math.pi / 2, 0, 0), parent=tel)
cyl(0.085, 0.06, greym, verts=40, loc=(0, 0.17, 0), rot=(math.pi / 2, 0, 0), parent=tel)
cyl(0.065, 0.01, glassm, verts=40, loc=(0, 0.2, 0), rot=(math.pi / 2, 0, 0), parent=tel)
cyl(0.035, 0.07, blackm, verts=24, loc=(0, -0.16, 0), rot=(math.pi / 2, 0, 0), parent=tel)
cyl(0.02, 0.12, blackm, verts=16, loc=(0, 0.0, 0.09), rot=(math.pi / 2, 0, 0), parent=tel)
box((0.1, 0.06, 0.06), accent, loc=(0, -0.02, -0.09), parent=tel)
# the reflector prism on its pole, and the EDM beam
pole = cyl(0.015, 1.5, mat('#e9edf4', rough=0.4), verts=12, loc=(target.x, target.y, 0.75))
for k in range(6):
    cyl(0.0155, 0.12, mat('#e5484d', rough=0.45), verts=12, loc=(target.x, target.y, 0.12 + 0.25 * k))
pr = empty('Prism', loc=tuple(target), rot=(0, 0, az))
cyl(0.075, 0.07, blackm, verts=32, rot=(math.pi / 2, 0, 0), parent=pr)
cone(0.065, 0.07, prismm, verts=3, loc=(0, -0.05, 0), rot=(math.pi / 2, 0, 0), parent=pr)
box((0.24, 0.03, 0.04), mat('#ffcf4a', rough=0.4, rim=0.2), loc=(0, 0.0, 0.12), parent=pr)
bpy.context.view_layer.update()
start = tel.matrix_world @ Vector((0, 0.21, 0))
tube([tuple(start), tuple(target + Vector((0, 0, 0)))], 0.006, beam)
gr = floor(7.5, 0.0, color='#1f4a2b', opacity=0.95)
cyl(0.02, 0.02, mat('#d6dbe8', rough=0.3, metal=0.8), verts=16, loc=(0, 0, 0.01))

cam = camera((-3.4, -1.7, 2.1), (0.5, 1.1, 0.9), lens=30)
lights((0.3, 0.6, 1.4), power=0.8, rim='#ff9f43')
finish('total-station', 'A total station', ['total station', 'surveying', 'theodolite', 'edm', 'electronic distance measurement', 'tripod', 'tribrach', 'levelling', 'prism', 'land surveying', 'geomatics', 'angles', 'civil engineering'], [
    P('Telescope', (tel, (0.0, 0.1, 0.08)), 'Sights the target and turns up and down'),
    P('Display and keypad', (inst, (-0.03, -0.14, 0.18)), 'Shows the measured angles and distances'),
    P('Tribrach', (0.0, -0.17, ZH + 0.08), 'The base plate that clamps the instrument on'),
    P('Levelling screws', screws[1], 'Three screws to level the instrument exactly'),
    P('Tripod', (0.6 * math.cos(math.radians(210)), 0.6 * math.sin(math.radians(210)), 0.58), 'A steady three-legged stand set over the point'),
    P('Reflector prism', tuple(target + Vector((0, 0, 0.0))), 'Sends the EDM beam straight back'),
    P('EDM beam', tuple(start.lerp(target, 0.45)), 'Times the bounced beam to find the distance'),
])
