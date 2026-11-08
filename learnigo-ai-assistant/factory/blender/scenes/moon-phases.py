# The phases of the Moon. Sunlight comes from the right and always lights
# half the Moon; as it goes round the Earth we see more or less of that lit
# half. Each Moon is shaded as it looks from Earth (northern hemisphere).
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
ray = glowmat('#ffd166', 2.5)
orbitm = mat('#5b8cff', rough=0.5, emit=0.6, alpha=0.6)


def moonmat(L, name):
    """Lit where the surface faces direction L (world), dark elsewhere."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    N, Ln = nt.nodes.new, nt.links.new
    geo = N('ShaderNodeNewGeometry')
    dot = N('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'; dot.inputs[1].default_value = L
    mr = N('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -0.04; mr.inputs['From Max'].default_value = 0.08
    Ln(geo.outputs['Normal'], dot.inputs[0]); Ln(dot.outputs['Value'], mr.inputs['Value'])
    tc = N('ShaderNodeTexCoord')
    nz = N('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 3.0; nz.inputs['Detail'].default_value = 4
    Ln(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.45; ramp.color_ramp.elements[0].color = lin('#8f93a3')
    ramp.color_ramp.elements[1].position = 0.6; ramp.color_ramp.elements[1].color = lin('#e9ecf5')
    Ln(nz.outputs['Fac'], ramp.inputs['Fac'])
    mix_ = N('ShaderNodeMix'); mix_.data_type = 'RGBA'
    mix_.inputs['A'].default_value = lin('#1b2138')
    Ln(mr.outputs[0], mix_.inputs['Factor']); Ln(ramp.outputs['Color'], mix_.inputs['B'])
    e = N('ShaderNodeEmission'); e.inputs['Strength'].default_value = 1.0
    Ln(mix_.outputs['Result'], e.inputs['Color'])
    o = N('ShaderNodeOutputMaterial'); Ln(e.outputs[0], o.inputs[0])
    return m


earth = sphere(0.55, earthmat(scale=1.4, rim=0.2), seg=64, rings=32)
earth.rotation_euler = (math.radians(20), 0, math.radians(60))
R = 2.6
tube([(R * math.cos(TAU * i / 128), 0.02, R * math.sin(TAU * i / 128)) for i in range(128)], 0.012, orbitm, closed=True)
NAMES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Third quarter', 'Waning crescent']
moons = []
for k in range(8):
    th = math.radians(45 * k)
    L = (math.sin(th), math.cos(th), 0.0)
    mo = sphere(0.42, moonmat(L, NAMES[k]), seg=64, rings=32, loc=(R * math.cos(th), 0, R * math.sin(th)))
    moons.append(mo)
# sunlight arriving from the right
for z in (-1.8, -0.9, 0.0, 0.9, 1.8):
    tube([(4.9, 0.3, z), (3.75, 0.3, z)], 0.025, ray)
    c = cone(0.08, 0.2, ray, verts=16, loc=(3.7, 0.3, z), rot=(0, -math.pi / 2, 0))
sunlight = Vector((4.3, 0.3, 0.45))

cam = camera((1.15, -11.2, 0.4), (1.15, 0, 0.0), lens=45)
lights((0, 0, 0), power=0.25)
finish('moon-phases', 'Phases of the Moon', ['moon phases', 'moon', 'new moon', 'full moon', 'crescent', 'gibbous', 'quarter moon', 'lunar cycle', 'astronomy', 'space'], [
    P('Sunlight', sunlight, 'The Sun always lights the half of the Moon facing it'),
    P('Earth', (0, -0.5, 0.2), 'We see the Moon from here'),
    P('New moon', moons[0], 'Lit side faces away from us: we see nothing'),
    P('First quarter', moons[2], 'Half lit: one week after new moon'),
    P('Full moon', moons[4], 'The whole lit face points at us'),
    P('Third quarter', moons[6], 'The other half lit: one week after full'),
    P('Crescent', moons[1], 'A thin sliver: waxing means growing'),
    P('Gibbous', moons[5], 'More than half lit: waning means shrinking'),
])
