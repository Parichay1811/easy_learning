# A through-hole printed circuit board (PCB): a fibreglass board with copper
# traces in place of wires. Component leads pass through plated holes and are
# soldered to copper pads. Shown: resistors (with colour bands), an
# electrolytic and a ceramic capacitor, a diode, an LED, a 14-pin DIP chip
# and a pin header for the connections.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
boardm = mat('#1f7a4a', rough=0.45, coat=0.25, rim=0.15)
edgem = mat('#d8cf9a', rough=0.7)
copper = mat('#e0a155', rough=0.3, metal=0.9, rim=0.15)
solder = mat('#dfe3ea', rough=0.2, metal=0.95)
silk = mat('#f2f4f8', rough=0.6)
black = mat('#1d1f26', rough=0.45, rim=0.15)
lead = mat('#c9ced8', rough=0.25, metal=0.95)
resm = mat('#d9c39a', rough=0.5, rim=0.15)
capm = mat('#2f4fa8', rough=0.35, rim=0.2)
capstripe = mat('#c9d3ea', rough=0.4)
capTop = mat('#b9c0cc', rough=0.3, metal=0.8)
ceram = mat('#d8892f', rough=0.5, rim=0.2)
ledm = mat('#ff3b3b', rough=0.05, alpha=0.75, emit=2.5)
gold = mat('#e8c35a', rough=0.25, metal=0.95)
diodem = mat('#22252e', rough=0.4, rim=0.15)
band_col = {'brown': '#7a4a24', 'black': '#141414', 'red': '#d22b2b', 'orange': '#ef7d1a', 'yellow': '#f2cc1f',
            'violet': '#7a3fbf', 'gold': '#d4af37', 'blue': '#2457d6', 'grey': '#8a8f99'}

T = 0.12   # board thickness; top surface at z = 0
box((6.4, 4.6, T), boardm, bevel=0.03, loc=(0, 0, -T / 2))
pads = []


def pad(x, y, r=0.085):
    cyl(r, 0.016, solder, verts=24, loc=(x, y, 0.008))
    pads.append((x, y))


def trace(pts, w=0.075):
    for a, b in zip(pts, pts[1:]):
        a, b = Vector((a[0], a[1], 0.006)), Vector((b[0], b[1], 0.006))
        d = b - a
        box((d.length, w, 0.012), copper, loc=tuple((a + b) / 2), rot=(0, 0, math.atan2(d.y, d.x)))
    for p in pts:
        cyl(w / 2, 0.012, copper, verts=16, loc=(p[0], p[1], 0.006))


def axial(x, y, length, body_r, bodym, span, bands=None, band_m=None):
    """An axial part along x (resistor, diode): body, bands and bent leads."""
    g = empty('Axial', loc=(x, y, 0))
    h = body_r + 0.06
    prof = [(0.0, -length / 2), (body_r * 0.8, -length / 2), (body_r, -length / 2 + 0.08), (body_r * 0.9, -length / 4), (body_r * 0.9, length / 4), (body_r, length / 2 - 0.08), (body_r * 0.8, length / 2), (0.0, length / 2)]
    lathe(prof, bodym, seg=32, loc=(0, 0, h), rot=(0, math.pi / 2, 0), parent=g)
    for k, b in enumerate(bands or []):
        bx = -length / 2 + 0.14 + k * 0.12 if k < len(bands) - 1 else length / 2 - 0.14
        rr = body_r * (1.0 if abs(bx) > length / 4 else 0.9) + 0.004
        cyl(rr, 0.06, band_m[k] if band_m else mat(band_col[b], rough=0.45), verts=32, loc=(bx, 0, h), rot=(0, math.pi / 2, 0), parent=g)
    for s in (-1, 1):
        tube([(s * length / 2, 0, h), (s * span / 2 - s * 0.06, 0, h), (s * span / 2, 0, h - 0.06), (s * span / 2, 0, -0.02)], 0.018, lead, parent=g)
        pad(x + s * span / 2, y)
    return g


# the chip: DIP-14 with a notch and pin-1 dot
cx, cy = 0.2, 0.35
chip = box((1.9, 0.66, 0.24), black, bevel=0.02, loc=(cx, cy, 0.2))
cut(chip, cyl(0.09, 0.4, black, verts=24, loc=(cx - 0.95, cy, 0.32)))
cyl(0.045, 0.01, silk, verts=16, loc=(cx - 0.72, cy - 0.18, 0.325))
for k in range(7):
    px = cx - 0.762 + 0.254 * k
    for s in (-1, 1):
        tube([(px, cy + s * 0.33, 0.2), (px, cy + s * 0.4, 0.2), (px, cy + s * 0.4, -0.02)], 0.022, lead)
        pad(px, cy + s * 0.4, 0.07)
# resistors: 4.7 kΩ (yellow violet red gold) and 330 Ω (orange orange brown gold)
r1 = axial(-2.0, 1.25, 0.8, 0.13, resm, 1.3, ['yellow', 'violet', 'red', 'gold'])
r2 = axial(-2.0, 0.45, 0.8, 0.13, resm, 1.3, ['orange', 'orange', 'brown', 'gold'])
r3 = axial(1.9, -1.3, 0.8, 0.13, resm, 1.3, ['brown', 'black', 'orange', 'gold'])
# a diode: black body, grey band at the cathode
d1 = axial(-0.4, -1.45, 0.6, 0.1, diodem, 1.1, ['grey'], [mat('#c9ced8', rough=0.4)])
# electrolytic capacitor (standing), stripe marks the negative lead
ex, ey = 2.15, 1.15
cap = cyl(0.36, 0.9, capm, verts=48, loc=(ex, ey, 0.5))
stripe = cyl(0.366, 0.88, capstripe, verts=48, loc=(ex, ey, 0.5))
cut(stripe, box((0.2, 0.9, 1.0), capstripe, loc=(ex - 0.36, ey - 0.1, 0.5)), op='INTERSECT')
cyl(0.34, 0.02, capTop, verts=48, loc=(ex, ey, 0.955))
for a in (0, math.pi / 2):
    box((0.5, 0.02, 0.01), black, loc=(ex, ey, 0.968), rot=(0, 0, a + math.pi / 4))
for s in (-1, 1):
    tube([(ex + s * 0.12, ey, 0.06), (ex + s * 0.12, ey, -0.02)], 0.02, lead)
    pad(ex + s * 0.12, ey)
# ceramic disc capacitor
qx, qy = -2.0, -0.55
blob((0.24, 0.07, 0.24), ceram, subdiv=4, loc=(qx, qy, 0.48))
for s in (-1, 1):
    tube([(qx + s * 0.08, qy, 0.4), (qx + s * 0.12, qy, 0.25), (qx + s * 0.12, qy, -0.02)], 0.016, lead, kind='BEZIER')
    pad(qx + s * 0.12, qy)
# LED: red dome with a flange, two legs
lx, ly = 2.1, -0.15
lathe([(0.0, 0.0), (0.14, 0.0), (0.14, 0.04), (0.12, 0.05), (0.12, 0.3), (0.1, 0.38), (0.06, 0.42), (0.0, 0.43)], ledm, seg=48, loc=(lx, ly, 0.22))
point((lx, ly, 0.5), 8, '#ff4040', 0.05)
for s in (-1, 1):
    tube([(lx + s * 0.05, ly, 0.24), (lx + s * 0.05, ly, -0.02)], 0.016, lead)
    pad(lx + s * 0.05, ly)
# pin header
hx, hy = -2.25, -1.75
box((1.0, 0.25, 0.25), black, bevel=0.01, loc=(hx + 0.375, hy, 0.13))
for k in range(4):
    box((0.06, 0.06, 0.62), gold, loc=(hx + 0.25 * k, hy, 0.27))
    pad(hx + 0.25 * k, hy)
# copper traces joining the parts
CP = lambda k, s: (cx - 0.762 + 0.254 * k, cy + s * 0.4)
trace([(-1.35, 1.25), (-0.6, 1.25), (-0.6, 1.1), CP(0, 1)])
trace([(-1.35, 0.45), (-0.85, 0.45), CP(0, -1)])
trace([(-2.65, 1.25), (-2.85, 1.25), (-2.85, -1.2), (-2.25, -1.75)])
trace([(-2.65, 0.45), (-2.65, -0.2), (-2.12, -0.55)])
trace([(-1.88, -0.55), (-1.5, -0.55), (-1.5, -1.0), (-1.0, -1.45), (-0.95, -1.45)])
trace([(0.15, -1.45), (0.9, -1.45), (1.25, -1.3)])
trace([(2.55, -1.3), (2.6, -1.3), (2.6, -0.5), (2.15, -0.15)])
trace([(2.05, -0.15), (1.7, -0.15), CP(6, -1)])
trace([CP(6, 1), (1.3, 1.15), (2.03, 1.15)])
trace([(2.27, 1.15), (2.75, 1.15), (2.75, 1.85), (-2.5, 1.85), (-2.5, 1.25), (-2.65, 1.25)])
trace([(-2.0, -1.75), (-1.2, -1.75), (-1.2, -0.3), CP(3, -1)])
trace([(-1.75, -1.75), (-1.75, -2.0), (1.0, -2.0), (1.0, CP(4, -1)[1] - 0.25), CP(4, -1)])
for k in (2, 3, 4):
    trace([CP(k, 1), (CP(k, 1)[0], 1.5), (-0.2 + 0.2 * k, 1.5)] if k != 3 else [CP(k, 1), (CP(k, 1)[0], 1.35)])
# silkscreen outlines and mounting holes
for (x, y, w, h) in ((cx, cy, 2.1, 0.95), (-2.0, 1.25, 1.0, 0.4), (-2.0, 0.45, 1.0, 0.4), (1.9, -1.3, 1.0, 0.4), (hx + 0.375, hy, 1.15, 0.38)):
    for (a, b) in (((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))):
        p0 = Vector((x + a[0] * w / 2, y + a[1] * h / 2, 0.003)); p1 = Vector((x + b[0] * w / 2, y + b[1] * h / 2, 0.003))
        d = p1 - p0
        box((d.length + 0.02, 0.02, 0.004), silk, loc=tuple((p0 + p1) / 2), rot=(0, 0, math.atan2(d.y, d.x)))
ring(0.42, 0.012, silk, z=0.003).location = (ex, ey, 0)
for x in (-2.95, 2.95):
    for y in (-2.05, 2.05):
        cyl(0.13, 0.02, copper, verts=32, loc=(x, y, 0.01))
        cyl(0.08, 0.2, mat('#06100a', rough=0.9), verts=24, loc=(x, y, 0.0))
floor(7.0, -T - 0.01)

cam = camera((-1.4, -6.6, 5.6), (0.0, -0.05, 0.0), lens=42)
lights((0, 0, 0), rim='#34d399')
finish('circuit-board', 'A printed circuit board', ['circuit board', 'printed circuit board', 'pcb', 'electronics', 'resistor', 'capacitor', 'integrated circuit', 'ic chip', 'led', 'diode', 'copper traces', 'soldering', 'electronic components', 'electrical engineering'], [
    P('Copper trace', (-2.85, 0.1, 0.01), 'Flat copper strips carry current between parts'),
    P('Resistor', (-2.0, 1.25, 0.2), 'Limits current; colour bands give its resistance'),
    P('IC chip', (cx + 0.3, cy, 0.32), 'Many transistors on one silicon chip'),
    P('Electrolytic capacitor', (ex, ey - 0.36, 0.6), 'Stores charge; the stripe marks its negative lead'),
    P('Ceramic capacitor', (qx, qy - 0.07, 0.5), 'A small non-polarised capacitor'),
    P('LED', (lx, ly, 0.6), 'Light-emitting diode: glows when current flows'),
    P('Diode', (-0.4, -1.45, 0.16), 'Lets current through one way; band = cathode'),
    P('Solder pad', CP(5, -1) + (0.02,), 'Leads are soldered to copper pads through holes'),
])
