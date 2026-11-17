# A healthy plate: about half vegetables and fruit, a quarter whole grains
# (rice and bread), a quarter protein (egg, beans, chicken), with milk or
# yoghurt and a glass of water.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(8)
plate = mat('#f4f7ff', rough=0.3, rim=0.15)
div = mat('#d9dde8', rough=0.3)
mat_t = mat('#2dd4bf', rough=0.8)
floor(5.0, 0, opacity=0.5)
box((5.2, 3.6, 0.03), mat_t, bevel=0.2, loc=(0, 0, 0.015))
lathe([(0, 0.04), (1.8, 0.04), (2.0, 0.16), (1.9, 0.18), (1.7, 0.09), (0, 0.09)], plate, seg=96)
for a in (90, 270, 0):
    r0 = 0.0 if a != 0 else 0.0
    L = 1.7
    d = Vector((math.cos(math.radians(a)), math.sin(math.radians(a)), 0))
    if a == 0:
        tube([(0, 0, 0.1), tuple(d * L + Vector((0, 0, 0.1)))], 0.025, div)
    else:
        tube([(0, 0, 0.1), tuple(d * L + Vector((0, 0, 0.1)))], 0.025, div)
# vegetables (left half): broccoli, carrot sticks, tomato, lettuce
veg = Vector((-0.85, 0.1, 0.1))
broc = mat('#3fa34d', rough=0.8, rim=0.2)
for k in range(5):
    p = veg + Vector((random.uniform(-0.45, 0.2), random.uniform(0.15, 0.85), 0))
    tube([tuple(p), tuple(p + Vector((0, 0, 0.18)))], 0.05, mat('#8bc34a', rough=0.7))
    for j in range(6):
        ico(0.09, broc, 2, loc=p + Vector((random.uniform(-0.08, 0.08), random.uniform(-0.08, 0.08), 0.22 + random.uniform(0, 0.05))))
carrot = mat('#ff8c2a', rough=0.5, rim=0.2)
for k in range(6):
    cyl(0.045, 0.6, carrot, verts=12, loc=veg + Vector((-0.2 + k * 0.09, -0.55, 0.06)), rot=(math.pi / 2, 0, 0.3))
tomato = mat('#f0433a', rough=0.3, rim=0.3)
for p in ((-1.3, -0.25), (-1.15, -0.75)):
    sphere(0.17, tomato, loc=(p[0], p[1], 0.25))
# fruit (top right quarter is grains, bottom right protein): fruit sits by the plate
fruitp = Vector((2.25, 1.0, 0))
sphere(0.32, mat('#e23b3b', rough=0.3, rim=0.3), loc=fruitp + Vector((0, 0, 0.33)))
tube([tuple(fruitp + Vector((0, 0, 0.6))), tuple(fruitp + Vector((0.03, 0, 0.72)))], 0.02, mat('#7a4f30'))
banana = tube([tuple(fruitp + Vector((-0.4 + 0.8 * i / 10, -0.75 + 0.25 * math.sin(i / 10 * math.pi), 0.12))) for i in range(11)], 0.09, mat('#fbd24a', rough=0.5, rim=0.2), radii=[0.4 + 0.6 * math.sin(i / 10 * math.pi) for i in range(11)])
# grains (top right): rice and a slice of bread
rice = mat('#f7f2e2', rough=0.7, rim=0.15)
mound = blob((0.6, 0.45, 0.22), rice, loc=(0.78, 0.68, 0.1), lumps=0.03, lump_scale=8, subdiv=5)
grain = blob((0.04, 0.018, 0.018), rice, subdiv=1)
merge_instances(grain, [place((0.78 + 0.55 * math.cos(a) * r, 0.68 + 0.42 * math.sin(a) * r, 0.1 + 0.22 * math.sqrt(max(0, 1 - r * r))), (random.random(), random.random(), random.random())) for a, r in [(random.uniform(0, TAU), random.uniform(0, 0.95)) for _ in range(160)]], 'Rice', rice)
# protein (bottom right): boiled egg halves and beans
egg = mat('#fffaf0', rough=0.4)
yolk = mat('#fbbf24', rough=0.5)
for p in ((0.6, -0.55), (1.05, -0.4)):
    blob((0.22, 0.16, 0.08), egg, loc=(p[0], p[1], 0.14), subdiv=3)
    sphere(0.09, yolk, loc=(p[0], p[1], 0.18))
bean = mat('#a0522d', rough=0.4, rim=0.2)
for k in range(24):
    a, r = random.uniform(-1.4, -0.2), random.uniform(0.4, 1.3)
    if r * math.cos(a) < 0.25:
        continue
    blob((0.07, 0.045, 0.04), bean, loc=(r * math.cos(a), r * math.sin(a) - 0.25, 0.13), rot=(0, 0, random.random() * 3), subdiv=2)
# milk and water
glassm = mat('#dff1ff', rough=0.05, alpha=0.25, rim=0.6)
lathe([(0, 0), (0.28, 0), (0.32, 0.9), (0.3, 0.9), (0.26, 0.04), (0, 0.04)], glassm, seg=48, loc=(-2.3, 1.1, 0.03))
cyl(0.26, 0.6, mat('#f4f7ff', rough=0.4), verts=48, loc=(-2.3, 1.1, 0.35))
lathe([(0, 0), (0.28, 0), (0.32, 0.9), (0.3, 0.9), (0.26, 0.04), (0, 0.04)], glassm, seg=48, loc=(-2.25, -0.4, 0.03))
cyl(0.27, 0.65, mat('#7cc4ff', rough=0.1, alpha=0.5), verts=48, loc=(-2.25, -0.4, 0.37))

cam = camera((0.2, -5.6, 5.4), (0.0, 0.05, 0.1), lens=40)
lights((0, 0, 0.3), power=0.8)
finish('lunch-plate', 'A healthy plate', ['healthy eating', 'balanced diet', 'food groups', 'vegetables', 'fruit', 'protein', 'grains', 'nutrition', 'lunch', 'health'], [
    P('Vegetables', (-0.95, 0.6, 0.35), 'Fill half the plate with veg and fruit'),
    P('Fruit', tuple(fruitp + Vector((0, -0.2, 0.45))), 'Sweet, with vitamins and fibre'),
    P('Grains', (0.75, 0.65, 0.2), 'Rice, bread or pasta give you energy'),
    P('Protein', (0.82, -0.47, 0.2), 'Eggs, beans or meat help you grow'),
    P('Milk', (-2.3, 0.85, 0.75), 'Dairy for strong bones and teeth'),
    P('Water', (-2.25, -0.65, 0.6), 'The best drink: keep your body working'),
])
