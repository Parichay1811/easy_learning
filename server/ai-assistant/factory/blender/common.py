# The Blender kit for Learnigo's 3D pictures (public/renders/*.webp, *.mp4).
# A scene script builds its subject with these helpers, names the parts to
# label, and calls finish(): it renders the still (and the loop), projects
# every part through the camera to 0-1 picture fractions, and writes
# factory/blender/meta/<name>.json for build-manifest.mjs.
#   Blender -b -P factory/blender/scenes/heart.py -- [--fast] [--no-loop]
import bpy, bmesh, math, json, os, sys, subprocess, shutil, time
from mathutils import Vector, Matrix, Euler, noise
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, 'out')          # working files (git-ignored)
META = os.path.join(HERE, 'meta')        # per-render manifest data
RENDERS = os.path.join(PROJECT, 'public', 'renders')
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
FAST = '--fast' in ARGS
RES = (1200, 1050)                        # the board's picture area is 8:7
LOOP_RES = (1200, 1050)
TAU = math.tau

# The site's palette (sRGB hex) and a few naturals.
PAL = {
    'cyan': '#22d3ee', 'blue': '#5b8cff', 'orange': '#ff9f43', 'green': '#34d399', 'red': '#fb7185',
    'purple': '#a78bfa', 'yellow': '#fbbf24', 'teal': '#2dd4bf', 'white': '#eef2ff', 'ink': '#e9eeff',
    'grey': '#8b95b5', 'dark': '#1a2240', 'navy': '#0e1838', 'bg': '#070b1d',
    'wood': '#b07a4a', 'stone': '#c9b48a', 'sand': '#e8c98a', 'skin': '#f2c29b', 'brown': '#8a5a3b',
    'leaf': '#3fbf6a', 'water': '#3b82f6', 'rock': '#7c7f8f', 'flesh': '#e5677d', 'bone': '#f1e6cf',
}


def hexrgb(h):
    h = PAL.get(h, h).lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def lin(h, a=1.0):
    """sRGB hex (or palette name) to a linear RGBA tuple for materials."""
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(f(c) for c in hexrgb(h)) + (a,)


def mix(h1, h2, k):
    a, b = hexrgb(h1), hexrgb(h2)
    return '#' + ''.join('%02x' % round(255 * (x + (y - x) * k)) for x, y in zip(a, b))


def lighter(h, k=0.35):
    return mix(h, '#ffffff', k)


def darker(h, k=0.35):
    return mix(h, '#000000', k)


# ---------------------------------------------------------------- scene
def reset(samples=32):
    """An empty scene with EEVEE, Standard colour, a soft bloom and the size set."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x, sc.render.resolution_y = RES
    sc.render.resolution_percentage = 50 if FAST else 100
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGB'
    sc.render.fps = 24
    ee = sc.eevee
    ee.taa_render_samples = 12 if FAST else samples
    for k, v in (('use_shadows', True), ('use_raytracing', True), ('use_fast_gi', True), ('fast_gi_distance', 2.0), ('shadow_ray_count', 2)):
        try:
            setattr(ee, k, v)
        except Exception:
            pass
    vs = sc.view_settings
    try:
        vs.view_transform = 'Standard'
        vs.look = 'None'
    except Exception:
        pass
    vs.exposure = 0
    sc.world = bpy.data.worlds.new('World')
    sc.world.use_nodes = True
    glow()
    return sc


def glow(strength=0.55, threshold=1.0, size=7):
    """The soft glow: RLayers -> Glare (Bloom) -> group output."""
    sc = bpy.context.scene
    ng = bpy.data.node_groups.new('Glow', 'CompositorNodeTree')
    ng.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    rl = ng.nodes.new('CompositorNodeRLayers')
    g = ng.nodes.new('CompositorNodeGlare')
    out = ng.nodes.new('NodeGroupOutput')
    vals = {'Type': 'Bloom', 'Quality': 'High', 'Threshold': threshold, 'Strength': strength, 'Size': size / 10 if size > 1 else size}
    for name, v in vals.items():
        s = g.inputs.get(name)
        if s is None:
            continue
        try:
            s.default_value = v
        except Exception:
            pass
    ng.links.new(rl.outputs['Image'], g.inputs['Image'])
    ng.links.new(g.outputs[0], out.inputs[0])
    sc.compositing_node_group = ng
    try:
        sc.render.use_compositing = True
    except Exception:
        pass


def world(cam, center='#14204a', edge='#070b1d', ambient='#2a3a70', amb=0.35, lift=0.12):
    """The site's deep-blue backdrop: a radial gradient around the view
    direction for camera rays, a dim blue ambient for lighting."""
    w = bpy.context.scene.world
    nt = w.node_tree
    nt.nodes.clear()
    N = nt.nodes.new
    tc = N('ShaderNodeTexCoord')
    fwd = (cam.matrix_world.to_quaternion() @ Vector((0, 0, -1)))
    up = (cam.matrix_world.to_quaternion() @ Vector((0, 1, 0)))
    aim = (fwd + up * lift).normalized()
    nrm = N('ShaderNodeVectorMath'); nrm.operation = 'NORMALIZE'
    dot = N('ShaderNodeVectorMath'); dot.operation = 'DOT_PRODUCT'
    dot.inputs[1].default_value = aim
    half = math.atan(cam.data.sensor_width / 2 / cam.data.lens) if cam.data.type == 'PERSP' else 0.5
    mr = N('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = math.cos(half * 1.25)
    mr.inputs['From Max'].default_value = 1.0
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'EASE'
    ramp.color_ramp.elements[0].color = lin(edge)
    ramp.color_ramp.elements[1].color = lin(center)
    bgc = N('ShaderNodeBackground')
    bga = N('ShaderNodeBackground'); bga.inputs[0].default_value = lin(ambient); bga.inputs[1].default_value = amb
    lp = N('ShaderNodeLightPath')
    mx = N('ShaderNodeMixShader')
    out = N('ShaderNodeOutputWorld')
    L = nt.links.new
    L(tc.outputs['Generated'], nrm.inputs[0]); L(nrm.outputs[0], dot.inputs[0])
    L(dot.outputs['Value'], mr.inputs['Value']); L(mr.outputs[0], ramp.inputs[0])
    L(ramp.outputs[0], bgc.inputs[0])
    L(lp.outputs['Is Camera Ray'], mx.inputs[0]); L(bga.outputs[0], mx.inputs[1]); L(bgc.outputs[0], mx.inputs[2])
    L(mx.outputs[0], out.inputs[0])


def camera(loc, target=(0, 0, 0), lens=60, ortho=None, bg=True, **bgkw):
    """A still camera looking at target; also sets the backdrop for it."""
    sc = bpy.context.scene
    cd = bpy.data.cameras.new('Cam')
    cd.lens = lens
    cd.sensor_width = 36
    cd.clip_end = 1000
    if ortho:
        cd.type = 'ORTHO'
        cd.ortho_scale = ortho
    cam = bpy.data.objects.new('Cam', cd)
    sc.collection.objects.link(cam)
    cam.location = loc
    d = Vector(target) - Vector(loc)
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    sc.camera = cam
    bpy.context.view_layer.update()
    if bg:
        world(cam, **bgkw)
    return cam


def _light(kind, name, loc, target, energy, color='#ffffff', size=1.0):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = energy
    ld.color = hexrgb(color)
    if kind == 'AREA':
        ld.shape = 'DISK'
        ld.size = size
    elif kind in ('POINT', 'SPOT'):
        ld.shadow_soft_size = size
    ob = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return ob


def lights(target=(0, 0, 0), dist=None, power=1.0, rim='#5b8cff', key='#fff4e6', fill='#9fb8ff'):
    """Three-point studio light placed relative to the camera: a warm key
    up-left, a cool soft fill right, a coloured rim behind for the glow edge."""
    cam = bpy.context.scene.camera
    t = Vector(target)
    if dist is None:
        dist = (cam.location - t).length
    q = cam.matrix_world.to_quaternion()
    right, up, back = q @ Vector((1, 0, 0)), q @ Vector((0, 1, 0)), q @ Vector((0, 0, 1))
    e = dist * dist * power
    _light('AREA', 'Key', t + (-right * 0.8 + up * 0.9 + back * 0.9).normalized() * dist, t, 22 * e, key, dist * 0.45)
    _light('AREA', 'Fill', t + (right * 1.0 + up * 0.15 + back * 0.8).normalized() * dist, t, 7 * e, fill, dist * 0.7)
    _light('AREA', 'Rim', t + (right * 0.3 + up * 0.7 - back * 1.0).normalized() * dist, t, 30 * e, rim, dist * 0.4)


def no_shadow(*obs):
    """Let light pass through (a glowing sun with a lamp inside it)."""
    for ob in obs:
        ob.visible_shadow = False
    return obs[0] if obs else None


def point(loc, energy=100, color='#ffffff', size=0.2):
    return _light('POINT', 'Point', loc, (0, 0, 0), energy, color, size)


def sun(direction=(-0.4, 0.3, -1), energy=2.5, color='#ffffff', angle=8):
    ld = bpy.data.lights.new('Sun', 'SUN')
    ld.energy = energy
    ld.color = hexrgb(color)
    ld.angle = math.radians(angle)
    ob = bpy.data.objects.new('Sun', ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.rotation_euler = Vector(direction).to_track_quat('-Z', 'Y').to_euler()
    return ob


# ------------------------------------------------------------ materials
_MATS = {}


def mat(color, rough=0.45, metal=0.0, emit=0.0, rim=0.25, alpha=1.0, coat=0.0, sss=0.0, glass=0.0, name=None, emit_color=None):
    """A clean stylised material: principled BSDF plus a soft facing-ratio
    rim of a lighter tint (the holo glow). Cached by its settings."""
    key = (color, rough, metal, emit, rim, alpha, coat, sss, glass, emit_color)
    if key in _MATS and name is None:
        return _MATS[key]
    m = bpy.data.materials.new(name or ('M_' + str(color).strip('#')))
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = lin(color)
    p.inputs['Roughness'].default_value = rough
    p.inputs['Metallic'].default_value = metal
    if coat:
        p.inputs['Coat Weight'].default_value = coat
    if sss:
        p.inputs['Subsurface Weight'].default_value = sss
        p.inputs['Subsurface Radius'].default_value = (0.4, 0.15, 0.1)
        p.inputs['Subsurface Scale'].default_value = 0.05
    if glass:
        p.inputs['Transmission Weight'].default_value = glass
        p.inputs['Roughness'].default_value = min(rough, 0.08)
        p.inputs['IOR'].default_value = 1.45
    ec = emit_color or color
    if emit:
        p.inputs['Emission Color'].default_value = lin(ec)
        p.inputs['Emission Strength'].default_value = emit
    elif rim:
        lw = nt.nodes.new('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.35
        mr = nt.nodes.new('ShaderNodeMath'); mr.operation = 'POWER'; mr.inputs[1].default_value = 2.0
        mm = nt.nodes.new('ShaderNodeMath'); mm.operation = 'MULTIPLY'; mm.inputs[1].default_value = rim
        nt.links.new(lw.outputs['Facing'], mr.inputs[0]); nt.links.new(mr.outputs[0], mm.inputs[0])
        p.inputs['Emission Color'].default_value = lin(lighter(color, 0.45))
        nt.links.new(mm.outputs[0], p.inputs['Emission Strength'])
    if alpha < 1:
        p.inputs['Alpha'].default_value = alpha
        try:
            m.surface_render_method = 'BLENDED'
        except Exception:
            pass
    if glass:
        try:
            m.surface_render_method = 'BLENDED'
            m.use_transparency_overlap = True
        except Exception:
            pass
    m.diffuse_color = lin(color)
    if name is None:
        _MATS[key] = m
    return m


def glowmat(color, strength=4.0):
    """Pure emission: things that shine (sun, bulb, magma, signals)."""
    key = ('glow', color, strength)
    if key in _MATS:
        return _MATS[key]
    m = bpy.data.materials.new('G_' + str(color).strip('#'))
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    e = nt.nodes.new('ShaderNodeEmission')
    e.inputs[0].default_value = lin(color)
    e.inputs[1].default_value = strength
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(e.outputs[0], o.inputs[0])
    _MATS[key] = m
    return m


def vcolmat(rough=0.7, attr='Col', rim=0.1, name='VCol'):
    """A material coloured by the mesh's colour attribute (terrain, layers)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    a = nt.nodes.new('ShaderNodeAttribute'); a.attribute_name = attr
    nt.links.new(a.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough
    return m


def fademat(color='#0b1430', radius=1.0, opacity=0.9, rough=0.6):
    """A floor disc that fades to nothing at its rim, so it sits on the backdrop."""
    m = bpy.data.materials.new('Floor')
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = lin(color)
    p.inputs['Roughness'].default_value = rough
    tc = nt.nodes.new('ShaderNodeTexCoord')
    ln = nt.nodes.new('ShaderNodeVectorMath'); ln.operation = 'LENGTH'
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = radius * 0.25
    mr.inputs['From Max'].default_value = radius
    mr.inputs['To Min'].default_value = opacity
    mr.inputs['To Max'].default_value = 0.0
    mr.interpolation_type = 'SMOOTHSTEP'
    nt.links.new(tc.outputs['Object'], ln.inputs[0]); nt.links.new(ln.outputs['Value'], mr.inputs['Value'])
    nt.links.new(mr.outputs[0], p.inputs['Alpha'])
    try:
        m.surface_render_method = 'BLENDED'
    except Exception:
        pass
    return m


# ------------------------------------------------------------- geometry
def link(ob, parent=None):
    bpy.context.scene.collection.objects.link(ob)
    if parent is not None:
        ob.parent = parent
    return ob


def empty(name='Group', loc=(0, 0, 0), rot=(0, 0, 0), scale=1.0, parent=None):
    ob = bpy.data.objects.new(name, None)
    ob.location = loc
    ob.rotation_euler = rot
    ob.scale = (scale,) * 3 if isinstance(scale, (int, float)) else scale
    return link(ob, parent)


def from_bm(bm, name='Mesh', m=None, loc=(0, 0, 0), rot=(0, 0, 0), scale=1.0, smooth=True, parent=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    if m is not None:
        for mm in (m if isinstance(m, (list, tuple)) else [m]):
            me.materials.append(mm)
    ob.location = loc
    ob.rotation_euler = rot
    ob.scale = (scale,) * 3 if isinstance(scale, (int, float)) else scale
    return link(ob, parent)


def from_data(verts, faces, name='Mesh', m=None, smooth=True, **kw):
    bm = bmesh.new()
    vs = [bm.verts.new(v) for v in verts]
    for f in faces:
        try:
            bm.faces.new([vs[i] for i in f])
        except ValueError:
            pass
    bm.normal_update()
    return from_bm(bm, name, m, smooth=smooth, **kw)


def sphere(r=1.0, m=None, seg=48, rings=24, **kw):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    return from_bm(bm, kw.pop('name', 'Sphere'), m, **kw)


def ellipsoid(radii, m=None, loc=(0, 0, 0), rot=(0, 0, 0), seg=48, rings=24, **kw):
    """A sphere stretched to radii and turned by rot, baked into the mesh
    (so the object has no scale: offsets on it are plain units)."""
    ob = sphere(1.0, m, seg, rings, loc=loc, **kw)
    bake(ob, Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal(tuple(radii) + (1,)))
    return ob


def blob(radii, m=None, loc=(0, 0, 0), rot=(0, 0, 0), subdiv=5, lumps=0.0, lump_scale=1.2, seed=0, **kw):
    """An organic ellipsoid from an icosphere (even triangles, so it can be
    lumpy and still cut cleanly with booleans)."""
    ob = ico(1.0, m, subdiv, loc=loc, **kw)
    bake(ob, Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal(tuple(radii) + (1,)))
    if lumps:
        wobble(ob, lumps, lump_scale, seed)
    return ob


def bake(ob, M):
    """Transform the mesh itself by M (about the object's origin)."""
    ob.data.transform(M)
    ob.data.update()
    return ob


def ico(r=1.0, m=None, subdiv=3, smooth=True, **kw):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=r)
    return from_bm(bm, kw.pop('name', 'Ico'), m, smooth=smooth, **kw)


def box(size=(1, 1, 1), m=None, bevel=0.0, seg=3, **kw):
    """A box of full size (x, y, z), centred; bevel rounds its edges."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    if bevel:
        bmesh.ops.bevel(bm, geom=bm.edges[:] + bm.verts[:], offset=bevel, segments=seg, affect='EDGES', profile=0.5)
    ob = from_bm(bm, kw.pop('name', 'Box'), m, smooth=kw.pop('smooth', bool(bevel)), **kw)
    if bevel:
        _autosmooth(ob)
    return ob


def _autosmooth(ob, angle=40):
    try:
        ob.data.set_sharp_from_angle(angle=math.radians(angle))
    except Exception:
        pass


def cyl(r=0.5, depth=1.0, m=None, verts=48, r2=None, cap=True, **kw):
    """A cylinder (or cone/frustum with r2) standing on z, centred."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=cap, cap_tris=False, segments=verts, radius1=r, radius2=r if r2 is None else r2, depth=depth)
    ob = from_bm(bm, kw.pop('name', 'Cyl'), m, smooth=kw.pop('smooth', True), **kw)
    _autosmooth(ob, 50)
    return ob


def cone(r=0.5, depth=1.0, m=None, verts=48, **kw):
    return cyl(r, depth, m, verts, r2=0.0, **kw)


def torus(R=1.0, r=0.1, m=None, seg=64, ring=16, arc=TAU, **kw):
    verts, faces = [], []
    closed = arc >= TAU - 1e-6
    ns = seg if closed else seg + 1
    for i in range(ns):
        a = arc * i / seg
        for j in range(ring):
            b = TAU * j / ring
            verts.append(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b)))
    for i in range(seg):
        i2 = (i + 1) % ns
        for j in range(ring):
            j2 = (j + 1) % ring
            faces.append((i * ring + j, i2 * ring + j, i2 * ring + j2, i * ring + j2))
    return from_data(verts, faces, kw.pop('name', 'Torus'), m, **kw)


def lathe(profile, m=None, seg=64, arc=TAU, start=0.0, **kw):
    """Revolve a profile [(radius, z), ...] round the z axis (vases, bulbs,
    rockets, teeth, lenses, volcanoes). arc < TAU leaves it cut open."""
    closed = arc >= TAU - 1e-6
    ns = seg if closed else seg + 1
    n = len(profile)
    verts = []
    for i in range(ns):
        a = start + arc * i / seg
        for r, z in profile:
            verts.append((r * math.cos(a), r * math.sin(a), z))
    faces = []
    for i in range(seg):
        i2 = (i + 1) % ns
        for j in range(n - 1):
            faces.append((i * n + j, i2 * n + j, i2 * n + j + 1, i * n + j + 1))
    ob = from_data(verts, faces, kw.pop('name', 'Lathe'), m, **kw)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data); bm.free()
    return ob


def prism(points2d, depth=1.0, m=None, **kw):
    """Extrude a 2D outline [(x, y), ...] along z, centred on z=0."""
    n = len(points2d)
    verts = [(x, y, -depth / 2) for x, y in points2d] + [(x, y, depth / 2) for x, y in points2d]
    faces = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
    faces += [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    ob = from_data(verts, faces, kw.pop('name', 'Prism'), m, smooth=kw.pop('smooth', False), **kw)
    bm = bmesh.new(); bm.from_mesh(ob.data)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(ob.data); bm.free()
    return ob


def tube(points, r=0.05, m=None, closed=False, kind='POLY', res=12, taper=None, fill_caps=True, name='Tube', parent=None, radii=None):
    """A round tube along 3D points (vessels, wires, field lines, orbits).
    kind 'BEZIER' smooths a few points with automatic handles."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = r
    cu.bevel_resolution = max(1, res // 4)
    cu.use_fill_caps = fill_caps
    sp = cu.splines.new(kind)
    if kind == 'BEZIER':
        sp.bezier_points.add(len(points) - 1)
        for bp, p in zip(sp.bezier_points, points):
            bp.co = p
            bp.handle_left_type = bp.handle_right_type = 'AUTO'
        if radii:
            for bp, rr in zip(sp.bezier_points, radii):
                bp.radius = rr
        cu.resolution_u = res
    else:
        sp.points.add(len(points) - 1)
        for sp_p, p in zip(sp.points, points):
            sp_p.co = (p[0], p[1], p[2], 1)
        if radii:
            for sp_p, rr in zip(sp.points, radii):
                sp_p.radius = rr
    sp.use_cyclic_u = closed
    ob = bpy.data.objects.new(name, cu)
    if m is not None:
        cu.materials.append(m)
    return link(ob, parent)


def ring(R=1.0, r=0.01, m=None, n=128, z=0.0, **kw):
    pts = [(R * math.cos(TAU * i / n), R * math.sin(TAU * i / n), z) for i in range(n)]
    return tube(pts, r, m, closed=True, **kw)


def text(body, size=0.3, m=None, loc=(0, 0, 0), rot=(math.pi / 2, 0, 0), extrude=0.02, align='CENTER', parent=None):
    cu = bpy.data.curves.new('Text', 'FONT')
    cu.body = body
    cu.size = size
    cu.extrude = extrude
    cu.align_x = align
    cu.align_y = 'CENTER'
    ob = bpy.data.objects.new('Text', cu)
    if m is not None:
        cu.materials.append(m)
    ob.location = loc
    ob.rotation_euler = rot
    return link(ob, parent)


# ------------------------------------------------------------ modifiers
SOLVER = 'EXACT'   # a scene may set common.SOLVER = 'MANIFOLD' (sturdier on unions)
def subsurf(ob, levels=2):
    md = ob.modifiers.new('Sub', 'SUBSURF')
    md.levels = md.render_levels = levels
    return ob


def bevel(ob, width=0.02, seg=3):
    md = ob.modifiers.new('Bevel', 'BEVEL')
    md.width = width
    md.segments = seg
    md.limit_method = 'ANGLE'
    return ob


def as_mesh(ob):
    """A curve or text object turned into a mesh object (same place, material)."""
    if ob.type == 'MESH':
        return ob
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    new = bpy.data.objects.new(ob.name + '_m', me)
    new.matrix_world = ob.matrix_world.copy()
    link(new)
    bpy.data.objects.remove(ob, do_unlink=True)
    return new


def cut(ob, cutter, apply=True, op='DIFFERENCE', solver=None):
    """Boolean: cut ob with cutter (a cutaway), then remove the cutter."""
    cutter = as_mesh(cutter)
    bpy.context.view_layer.update()
    md = ob.modifiers.new('Cut', 'BOOLEAN')
    md.operation = op
    md.object = cutter
    md.solver = solver or SOLVER
    try:
        md.material_mode = 'TRANSFER'   # the cut faces take the cutter's material
    except Exception:
        pass
    if apply:
        apply_mods(ob)
        bpy.data.objects.remove(cutter, do_unlink=True)
    else:
        cutter.hide_render = True
    return ob


def cut_many(obs, cutter, op='DIFFERENCE'):
    """Cut several objects with one cutter, then remove it."""
    cutter = as_mesh(cutter)
    bpy.context.view_layer.update()
    for ob in obs:
        md = ob.modifiers.new('Cut', 'BOOLEAN')
        md.operation = op
        md.object = cutter
        md.solver = 'EXACT'
        try:
            md.material_mode = 'TRANSFER'
        except Exception:
            pass
        apply_mods(ob)
    bpy.data.objects.remove(cutter, do_unlink=True)


def apply_mods(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    ob.modifiers.clear()
    old = ob.data
    ob.data = me
    if old.users == 0:
        bpy.data.meshes.remove(old)
    return ob


def wobble(ob, amount=0.05, scale=1.5, seed=0):
    """Organic lumps: move each vertex along its normal by noise."""
    me = ob.data
    off = Vector((seed * 7.1, seed * 3.3, seed * 5.7))
    for v in me.vertices:
        v.co += v.normal * amount * noise.noise(v.co * scale + off)
    me.update()
    return ob


def merge_instances(src, mats, name='Swarm', m=None, parent=None):
    """One mesh holding a copy of src's mesh at every matrix (fast swarms)."""
    me = src.data if hasattr(src, 'data') else src
    bm = bmesh.new()
    for M in mats:
        tmp = me.copy()
        tmp.transform(M)
        bm.from_mesh(tmp)
        bpy.data.meshes.remove(tmp)
    if hasattr(src, 'data') and src.name in bpy.context.scene.objects:
        mm = src.active_material
        bpy.data.objects.remove(src, do_unlink=True)
        m = m or mm
    return from_bm(bm, name, m, parent=parent)


def place(loc=(0, 0, 0), rot=(0, 0, 0), s=1.0):
    S = Matrix.Diagonal((s, s, s, 1)) if isinstance(s, (int, float)) else Matrix.Diagonal(tuple(s) + (1,))
    return Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4() @ S


def terrain(size=(10, 10), res=(160, 160), height=None, color=None, name='Terrain', m=None, loc=(0, 0, 0)):
    """A grid shaped by height(x, y) and coloured by color(x, y, z) -> hex,
    written to the 'Col' attribute (use vcolmat())."""
    sx, sy = size
    nx, ny = res
    verts, faces = [], []
    for j in range(ny + 1):
        for i in range(nx + 1):
            x = -sx / 2 + sx * i / nx
            y = -sy / 2 + sy * j / ny
            verts.append((x, y, height(x, y) if height else 0.0))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    if color:
        at = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
        for k, v in enumerate(verts):
            at.data[k].color = lin(color(*v))
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    me.materials.append(m or vcolmat(name=name + 'Mat'))
    ob.location = loc
    return link(ob)


def floor(radius=4.0, z=0.0, color='#0a1230', opacity=0.75, glow_ring=None):
    """A soft pedestal disc that fades into the backdrop (catches shadows)."""
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=True, segments=96, radius=radius)
    ob = from_bm(bm, 'Floor', fademat(color, radius, opacity), loc=(0, 0, z), smooth=False)
    if glow_ring:
        ring(radius * 0.42, radius * 0.004, glowmat(glow_ring, 2.0), z=z + 0.002)
    return ob


def paint(ob, fn, attr='Col'):
    """Colour each vertex: fn(world_position) -> hex, into a colour attribute
    (pair with vcolmat())."""
    me = ob.data
    at = me.color_attributes.get(attr) or me.color_attributes.new(attr, 'FLOAT_COLOR', 'POINT')
    M = ob.matrix_world
    for v in me.vertices:
        at.data[v.index].color = lin(fn(M @ v.co))
    return ob


def colorize(ob, hexes):
    """Give an object several materials (by name order); returns indices."""
    ob.data.materials.clear()
    for h in hexes:
        ob.data.materials.append(h if isinstance(h, bpy.types.Material) else mat(h))
    return ob


# ------------------------------------------------------- parts and output
def P(label, at, note=None, ask=None):
    """A part to label: at is a point, an object, or (object, local offset)."""
    assert len(label) <= 22, label
    assert note is None or len(note) <= 70, note
    return {'label': label, 'at': at, 'note': note, 'ask': ask}


def _world(at):
    if isinstance(at, bpy.types.Object):
        return at.matrix_world.translation.copy()
    if isinstance(at, tuple) and len(at) == 2 and isinstance(at[0], bpy.types.Object):
        return at[0].matrix_world @ Vector(at[1])
    return Vector(at)


def project(at):
    sc = bpy.context.scene
    v = world_to_camera_view(sc, sc.camera, _world(at))
    return round(v.x, 4), round(1 - v.y, 4), v.z


def _render(path, res, samples):
    sc = bpy.context.scene
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.eevee.taa_render_samples = samples
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def finish(name, title, tags, parts, anim=None, frames=120, still_t=0.0, loop_samples=16):
    """Render the still (and the loop when anim(t) is given, t in [0, 1)),
    project the parts and write meta/<name>.json."""
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(META, exist_ok=True)
    os.makedirs(RENDERS, exist_ok=True)
    sc = bpy.context.scene
    assert 3 <= len(parts) <= 8, 'give 3 to 8 parts'
    if anim:
        anim(still_t)
    bpy.context.view_layer.update()
    rows = []
    for p in parts:
        x, y, z = project(p['at'])
        if not (0.02 <= x <= 0.98 and 0.02 <= y <= 0.98) or z <= 0:
            print(f'WARNING {name}: part "{p["label"]}" is outside the picture ({x}, {y})')
        row = {'label': p['label'], 'x': round(min(0.99, max(0.01, x)), 3), 'y': round(min(0.99, max(0.01, y)), 3)}
        if p.get('note'):
            row['note'] = p['note']
        if p.get('ask'):
            row['ask'] = p['ask']
        rows.append(row)
    t0 = time.time()
    samples = sc.eevee.taa_render_samples
    if '--loop-only' not in ARGS:
        png = os.path.join(OUT, name + '.png')
        _render(png, RES, samples)
        subprocess.run(['cwebp', '-quiet', '-q', '82', '-m', '6', png, '-o', os.path.join(RENDERS, name + '.webp')], check=True)
        print(f'STILL {name}: {time.time() - t0:.1f}s')
    meta = {'name': name, 'title': title, 'tags': tags, 'parts': rows}
    mp4 = os.path.join(RENDERS, name + '.mp4')
    if anim and '--no-loop' not in ARGS:
        fdir = os.path.join(OUT, name + '_frames')
        shutil.rmtree(fdir, ignore_errors=True)
        os.makedirs(fdir)
        tracks = [[] for _ in parts]
        t1 = time.time()
        for i in range(frames):
            anim(i / frames)
            bpy.context.view_layer.update()
            for k, p in enumerate(parts):
                x, y, _ = project(p['at'])
                tracks[k].append((x, y))
            _render(os.path.join(fdir, 'f%04d.png' % i), LOOP_RES, 12 if FAST else loop_samples)
        print(f'LOOP {name}: {frames} frames in {time.time() - t1:.0f}s')
        step = max(1, frames // 24)
        for k, tr in enumerate(tracks):
            if max(abs(x - tr[0][0]) + abs(y - tr[0][1]) for x, y in tr) > 0.006:
                rows[k]['track'] = [[round(x, 3), round(y, 3)] for x, y in tr[::step]]
        encode(fdir, mp4)
        meta['loop'] = True
    elif os.path.exists(mp4) and '--no-loop' not in ARGS:
        os.remove(mp4)
    elif os.path.exists(mp4):
        meta['loop'] = True
        old = os.path.join(META, name + '.json')
        if os.path.exists(old):
            prev = json.load(open(old))
            for r, q in zip(rows, prev.get('parts', [])):
                if 'track' in q and r['label'] == q['label']:
                    r['track'] = q['track']
    with open(os.path.join(META, name + '.json'), 'w') as f:
        json.dump(meta, f, indent=1)
    print(f'DONE {name}')


def encode(fdir, mp4, limit=2_000_000):
    for crf in (20, 23, 26, 29, 32, 35):
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '24', '-i', os.path.join(fdir, 'f%04d.png'),
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-pix_fmt', 'yuv420p', '-tune', 'animation',
                        '-movflags', '+faststart', '-an', mp4], check=True)
        if os.path.getsize(mp4) <= limit:
            break
    print(f'MP4 {os.path.basename(mp4)}: {os.path.getsize(mp4) / 1e6:.2f} MB (crf {crf})')


def earthmat(scale=1.1, seed=3.0, land=0.5, ice=0.86, rough=0.5, name='Earth', rim=0.6):
    """A crisp procedural Earth: blue oceans, green-brown land from noise,
    white polar caps (from the object's z). Good for globes and planets."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = rough
    tc = N('ShaderNodeTexCoord')
    nz = N('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = scale
    nz.inputs['Detail'].default_value = 6
    nz.inputs['Roughness'].default_value = 0.55
    try:
        nz.inputs['W'].default_value = seed
        nz.noise_dimensions = '4D'
    except Exception:
        pass
    L(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = N('ShaderNodeValToRGB')
    cr = ramp.color_ramp
    cr.interpolation = 'CONSTANT'
    cr.elements[0].position = 0.0; cr.elements[0].color = lin('#1d4fae')
    cr.elements[1].position = land - 0.04; cr.elements[1].color = lin('#2c7fd6')
    e = cr.elements.new(land); e.color = lin('#3f9e4d')
    e = cr.elements.new(land + 0.07); e.color = lin('#7fae4a')
    e = cr.elements.new(land + 0.13); e.color = lin('#b58b55')
    L(nz.outputs['Fac'], ramp.inputs['Fac'])
    sep = N('ShaderNodeSeparateXYZ'); L(tc.outputs['Object'], sep.inputs[0])
    nrm = N('ShaderNodeVectorMath'); nrm.operation = 'NORMALIZE'; L(tc.outputs['Object'], nrm.inputs[0])
    sep2 = N('ShaderNodeSeparateXYZ'); L(nrm.outputs[0], sep2.inputs[0])
    ab = N('ShaderNodeMath'); ab.operation = 'ABSOLUTE'; L(sep2.outputs['Z'], ab.inputs[0])
    st = N('ShaderNodeMath'); st.operation = 'GREATER_THAN'; st.inputs[1].default_value = ice; L(ab.outputs[0], st.inputs[0])
    mx = N('ShaderNodeMix'); mx.data_type = 'RGBA'
    L(st.outputs[0], mx.inputs['Factor']); L(ramp.outputs['Color'], mx.inputs['A']); mx.inputs['B'].default_value = lin('#f2f6ff')
    L(mx.outputs['Result'], p.inputs['Base Color'])
    lw = N('ShaderNodeLayerWeight'); lw.inputs['Blend'].default_value = 0.4
    mm = N('ShaderNodeMath'); mm.operation = 'MULTIPLY'; mm.inputs[1].default_value = rim
    L(lw.outputs['Facing'], mm.inputs[0])
    p.inputs['Emission Color'].default_value = lin('#7fb8ff')
    L(mm.outputs[0], p.inputs['Emission Strength'])
    return m


def flowmat(c1, c2, scale=4.0, strength=4.0, axis='Z', distort=3.0, name='Flow'):
    """Glowing banded emission (magma, lava, current, light). Animate by
    setting m['phase'] = 2*pi*t through set_phase(m, t): it loops cleanly."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    N, L = nt.nodes.new, nt.links.new
    tc = N('ShaderNodeTexCoord')
    w = N('ShaderNodeTexWave')
    w.wave_type = 'BANDS'
    w.bands_direction = axis
    w.inputs['Scale'].default_value = scale
    w.inputs['Distortion'].default_value = distort
    w.inputs['Detail'].default_value = 2
    L(tc.outputs['Object'], w.inputs['Vector'])
    ramp = N('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = lin(c1)
    ramp.color_ramp.elements[1].color = lin(c2)
    L(w.outputs['Fac'], ramp.inputs['Fac'])
    e = N('ShaderNodeEmission'); e.inputs['Strength'].default_value = strength
    L(ramp.outputs['Color'], e.inputs['Color'])
    o = N('ShaderNodeOutputMaterial'); L(e.outputs[0], o.inputs[0])
    m['wave'] = w.name
    return m


def set_phase(m, t, cycles=1):
    m.node_tree.nodes[m['wave']].inputs['Phase Offset'].default_value = -TAU * t * cycles


def bandmat(colors, scale=3.0, axis='Z', rough=0.8, name='Bands'):
    """Rock strata: horizontal bands of colours (for cut faces of the ground)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = rough
    tc = N('ShaderNodeTexCoord')
    w = N('ShaderNodeTexWave'); w.wave_type = 'BANDS'; w.bands_direction = axis
    w.wave_profile = 'SAW'
    w.inputs['Scale'].default_value = scale
    w.inputs['Distortion'].default_value = 1.5
    L(tc.outputs['Object'], w.inputs['Vector'])
    ramp = N('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'CONSTANT'
    cr = ramp.color_ramp
    cr.elements[0].color = lin(colors[0]); cr.elements[1].position = 1.0 / len(colors); cr.elements[1].color = lin(colors[1 % len(colors)])
    for k in range(2, len(colors)):
        e = cr.elements.new(k / len(colors)); e.color = lin(colors[k])
    L(w.outputs['Fac'], ramp.inputs['Fac']); L(ramp.outputs['Color'], p.inputs['Base Color'])
    return m


def brickmat(c1='#d9c49a', c2='#c4ab7c', mortar='#8f7c5c', scale=2.0, rough=0.85, name='Bricks', w=0.5, h=0.25):
    """Stone blocks or bricks (Brick Texture on object coordinates)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes.new, nt.links.new
    p = nt.nodes['Principled BSDF']
    p.inputs['Roughness'].default_value = rough
    tc = N('ShaderNodeTexCoord')
    b = N('ShaderNodeTexBrick')
    b.inputs['Color1'].default_value = lin(c1)
    b.inputs['Color2'].default_value = lin(c2)
    b.inputs['Mortar'].default_value = lin(mortar)
    b.inputs['Scale'].default_value = scale
    b.inputs['Mortar Size'].default_value = 0.015
    b.inputs['Brick Width'].default_value = w
    b.inputs['Row Height'].default_value = h
    # bricks run along x and z: feed (x + y, z) so both faces of a wall show courses
    sep = N('ShaderNodeSeparateXYZ'); L(tc.outputs['Object'], sep.inputs[0])
    add = N('ShaderNodeMath'); add.operation = 'ADD'; L(sep.outputs['X'], add.inputs[0]); L(sep.outputs['Y'], add.inputs[1])
    comb = N('ShaderNodeCombineXYZ'); L(add.outputs[0], comb.inputs['X']); L(sep.outputs['Z'], comb.inputs['Y'])
    L(comb.outputs[0], b.inputs['Vector'])
    L(b.outputs['Color'], p.inputs['Base Color'])
    return m
