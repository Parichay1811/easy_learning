# A three-phase squirrel-cage induction motor with a quarter cut away. The
# stator windings, fed with three-phase AC, make a magnetic field that
# rotates. It induces currents in the rotor's aluminium bars (shorted by the
# end rings, like a squirrel cage), and those currents feel a force, so the
# rotor follows the field, always a little slower (slip). A fan on the shaft
# blows air over the finned frame. In the loop the rotor turns.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)


def lamimat(c1, c2, scale=26.0, name='Lam'):
    """Thin sheets across x: alternating stripes of two greys."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = 0.4
    p.inputs['Metallic'].default_value = 0.7
    tc = nt.nodes.new('ShaderNodeTexCoord')
    w = nt.nodes.new('ShaderNodeTexWave'); w.wave_type = 'BANDS'; w.bands_direction = 'X'
    w.inputs['Scale'].default_value = scale
    w.inputs['Distortion'].default_value = 0.0
    ramp = nt.nodes.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'CONSTANT'
    ramp.color_ramp.elements[0].color = lin(c1)
    ramp.color_ramp.elements[1].position = 0.75; ramp.color_ramp.elements[1].color = lin(c2)
    nt.links.new(tc.outputs['Generated'], w.inputs['Vector'])
    nt.links.new(w.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], p.inputs['Base Color'])
    return m


frame = mat('#3d6fd9', rough=0.45, metal=0.3, rim=0.2)
framecut = mat('#a9b4d0', rough=0.5, metal=0.4)
statm = lamimat('#a7afc2', '#69718a', 60, 'StatorLam')
rotm = lamimat('#8d95aa', '#596178', 60, 'RotorLam')
copper = mat('#e08a3c', rough=0.3, metal=0.9, rim=0.2)
alu = mat('#dfe5f0', rough=0.25, metal=0.9, rim=0.2)
steel = mat('#cfd5e2', rough=0.2, metal=0.95)
fanm = mat('#ff9f43', rough=0.4, metal=0.2, rim=0.2)
dark = mat('#252c44', rough=0.6)
AX = (0, math.pi / 2, 0)        # turns a z-standing cylinder to lie along x


def xcyl(r, length, m, x=0.0, verts=64, r2=None):
    return cyl(r, length, m, verts=verts, r2=r2, loc=(x, 0, 0), rot=AX)


def quarter():
    """The cutter: the quadrant facing the camera (y < 0, z > 0)."""
    return box((5.2, 3.2, 3.2), framecut, loc=(0.1, -1.6, 1.6))


def ring_slots(r0, r1, w, n, length, m, phase=0.0):
    src = box((length, w, r1 - r0), m)
    mats = [Matrix.Rotation(phase + TAU * k / n, 4, 'X') @ Matrix.Translation((0, 0, (r0 + r1) / 2)) for k in range(n)]
    return merge_instances(src, mats, 'Slots', m)


# frame (housing) and end shields
house = xcyl(1.5, 3.0, frame)
cut(house, xcyl(1.33, 3.2, framecut))
fins = []
for k in range(20):
    ph = math.radians(9 + 18 * k)
    if 90 < math.degrees(ph) < 180:
        continue
    f = box((2.8, 0.06, 0.2), frame, loc=(0, 1.58 * math.cos(ph), 1.58 * math.sin(ph)), rot=(ph - math.pi / 2, 0, 0))
    fins.append(f)
shields = []
for s in (-1, 1):
    sh = xcyl(1.5, 0.16, frame, x=s * 1.58)
    hub = xcyl(0.42, 0.4, frame, x=s * 1.75)
    for ob in (sh, hub):
        cut(ob, xcyl(0.23, 1.0, framecut, x=s * 1.6))
    shields += [sh, hub]
# stator: laminated core with slots, copper in the slots, end windings
stator = xcyl(1.33, 2.0, statm)
cut(stator, xcyl(0.86, 2.2, framecut))
cut(stator, ring_slots(0.84, 1.1, 0.13, 24, 2.2, framecut))
cond = ring_slots(0.9, 1.06, 0.1, 24, 2.0, copper)
ends = []
for s in (-1, 1):
    e = torus(0.98, 0.16, copper, seg=72, ring=16, loc=(s * 1.13, 0, 0), rot=AX)
    ends.append(e)
# fan cover with a slotted grille
cover = xcyl(1.42, 0.7, frame, x=2.25)
cut(cover, xcyl(1.34, 0.72, framecut, x=2.21))
for k in range(5):
    cut(cover, box((0.3, 2.4, 0.1), framecut, loc=(2.6, 0, -0.9 + 0.45 * k)))
for ob in [house, stator, cond, cover] + ends + shields:
    cut(ob, quarter())
# feet and terminal box
for x in (-1.0, 1.0):
    box((0.5, 2.6, 0.5), frame, bevel=0.03, loc=(x, 0, -1.45))
box((3.4, 3.0, 0.12), dark, bevel=0.02, loc=(0.2, 0, -1.76))
box((0.8, 0.6, 0.45), frame, bevel=0.05, loc=(0.25, 0.45, 1.7))
cyl(0.12, 0.25, dark, verts=20, loc=(0.25, 0.85, 1.65), rot=(math.pi / 2, 0, 0))
# rotor: laminated core, skewed aluminium bars, end rings, shaft and fan
rotor = empty('Rotor')
core = xcyl(0.76, 2.0, rotm)
core.parent = rotor
nb = 22
for k in range(nb):
    a0 = TAU * k / nb
    a1 = a0 + math.radians(14)
    tube([(-1.0, 0.775 * math.cos(a0), 0.775 * math.sin(a0)), (1.0, 0.775 * math.cos(a1), 0.775 * math.sin(a1))], 0.042, alu, parent=rotor)
for s in (-1, 1):
    er = lathe([(0.5, -0.07), (0.82, -0.07), (0.82, 0.07), (0.5, 0.07), (0.5, -0.07)], alu, seg=72, loc=(s * 1.06, 0, 0), rot=AX, parent=rotor)
sh = xcyl(0.2, 5.0, steel, x=-0.25)
sh.parent = rotor
box((0.6, 0.08, 0.06), steel, loc=(-2.4, 0, 0.21), parent=rotor)
fan = empty('Fan', loc=(2.15, 0, 0), parent=rotor)
xcyl(0.3, 0.3, fanm).parent = fan
for k in range(8):
    a = TAU * k / 8
    box((0.22, 0.05, 0.95), fanm, bevel=0.015, loc=(0, 0.75 * math.cos(a + math.pi / 2), 0.75 * math.sin(a + math.pi / 2)), rot=(a, 0, 0), parent=fan)
floor(7.0, -1.82)

cam = camera((-4.6, -8.2, 4.6), (0.1, 0, -0.1), lens=40)
lights((0, 0, 0), rim='#ff9f43')


def spin(t):
    rotor.rotation_euler = (TAU * t, 0, 0)


c = math.cos(math.radians(135)); s_ = math.sin(math.radians(135))
finish('induction-motor', 'An induction motor', ['induction motor', 'ac motor', 'three-phase motor', 'squirrel cage', 'squirrel-cage rotor', 'stator', 'rotor', 'rotating magnetic field', 'slip', 'electric motor', 'electrical machines', 'electrical engineering'], [
    P('Stator windings', (-1.2, 1.05 * math.cos(math.radians(120)), 1.05 * math.sin(math.radians(120))), 'Three-phase AC here makes a rotating magnetic field'),
    P('Stator core', (0.35, -1.2, 0.0), 'Laminated steel ring; the windings sit in its slots'),
    P('Squirrel-cage rotor', (0.1, 0.78 * c, 0.78 * s_), 'Induced currents in its bars make it turn'),
    P('End ring', (1.06, 0.82 * c, 0.82 * s_), 'Shorts all the bars together at each end'),
    P('Shaft', (-2.45, -0.21, 0.05), 'Carries the turning force out to the load'),
    P('Cooling fan', (2.15, -0.8, 0.55), 'Turns with the shaft and blows air over the frame'),
    P('Finned frame', (-0.4, 1.62 * math.cos(math.radians(-125)), 1.62 * math.sin(math.radians(-125))), 'Fins give more surface to shed heat'),
    P('Terminal box', (0.25, 0.3, 1.9), 'The three supply phases connect here'),
], anim=spin, frames=120)
