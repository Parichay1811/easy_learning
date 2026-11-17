# A calm bedroom at bedtime, for talking through a routine: bath and teeth
# done, pyjamas on, toys put away, a story by the lamp, the clock says it is
# time to sleep, and the curtains open on a quiet night.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
wallm = mat('#3d4a7a', rough=0.8, rim=0.05)
floorm = brickmat('#a8784a', '#9a6c40', '#7d5634', scale=1.2, name='Boards', w=2.4, h=0.2)
woodm = mat('#c08a55', rough=0.55, rim=0.2)
sheet = mat('#9fb8ff', rough=0.7, rim=0.2)
blanket = mat('#a78bfa', rough=0.75, rim=0.2)
pillow = mat('#f4f7ff', rough=0.7, rim=0.2)
rug = mat('#2dd4bf', rough=0.9)
lampm = mat('#ffd38a', rough=0.5, emit=3.5)
night = mat('#0b1235', rough=0.5, emit=0.2)
moonm = glowmat('#fff3c4', 3)
starm = glowmat('#ffffff', 4)
curtain = mat('#fb7185', rough=0.8, rim=0.15)
books = ['#fb7185', '#fbbf24', '#34d399', '#5b8cff', '#a78bfa']
toyb = mat('#ff9f43', rough=0.5, rim=0.2)
# the corner of a room: floor and two walls
box((6.0, 5.0, 0.12), floorm, loc=(0, 0, -0.06))
box((6.0, 0.15, 3.4), wallm, loc=(0, 2.5, 1.7))
box((0.15, 5.0, 3.4), wallm, loc=(-3.0, 0, 1.7))
cyl(1.0, 0.02, rug, verts=64, loc=(0.6, -0.6, 0.01)).scale = (1.35, 0.9, 1)
# bed against the back wall
bed = empty('Bed', loc=(-1.2, 1.3, 0))
box((1.6, 2.3, 0.35), woodm, bevel=0.05, loc=(0, 0, 0.3), parent=bed)
box((1.55, 2.25, 0.2), sheet, bevel=0.08, loc=(0, 0, 0.55), parent=bed)
box((1.62, 1.5, 0.12), blanket, bevel=0.06, loc=(0, -0.38, 0.68), parent=bed)
box((1.7, 0.12, 1.1), woodm, bevel=0.05, loc=(0, 1.15, 0.55), parent=bed)
blob((0.55, 0.3, 0.12), pillow, loc=(0, 0.75, 0.75), subdiv=3, parent=bed)
# bedside table, lamp, clock and a story book
tb = Vector((0.2, 2.0, 0))
box((0.6, 0.5, 0.6), woodm, bevel=0.03, loc=tb + Vector((0, 0, 0.3)))
cyl(0.12, 0.04, woodm, loc=tb + Vector((-0.1, 0, 0.62)))
tube([tuple(tb + Vector((-0.1, 0, 0.62))), tuple(tb + Vector((-0.1, 0, 0.95)))], 0.02, woodm)
shade = cyl(0.2, 0.22, lampm, verts=32, r2=0.12, loc=tb + Vector((-0.1, 0, 1.02)))
point(tb + Vector((-0.1, 0, 0.98)), 40, '#ffd38a', 0.15)
no_shadow(shade)
clk = empty('Clock', loc=tb + Vector((0.15, -0.05, 0.72)), rot=(math.pi / 2, 0, 0))
cyl(0.12, 0.06, mat('#5b8cff', rough=0.4), verts=32, parent=clk)
cyl(0.1, 0.07, mat('#f4f7ff', rough=0.5), verts=32, parent=clk)
for deg, L in ((240, 0.06), (0, 0.085)):   # eight o'clock: hour hand on 8, minute hand on 12
    a = math.radians(deg)
    box((0.012, L, 0.01), mat('#1a2240'), loc=(math.sin(a) * L / 2, math.cos(a) * L / 2, 0.04), rot=(0, 0, -a), parent=clk)
box((0.3, 0.22, 0.04), mat('#fbbf24', rough=0.5), loc=(-1.2, 0.35, 0.78), rot=(0, 0, 0.3))   # story book on the bed
# window with the night outside and curtains open
win = Vector((1.4, 2.42, 1.9))
box((1.3, 0.05, 1.1), night, loc=win)
moon = sphere(0.14, moonm, loc=win + Vector((0.3, -0.04, 0.2)))
for k in range(9):
    sphere(0.018, starm, loc=win + Vector((-0.55 + 0.12 * k, -0.04, -0.35 + 0.31 * ((k * 7) % 5) / 4)))
box((1.36, 0.08, 0.06), woodm, loc=win + Vector((0, -0.03, 0.57)))
box((1.36, 0.08, 0.06), woodm, loc=win + Vector((0, -0.03, -0.57)))
for s in (-1, 1):
    box((0.28, 0.06, 1.35), curtain, bevel=0.05, loc=win + Vector((s * 0.78, -0.08, -0.05)))
# shelf of books and a toy box with the toys put away
shelf = Vector((-2.85, -0.6, 1.4))
box((0.3, 1.4, 0.05), woodm, loc=shelf)
for k, c in enumerate(books):
    box((0.22, 0.12, 0.35 + 0.04 * (k % 2)), mat(c, rough=0.5), loc=shelf + Vector((0, -0.5 + k * 0.17, 0.2)))
tbx = Vector((1.9, 0.3, 0))
box((0.9, 0.6, 0.5), toyb, bevel=0.04, loc=tbx + Vector((0, 0, 0.25)))
sphere(0.13, mat('#5b8cff', rough=0.4), loc=tbx + Vector((-0.2, 0, 0.55)))
box((0.18, 0.18, 0.18), mat('#34d399', rough=0.4), loc=tbx + Vector((0.18, 0.05, 0.56)), rot=(0, 0, 0.4))
for s in (-1, 1):   # slippers by the bed
    blob((0.12, 0.25, 0.06), mat('#fbbf24', rough=0.7), loc=(-0.2 + s * 0.16, -0.25, 0.06), subdiv=3)

cam = camera((3.6, -5.8, 3.6), (-0.3, 0.6, 0.8), lens=36)
lights((0, 0, 1.0), power=0.4, key='#ffe2b8')
finish('bedroom', 'A calm bedroom at bedtime', ['bedroom', 'bedtime', 'routine', 'sleep', 'calm', 'daily routine', 'home', 'self care', 'feelings'], [
    P('Bed', (-1.2, 0.6, 0.8), 'Snug and ready: sleep helps your body grow'),
    P('Lamp', tuple(tb + Vector((-0.1, 0, 1.05))), 'Soft light for a bedtime story'),
    P('Clock', tuple(tb + Vector((0.15, -0.1, 0.72))), 'It is bedtime: about eight o\'clock'),
    P('Story book', (-1.2, 0.35, 0.8), 'Reading together helps you wind down'),
    P('Window', tuple(win + Vector((-0.2, -0.05, -0.1))), 'Dark outside: the Moon is up'),
    P('Toy box', tuple(tbx + Vector((0, -0.31, 0.25))), 'Toys tidied away for tomorrow'),
    P('Slippers', (-0.2, -0.3, 0.1), 'Ready by the bed for the morning'),
])
