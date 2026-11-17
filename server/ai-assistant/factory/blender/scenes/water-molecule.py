# A water molecule, H2O: one oxygen atom joined to two hydrogen atoms by
# covalent bonds (shared electrons), 104.5 degrees apart. Oxygen pulls the
# shared electrons harder, so it is slightly negative and the hydrogens
# slightly positive. Two lone pairs of electrons sit on the oxygen.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
oxy = mat('#fb5a6e', rough=0.3, rim=0.4, coat=0.5)
hyd = mat('#eef2fb', rough=0.3, rim=0.4, coat=0.5)
bond = mat('#c9d2e8', rough=0.35, rim=0.2)
cloud = mat('#a78bfa', alpha=0.18, emit=0.5, rim=0.6)
arcm = glowmat('#fbbf24', 3)
neg = mat('#5b8cff', alpha=0.12, emit=0.8)

mol = empty('Water', rot=(math.radians(-8), 0, math.radians(28)))
half = math.radians(104.5 / 2)
L = 1.6
O = Vector((0, 0, 0.35))
H = [O + Vector((-math.sin(half) * L, 0, -math.cos(half) * L)), O + Vector((math.sin(half) * L, 0, -math.cos(half) * L))]
o = sphere(0.78, oxy, seg=64, rings=32, loc=O, parent=mol)
hs = [sphere(0.45, hyd, seg=48, rings=24, loc=h, parent=mol) for h in H]
for h in H:
    tube([tuple(O), tuple(h)], 0.12, bond, parent=mol)
# the bond angle: a glowing fan between the two bonds
fan = [tuple(O + Vector((0, -0.02, 0)))]
for i in range(25):
    a = -half + 2 * half * i / 24
    fan.append(tuple(O + Vector((math.sin(a) * 1.2, -0.02, -math.cos(a) * 1.2))))
from_data(fan, [(0, i, i + 1) for i in range(1, 25)], 'Angle', mat('#fbbf24', alpha=0.18, emit=1.0), parent=mol)
tube(fan[1:], 0.02, arcm, parent=mol)
arc = fan[1:]
# two lone pairs on top of the oxygen
lobes = []
for s in (-1, 1):
    d = Vector((s * 0.45, 0.75, 0.75)).normalized()
    lb = blob((0.34, 0.34, 0.6), cloud, loc=O + d * 0.95, subdiv=4, parent=mol)
    lb.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    lobes.append(lb)

cam = camera((0, -8.4, 0.9), (0, 0, -0.05), lens=50)
lights((0, 0, 0), rim='#a78bfa')
finish('water-molecule', 'Water molecule (H2O)', ['water molecule', 'h2o', 'covalent bond', 'oxygen', 'hydrogen', 'bond angle', 'polar molecule', 'lone pair', 'chemistry'], [
    P('Oxygen atom', (o, (0.0, -0.78, 0.0)), 'Slightly negative: pulls the shared electrons'),
    P('Hydrogen atom', (hs[1], (0, -0.45, 0)), 'Slightly positive end of the molecule'),
    P('Covalent bond', (mol, tuple((O + H[0]) / 2 + Vector((0, -0.12, 0)))), 'A pair of electrons shared between two atoms'),
    P('Bond angle', (mol, arc[12]), '104.5 degrees: the lone pairs push the H atoms down'),
    P('Lone pair', lobes[1], 'Two electrons not used in bonding'),
])
