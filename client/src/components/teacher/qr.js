// A small QR code encoder (byte mode, error correction level M, versions 1-10), so a
// teacher can put the join link on the projector without a new dependency (TCH-011).
// Follows ISO/IEC 18004; layout steps mirror Project Nayuki's reference encoder (MIT).
//   const { size, modules } = encodeQr('https://learnigo.eu/join/ABC234');  // modules[y][x] true = dark

const TOTAL = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
const ECC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const BLOCKS = [0, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];

function gfMul(x, y) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree) {
  const result = new Array(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function rsRemainder(data, divisor) {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ result.shift();
    result.push(0);
    divisor.forEach((coef, i) => { result[i] ^= gfMul(coef, factor); });
  }
  return result;
}

const dataCapacity = (v) => TOTAL[v] - ECC_PER_BLOCK[v] * BLOCKS[v];

function codewords(bytes, version) {
  const ccBits = version <= 9 ? 8 : 16;
  const bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(0b0100, 4);
  put(bytes.length, ccBits);
  bytes.forEach((b) => put(b, 8));
  const capBits = dataCapacity(version) * 8;
  put(0, Math.min(4, capBits - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capBits; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));

  // Split into blocks (short blocks first), add error correction, interleave.
  const numBlocks = BLOCKS[version];
  const eccLen = ECC_PER_BLOCK[version];
  const raw = TOTAL[version];
  const numShort = numBlocks - (raw % numBlocks);
  const shortData = Math.floor(raw / numBlocks) - eccLen;
  const divisor = rsDivisor(eccLen);
  const dataBlocks = [];
  const eccBlocks = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const len = shortData + (i < numShort ? 0 : 1);
    const block = data.slice(k, k + len);
    k += len;
    dataBlocks.push(block);
    eccBlocks.push(rsRemainder(block, divisor));
  }
  const out = [];
  for (let i = 0; i <= shortData; i++) dataBlocks.forEach((b) => { if (i < b.length) out.push(b[i]); });
  for (let i = 0; i < eccLen; i++) eccBlocks.forEach((b) => out.push(b[i]));
  return out;
}

function alignmentPositions(version, size) {
  if (version === 1) return [];
  const num = Math.floor(version / 7) + 2;
  const step = Math.ceil((version * 4 + 4) / (num * 2 - 2)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < num; pos -= step) result.splice(1, 0, pos);
  return result;
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function build(version, data, mask) {
  const size = version * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(false));
  const fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (x, y, dark) => { m[y][x] = dark; fn[y][x] = true; };

  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy;
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      set(x, y, d !== 2 && d !== 4);
    }
  };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const al = alignmentPositions(version, size);
  al.forEach((ay, i) => al.forEach((ax, j) => {
    if ((i === 0 && j === 0) || (i === 0 && j === al.length - 1) || (i === al.length - 1 && j === 0)) return;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }));

  const formatBits = (mk) => {
    const d = (0 << 3) | mk; // level M = 00
    let rem = d;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    return ((d << 10) | rem) ^ 0x5412;
  };
  const drawFormat = (mk) => {
    const bits = formatBits(mk);
    const bit = (i) => ((bits >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  drawFormat(0); // reserve the areas

  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3), b = Math.floor(i / 3);
      set(a, b, dark); set(b, a, dark);
    }
  }

  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!fn[y][x] && i < data.length * 8) {
          m[y][x] = ((data[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
          i++;
        }
      }
    }
  }

  const f = MASKS[mask];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && f(x, y)) m[y][x] = !m[y][x];
  drawFormat(mask);
  return m;
}

// Lower is better: runs, 2x2 blocks, finder look-alikes, dark/light balance.
function penalty(m) {
  const size = m.length;
  let p = 0;
  const lines = [];
  for (let y = 0; y < size; y++) lines.push(m[y]);
  for (let x = 0; x < size; x++) lines.push(m.map((row) => row[x]));
  for (const line of lines) {
    let run = 1;
    for (let k = 1; k <= size; k++) {
      if (k < size && line[k] === line[k - 1]) run++;
      else { if (run >= 5) p += run - 2; run = 1; }
    }
    const s = line.map((d) => (d ? '1' : '0')).join('');
    for (const pat of ['10111010000', '00001011101']) {
      let at = s.indexOf(pat);
      while (at !== -1) { p += 40; at = s.indexOf(pat, at + 1); }
    }
  }
  for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
    const c = m[y][x];
    if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
  }
  const dark = m.reduce((a, row) => a + row.filter(Boolean).length, 0);
  p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
  return p;
}

export function encodeQr(text) {
  const bytes = Array.from(new TextEncoder().encode(String(text)));
  let version = 1;
  while (version <= 10 && 4 + (version <= 9 ? 8 : 16) + bytes.length * 8 > dataCapacity(version) * 8) version++;
  if (version > 10) throw new Error('Text too long for this QR encoder');
  const data = codewords(bytes, version);
  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const m = build(version, data, mask);
    const score = penalty(m);
    if (!best || score < best.score) best = { m, score, mask };
  }
  return { version, size: best.m.length, mask: best.mask, modules: best.m };
}

// SVG path ("M x y h1 v1 h-1 z" per dark module) with a 4-module quiet zone.
export function qrPath(modules) {
  let d = '';
  modules.forEach((row, y) => row.forEach((dark, x) => { if (dark) d += `M${x + 4} ${y + 4}h1v1h-1z`; }));
  return d;
}
