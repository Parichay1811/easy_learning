// Elements students meet most, with their electron shells, for the atom
// figure (public/figures.js) and the automatic pictures (shared/autoviz.js).
export const ELEMENTS = {
  H: ['Hydrogen', 1], He: ['Helium', 2], Li: ['Lithium', 3], Be: ['Beryllium', 4], B: ['Boron', 5], C: ['Carbon', 6], N: ['Nitrogen', 7], O: ['Oxygen', 8], F: ['Fluorine', 9], Ne: ['Neon', 10],
  Na: ['Sodium', 11], Mg: ['Magnesium', 12], Al: ['Aluminium', 13], Si: ['Silicon', 14], P: ['Phosphorus', 15], S: ['Sulfur', 16], Cl: ['Chlorine', 17], Ar: ['Argon', 18], K: ['Potassium', 19], Ca: ['Calcium', 20],
  Fe: ['Iron', 26, [2, 8, 14, 2]], Cu: ['Copper', 29, [2, 8, 18, 1]], Zn: ['Zinc', 30, [2, 8, 18, 2]], Ag: ['Silver', 47, [2, 8, 18, 18, 1]], Au: ['Gold', 79, [2, 8, 18, 32, 18, 1]],
};
export function element(v) {
  const t = String(v || '').trim();
  const sym = ELEMENTS[t] ? t : Object.keys(ELEMENTS).find((k) => ELEMENTS[k][0].toLowerCase() === t.toLowerCase() || (t.toLowerCase() === 'aluminum' && k === 'Al') || (t.toLowerCase() === 'sulphur' && k === 'S'));
  if (!sym) return null;
  const [name, z, given] = ELEMENTS[sym];
  const shells = given || [2, 8, 8, 2].reduce((acc, cap) => { const left = z - acc.reduce((a, b) => a + b, 0); if (left > 0) acc.push(Math.min(cap, left)); return acc; }, []);
  return { sym, name, z, shells };
}

