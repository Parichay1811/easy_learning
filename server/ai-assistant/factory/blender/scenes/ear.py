# The ear in cross-section: the outer ear funnels sound down the ear canal
# to the eardrum; three tiny bones (ossicles) pass the shake to the cochlea,
# which turns it into nerve signals. Semicircular canals sense balance.
# The inner parts are drawn bigger than life so they can be seen.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
skin = mat('#f0b48f', rough=0.55, rim=0.25)
flesh = mat('#d98c78', rough=0.65, rim=0.05)
bonecut = mat('#d8c7a2', rough=0.7, rim=0.05)
canalm = mat('#c9705e', rough=0.6, rim=0.1)
midm = mat('#5a2a3a', rough=0.7)
innm = mat('#3b2c5c', rough=0.7)
drum = mat('#ffc2cf', rough=0.4, rim=0.4)
bone = mat('#fff4dc', rough=0.4, rim=0.35)
coch = mat('#a78bfa', rough=0.4, rim=0.4)
semi = mat('#22d3ee', rough=0.35, rim=0.4)
nerve = mat('#fbbf24', rough=0.45, rim=0.3)
eust = mat('#fb7185', rough=0.45, rim=0.3)
wave = glowmat('#9fd8ff', 3)

# the side of the head, cut open: soft tissue on the left, skull bone on the right
soft = box((1.4, 1.2, 3.4), flesh, loc=(-0.9, 0.6, 0))
hard = box((3.0, 1.2, 3.4), bonecut, loc=(1.3, 0.6, 0))
canal_cut = cyl(0.21, 2.0, canalm, loc=(-0.9, 0, 0.08), rot=(0, math.pi / 2, 0))
cut(soft, canal_cut)
cut(hard, blob((0.42, 0.55, 0.6), midm, loc=(-0.05, 0, 0.2), subdiv=3))         # middle ear cavity
cut(hard, blob((0.85, 0.55, 0.95), innm, loc=(0.95, 0, 0.15), subdiv=3))        # inner ear cavity
cut(hard, tube([(0.0, 0, -0.2), (0.25, 0, -0.9), (0.6, 0, -1.8)], 0.12, eust, kind='BEZIER'))
cut(hard, cyl(0.12, 1.5, nerve, loc=(1.9, 0, 0.15), rot=(0, math.pi / 2, 0)))
for ob in (soft, hard):
    apply_mods(ob)
# the outer ear (pinna) in section: a curled flap round the opening
outline = [(-1.5, 1.0), (-2.0, 1.45), (-2.5, 1.55), (-2.85, 1.15), (-2.95, 0.5), (-2.75, -0.1), (-2.45, -0.6), (-2.35, -1.0), (-2.05, -1.12), (-1.85, -0.8), (-1.5, -0.55),
           (-1.5, -0.25), (-1.9, -0.42), (-2.22, -0.28), (-2.45, 0.2), (-2.45, 0.78), (-2.25, 1.15), (-1.95, 1.18), (-1.5, 0.75)]
pinna = prism(outline, 0.5, skin, rot=(math.pi / 2, 0, 0), loc=(0, 0.25, 0))
bevel(pinna, 0.06, 3)
# eardrum and the ossicles: hammer, anvil, stirrup
ed = cyl(0.25, 0.025, drum, verts=48, loc=(-0.25, 0, 0.08), rot=(0, math.radians(75), 0))
tube([(-0.22, -0.05, -0.08), (-0.18, -0.05, 0.2), (-0.15, -0.05, 0.42)], 0.04, bone, kind='BEZIER')
sphere(0.11, bone, loc=(-0.13, -0.05, 0.5))
anvil = blob((0.13, 0.1, 0.11), bone, loc=(0.05, -0.05, 0.5), subdiv=3)
tube([(0.08, -0.05, 0.42), (0.12, -0.05, 0.25), (0.16, -0.05, 0.16)], 0.035, bone, kind='BEZIER')
torus(0.09, 0.02, bone, seg=24, ring=6, arc=math.pi, loc=(0.25, -0.05, 0.16), rot=(math.pi / 2, 0, -math.pi / 2))
box((0.035, 0.1, 0.22), bone, loc=(0.34, -0.05, 0.16))
# cochlea: a tapering spiral of about 2.5 turns
C = Vector((1.0, -0.05, -0.2))
pts, rr = [], []
for i in range(161):
    a = i / 160 * 2.6 * TAU
    r = 0.45 * (1 - i / 200)
    pts.append(tuple(C + Vector((r * math.cos(a), -0.15 * i / 160, r * math.sin(a)))))
    rr.append(1 - 0.6 * i / 160)
cochlea = tube(pts, 0.12, coch, radii=rr, name='Cochlea')
blob((0.2, 0.15, 0.2), coch, loc=(0.48, -0.05, 0.22), subdiv=3)   # vestibule
# semicircular canals: three loops at right angles
V = Vector((0.75, -0.05, 0.6))
for rot, off in (((math.pi / 2, 0, 0), (0.0, 0.0, 0.22)), ((math.pi / 2, 0, math.pi / 2), (0.3, 0.0, 0.15)), ((0, 0, 0), (0.22, 0.0, 0.0))):
    torus(0.22, 0.04, semi, seg=48, ring=8, loc=tuple(V + Vector(off)), rot=rot)
tube([tuple(C + Vector((0.1, -0.05, 0.25))), (1.6, -0.05, 0.18), (2.75, -0.05, 0.15)], 0.09, nerve, kind='BEZIER')
tube([(0.0, -0.05, -0.15), (0.25, -0.05, -0.9), (0.6, -0.05, -1.8)], 0.07, eust, kind='BEZIER')
# sound waves arriving at the outer ear
for k in range(3):
    R = 0.45 + 0.25 * k
    tube([(-4.15 + R * math.cos(a), -0.1, 0.25 + R * math.sin(a)) for a in [math.radians(-45 + 90 * i / 20) for i in range(21)]], 0.018, wave)

cam = camera((-0.55, -10.2, 0.8), (-0.55, 0, 0.0), lens=50)
lights((0, 0, 0), rim='#a78bfa')
finish('ear', 'The human ear', ['ear', 'hearing', 'sound', 'eardrum', 'cochlea', 'ossicles', 'balance', 'semicircular canals', 'human body'], [
    P('Outer ear', (-2.85, -0.05, 0.6), 'Collects sound and funnels it into the ear'),
    P('Ear canal', (-1.0, -0.05, 0.08), 'Carries sound to the eardrum'),
    P('Eardrum', (-0.25, -0.05, -0.1), 'A thin skin that shakes when sound hits it'),
    P('Ossicles', (0.05, -0.12, 0.5), 'Three tiny bones: hammer, anvil and stirrup'),
    P('Cochlea', tuple(C + Vector((0.42, -0.1, -0.15))), 'Snail-shaped: turns shakes into nerve signals'),
    P('Semicircular canals', tuple(V + Vector((0.05, -0.1, 0.43))), 'Fluid loops that sense balance and turning'),
    P('Auditory nerve', (2.2, -0.12, 0.16), 'Carries the signals to the brain'),
    P('Eustachian tube', (0.45, -0.1, -1.4), 'Links the middle ear to the throat'),
])
