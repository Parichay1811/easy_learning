# A suspension bridge. The deck hangs from vertical hangers; the hangers
# hang from two main cables, which sag in a curve (close to a parabola under
# an even load) and are in tension. The cables pass over the tall towers,
# which are in compression, and are tied down into massive anchorages at
# each end. A stiffening truss under the deck keeps it from twisting.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
towerm = mat('#e5484d', rough=0.45, metal=0.3, rim=0.25)
cablem = mat('#e9eeff', rough=0.3, metal=0.8, rim=0.3)
hangm = mat('#c9d2e8', rough=0.3, metal=0.8)
deckm = mat('#4a5070', rough=0.6, rim=0.1)
trussm = mat('#c94148', rough=0.45, metal=0.3)
conc = mat('#b9bdc6', rough=0.75, rim=0.15)
waterm = mat('#2f7fe0', rough=0.4, rim=0.15)
landm = mat('#4c8a4a', rough=0.9, rim=0.05)
rockm = mat('#8a7d70', rough=0.9)
roadm = mat('#2b2d33', rough=0.6)
XT, XA = 4.0, 8.4               # towers, anchorages
ZD, ZT, ZS = 1.2, 6.2, 1.75      # deck level, tower top (cable saddle), lowest cable point
Y = 0.75                         # cable planes at y = +-Y


def cable_z(x):
    if abs(x) <= XT:                         # main span: parabola
        return ZS + (ZT - ZS) * (x / XT) ** 2
    u = (abs(x) - XT) / (XA - 0.6 - XT)      # side span: gentle curve down to the anchorage
    return ZT + (2.0 - ZT) * u - 0.35 * math.sin(math.pi * u)


water = box((26, 12, 0.3), waterm, loc=(0, 0, -0.15))
for s in (-1, 1):
    # banks and anchorages
    box((5.0, 8.0, 1.6), landm, loc=(s * (XA + 1.6), 0, 0.35))
    box((5.0, 8.0, 0.8), rockm, loc=(s * (XA + 1.6), 0, -0.6))
    box((1.6, 2.4, 2.1), conc, bevel=0.06, loc=(s * XA, 0, 2.05))
    # towers: two legs, cross beams, on a pier in the river
    box((1.0, 2.4, 1.4), conc, bevel=0.05, loc=(s * XT, 0, 0.0))
    for y in (-Y, Y):
        box((0.32, 0.32, ZT - 0.6), towerm, bevel=0.03, loc=(s * XT, y, 0.6 + (ZT - 0.6) / 2))
        cyl(0.2, 0.25, towerm, verts=24, loc=(s * XT, y, ZT + 0.05), rot=(0, math.pi / 2, 0))
    for z in (ZD - 0.35, 3.9, ZT - 0.35):
        box((0.28, 2 * Y, 0.3), towerm, bevel=0.02, loc=(s * XT, 0, z))
# deck with a road and a stiffening truss beneath
L = 2 * (XA - 0.8)
box((L, 2 * Y + 0.4, 0.1), deckm, loc=(0, 0, ZD))
box((L, 2 * Y - 0.1, 0.012), roadm, loc=(0, 0, ZD + 0.056))
for y in (-Y, Y):
    tube([(-L / 2, y, ZD - 0.05), (L / 2, y, ZD - 0.05)], 0.035, trussm)
    tube([(-L / 2, y, ZD - 0.45), (L / 2, y, ZD - 0.45)], 0.035, trussm)
    n = 44
    for k in range(n):
        x0 = -L / 2 + L * k / n; x1 = -L / 2 + L * (k + 1) / n
        a, b = (ZD - 0.05, ZD - 0.45) if k % 2 == 0 else (ZD - 0.45, ZD - 0.05)
        tube([(x0, y, a), (x1, y, b)], 0.02, trussm)
# main cables and hangers
for y in (-Y, Y):
    pts = [(x, y, cable_z(x)) for x in [-(XA - 0.6) + 2 * (XA - 0.6) * i / 240 for i in range(241)]]
    tube(pts, 0.06, cablem, kind='POLY')
    x = -XT + 0.36
    while x < XT - 0.2:
        tube([(x, y, cable_z(x)), (x, y, ZD + 0.05)], 0.012, hangm)
        x += 0.36
    for s in (-1, 1):
        x = s * (XT + 0.36)
        while abs(x) < XA - 1.3:
            tube([(x, y, cable_z(x)), (x, y, ZD + 0.05)], 0.012, hangm)
            x += s * 0.36
floor(14.0, -0.31)

cam = camera((-1.6, -18.6, 6.4), (0.0, 0, 2.4), lens=34)
lights((0, 0, 2.5), rim='#5b8cff')
sun((-0.3, 0.5, -1), 1.0, '#fff1dc')
finish('suspension-bridge', 'A suspension bridge', ['suspension bridge', 'bridge', 'main cable', 'hangers', 'suspenders', 'towers', 'anchorage', 'cable', 'tension', 'compression', 'golden gate', 'long-span bridge', 'structural engineering', 'bridge engineering', 'civil engineering'], [
    P('Tower', (-XT, -Y - 0.16, 4.6), 'Tall towers carry the cable loads down in compression'),
    P('Main cable', (-XT * 0.55, -Y, cable_z(-XT * 0.55)), 'Steel wire cables in tension, sagging in a curve'),
    P('Hangers', (XT * 0.5, -Y, (cable_z(XT * 0.5) + ZD) / 2), 'Vertical cables that hold up the deck'),
    P('Deck', (0.8, -Y - 0.2, ZD), 'The roadway, with a stiffening truss beneath'),
    P('Anchorage', (-XA, -1.2, 2.3), 'A massive block that ties the cable ends down'),
    P('Tower pier', (XT, -1.2, 0.3), 'The foundation in the river bed'),
])
