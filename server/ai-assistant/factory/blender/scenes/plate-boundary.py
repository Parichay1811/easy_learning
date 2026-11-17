# Where two tectonic plates meet: the heavier ocean plate slides under the
# continent (subduction), making a deep trench at sea and mountains and
# volcanoes on land. A block cut through the crust and upper mantle.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
mantle = mat('#d9542f', rough=0.8, rim=0.1)
oce = mat('#4a4f63', rough=0.7, rim=0.15)
cont = bandmat(['#a8876a', '#8f7258', '#b89a7c'], scale=0.7, axis='Y', name='Continent')
water = mat('#2f86e0', rough=0.35, alpha=0.55, rim=0.2)
snow = mat('#f0f4ff', rough=0.5)
green = mat('#3b8f4a', rough=0.8, rim=0.1)
magma = flowmat('#ff3d00', '#ffc04d', scale=2, strength=4, distort=4, name='Magma')
arrow = glowmat('#fbbf24', 3)
D = 3.0


def slab(outline, m, y=0.0, depth=D):
    return prism(outline, depth, m, rot=(math.pi / 2, 0, 0), loc=(0, y, 0))


mant = box((10, D, 2.8), mantle, loc=(0, 0, -1.95))
# ocean plate: flat, then bending down under the continent
top = [(-5, 0.0), (-0.5, 0.0), (0.0, -0.02), (0.5, -0.12), (1.1, -0.45), (1.8, -1.05), (2.5, -1.8), (3.2, -2.65), (3.75, -3.3)]
bot = []
for i in range(len(top) - 1, -1, -1):   # offset each point 0.55 straight down from the slab's surface
    a, b = Vector(top[max(0, i - 1)]), Vector(top[min(len(top) - 1, i + 1)])
    d = (b - a).normalized()
    n = Vector((d.y, -d.x))
    bot.append((top[i][0] + 0.55 * n.x, top[i][1] + 0.55 * n.y))
ocean_plate = slab(top + bot, oce)
# continent: thick and light, with mountains on top
cprof = [(5, 0.25), (3.6, 0.35), (3.0, 0.75), (2.6, 1.15), (2.25, 0.85), (1.9, 1.35), (1.55, 0.9), (1.2, 0.55), (0.75, 0.15), (0.45, -0.25),
         (0.9, -0.55), (1.4, -0.85), (2.3, -1.45), (3.2, -2.15), (5, -2.4)]
continent = slab(cprof, cont)
cut(continent, slab(top + bot, cont, depth=D + 0.2))
cut(mant, slab(top + bot, mantle, depth=D + 0.2))
cut(mant, slab(cprof, mantle, depth=D + 0.2))
grass_top = slab([(5, 0.25), (3.6, 0.35), (3.5, 0.42), (5, 0.32)], green)
# sea above the ocean plate, deepest over the trench
sea = slab([(-5, 0.0), (-5, 0.55), (0.75, 0.55), (0.75, 0.15), (0.6, -0.17), (0.5, -0.12), (0.0, -0.02), (-0.5, 0.0)], water)
# magma rising from the sinking plate to a volcano on the continent
vol = cone(0.55, 0.7, cont, verts=40, loc=(2.25, 0, 1.0))
vol.scale = (1, 2.2, 1)
rise = tube([(2.75, -D / 2 - 0.01, -1.95), (2.4, -D / 2 - 0.01, -0.3), (2.25, -D / 2 - 0.01, 0.6), (2.25, -D / 2 - 0.01, 1.3)], 0.07, magma, kind='BEZIER')
# arrows: the plates move towards each other
for x0, x1, z in ((-3.6, -2.2, 0.75), (4.3, 3.1, 0.75)):
    tube([(x0, -D / 2 - 0.1, z), (x1, -D / 2 - 0.1, z)], 0.06, arrow)
    c = cone(0.16, 0.36, arrow, verts=24, loc=(x1, -D / 2 - 0.1, z), rot=(0, math.pi / 2 if x1 > x0 else -math.pi / 2, 0))

cam = camera((1.0, -12.6, 3.9), (0.35, 0, -0.95), lens=40)
lights((0, 0, 0), rim='#5b8cff')
F = -D / 2
finish('plate-boundary', 'Plates meeting: subduction', ['plate tectonics', 'plate boundary', 'subduction', 'convergent boundary', 'trench', 'earthquakes', 'mountains', 'volcanoes', 'geography'], [
    P('Ocean plate', (-2.8, F, -0.28), 'Thin, heavy crust under the sea'),
    P('Continental plate', (3.8, F, -0.9), 'Thick, lighter crust that makes the land'),
    P('Trench', (0.45, F, 0.1), 'A deep valley in the sea floor where the plate dives'),
    P('Subduction', (2.35, F, -1.95), 'The ocean plate sinks into the mantle and melts'),
    P('Volcano', (2.25, F + 0.6, 1.3), 'Melted rock rises up to make volcanoes'),
    P('Mountains', (1.6, F + 0.4, 0.95), 'The crust crumples up as the plates push'),
    P('Mantle', (-2.5, F, -2.4), 'Hot, slowly flowing rock that carries the plates'),
])
