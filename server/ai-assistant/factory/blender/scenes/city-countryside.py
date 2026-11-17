# From countryside to city (urbanisation): farms and fields on the left,
# houses of the suburbs in the middle, tall buildings, factories and busy
# roads in the city on the right. As towns grow, fields become streets.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *
import random

reset()
random.seed(11)
fieldc = ['#8bc34a', '#c5a54a', '#6fae4a', '#d9bf5a', '#4f9a45']
roadm = mat('#3a3f55', rough=0.8)
lane = mat('#fbbf24', rough=0.5, emit=0.6)
grass = mat('#4f9a45', rough=0.9)
pave = mat('#7c8296', rough=0.85)
treem = mat('#2f8a4a', rough=0.7, rim=0.15)
trunk = mat('#7a4f30', rough=0.8)
roofr = mat('#c2473a', rough=0.6, rim=0.15)
wallh = mat('#f0e2c8', rough=0.7, rim=0.1)
glassb = [mat(c, rough=0.25, metal=0.4, rim=0.3) for c in ('#5b8cff', '#22d3ee', '#a78bfa', '#7c8296')]
winm = mat('#ffe9a8', rough=0.5, emit=1.5)
fact = mat('#9aa0b5', rough=0.6, rim=0.15)
smoke = mat('#c9ccd8', alpha=0.45, rough=1.0)
W, D = 14.0, 7.0
box((W, D, 0.3), mat('#5a4636', rough=0.9), bevel=0.05, loc=(0, 0, -0.15))
# countryside: patchwork fields (x < -2)
for i in range(4):
    for j in range(4):
        x0 = -W / 2 + 0.1 + i * 1.3
        y0 = -D / 2 + 0.1 + j * 1.7
        box((1.22, 1.62, 0.05), mat(random.choice(fieldc), rough=0.9), loc=(x0 + 0.61, y0 + 0.81, 0.025))
barn = empty('Farm', loc=(-4.6, 2.2, 0.05))
box((0.9, 0.6, 0.55), mat('#b0413e', rough=0.7), loc=(0, 0, 0.27), parent=barn)
prism([(-0.5, 0), (0.5, 0), (0, 0.35)], 0.64, mat('#5a3a2e', rough=0.7), rot=(math.pi / 2, 0, 0), loc=(0, 0, 0.55), parent=barn)
cyl(0.18, 0.9, mat('#d9dde8', rough=0.4, metal=0.5), loc=(0.7, 0, 0.45), parent=barn)
for k in range(10):
    p = Vector((random.uniform(-6.8, -2.2), random.uniform(-3.3, 3.3), 0))
    tube([tuple(p), tuple(p + Vector((0, 0, 0.25)))], 0.04, trunk)
    ico(0.28, treem, 2, loc=p + Vector((0, 0, 0.45)))
# suburbs: rows of small houses with gardens (-2 < x < 2)
for i in range(4):
    for j in range(5):
        if j == 2:
            continue
        c = Vector((-1.6 + i * 1.05, -2.8 + j * 1.4, 0))
        box((0.95, 1.2, 0.04), grass, loc=c + Vector((0, 0, 0.02)))
        box((0.55, 0.5, 0.42), wallh, loc=c + Vector((0, 0.15, 0.25)))
        prism([(-0.32, 0), (0.32, 0), (0, 0.3)], 0.56, roofr, rot=(math.pi / 2, 0, 0), loc=c + Vector((0, 0.15, 0.46)))
# city: tall buildings, a factory, a park (x > 2.3)
towers = []
for i in range(4):
    for j in range(4):
        if (i, j) == (1, 2):
            continue
        c = Vector((2.9 + i * 1.05, -2.6 + j * 1.45, 0))
        h = random.uniform(1.2, 3.6) * (1.0 if i > 0 else 0.6)
        b = box((0.8, 0.9, h), random.choice(glassb), bevel=0.02, loc=c + Vector((0, 0, h / 2)))
        towers.append((b, c, h))
        for k in range(int(h / 0.35)):
            box((0.6, 0.02, 0.08), winm, loc=c + Vector((0, -0.46, 0.25 + k * 0.33)))
park = Vector((2.9 + 1.05, -2.6 + 2 * 1.45, 0))
box((0.95, 1.3, 0.05), grass, loc=park + Vector((0, 0, 0.03)))
for dx, dy in ((-0.25, -0.3), (0.25, 0.3), (0.2, -0.35)):
    ico(0.18, treem, 2, loc=park + Vector((dx, dy, 0.3)))
F = Vector((5.8, 2.6, 0))
box((1.2, 0.9, 0.7), fact, loc=F + Vector((0, 0, 0.35)))
for dx in (-0.3, 0.3):
    cyl(0.1, 1.3, fact, loc=F + Vector((dx, 0.25, 0.65)))
    for k in range(4):
        sphere(0.1 + 0.05 * k, smoke, loc=F + Vector((dx + 0.08 * k, 0.25, 1.4 + 0.22 * k)))
# roads: a main road across, and a ring of streets in the city
box((W, 0.45, 0.06), roadm, loc=(0, -0.0 + 0.1, 0.03))
for k in range(28):
    box((0.25, 0.04, 0.01), lane, loc=(-W / 2 + 0.25 + k * 0.5, 0.1, 0.065))
for x in (2.4, 6.6):
    box((0.3, D, 0.05), roadm, loc=(x, 0, 0.025))
cars = mat('#fb7185', rough=0.4, rim=0.2)
for x in (3.2, 4.4, 5.3, 6.1, 0.6, -0.8):
    box((0.3, 0.16, 0.12), random.choice([cars, mat('#fbbf24', rough=0.4), mat('#5b8cff', rough=0.4)]), bevel=0.03, loc=(x, 0.0 + random.choice((-0.05, 0.25)), 0.12))

cam = camera((0.0, -16.6, 11.4), (0.0, 0.1, 0.4), lens=40)
lights((0, 0, 0.5), power=0.6)
tallest = max(towers, key=lambda t: t[2])
finish('city-countryside', 'From countryside to city', ['urbanisation', 'city', 'countryside', 'rural', 'urban', 'suburbs', 'settlements', 'land use', 'geography', 'society'], [
    P('Farmland', (-5.4, -1.8, 0.05), 'Fields grow food; few people live here'),
    P('Farm', (-4.6, 2.2, 0.6), 'A farmhouse, barn and grain store'),
    P('Suburbs', (-0.55, -2.8, 0.55), 'Houses with gardens at the edge of town'),
    P('City centre', tuple(tallest[1] + Vector((0, -0.45, tallest[2] * 0.7))), 'Tall buildings packed close: offices and flats'),
    P('Factory', F + Vector((0, -0.45, 0.4)), 'Jobs draw people from the countryside'),
    P('Park', park + Vector((0, 0, 0.3)), 'Green space for people in the city'),
    P('Main road', (-3.0, 0.1, 0.06), 'Roads link the country to the town'),
])
