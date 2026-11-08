// The shapes students learn, with what makes each one that shape: corners
// (in a 2 by 2 box, y down), which sides are equal (tick groups), right
// angles, lines of symmetry, and for solids their faces, edges and vertices.
// Used by the shape figure (public/figures.js) and to spot shape names in
// lesson text (shared/autoviz.js).
const r = (n, rot = -Math.PI / 2) => Array.from({ length: n }, (_, i) => [Math.cos(rot + (i / n) * Math.PI * 2), Math.sin(rot + (i / n) * Math.PI * 2)]);
const regular = (n, name) => ({ name, pts: r(n), equal: [Array.from({ length: n }, (_, i) => i)], right: n === 4 ? [0, 1, 2, 3] : [], sym: n, facts: [`${n} equal sides`, `${n} corners (vertices)`, `${n} lines of symmetry`, `Each angle ${+(((n - 2) * 180) / n).toFixed(1)}°`] });

export const SHAPES_2D = {
  circle: { name: 'Circle', round: 'circle', facts: ['1 curved side', 'No corners', 'Every point the same distance from the centre', 'Infinite lines of symmetry'] },
  semicircle: { name: 'Semicircle', round: 'semi', facts: ['1 curved side and 1 straight side', '2 corners', 'Half a circle', '1 line of symmetry'] },
  oval: { name: 'Oval', round: 'oval', facts: ['1 curved side', 'No corners', 'Like a stretched circle', '2 lines of symmetry'] },
  triangle: { name: 'Triangle', pts: [[0, -0.95], [0.95, 0.75], [-0.95, 0.75]], equal: [], right: [], sym: 0, facts: ['3 sides', '3 corners (vertices)', 'Angles add up to 180°'] },
  'equilateral triangle': { name: 'Equilateral triangle', pts: r(3), equal: [[0, 1, 2]], right: [], sym: 3, facts: ['3 equal sides', '3 equal angles of 60°', '3 lines of symmetry'] },
  'isosceles triangle': { name: 'Isosceles triangle', pts: [[0, -0.95], [0.62, 0.85], [-0.62, 0.85]], equal: [[0, 2]], right: [], sym: 1, facts: ['2 equal sides', '2 equal angles', '1 line of symmetry'] },
  'right-angled triangle': { name: 'Right-angled triangle', pts: [[-0.8, -0.9], [0.9, 0.8], [-0.8, 0.8]], equal: [], right: [2], sym: 0, facts: ['One angle is 90°', 'The longest side is the hypotenuse', 'Angles add up to 180°'] },
  'scalene triangle': { name: 'Scalene triangle', pts: [[-0.3, -0.9], [0.95, 0.8], [-0.95, 0.5]], equal: [], right: [], sym: 0, facts: ['No equal sides', 'No equal angles', 'No lines of symmetry'] },
  square: { name: 'Square', pts: [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]], equal: [[0, 1, 2, 3]], right: [0, 1, 2, 3], sym: 4, facts: ['4 equal sides', '4 right angles (90°)', '4 lines of symmetry', 'Opposite sides parallel'] },
  rectangle: { name: 'Rectangle', pts: [[-1, -0.6], [1, -0.6], [1, 0.6], [-1, 0.6]], equal: [[0, 2], [1, 3]], right: [0, 1, 2, 3], sym: 2, facts: ['4 sides, opposite sides equal', '4 right angles (90°)', '2 lines of symmetry'] },
  rhombus: { name: 'Rhombus', pts: [[0, -0.95], [0.65, 0], [0, 0.95], [-0.65, 0]], equal: [[0, 1, 2, 3]], right: [], sym: 2, facts: ['4 equal sides', 'Opposite angles equal', 'Diagonals cross at right angles'] },
  parallelogram: { name: 'Parallelogram', pts: [[-0.6, -0.6], [1, -0.6], [0.6, 0.6], [-1, 0.6]], equal: [[0, 2], [1, 3]], right: [], sym: 0, facts: ['Opposite sides equal and parallel', 'Opposite angles equal', 'No lines of symmetry'] },
  trapezium: { name: 'Trapezium', pts: [[-0.5, -0.6], [0.5, -0.6], [1, 0.6], [-1, 0.6]], equal: [[1, 3]], right: [], sym: 1, facts: ['One pair of parallel sides', '4 sides, 4 corners', 'Area = ½(a + b)h'] },
  kite: { name: 'Kite', pts: [[0, -0.95], [0.6, -0.3], [0, 0.95], [-0.6, -0.3]], equal: [[0, 3], [1, 2]], right: [], sym: 1, facts: ['2 pairs of equal sides next to each other', 'Diagonals cross at right angles', '1 line of symmetry'] },
  pentagon: regular(5, 'Pentagon'),
  hexagon: regular(6, 'Hexagon'),
  heptagon: regular(7, 'Heptagon'),
  octagon: regular(8, 'Octagon'),
  nonagon: regular(9, 'Nonagon'),
  decagon: regular(10, 'Decagon'),
  star: { name: 'Star', pts: Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2; const k = i % 2 ? 0.42 : 1; return [Math.cos(a) * k, Math.sin(a) * k]; }), equal: [], right: [], sym: 5, facts: ['10 sides', '5 points', '5 lines of symmetry'] },
};
SHAPES_2D.trapezoid = { ...SHAPES_2D.trapezium, name: 'Trapezoid' };
SHAPES_2D.ellipse = { ...SHAPES_2D.oval, name: 'Ellipse' };
SHAPES_2D['right triangle'] = SHAPES_2D['right-angled triangle'];

// Solids: vertices and faces (for the polyhedra) or a kind (curved solids).
const box = (w, h, d) => ({ v: [[-w, -h, -d], [w, -h, -d], [w, h, -d], [-w, h, -d], [-w, -h, d], [w, -h, d], [w, h, d], [-w, h, d]], f: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]] });
export const SHAPES_3D = {
  cube: { name: 'Cube', ...box(0.7, 0.7, 0.7), facts: ['6 square faces', '12 edges', '8 vertices'] },
  cuboid: { name: 'Cuboid', ...box(0.95, 0.55, 0.5), facts: ['6 rectangular faces', '12 edges', '8 vertices'] },
  'square-based pyramid': { name: 'Square-based pyramid', v: [[-0.75, 0.6, -0.75], [0.75, 0.6, -0.75], [0.75, 0.6, 0.75], [-0.75, 0.6, 0.75], [0, -0.9, 0]], f: [[0, 1, 2, 3], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]], facts: ['5 faces (1 square, 4 triangles)', '8 edges', '5 vertices'] },
  'triangular prism': { name: 'Triangular prism', v: [[-0.9, 0.6, -0.55], [0.9, 0.6, -0.55], [0.9, 0.6, 0.55], [-0.9, 0.6, 0.55], [-0.9, -0.6, 0], [0.9, -0.6, 0]], f: [[0, 1, 2, 3], [0, 1, 5, 4], [3, 2, 5, 4], [0, 3, 4], [1, 2, 5]], facts: ['5 faces (2 triangles, 3 rectangles)', '9 edges', '6 vertices'] },
  tetrahedron: { name: 'Tetrahedron', v: [[0, -0.9, 0], [-0.8, 0.6, -0.5], [0.8, 0.6, -0.5], [0, 0.6, 0.9]], f: [[1, 2, 3], [0, 1, 2], [0, 2, 3], [0, 3, 1]], facts: ['4 triangular faces', '6 edges', '4 vertices'] },
  sphere: { name: 'Sphere', kind: 'sphere', facts: ['1 curved surface', 'No edges', 'No vertices'] },
  cylinder: { name: 'Cylinder', kind: 'cylinder', facts: ['2 flat circular faces, 1 curved surface', '2 curved edges', 'No vertices'] },
  cone: { name: 'Cone', kind: 'cone', facts: ['1 flat circular face, 1 curved surface', '1 curved edge', '1 vertex (the apex)'] },
  hemisphere: { name: 'Hemisphere', kind: 'hemisphere', facts: ['1 flat face, 1 curved surface', '1 curved edge', 'Half a sphere'] },
};
SHAPES_3D.pyramid = SHAPES_3D['square-based pyramid'];
SHAPES_3D.prism = SHAPES_3D['triangular prism'];
SHAPES_3D.ball = SHAPES_3D.sphere;

export function findShape(name) {
  // The name as said first ("rhombus"), then without a plural s ("squares").
  const said = String(name || '').toLowerCase().trim().replace(/right angled/, 'right-angled');
  for (const n of [said, said.replace(/s$/, '')]) {
    if (Object.hasOwn(SHAPES_2D, n)) return { ...SHAPES_2D[n], key: n, solid: false };
    if (Object.hasOwn(SHAPES_3D, n)) return { ...SHAPES_3D[n], key: n, solid: true };
  }
  return null;
}

// Shape names in a text, most specific first ("isosceles triangle" before "triangle").
const NAMES = [...Object.keys(SHAPES_2D), ...Object.keys(SHAPES_3D)].sort((a, b) => b.length - a.length);
export function shapesIn(text) {
  const t = String(text).toLowerCase().replace(/right angled/g, 'right-angled');
  const out = [];
  let rest = t;
  for (const n of NAMES) {
    const re = new RegExp(`\\b${n.replace(/-/g, '[- ]')}(s|es)?\\b`, 'g');
    if (re.test(rest)) { out.push({ n, at: t.search(new RegExp(`\\b${n.replace(/-/g, '[- ]')}`)) }); rest = rest.replace(re, ' '); }
  }
  return out.sort((a, b) => a.at - b.at).map((x) => x.n);
}
