// Unit conversions, worked and drawn: "how much is 3000 metres in
// centimetres", "convert 5 km to m", "how many grams in 2.5 kg". The answer
// is computed, never guessed, and the board shows the conversion as a flow
// (from, times or divided by, to) beside the working.
const UNITS = [
  // [family, factor to the base unit, short, singular, plural, other spellings]
  ['length', 0.001, 'mm', 'millimetre', 'millimetres', 'millimeter|millimeters|mm'],
  ['length', 0.01, 'cm', 'centimetre', 'centimetres', 'centimeter|centimeters|cm|cms'],
  ['length', 1, 'm', 'metre', 'metres', 'meter|meters|m'],
  ['length', 1000, 'km', 'kilometre', 'kilometres', 'kilometer|kilometers|km|kms'],
  ['length', 0.0254, 'in', 'inch', 'inches', ''],
  ['length', 0.3048, 'ft', 'foot', 'feet', 'ft'],
  ['length', 0.9144, 'yd', 'yard', 'yards', 'yd'],
  ['length', 1609.344, 'mi', 'mile', 'miles', 'mi'],
  ['mass', 0.001, 'mg', 'milligram', 'milligrams', 'mg'],
  ['mass', 1, 'g', 'gram', 'grams', 'g|gm|gms'],
  ['mass', 1000, 'kg', 'kilogram', 'kilograms', 'kg|kgs|kilo|kilos'],
  ['mass', 1e6, 't', 'tonne', 'tonnes', 'ton|tons'],
  ['mass', 453.59237, 'lb', 'pound', 'pounds', 'lb|lbs'],
  ['mass', 28.349523125, 'oz', 'ounce', 'ounces', 'oz'],
  ['volume', 0.001, 'ml', 'millilitre', 'millilitres', 'milliliter|milliliters|ml'],
  ['volume', 0.01, 'cl', 'centilitre', 'centilitres', 'centiliter|centiliters|cl'],
  ['volume', 1, 'L', 'litre', 'litres', 'liter|liters|l'],
  ['time', 1, 's', 'second', 'seconds', 'sec|secs|s'],
  ['time', 60, 'min', 'minute', 'minutes', 'min|mins'],
  ['time', 3600, 'h', 'hour', 'hours', 'hr|hrs|h'],
  ['time', 86400, 'days', 'day', 'days', ''],
  ['time', 604800, 'weeks', 'week', 'weeks', ''],
];
const BY_NAME = new Map();
for (const u of UNITS) for (const name of [u[3], u[4], ...u[5].split('|')].filter(Boolean)) BY_NAME.set(name, u);
const NAMES = [...BY_NAME.keys()].sort((a, b) => b.length - a.length).map((n) => n.replace(/\./g, '\\.')).join('|');
const N = '(\\d[\\d,]*(?:\\.\\d+)?)';
const FORWARD = new RegExp(`${N}\\s*(${NAMES})\\b.*?\\b(?:in|to|into|as|in terms of)\\s+(?:a |an )?(${NAMES})\\b`);
const BACKWARD = new RegExp(`\\bhow many\\s+(${NAMES})\\b.*?\\b(?:in|are in|is in|make)\\s+(?:a |an )?${N}?\\s*(${NAMES})\\b`);

// A whole number as it is (the student's own 123,456,789), a bigger one to
// 4 decimals (123,456.789), a small one to 4 significant figures however
// small (1 mg is 0.000000001 tonnes).
const show = (n) => {
  if (Number.isInteger(n)) return n.toLocaleString('en-US');
  const clean = Number(n.toPrecision(12));
  return Math.abs(clean) >= 1 ? clean.toLocaleString('en-US', { maximumFractionDigits: 4 }) : Number(clean.toPrecision(4)).toLocaleString('en-US', { maximumFractionDigits: 20 });
};

export function parseConvert(t) {
  let m = t.match(FORWARD);
  let value;
  let from;
  let to;
  if (m) [value, from, to] = [m[1], m[2], m[3]];
  else if ((m = t.match(BACKWARD))) [to, value, from] = [m[1], m[2] || '1', m[3]];
  else return null;
  const a = BY_NAME.get(from);
  const b = BY_NAME.get(to);
  const v = Number(String(value).replace(/,/g, ''));
  if (!a || !b || a === b || a[0] !== b[0] || !Number.isFinite(v)) return null;
  return { value: v, from: a, to: b };
}

export function convertPlan({ value, from, to }) {
  const ratio = from[1] / to[1];
  const result = value * ratio;
  const up = ratio >= 1;
  const k = up ? ratio : 1 / ratio;
  const name = (u, n) => (n === 1 ? u[3] : u[4]);
  const op = up ? '×' : '÷';
  return {
    kind: 'solve', title: 'Converting units', context: { offer: 'test' },
    steps: [
      { say: `${up ? `One ${from[3]} is ${show(k)} ${name(to, k)}` : `One ${to[3]} is ${show(k)} ${name(from, k)}`}. So to go from ${from[4]} to ${to[4]}, you ${up ? 'multiply' : 'divide'} by ${show(k)}.`,
        draw: [{ op: 'clear' }, { op: 'title', text: 'Converting units' },
          { op: 'flow', items: [`${show(value)} ${from[2]}`, `${op} ${show(k)}`, `${show(result)} ${to[2]}`] },
          { op: 'formula', text: up ? `1 ${from[2]} = ${show(ratio)} ${to[2]}` : `1 ${to[2]} = ${show(k)} ${from[2]}`, at: 'So' }] },
      { say: `${show(value)} ${op === '×' ? 'times' : 'divided by'} ${show(k)} is ${show(result)}. So ${show(value)} ${name(from, value)} is ${show(result)} ${name(to, result)}.`,
        draw: [{ op: 'formula', text: `${show(value)} ${op} ${show(k)} = ${show(result)}` },
          { op: 'box', text: `${show(result)} ${to[2]}`, at: 'So', sfx: 'correct' }] },
      { say: up ? 'A smaller unit means more of them, so the number gets bigger.' : 'A bigger unit means fewer of them, so the number gets smaller.',
        draw: [{ op: 'note', text: up ? 'Smaller unit → bigger number' : 'Bigger unit → smaller number', at: 'number' }] },
    ],
  };
}
