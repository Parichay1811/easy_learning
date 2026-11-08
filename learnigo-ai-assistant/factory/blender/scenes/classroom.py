# A classroom: the board at the front, the teacher's desk, rows of pupils'
# desks and chairs, a reading corner with books, a globe, a window and the
# clock. Good for talking about school, rules and what happens in a day.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
wallm = mat('#33406e', rough=0.85, rim=0.05)
floorm = brickmat('#9a7a5a', '#8c6e50', '#6e5640', scale=1.0, name='Floor', w=1.0, h=1.0)
desk = mat('#d9a066', rough=0.5, rim=0.2)
legm = mat('#5b6380', rough=0.4, metal=0.6)
chairm = [mat(c, rough=0.45, rim=0.2) for c in ('#5b8cff', '#34d399', '#fb7185', '#fbbf24')]
boardm = mat('#1f4a3a', rough=0.7)
chalk = glowmat('#e9eeff', 1.5)
frame = mat('#a8784a', rough=0.5)
W, D = 8.0, 6.4
box((W, D, 0.1), floorm, loc=(0, 0, -0.05))
box((W, 0.15, 3.2), wallm, loc=(0, D / 2, 1.6))
box((0.15, D, 3.2), wallm, loc=(-W / 2, 0, 1.6))
# board with a little sum and a sun drawn in chalk
B = Vector((0.6, D / 2 - 0.1, 1.75))
box((3.4, 0.06, 1.4), boardm, loc=B)
box((3.6, 0.1, 0.1), frame, loc=B + Vector((0, -0.02, -0.75)))
text('2 + 3 = 5', 0.32, chalk, loc=B + Vector((-0.7, -0.05, 0.25)), rot=(math.pi / 2, 0, 0), extrude=0.005)
tube([tuple(B + Vector((0.95 + 0.22 * math.cos(TAU * i / 48), -0.05, 0.3 + 0.22 * math.sin(TAU * i / 48)))) for i in range(48)], 0.012, chalk, closed=True)
for k in range(8):
    a = TAU * k / 8
    tube([tuple(B + Vector((0.95 + 0.28 * math.cos(a), -0.05, 0.3 + 0.28 * math.sin(a)))), tuple(B + Vector((0.95 + 0.4 * math.cos(a), -0.05, 0.3 + 0.4 * math.sin(a))))], 0.012, chalk)
# teacher's desk
T = Vector((-1.9, 1.9, 0))
box((1.6, 0.8, 0.08), desk, loc=T + Vector((0, 0, 0.78)))
box((1.5, 0.05, 0.7), desk, loc=T + Vector((0, -0.37, 0.4)))
for sx in (-1, 1):
    box((0.06, 0.75, 0.75), desk, loc=T + Vector((sx * 0.75, 0, 0.38)))
box((0.4, 0.3, 0.06), mat('#fb7185', rough=0.5), loc=T + Vector((-0.3, 0, 0.85)))
sphere(0.08, mat('#e23b3b', rough=0.3), loc=T + Vector((0.4, 0.1, 0.9)))
# pupils' desks and chairs in rows
desks = []
for i in range(3):
    for j in range(2):
        c = Vector((-1.4 + i * 1.6, -0.2 - j * 1.5, 0))
        box((1.1, 0.6, 0.06), desk, loc=c + Vector((0, 0, 0.7)))
        for sx in (-1, 1):
            for sy in (-1, 1):
                tube([tuple(c + Vector((sx * 0.48, sy * 0.24, 0.0))), tuple(c + Vector((sx * 0.48, sy * 0.24, 0.68)))], 0.025, legm)
        ch = chairm[(i + j) % 4]
        cc = c + Vector((0, -0.55, 0))
        box((0.45, 0.42, 0.05), ch, bevel=0.02, loc=cc + Vector((0, 0, 0.42)))
        box((0.45, 0.05, 0.45), ch, bevel=0.02, loc=cc + Vector((0, -0.2, 0.68)))
        for sx in (-1, 1):
            for sy in (-1, 1):
                tube([tuple(cc + Vector((sx * 0.19, sy * 0.18, 0))), tuple(cc + Vector((sx * 0.19, sy * 0.18, 0.4)))], 0.02, legm)
        box((0.3, 0.22, 0.03), mat('#f4efe2', rough=0.6), loc=c + Vector((0.1, 0, 0.75)), rot=(0, 0, 0.2))
        desks.append(c)
# reading corner: shelf of books and a globe
S = Vector((-3.75, -1.2, 0))
box((0.4, 1.6, 1.2), desk, loc=S + Vector((0, 0, 0.6)))
for r in range(2):
    for k in range(7):
        box((0.25, 0.12, 0.32), mat(('#fb7185', '#fbbf24', '#34d399', '#5b8cff', '#a78bfa')[(k + r) % 5], rough=0.5), loc=S + Vector((0.08, -0.6 + k * 0.18, 0.35 + r * 0.5)))
sphere(0.22, earthmat(scale=1.6, rim=0.2), loc=S + Vector((0, 0.4, 1.45)))
cyl(0.05, 0.25, frame, loc=S + Vector((0, 0.4, 1.25)))
# window and clock
Wn = Vector((-W / 2 + 0.09, 1.2, 1.9))
box((0.04, 1.2, 1.0), mat('#9fd8ff', rough=0.2, emit=1.2), loc=Wn)
box((0.06, 0.05, 1.0), frame, loc=Wn)
box((0.06, 1.2, 0.05), frame, loc=Wn)
clk = empty('Clock', loc=(2.9, D / 2 - 0.1, 2.75), rot=(math.pi / 2, 0, 0))
cyl(0.25, 0.06, mat('#f4f7ff', rough=0.4), verts=32, parent=clk)
torus(0.25, 0.03, mat('#5b8cff', rough=0.4), seg=32, ring=8, parent=clk)
for deg, L in ((270, 0.13), (0, 0.19)):
    a = math.radians(deg)
    box((0.02, L, 0.01), mat('#1a2240'), loc=(math.sin(a) * L / 2, math.cos(a) * L / 2, 0.04), rot=(0, 0, -a), parent=clk)

cam = camera((4.8, -7.6, 5.0), (-0.3, 0.5, 0.9), lens=34)
lights((0, 0, 1.2), power=0.55)
finish('classroom', 'A classroom', ['classroom', 'school', 'teacher', 'desks', 'learning', 'school day', 'rules', 'routine'], [
    P('Board', tuple(B + Vector((-0.3, -0.06, 0.25))), 'The teacher writes and draws here'),
    P("Teacher's desk", tuple(T + Vector((0, -0.4, 0.82))), 'Where the teacher keeps the register'),
    P('Desk and chair', tuple(desks[1] + Vector((0, -0.3, 0.73))), 'Your place to sit, listen and work'),
    P('Books', tuple(S + Vector((0.2, -0.3, 0.9))), 'A reading corner full of stories'),
    P('Globe', tuple(S + Vector((0, 0.4, 1.45))), 'A model of the Earth'),
    P('Window', tuple(Wn + Vector((0.05, 0, 0))), 'Daylight and fresh air'),
    P('Clock', (2.9, D / 2 - 0.15, 2.75), 'Shows when it is time for break'),
])
