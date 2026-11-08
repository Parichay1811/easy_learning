# A steam turbine coupled to a generator (a turbo-generator set), a quarter
# of each casing cut away. High-pressure steam enters at the small end and
# expands through rows of fixed and moving blades; the blades get longer as
# the steam's pressure falls and its volume grows. The spinning shaft turns
# the generator's rotor (an electromagnet) inside the stator windings, which
# makes three-phase AC. Exhaust steam goes down to the condenser.
# In the loop the shaft turns.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
AX = (0, math.pi / 2, 0)
casem = mat('#7f8aa6', rough=0.45, metal=0.5, rim=0.2)
casecut = mat('#c3cadb', rough=0.5, metal=0.3)
bladem = mat('#e7ebf3', rough=0.25, metal=0.9, rim=0.2)
fixedm = mat('#ffb36b', rough=0.3, metal=0.7, rim=0.2)
discm = mat('#9aa3b8', rough=0.3, metal=0.85)
steel = mat('#cfd5e2', rough=0.2, metal=0.95)
genm = mat('#3d6fd9', rough=0.45, metal=0.3, rim=0.2)
copper = mat('#e08a3c', rough=0.3, metal=0.9, rim=0.2)
corem = mat('#8d95aa', rough=0.4, metal=0.7)
pipem = mat('#d65a5a', rough=0.4, metal=0.4, rim=0.2)
plinth = mat('#3a4466', rough=0.7, rim=0.1)
condm = mat('#5b8cff', rough=0.45, metal=0.3, rim=0.2)


def xcyl(r, length, m, x=0.0, verts=64, **kw):
    return cyl(r, length, m, verts=verts, loc=(x, 0, 0), rot=AX, **kw)


def quarter(x0, x1):
    return box((x1 - x0, 3.0, 3.0), casecut, loc=((x0 + x1) / 2, -1.5, 1.5))


# turbine stages: x position, blade length (grows towards the low-pressure end)
stages = [(-3.15 + 0.47 * k, 0.14 + 0.07 * k + 0.01 * k * k) for k in range(8)]
rd = 0.36   # disc (drum) radius
prof_out, prof_in = [], []
for x, L in stages:
    prof_in.append((rd + L + 0.06, x - 0.2))
    prof_in.append((rd + L + 0.06, x + 0.25))
prof_out = [(r + 0.14, z) for r, z in prof_in]
casing_prof = [(0.25, stages[0][0] - 0.45), (prof_out[0][0], stages[0][0] - 0.45)] + prof_out + \
              [(prof_out[-1][0], stages[-1][0] + 0.55), (prof_in[-1][0], stages[-1][0] + 0.55)] + prof_in[::-1] + \
              [(0.25, stages[0][0] - 0.3), (0.25, stages[0][0] - 0.45)]
casing = lathe(casing_prof, casem, seg=96, rot=AX)
cut(casing, quarter(-4.2, 1.2))
# fixed blades (nozzles) on the casing between the moving rows, lower 3/4 only
for k, (x, L) in enumerate(stages):
    src = box((0.05, 0.11, L), fixedm)
    n = 26
    mats = []
    for i in range(n):
        a = TAU * i / n
        y, z = math.cos(a), math.sin(a)
        if y < 0.05 and z > -0.05:
            continue
        mats.append(Matrix.Translation((x - 0.2, 0, 0)) @ Matrix.Rotation(a - math.pi / 2, 4, 'X') @ Matrix.Translation((0, 0, rd + L / 2 + 0.03)) @ Matrix.Rotation(math.radians(-35), 4, 'Z'))
    merge_instances(src, mats, 'Fixed', fixedm)
# steam inlet (from above, at the high-pressure end) and exhaust down to the condenser
xi = stages[0][0] - 0.2
tube([(xi, 0.45, 2.6), (xi, 0.45, 1.4), (xi, 0.3, prof_out[0][0] - 0.05)], 0.16, pipem, kind='BEZIER')
cyl(0.24, 0.3, pipem, verts=32, loc=(xi, 0.45, 2.1))
xe = stages[-1][0]
hood = box((1.1, 2.0, 1.4), casem, bevel=0.05, loc=(xe, 0.0, -1.9))
box((2.4, 2.4, 1.2), condm, bevel=0.06, loc=(xe - 0.1, 0.0, -3.2))
for y in (-0.7, 0.7):
    xcyl(0.12, 0.8, condm, x=xe - 1.5).location = (xe - 1.6, y, -3.4)
# rotor: shaft, discs and moving blades, coupling, generator rotor (turn together)
rotor = empty('Rotor')
xcyl(0.16, 10.4, steel, x=0.9).parent = rotor
for x, L in stages:
    xcyl(rd, 0.18, discm, x=x + 0.03).parent = rotor
    src = box((0.07, 0.12, L), bladem)
    n = 30
    mats = [Matrix.Translation((x + 0.03, 0, 0)) @ Matrix.Rotation(TAU * i / n, 4, 'X') @ Matrix.Translation((0, 0, rd + L / 2)) @ Matrix.Rotation(math.radians(35), 4, 'Z') for i in range(n)]
    merge_instances(src, mats, 'Blades', bladem, parent=rotor)
xcyl(0.27, stages[-1][0] - stages[0][0] + 0.3, discm, x=(stages[0][0] + stages[-1][0]) / 2, verts=48).parent = rotor
xc = 1.45
for s in (-1, 1):
    fl = xcyl(0.48, 0.12, steel, x=xc + s * 0.07)
    fl.parent = rotor
    for i in range(8):
        a = TAU * i / 8
        cyl(0.04, 0.32, discm, verts=12, loc=(xc, 0.36 * math.cos(a), 0.36 * math.sin(a)), rot=AX, parent=rotor)
gx0, gx1 = 2.1, 5.3
gr = xcyl(0.62, 2.5, corem, x=(gx0 + gx1) / 2)
gr.parent = rotor
slots = box((2.5, 0.12, 0.2), copper)
merge_instances(slots, [Matrix.Translation(((gx0 + gx1) / 2, 0, 0)) @ Matrix.Rotation(TAU * i / 16, 4, 'X') @ Matrix.Translation((0, 0, 0.56)) for i in range(16) if i % 8 not in (0, 7)], 'Field', copper, parent=rotor)
for s in (-1, 1):
    torus(0.45, 0.1, copper, seg=48, ring=10, loc=((gx0 + gx1) / 2 + s * 1.3, 0, 0), rot=AX, parent=rotor)
# generator stator and housing (quarter cut)
gc = (gx0 + gx1) / 2
house = xcyl(1.35, gx1 - gx0 + 0.6, genm, x=gc)
cut(house, xcyl(1.22, gx1 - gx0 + 0.4, casecut, x=gc))
cut(house, xcyl(0.22, 6, casecut, x=gc))
stat = xcyl(1.22, 2.5, corem, x=gc)
cut(stat, xcyl(0.7, 2.7, casecut, x=gc))
sw = box((2.5, 0.13, 0.2), copper)
cond = merge_instances(sw, [Matrix.Translation((gc, 0, 0)) @ Matrix.Rotation(TAU * i / 36, 4, 'X') @ Matrix.Translation((0, 0, 0.8)) for i in range(36)], 'StatW', copper)
ends = [torus(0.93, 0.13, copper, seg=72, ring=12, loc=(gc + s * 1.38, 0, 0), rot=AX) for s in (-1, 1)]
for ob in [house, stat, cond] + ends:
    cut(ob, quarter(gx0 - 0.5, gx1 + 0.5))
# exciter at the far end
ex = xcyl(0.45, 0.7, genm, x=gx1 + 0.9)
# bearing pedestals and the plinth
for x in (-4.0, 0.95, gx1 + 1.5):
    box((0.32, 0.7, 1.55), casem, bevel=0.03, loc=(x, 0, -0.97))
    xcyl(0.24, 0.36, steel, x=x)
for x in (gx0 + 0.2, gx1 - 0.2):
    box((0.4, 2.0, 0.5), genm, bevel=0.03, loc=(x, 0, -1.5))
for a, b in ((-4.6, -0.6), (0.7, 7.3)):
    box((b - a, 2.8, 0.3), plinth, bevel=0.04, loc=((a + b) / 2, 0, -1.9))
floor(9.0, -3.81)

cam = camera((-3.4, -12.4, 5.2), (1.25, 0, -0.75), lens=38)
lights((0.8, 0, 0), rim='#ff9f43')


def spin(t):
    rotor.rotation_euler = (TAU * t, 0, 0)


c45 = math.cos(math.radians(130)); s45 = math.sin(math.radians(130))
finish('turbine-generator', 'A steam turbine and generator', ['steam turbine', 'turbine', 'generator', 'turbo-generator', 'turbine blades', 'alternator', 'power station', 'power plant', 'rotor', 'stator', 'steam', 'electricity generation', 'mechanical engineering', 'electrical engineering'], [
    P('Steam inlet', (xi, 0.45, 2.3), 'High-pressure steam enters at the small end'),
    P('High-pressure blades', (stages[1][0] + 0.03, (rd + stages[1][1] * 0.6) * c45, (rd + stages[1][1] * 0.6) * s45), 'Short blades: dense steam at high pressure'),
    P('Low-pressure blades', (stages[-1][0] + 0.03, (rd + stages[-1][1] * 0.7) * c45, (rd + stages[-1][1] * 0.7) * s45), 'Long blades: the steam has expanded'),
    P('Fixed blades', (stages[4][0] - 0.2, -0.0, -(rd + stages[4][1] * 0.5) - 0.02), 'Nozzles that turn the steam onto the next row'),
    P('Coupling', (xc, -0.5, 0.0), 'Bolted flanges join turbine and generator shafts'),
    P('Generator rotor', (gc - 0.4, 0.63 * c45, 0.63 * s45), 'A spinning electromagnet (field winding)'),
    P('Stator windings', (gc + 0.5, -0.82, 0.03), 'Fixed coils where the AC is induced'),
    P('To condenser', (xe - 0.2, -1.1, -2.65), 'Exhaust steam is cooled back to water'),
], anim=spin)
