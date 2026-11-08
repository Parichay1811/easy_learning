# A permanent-magnet DC motor, the front half of its steel yoke cut away.
# Current enters through carbon brushes that press on the commutator, flows
# through the armature coils and feels a force in the magnets' field, so the
# armature turns. The commutator's split segments reverse each coil's
# current every half turn, so the torque keeps the same direction.
# In the loop the armature and commutator turn; the brushes stay still.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset(48)
AX = (0, math.pi / 2, 0)


def lamimat(c1, c2, scale=60.0, name='Lam'):
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


def xcyl(r, length, m, x=0.0, verts=64, **kw):
    return cyl(r, length, m, verts=verts, loc=(x, 0, 0), rot=AX, **kw)


def arc_seg(r0, r1, a0, a1, x0, x1, m, n=24, parent=None, name='Arc'):
    """A curved block round the x axis: radii r0..r1, angles a0..a1 (from +y
    towards +z), from x0 to x1. Closed, so its cut ends look solid."""
    verts, faces = [], []
    for i in range(n + 1):
        a = a0 + (a1 - a0) * i / n
        c, s = math.cos(a), math.sin(a)
        for (x, r) in ((x0, r0), (x0, r1), (x1, r1), (x1, r0)):
            verts.append((x, r * c, r * s))
    for i in range(n):
        for j in range(4):
            j2 = (j + 1) % 4
            faces.append((i * 4 + j, i * 4 + j2, (i + 1) * 4 + j2, (i + 1) * 4 + j))
    faces.append((3, 2, 1, 0))
    faces.append((n * 4, n * 4 + 1, n * 4 + 2, n * 4 + 3))
    ob = from_data(verts, faces, name, m, smooth=False, parent=parent)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data); bm.free()
    return ob


yokem = mat('#7c8296', rough=0.4, metal=0.6, rim=0.15)
yokecut = mat('#b8bfd2', rough=0.5, metal=0.4)
north = mat('#e5484d', rough=0.4, metal=0.2, rim=0.25)
south = mat('#4f7cff', rough=0.4, metal=0.2, rim=0.25)
corem = lamimat('#a7afc2', '#646c85', 70, 'ArmLam')
copper = mat('#e08a3c', rough=0.3, metal=0.9, rim=0.2)
mica = mat('#2a1f1a', rough=0.6)
steel = mat('#d6dbe8', rough=0.2, metal=0.95)
carbon = mat('#2e3038', rough=0.75, rim=0.1)
brass = mat('#d8b04a', rough=0.3, metal=0.85, rim=0.15)
basem = mat('#2a3350', rough=0.6, rim=0.1)
redw = mat('#e5484d', rough=0.45, rim=0.2)
blkw = mat('#30343f', rough=0.45, rim=0.2)
letter = mat('#ffffff', rough=0.4, emit=1.2)

# yoke (a steel tube, front half cut away) on a base
yoke = xcyl(1.45, 2.0, yokem)
cut(yoke, xcyl(1.2, 2.2, yokecut))
cut(yoke, box((2.4, 1.6, 3.2), yokecut, loc=(0, -0.8, 0)))
box((5.6, 2.6, 0.18), basem, bevel=0.03, loc=(0.45, 0.2, -1.62))
for x in (-0.7, 0.7):
    box((0.3, 1.2, 0.3), yokem, loc=(x, 0.25, -1.4))
# field magnets: arcs on the yoke's inside, N on top, S below
mN = arc_seg(0.95, 1.2, math.radians(35), math.radians(145), -0.9, 0.9, north, name='North')
mS = arc_seg(0.95, 1.2, math.radians(215), math.radians(325), -0.9, 0.9, south, name='South')
for ch, z in (('N', 1.07), ('S', -1.07)):
    text(ch, 0.26, letter, loc=(-0.915, 0.0, z), rot=(math.pi / 2, 0, -math.pi / 2), extrude=0.01)
# armature (rotates): slotted laminated core, coils, commutator, shaft
arm = empty('Armature')
core = xcyl(0.88, 1.6, corem)
slots = box((1.8, 0.14, 0.3), yokecut)
cut(core, merge_instances(slots, [Matrix.Rotation(TAU * k / 12, 4, 'X') @ Matrix.Translation((0, 0, 0.78)) for k in range(12)], 'Slots', yokecut))
core.parent = arm
cond = box((1.6, 0.11, 0.24), copper)
merge_instances(cond, [Matrix.Rotation(TAU * k / 12, 4, 'X') @ Matrix.Translation((0, 0, 0.76)) for k in range(12)], 'Cond', copper, parent=arm)
for s in (-1, 1):
    torus(0.72, 0.12, copper, seg=64, ring=12, loc=(s * 0.88, 0, 0), rot=AX, parent=arm)
xcyl(0.12, 4.8, steel, x=0.6).parent = arm
cx = 1.55
xcyl(0.3, 0.55, mica, x=cx).parent = arm
for k in range(12):
    a = TAU * k / 12
    arc_seg(0.3, 0.38, a + 0.04, a + TAU / 12 - 0.04, cx - 0.27, cx + 0.27, copper, n=6, parent=arm, name='Seg')
    am = a + TAU / 24
    tube([(0.95, 0.66 * math.cos(am), 0.66 * math.sin(am)), (cx - 0.3, 0.36 * math.cos(am), 0.36 * math.sin(am))], 0.025, copper, parent=arm)
# brushes (still): carbon blocks in brass holders, springs, leads
for s, w in ((1, redw), (-1, blkw)):
    z0 = s * (0.38 + 0.2)
    box((0.22, 0.2, 0.4), carbon, bevel=0.01, loc=(cx, 0, z0))
    hold = box((0.3, 0.28, 0.32), brass, bevel=0.02, loc=(cx, 0, z0 + s * 0.2))
    cut(hold, box((0.23, 0.21, 0.5), brass, loc=(cx, 0, z0 + s * 0.2)))
    pts = [(cx + 0.06 * math.cos(TAU * i / 16), 0.06 * math.sin(TAU * i / 16), z0 + s * (0.2 + 0.25 * i / 96)) for i in range(97)]
    tube(pts, 0.012, steel)
    box((0.08, 0.08, 0.5), basem, loc=(cx, 0.35, z0 + s * 0.15))
    tube([(cx, 0.0, z0 + s * 0.45), (cx + 0.5, -0.1, z0 + s * 0.6), (cx + 1.3, -0.3, -1.3), (cx + 1.6, -0.5, -1.45)], 0.035, w, kind='BEZIER')
# bearing blocks for the shaft
for x in (-1.45, 2.55):
    box((0.35, 0.6, 1.25), yokem, bevel=0.04, loc=(x, 0, -0.9))
    xcyl(0.24, 0.4, steel, x=x)
floor(7.0, -1.71)

cam = camera((-4.6, -8.6, 3.4), (0.35, 0, -0.1), lens=42)
lights((0, 0, 0), rim='#a78bfa')


def spin(t):
    arm.rotation_euler = (TAU * t, 0, 0)


finish('dc-motor', 'A DC motor', ['dc motor', 'direct current motor', 'electric motor', 'commutator', 'brushes', 'armature', 'field magnets', 'permanent magnet', 'motor effect', 'fleming left hand rule', 'torque', 'electrical machines', 'electrical engineering'], [
    P('Field magnet (N)', (-0.2, -0.62, 1.0), 'Permanent magnets set up the field across the armature'),
    P('Field magnet (S)', (-0.2, -0.62, -1.0), 'The field runs N to S through the armature'),
    P('Armature', (-0.3, -0.85, 0.15), 'A slotted iron core that turns, carrying the coils'),
    P('Armature winding', (-0.88, -0.6, 0.38), 'Current here feels a force: F = BIL on each side'),
    P('Commutator', (cx, -0.38, 0.0), 'Split copper ring: flips coil current every half turn'),
    P('Carbon brush', (cx, -0.11, 0.62), 'Presses on the commutator to feed in current'),
    P('Yoke', (0.6, 0.6, 1.3), 'Steel tube that holds the magnets and returns the flux'),
    P('Shaft', (2.95, -0.12, 0.02), 'Carries the torque out to the load'),
], anim=spin)
