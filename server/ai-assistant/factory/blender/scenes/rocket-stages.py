# A multi-stage rocket, pulled apart and cut open: each stage has its own
# fuel and oxidiser tanks and engines, and drops away when empty so the
# rest is lighter. The crew capsule rides on top under the escape tower.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
hull = mat('#eef2fb', rough=0.35, rim=0.25)
dark = mat('#2a3150', rough=0.45, rim=0.2)
inner = mat('#c9d2e8', rough=0.6)
fuel = mat('#5b8cff', rough=0.3, rim=0.3)
oxi = mat('#22d3ee', rough=0.3, rim=0.3)
eng = mat('#7c8296', rough=0.3, metal=0.8)
capm = mat('#d9dde8', rough=0.3, metal=0.4, rim=0.2)
flame = mat('#ffb347', alpha=0.85, emit=5)
red = mat('#fb7185', rough=0.4, rim=0.2)

rk = empty('Rocket', rot=(0, math.radians(62), 0))
half = lambda m: box((10, 4, 30), m, loc=(0, -2, 0), parent=rk)


def stage(z0, h, r, n_eng, gap_band=True):
    body = cyl(r, h, hull, verts=64, loc=(0, 0, z0 + h / 2), parent=rk)
    cut(body, cyl(r - 0.04, h + 0.1, inner, verts=64, loc=(0, 0, z0 + h / 2), parent=rk))
    bpy.context.view_layer.update()
    cut(body, half(inner))
    t1 = cyl(r - 0.08, h * 0.42, fuel, verts=48, loc=(0, 0.02, z0 + h * 0.3), parent=rk)
    t2 = cyl(r - 0.08, h * 0.38, oxi, verts=48, loc=(0, 0.02, z0 + h * 0.74), parent=rk)
    for t in (t1, t2):
        bevel(t, 0.12, 4)
    bpy.context.view_layer.update()
    for t, m in ((t1, fuel), (t2, oxi)):
        apply_mods(t)
        cut(t, half(m))
    cyl(r + 0.01, 0.12, dark, verts=64, loc=(0, 0, z0 + h - 0.06), parent=rk)
    engs = []
    for k in range(n_eng):
        a = TAU * k / n_eng
        off = (r * 0.5 * math.cos(a), r * 0.5 * math.sin(a), 0) if n_eng > 1 else (0, 0, 0)
        e = cone(r * 0.28 if n_eng > 1 else r * 0.45, r * 0.5, eng, verts=32, loc=(off[0], off[1], z0 - r * 0.25), parent=rk)
        engs.append(e)
    return body, t1, t2, engs


s1 = stage(0.0, 4.2, 0.85, 5)
for k in range(4):   # fins
    a = TAU * k / 4 + math.pi / 4
    f = prism([(0, 0), (0.9, 0), (0.0, 1.3)], 0.06, red, parent=rk)
    f.location = (0.8 * math.cos(a), 0.8 * math.sin(a), 0.05)
    f.rotation_euler = (math.pi / 2, 0, a)
s2 = stage(4.85, 2.8, 0.75, 1)
s3 = stage(8.3, 1.8, 0.6, 1)
cap = cone(0.6, 0.85, capm, verts=48, loc=(0, 0, 10.9), parent=rk)
tower = tube([(0, 0, 11.3), (0, 0, 12.4)], 0.04, red, parent=rk)
cone(0.12, 0.35, red, verts=24, loc=(0, 0, 12.55), parent=rk)
for k in range(4):
    a = TAU * k / 4
    tube([(0.45 * math.cos(a), 0.45 * math.sin(a), 11.0), (0, 0, 11.6)], 0.02, red, parent=rk)
fl = cone(0.75, 2.2, flame, verts=32, loc=(0, 0, -1.55), rot=(math.pi, 0, 0), parent=rk)
no_shadow(fl)

cam = camera((5.1, -20.5, 4.4), (5.1, 0, 2.9), lens=46)
lights((5.3, 0, 2.9))
finish('rocket-stages', 'Stages of a rocket', ['rocket', 'stages', 'space travel', 'launch', 'fuel', 'thrust', 'engines', 'spacecraft', 'forces'], [
    P('Escape tower', (rk, (0, 0, 12.2)), 'Pulls the crew to safety if something goes wrong'),
    P('Crew capsule', (rk, (0, -0.3, 10.95)), 'Where the astronauts ride'),
    P('Third stage', (rk, (0, -0.6, 9.2)), 'Pushes the capsule the last part of the way'),
    P('Second stage', (rk, (0, -0.72, 6.5)), 'Fires once the first stage drops away'),
    P('First stage', (rk, (0, -0.84, 2.0)), 'The biggest: lifts the whole rocket off the ground'),
    P('Fuel tank', (rk, (0, -0.0, 1.26)), 'Holds the fuel, such as kerosene or hydrogen'),
    P('Oxidiser tank', (rk, (0, -0.0, 3.1)), 'Holds liquid oxygen so the fuel can burn in space'),
    P('Engines', (rk, (0, -0.3, -0.25)), 'Burn the fuel and push hot gas out: thrust'),
])
