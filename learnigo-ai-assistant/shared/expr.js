// A small maths expression parser for graphs on the board: "y = x^2 - 4",
// "f(x) = 2sin(x)", "3x + 1", "√x". Recursive descent, no eval, so text
// from a pack or a model can never run code. Returns a function of x, or
// null when the text is not an expression in x.
const FUNCS = { sin: Math.sin, cos: Math.cos, tan: Math.tan, sqrt: Math.sqrt, abs: Math.abs, log: Math.log10, ln: Math.log, exp: Math.exp };

export function parseExpr(text) {
  let s = String(text || '').toLowerCase()
    .replace(/^\s*(y|f\s*\(\s*x\s*\)|v|s|d)\s*=\s*/, '')
    .replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/').replace(/²/g, '^2').replace(/³/g, '^3').replace(/√/g, 'sqrt').replace(/π/g, 'pi')
    .replace(/\s+/g, '');
  if (!s || s.length > 80 || /[^0-9a-z.+\-*/^()]/.test(s)) return null;
  let i = 0;
  const peek = () => s[i];
  const eat = (c) => { if (s[i] === c) { i++; return true; } return false; };
  function primary() {
    if (eat('(')) { const v = add(); if (!eat(')')) throw new Error('missing )'); return v; }
    const num = s.slice(i).match(/^\d+(\.\d+)?|^\.\d+/);
    if (num) { i += num[0].length; const n = Number(num[0]); return () => n; }
    const word = s.slice(i).match(/^[a-z]+/);
    if (!word) throw new Error(`unexpected ${peek()}`);
    const w = word[0];
    for (const f of Object.keys(FUNCS)) {
      if (w.startsWith(f)) {
        i += f.length;
        const arg = peek() === '(' ? primary() : power();
        const fn = FUNCS[f];
        return (x) => fn(arg(x));
      }
    }
    if (w.startsWith('pi')) { i += 2; return () => Math.PI; }
    if (w[0] === 'x') { i += 1; return (x) => x; }
    if (w[0] === 'e') { i += 1; return () => Math.E; }
    throw new Error(`unknown ${w}`);
  }
  function power() {
    const base = primary();
    if (eat('^')) { const ex = unary(); return (x) => base(x) ** ex(x); }
    return base;
  }
  function unary() {
    if (eat('-')) { const v = unary(); return (x) => -v(x); }
    if (eat('+')) return unary();
    return power();
  }
  function mul() {
    let v = unary();
    for (;;) {
      if (eat('*')) { const a = v; const b = unary(); v = (x) => a(x) * b(x); } else if (eat('/')) { const a = v; const b = unary(); v = (x) => a(x) / b(x); } else if (peek() && /[0-9a-z(.]/.test(peek())) { const a = v; const b = unary(); v = (x) => a(x) * b(x); } else return v;
    }
  }
  function add() {
    let v = mul();
    for (;;) {
      if (eat('+')) { const a = v; const b = mul(); v = (x) => a(x) + b(x); } else if (eat('-')) { const a = v; const b = mul(); v = (x) => a(x) - b(x); } else return v;
    }
  }
  try {
    const f = add();
    if (i !== s.length) return null;
    if (!/x/.test(s.replace(/exp/g, ''))) return null;
    return f;
  } catch {
    return null;
  }
}

// "y = x^2 - 4" -> "y = x² − 4" for the board.
export function prettyExpr(text) {
  return String(text).replace(/\^2\b/g, '²').replace(/\^3\b/g, '³').replace(/\*/g, '×').replace(/sqrt/g, '√').replace(/(\d)-/g, '$1 − ').replace(/ - /g, ' − ');
}
