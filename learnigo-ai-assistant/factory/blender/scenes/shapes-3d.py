# 3D shapes: cube, cuboid, cylinder, cone, sphere, square pyramid, triangular prism.
import os, sys; sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
from common import *

reset()
floor(7, 0)
cube = box((1.1, 1.1, 1.1), mat('blue'), bevel=0.03, loc=(-2.7, 1.2, 0.55))
cub = box((1.9, 0.9, 0.9), mat('cyan'), bevel=0.03, loc=(-0.25, 1.3, 0.45))
cy = cyl(0.55, 1.3, mat('green'), loc=(2.3, 1.2, 0.65))
co = cone(0.65, 1.35, mat('orange'), loc=(-3.0, -1.2, 0.675))
sp = sphere(0.65, mat('red'), loc=(-1.0, -1.3, 0.65))
s = 0.65
py = from_data([(-s, -s, 0), (s, -s, 0), (s, s, 0), (-s, s, 0), (0, 0, 1.3)], [(3, 2, 1, 0), (0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)], 'Pyramid', mat('purple'), smooth=False, loc=(1.0, -1.4, 0), rot=(0, 0, 0.35))
tp = prism([(-0.65, 0), (0.65, 0), (0, 1.1)], 1.3, mat("yellow"), loc=(3.2, -1.2, 0), rot=(math.pi / 2, 0, -0.6))
cam = camera((0.2, -14.2, 8.6), (0.1, -0.35, 0.25), lens=50)
lights((0, 0, 0.5))
finish('shapes-3d', '3D shapes', ['3d shapes', 'solids', 'cube', 'cuboid', 'cylinder', 'cone', 'sphere', 'pyramid', 'prism', 'faces edges vertices', 'geometry'], [
    P('Cube', (cube, (0, 0, 0.55)), '6 equal square faces, 12 edges, 8 vertices'),
    P('Cuboid', (cub, (0, 0, 0.45)), '6 rectangular faces, like a brick or a box'),
    P('Cylinder', (cy, (0, 0, 0.65)), '2 circular faces and one curved surface'),
    P('Cone', (co, (0, 0, 0.3)), 'A circular base that rises to one point'),
    P('Sphere', sp, 'Perfectly round: every point the same distance from the centre'),
    P('Square pyramid', (py, (0, 0, 0.7)), 'A square base and 4 triangles meeting at the top'),
    P('Triangular prism', (tp, (0, 0.5, 0)), '2 triangle ends joined by 3 rectangles'),
])
