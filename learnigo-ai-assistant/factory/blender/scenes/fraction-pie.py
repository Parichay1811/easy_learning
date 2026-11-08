# Fractions with a pie cut into 8 equal slices: 3 slices pulled out are
# three eighths (3/8); the 5 left are five eighths (5/8). Together: 8/8 = 1.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
crust = mat('#e0a35a', rough=0.6, rim=0.2)
taken = mat('#ff9f43', rough=0.45, rim=0.35)
left = mat('#5b8cff', rough=0.45, rim=0.35)
plate = mat('#e9eeff', rough=0.3, rim=0.2)
R, H, N = 1.9, 0.38, 8
floor(4.5, 0, opacity=0.5)
lathe([(0, 0.02), (2.5, 0.02), (2.7, 0.14), (2.6, 0.16), (2.3, 0.06), (0, 0.06)], plate, seg=96)
slices = []
for k in range(N):
    a0 = TAU * k / N + math.radians(100)
    out = k < 3
    gap = 0.55 if out else 0.04
    mid = a0 + TAU / N / 2
    off = Vector((math.cos(mid), math.sin(mid), 0)) * gap
    pts = [(0, 0)] + [(R * math.cos(a0 + TAU / N * i / 12), R * math.sin(a0 + TAU / N * i / 12)) for i in range(13)]
    sl = prism(pts, H, taken if out else left, loc=(off.x, off.y, 0.08 + H / 2 + (0.05 if out else 0)), smooth=False)
    bevel(sl, 0.03, 2)
    rim = tube([(off.x + (R - 0.05) * math.cos(a0 + TAU / N * i / 12), off.y + (R - 0.05) * math.sin(a0 + TAU / N * i / 12), 0.08 + H + (0.05 if out else 0)) for i in range(13)], 0.07, crust)
    slices.append((sl, mid, off, out))

cam = camera((0.0, -7.4, 5.4), (0.0, -0.2, 0.2), lens=44)
lights((0, 0, 0.3), rim='#ff9f43')
sl0 = slices[1]
sl5 = slices[6]
finish('fraction-pie', 'Fractions of a pie', ['fractions', 'eighths', 'numerator', 'denominator', 'equal parts', 'part of a whole', 'pie chart', 'maths'], [
    P('Whole pie', tuple(Vector((math.cos(slices[5][1]), math.sin(slices[5][1]), 0)) * (R - 0.05) + slices[5][2] + Vector((0, 0, 0.08 + H + 0.05))), '8 equal slices make one whole pie: 8/8 = 1'),
    P('One slice', tuple(Vector((math.cos(slices[2][1]), math.sin(slices[2][1]), 0)) * (R * 0.6) + slices[2][2] + Vector((0, 0, 0.55))), 'One of 8 equal parts: 1/8'),
    P('Three eighths', tuple(Vector((math.cos(sl0[1]), math.sin(sl0[1]), 0)) * (R * 0.55) + sl0[2] + Vector((0, 0, 0.55))), '3 slices taken out of 8: 3/8'),
    P('Five eighths', tuple(Vector((math.cos(sl5[1]), math.sin(sl5[1]), 0)) * (R * 0.5) + sl5[2] + Vector((0, 0, 0.5))), '5 slices are left: 5/8'),
    P('Equal parts', tuple(Vector((math.cos(slices[4][1] + TAU / 16), math.sin(slices[4][1] + TAU / 16), 0)) * (R * 0.7) + Vector((0, 0, 0.5))), 'Every slice must be the same size'),
])
