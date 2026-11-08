// History simulations for the board: living scenes for the big stories of
// the past, from the pyramids of Giza and the streets of Mohenjo-daro to the
// Moon landing and the internet. Each one tells its story in stages, with a
// caption for each stage: blocks hauled up a ramp, a longship rowing, a press
// printing, a wall coming down. People are simple, dignified silhouettes;
// war and suffering are told soberly, through causes, lives, change and
// remembrance. Each is a function of time (t since it appeared, b.clock for
// the loop), so any moment can be drawn: plain canvas calls, very few glows,
// no state between frames beyond constants cached on the item. HISTORY_SIMS
// says what each one is for, so a lesson's words can pick the right picture.

export const HISTORY_SIMS = {
  'pyramid-building': { title: 'Building the Great Pyramid', keywords: ['great pyramid', 'pyramids of giza', 'great pyramid of giza', 'how the pyramids were built', 'building the pyramids', 'pharaoh khufu', 'egyptian pyramids'], example: {} },
  'indus-city': { title: 'Mohenjo-daro, an Indus city', keywords: ['indus valley civilisation', 'indus valley civilization', 'mohenjo-daro', 'mohenjo daro', 'harappan civilisation', 'harappan civilization', 'great bath', 'indus script'], example: {} },
  'athenian-democracy': { title: 'Democracy in ancient Athens', keywords: ['athenian democracy', 'ancient greek democracy', 'democracy in ancient athens', 'birth of democracy', 'ostracism in athens', 'cleisthenes reforms', 'athenian assembly'], example: {} },
  'roman-aqueduct': { title: 'Roman aqueducts and roads', keywords: ['roman aqueduct', 'roman aqueducts', 'roman roads', 'all roads lead to rome', 'roman engineering', 'pont du gard', 'via appia', 'appian way'], example: {} },
  'silk-road-caravan': { title: 'The Silk Road', keywords: ['silk road', 'silk roads', 'silk route', 'camel caravan', 'trade between china and rome', 'ancient trade routes', 'han dynasty trade'], example: {} },
  'viking-longship': { title: 'Viking longships', keywords: ['viking longship', 'viking longships', 'the vikings', 'viking age', 'viking raids', 'lindisfarne raid', 'leif erikson', 'norse explorers'], example: {} },
  'castle-siege': { title: 'Castles and sieges', keywords: ['medieval castle', 'medieval castles', 'motte and bailey', 'castle siege', 'medieval siege', 'siege weapons', 'stone castle', 'norman castles'], example: {} },
  'printing-press': { title: "Gutenberg's printing press", keywords: ['printing press', 'gutenberg printing press', 'johannes gutenberg', 'movable type', 'gutenberg bible', 'invention of printing', 'history of printing'], example: {} },
  renaissance: { title: 'The Renaissance', keywords: ['the renaissance', 'italian renaissance', 'renaissance florence', 'leonardo da vinci', 'brunelleschi dome', 'medici family', 'renaissance scholars'], example: {} },
  'columbian-exchange': { title: 'The Columbian Exchange', keywords: ['columbian exchange', 'christopher columbus', 'columbus in 1492', 'columbus sailed', 'new world crops', 'old world and new world', 'europeans arrive in the americas'], example: {} },
  'industrial-revolution': { title: 'The Industrial Revolution', keywords: ['industrial revolution', 'watt steam engine', 'james watt', 'factory system', 'child labour', 'child labor', 'cotton mills', 'factory act'], example: {} },
  'french-revolution': { title: 'The French Revolution', keywords: ['french revolution', 'storming of the bastille', 'bastille day', 'three estates', 'liberty equality fraternity', 'rights of man', 'estates-general', 'reign of terror'], example: {} },
  'ww1-trenches': { title: 'The First World War trenches', keywords: ['first world war', 'world war one', 'world war 1', 'trench warfare', 'western front', "no man's land", 'armistice day', 'remembrance poppy'], example: {} },
  'ww2-timeline': { title: 'The Second World War, 1939–1945', keywords: ['second world war', 'world war two', 'world war 2', 'world war ii', 'd-day landings', 'attack on pearl harbor', 'end of the second world war', 'founding of the united nations'], example: {} },
  'moon-landing': { title: 'Apollo 11: the Moon landing', keywords: ['moon landing', 'apollo 11', 'neil armstrong', 'first man on the moon', 'one small step', 'buzz aldrin', 'apollo moon mission'], example: {} },
  'berlin-wall': { title: 'The Berlin Wall', keywords: ['berlin wall', 'fall of the berlin wall', 'east germany', 'east and west germany', 'divided berlin', 'german reunification', 'iron curtain'], example: {} },
  'civil-rights': { title: 'The US civil rights movement', keywords: ['civil rights movement', 'martin luther king', 'rosa parks', 'montgomery bus boycott', 'march on washington', 'civil rights act', 'voting rights act', 'i have a dream'], example: {} },
  'votes-for-women': { title: 'Votes for women', keywords: ['votes for women', "women's suffrage", 'women suffrage', 'suffragettes', 'suffragists', 'women win the vote', 'right to vote for women', 'emmeline pankhurst'], example: {} },
  'indian-independence': { title: "India's road to independence", keywords: ['indian independence', 'independence of india', 'indian independence movement', 'mahatma gandhi', 'salt march', 'quit india movement', 'partition of india', 'india 1947'], example: {} },
  'internet-history': { title: 'How the internet grew', keywords: ['history of the internet', 'invention of the internet', 'arpanet', 'world wide web', 'tim berners-lee', 'first email', 'how the internet began', 'internet history'], example: {} },
};

// A coarse world, as [lon, lat, lon, lat, ...] outlines: enough to place
// the Silk Road, the Viking routes, the Atlantic crossings and the votes.
const LAND = [
  [-166, 66, -156, 71, -130, 70, -100, 72, -80, 70, -64, 60, -56, 52, -66, 45, -70, 42, -76, 35, -81, 31, -80, 25, -82, 29, -90, 29, -97, 26, -97, 20, -90, 21, -87, 15, -83, 9, -78, 8, -80, 7, -86, 12, -92, 15, -105, 20, -110, 24, -112, 29, -115, 32, -118, 34, -124, 40, -124, 48, -130, 55, -140, 60, -152, 59, -165, 55, -160, 60],
  [-55, 60, -43, 60, -20, 70, -18, 80, -35, 83, -60, 82, -72, 78, -56, 70],
  [-80, 8, -72, 12, -62, 10, -50, 0, -35, -5, -35, -10, -40, -22, -48, -26, -58, -35, -65, -42, -68, -52, -72, -54, -75, -48, -73, -38, -71, -30, -70, -18, -76, -14, -81, -5, -80, 0, -78, 5],
  [-9, 37, -9, 43, -1, 44, -4, 48, 2, 51, 5, 53, 8, 54, 8.5, 57, 10.5, 57.5, 10.5, 55, 12, 54.3, 14, 54, 19, 54.5, 21, 55.5, 21, 57, 24, 57.5, 24, 59.5, 29, 60, 23, 60, 21, 61, 21.5, 63.5, 25, 65, 24.5, 66, 26, 70, 31, 70, 33, 69, 40, 67, 44, 68, 55, 69, 70, 73, 80, 73, 100, 77, 115, 74, 140, 72, 160, 70, 180, 68, 180, 65, 170, 60, 160, 58, 155, 52, 140, 55, 135, 45, 130, 42, 127, 38, 126, 35, 121, 39, 122, 31, 120, 25, 110, 20, 108, 15, 109, 11, 105, 9, 100, 13, 101, 6, 103, 1, 98, 8, 98, 16, 94, 18, 92, 22, 87, 21, 80, 15, 78, 8, 73, 17, 72, 21, 67, 25, 58, 25, 56, 27, 50, 30, 48, 28, 51, 24, 56, 24.5, 59, 22.5, 52, 17, 44, 13, 43, 16, 38, 22, 35, 28, 32.5, 30, 34, 31.3, 36, 36, 30, 36.5, 27, 37, 26, 40, 23, 40.5, 23, 37, 21, 39, 19.5, 42, 13.5, 45.7, 12.3, 44.5, 16, 41.5, 18.5, 40, 16, 38, 15.6, 40, 12, 42, 8.5, 44.4, 3, 43.3, 3.2, 42, 0, 39, -2, 37, -6, 36],
  [5, 58, 5, 62, 12, 66, 18, 70, 28, 71, 29, 69.5, 24, 66, 22, 65.5, 18, 62.5, 18.5, 60, 16, 56.5, 12.8, 55.5, 11.5, 58, 8, 58],
  [-17, 21, -16, 28, -10, 30, -6, 36, 10, 37, 11, 33, 20, 31, 25, 32, 32, 31, 34, 28, 38, 20, 43, 12, 51, 12, 48, 5, 40, -3, 39, -10, 40, -16, 35, -24, 33, -28, 27, -34, 20, -35, 18, -32, 14, -23, 12, -15, 13, -6, 9, -1, 9, 4, 4, 6, -5, 5, -12, 7, -17, 14],
  [-5.5, 50, 1.5, 51, 1.7, 52.8, 0, 53.5, -1.5, 55, -2, 57, -3.5, 58.6, -5, 58.5, -6, 56.5, -5, 55, -3, 54, -4.5, 53.2, -5, 51.7],
  [-10, 51.6, -6, 52, -6, 54, -7.5, 55.3, -10, 54],
  [-24, 64, -14, 64.5, -14, 66, -22, 66.5],
  [130, 31, 135, 34, 140, 35, 142, 40, 141.5, 45, 144, 44, 140, 41, 136, 37, 132, 35],
  [114, -22, 122, -18, 130, -12, 137, -12, 136, -15, 141, -12, 145, -15, 149, -21, 153, -26, 152, -32, 150, -37, 144, -38, 138, -35, 132, -32, 124, -34, 115, -34, 113, -26],
  [172.7, -34.5, 175, -37, 178.5, -37.7, 176.5, -41.5, 174.6, -41.3, 174, -39],
  [172.7, -40.5, 174.3, -41.7, 171.2, -44.4, 168.5, -46.6, 166.5, -45.8, 170.5, -42.8],
  [44, -25, 47, -25, 50.5, -15.5, 49.3, -12, 44, -17],
  [109, 1.5, 112, 3, 117, 7, 119, 5, 118, 1, 116, -4, 111, -3],
  [95, 5.5, 98, 4, 104, -2, 106, -6, 102, -4, 96, 2],
  [105, -6, 114, -7, 114.5, -8.5, 106, -7.5],
  [131, -1, 138, -2, 147, -6, 150, -10, 142, -9, 138, -8, 132, -4],
  [79.8, 9.8, 81.9, 7.5, 81.2, 6.1, 80, 6.2],
  [-85, 22, -80, 23.2, -74, 20, -77.5, 19.8, -81, 21.8],
  [-74.4, 19.8, -68.4, 18.6, -70, 18.2, -74.5, 18.3],
];
// The Indian subcontinent in 1947, more finely: the whole outline, West and
// East Pakistan, and Kashmir (left neutral: its status is still disputed).
const SUBCONTINENT = [61, 25, 66, 25.4, 68, 23.7, 70, 22.5, 72.5, 21, 72.8, 19, 73.5, 16, 74.5, 13, 76, 9.5, 77.5, 8.1, 78.2, 9, 79.8, 10.3, 80.2, 13, 80.3, 15.5, 82, 17, 84.5, 19, 86.8, 20.5, 87.5, 21.6, 89, 21.8, 90.5, 22.5, 91.8, 22.3, 92.5, 21, 92.7, 22.5, 92.3, 24.5, 94, 25.5, 95.2, 27, 97, 28, 96, 29.2, 94, 28.8, 92, 27.9, 92, 26.9, 89.8, 26.8, 88.6, 28, 88.1, 26.6, 85, 26.7, 83.3, 27.4, 80.2, 28.7, 81, 30.2, 79, 31, 78.5, 32.5, 79.5, 33.5, 78, 35.5, 76.8, 35.8, 75, 37, 71.5, 36.6, 71, 34.5, 70, 33.5, 69.5, 31.5, 68, 30, 66.5, 29.5, 62, 29.4, 61, 27];
const WEST_PAK = [61, 25, 66, 25.4, 68, 23.7, 68.8, 24.3, 71, 24.6, 70.3, 26.5, 69.6, 27.2, 70.5, 28, 72, 28.8, 73.4, 29.9, 74.5, 31, 74.7, 32, 74, 32.8, 73.5, 34.2, 72.5, 35.8, 71.5, 36.6, 71, 34.5, 70, 33.5, 69.5, 31.5, 68, 30, 66.5, 29.5, 62, 29.4, 61, 27];
const EAST_PAK = [88.1, 22, 88.7, 24.3, 88, 25.1, 88.5, 26.4, 89.8, 26, 92, 25, 92.3, 24.5, 91.8, 23, 92.6, 21.2, 91.8, 22.3, 90.5, 22.5, 89, 21.8];
const KASHMIR = [74, 32.8, 75.4, 32.3, 76.8, 33, 78.5, 32.5, 79.5, 33.5, 78, 35.5, 76.8, 35.8, 75, 37, 73.5, 36.8, 72.5, 35.8, 73.5, 34.2];
// Germany and the inner border of 1949–1990 (East Germany to its right).
const GERMANY = [6, 51.8, 7, 53.5, 8.6, 53.9, 9.9, 54.8, 11, 54, 13.5, 54.3, 14.2, 53.9, 14.6, 52.5, 15, 51.1, 14.3, 50.9, 12.2, 50.3, 13.8, 48.8, 13, 47.5, 10.5, 47.5, 7.6, 47.6, 8.2, 49, 6.4, 49.5, 6, 50.8];
const EAST_DE = [10.9, 54, 11, 54, 13.5, 54.3, 14.2, 53.9, 14.6, 52.5, 15, 51.1, 14.3, 50.9, 12.2, 50.3, 11, 50.4, 10, 50.6, 10.2, 51.4, 10.9, 52, 10.6, 52.7, 11.3, 53.1, 10.8, 53.6];

function inPoly(lon, lat, P) {
  let inside = false;
  for (let i = 0, j = P.length - 2; i < P.length; j = i, i += 2) {
    const xi = P[i]; const yi = P[i + 1]; const xj = P[j]; const yj = P[j + 1];
    if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function historySims(kit) {
  // eslint-disable-next-line no-unused-vars
  const { FIG, COLORS, FONT, glow, label, rounded, arrow, clamp, easeOut, color, tint } = kit;
  const X0 = FIG.x; const Y0 = FIG.y; const X1 = FIG.x + FIG.w; const Y1 = FIG.y + FIG.h;
  const cx = X0 + FIG.w / 2;
  const TAU = Math.PI * 2;
  // The scene panel every picture is drawn in, below the title.
  const PX = X0 + 10; const PY = Y0 + 58; const PW = FIG.w - 20; const PH = 552; const PB = PY + PH;
  const MONO = 'ui-monospace, Menlo, Consolas, monospace';

  // Small tools: numbers, timing, loops.
  const mod = (a, n) => ((a % n) + n) % n;
  const smooth = (p) => { p = clamp(p); return p * p * (3 - 2 * p); };
  const lerp = (a, c, p) => a + (c - a) * p;
  const fade = (ctx, t, d = 0.5) => { const q = easeOut(clamp(t / d)); ctx.globalAlpha *= q; return q; };
  const after = (t, at0, d = 0.4) => easeOut(clamp((t - at0) / d));
  const cycle = (t, period, delay = 0.6) => (t < delay ? 0 : mod(t - delay, period));
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const fadeIO = (lt, dur, d = 0.4) => Math.max(0, Math.min(smooth(lt / d), 1 - smooth((lt - dur + d) / d)));
  const bz = (a, c, e, q) => ({ x: (1 - q) * (1 - q) * a.x + 2 * (1 - q) * q * c.x + q * q * e.x, y: (1 - q) * (1 - q) * a.y + 2 * (1 - q) * q * c.y + q * q * e.y });

  // Drawing helpers in the board's holo style.
  const title = (ctx, text) => label(ctx, String(text), cx, Y0 + 28, { size: 26, weight: 700, fill: 'ink' });
  function chip(ctx, text, x, y, c = 'ink', size = 21, align = 'center') {
    text = String(text);
    ctx.font = `700 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + 24; const h = size + 14;
    const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = 'rgba(5,8,22,0.82)'; ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 1.5;
    rounded(ctx, left, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    label(ctx, text, left + w / 2, y + 1, { size, weight: 700, fill: c });
  }
  function arr(ctx, x0, y0, x1, y1, c, w = 5) { if (Math.hypot(x1 - x0, y1 - y0) > 4) arrow(ctx, x0, y0, x1, y1, c, w); }
  function dot(ctx, x, y, r, c, blur = 0) {
    if (blur) glow(ctx, color(c), blur);
    ctx.fillStyle = color(c); ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); ctx.fill();
    if (blur) ctx.shadowBlur = 0;
  }
  function line(ctx, x0, y0, x1, y1, c = 'rgba(220,230,255,0.8)', w = 2, dash) {
    ctx.strokeStyle = color(c); ctx.lineWidth = w;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    if (dash) ctx.setLineDash([]);
  }
  function poly(ctx, pts, close = false) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    if (close) ctx.closePath();
  }
  function panel(ctx, x, y, w, h, c = 'blue', a = 0.08, r = 16) {
    ctx.fillStyle = tint(c, a); ctx.strokeStyle = tint(c, 0.6); ctx.lineWidth = 2;
    rounded(ctx, x, y, w, h, r); ctx.fill(); ctx.stroke();
  }
  function mkPath(pts) {
    const cum = [0];
    for (let i = 2; i < pts.length; i += 2) cum.push(cum[cum.length - 1] + Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]));
    return { pts, cum, total: cum[cum.length - 1] || 1 };
  }
  function at(p, d) {
    d = clamp(d, 0, p.total);
    let i = 1;
    while (i < p.cum.length - 1 && p.cum[i] < d) i++;
    const s = p.cum[i] - p.cum[i - 1] || 1; const q = (d - p.cum[i - 1]) / s;
    const x0 = p.pts[2 * i - 2]; const y0 = p.pts[2 * i - 1]; const x1 = p.pts[2 * i]; const y1 = p.pts[2 * i + 1];
    return { x: x0 + (x1 - x0) * q, y: y0 + (y1 - y0) * q, a: Math.atan2(y1 - y0, x1 - x0), i: i - 1 };
  }
  function strokeSpan(ctx, p, d0, d1) {
    if (d1 <= d0) return;
    const a0 = at(p, d0); const a1 = at(p, d1);
    ctx.beginPath(); ctx.moveTo(a0.x, a0.y);
    for (let i = a0.i + 1; i <= a1.i; i++) ctx.lineTo(p.pts[2 * i], p.pts[2 * i + 1]);
    ctx.lineTo(a1.x, a1.y); ctx.stroke();
  }
  // Text wrapped to maxW (x is the left edge), up to `lines` lines, centred on y.
  function para(ctx, text, x, y, maxW, size = 20, fill = 'ink', weight = 500, lines = 3, align = 'center') {
    ctx.font = `${weight} ${size}px ${FONT}`;
    const out = []; let cur = '';
    for (const w of String(text).split(/\s+/)) { const test = cur ? `${cur} ${w}` : w; if (cur && ctx.measureText(test).width > maxW) { out.push(cur); cur = w; } else cur = test; }
    if (cur) out.push(cur);
    if (out.length > lines) { out.length = lines; out[lines - 1] = `${out[lines - 1].replace(/\s+\S*$/, '')}…`; }
    const lh = size * 1.25;
    out.forEach((l, i) => label(ctx, l, align === 'center' ? x + maxW / 2 : x, y + (i - (out.length - 1) / 2) * lh, { size, weight, fill, align }));
  }

  // A story in stages: [[seconds, caption, colour, subline], ...]. Returns
  // the stage index i, its local time lt and progress p, the loop time u,
  // and on(j): a fade-in/fade-out weight for things that belong to stage j.
  function stages(t, list, delay = 0.5) {
    const total = list.reduce((a, s) => a + s[0], 0);
    const u = cycle(t, total, delay);
    let acc = 0; let i = 0;
    for (; i < list.length - 1; i++) { if (u < acc + list[i][0]) break; acc += list[i][0]; }
    const dur = list[i][0]; const lt = u - acc;
    const starts = []; let a2 = 0; for (const s of list) { starts.push(a2); a2 += s[0]; }
    return { i, lt, dur, p: clamp(lt / dur), u, total, s: list[i], starts, on: (j, d = 0.4) => (i === j ? fadeIO(lt, dur, d) : 0) };
  }
  // The stage's caption in a chip below the scene, with an optional subline.
  function caption(ctx, S) {
    const [dur, text, c = 'cyan', sub] = S.s;
    ctx.save(); ctx.globalAlpha *= fadeIO(S.lt, dur, 0.3);
    chip(ctx, text, cx, Y1 - 58, c, 20);
    if (sub) label(ctx, sub, cx, Y1 - 19, { size: 18, weight: 500, fill: 'muted' });
    ctx.restore();
  }
  // Open a clipped scene panel filled with a vertical gradient [[stop, colour]].
  function sceneBox(ctx, stops, x = PX, y = PY, w = PW, h = PH) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    for (const [s, c] of stops) g.addColorStop(s, c);
    ctx.save(); rounded(ctx, x, y, w, h, 16); ctx.fillStyle = g; ctx.fill(); ctx.clip();
  }
  function endBox(ctx, x = PX, y = PY, w = PW, h = PH) {
    ctx.restore();
    ctx.strokeStyle = 'rgba(140,170,255,0.35)'; ctx.lineWidth = 2; rounded(ctx, x, y, w, h, 16); ctx.stroke();
  }
  // Where the hands go for each pose, in units of h/100 from the feet.
  function hands(A, f, ph) {
    switch (A) {
      case 'up': return [[-18, -116], [18, -116]];
      case 'raise': return f > 0 ? [[-12, -44], [15, -118]] : [[-15, -118], [12, -44]];
      case 'pull': return [[f * 28, -62], [f * 32, -58]];
      case 'hold': return [[f * 18, -70], [f * 22, -62]];
      case 'point': return f > 0 ? [[-12, -44], [36, -84]] : [[-36, -84], [12, -44]];
      case 'carry': return [[-12, -104], [12, -104]];
      case 'wave': { const w = Math.sin(ph) * 7; return f > 0 ? [[-12, -44], [18 + w, -112]] : [[-18 + w, -112], [12, -44]]; }
      case 'row': { const r = Math.sin(ph) * 10; return [[f * (24 + r), -58], [f * (28 + r), -54]]; }
      case 'hug': return [[f * 24, -72], [f * 26, -66]];
      case 'pour': return [[f * 26, -70], [f * 30, -76]];
      case 'write': return [[f * 22, -50], [f * 26, -46]];
      case 'look': return [[f * 16, -86], [f * 20, -90]];
      default: return [[-12, -44], [12, -44]];
    }
  }
  // A dignified silhouette standing on (x, gy), h tall. o: face (1 right,
  // −1 left), walk (a phase), sit, arms (a pose), lean, robe, helmet
  // ('brodie' or 'stahl'), staff, col (a fill), alpha, a (opacity).
  function person(ctx, x, gy, h, c = 'ink', o = {}) {
    const s = h / 100; const f = o.face || 1;
    ctx.save(); ctx.translate(x, gy);
    if (o.a !== undefined) ctx.globalAlpha *= clamp(o.a);
    if (o.lean) ctx.rotate(o.lean * f);
    const col = o.col || tint(c, o.alpha ?? 0.92);
    ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const dy = o.sit ? 22 * s : 0; const hip = -46 * s + dy; const sh = -80 * s + dy;
    ctx.lineWidth = 7.5 * s; ctx.beginPath();
    if (o.sit) { for (const k of [-1, 1]) { ctx.moveTo(k * 3 * s, hip); ctx.lineTo(f * 22 * s + k * 2 * s, hip + 2 * s); ctx.lineTo(f * 24 * s + k * 3 * s, -2 * s); } }
    else { const sw = o.walk !== undefined ? Math.sin(o.walk) * 13 : 5; for (const k of [-1, 1]) { ctx.moveTo(k * 3 * s, hip); ctx.lineTo(k * sw * s, -3 * s); } }
    ctx.stroke();
    ctx.beginPath();
    if (o.robe && !o.sit) { ctx.moveTo(-10 * s, sh); ctx.lineTo(10 * s, sh); ctx.lineTo(16 * s, -9 * s); ctx.lineTo(-16 * s, -9 * s); }
    else { ctx.moveTo(-11 * s, sh); ctx.lineTo(11 * s, sh); ctx.lineTo(9 * s, hip + 3 * s); ctx.lineTo(-9 * s, hip + 3 * s); }
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(0, sh + 2 * s, 11 * s, Math.PI, 0); ctx.fill();
    const hy = sh - 15 * s; const hx = f * s;
    ctx.beginPath(); ctx.arc(hx, hy, 10 * s, 0, TAU); ctx.fill();
    if (o.helmet === 'brodie') { ctx.beginPath(); ctx.ellipse(hx, hy - 5 * s, 17 * s, 4 * s, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(hx, hy - 5 * s, 10 * s, Math.PI, 0); ctx.fill(); }
    else if (o.helmet === 'stahl') { ctx.beginPath(); ctx.moveTo(hx - 13 * s, hy + 4 * s); ctx.lineTo(hx - 12 * s, hy - 3 * s); ctx.arc(hx, hy - 3 * s, 12 * s, Math.PI, 0); ctx.lineTo(hx + 14 * s, hy + 5 * s); ctx.closePath(); ctx.fill(); }
    else if (o.helmet === 'space') { ctx.beginPath(); ctx.arc(hx, hy, 14 * s, 0, TAU); ctx.fill(); ctx.fillStyle = '#c9a54a'; ctx.beginPath(); ctx.arc(hx + f * 4 * s, hy, 9 * s, -1.2, 1.2); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(-f * 20 * s - 7 * s, sh, 14 * s, 26 * s); }
    else if (o.hat) { ctx.beginPath(); ctx.ellipse(hx, hy - 8 * s, 15 * s, 3.5 * s, 0, 0, TAU); ctx.fill(); ctx.fillRect(hx - 9 * s, hy - 19 * s, 18 * s, 11 * s); }
    ctx.lineWidth = 6 * s; ctx.beginPath();
    const H = o.hands || hands(o.arms, f, o.ph || 0);
    H.forEach(([px, py], i) => { ctx.moveTo((i ? 8 : -8) * s, sh + 4 * s); ctx.lineTo(px * s, py * s + dy); });
    ctx.stroke();
    if (o.staff) { const [px, py] = H[f > 0 ? 1 : 0]; ctx.strokeStyle = '#c8a46a'; ctx.lineWidth = 3.5 * s; ctx.beginPath(); ctx.moveTo(px * s, py * s - 22 * s); ctx.lineTo(px * s + f * 8 * s, 0); ctx.stroke(); }
    ctx.restore();
  }
  // A placard or banner with its text (never smaller than 18px).
  function sign(ctx, x, y, text, c = 'ink', size = 18, pole = 0) {
    ctx.font = `800 ${size}px ${FONT}`;
    const w = ctx.measureText(text).width + 18; const h = size + 12;
    if (pole) line(ctx, x, y + h / 2, x, y + h / 2 + pole, '#c8a46a', 3);
    ctx.fillStyle = 'rgba(240,236,224,0.95)'; ctx.strokeStyle = tint(c, 0.9); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(x - w / 2, y - h / 2, w, h); ctx.fill(); ctx.stroke();
    label(ctx, text, x, y + 1, { size, weight: 800, fill: c === 'ink' ? '#1b2440' : c });
  }

  // Maps: an equirectangular box R = {x, y, w, h, lon0, lon1, lat0, lat1}.
  const proj = (R, lon, lat) => ({ x: R.x + ((lon - R.lon0) / (R.lon1 - R.lon0)) * R.w, y: R.y + ((R.lat1 - lat) / (R.lat1 - R.lat0)) * R.h });
  function shape(ctx, R, P) {
    ctx.beginPath();
    for (let i = 0; i < P.length; i += 2) { const q = proj(R, P[i], P[i + 1]); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }
    ctx.closePath();
  }
  function world(ctx, R, o = {}) {
    ctx.save(); rounded(ctx, R.x, R.y, R.w, R.h, 12);
    ctx.fillStyle = o.sea || 'rgba(30,72,140,0.32)'; ctx.fill(); ctx.clip();
    ctx.fillStyle = o.land || 'rgba(150,175,215,0.28)'; ctx.strokeStyle = o.edge || 'rgba(190,210,245,0.5)'; ctx.lineWidth = 1.4;
    for (const P of LAND) { shape(ctx, R, P); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(140,170,255,0.35)'; ctx.lineWidth = 1.5; rounded(ctx, R.x, R.y, R.w, R.h, 12); ctx.stroke();
  }
  // A path through map points [[lon, lat], ...], gently curved.
  function route(R, pts, bend = 0.18) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = proj(R, pts[i][0], pts[i][1]); const e = proj(R, pts[i + 1][0], pts[i + 1][1]);
      const c = { x: (a.x + e.x) / 2 - (e.y - a.y) * bend, y: (a.y + e.y) / 2 + (e.x - a.x) * bend };
      for (let k = i ? 1 : 0; k <= 12; k++) { const q = bz(a, c, e, k / 12); out.push(q.x, q.y); }
    }
    return mkPath(out);
  }
  // A small ring that pulses out from a place.
  function ping(ctx, x, y, k, c = 'yellow', r0 = 6) {
    const q = mod(k * 0.8, 1);
    ctx.strokeStyle = tint(c, 0.8 * (1 - q)); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, r0 + q * 18, 0, TAU); ctx.stroke();
    dot(ctx, x, y, r0, c);
  }
  // Stars for night skies, fixed by index.
  function stars(ctx, x, y, w, h, n, k = 0) {
    for (let i = 0; i < n; i++) {
      const tw = 0.45 + 0.4 * Math.sin(k * 2 + i * 1.7);
      ctx.fillStyle = `rgba(235,240,255,${tw.toFixed(3)})`;
      ctx.fillRect(x + rnd(i * 3.1) * w, y + rnd(i * 7.3 + 1) * h, 2, 2);
    }
  }
  // Soft drifting puffs of smoke or steam from (x, y).
  function puffs(ctx, x, y, k, n = 5, c = '200,200,210', rise = 120, drift = -40, size = 14, speed = 0.35) {
    for (let i = 0; i < n; i++) {
      const q = mod(k * speed + i / n, 1);
      ctx.fillStyle = `rgba(${c},${(0.55 * (1 - q)).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x + drift * q + Math.sin(i * 2 + k) * 4, y - rise * q, size * (0.5 + q), 0, TAU); ctx.fill();
    }
  }
  // A tick or a cross.
  function mark(ctx, x, y, ok, r = 16) {
    ctx.strokeStyle = color(ok ? 'green' : 'red'); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath();
    if (ok) { ctx.moveTo(x - r, y); ctx.lineTo(x - r * 0.3, y + r * 0.7); ctx.lineTo(x + r, y - r * 0.8); }
    else { ctx.moveTo(x - r * 0.8, y - r * 0.8); ctx.lineTo(x + r * 0.8, y + r * 0.8); ctx.moveTo(x + r * 0.8, y - r * 0.8); ctx.lineTo(x - r * 0.8, y + r * 0.8); }
    ctx.stroke();
  }
  // A flag of horizontal or vertical stripes on a pole top at (x, y).
  function flag(ctx, x, y, w, h, cols, vertical = false, wave = 0) {
    const n = cols.length;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = cols[i]; ctx.beginPath();
      if (vertical) { const x0 = x + (i * w) / n; const x1 = x + ((i + 1) * w) / n; ctx.moveTo(x0, y + Math.sin(wave + i) * 2); ctx.lineTo(x1, y + Math.sin(wave + i + 1) * 2); ctx.lineTo(x1, y + h + Math.sin(wave + i + 1) * 2); ctx.lineTo(x0, y + h + Math.sin(wave + i) * 2); }
      else { const y0 = y + (i * h) / n; const y1 = y + ((i + 1) * h) / n; ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + w / 2, y0 + Math.sin(wave) * 4, x + w, y0); ctx.lineTo(x + w, y1); ctx.quadraticCurveTo(x + w / 2, y1 + Math.sin(wave) * 4, x, y1); }
      ctx.closePath(); ctx.fill();
    }
  }

  return {
    // ─── The ancient world ────────────────────────────────────────────────

    // The Great Pyramid rising course by course while a team hauls a block
    // up the ramp on a sledge, water poured before it; boats bring stone on
    // the Nile and smoke rises from the workers' village.
    'pyramid-building'(b, ctx, it, t) {
      const S = stages(t, [
        [4.5, 'About 2560 BCE: a tomb for Pharaoh Khufu at Giza', 'yellow', 'The Great Pyramid rises on the desert edge, near the Nile'],
        [4.5, 'Teams haul stone blocks up ramps on wooden sledges', 'orange', 'An average block weighs about 2.5 tonnes'],
        [4, 'Water poured on the sand helps the sledges slide', 'cyan', 'An ancient Egyptian tomb painting shows this trick'],
        [4.5, 'Paid workers lived nearby, with bakeries and doctors', 'teal', 'Skilled builders and farm crews, not slaves as once thought'],
        [5, 'About 2.3 million blocks, 146 m tall when finished', 'yellow', 'The tallest building on Earth for about 3,800 years'],
      ]);
      const k = b.clock; const GY = 600; const SIL = '#2e1d10';
      const f = 0.3 + 0.7 * smooth(S.u / (S.total - 5));
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Building the Great Pyramid');
      sceneBox(ctx, [[0, '#1b2758'], [0.55, '#7d5a6a'], [0.77, '#e3a062'], [0.78, '#c8955a'], [1, '#86603a']]);
      dot(ctx, 620, 262, 24, '#ffd98a', 14);
      ctx.fillStyle = 'rgba(150,98,62,0.6)'; poly(ctx, [742, GY, 796, GY - 64, 850, GY], true); ctx.fill();
      ctx.fillStyle = 'rgba(150,98,62,0.45)'; poly(ctx, [806, GY, 836, GY - 36, 866, GY], true); ctx.fill();
      // The Nile, with a boat bringing stone.
      ctx.fillStyle = 'rgba(60,130,205,0.8)'; ctx.fillRect(PX, 664, 280, 36);
      ctx.strokeStyle = 'rgba(200,230,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < 6; i++) { const wx = PX + mod(i * 52 + k * 14, 280); ctx.moveTo(wx, 690); ctx.quadraticCurveTo(wx + 8, 686, wx + 16, 690); }
      ctx.stroke();
      const bx = 175 + 70 * Math.sin(k * 0.3);
      ctx.fillStyle = '#5a3a20'; poly(ctx, [bx - 44, 670, bx + 44, 670, bx + 32, 684, bx - 32, 684], true); ctx.fill();
      line(ctx, bx + 6, 670, bx + 6, 624, '#5a3a20', 3);
      ctx.fillStyle = 'rgba(240,230,205,0.9)'; poly(ctx, [bx + 8, 626, bx + 36, 662, bx + 8, 662], true); ctx.fill();
      ctx.fillStyle = '#e0bb80'; ctx.fillRect(bx - 30, 656, 28, 14);
      label(ctx, 'Stone came by boat', 210, 716, { size: 18, weight: 600, fill: 'ink' });
      // The workers' village, with smoke from the bakery.
      const hv = S.on(3);
      ctx.fillStyle = '#9c6c42'; ctx.strokeStyle = hv ? tint('teal', hv) : 'rgba(60,35,15,0.6)'; ctx.lineWidth = hv ? 3 : 1.5;
      for (const [hx, hy] of [[640, 652], [700, 652], [760, 652], [820, 652], [670, 690], [730, 690], [790, 690]]) {
        ctx.fillRect(hx - 22, hy - 22, 44, 22); ctx.strokeRect(hx - 22, hy - 22, 44, 22);
        ctx.fillStyle = '#3c2614'; ctx.fillRect(hx - 4, hy - 13, 8, 13); ctx.fillStyle = '#9c6c42';
      }
      puffs(ctx, 700, 626, k, 4, '235,225,210', 50, -18, 7, 0.4);
      label(ctx, "Workers' village", 730, 714, { size: 18, weight: 700, fill: hv > 0.3 ? 'teal' : 'ink' });
      // The pyramid and its ramp.
      const PC = 535; const HB = 205; const H = 260; const CH = 13;
      const n = Math.min(20, Math.floor((H * f) / CH + 1e-6));
      const ytop = GY - n * CH; const hwT = HB * (1 - (n * CH) / H);
      const A = { x: PX + 22, y: GY }; const B = { x: PC - hwT - 4, y: ytop };
      for (let i = 0; i < n; i++) {
        const y0 = GY - (i + 1) * CH; const hw = HB * (1 - ((i + 1) * CH) / H) + 6;
        ctx.fillStyle = i % 2 ? '#e4c088' : '#dab47a'; ctx.fillRect(PC - hw, y0, hw, CH);
        ctx.fillStyle = i % 2 ? '#b98f58' : '#ae844e'; ctx.fillRect(PC, y0, hw, CH);
      }
      ctx.strokeStyle = 'rgba(90,60,30,0.45)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const y0 = GY - (i + 1) * CH; const hw = HB * (1 - ((i + 1) * CH) / H) + 6;
        ctx.moveTo(PC - hw, y0); ctx.lineTo(PC + hw, y0);
        for (let x = PC - hw + (i % 2) * 12 + 12; x < PC + hw - 4; x += 24) { ctx.moveTo(x, y0); ctx.lineTo(x, y0 + CH); }
      }
      ctx.stroke();
      if (n >= 20) {
        ctx.fillStyle = '#f2cf6a'; poly(ctx, [PC - 7, ytop, PC, ytop - 14, PC + 7, ytop], true); ctx.fill();
        dot(ctx, PC, ytop - 10, 3 + Math.sin(k * 3), '#fff3c4', 10);
      } else {
        person(ctx, PC - 30, ytop, 24, SIL, { arms: 'pull', lean: 0.2 });
        person(ctx, PC + 30, ytop, 24, SIL, { arms: 'pull', lean: 0.2, face: -1 });
        ctx.fillStyle = '#e0bb80'; ctx.fillRect(PC - 10, ytop - 14, 20, 14);
      }
      // The mud-brick ramp leaning on the pyramid (taken away at the end).
      const rampA = S.i === 4 ? 1 - smooth((S.lt - 0.8) / 1.6) : 1;
      ctx.save(); ctx.globalAlpha *= rampA;
      const TH = 30; const xb = B.x - ((B.x - A.x) * TH) / Math.max(1, GY - ytop);
      ctx.fillStyle = 'rgba(122,84,50,0.38)'; poly(ctx, [A.x, GY, B.x, ytop, B.x, GY], true); ctx.fill();
      ctx.fillStyle = 'rgba(128,88,52,0.98)'; poly(ctx, [A.x, GY, B.x, ytop, B.x, ytop + TH, xb, GY], true); ctx.fill();
      ctx.strokeStyle = 'rgba(70,45,22,0.6)'; ctx.lineWidth = 1.3; ctx.beginPath();
      for (let x = A.x + 40; x < B.x - 10; x += 40) { const yr = GY - ((GY - ytop) * (x - A.x)) / Math.max(1, B.x - A.x); ctx.moveTo(x, yr + 4); ctx.lineTo(x, Math.min(GY, yr + TH + 2)); }
      ctx.stroke();
      line(ctx, A.x, GY, B.x, ytop, '#f0cf96', 3);
      ctx.restore();
      // The team on the ramp: sledge, water pourer and haulers.
      const L = Math.hypot(B.x - A.x, B.y - A.y); const ang = Math.atan2(B.y - A.y, B.x - A.x);
      const P = (dd) => ({ x: A.x + Math.cos(ang) * dd, y: A.y + Math.sin(ang) * dd });
      const pr = P(L * 0.33);
      if (rampA > 0.05) label(ctx, 'Ramp', pr.x - 26, pr.y - 66, { size: 19, weight: 700, fill: 'ink' });
      const q = mod(k / 6.5, 1); const d = 8 + q * Math.max(0, L - 180);
      ctx.save(); ctx.globalAlpha *= Math.min(1, q * 10, (1 - q) * 10) * (n >= 20 ? 0 : 1);
      const wet = P(d + 34); ctx.fillStyle = 'rgba(70,45,25,0.55)'; ctx.beginPath(); ctx.ellipse(wet.x, wet.y - 1, 14, 3, ang, 0, TAU); ctx.fill();
      const ps = P(d);
      ctx.save(); ctx.translate(ps.x, ps.y); ctx.rotate(ang);
      ctx.fillStyle = '#5e3e22'; ctx.fillRect(-24, -6, 52, 6);
      ctx.fillStyle = '#e2bd82'; ctx.strokeStyle = '#8a6438'; ctx.lineWidth = 2; ctx.fillRect(-20, -36, 40, 30); ctx.strokeRect(-20, -36, 40, 30);
      ctx.restore();
      const front = P(d + 26); const lead = P(d + 154);
      line(ctx, front.x, front.y - 16, lead.x, lead.y - 24, '#e6d2a8', 2);
      for (let j = 0; j < 4; j++) { const pp = P(d + 76 + j * 26); person(ctx, pp.x, pp.y, 40, SIL, { arms: 'pull', lean: 0.28, walk: k * 5 + j * 1.3 }); }
      const pw = P(d + 46); person(ctx, pw.x, pw.y, 38, SIL, { arms: 'pour', face: -1, walk: k * 5 + 2 });
      dot(ctx, pw.x - 11, pw.y - 28, 5, '#b0703c');
      const big = S.i === 2 ? 1.6 : 1;
      for (let j = 0; j < 3; j++) { const ph = mod(k * 2.2 + j / 3, 1); dot(ctx, pw.x - 15 - ph * 5, pw.y - 24 + ph * 22, 2.4 * big, '#8fd3ff'); }
      ctx.restore();
      endBox(ctx);
      chip(ctx, 'c. 2560 BCE', 150, 214, 'orange', 20);
      chip(ctx, `Height ${Math.round(146 * clamp((n * CH) / H + (n >= 20 ? 0 : 0)))} m`, 770, 214, 'yellow', 20);
      caption(ctx, S);
      ctx.restore();
    },

    // A bird's-eye plan of Mohenjo-daro: the citadel with the Great Bath, the
    // grid of brick houses, water running in covered drains to the river; a
    // drain in cross-section and a seal with the undeciphered script.
    'indus-city'(b, ctx, it, t) {
      const S = stages(t, [
        [4.5, 'About 2500 BCE: Mohenjo-daro, beside the River Indus', 'yellow', "In today's Pakistan: one of the largest cities of its time"],
        [4, 'Streets were planned on a neat grid', 'cyan', 'Main streets ran north–south and east–west'],
        [4, 'Houses of baked brick, many with wells and bathrooms', 'orange', 'Rooms were built around open courtyards'],
        [4.5, 'Covered drains carried waste water away', 'blue', 'Brick lids could be lifted to clean them'],
        [4, 'The Great Bath, on the raised citadel mound', 'teal', 'A watertight pool, perhaps used for ceremonies'],
        [4.5, 'Their writing is still not deciphered', 'purple', 'Short signs on seals: about 400 different symbols'],
      ]);
      const k = b.clock; const hl = (j) => S.on(j, 0.5);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Mohenjo-daro, an Indus city');
      sceneBox(ctx, [[0, '#3a2d22'], [1, '#2a2119']]);
      label(ctx, 'Citadel', 190, 210, { size: 19, weight: 700, fill: 'ink' });
      label(ctx, 'Lower town', 560, 210, { size: 19, weight: 700, fill: 'ink' });
      // Citadel mound and the Great Bath.
      ctx.fillStyle = 'rgba(150,110,70,0.55)'; ctx.strokeStyle = 'rgba(210,170,120,0.6)'; ctx.lineWidth = 2;
      rounded(ctx, 95, 230, 190, 270, 22); ctx.fill(); ctx.stroke();
      const hb = hl(4);
      ctx.fillStyle = '#b5704a'; ctx.fillRect(128, 288, 124, 84);
      ctx.fillStyle = 'rgba(80,170,230,0.85)'; ctx.fillRect(142, 302, 96, 56);
      ctx.strokeStyle = 'rgba(220,245,255,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < 3; i++) { const yy = 314 + i * 15; ctx.moveTo(146, yy + Math.sin(k * 2 + i) * 2); ctx.bezierCurveTo(170, yy - 4, 210, yy + 4, 234, yy + Math.sin(k * 2 + i + 1) * 2); }
      ctx.stroke();
      ctx.fillStyle = '#8c5236'; for (let i = 0; i < 4; i++) { ctx.fillRect(176 + i * 7, 296, 5, 6); ctx.fillRect(176 + i * 7, 358, 5, 6); }
      if (hb) { ctx.strokeStyle = tint('teal', hb); ctx.lineWidth = 4; ctx.strokeRect(122, 282, 136, 96); }
      label(ctx, 'Great Bath', 190, 398, { size: 18, weight: 700, fill: hb > 0.3 ? 'teal' : 'ink' });
      ctx.fillStyle = '#9c6040'; for (let i = 0; i < 3; i++) { ctx.fillRect(118 + i * 50, 430, 40, 46); }
      // The lower town: streets, blocks and houses.
      const XS = [[320, 435], [445, 549], [571, 675], [685, 800]]; const YS = [[230, 292], [302, 354], [376, 428], [438, 500]];
      const hs = hl(1);
      ctx.fillStyle = hs ? tint('cyan', 0.12 + 0.2 * hs) : 'rgba(200,170,130,0.12)'; ctx.fillRect(316, 226, 488, 278);
      const hh = hl(2); let idx = 0;
      for (const [x0, x1] of XS) for (const [y0, y1] of YS) {
        const w = (x1 - x0) / 2; const h = (y1 - y0) / 2;
        for (let a = 0; a < 2; a++) for (let c = 0; c < 2; c++) {
          const appear = after(t, 0.3 + idx * 0.03, 0.4); idx++;
          if (appear <= 0) continue;
          const hx = x0 + a * w + 2; const hy = y0 + c * h + 2; const ww = w - 4; const h2 = h - 4;
          ctx.fillStyle = `rgba(${hh ? 226 : 190},${hh ? 128 : 108},${hh ? 80 : 70},${(0.9 * appear).toFixed(3)})`; ctx.fillRect(hx, hy, ww, h2);
          ctx.fillStyle = 'rgba(60,40,25,0.7)'; ctx.fillRect(hx + ww * 0.32, hy + h2 * 0.3, ww * 0.36, h2 * 0.4);
          if (rnd(idx) < 0.5) dot(ctx, hx + ww * 0.5, hy + h2 * 0.5, 3, '#7fd0ff');
        }
      }
      // Drains along the streets, flowing to the river.
      const hd = hl(3);
      ctx.strokeStyle = hd ? tint('blue', 0.6 + 0.4 * hd) : 'rgba(120,190,255,0.55)'; ctx.lineWidth = hd ? 4 : 2.5;
      ctx.setLineDash([9, 7]); ctx.lineDashOffset = -k * 26; ctx.beginPath();
      for (const x of [440, 560, 680]) { ctx.moveTo(x, 230); ctx.lineTo(x, 512); }
      for (const y of [297, 365, 433]) { ctx.moveTo(320, y); ctx.lineTo(440, y); ctx.moveTo(800, y); ctx.lineTo(680, y); }
      ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      for (let i = 0; i < 8; i++) {
        const q = mod(k * 0.06 + i / 8, 1); const onX = i % 2 === 0;
        const x = onX ? lerp(325, 795, q) : [440, 560, 680][i % 3]; const y = onX ? [297, 365, 433][i % 3] : lerp(235, 495, q);
        dot(ctx, x, y, 4, '#f3e2c4');
      }
      // The river.
      ctx.fillStyle = 'rgba(70,140,210,0.75)'; ctx.beginPath(); ctx.moveTo(PX, 514);
      for (let x = PX; x <= PX + PW; x += 20) ctx.lineTo(x, 514 + Math.sin(x * 0.03 + k) * 3);
      ctx.lineTo(PX + PW, 544); ctx.lineTo(PX, 544); ctx.closePath(); ctx.fill();
      label(ctx, 'River Indus', 760, 561, { size: 18, weight: 600, fill: '#9fd0ff' });
      // A covered drain in cross-section.
      ctx.save(); ctx.globalAlpha *= 0.55 + 0.45 * Math.max(hd, S.i === 3 ? 1 : 0.4);
      panel(ctx, 84, 576, 360, 146, 'blue', 0.07, 12);
      label(ctx, 'A covered drain', 250, 594, { size: 18, weight: 700, fill: hd > 0.3 ? 'blue' : 'ink' });
      ctx.fillStyle = '#9c5e3e'; ctx.fillRect(100, 640, 328, 10);
      ctx.strokeStyle = 'rgba(50,30,20,0.6)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let x = 100; x <= 428; x += 30) { ctx.moveTo(x, 640); ctx.lineTo(x, 650); }
      ctx.stroke();
      ctx.fillStyle = '#7e4a30'; ctx.fillRect(150, 650, 10, 48); ctx.fillRect(390, 650, 10, 48); ctx.fillRect(150, 698, 250, 10);
      ctx.fillStyle = 'rgba(80,160,230,0.85)'; ctx.fillRect(160, 680, 230, 18);
      for (let i = 0; i < 5; i++) dot(ctx, 165 + mod(k * 40 + i * 46, 220), 688, 3, '#d6efff');
      ctx.fillStyle = '#b5704a'; ctx.fillRect(100, 604, 40, 36);
      line(ctx, 138, 630, 166, 630, '#8c5236', 6);
      for (let j = 0; j < 3; j++) { const ph = mod(k * 1.6 + j / 3, 1); dot(ctx, 168, 634 + ph * 44, 2.5, '#9fdcff'); }
      { const wq = mod(k * 0.2, 1); person(ctx, 352 + wq * 70, 640, 36, '#d9c7a6', { walk: k * 4, a: Math.min(1, wq * 6, (1 - wq) * 6) }); }
      ctx.restore();
      // A seal with the Indus script.
      const hz = hl(5);
      panel(ctx, 474, 576, 370, 146, 'purple', 0.07 + 0.08 * hz, 12);
      ctx.fillStyle = '#d8c7a2'; ctx.strokeStyle = '#8c7a58'; ctx.lineWidth = 2; ctx.fillRect(494, 598, 100, 100); ctx.strokeRect(494, 598, 100, 100);
      ctx.fillStyle = '#6e5a3c';
      ctx.beginPath(); ctx.ellipse(548, 664, 30, 12, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(574, 660); ctx.lineTo(586, 648); ctx.lineTo(582, 666); ctx.closePath(); ctx.fill();
      line(ctx, 584, 648, 592, 636, '#6e5a3c', 2.5);
      ctx.lineWidth = 3; ctx.strokeStyle = '#6e5a3c'; ctx.beginPath();
      for (const lx of [528, 540, 566]) { ctx.moveTo(lx, 672); ctx.lineTo(lx + 2, 690); }
      ctx.moveTo(506, 612); ctx.lineTo(506, 628); ctx.moveTo(518, 612); ctx.lineTo(526, 628); ctx.moveTo(526, 612); ctx.lineTo(518, 628);
      ctx.moveTo(540, 612); ctx.lineTo(552, 612); ctx.lineTo(546, 628); ctx.moveTo(564, 620); ctx.arc(570, 620, 6, Math.PI, TAU * 1.5);
      ctx.stroke();
      label(ctx, 'Seals with Indus script', 718, 618, { size: 18, weight: 700, fill: hz > 0.3 ? 'purple' : 'ink' });
      label(ctx, 'Nobody can read it yet', 718, 650, { size: 18, weight: 500, fill: 'muted' });
      label(ctx, 'Used to stamp trade goods', 718, 682, { size: 18, weight: 500, fill: 'muted' });
      endBox(ctx);
      chip(ctx, 'c. 2500 BCE', 786, 202, 'yellow', 18);
      caption(ctx, S);
      ctx.restore();
    },

    // Citizens on the Pnyx hill debate and vote with raised hands; pottery
    // shards are cast to ostracise a leader; and the plain truth of who was
    // left out of the vote.
    'athenian-democracy'(b, ctx, it, t) {
      const S = stages(t, [
        [4.5, '508 BCE: Cleisthenes gives power to the citizens', 'blue', 'Demokratia: "rule by the people"'],
        [4, 'Citizens meet on the Pnyx hill to debate', 'cyan', 'Any citizen could stand up and speak'],
        [4.5, 'Votes are judged by a show of hands', 'green', 'The side with more hands wins'],
        [5, 'Ostracism: scratch a name on a pottery shard', 'orange', 'If 6,000 voted, the top name was exiled for 10 years'],
        [5.5, 'Only adult male citizens could vote', 'red', 'Women, enslaved people and foreigners were left out'],
      ]);
      const k = b.clock; const SIL = '#1c2440';
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Democracy in ancient Athens');
      // The Pnyx: speaker's platform, the crowd on the slope, the Acropolis.
      sceneBox(ctx, [[0, '#5d8fd0'], [0.7, '#bcd4ee'], [1, '#e8dcc0']], PX, PY, PW, 296);
      ctx.fillStyle = 'rgba(150,140,120,0.7)'; poly(ctx, [560, 330, 640, 280, 800, 272, 850, 300, 850, 340], true); ctx.fill();
      const pa = { x: 700, y: 258 };
      ctx.fillStyle = 'rgba(245,240,225,0.95)'; ctx.fillRect(pa.x - 50, pa.y + 16, 100, 6);
      poly(ctx, [pa.x - 54, pa.y, pa.x, pa.y - 14, pa.x + 54, pa.y], true); ctx.fill();
      for (let i = 0; i < 8; i++) ctx.fillRect(pa.x - 46 + i * 12.5, pa.y, 5, 16);
      ctx.fillStyle = '#c6b48e'; poly(ctx, [PX, 474, 240, 450, 520, 400, 850, 350, 850, 474], true); ctx.fill();
      ctx.fillStyle = '#d8ccb0'; ctx.fillRect(100, 418, 92, 56); ctx.fillRect(116, 404, 60, 14);
      const vote = S.i === 2; const hv = vote ? clamp((S.lt - 0.4) / 1.6) : 0;
      person(ctx, 146, 404, 62, SIL, { robe: true, arms: S.i <= 1 ? (mod(k, 2.4) < 1.2 ? 'point' : 'raise') : 'down', face: 1 });
      let id = 0; let yes = 0; let all = 0;
      for (let r = 3; r >= 0; r--) {
        const base = 468 - r * 28; const h = 44 - r * 3;
        for (let x = 260 + r * 34 + (r % 2) * 14; x < 838; x += 31) {
          id++; const sway = Math.sin(k * 1.3 + id) * 0.04;
          const yv = rnd(id + 11) < 0.62; all++; if (yv) yes++;
          const up = vote && yv && hv > rnd(id + 50) * 0.9;
          const yb = base - (x - 260) * 0.12;
          person(ctx, x, yb, h, ['#2a3150', '#3a3048', '#283a48'][id % 3], { robe: true, face: -1, arms: up ? 'raise' : 'down', lean: sway });
        }
      }
      endBox(ctx, PX, PY, PW, 296);
      chip(ctx, 'The Pnyx, Athens', 160, 212, 'blue', 18);
      // Below: the word, the vote, the shards, who could vote.
      sceneBox(ctx, [[0, 'rgba(20,28,60,0.9)'], [1, 'rgba(10,14,34,0.9)']], PX, 488, PW, 242);
      const a0 = Math.max(S.on(0, 0.4), S.on(1, 0.4));
      if (a0) {
        ctx.save(); ctx.globalAlpha *= a0;
        label(ctx, 'δημοκρατία', cx, 552, { size: 52, weight: 700, fill: 'blue' });
        label(ctx, 'dēmos = the people   +   kratos = power', cx, 612, { size: 22, weight: 600, fill: 'ink' });
        label(ctx, S.i === 0 ? 'Athens, 508–507 BCE: power to the citizens' : 'The assembly met about 40 times a year', cx, 664, { size: 19, weight: 500, fill: 'muted' });
        ctx.restore();
      }
      const a2 = S.on(2, 0.4);
      if (a2) {
        ctx.save(); ctx.globalAlpha *= a2;
        const fy = yes / all; const g = smooth((S.lt - 0.4) / 1.8);
        label(ctx, 'For', 176, 560, { size: 22, weight: 700, fill: 'green', align: 'right' });
        label(ctx, 'Against', 176, 620, { size: 22, weight: 700, fill: 'red', align: 'right' });
        ctx.fillStyle = tint('green', 0.6); rounded(ctx, 192, 544, 540 * fy * g, 32, 8); ctx.fill();
        ctx.fillStyle = tint('red', 0.6); rounded(ctx, 192, 604, 540 * (1 - fy) * g, 32, 8); ctx.fill();
        label(ctx, 'Hands were judged by eye, not counted one by one', cx, 680, { size: 19, weight: 500, fill: 'muted' });
        ctx.restore();
      }
      const a3 = S.on(3, 0.4);
      if (a3) {
        ctx.save(); ctx.globalAlpha *= a3;
        ctx.fillStyle = '#9a5634';
        for (let i = 0; i < 18; i++) { const sx = 150 + (rnd(i) - 0.5) * 140; const sy = 690 - rnd(i + 3) * 26 * Math.min(1, S.lt / 3); poly(ctx, [sx - 10, sy, sx + 2, sy - 9, sx + 12, sy - 2, sx + 4, sy + 6], true); ctx.fill(); }
        for (let i = 0; i < 3; i++) { const q = mod(S.lt * 0.7 + i / 3, 1); const sx = 150 + (i - 1) * 40; const sy = 520 + q * 160; ctx.globalAlpha *= 1; poly(ctx, [sx - 10, sy, sx + 2, sy - 9, sx + 12, sy - 2, sx + 4, sy + 6], true); ctx.fill(); }
        label(ctx, 'Ostraka', 150, 716, { size: 18, weight: 700, fill: 'orange' });
        ctx.fillStyle = '#c0703f'; ctx.strokeStyle = '#7a3e1e'; ctx.lineWidth = 3;
        poly(ctx, [330, 540, 520, 512, 760, 540, 790, 610, 720, 668, 450, 676, 340, 640], true); ctx.fill(); ctx.stroke();
        label(ctx, 'ΘΕΜΙΣΤΟΚΛΗΣ', 560, 596, { size: 34, weight: 800, fill: '#3a1a0a' });
        label(ctx, 'Themistocles: ostracised about 471 BCE', 560, 706, { size: 18, weight: 600, fill: 'ink' });
        ctx.restore();
      }
      const a4 = S.on(4, 0.4);
      if (a4) {
        ctx.save(); ctx.globalAlpha *= a4;
        const G = [['Male citizens', true, '#3a5a9a'], ['Women', false, '#7a4a8a'], ['Enslaved people', false, '#5a5a6a'], ['Foreigners', false, '#4a6a6a']];
        G.forEach(([name, ok, c], i) => {
          const gx = 160 + i * 200; const show = after(S.lt, 0.3 + i * 0.5);
          ctx.save(); ctx.globalAlpha *= show;
          person(ctx, gx, 660, 96, c, { robe: true, col: ok ? '#9fb4e6' : 'rgba(170,170,190,0.55)' });
          mark(ctx, gx + 46, 560, ok, 16);
          label(ctx, name, gx, 692, { size: 19, weight: 700, fill: ok ? 'green' : 'ink' });
          ctx.restore();
        });
        ctx.restore();
      }
      endBox(ctx, PX, 488, PW, 242);
      caption(ctx, S);
      ctx.restore();
    },

    // Water from a spring in the hills runs gently downhill along a channel,
    // underground and over two tiers of arches, into a city's fountain;
    // below, roads radiate from Rome with travellers on them.
    'roman-aqueduct'(b, ctx, it, t) {
      const S = stages(t, [
        [4, "312 BCE: the Aqua Appia, Rome's first aqueduct", 'yellow', 'Rome would build 11 aqueducts in all'],
        [4.5, 'Water flows gently downhill, moved only by gravity', 'cyan', 'A fall of only a few metres over many kilometres'],
        [4, 'Stone arches carry the channel across valleys', 'orange', 'Most of the channel actually ran underground'],
        [4, 'In the city: fountains, public baths and homes', 'teal', 'A water tower shared the water out through pipes'],
        [5, 'Paved roads linked the empire: "all roads lead to Rome"', 'green', 'More than 80,000 km of paved roads'],
      ]);
      const k = b.clock; const hl = (j) => S.on(j, 0.5);
      const yc = (x) => 270 + ((x - 120) * 50) / 580;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Roman aqueducts and roads');
      sceneBox(ctx, [[0, '#4f7fc4'], [0.75, '#cfe0f0'], [1, '#b49a6a']], PX, PY, PW, 322);
      // Hills, valley and city ground.
      ctx.fillStyle = '#7d8f55'; ctx.beginPath(); ctx.moveTo(PX, 250); ctx.quadraticCurveTo(180, 240, 252, 330); ctx.quadraticCurveTo(270, 470, 300, 480);
      ctx.lineTo(640, 480); ctx.quadraticCurveTo(660, 410, 700, 404); ctx.lineTo(850, 404); ctx.lineTo(850, 500); ctx.lineTo(PX, 500); ctx.closePath(); ctx.fill();
      // Aqueduct bridge with two tiers of arches (holes cut by even-odd fill).
      const ha = hl(2);
      ctx.fillStyle = ha ? '#e2cc9a' : '#cdb788'; ctx.beginPath();
      ctx.moveTo(250, yc(250)); ctx.lineTo(650, yc(650)); ctx.lineTo(650, 480); ctx.lineTo(250, 480); ctx.closePath();
      for (let j = 0; j < 5; j++) { const x0 = 262 + j * 78; const x1 = x0 + 54; const r = 27; ctx.moveTo(x0, 480); ctx.lineTo(x0, 432); ctx.arc(x0 + r, 432, r, Math.PI, 0); ctx.lineTo(x1, 480); ctx.closePath(); }
      for (let j = 0; j < 10; j++) { const x0 = 256 + j * 39.5; const x1 = x0 + 27; const r = 13.5; const ys = yc(x0 + r) + 44; ctx.moveTo(x0, 392); ctx.lineTo(x0, ys); ctx.arc(x0 + r, ys, r, Math.PI, 0); ctx.lineTo(x1, 392); ctx.closePath(); }
      ctx.fill('evenodd');
      ctx.strokeStyle = 'rgba(110,90,60,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(250, 396); ctx.lineTo(650, 396); ctx.stroke();
      // The channel and the water in it.
      ctx.fillStyle = '#b8a272'; poly(ctx, [250, yc(250) - 12, 700, yc(700) - 12, 700, yc(700), 250, yc(250)], true); ctx.fill();
      const hw = hl(1);
      ctx.strokeStyle = hw ? '#7fe4ff' : '#4fb6ff'; ctx.lineWidth = hw ? 6 : 4; ctx.setLineDash([16, 10]); ctx.lineDashOffset = -k * 40;
      ctx.beginPath(); ctx.moveTo(120, yc(120) - 5); ctx.lineTo(700, yc(700) - 5); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      ctx.fillStyle = 'rgba(90,110,60,0.6)'; ctx.beginPath(); ctx.moveTo(PX, 250); ctx.quadraticCurveTo(180, 240, 252, 330); ctx.lineTo(252, 300); ctx.lineTo(PX, 300); ctx.closePath(); ctx.fill();
      dot(ctx, 116, 262, 9, '#6fd0ff');
      label(ctx, 'Spring', 120, 232, { size: 18, weight: 700, fill: '#0e2340' });
      line(ctx, 120, 262, 700, 262, 'rgba(20,40,80,0.45)', 1.5, [6, 6]);
      arr(ctx, 712, 262, 712, yc(700) - 8, hw ? 'cyan' : 'rgba(20,40,80,0.6)', 3);
      label(ctx, 'A gentle slope: gravity moves the water', 440, 240, { size: 19, weight: 700, fill: hw > 0.3 ? '#0a4a6a' : '#0e2340' });
      // City: water tower, fountain, temple.
      const hc = hl(3);
      ctx.fillStyle = '#d7c39a'; ctx.fillRect(668, yc(700) - 4, 40, 408 - yc(700));
      line(ctx, 708, 396, 740, 396, '#7a6a50', 4);
      ctx.fillStyle = '#cbb38a'; ctx.fillRect(728, 384, 30, 18);
      for (let i = 0; i < 9; i++) { const q = mod(k * 1.2 + i / 9, 1); const sx = 743 + (i - 4) * 4 * q; dot(ctx, sx, 384 - 30 * q * (1.4 - q) * 2, 2.5, hc ? '#9fe8ff' : '#6fc8ff'); }
      ctx.fillStyle = '#efe6d2'; poly(ctx, [770, 330, 810, 312, 850, 330], true); ctx.fill(); ctx.fillRect(772, 334, 78, 6);
      for (let i = 0; i < 5; i++) ctx.fillRect(776 + i * 16, 340, 6, 60);
      ctx.fillStyle = '#b5543a'; for (const [hx, hy] of [[760, 404]]) { ctx.fillRect(hx - 30, hy - 10, 1, 1); }
      if (hc) { ctx.strokeStyle = tint('teal', hc); ctx.lineWidth = 3; rounded(ctx, 660, 300, 190, 108, 10); ctx.stroke(); }
      endBox(ctx, PX, PY, PW, 322);
      chip(ctx, '312 BCE', 790, 212, 'yellow', 18);
      // Roads radiating from Rome.
      const hr = Math.max(hl(4), 0.35);
      sceneBox(ctx, [[0, 'rgba(60,70,40,0.55)'], [1, 'rgba(30,36,22,0.7)']], PX, 512, PW, 218);
      ctx.save(); ctx.globalAlpha *= 0.4 + 0.6 * hr;
      const R0 = { x: 460, y: 622 };
      const roads = [[90, 585, 'Via Aurelia', 100, 562, 'left'], [620, 520, 'Via Flaminia', 588, 530, 'right'], [850, 575, 'Via Salaria', 842, 552, 'right'], [850, 700, 'Via Appia', 702, 712, 'left'], [90, 676, 'Via Ostiensis', 100, 702, 'left'], [250, 512, ''], [850, 640, ''], [330, 740, ''], [470, 512, '']];
      roads.forEach(([ex, ey, name, lx, ly, al], i) => {
        line(ctx, R0.x, R0.y, ex, ey, 'rgba(200,190,160,0.95)', 7);
        line(ctx, R0.x, R0.y, ex, ey, 'rgba(110,100,80,0.9)', 1.5, [3, 9]);
        for (let j = 0; j < 2; j++) { const q = mod(k * 0.07 + j * 0.5 + rnd(i) , 1); dot(ctx, lerp(ex, R0.x, q), lerp(ey, R0.y, q), 4.5, j ? '#ffd27a' : '#f0f0f0'); }
        if (name) label(ctx, name, lx, ly, { size: 18, weight: 700, fill: 'ink', align: al });
      });
      ctx.restore();
      dot(ctx, R0.x, R0.y, 26, '#7a2e2e'); ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(R0.x, R0.y, 26, 0, TAU); ctx.stroke();
      label(ctx, 'ROMA', R0.x, R0.y + 1, { size: 18, weight: 800, fill: '#ffe2a0' });
      endBox(ctx, PX, 512, PW, 218);
      caption(ctx, S);
      ctx.restore();
    },

    // A map of the Silk Road from Xi'an to Constantinople with goods moving
    // both ways, and below a camel caravan walking through the desert.
    'silk-road-caravan'(b, ctx, it, t) {
      const S = stages(t, [
        [4.5, 'From about 130 BCE, Han China opens routes west', 'yellow', 'After the journeys of the envoy Zhang Qian'],
        [4, 'Silk and paper travel west', 'purple', 'Rome prized Chinese silk; paper reached the West later'],
        [4, 'Glass, silver, wool and horses travel east', 'cyan', 'Fine horses from Central Asia were prized in China'],
        [4, 'Spices from India join the trade', 'orange', 'Pepper, cinnamon and cotton cloth'],
        [4.5, 'Ideas travel too: religions, maths and inventions', 'yellow', 'Buddhism reached China along these routes'],
        [4.5, 'Few went the whole way: goods passed hand to hand', 'teal', 'Merchants traded from one market city to the next'],
      ]);
      const k = b.clock;
      const R = { x: PX + 8, y: 186, w: PW - 16, h: 254, lon0: 8, lon1: 125, lat0: 15, lat1: 53 };
      const C = it._c || (it._c = {
        main: route(R, [[29, 41], [36.2, 36.2], [44.4, 33.3], [61.8, 37.6], [67, 39.7], [76, 39.5], [94.7, 40.1], [108.9, 34.3]], 0.08),
        india: route(R, [[78, 22], [77, 28.6], [73.5, 34], [76, 39.5]], 0.1),
      });
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Silk Road');
      world(ctx, R, { land: 'rgba(196,170,120,0.32)', edge: 'rgba(230,205,150,0.55)' });
      ctx.strokeStyle = 'rgba(255,214,120,0.9)'; ctx.lineWidth = 4; ctx.setLineDash([12, 7]); ctx.lineDashOffset = -k * 10;
      strokeSpan(ctx, C.main, 0, C.main.total * (S.i === 0 ? smooth(S.lt / 3) : 1));
      ctx.strokeStyle = 'rgba(255,170,90,0.85)'; ctx.lineWidth = 3;
      if (S.i >= 3) strokeSpan(ctx, C.india, 0, C.india.total * (S.i === 3 ? smooth(S.lt / 2) : 1));
      ctx.setLineDash([]); ctx.lineDashOffset = 0;
      for (const [lon, lat, name, dx, dy] of [[29, 41, 'Constantinople', 0, -22], [44.4, 33.3, 'Baghdad', 0, 22], [67, 39.7, 'Samarkand', 0, -22], [108.9, 34.3, "Xi'an", 0, 22], [78, 22, 'India', 0, 22]]) {
        if (name === 'India' && S.i < 3) continue;
        const p = proj(R, lon, lat); dot(ctx, p.x, p.y, 6, '#ffe2a0');
        label(ctx, name, p.x + dx, p.y + dy, { size: 18, weight: 700, fill: 'ink' });
      }
      // Goods moving along the road.
      const goods = [null, [['#c084fc', -1], ['#f5f5f5', -1]], [['#67e8f9', 1], ['#cbd5e1', 1]], [['#fb923c', 0]], [['#fde047', -1], ['#fde047', 1]], null][S.i];
      if (goods) {
        goods.forEach(([c, dir], g) => {
          for (let j = 0; j < 4; j++) {
            const q = mod(k * 0.09 + j / 4 + g * 0.125, 1);
            let P;
            if (dir === 0) { const tot = C.india.total + C.main.total * 0.62; const dd = q * tot; P = dd < C.india.total ? at(C.india, dd) : at(C.main, C.main.total * 0.62 - (dd - C.india.total) * 1); }
            else P = at(C.main, (dir < 0 ? 1 - q : q) * C.main.total);
            ctx.fillStyle = c; ctx.fillRect(P.x - 6, P.y - 6, 12, 12);
          }
        });
      }
      if (S.i === 5) {
        const stops = [0, 0.13, 0.25, 0.47, 0.56, 0.68, 0.86, 1];
        for (let j = 0; j < stops.length - 1; j++) {
          const q = (Math.sin(k * 1.6 + j * 1.3) + 1) / 2; const P = at(C.main, lerp(stops[j], stops[j + 1], q) * C.main.total);
          ctx.fillStyle = '#5eead4'; ctx.fillRect(P.x - 6, P.y - 6, 12, 12);
        }
      }
      // The caravan.
      sceneBox(ctx, [[0, '#f0b26a'], [0.5, '#e6a25c'], [1, '#b87a3e']], PX, 456, PW, 274);
      const east = S.i === 2; const dir = east ? 1 : -1; const scroll = k * 30 * -dir;
      ctx.fillStyle = 'rgba(205,140,75,0.9)'; ctx.beginPath(); ctx.moveTo(PX, 640);
      for (let x = PX; x <= PX + PW; x += 10) ctx.lineTo(x, 600 - 26 * Math.sin((x + scroll * 0.4) * 0.012) - 14 * Math.sin((x + scroll * 0.4) * 0.031));
      ctx.lineTo(PX + PW, 700); ctx.lineTo(PX, 700); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c98b4c'; ctx.fillRect(PX, 690, PW, 40);
      ctx.fillStyle = 'rgba(120,80,40,0.5)'; for (let i = 0; i < 14; i++) ctx.fillRect(PX + mod(i * 61 + scroll, PW), 700 + (i % 3) * 8, 6, 3);
      dot(ctx, 760, 500, 18, '#fff1c4', 10);
      const cargo = [['Silk', 'Silk', 'Silk'], ['Silk', 'Paper', 'Silk'], ['Glass', 'Silver', 'Wool'], ['Spices', 'Pepper', 'Cotton'], ['Books', 'Ideas', 'Maths'], ['Silk', 'Spices', 'Glass']][S.i];
      const ccol = [['#c084fc', '#c084fc', '#c084fc'], ['#c084fc', '#f5f5f5', '#c084fc'], ['#67e8f9', '#cbd5e1', '#fde68a'], ['#fb923c', '#7c2d12', '#f5f5f5'], ['#fde047', '#fde047', '#fde047'], ['#c084fc', '#fb923c', '#67e8f9']][S.i];
      const fo = 1 - smooth((S.lt - S.dur + 0.45) / 0.45); const fi = smooth(S.lt / 0.45);
      const alpha = S.i === 2 ? fadeIO(S.lt, S.dur, 0.45) : S.i === 1 ? fo : S.i === 3 ? fi : 1; const labA = Math.min(fo, fi);
      ctx.save(); ctx.globalAlpha *= alpha;
      const xs = [300, 470, 640]; const GY = 692;
      const lead = east ? 760 : 170;
      person(ctx, lead, GY, 66, '#4a2a14', { walk: k * 4, face: dir, robe: true, staff: true, arms: 'hold' });
      xs.forEach((x0, i) => {
        const x = x0; const ph = k * 4 + i * 1.7; const bob = Math.sin(ph * 2) * 2;
        const f = dir; const by = GY - 74 + bob;
        ctx.fillStyle = '#8a5a30'; ctx.strokeStyle = '#8a5a30'; ctx.lineCap = 'round';
        ctx.lineWidth = 8; ctx.beginPath();
        for (const [lx, o] of [[-26, 0], [-18, Math.PI], [20, Math.PI], [28, 0]]) { const sw = Math.sin(ph + o) * 10; ctx.moveTo(x + f * lx, by + 10); ctx.lineTo(x + f * lx + sw * 0.5, by + 40); ctx.lineTo(x + f * lx + sw, GY); }
        ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, by, 44, 20, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x - f * 4, by - 16, 22, 16, 0, Math.PI, TAU); ctx.fill();
        ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x + f * 36, by - 4); ctx.quadraticCurveTo(x + f * 62, by - 8, x + f * 60, by - 44); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x + f * 68, by - 46, 13, 7, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.globalAlpha *= labA;
        ctx.fillStyle = ccol[i]; rounded(ctx, x - 30, by - 40, 52, 26, 6); ctx.fill();
        ctx.strokeStyle = 'rgba(60,30,10,0.6)'; ctx.lineWidth = 2; rounded(ctx, x - 30, by - 40, 52, 26, 6); ctx.stroke();
        label(ctx, cargo[i], x - 4, by - 66, { size: 19, weight: 800, fill: '#3a1d08' });
        ctx.restore();
      });
      ctx.restore();
      endBox(ctx, PX, 456, PW, 274);
      label(ctx, east ? 'Heading east →' : '← Heading west', 170, 486, { size: 18, weight: 700, fill: '#3a1d08' });
      caption(ctx, S);
      ctx.restore();
    },

    // ─── The medieval world ───────────────────────────────────────────────

    // A longship rowing and sailing over the waves; below, a map of the
    // routes from Scandinavia: raids, settlements, trade and exploration.
    'viking-longship'(b, ctx, it, t) {
      const S = stages(t, [
        [4.5, '793: Vikings raid the monastery at Lindisfarne', 'red', 'The usual start date of the Viking Age'],
        [4, 'Settlers found Dublin (841) and Normandy (911)', 'orange', 'Shallow hulls could sail the open sea and up rivers'],
        [4.5, 'Traders row rivers east to Kyiv and Constantinople', 'yellow', 'Furs, amber and slaves for silver and silk'],
        [4.5, 'Iceland settled about 874, Greenland about 985', 'cyan', 'Farmers crossed the North Atlantic with their animals'],
        [4.5, 'About 1000: Leif Erikson reaches North America', 'teal', "Remains survive at L'Anse aux Meadows, Newfoundland"],
        [5, '1066: defeat at Stamford Bridge ends the Viking Age', 'purple', 'Raiders, but also farmers, traders, explorers and poets'],
      ]);
      const k = b.clock;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Viking longships');
      sceneBox(ctx, [[0, '#46597e'], [0.62, '#a9b8c8'], [0.63, '#2c5170'], [1, '#14304a']], PX, PY, PW, 262);
      // The ship.
      const sx = 460 + Math.sin(k * 0.4) * 18; const bob = Math.sin(k * 1.3) * 3; const wl = 372 + bob; const tilt = Math.sin(k * 1.3 + 0.6) * 0.025;
      ctx.save(); ctx.translate(sx, wl); ctx.rotate(tilt);
      const row = k * 2.4;
      ctx.strokeStyle = '#d9c7a0'; ctx.lineWidth = 3;
      for (let i = 0; i < 9; i++) { const ox = -130 + i * 30; ctx.beginPath(); ctx.moveTo(ox, -18); ctx.lineTo(ox - 30 - 16 * Math.cos(row + i * 0.15), 30 + 8 * Math.sin(row + i * 0.15)); ctx.stroke(); }
      ctx.fillStyle = '#5a3b22'; ctx.beginPath();
      ctx.moveTo(-190, -64); ctx.quadraticCurveTo(-178, -20, -150, -16); ctx.lineTo(150, -16); ctx.quadraticCurveTo(178, -20, 190, -70);
      ctx.lineTo(198, -72); ctx.quadraticCurveTo(192, -4, 150, 12); ctx.quadraticCurveTo(0, 26, -150, 12); ctx.quadraticCurveTo(-194, -2, -198, -66); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(230,200,150,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (const yy of [-6, 4]) { ctx.moveTo(-170, yy - 6); ctx.quadraticCurveTo(0, yy + 16, 170, yy - 6); }
      ctx.stroke();
      ctx.fillStyle = '#5a3b22'; ctx.beginPath(); ctx.moveTo(194, -72); ctx.quadraticCurveTo(208, -96, 222, -88); ctx.lineTo(214, -78); ctx.quadraticCurveTo(204, -84, 200, -66); ctx.closePath(); ctx.fill();
      dot(ctx, 214, -88, 2.5, '#ffd27a');
      ctx.beginPath(); ctx.arc(-198, -74, 10, Math.PI * 0.2, Math.PI * 1.6); ctx.strokeStyle = '#5a3b22'; ctx.lineWidth = 6; ctx.stroke();
      for (let i = 0; i < 11; i++) { const ox = -140 + i * 28; dot(ctx, ox, -18, 10, i % 2 ? '#d9a33a' : '#b93b3b'); dot(ctx, ox, -18, 3, '#e8e0d0'); }
      line(ctx, 0, -18, 0, -168, '#4a3018', 5);
      line(ctx, -84, -156, 84, -156, '#4a3018', 4);
      const billow = 10 + Math.sin(k * 0.9) * 4;
      for (let i = 0; i < 6; i++) {
        const x0 = -80 + i * (160 / 6); const x1 = x0 + 160 / 6;
        ctx.fillStyle = i % 2 ? '#efe6d2' : '#b83a32'; ctx.beginPath();
        ctx.moveTo(x0, -154); ctx.lineTo(x1, -154); ctx.lineTo(x1 + (i - 2.5) * 1.5, -60 + billow * Math.sin(((i + 1) / 6) * Math.PI)); ctx.lineTo(x0 + (i - 3.5) * 1.5, -60 + billow * Math.sin((i / 6) * Math.PI)); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(40,85,120,0.85)'; ctx.beginPath(); ctx.moveTo(PX, 440);
      for (let x = PX; x <= PX + PW; x += 10) ctx.lineTo(x, 382 + Math.sin(x * 0.04 + k * 1.6) * 4 + Math.sin(x * 0.013 - k) * 3);
      ctx.lineTo(PX + PW, 440); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(220,235,250,0.5)'; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i < 12; i++) { const wx = PX + mod(i * 71 - k * 30, PW); const wy = 400 + (i % 3) * 12; ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 10, wy - 4, wx + 20, wy); }
      ctx.stroke();
      endBox(ctx, PX, PY, PW, 262);
      chip(ctx, 'About 793–1066', 150, 210, 'yellow', 18);
      // The map of routes.
      const R = { x: PX + 4, y: 452, w: PW - 8, h: 276, lon0: -64, lon1: 62, lat0: 35, lat1: 72 };
      const C = it._c || (it._c = {
        r: [
          [route(R, [[6, 60], [-1.8, 55.7]], 0.2)],
          [route(R, [[6, 60], [-4, 59], [-6.3, 53.3]], 0.12), route(R, [[9, 56], [3, 52], [1, 49.4]], 0.12)],
          [route(R, [[18, 59], [28, 59.5], [31, 56], [30.5, 50.4], [31, 46], [29, 41]], 0.06)],
          [route(R, [[5, 61], [-7, 62], [-21.9, 64.1]], 0.1), route(R, [[-21.9, 64.1], [-45, 61]], 0.12)],
          [route(R, [[-45, 61], [-55.5, 51.6]], 0.15)],
          [route(R, [[6, 60], [-0.9, 54]], 0.15)],
        ],
        dest: [[[-1.8, 55.7]], [[-6.3, 53.3], [1, 49.4]], [[30.5, 50.4], [29, 41]], [[-21.9, 64.1], [-45, 61]], [[-55.5, 51.6]], [[-0.9, 54]]],
        name: ['Lindisfarne, 793', 'Dublin 841 · Normandy 911', 'Kyiv · Constantinople', 'Iceland 874 · Greenland 985', 'Vinland, about 1000', 'Stamford Bridge, 1066'],
      });
      world(ctx, R, { land: 'rgba(160,185,210,0.3)' });
      const home = proj(R, 13, 61); label(ctx, 'Scandinavia', home.x + 8, home.y - 4, { size: 18, weight: 700, fill: 'ink' });
      C.r.forEach((rs, j) => {
        if (j > S.i) return;
        const cur = j === S.i;
        for (const r of rs) {
          ctx.strokeStyle = cur ? '#ffd27a' : 'rgba(255,210,122,0.45)'; ctx.lineWidth = cur ? 3.5 : 2.5; ctx.setLineDash([9, 6]);
          strokeSpan(ctx, r, 0, r.total * (cur ? smooth(S.lt / 1.8) : 1));
          ctx.setLineDash([]);
          if (cur && S.lt > 0.3) { const P = at(r, mod(k * 0.25, 1) * r.total); dot(ctx, P.x, P.y, 5, '#ffffff'); }
        }
        for (const [lon, lat] of C.dest[j]) { const p = proj(R, lon, lat); if (cur) ping(ctx, p.x, p.y, k, 'yellow', 5); else dot(ctx, p.x, p.y, 4, 'rgba(255,210,122,0.8)'); }
      });
      ctx.save(); ctx.globalAlpha *= fadeIO(S.lt, S.dur, 0.3);
      chip(ctx, C.name[S.i], 82, 704, 'yellow', 19, 'left');
      ctx.restore();
      caption(ctx, S);
      ctx.restore();
    },

    // A Norman motte-and-bailey gives way to a stone castle; a trebuchet's
    // counterweight drops and hurls a stone at the walls while defenders
    // shelter on the battlements; then cannon arrive.
    'castle-siege'(b, ctx, it, t) {
      const S = stages(t, [
        [4.5, 'After 1066: Norman motte-and-bailey castles', 'orange', 'A wooden tower on an earth mound, a fenced yard below'],
        [4, 'Stone castles replaced wood: stronger, harder to burn', 'yellow', 'Thick curtain walls, towers and a great keep'],
        [5, 'A trebuchet: the falling counterweight flings a stone', 'cyan', 'Some could throw a 100 kg stone a few hundred metres'],
        [4.5, 'Defenders held the walls; sieges could last months', 'teal', 'Attackers often tried to starve a castle out'],
        [4.5, 'From the 1400s, cannon made high walls less safe', 'red', 'Castles slowly gave way to low, thick forts'],
      ]);
      const k = b.clock; const GY = 640;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Castles and sieges');
      sceneBox(ctx, [[0, '#4d6fa6'], [0.8, '#c8d6e6'], [0.81, '#5f7d3c'], [1, '#3e5428']]);
      for (let i = 0; i < 3; i++) { const x = PX + mod(k * (8 + i * 3) + i * 290, PW + 200) - 100; const y = 240 + i * 46; ctx.fillStyle = 'rgba(255,255,255,0.55)'; for (const [dx, dy, r] of [[0, 0, 22], [24, -8, 26], [50, 0, 20], [24, 6, 22]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r, 0, TAU); ctx.fill(); } }
      ctx.fillStyle = 'rgba(110,135,90,0.6)'; ctx.beginPath(); ctx.moveTo(PX, 600); ctx.quadraticCurveTo(300, 560, 520, 600); ctx.quadraticCurveTo(700, 570, 850, 590); ctx.lineTo(850, GY); ctx.lineTo(PX, GY); ctx.closePath(); ctx.fill();
      // Motte and bailey (fades as stone rises).
      const wood = S.i === 0 ? 1 : S.i === 1 ? 1 - smooth(S.lt / 1.5) : 0;
      const stone = S.i === 0 ? 0 : S.i === 1 ? smooth((S.lt - 0.3) / 2.4) : 1;
      if (wood > 0) {
        ctx.save(); ctx.globalAlpha *= wood;
        ctx.fillStyle = '#6f7d3e'; ctx.beginPath(); ctx.ellipse(760, GY, 100, 112, 0, Math.PI, TAU); ctx.fill();
        ctx.fillStyle = '#8a6238'; ctx.fillRect(728, 448, 64, 82); poly(ctx, [722, 448, 760, 418, 798, 448], true); ctx.fill();
        ctx.strokeStyle = 'rgba(60,40,20,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let x = 736; x < 792; x += 10) { ctx.moveTo(x, 452); ctx.lineTo(x, 528); } ctx.stroke();
        ctx.fillStyle = '#7a5530'; for (let x = 690; x <= 830; x += 9) { const yy = GY - 112 * Math.sqrt(Math.max(0, 1 - ((x - 760) / 100) ** 2)); poly(ctx, [x - 4, yy, x - 4, yy - 22, x, yy - 28, x + 4, yy - 22, x + 4, yy], true); ctx.fill(); }
        line(ctx, 660, 600, 708, 548, '#7a5530', 5);
        ctx.fillStyle = '#8a6238'; ctx.fillRect(540, 600, 90, 40); poly(ctx, [532, 600, 585, 576, 638, 600], true); ctx.fill();
        ctx.fillStyle = '#7a5530'; for (let x = 486; x <= 666; x += 9) { poly(ctx, [x - 4, GY, x - 4, GY - 44, x, GY - 52, x + 4, GY - 44, x + 4, GY], true); ctx.fill(); }
        ctx.restore();
      }
      // The stone castle, rising from the ground.
      if (stone > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(470, GY - 300 * stone, 390, 300 * stone); ctx.clip();
        const ST = '#b9b3a6'; const ST2 = '#9d9789';
        const cren = (x0, x1, y) => { ctx.fillStyle = ST; for (let x = x0; x < x1 - 4; x += 16) ctx.fillRect(x, y - 12, 10, 12); };
        ctx.fillStyle = ST2; ctx.fillRect(600, 372, 130, 120); cren(600, 730, 372);
        ctx.fillStyle = '#2a2a38'; for (const wx of [625, 660, 695]) { rounded(ctx, wx - 5, 400, 10, 22, 5); ctx.fill(); }
        if (S.i >= 2) {
          const duck = S.i >= 2 ? mod(S.u - S.starts[2], 4.6) : 0; const ducking = duck > 1.6 && duck < 2.4;
          for (const [px, f] of [[548, -1], [588, -1], [742, -1], [780, -1]]) person(ctx, px, ducking ? 506 : 494, 46, '#2a3048', { face: f, arms: ducking ? 'carry' : 'hold' });
        }
        ctx.fillStyle = ST; ctx.fillRect(500, 470, 330, GY - 470); cren(500, 830, 470);
        ctx.strokeStyle = 'rgba(90,85,75,0.5)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let y = 486; y < GY; y += 16) { ctx.moveTo(500, y); ctx.lineTo(830, y); for (let x = 500 + ((y / 16) % 2) * 14; x < 830; x += 28) { ctx.moveTo(x, y); ctx.lineTo(x, y + 16); } }
        ctx.stroke();
        for (const tx of [482, 798]) { ctx.fillStyle = ST2; ctx.fillRect(tx, 426, 52, GY - 426); cren(tx, tx + 54, 426); ctx.fillStyle = '#2a2a38'; ctx.fillRect(tx + 23, 470, 6, 20); }
        ctx.fillStyle = ST2; ctx.fillRect(634, 446, 62, GY - 446); cren(634, 698, 446);
        ctx.fillStyle = '#3a2a1c'; ctx.beginPath(); ctx.moveTo(648, GY); ctx.lineTo(648, 590); ctx.arc(665, 590, 17, Math.PI, 0); ctx.lineTo(682, GY); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#6a6a72'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 652; x < 680; x += 7) { ctx.moveTo(x, 578); ctx.lineTo(x, 612); } ctx.stroke();
        flag(ctx, 667, 330, 40, 24, ['#c0392b', '#f1c40f'], false, k * 3);
        line(ctx, 666, 372, 666, 330, '#3a3a3a', 3);
        ctx.restore();
      }
      // Trebuchet, then cannon.
      const trebA = S.i >= 2 ? (S.i === 4 ? 1 - smooth(S.lt / 1) : 1) : (S.i === 1 ? smooth((S.lt - 2.5) / 1.2) * 0.5 : 0);
      if (trebA > 0) {
        ctx.save(); ctx.globalAlpha *= trebA;
        const pv = { x: 205, y: 500 }; const u = S.i >= 2 ? mod(S.u - S.starts[2], 4.6) : 0;
        const deg = Math.PI / 180; const th0 = 158 * deg; const th1 = 300 * deg;
        let th = th0;
        if (S.i >= 2) th = u < 0.7 ? th0 + (th1 - th0) * (u / 0.7) ** 2 : u < 2.6 ? th1 : th1 + (th0 - th1) * smooth((u - 2.6) / 1.7);
        const tip = { x: pv.x + Math.cos(th) * 130, y: pv.y + Math.sin(th) * 130 }; const sh = { x: pv.x - Math.cos(th) * 42, y: pv.y - Math.sin(th) * 42 };
        ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath();
        ctx.moveTo(150, GY); ctx.lineTo(pv.x, pv.y); ctx.lineTo(260, GY); ctx.moveTo(130, GY - 4); ctx.lineTo(280, GY - 4); ctx.stroke();
        ctx.lineWidth = 8; ctx.strokeStyle = '#8a6238'; ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
        line(ctx, sh.x, sh.y, sh.x, sh.y + 16, '#3a2a1a', 3);
        ctx.fillStyle = '#5a4a3a'; ctx.fillRect(sh.x - 20, sh.y + 16, 40, 34);
        dot(ctx, pv.x, pv.y, 6, '#3a2a1a');
        if (S.i >= 2 && u < 0.6) dot(ctx, tip.x, tip.y + 10, 8, '#8d8a80');
        if (S.i >= 2 && u >= 0.6 && u < 1.9) {
          const q = (u - 0.6) / 1.3; const p0 = { x: pv.x + Math.cos(285 * deg) * 130, y: pv.y + Math.sin(285 * deg) * 130 };
          dot(ctx, lerp(p0.x, 520, q), lerp(p0.y, 482, q) - 200 * 4 * q * (1 - q), 8, '#8d8a80');
        }
        if (S.i >= 2 && u >= 1.9 && u < 2.8) { const q = (u - 1.9) / 0.9; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.fillStyle = `rgba(220,210,190,${(0.7 * (1 - q)).toFixed(3)})`; ctx.beginPath(); ctx.arc(510 + Math.cos(a) * 26 * q, 480 + Math.sin(a) * 18 * q, 10 + 10 * q, 0, TAU); ctx.fill(); } }
        const pulling = S.i >= 2 && u > 2.6;
        person(ctx, 108, GY, 52, '#2a2418', { arms: pulling ? 'pull' : 'down', face: 1, lean: pulling ? -0.15 : 0, walk: pulling ? k * 4 : undefined });
        ctx.restore();
        label(ctx, 'Trebuchet', 205, 686, { size: 19, weight: 700, fill: 'ink' });
      }
      if (S.i === 4) {
        const ca = smooth((S.lt - 0.6) / 0.8); ctx.save(); ctx.globalAlpha *= ca;
        ctx.save(); ctx.translate(250, 612); ctx.rotate(-0.16); ctx.fillStyle = '#3a3a40'; rounded(ctx, -10, -12, 90, 24, 10); ctx.fill(); ctx.restore();
        dot(ctx, 240, 624, 16, '#6b4a2a'); dot(ctx, 240, 624, 5, '#2a2a2a');
        const u2 = mod(S.lt - 1.2, 2.2);
        if (S.lt > 1.2) {
          for (let i = 0; i < 4; i++) { const q = clamp(u2 / 1.4); ctx.fillStyle = `rgba(210,210,215,${(0.6 * (1 - q)).toFixed(3)})`; ctx.beginPath(); ctx.arc(340 + i * 10 * q, 596 - i * 8 * q, 10 + 18 * q, 0, TAU); ctx.fill(); }
          if (u2 < 0.6) dot(ctx, lerp(336, 500, u2 / 0.6), lerp(596, 560, u2 / 0.6), 6, '#2a2a2a');
        }
        ctx.restore();
        label(ctx, 'Cannon', 260, 686, { size: 19, weight: 700, fill: 'red' });
      }
      if (wood > 0.3) { label(ctx, 'Motte', 760, 686, { size: 19, weight: 700, fill: 'ink' }); label(ctx, 'Bailey', 576, 686, { size: 19, weight: 700, fill: 'ink' }); }
      if (stone > 0.6) { label(ctx, 'Keep', 665, 300, { size: 19, weight: 700, fill: '#14203a' }); label(ctx, 'Curtain wall', 665, 686, { size: 19, weight: 700, fill: 'ink' }); }
      endBox(ctx);
      caption(ctx, S);
      ctx.restore();
    },

    // Gutenberg's press: mirror-image letters set in a stick, the type inked,
    // the screw turned to press a page, books piling up, and printing towns
    // lighting up across Europe.
    'printing-press'(b, ctx, it, t) {
      const S = stages(t, [
        [4, 'About 1440, Mainz: Johannes Gutenberg', 'yellow', 'A goldsmith who found a way to print quickly'],
        [4.5, 'Metal letters (movable type) are set in a line', 'cyan', 'Each letter can be used again and again'],
        [3.5, 'The type is inked, and paper laid on top', 'blue', 'Ink made with oil, so it stuck to metal'],
        [4, 'Turn the screw: the press squeezes ink onto paper', 'orange', 'Adapted from presses used for wine and olive oil'],
        [4.5, 'About 180 Gutenberg Bibles printed by about 1455', 'purple', 'A copy by hand could take a scribe a year or more'],
        [5, 'By 1500, presses in over 250 European towns', 'green', 'Movable type was first made in China (about 1040) and Korea'],
      ]);
      const k = b.clock; const FL = 690;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "Gutenberg's printing press");
      sceneBox(ctx, [[0, '#3a2a20'], [0.92, '#2a1e16'], [0.93, '#4a3424'], [1, '#3a2818']]);
      // Press timing.
      let press = 0;
      if (S.i === 3) press = Math.sin(clamp((S.lt - 0.5) / 2.6) * Math.PI);
      if (S.i >= 4) press = Math.max(0, Math.sin(mod(S.lt, 1.3) / 1.3 * Math.PI * 2 - 0.3));
      const rot = (S.i === 3 ? clamp((S.lt - 0.5) / 2.6) : S.i >= 4 ? mod(S.lt, 1.3) / 1.3 : 0) * TAU;
      const WOOD = '#8a5a34'; const WOOD2 = '#6e4426';
      ctx.fillStyle = WOOD; ctx.fillRect(110, 222, 26, FL - 222); ctx.fillRect(316, 222, 26, FL - 222);
      ctx.fillRect(98, 214, 256, 28); ctx.fillStyle = WOOD2; ctx.fillRect(110, 292, 232, 28);
      const py = 392 + press * 34;
      ctx.fillStyle = '#9a9a9a'; ctx.fillRect(216, 320, 20, py - 320);
      ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 2; ctx.beginPath();
      for (let y = 324 + mod(rot * 6, 10); y < py - 2; y += 10) { ctx.moveTo(216, y); ctx.lineTo(236, y + 5); }
      ctx.stroke();
      const bl = 78 * Math.cos(rot); line(ctx, 226, 352, 226 + bl, 352 + 6 * Math.sin(rot), '#c89a5a', 7);
      ctx.fillStyle = WOOD2; ctx.fillRect(160, py, 132, 20);
      const inkOn = S.i >= 2; const paperOn = (S.i === 2 && S.lt > 2) || S.i >= 3;
      ctx.fillStyle = '#5a3a20'; ctx.fillRect(130, 482, 192, 14);
      ctx.fillStyle = inkOn ? '#1a1a1e' : '#7a7a80'; ctx.fillRect(166, 466, 120, 16);
      if (paperOn) { ctx.fillStyle = '#f1e9d6'; ctx.fillRect(162, 460 + (S.i === 2 ? 1 - smooth((S.lt - 2) / 0.8) : 0) * -50, 128, 6); }
      ctx.fillStyle = WOOD2; ctx.fillRect(146, 496, 14, FL - 496); ctx.fillRect(292, 496, 14, FL - 496); ctx.fillRect(146, 620, 160, 12);
      // The pressman.
      const pulling = press > 0.05;
      person(ctx, 392, FL, 150, '#e0c9a0', { face: -1, arms: pulling ? 'pull' : S.i === 2 ? 'hold' : 'down', lean: pulling ? -0.12 : 0, alpha: 0.85 });
      if (S.i === 2 && S.lt < 2.2) {
        for (let j = 0; j < 2; j++) {
          const bx = 200 + j * 56; const by = 440 + Math.abs(Math.sin(S.lt * 5 + j * 1.5)) * -24;
          line(ctx, bx, by - 6, 340, 382, '#6e4426', 4);
          ctx.fillStyle = '#2a1a12'; ctx.beginPath(); ctx.arc(bx, by + 6, 16, Math.PI, 0); ctx.fill();
        }
      }
      // Composing stick with mirror-image letters.
      const TXT = 'IN PRINCIPIO';
      const nIn = S.i === 0 ? 0 : S.i === 1 ? Math.floor(S.lt * 3.4) : TXT.length;
      label(ctx, 'Movable type', 640, 214, { size: 20, weight: 700, fill: S.i === 1 ? 'cyan' : 'ink' });
      ctx.fillStyle = '#6a6a72'; ctx.fillRect(452, 298, 376, 10);
      for (let i = 0; i < TXT.length; i++) {
        const x = 466 + i * 30; const ch = TXT[TXT.length - 1 - i];
        if (i >= nIn) continue;
        const drop = S.i === 1 ? clamp((S.lt * 3.4 - i) / 1) : 1; const yy = 252 - (1 - easeOut(drop)) * 40;
        ctx.save(); ctx.globalAlpha *= drop;
        ctx.fillStyle = '#a8a8b0'; ctx.fillRect(x, yy, 26, 44);
        if (ch !== ' ') { ctx.save(); ctx.translate(x + 13, yy + 22); ctx.scale(-1, 1); label(ctx, ch, 0, 1, { size: 26, weight: 800, fill: '#20202a' }); ctx.restore(); }
        ctx.restore();
      }
      label(ctx, 'Mirror letters print the right way round', 640, 330, { size: 18, weight: 500, fill: 'muted' });
      // The printed page and the growing pile.
      const pageA = S.i === 3 ? smooth((S.lt - 2.6) / 0.8) : S.i >= 4 ? 1 : 0;
      if (pageA > 0) {
        ctx.save(); ctx.globalAlpha *= pageA;
        const sl = S.i === 3 ? (1 - pageA) * -60 : 0;
        ctx.fillStyle = '#f1e9d6'; ctx.fillRect(462 + sl, 362, 128, 158);
        label(ctx, 'IN PRINCIPIO', 526 + sl, 384, { size: 18, weight: 800, fill: '#7a1a1a' });
        ctx.fillStyle = 'rgba(40,30,20,0.55)'; for (let r = 0; r < 9; r++) { ctx.fillRect(474 + sl, 404 + r * 12, 48, 4); ctx.fillRect(532 + sl, 404 + r * 12, 48, 4); }
        ctx.restore();
      }
      const books = S.i === 4 ? Math.round(180 * smooth(S.lt / 4)) : S.i === 5 ? 180 : 0;
      if (books > 0) {
        const nb = Math.min(12, Math.ceil(books / 15));
        for (let i = 0; i < nb; i++) { const yb = 516 - i * 13; ctx.fillStyle = ['#7a2a2a', '#5a3a2a', '#6a2a3a'][i % 3]; ctx.fillRect(614 + (i % 2) * 6, yb - 11, 96, 11); ctx.fillStyle = '#d8c08a'; ctx.fillRect(614 + (i % 2) * 6, yb - 7, 96, 2); }
        chip(ctx, `${books} Bibles`, 782, 470, 'purple', 18);
      }
      // Printing spreads across Europe.
      const R = { x: 452, y: 538, w: 388, h: 182, lon0: -12, lon1: 34, lat0: 35, lat1: 60 };
      world(ctx, R, { land: 'rgba(170,150,120,0.3)', edge: 'rgba(220,200,160,0.5)', sea: 'rgba(30,60,110,0.35)' });
      const mz = proj(R, 8.3, 50); ping(ctx, mz.x, mz.y, k, 'yellow', 5);
      label(ctx, 'Mainz', mz.x + 12, mz.y - 14, { size: 18, weight: 700, fill: 'ink', align: 'left' });
      if (S.i === 5) {
        const towns = [[7.7, 48.6], [7, 50.9], [12.5, 41.9], [12.3, 45.4], [2.35, 48.9], [7.6, 47.6], [11, 49.5], [-6, 37.4], [19.9, 50], [-0.1, 51.5], [3.2, 51.2], [4.8, 45.8], [11.25, 43.8], [14.25, 40.85], [-0.4, 39.5], [12.4, 51.3], [10.9, 48.4], [4.9, 52.4], [-3.7, 40.4], [16.4, 48.2], [14.4, 50.1]];
        towns.forEach(([lon, lat], i) => { const p = proj(R, lon, lat); const a = after(S.lt, 0.2 + i * 0.15, 0.3); if (a > 0) dot(ctx, p.x, p.y, 4.5 * a, '#34d399'); });
      }
      endBox(ctx);
      chip(ctx, 'c. 1440 · Mainz', 226, 196, 'yellow', 18);
      caption(ctx, S);
      ctx.restore();
    },

    // Florence in the 1400s: a painting built with perspective lines, a
    // flapping flying machine in Leonardo's sketchbook, ancient books
    // arriving, and Brunelleschi's dome rising over the city.
    renaissance(b, ctx, it, t) {
      const S = stages(t, [
        [4, 'Florence, 1400s: a "rebirth" of art and learning', 'yellow', 'Renaissance is French for rebirth'],
        [4.5, 'Scholars rediscover ancient Greek and Roman books', 'orange', 'Old texts were copied, translated and studied again'],
        [4.5, 'Linear perspective: lines meet at a vanishing point', 'cyan', 'Worked out by Brunelleschi in Florence, about 1415'],
        [4.5, 'Leonardo da Vinci sketches a flying machine', 'teal', 'He filled notebooks with inventions, in mirror writing'],
        [4.5, "Brunelleschi's dome rises over Florence (1436)", 'red', 'Built without a wooden frame to hold it up'],
        [4, 'Rich patrons like the Medici paid for art', 'purple', 'Banking families competed to build and decorate'],
      ]);
      const k = b.clock;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Renaissance');
      // The painting with perspective.
      const hp = S.on(2, 0.5);
      ctx.fillStyle = '#b8892f'; ctx.fillRect(84, 190, 362, 274);
      sceneBox(ctx, [[0, '#7aa3d6'], [0.42, '#e8d4b0'], [0.43, '#c9b08a'], [1, '#8a6a4a']], 96, 202, 338, 250);
      const VP = { x: 265, y: 306 };
      ctx.fillStyle = '#e8dcc4'; ctx.fillRect(120, 230, 30, 76); ctx.fillRect(380, 230, 30, 76);
      ctx.fillStyle = '#d6c6a6'; ctx.beginPath(); ctx.moveTo(210, 306); ctx.lineTo(210, 262); ctx.arc(265, 262, 55, Math.PI, 0); ctx.lineTo(320, 306); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8fb4dc'; ctx.beginPath(); ctx.moveTo(228, 306); ctx.lineTo(228, 268); ctx.arc(265, 268, 37, Math.PI, 0); ctx.lineTo(302, 306); ctx.closePath(); ctx.fill();
      for (let j = 0; j < 8; j++) for (let r = 0; r < 6; r++) {
        if ((j + r) % 2) continue;
        const y0 = 306 + 146 / (6.6 - r) - 146 / 6.6 + r * 0.01; const y1 = 306 + 146 / (5.6 - r) - 146 / 6.6;
        const e = (y) => (y - VP.y) / 146; const xa = (j - 4) * 70; const xb = (j - 3) * 70;
        ctx.fillStyle = 'rgba(90,60,40,0.55)';
        poly(ctx, [VP.x + xa * e(y0) * 1.6, y0, VP.x + xb * e(y0) * 1.6, y0, VP.x + xb * e(y1) * 1.6, y1, VP.x + xa * e(y1) * 1.6, y1], true); ctx.fill();
      }
      person(ctx, 265, 384, 52, '#5a2a3a', { robe: true });
      const lines = S.i === 2 ? smooth((S.lt - 0.2) / 2) : 0;
      if (lines > 0) {
        ctx.strokeStyle = tint('cyan', 0.95 * hp); ctx.lineWidth = 2;
        for (let j = 0; j <= 8; j++) { const ex = VP.x + (j - 4) * 70 * 1.6; const ey = 452; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(lerp(ex, VP.x, lines), lerp(ey, VP.y, lines)); ctx.stroke(); }
        line(ctx, 96, VP.y, 434, VP.y, tint('yellow', 0.8 * hp), 2, [6, 5]);
        dot(ctx, VP.x, VP.y, 7, 'yellow');
      }
      endBox(ctx, 96, 202, 338, 250);
      label(ctx, 'Lines meet at the vanishing point', 265, 484, { size: 18, weight: hp > 0.3 ? 700 : 500, fill: hp > 0.3 ? 'cyan' : 'muted' });
      // Leonardo's sketchbook.
      const hl3 = S.on(3, 0.5);
      ctx.fillStyle = '#e9dcb8'; ctx.strokeStyle = hl3 ? tint('teal', hl3) : 'rgba(140,110,70,0.8)'; ctx.lineWidth = hl3 ? 4 : 2;
      rounded(ctx, 474, 190, 372, 274, 8); ctx.fill(); ctx.stroke();
      const flap = Math.sin(k * (S.i === 3 ? 3.2 : 1.2)) * 0.45; const ox = 660; const oy = 330;
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) {
        ctx.save(); ctx.translate(ox + sd * 20, oy); ctx.rotate(sd * flap);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sd * 70, -50, sd * 150, -20);
        for (let i = 1; i <= 5; i++) { const ex = sd * (30 * i); const ey = -10 - Math.sin((i / 5) * Math.PI) * 36 + i * 3; ctx.moveTo(0, 0); ctx.lineTo(ex, ey); ctx.moveTo(ex, ey); ctx.quadraticCurveTo(ex - sd * 10, ey + 26, ex - sd * 24, ey + 30); }
        ctx.stroke();
        ctx.fillStyle = 'rgba(107,74,42,0.12)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sd * 70, -50, sd * 150, -20); ctx.lineTo(sd * 120, 10); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ox - 26, oy + 4); ctx.lineTo(ox + 26, oy + 4); ctx.moveTo(ox, oy + 4); ctx.lineTo(ox, oy + 44); ctx.moveTo(ox - 18, oy + 44); ctx.lineTo(ox + 18, oy + 44); ctx.stroke();
      ctx.beginPath(); ctx.arc(ox, oy + 22, 9, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(107,74,42,0.55)'; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let r = 0; r < 3; r++) for (let w = 0; w < 5; w++) { const x0 = 500 + w * 64; const y0 = 410 + r * 16; ctx.moveTo(x0, y0); for (let q = 1; q <= 6; q++) ctx.lineTo(x0 + q * 8, y0 + Math.sin(q * 2.3 + w + r) * 3); }
      ctx.stroke();
      label(ctx, "Leonardo's flying machine, 1480s", 660, 484, { size: 18, weight: hl3 > 0.3 ? 700 : 500, fill: hl3 > 0.3 ? 'teal' : 'muted' });
      // Florence skyline.
      sceneBox(ctx, [[0, '#2f3f78'], [0.6, '#e2a074'], [1, '#c98a5a']], PX, 504, PW, 226);
      const domeG = S.i === 4 ? smooth((S.lt - 0.3) / 2.6) : 1;
      ctx.fillStyle = '#b35a3a';
      for (let i = 0; i < 16; i++) { const hx = PX + i * 52 + (i % 3) * 6; const hh = 36 + rnd(i) * 28; ctx.fillRect(hx, 690 - hh, 50, hh); ctx.fillStyle = '#d9a37a'; ctx.fillRect(hx, 690 - hh, 50, 6); ctx.fillStyle = '#b35a3a'; }
      ctx.fillStyle = '#e8dcc6'; ctx.fillRect(400, 610, 180, 80); ctx.fillStyle = '#c2b296'; ctx.fillRect(428, 584, 124, 28);
      ctx.save(); ctx.beginPath(); ctx.rect(400, 584 - 76 * domeG - 26, 180, 76 * domeG + 26); ctx.clip();
      ctx.fillStyle = '#c0582f'; ctx.beginPath(); ctx.moveTo(430, 586); ctx.quadraticCurveTo(436, 530, 490, 512); ctx.quadraticCurveTo(544, 530, 550, 586); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f2e6d0'; ctx.lineWidth = 2.5; ctx.beginPath();
      for (const rx of [-1, -0.45, 0.45, 1]) { ctx.moveTo(490 + rx * 58, 586); ctx.quadraticCurveTo(490 + rx * 40, 535, 490, 512); }
      ctx.stroke();
      ctx.fillStyle = '#f2e6d0'; ctx.fillRect(482, 494, 16, 18); poly(ctx, [480, 494, 490, 480, 500, 494], true); ctx.fill();
      ctx.restore();
      if (S.i === 4 && domeG < 1) { line(ctx, 490, 586 - 76 * domeG - 26, 490, 520, 'rgba(255,230,160,0.0)', 1); }
      ctx.fillStyle = '#ece0c8'; ctx.fillRect(598, 540, 26, 150); ctx.fillStyle = '#8a7a6a'; for (let r = 0; r < 4; r++) ctx.fillRect(606, 556 + r * 30, 10, 16);
      ctx.fillStyle = '#c9b089'; ctx.fillRect(690, 610, 100, 80); ctx.fillRect(730, 556, 22, 56); ctx.fillRect(724, 546, 34, 12);
      for (let x = 724; x < 758; x += 8) ctx.fillRect(x, 540, 5, 6);
      const hm = S.on(5, 0.5);
      if (hm) {
        ctx.save(); ctx.globalAlpha *= hm;
        ctx.fillStyle = '#e8b830'; ctx.beginPath(); ctx.moveTo(206, 536); ctx.lineTo(258, 536); ctx.lineTo(258, 566); ctx.quadraticCurveTo(258, 590, 232, 598); ctx.quadraticCurveTo(206, 590, 206, 566); ctx.closePath(); ctx.fill();
        for (const [bx, by, c] of [[232, 546, '#2a4a9a'], [218, 558, '#c0392b'], [246, 558, '#c0392b'], [218, 572, '#c0392b'], [246, 572, '#c0392b'], [232, 585, '#c0392b']]) dot(ctx, bx, by, 5.5, c);
        label(ctx, 'The Medici crest', 270, 566, { size: 19, weight: 700, fill: '#2a1440', align: 'left' });
        ctx.restore();
      }
      ctx.fillStyle = 'rgba(70,110,150,0.85)'; ctx.fillRect(PX, 690, PW, 40);
      ctx.fillStyle = '#c99a5a'; ctx.fillRect(110, 672, 240, 18);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(70,110,150,1)'; ctx.beginPath(); ctx.arc(150 + i * 80, 712, 30, Math.PI, 0); ctx.fill(); }
      ctx.fillStyle = '#c99a5a'; for (let i = 0; i < 4; i++) ctx.fillRect(112 + i * 80, 690, 16, 40);
      // Ancient books arriving.
      const ba = S.on(1, 0.4);
      if (ba) {
        ctx.save(); ctx.globalAlpha *= ba;
        ['Plato', 'Euclid', 'Cicero'].forEach((nm, i) => {
          const q = clamp((S.lt - i * 0.5) / 2.6); const x = lerp(60, 330 - i * 10, easeOut(q)); const y = 548 + i * 38 + Math.sin(k * 2 + i) * 3;
          ctx.fillStyle = ['#7a2a2a', '#2a4a6a', '#4a5a2a'][i]; rounded(ctx, x - 44, y - 16, 88, 32, 4); ctx.fill();
          ctx.strokeStyle = '#e6c770'; ctx.lineWidth = 1.5; rounded(ctx, x - 44, y - 16, 88, 32, 4); ctx.stroke();
          label(ctx, nm, x, y + 1, { size: 18, weight: 700, fill: '#f6e7b8' });
        });
        ctx.restore();
      }
      endBox(ctx, PX, 504, PW, 226);
      caption(ctx, S);
      ctx.restore();
    },

    // Ships cross the Atlantic: American crops sail east, European animals
    // and wheat sail west; then, soberly, the epidemics, the forced crossing
    // of enslaved Africans, and the world's changed diets.
    'columbian-exchange'(b, ctx, it, t) {
      const S = stages(t, [
        [4, '1492: Columbus crosses the Atlantic', 'yellow', 'Linking the Americas with Europe, Africa and Asia'],
        [5, 'Sailing east: potatoes, maize, tomatoes, cacao', 'green', 'New foods from the Americas fed growing populations'],
        [5, 'Sailing west: horses, wheat, cattle, pigs', 'orange', 'Horses changed life on the American plains'],
        [5, 'Diseases like smallpox killed millions of Indigenous people', 'muted', 'In some regions as many as 9 in 10 people died'],
        [5, 'Millions of Africans were enslaved and shipped west', 'red', 'Forced to work on sugar, tobacco and cotton plantations'],
        [4.5, 'Diets changed worldwide: chillies, tomatoes, potatoes', 'teal', 'Many "traditional" dishes use American crops'],
      ]);
      const k = b.clock;
      const R = { x: PX + 4, y: 186, w: PW - 8, h: 332, lon0: -125, lon1: 82, lat0: -35, lat1: 55 };
      const P = (lon, lat) => proj(R, lon, lat);
      const AM = P(-72, 19); const EU = P(-7, 37);
      const east = (q) => bz({ x: AM.x + 10, y: AM.y - 10 }, { x: (AM.x + EU.x) / 2, y: 196 }, EU, q);
      const west = (q) => bz({ x: EU.x - 4, y: EU.y + 14 }, { x: (AM.x + EU.x) / 2, y: 370 }, { x: AM.x + 14, y: AM.y + 10 }, q);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Columbian Exchange');
      world(ctx, R);
      label(ctx, 'Americas', P(-100, 40).x, P(-100, 40).y, { size: 19, weight: 700, fill: 'ink' });
      label(ctx, 'Europe', P(22, 50).x, P(22, 50).y, { size: 19, weight: 700, fill: 'ink' });
      label(ctx, 'Africa', P(20, 8).x, P(20, 8).y, { size: 19, weight: 700, fill: 'ink' });
      ctx.strokeStyle = 'rgba(52,211,153,0.55)'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]); ctx.beginPath();
      for (let q = 0; q <= 1.001; q += 0.05) { const p = east(q); if (q) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
      ctx.stroke(); ctx.strokeStyle = 'rgba(255,159,67,0.55)'; ctx.beginPath();
      for (let q = 0; q <= 1.001; q += 0.05) { const p = west(q); if (q) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
      ctx.stroke(); ctx.setLineDash([]);
      const icon = (kind, x, y) => {
        if (kind === 'potato') { ctx.fillStyle = '#b08350'; ctx.beginPath(); ctx.ellipse(x, y, 15, 11, 0.3, 0, TAU); ctx.fill(); dot(ctx, x - 4, y - 2, 1.8, '#6a4a2a'); dot(ctx, x + 5, y + 3, 1.8, '#6a4a2a'); }
        else if (kind === 'maize') { ctx.fillStyle = '#5aa04a'; ctx.beginPath(); ctx.ellipse(x - 5, y + 3, 6, 16, -0.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#f2c84b'; ctx.beginPath(); ctx.ellipse(x + 2, y, 7, 16, 0.2, 0, TAU); ctx.fill(); }
        else if (kind === 'tomato') { dot(ctx, x, y + 2, 13, '#e2453a'); ctx.fillStyle = '#3a8a3a'; poly(ctx, [x - 8, y - 9, x, y - 5, x + 8, y - 9, x + 3, y - 12, x - 3, y - 12], true); ctx.fill(); }
        else if (kind === 'cacao') { ctx.fillStyle = '#c9772e'; ctx.beginPath(); ctx.ellipse(x, y, 9, 16, 0.5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a4a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 7, y + 10); ctx.lineTo(x + 7, y - 10); ctx.stroke(); }
        else if (kind === 'horse' || kind === 'cattle' || kind === 'pig') {
          const c = kind === 'horse' ? '#8a5a3a' : kind === 'cattle' ? '#e8e0d0' : '#f0a0a8';
          ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 15, 8, 0, 0, TAU); ctx.fill();
          ctx.beginPath(); for (const lx of [-10, -5, 6, 11]) { ctx.moveTo(x + lx, y + 4); ctx.lineTo(x + lx, y + 15); } ctx.stroke();
          if (kind === 'horse') { ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x + 12, y - 2); ctx.lineTo(x + 18, y - 14); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x + 21, y - 14, 6, 3.5, 0.4, 0, TAU); ctx.fill(); }
          else if (kind === 'cattle') { dot(ctx, x + 17, y - 3, 6, c); line(ctx, x + 14, y - 8, x + 12, y - 13, '#f6f0e0', 2); line(ctx, x + 20, y - 8, x + 23, y - 13, '#f6f0e0', 2); }
          else { dot(ctx, x + 15, y - 1, 6, c); dot(ctx, x + 20, y, 2.5, '#c06070'); }
        } else if (kind === 'wheat') { ctx.strokeStyle = '#e2b84a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 16); ctx.lineTo(x, y - 14); ctx.stroke(); for (let i = 0; i < 4; i++) { ctx.fillStyle = '#e2b84a'; ctx.beginPath(); ctx.ellipse(x - 4, y - 10 + i * 6, 3, 5, -0.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 4, y - 10 + i * 6, 3, 5, 0.6, 0, TAU); ctx.fill(); } }
      };
      const EAST = [['potato', 'Potatoes'], ['maize', 'Maize'], ['tomato', 'Tomatoes'], ['cacao', 'Cacao']];
      const WEST = [['horse', 'Horses'], ['wheat', 'Wheat'], ['cattle', 'Cattle'], ['pig', 'Pigs']];
      // Stage 0: Columbus' ship.
      if (S.i === 0) {
        const q = smooth(S.lt / 3.4); const p = west(q);
        ctx.fillStyle = '#6a4424'; poly(ctx, [p.x - 16, p.y, p.x + 16, p.y, p.x + 11, p.y + 8, p.x - 11, p.y + 8], true); ctx.fill();
        ctx.fillStyle = '#f2ead6'; for (const dx of [-8, 2, 10]) { ctx.fillRect(p.x + dx - 4, p.y - 18, 8, 15); }
        label(ctx, 'Santa María', p.x, p.y + 26, { size: 18, weight: 700, fill: 'yellow' });
      }
      const travel = (list, path, above, c) => {
        const per = (S.dur - 0.6) / list.length; const j = Math.min(list.length - 1, Math.floor(S.lt / per)); const q = smooth((S.lt - j * per) / (per * 0.85));
        const p = path(q); icon(list[j][0], p.x, p.y);
        label(ctx, list[j][1], p.x, p.y + (above ? -30 : 32), { size: 19, weight: 800, fill: c });
        return j + (q > 0.98 ? 1 : 0);
      };
      let nE = S.i >= 2 ? 4 : 0; let nW = S.i >= 3 ? 4 : 0;
      if (S.i === 1) nE = travel(EAST, east, true, 'green');
      if (S.i === 2) nW = travel(WEST, west, false, 'orange');
      if (S.i === 3) {
        const a = S.on(3, 0.5);
        for (let i = 0; i < 26; i++) { const q = mod(S.lt * 0.18 + rnd(i), 1); const p0 = P(-72, 19); const ang = rnd(i + 5) * TAU; const r = q * (120 + rnd(i + 9) * 120); ctx.fillStyle = `rgba(190,190,205,${(0.55 * a * (1 - q)).toFixed(3)})`; ctx.beginPath(); ctx.arc(p0.x + Math.cos(ang) * r * 0.7, p0.y + Math.sin(ang) * r, 6 + q * 8, 0, TAU); ctx.fill(); }
      }
      if (S.i === 4) {
        const a = S.on(4, 0.5); const wa = P(-10, 9);
        for (const dst of [P(-38, -9), P(-72, 19), P(-80, 32)]) {
          ctx.save(); ctx.globalAlpha *= a;
          const c = { x: (wa.x + dst.x) / 2, y: (wa.y + dst.y) / 2 + 30 };
          ctx.strokeStyle = 'rgba(251,113,133,0.75)'; ctx.lineWidth = 3; ctx.setLineDash([7, 6]); ctx.beginPath();
          for (let q = 0; q <= 1.001; q += 0.05) { const p = bz(wa, c, dst, q); if (q) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
          ctx.stroke(); ctx.setLineDash([]);
          const p = bz(wa, c, dst, mod(S.lt * 0.25, 1)); ctx.fillStyle = '#e8dcc8'; poly(ctx, [p.x - 9, p.y, p.x + 9, p.y, p.x + 6, p.y + 5, p.x - 6, p.y + 5], true); ctx.fill();
          ctx.restore();
        }
        dot(ctx, wa.x, wa.y, 5, 'red');
        label(ctx, 'West Africa', wa.x + 4, wa.y + 24, { size: 18, weight: 700, fill: 'red' });
      }
      if (S.i === 5) {
        const a = S.on(5, 0.4);
        ctx.save(); ctx.globalAlpha *= a;
        for (const [lon, lat, txt, dx, dy, al] of [[-8, 53, 'Potatoes in Ireland', -12, 16, 'right'], [12, 42.5, 'Tomatoes in Italy', 12, 22, 'left'], [78, 21, 'Chillies in India', -6, 30, 'right'], [22, 2, 'Maize in Africa', 0, 26, 'center']]) {
          const p = P(lon, lat); dot(ctx, p.x, p.y, 5, 'teal'); chip(ctx, txt, p.x + dx, p.y + dy, 'teal', 18, al);
        }
        ctx.restore();
      }
      // Below: what crossed, or the human cost.
      sceneBox(ctx, [[0, 'rgba(14,20,44,0.92)'], [1, 'rgba(8,12,28,0.92)']], PX, 530, PW, 200);
      const lists = S.i <= 2 || S.i === 5 ? (S.i === 5 ? S.on(5, 0.4) : 1) : 0;
      if (lists) {
        ctx.save(); ctx.globalAlpha *= lists * (S.i === 0 ? fadeIO(S.lt, 99, 0.4) : 1);
        label(ctx, 'To Europe, Africa and Asia', 260, 556, { size: 19, weight: 700, fill: 'green' });
        label(ctx, 'To the Americas', 660, 556, { size: 19, weight: 700, fill: 'orange' });
        line(ctx, 460, 548, 460, 716, 'rgba(140,170,255,0.25)', 2);
        EAST.forEach(([kind, nm], i) => { if (i >= nE) return; const x = 150 + (i % 2) * 190; const y = 604 + Math.floor(i / 2) * 58; icon(kind, x, y); label(ctx, nm, x + 26, y, { size: 19, weight: 600, fill: 'ink', align: 'left' }); });
        WEST.forEach(([kind, nm], i) => { if (i >= nW) return; const x = 540 + (i % 2) * 170; const y = 604 + Math.floor(i / 2) * 58; icon(kind, x, y); label(ctx, nm, x + 30, y, { size: 19, weight: 600, fill: 'ink', align: 'left' }); });
        ctx.restore();
      }
      const a3 = S.on(3, 0.5);
      if (a3) {
        ctx.save(); ctx.globalAlpha *= a3;
        label(ctx, 'Remembering the Indigenous peoples of the Americas', cx, 560, { size: 19, weight: 700, fill: 'ink' });
        for (let i = 0; i < 10; i++) {
          const gone = i > 0 && S.lt > 0.8 + i * 0.25;
          person(ctx, 190 + i * 60, 708, 92, '#c8b89a', { col: gone ? 'rgba(200,190,170,0.18)' : 'rgba(225,205,165,0.95)', robe: i % 2 === 0 });
        }
        ctx.restore();
      }
      const a4 = S.on(4, 0.5);
      if (a4) {
        ctx.save(); ctx.globalAlpha *= a4;
        label(ctx, 'About 12.5 million people', cx, 584, { size: 36, weight: 800, fill: 'red' });
        label(ctx, 'were forced onto slave ships, from the 1500s to the 1860s', cx, 636, { size: 20, weight: 600, fill: 'ink' });
        label(ctx, 'Nearly 2 million died on the crossing. We remember them.', cx, 682, { size: 19, weight: 500, fill: 'muted' });
        ctx.restore();
      }
      endBox(ctx, PX, 530, PW, 200);
      caption(ctx, S);
      ctx.restore();
    },

    // ─── The modern world ─────────────────────────────────────────────────

    // A beam engine rocks and turns its flywheel, a belt drives the looms in
    // a mill, smoke pours from the chimney, a train runs past, the town
    // grows behind, and a child at a loom reminds us of reform.
    'industrial-revolution'(b, ctx, it, t) {
      const S = stages(t, [
        [4, 'Britain, from about 1760: machines change how we work', 'yellow', 'Work moved from homes and farms into factories'],
        [4.5, "1776: James Watt's improved steam engine at work", 'orange', 'It used far less coal than older engines'],
        [4, 'Coal fires the engines; mills gather hundreds of workers', 'muted', 'Machines spun and wove cotton faster than hands could'],
        [4, '1830: the first inter-city railway opens', 'cyan', "Liverpool to Manchester, with Stephenson's Rocket"],
        [4.5, 'Towns boom: Manchester grows more than tenfold', 'teal', 'About 25,000 people in the 1770s; about 300,000 by 1850'],
        [5, 'Children worked long hours, until reformers changed laws', 'red', '1833 Factory Act: no children under 9 in textile mills'],
      ]);
      const k = b.clock; const GY = 630; const hl = (j) => S.on(j, 0.5);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Industrial Revolution');
      sceneBox(ctx, [[0, '#3a3e5a'], [0.55, '#a87a6a'], [0.82, '#d8a07a'], [0.83, '#3a3430'], [1, '#262220']]);
      // The growing town behind.
      const rows = S.i < 4 ? 1 : 1 + Math.floor(smooth(S.lt / 3) * 3);
      for (let r = 0; r < rows; r++) {
        ctx.fillStyle = `rgba(70,55,60,${(0.55 - r * 0.1).toFixed(2)})`;
        for (let i = 0; i < 12; i++) { const hx = 380 + i * 36 + (r % 2) * 18; const hy = 398 - r * 22; ctx.fillRect(hx, hy, 34, 30); poly(ctx, [hx - 2, hy, hx + 17, hy - 10, hx + 36, hy], true); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,210,120,0.55)'; for (let i = 0; i < 12; i++) if (rnd(i + r * 20) < 0.5) ctx.fillRect(390 + i * 36 + (r % 2) * 18, 408 - r * 22, 6, 6);
      }
      // Engine house and beam engine.
      const he = hl(1);
      ctx.fillStyle = '#7a4a36'; ctx.fillRect(84, 330, 170, GY - 330); poly(ctx, [78, 330, 169, 296, 260, 330], true); ctx.fill();
      ctx.fillStyle = '#2a1e1a'; ctx.fillRect(96, 400, 60, 170);
      const al = k * 2.2; const rc = 30;
      const bEnd = 330 - 30 + rc * Math.sin(al); const lEnd = 300 - rc * Math.sin(al);
      ctx.fillStyle = '#8a8a90'; ctx.fillRect(108, 470, 36, 90);
      const pist = 470 + 26 - rc * Math.sin(al) * 0.6;
      line(ctx, 126, lEnd, 126, pist, '#c0c0c8', 5);
      ctx.fillStyle = '#d0d0d8'; ctx.fillRect(110, pist, 32, 10);
      line(ctx, 126, lEnd, 326, bEnd, he ? '#ffcf8a' : '#c8a070', 10);
      ctx.fillStyle = '#5a4a3a'; ctx.fillRect(218, 300, 18, 40); dot(ctx, 226, 300 + (lEnd + bEnd) / 2 - 300, 6, '#2a2a2a');
      const fw = { x: 326, y: 480 }; const pin = { x: fw.x + Math.cos(al) * rc, y: fw.y + Math.sin(al) * rc };
      ctx.strokeStyle = he ? '#ffcf8a' : '#b0b0b8'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(fw.x, fw.y, 72, 0, TAU); ctx.stroke();
      ctx.lineWidth = 4; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = al + (i * TAU) / 6; ctx.moveTo(fw.x, fw.y); ctx.lineTo(fw.x + Math.cos(a) * 70, fw.y + Math.sin(a) * 70); } ctx.stroke();
      line(ctx, 326, bEnd, pin.x, pin.y, '#9a9aa2', 5); dot(ctx, pin.x, pin.y, 5, '#ffd27a'); dot(ctx, fw.x, fw.y, 8, '#3a3a3a');
      line(ctx, fw.x, fw.y, 326, GY, '#4a3a2a', 10);
      // Belt to the mill's line shaft.
      ctx.strokeStyle = 'rgba(60,40,30,0.95)'; ctx.lineWidth = 4; ctx.setLineDash([10, 6]); ctx.lineDashOffset = -k * 60;
      ctx.beginPath(); ctx.moveTo(fw.x, fw.y - 72); ctx.lineTo(440, 448); ctx.moveTo(440, 476); ctx.lineTo(fw.x, fw.y + 72); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      // Coal heap and fire.
      const hc = hl(2);
      ctx.fillStyle = '#121214'; ctx.beginPath(); ctx.ellipse(196, GY, 56, 22, 0, Math.PI, TAU); ctx.fill();
      dot(ctx, 126, 586 + Math.sin(k * 9) * 2, 12 + 3 * Math.sin(k * 7), hc ? '#ffb347' : '#ff8a3a', hc ? 14 : 6);
      // The mill.
      ctx.fillStyle = '#8a5240'; ctx.fillRect(420, 440, 384, GY - 440);
      ctx.fillStyle = '#6a3e30'; for (let i = 0; i < 8; i++) { poly(ctx, [420 + i * 48, 440, 420 + i * 48, 410, 468 + i * 48, 440], true); ctx.fill(); }
      ctx.fillStyle = 'rgba(30,22,20,0.92)'; ctx.fillRect(432, 452, 360, 168);
      line(ctx, 440, 462, 790, 462, '#b0b0b8', 4);
      dot(ctx, 440, 462, 16, '#8a8a92'); ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = k * 4 + (i * TAU) / 3; ctx.moveTo(440, 462); ctx.lineTo(440 + Math.cos(a) * 14, 462 + Math.sin(a) * 14); } ctx.stroke();
      const looms = [470, 552, 634, 716];
      looms.forEach((lx, i) => {
        line(ctx, lx + 20, 462, lx + 20, 548, 'rgba(160,120,90,0.85)', 3);
        ctx.fillStyle = '#6a5040'; ctx.fillRect(lx, 548, 46, 50); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(lx + 4, 552, 38, 8);
        const sh = (Math.sin(k * 3 + i) + 1) / 2; ctx.fillStyle = '#ffd27a'; ctx.fillRect(lx + 4 + sh * 30, 562, 8, 5);
      });
      const hk = hl(5);
      const workers = [[520, 76, false], [602, 76, false], [684, 52, true], [770, 74, false]];
      workers.forEach(([wx, h, child], i) => {
        if (child && hk) { ctx.fillStyle = tint('red', 0.25 * hk); ctx.beginPath(); ctx.ellipse(wx, 620 - h / 2, 22, h / 2 + 12, 0, 0, TAU); ctx.fill(); }
        person(ctx, wx, 620, h, '#e8d8c0', { face: -1, arms: 'hold', alpha: 0.85, ph: k + i });
      });
      // Chimney and smoke.
      ctx.fillStyle = '#6a3e30'; ctx.fillRect(808, 250, 30, GY - 250); ctx.fillRect(803, 244, 40, 10);
      puffs(ctx, 823, 236, k, 6, '90,85,90', 110, -120, 18, 0.22);
      // Railway (from 1830).
      ctx.fillStyle = '#4a4440'; ctx.fillRect(PX, 690, PW, 8); ctx.fillStyle = '#6a5a4a'; for (let x = PX; x < PX + PW; x += 22) ctx.fillRect(x, 698, 12, 5);
      if (S.i === 3 || S.i === 4) {
        const tx = -360 + mod(k * 110, 1300); const ty = 690;
        ctx.save(); ctx.globalAlpha *= S.i === 3 ? smooth(S.lt / 0.6) : 1 - smooth((S.lt - S.dur + 0.5) / 0.5);
        for (let c = 0; c < 3; c++) { const x0 = tx - 100 - c * 96; ctx.fillStyle = ['#c9a94a', '#3a6a9a', '#c9a94a'][c]; rounded(ctx, x0, ty - 46, 86, 32, 5); ctx.fill(); dot(ctx, x0 + 18, ty - 8, 8, '#2a2a2a'); dot(ctx, x0 + 68, ty - 8, 8, '#2a2a2a'); }
        ctx.fillStyle = '#e0c040'; rounded(ctx, tx - 6, ty - 52, 70, 26, 10); ctx.fill();
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(tx + 50, ty - 92, 10, 42); ctx.fillStyle = '#c0c0c0'; ctx.fillRect(tx - 10, ty - 30, 30, 18);
        dot(ctx, tx + 46, ty - 14, 14, '#c0392b'); dot(ctx, tx + 46, ty - 14, 4, '#2a2a2a'); dot(ctx, tx + 4, ty - 8, 8, '#2a2a2a');
        puffs(ctx, tx + 55, ty - 96, k, 4, '235,235,240', 40, -70, 9, 0.9);
        ctx.restore();
      }
      endBox(ctx);
      chip(ctx, 'From about 1760', 150, 208, 'yellow', 18);
      if (S.i === 4) { ctx.save(); ctx.globalAlpha *= S.on(4, 0.4); chip(ctx, `Manchester: ${Math.round(lerp(25, 300, smooth(S.lt / 3)))},000 people`, 560, 300, 'teal', 19); ctx.restore(); }
      if (S.i === 5) { ctx.save(); ctx.globalAlpha *= hk; line(ctx, 684, 626, 684, 644, 'red', 2); chip(ctx, 'Child worker', 684, 662, 'red', 18); ctx.restore(); }
      caption(ctx, S);
      ctx.restore();
    },

    // The three estates as a pyramid propped up by the many; it tips when the
    // Third Estate claims power; the Bastille falls; the Declaration and the
    // motto; then the republic, the Terror and Napoleon, on a running timeline.
    'french-revolution'(b, ctx, it, t) {
      const S = stages(t, [
        [4.5, 'France, 1789: society is split into three estates', 'blue', 'King Louis XVI ruled with almost total power'],
        [4, 'The Third Estate paid most of the taxes', 'orange', 'Bad harvests in 1788 sent bread prices soaring'],
        [4, '17 June 1789: commoners form a National Assembly', 'yellow', 'They swore not to part until France had a constitution'],
        [4.5, '14 July 1789: Parisians storm the Bastille prison', 'red', 'Now remembered every year as France\'s national day'],
        [4.5, 'August 1789: the Declaration of the Rights of Man', 'cyan', '"Liberty, Equality, Fraternity" grew into the motto'],
        [5.5, 'A republic in 1792, the Terror, then Napoleon', 'purple', 'New ideas of rights spread, but thousands were executed'],
      ]);
      const k = b.clock;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The French Revolution');
      sceneBox(ctx, [[0, '#1e2a5a'], [1, '#121a3a']], PX, PY, PW, 448);
      // Scene A: the estates pyramid.
      const aA = S.i <= 2 ? (S.i === 2 ? 1 : 1) * (S.i === 0 ? smooth(S.lt / 0.5) : 1) * (S.i === 2 ? 1 - smooth((S.lt - 3.6) / 0.4) : 1) : 0;
      if (aA > 0) {
        ctx.save(); ctx.globalAlpha *= aA;
        const ap = { x: 320, y: 228 }; const base = 600; const hw = 230; const H = base - ap.y;
        const xAt = (y) => (hw * (y - ap.y)) / H; const y1 = ap.y + H * 0.24; const y2 = ap.y + H * 0.47;
        const tip = S.i === 2 ? smooth((S.lt - 0.8) / 1.6) : 0;
        ctx.fillStyle = 'rgba(120,150,220,0.25)'; ctx.strokeStyle = 'rgba(160,190,255,0.8)'; ctx.lineWidth = 2;
        poly(ctx, [ap.x - xAt(y2), y2, ap.x + xAt(y2), y2, ap.x + hw, base, ap.x - hw, base], true); ctx.fill(); ctx.stroke();
        let id = 0;
        for (let r = 0; r < 3; r++) {
          const gy = y2 + 46 + r * 44; const w = xAt(gy) - 16;
          for (let x = ap.x - w + 12; x < ap.x + w - 8; x += 26) { id++; const cheer = tip > 0.6; person(ctx, x, gy, 40, '#d8c8a8', { arms: cheer ? (id % 2 ? 'up' : 'raise') : 'carry', alpha: 0.9, face: id % 2 ? 1 : -1 }); }
        }
        ctx.save(); ctx.translate(ap.x + hw * 0.9 * tip, y2 + (base - y2) * 0.55 * tip); ctx.rotate(tip * 1.1);
        ctx.translate(-ap.x, -y2);
        ctx.fillStyle = 'rgba(200,170,90,0.4)'; ctx.strokeStyle = 'rgba(240,210,130,0.9)';
        poly(ctx, [ap.x - xAt(y1), y1, ap.x + xAt(y1), y1, ap.x + xAt(y2), y2, ap.x - xAt(y2), y2], true); ctx.fill(); ctx.stroke();
        for (const dx of [-36, 36]) person(ctx, ap.x + dx, y2 - 6, 50, '#f0d890', { robe: false, hat: true });
        ctx.fillStyle = 'rgba(180,120,200,0.4)'; ctx.strokeStyle = 'rgba(220,170,240,0.9)';
        poly(ctx, [ap.x, ap.y, ap.x + xAt(y1), y1, ap.x - xAt(y1), y1], true); ctx.fill(); ctx.stroke();
        person(ctx, ap.x, y1 - 4, 44, '#e8d0f0', { robe: true });
        ctx.restore();
        if (S.i === 1) {
          for (let i = 0; i < 8; i++) { const q = mod(S.lt * 0.5 + i / 8, 1); dot(ctx, ap.x - 150 + i * 40, lerp(base - 30, y2 - 20, q), 5, `rgba(251,191,36,${(1 - q).toFixed(3)})`); }
          chip(ctx, 'Taxes', 150, 330, 'orange', 19);
        }
        const la = 1 - smooth(tip * 3);
        if (la > 0) {
          ctx.save(); ctx.globalAlpha *= la;
          const L = [[(ap.y + y1) / 2 + 8, 'First Estate', 'clergy: about 0.5%', 'purple', ap.x + xAt((ap.y + y1) / 2 + 8)], [(y1 + y2) / 2, 'Second Estate', 'nobles: about 1.5%', 'yellow', ap.x + xAt((y1 + y2) / 2)], [(y2 + base) / 2, 'Third Estate', 'everyone else: about 98%', 'blue', ap.x + xAt((y2 + base) / 2)]];
          for (const [ly, a, bb, c, ex] of L) {
            line(ctx, ex + 8, ly, 596, ly, tint(c, 0.6), 1.5, [4, 4]);
            label(ctx, a, 606, ly - 13, { size: 20, weight: 800, fill: c, align: 'left' });
            label(ctx, bb, 606, ly + 14, { size: 18, weight: 500, fill: 'ink', align: 'left' });
          }
          ctx.restore();
        }
        if (S.i === 2 && tip > 0.5) chip(ctx, 'National Assembly', 640, 300, 'yellow', 22);
        ctx.restore();
      }
      // Scene B: the Bastille.
      const aB = S.on(3, 0.45);
      if (aB) {
        ctx.save(); ctx.globalAlpha *= aB;
        ctx.fillStyle = '#4a4a56'; ctx.fillRect(PX, 600, PW, 26);
        ctx.fillStyle = '#7a7468'; ctx.fillRect(440, 380, 330, 220);
        for (const tx of [420, 540, 660, 760]) { ctx.fillStyle = '#8a8478'; ctx.fillRect(tx, 336, 58, 264); ctx.fillStyle = '#6a645a'; for (let x = tx; x < tx + 56; x += 14) ctx.fillRect(x, 326, 9, 10); }
        ctx.fillStyle = '#3a2a1c'; ctx.fillRect(612, 520, 40, 80);
        for (let i = 0; i < 6; i++) puffs(ctx, 470 + i * 60, 330, k + i, 2, '170,170,180', 80, 30, 12, 0.3);
        for (let i = 0; i < 14; i++) {
          const x = 90 + i * 34 + mod(S.lt * 20, 34) * 0.5; const yb = 604 + (i % 2) * 8;
          person(ctx, x, yb, 54 + (i % 3) * 4, '#d8c8b0', { walk: k * 4 + i, arms: i % 4 === 0 ? 'up' : 'down', alpha: 0.9 });
          if (i % 4 === 0) { line(ctx, x + 10, yb - 60, x + 10, yb - 100, '#c8a46a', 2.5); flag(ctx, x + 10, yb - 100, 26, 16, ['#2a4a9a', '#c0392b'], true, k * 3 + i); }
        }
        ctx.restore();
        ctx.save(); ctx.globalAlpha *= aB; chip(ctx, '14 July 1789', cx, 228, 'red', 26); ctx.restore();
      }
      // Scene C: the Declaration and the motto.
      const aC = S.on(4, 0.45);
      if (aC) {
        ctx.save(); ctx.globalAlpha *= aC;
        ctx.fillStyle = '#efe4c6'; rounded(ctx, 110, 220, 320, 380, 10); ctx.fill();
        label(ctx, 'Déclaration des Droits', 270, 262, { size: 22, weight: 800, fill: '#3a2a1a' });
        label(ctx, "de l'Homme et du Citoyen", 270, 292, { size: 22, weight: 800, fill: '#3a2a1a' });
        label(ctx, '26 August 1789', 270, 326, { size: 18, weight: 600, fill: '#6a4a2a' });
        para(ctx, 'Article 1: Men are born and remain free and equal in rights.', 130, 400, 280, 19, '#3a2a1a', 600, 3);
        ctx.fillStyle = 'rgba(58,42,26,0.35)'; const shown = smooth(S.lt / 3) * 8;
        for (let r = 0; r < shown; r++) ctx.fillRect(140, 470 + r * 14, 260 - (r % 3) * 30, 5);
        const words = [['Liberté', 'Liberty', '#5b8cff'], ['Égalité', 'Equality', '#e9eeff'], ['Fraternité', 'Fraternity', '#fb7185']];
        words.forEach(([fr, en, c], i) => {
          const a = after(S.lt, 0.6 + i * 0.6, 0.5); ctx.save(); ctx.globalAlpha *= a;
          label(ctx, fr, 640, 280 + i * 110, { size: 40, weight: 800, fill: c });
          label(ctx, en, 640, 320 + i * 110, { size: 20, weight: 500, fill: 'muted' });
          ctx.restore();
        });
        ctx.restore();
      }
      // Scene D: what followed.
      const aD = S.on(5, 0.45);
      if (aD) {
        ctx.save(); ctx.globalAlpha *= aD;
        const cards = [['1792', 'France becomes a republic', 'blue'], ['1793–94', 'The Terror: about 17,000 people executed', 'red'], ['1799', 'Napoleon Bonaparte takes power', 'purple']];
        cards.forEach(([yr, txt, c], i) => {
          const a = after(S.lt, 0.3 + i * 1.2, 0.5); ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, (1 - a) * 16);
          const x = 92 + i * 250; panel(ctx, x, 236, 236, 320, c, 0.1, 14);
          label(ctx, yr, x + 118, 282, { size: 30, weight: 800, fill: c });
          if (i === 0) { flag(ctx, x + 78, 330, 80, 54, ['#2a4a9a', '#f0f0f0', '#c0392b'], true, k * 2); line(ctx, x + 78, 330, x + 78, 420, '#c8a46a', 3); }
          if (i === 1) { ctx.fillStyle = '#e8dcc8'; ctx.fillRect(x + 108, 350, 20, 56); dot(ctx, x + 118, 340 + Math.sin(k * 6) * 1.5, 7 + Math.sin(k * 8), '#ffd27a', 8); }
          if (i === 2) { ctx.fillStyle = '#20243a'; ctx.beginPath(); ctx.ellipse(x + 118, 390, 66, 22, 0, Math.PI, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 52, 390); ctx.quadraticCurveTo(x + 118, 330, x + 184, 390); ctx.fill(); ctx.fillStyle = '#c0392b'; dot(ctx, x + 118, 368, 7, '#c0392b'); }
          para(ctx, txt, x + 14, 490, 208, 20, 'ink', 600, 3);
          ctx.restore();
        });
        ctx.restore();
      }
      endBox(ctx, PX, PY, PW, 448);
      // A running timeline, 1789–1800.
      sceneBox(ctx, [[0, 'rgba(14,20,44,0.92)'], [1, 'rgba(8,12,28,0.92)']], PX, 640, PW, 90);
      const tx = (y) => 110 + ((y - 1789) / 11) * 700;
      line(ctx, tx(1789), 670, tx(1800), 670, 'rgba(200,215,255,0.5)', 3);
      for (let y = 1789; y <= 1799; y += 2) { line(ctx, tx(y), 662, tx(y), 678, 'rgba(200,215,255,0.6)', 2); label(ctx, String(y), tx(y), 702, { size: 18, weight: 600, fill: 'muted' }); }
      const evs = [[1789.35, 0], [1789.4, 1], [1789.46, 2], [1789.54, 3], [1789.65, 4], [1792.72, 5], [1793.6, 5], [1794.3, 5], [1799.86, 5]];
      const cur = evs.filter(([, s]) => s === S.i).map(([y]) => y);
      const upto = Math.max(...cur);
      line(ctx, tx(1789), 670, tx(upto), 670, 'yellow', 4);
      ctx.fillStyle = tint('red', 0.4); ctx.fillRect(tx(1793.45), 664, tx(1794.57) - tx(1793.45), 12);
      for (const [y, s] of evs) { if (s > S.i) continue; if (s === S.i) ping(ctx, tx(y), 670, k, 'yellow', 5); else dot(ctx, tx(y), 670, 4.5, 'yellow'); }
      endBox(ctx, PX, 640, PW, 90);
      caption(ctx, S);
      ctx.restore();
    },

    // A calm cross-section of the Western Front: two trench lines, sandbags,
    // dugout and duckboards, no man's land with wire and craters, soldiers
    // waiting; the Armistice at 11 o'clock; then poppies of remembrance.
    'ww1-trenches'(b, ctx, it, t) {
      const S = stages(t, [
        [4.5, '1914–1918: trenches stretch about 700 km', 'yellow', 'The Western Front ran from the North Sea to Switzerland'],
        [4.5, 'Soldiers lived in the trenches: mud, cold, rats, waiting', 'muted', 'Letters from home mattered enormously'],
        [4, "No man's land: the dangerous ground between the lines", 'orange', 'Barbed wire and shell craters made it hard to cross'],
        [4.5, 'About 9 million soldiers died, and millions of civilians', 'red', 'Almost every town has a memorial to its dead'],
        [4.5, '11 November 1918, 11 a.m.: the Armistice', 'cyan', 'The guns fell silent'],
        [5, 'Poppies grew on the battlefields: we remember them', 'red', '"In Flanders Fields", a poem by John McCrae, 1915'],
      ]);
      const k = b.clock; const SY = 392; const TB = SY + 150; const FS = SY + 92;
      const peace = S.i >= 4 ? (S.i === 4 ? smooth(S.lt / 2) : 1) : 0;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The First World War trenches');
      sceneBox(ctx, [[0, '#38466e'], [0.38, '#a8867a'], [0.387, '#4b3a2a'], [1, '#2a2018']]);
      if (peace) { ctx.fillStyle = `rgba(120,165,220,${(0.75 * peace).toFixed(3)})`; ctx.fillRect(PX, PY, PW, SY - PY); dot(ctx, 700, 282, 22 * peace, '#ffe9a8', 10); }
      // Trench walls behind, then the earth with craters and the two cuts.
      ctx.fillStyle = '#2a1f15'; ctx.fillRect(78, SY - 2, 140, TB - SY + 2); ctx.fillRect(702, SY - 2, 140, TB - SY + 2);
      const crater = (x) => { let d = 0; for (const [c, w, dp] of [[330, 36, 20], [452, 44, 26], [575, 32, 18]]) d += Math.max(0, dp * (1 - ((x - c) / w) ** 2)); return d; };
      ctx.fillStyle = '#5a4632'; ctx.beginPath(); ctx.moveTo(PX, SY);
      ctx.lineTo(125, SY); ctx.lineTo(125, TB - 52); ctx.lineTo(78, TB - 52); ctx.lineTo(78, TB); ctx.lineTo(190, TB); ctx.lineTo(190, FS); ctx.lineTo(215, FS); ctx.lineTo(215, SY);
      for (let x = 215; x <= 705; x += 6) ctx.lineTo(x, SY + crater(x));
      ctx.lineTo(705, FS); ctx.lineTo(730, FS); ctx.lineTo(730, TB); ctx.lineTo(842, TB); ctx.lineTo(842, TB - 52); ctx.lineTo(795, TB - 52); ctx.lineTo(795, SY); ctx.lineTo(850, SY); ctx.lineTo(850, PB); ctx.lineTo(PX, PB); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(30,22,14,0.35)'; ctx.lineWidth = 2; ctx.beginPath();
      for (const y of [600, 640, 690]) { ctx.moveTo(PX, y); for (let x = PX; x <= 850; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.03 + y) * 5); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(120,100,80,0.5)'; for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.ellipse(PX + rnd(i) * 780, 570 + rnd(i + 7) * 150, 5 + rnd(i + 3) * 6, 3 + rnd(i + 5) * 3, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(120,140,150,0.55)'; for (const [c, w] of [[452, 30], [330, 22]]) { ctx.beginPath(); ctx.ellipse(c, SY + crater(c) - 4, w, 4, 0, 0, TAU); ctx.fill(); }
      // Timber frames, lamps, duckboards, sandbags.
      ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 4; ctx.strokeRect(80, TB - 50, 44, 50); ctx.strokeRect(796, TB - 50, 44, 50);
      dot(ctx, 96, TB - 40, 4.5 + Math.sin(k * 5) * 0.6, '#ffcf6a', 8); dot(ctx, 826, TB - 40, 4.5 + Math.sin(k * 5 + 1) * 0.6, '#ffcf6a', 8);
      ctx.fillStyle = '#9a7a4a'; for (let x = 128; x < 188; x += 9) ctx.fillRect(x, TB - 5, 6, 5); for (let x = 733; x < 793; x += 9) ctx.fillRect(x, TB - 5, 6, 5);
      const bags = (x0, n, rowsN) => { for (let r = 0; r < rowsN; r++) for (let i = 0; i < n - r; i++) { ctx.fillStyle = (i + r) % 2 ? '#a89670' : '#b8a67e'; ctx.beginPath(); ctx.ellipse(x0 + i * 15 + r * 7, SY - 6 - r * 10, 9, 6, 0, 0, TAU); ctx.fill(); } };
      bags(204, 4, 3); bags(668, 4, 3); bags(96, 3, 2); bags(796, 3, 2);
      // Shattered trees and barbed wire.
      for (const [x, h] of [[395, 70], [520, 54], [615, 40]]) { line(ctx, x, SY + crater(x), x + 3, SY - h, '#3a2c20', 6); line(ctx, x + 2, SY - h * 0.6, x + 16, SY - h * 0.85, '#3a2c20', 3); }
      ctx.strokeStyle = 'rgba(200,200,210,0.75)'; ctx.lineWidth = 1.5;
      for (const x0 of [262, 616]) { ctx.beginPath(); for (let i = 0; i <= 40; i++) { const a = i * 0.9; const x = x0 + i * 1.1 + Math.cos(a) * 7; const y = SY - 12 + Math.sin(a) * 9; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); line(ctx, x0, SY, x0, SY - 24, '#6a5a44', 3); line(ctx, x0 + 44, SY, x0 + 44, SY - 24, '#6a5a44', 3); }
      // Soldiers, waiting.
      const sa = peace ? 1 - 0.6 * peace : 1; const KH = '#cdbd92'; const FG = '#aab3a5';
      ctx.save(); ctx.globalAlpha *= sa;
      person(ctx, 203, FS, 80, KH, { helmet: 'brodie', arms: 'look', face: 1 });
      person(ctx, 150, TB, 68, KH, { helmet: 'brodie', sit: true, arms: 'write', face: 1 });
      person(ctx, 102, TB, 52, KH, { sit: true, face: 1 });
      person(ctx, 717, FS, 80, FG, { helmet: 'stahl', arms: 'look', face: -1 });
      person(ctx, 765, TB, 76, FG, { helmet: 'stahl', face: -1 });
      ctx.restore();
      if (!peace) for (let i = 0; i < 5; i++) { const x = 220 + mod(k * 10 + i * 110, 500); ctx.fillStyle = 'rgba(210,210,220,0.10)'; ctx.beginPath(); ctx.ellipse(x, SY - 14 - (i % 2) * 10, 70, 14, 0, 0, TAU); ctx.fill(); }
      // Poppies.
      if (S.i === 5 || (S.i === 4 && S.lt > 3)) {
        const g0 = S.i === 5 ? S.lt + 1.5 : S.lt - 3;
        for (let i = 0; i < 50; i++) {
          let x = 80 + rnd(i * 1.7) * 760; if ((x > 118 && x < 222) || (x > 698 && x < 802)) x += 110;
          if (x > 845) continue;
          const g = clamp((g0 - rnd(i + 4) * 2.2) / 1.2); if (g <= 0) continue;
          const base = (x > 215 && x < 705) ? SY + crater(x) : SY; const hgt = (16 + rnd(i + 9) * 24) * easeOut(g); const sw = Math.sin(k * 1.4 + i) * 2;
          line(ctx, x, base, x + sw, base - hgt, '#3a7a3a', 2);
          ctx.fillStyle = '#d62a2a'; ctx.beginPath(); ctx.arc(x + sw, base - hgt, 7.5 * easeOut(g), 0, TAU); ctx.fill();
          dot(ctx, x + sw, base - hgt, 2 * g, '#1a1a1a');
        }
      }
      // Labels.
      label(ctx, 'Allied trench', 170, 226, { size: 19, weight: 700, fill: 'ink' });
      label(ctx, "No man's land", 460, 226, { size: 19, weight: 700, fill: S.i === 2 ? 'orange' : 'ink' });
      label(ctx, 'German trench', 750, 226, { size: 19, weight: 700, fill: 'ink' });
      ctx.save(); ctx.globalAlpha *= peace ? 0.6 : 1;
      label(ctx, 'Firestep', 224, FS + 18, { size: 18, weight: 600, fill: '#e8d8b8', align: 'left' });
      label(ctx, 'Dugout', 101, TB + 22, { size: 18, weight: 600, fill: '#e8d8b8' });
      label(ctx, 'Duckboards', 170, TB + 48, { size: 18, weight: 600, fill: '#e8d8b8' });
      label(ctx, 'Barbed wire', 286, SY + 46, { size: 18, weight: 600, fill: '#e8d8b8' });
      ctx.restore();
      if (S.i === 3) { ctx.save(); ctx.globalAlpha *= S.on(3); para(ctx, 'Most were young men; many were still teenagers.', 230, 650, 460, 20, '#f0e2c4', 600, 2); ctx.restore(); }
      if (S.i === 5) { ctx.save(); ctx.globalAlpha *= S.on(5); label(ctx, 'Lest we forget', cx, 655, { size: 30, weight: 800, fill: '#ffd0d0' }); ctx.restore(); }
      if (S.i === 4) {
        ctx.save(); ctx.globalAlpha *= S.on(4); const c0 = { x: 460, y: 645 };
        dot(ctx, c0.x, c0.y, 46, '#f2ead6'); ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c0.x, c0.y, 46, 0, TAU); ctx.stroke();
        for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; line(ctx, c0.x + Math.cos(a) * 38, c0.y + Math.sin(a) * 38, c0.x + Math.cos(a) * 44, c0.y + Math.sin(a) * 44, '#2a2a2a', 2); }
        const ha = -Math.PI / 2 + (11 / 12) * TAU; line(ctx, c0.x, c0.y, c0.x + Math.cos(ha) * 24, c0.y + Math.sin(ha) * 24, '#1a1a1a', 5); line(ctx, c0.x, c0.y, c0.x, c0.y - 36, '#1a1a1a', 3);
        ctx.restore();
      }
      endBox(ctx);
      chip(ctx, '1914–1918', cx, 268, 'yellow', 18);
      caption(ctx, S);
      ctx.restore();
    },

    // Key moments of 1939–1945 one by one: a pulse on the world map, a card
    // with the date and the event, a dot on the timeline; a pause to
    // remember the dead; and the United Nations at the end.
    'ww2-timeline'(b, ctx, it, t) {
      const E = [
        [1939.67, '1 September 1939', 'Germany invades Poland; Britain and France declare war', 19, 52, 'Poland'],
        [1940.45, '1940', 'France falls; the Battle of Britain is fought in the air', 0, 51, 'Britain and France'],
        [1941.47, 'June 1941', 'Germany invades the Soviet Union', 37, 55.7, 'Soviet Union'],
        [1941.93, '7 December 1941', 'Japan attacks Pearl Harbor; the USA enters the war', -158, 21.3, 'Pearl Harbor'],
        [1942.9, '1942–1943', 'Turning points: the battles of Midway and Stalingrad', 44.5, 48.7, 'Stalingrad'],
        [1944.43, '6 June 1944', 'D-Day: Allied troops land in Normandy', -0.6, 49.3, 'Normandy'],
        [1945.35, '8 May 1945', 'Germany surrenders: Victory in Europe', 13.4, 52.5, 'Berlin'],
        [1945.6, 'August 1945', 'Atomic bombs on Hiroshima and Nagasaki; Japan surrenders', 132.5, 34.4, 'Hiroshima'],
        [1945.7, 'We remember', 'About 70–85 million people died, including 6 million Jews murdered in the Holocaust', null, null, ''],
        [1945.81, '24 October 1945', 'The United Nations is founded, to keep peace between nations', -122.4, 37.8, 'San Francisco'],
      ];
      const SD = 3.1; const total = E.length * SD + 2.5;
      const u = cycle(t, total, 0.5); const j = Math.min(E.length - 1, Math.floor(u / SD)); const lt = u - j * SD;
      const a = j === E.length - 1 ? Math.min(smooth(lt / 0.4), 1 - smooth((lt - SD - 2.1) / 0.4)) : fadeIO(lt, SD, 0.35);
      const k = b.clock; const ev = E[j]; const remember = ev[3] === null;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Second World War, 1939–1945');
      const R = { x: PX + 4, y: 186, w: PW - 8, h: 254, lon0: -180, lon1: 152, lat0: -15, lat1: 72 };
      world(ctx, R, remember ? { land: 'rgba(150,160,180,0.18)', edge: 'rgba(190,200,220,0.35)' } : {});
      if (j === 4) { const m = proj(R, -177.4, 28.2); ping(ctx, m.x + 6, m.y, k, 'orange', 5); }
      for (let i = 0; i < j; i++) { if (E[i][3] === null) continue; const p = proj(R, E[i][3], E[i][4]); dot(ctx, p.x, p.y, 4, remember ? 'rgba(220,220,235,0.5)' : 'rgba(255,159,67,0.7)'); }
      if (!remember) {
        const p = proj(R, ev[3], ev[4]); ping(ctx, p.x, p.y, k, j === E.length - 1 ? 'cyan' : 'orange', 6);
        const al = p.x < 160 ? 'left' : p.x > 760 ? 'right' : 'center';
        ctx.save(); ctx.globalAlpha *= a; label(ctx, ev[5], p.x + (al === 'left' ? -6 : al === 'right' ? 6 : 0), p.y - 22, { size: 18, weight: 800, fill: 'ink', align: al }); ctx.restore();
      } else {
        ctx.save(); ctx.globalAlpha *= a;
        for (let i = 0; i < 9; i++) { const x = 260 + i * 50; dot(ctx, x, 312 + Math.sin(k * 6 + i) * 1.2, 6 + Math.sin(k * 7 + i), '#ffd27a', 8); ctx.fillStyle = '#e8dcc8'; ctx.fillRect(x - 5, 318, 10, 30); }
        ctx.restore();
      }
      // The event card.
      const c = remember ? 'ink' : j === E.length - 1 ? 'cyan' : 'orange';
      panel(ctx, PX, 454, PW, 130, remember ? 'muted' : c, 0.08, 14);
      ctx.save(); ctx.globalAlpha *= a;
      label(ctx, ev[1], cx, 484, { size: 26, weight: 800, fill: c });
      para(ctx, ev[2], PX + 30, 540, PW - 60, 21, 'ink', 600, 2);
      ctx.restore();
      // The timeline.
      const tx = (y) => 110 + (y - 1939) * 100;
      line(ctx, tx(1939), 626, tx(1946), 626, 'rgba(200,215,255,0.45)', 3);
      for (let y = 1939; y <= 1945; y++) { line(ctx, tx(y), 618, tx(y), 634, 'rgba(200,215,255,0.6)', 2); label(ctx, String(y), tx(y) + 50, 660, { size: 19, weight: 700, fill: 'muted' }); }
      line(ctx, tx(1939.67), 626, tx(ev[0]), 626, remember ? 'rgba(230,230,240,0.8)' : 'orange', 4);
      for (let i = 0; i <= j; i++) { if (i === j) ping(ctx, tx(E[i][0]), 626, k, c === 'ink' ? 'muted' : c, 5); else dot(ctx, tx(E[i][0]), 626, 4.5, 'orange'); }
      chip(ctx, 'Allies: UK, USSR, USA, China…   Axis: Germany, Italy, Japan', cx, Y1 - 58, 'muted', 18);
      label(ctx, `Moment ${j + 1} of ${E.length}`, cx, Y1 - 19, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Apollo 11 in six scenes: lift-off, the crew, the voyage, the landing,
    // the first step, and splashdown.
    'moon-landing'(b, ctx, it, t) {
      const S = stages(t, [
        [4.5, '16 July 1969: a Saturn V rocket lifts off from Florida', 'orange', 'About 110 m tall: the most powerful rocket of its time'],
        [4, 'The crew: Neil Armstrong, Buzz Aldrin, Michael Collins', 'cyan', 'Collins circled the Moon while the others landed'],
        [4, 'About three days and 384,000 km to the Moon', 'blue', 'The spacecraft coasted most of the way'],
        [4.5, '20 July: the lunar module Eagle lands on the Moon', 'yellow', '"The Eagle has landed"'],
        [5.5, 'Armstrong steps out: the first person on the Moon', 'teal', 'About 600 million people watched on television'],
        [4.5, '24 July 1969: splashdown in the Pacific Ocean', 'blue', 'All three astronauts came home safely'],
      ]);
      const k = b.clock; const A = (j) => S.on(j, 0.4);
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Apollo 11: the Moon landing');
      sceneBox(ctx, [[0, '#05070f'], [1, '#0a1024']]);
      // Lift-off.
      if (A(0)) {
        ctx.save(); ctx.globalAlpha *= A(0);
        const lt = S.lt; const rise = lt < 1.2 ? 0 : 26 * (lt - 1.2) ** 2;
        const sky = ctx.createLinearGradient(0, PY, 0, PB); sky.addColorStop(0, '#1a3a7a'); sky.addColorStop(1, '#9cc4ea'); ctx.fillStyle = sky; ctx.fillRect(PX, PY, PW, PH);
        ctx.fillStyle = '#4a5a3a'; ctx.fillRect(PX, 660, PW, 70);
        ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 3; ctx.strokeRect(390, 330, 34, 330);
        ctx.beginPath(); for (let y = 330; y < 660; y += 30) { ctx.moveTo(390, y); ctx.lineTo(424, y + 30); ctx.moveTo(424, y); ctx.lineTo(390, y + 30); } ctx.stroke();
        const rx = 460; const rb = 650 - rise;
        if (lt > 0.6) { for (let i = 0; i < 10; i++) { const q = mod(k * 0.6 + i / 10, 1); ctx.fillStyle = `rgba(235,235,240,${(0.7 * (1 - q)).toFixed(3)})`; ctx.beginPath(); ctx.arc(rx + (i % 2 ? 1 : -1) * (30 + q * 160), 650 - q * 30, 20 + q * 34, 0, TAU); ctx.fill(); } }
        if (lt > 0.8) { const fl = 50 + Math.sin(k * 30) * 8 + Math.min(80, rise * 0.3); ctx.fillStyle = '#ffd27a'; poly(ctx, [rx - 13, rb, rx + 13, rb, rx, rb + fl], true); ctx.fill(); ctx.fillStyle = '#ff7a2a'; poly(ctx, [rx - 8, rb, rx + 8, rb, rx, rb + fl * 0.6], true); ctx.fill(); }
        ctx.fillStyle = '#f2f2f2'; ctx.fillRect(rx - 15, rb - 120, 30, 120); ctx.fillRect(rx - 13, rb - 210, 26, 90); ctx.fillRect(rx - 11, rb - 262, 22, 52);
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(rx - 15, rb - 120, 15, 22); ctx.fillRect(rx, rb - 60, 15, 22); ctx.fillRect(rx - 13, rb - 214, 26, 6);
        poly(ctx, [rx - 11, rb - 262, rx, rb - 290, rx + 11, rb - 262], true); ctx.fill(); line(ctx, rx, rb - 290, rx, rb - 318, '#e0e0e0', 2);
        ctx.fillStyle = '#d0d0d0'; poly(ctx, [rx - 15, rb, rx - 26, rb + 6, rx - 15, rb - 22], true); ctx.fill(); poly(ctx, [rx + 15, rb, rx + 26, rb + 6, rx + 15, rb - 22], true); ctx.fill();
        label(ctx, 'Saturn V', 260, 360, { size: 22, weight: 800, fill: '#0e1a3a' });
        label(ctx, 'Kennedy Space Center', 250, 392, { size: 18, weight: 600, fill: '#0e1a3a' });
        ctx.restore();
      }
      // The crew.
      if (A(1)) {
        ctx.save(); ctx.globalAlpha *= A(1);
        stars(ctx, PX, PY, PW, PH, 50, k);
        [['Neil Armstrong', 'Commander', ''], ['Buzz Aldrin', 'Lunar module pilot', ''], ['Michael Collins', 'Command module pilot', 'stayed in orbit']].forEach(([nm, role, note], i) => {
          const x = 200 + i * 260; const a2 = after(S.lt, 0.2 + i * 0.4); ctx.save(); ctx.globalAlpha *= a2;
          ctx.fillStyle = '#e8ecf4'; ctx.beginPath(); ctx.ellipse(x, 470, 80, 46, 0, Math.PI, TAU); ctx.fill(); ctx.fillRect(x - 80, 470, 160, 20);
          dot(ctx, x, 380, 56, '#e8ecf4'); dot(ctx, x, 384, 40, '#c9a54a'); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(x - 14, 368, 12, 7, -0.5, 0, TAU); ctx.fill();
          label(ctx, nm, x, 530, { size: 22, weight: 800, fill: 'ink' });
          label(ctx, role, x, 562, { size: 18, weight: 600, fill: 'cyan' });
          if (note) label(ctx, note, x, 592, { size: 18, weight: 500, fill: 'muted' });
          ctx.restore();
        });
        ctx.restore();
      }
      // The voyage.
      if (A(2)) {
        ctx.save(); ctx.globalAlpha *= A(2);
        stars(ctx, PX, PY, PW, PH, 60, k);
        const E0 = { x: 180, y: 460 }; const M0 = { x: 730, y: 400 };
        const g = ctx.createRadialGradient(E0.x - 18, E0.y - 18, 8, E0.x, E0.y, 60); g.addColorStop(0, '#7ac0ff'); g.addColorStop(1, '#1a4a9a'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(E0.x, E0.y, 60, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(80,170,90,0.8)'; ctx.beginPath(); ctx.ellipse(E0.x - 10, E0.y - 6, 22, 30, 0.4, 0, TAU); ctx.fill();
        dot(ctx, M0.x, M0.y, 28, '#b8b8c0'); dot(ctx, M0.x - 8, M0.y - 6, 6, '#9a9aa2'); dot(ctx, M0.x + 9, M0.y + 8, 4, '#9a9aa2');
        const out = (q) => bz({ x: E0.x + 40, y: E0.y - 44 }, { x: 450, y: 250 }, { x: M0.x - 30, y: M0.y - 40 }, q);
        ctx.strokeStyle = 'rgba(120,180,255,0.55)'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 6]); ctx.beginPath();
        for (let q = 0; q <= 1.001; q += 0.04) { const p = out(q); if (q) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
        ctx.arc(M0.x, M0.y, 50, -2.2, 1.8); ctx.stroke(); ctx.setLineDash([]);
        const q = smooth(S.lt / 3.4); const p = q < 0.85 ? out(q / 0.85) : { x: M0.x + Math.cos(-2.2 + (q - 0.85) / 0.15 * 2.4) * 50, y: M0.y + Math.sin(-2.2 + (q - 0.85) / 0.15 * 2.4) * 50 };
        dot(ctx, p.x, p.y, 6, '#ffffff', 8);
        chip(ctx, `Day ${1 + Math.min(2, Math.floor(q * 3))}`, 460, 220, 'blue', 20);
        label(ctx, 'Earth', E0.x, E0.y + 86, { size: 19, weight: 700, fill: 'ink' }); label(ctx, 'Moon', M0.x, M0.y + 82, { size: 19, weight: 700, fill: 'ink' });
        label(ctx, 'About 384,000 km', 460, 640, { size: 20, weight: 700, fill: 'blue' });
        ctx.restore();
      }
      // On the Moon: the landing and the first step.
      const onMoon = Math.max(A(3), A(4));
      if (onMoon) {
        ctx.save(); ctx.globalAlpha *= onMoon;
        stars(ctx, PX, PY, PW, 360, 70, k);
        dot(ctx, 760, 340, 26, '#3a7ad0'); ctx.fillStyle = '#05070f'; ctx.beginPath(); ctx.arc(772, 334, 24, 0, TAU); ctx.fill();
        ctx.fillStyle = '#9a9aa2'; ctx.beginPath(); ctx.moveTo(PX, 600); for (let x = PX; x <= 850; x += 20) ctx.lineTo(x, 600 + Math.sin(x * 0.02) * 6); ctx.lineTo(850, PB); ctx.lineTo(PX, PB); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(70,70,80,0.5)'; for (const [x, y, r] of [[140, 650, 30], [300, 700, 22], [760, 680, 26], [560, 712, 14]]) { ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.3, 0, 0, TAU); ctx.fill(); }
        const land = S.i === 3 ? smooth(S.lt / 3.2) : 1; const lx = S.i === 3 ? 460 : 640; const ly = lerp(300, 600, land);
        if (S.i === 3 && land < 1) { ctx.fillStyle = 'rgba(255,220,150,0.7)'; poly(ctx, [lx - 8, ly - 2, lx + 8, ly - 2, lx, ly + 20 + Math.sin(k * 30) * 4], true); ctx.fill(); }
        if (S.i === 3 && land > 0.85) for (let i = 0; i < 6; i++) { const q = clamp((S.lt - 2.8) / 1.5); ctx.fillStyle = `rgba(190,190,200,${(0.5 * (1 - q)).toFixed(3)})`; ctx.beginPath(); ctx.arc(lx + (i - 2.5) * 30 * q, 596, 10 + 10 * q, 0, TAU); ctx.fill(); }
        ctx.strokeStyle = '#c9a54a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx - 30, ly - 30); ctx.lineTo(lx - 46, ly); ctx.moveTo(lx + 30, ly - 30); ctx.lineTo(lx + 46, ly); ctx.stroke();
        line(ctx, lx - 52, ly, lx - 40, ly, '#c9a54a', 4); line(ctx, lx + 40, ly, lx + 52, ly, '#c9a54a', 4);
        ctx.fillStyle = '#d4a63a'; ctx.fillRect(lx - 32, ly - 52, 64, 26);
        ctx.fillStyle = '#c8c8cc'; poly(ctx, [lx - 24, ly - 52, lx - 28, ly - 76, lx - 10, ly - 92, lx + 18, ly - 90, lx + 28, ly - 70, lx + 24, ly - 52], true); ctx.fill();
        ctx.fillStyle = '#2a2a3a'; poly(ctx, [lx - 16, ly - 74, lx - 6, ly - 84, lx - 2, ly - 70], true); ctx.fill();
        if (S.i === 3 && land >= 1) { ctx.save(); ctx.globalAlpha *= after(S.lt, 3.3); chip(ctx, '"The Eagle has landed"', 460, 230, 'yellow', 22); ctx.restore(); }
        label(ctx, 'Sea of Tranquility', 180, 708, { size: 18, weight: 600, fill: '#2a2a3a' });
        if (S.i === 4) {
          const lt = S.lt; const down = smooth(lt / 1.4); const walk = clamp((lt - 1.6) / 2.2);
          const ax = walk > 0 ? lerp(604, 500, walk) : 604; const ay = walk > 0 ? 600 : lerp(560, 600, down);
          line(ctx, 608, 560, 600, 600, '#c8c8cc', 2);
          for (let i = 0; i < 6; i++) { const fx = 594 - i * 18; if (fx > ax + 6) continue; ctx.fillStyle = 'rgba(60,60,70,0.7)'; ctx.beginPath(); ctx.ellipse(fx, 604 + (i % 2) * 6, 6, 2.5, 0, 0, TAU); ctx.fill(); }
          person(ctx, ax, ay, 58, '#f0f2f8', { helmet: 'space', face: -1, walk: walk > 0 && walk < 1 ? k * 4 : undefined, arms: walk >= 1 ? 'wave' : 'down', ph: k * 3, col: '#eef0f6' });
          if (lt > 3.2) { const fa = after(lt, 3.2, 0.6); ctx.save(); ctx.globalAlpha *= fa; line(ctx, 420, 600, 420, 520, '#d0d0d0', 3); ctx.fillStyle = '#f2f2f2'; ctx.fillRect(421, 522, 56, 34); ctx.fillStyle = '#c0392b'; for (let r = 0; r < 4; r++) ctx.fillRect(421, 526 + r * 8, 56, 4); ctx.fillStyle = '#2a4a9a'; ctx.fillRect(421, 522, 22, 18); ctx.restore(); }
          ctx.save(); ctx.globalAlpha *= after(lt, 0.4, 0.6);
          para(ctx, '"That\'s one small step for man, one giant leap for mankind."', 110, 236, 700, 23, 'ink', 700, 2);
          ctx.restore();
        }
        ctx.restore();
      }
      // Splashdown.
      if (A(5)) {
        ctx.save(); ctx.globalAlpha *= A(5);
        const sky = ctx.createLinearGradient(0, PY, 0, 580); sky.addColorStop(0, '#3a72c0'); sky.addColorStop(1, '#bcd8f0'); ctx.fillStyle = sky; ctx.fillRect(PX, PY, PW, PH);
        ctx.fillStyle = '#1a4a7a'; ctx.fillRect(PX, 580, PW, 150);
        ctx.strokeStyle = 'rgba(220,240,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 14; i++) { const wx = PX + mod(i * 61 + k * 12, PW); const wy = 600 + (i % 4) * 30; ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 10, wy - 4, wx + 20, wy); } ctx.stroke();
        ctx.fillStyle = '#4a5560'; poly(ctx, [700, 580, 830, 580, 818, 562, 760, 562, 754, 548, 726, 548, 722, 562, 712, 562], true); ctx.fill();
        label(ctx, 'USS Hornet', 765, 530, { size: 18, weight: 700, fill: '#14203a' });
        const d = smooth(S.lt / 3.2); const cy0 = lerp(380, 584, d);
        if (d < 1) {
          for (const [dx, c] of [[-46, '#e2453a'], [0, '#f2f2f2'], [46, '#e2453a']]) {
            const px = 460 + dx; const py = cy0 - 130 + Math.abs(dx) * 0.3;
            ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(px, py, 34, 20, 0, Math.PI, TAU); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px - 34, py); ctx.lineTo(460, cy0 - 30); ctx.moveTo(px + 34, py); ctx.lineTo(460, cy0 - 30); ctx.stroke();
          }
        }
        ctx.fillStyle = '#8a8a92'; poly(ctx, [440, cy0, 480, cy0, 468, cy0 - 30, 452, cy0 - 30], true); ctx.fill();
        if (d >= 1) for (let i = 0; i < 3; i++) { const q = mod(k * 0.6 + i / 3, 1); ctx.strokeStyle = `rgba(230,245,255,${(0.7 * (1 - q)).toFixed(3)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(460, 588, 30 + q * 90, 6 + q * 14, 0, 0, TAU); ctx.stroke(); }
        ctx.restore();
      }
      endBox(ctx);
      caption(ctx, S);
      ctx.restore();
    },

    // A street divided: the map of a split Germany, the wall going up in
    // 1961, people waving across it, crowds in 1989, the wall coming down,
    // friends meeting, and the flag of a reunified Germany.
    'berlin-wall'(b, ctx, it, t) {
      const S = stages(t, [
        [4.5, 'After 1945: Germany, and Berlin, split East and West', 'blue', 'West Berlin was an island inside communist East Germany'],
        [4.5, '13 August 1961: barbed wire, then a concrete wall', 'red', 'Built to stop East Germans leaving for the West'],
        [4.5, 'For 28 years, families and friends were kept apart', 'muted', 'At least 140 people died at the wall trying to cross'],
        [4.5, '9 November 1989: crowds gather; the border opens', 'yellow', 'After weeks of peaceful protest in East Germany'],
        [4.5, 'East and West Berliners cross and celebrate together', 'teal', 'People chipped pieces off the wall as souvenirs'],
        [4.5, '3 October 1990: Germany is reunified', 'green', 'Pieces of the wall now stand in museums around the world'],
      ]);
      const k = b.clock; const GY = 622; const one = S.i === 5 ? smooth(S.lt / 1.5) : 0;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The Berlin Wall');
      const night = S.i === 3 ? smooth(S.lt / 1) : S.i === 4 ? 1 - smooth((S.lt - 3) / 1.5) : 0;
      sceneBox(ctx, [[0, night ? '#0e1430' : '#5a7aa8'], [0.8, night ? '#3a3050' : '#c8d0dc'], [0.81, '#4a4a52'], [1, '#33333a']]);
      // Map of divided Germany.
      const R = { x: 400, y: 190, w: 122, h: 150, lon0: 5.5, lon1: 15.5, lat0: 47, lat1: 55.2 };
      ctx.fillStyle = one ? tint('green', 0.4) : tint('blue', 0.4); shape(ctx, R, GERMANY); ctx.fill();
      ctx.fillStyle = one ? tint('green', 0.4) : tint('red', 0.4); shape(ctx, R, EAST_DE); ctx.fill();
      ctx.strokeStyle = 'rgba(230,236,255,0.8)'; ctx.lineWidth = 1.5; shape(ctx, R, GERMANY); ctx.stroke();
      const brd = [[10.9, 54], [10.8, 53.6], [11.3, 53.1], [10.6, 52.7], [10.9, 52], [10.2, 51.4], [10, 50.6], [11, 50.4], [12.2, 50.3]];
      ctx.strokeStyle = `rgba(255,255,255,${(0.9 * (1 - one)).toFixed(3)})`; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath();
      brd.forEach(([lo, la], i) => { const p = proj(R, lo, la); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }); ctx.stroke(); ctx.setLineDash([]);
      const bp = proj(R, 13.4, 52.5); ping(ctx, bp.x, bp.y, k, 'yellow', 4);
      line(ctx, bp.x + 6, bp.y, 532, bp.y, 'rgba(255,214,120,0.8)', 1.5);
      label(ctx, 'Berlin', 538, bp.y, { size: 18, weight: 700, fill: 'yellow', align: 'left' });
      if (!one) { label(ctx, 'West Germany', 392, 300, { size: 18, weight: 700, fill: '#cfe0ff', align: 'right' }); label(ctx, 'East Germany', 532, 300, { size: 18, weight: 700, fill: '#ffd0d8', align: 'left' }); }
      else label(ctx, 'Germany', 532, 300, { size: 19, weight: 800, fill: 'green', align: 'left' });
      // Buildings: West on the left, East (with the Brandenburg Gate) on the right.
      for (const [x, w, h, c] of [[80, 80, 150, '#6a7aa0'], [168, 70, 110, '#8a6a7a'], [246, 90, 170, '#5a8a8a'], [344, 70, 120, '#8a8a6a']]) {
        ctx.fillStyle = c; ctx.fillRect(x, GY - h, w, h);
        ctx.fillStyle = night ? 'rgba(255,220,130,0.85)' : 'rgba(255,240,200,0.6)';
        for (let yy = GY - h + 12; yy < GY - 20; yy += 24) for (let xx = x + 10; xx < x + w - 10; xx += 18) if (rnd(xx * 3 + yy) < 0.7) ctx.fillRect(xx, yy, 8, 10);
      }
      ctx.fillStyle = '#c8bea8'; ctx.fillRect(584, GY - 92, 120, 14); ctx.fillRect(580, GY - 104, 128, 12);
      for (let i = 0; i < 6; i++) ctx.fillRect(588 + i * 21, GY - 78, 9, 78);
      ctx.fillStyle = '#6a8a7a'; ctx.fillRect(632, GY - 118, 26, 14); dot(ctx, 645, GY - 124, 6, '#6a8a7a');
      label(ctx, 'Brandenburg Gate', 644, GY - 146, { size: 18, weight: 600, fill: night ? '#e8e0c8' : '#1a2440' });
      for (const [x, w, h] of [[722, 56, 130], [786, 62, 100]]) { ctx.fillStyle = '#7a7a80'; ctx.fillRect(x, GY - h, w, h); ctx.fillStyle = night ? 'rgba(255,220,130,0.7)' : 'rgba(230,230,220,0.5)'; for (let yy = GY - h + 12; yy < GY - 20; yy += 24) for (let xx = x + 8; xx < x + w - 8; xx += 16) ctx.fillRect(xx, yy, 7, 9); }
      label(ctx, 'West Berlin', 230, 400, { size: 20, weight: 800, fill: night ? '#cfe0ff' : '#14203a' });
      label(ctx, 'East Berlin', 716, 400, { size: 20, weight: 800, fill: night ? '#ffd0d8' : '#3a1420' });
      // The wall: barbed wire first, then concrete, a guarded strip and an inner wall.
      let wallH = 0; let wire = 0;
      if (S.i === 1) { wire = smooth(S.lt / 1); wallH = smooth((S.lt - 1.4) / 2.4); }
      else if (S.i === 2 || S.i === 3) { wire = 1; wallH = 1; }
      else if (S.i === 4) { wallH = 1 - smooth((S.lt - 0.6) / 1.8); wire = wallH; }
      if (S.i === 0) line(ctx, 448, GY + 4, 448, GY + 40, 'rgba(255,255,255,0.6)', 3, [6, 6]);
      if (wire > 0) {
        ctx.save(); ctx.globalAlpha *= wire;
        ctx.fillStyle = 'rgba(190,176,140,0.9)'; ctx.fillRect(470, GY - 3, 98, 8);
        line(ctx, 432, GY, 432, GY - 60, '#6a6a70', 3); line(ctx, 464, GY, 464, GY - 60, '#6a6a70', 3);
        ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i <= 30; i++) { const a = i * 1.1; const x = 428 + i * 1.3 + Math.cos(a) * 6; const y = GY - 50 + Math.sin(a) * 8; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
        ctx.fillStyle = '#5a5a60'; const th = 170 * Math.min(1, wire * 1.2); ctx.fillRect(508, GY - th, 12, th); ctx.fillRect(498, GY - th - 18, 32, 20);
        ctx.fillStyle = night ? '#ffe9a0' : '#9aa0aa'; ctx.fillRect(503, GY - th - 13, 22, 8);
        ctx.restore();
      }
      if (wallH > 0) {
        const top = GY - 150 * wallH;
        ctx.fillStyle = '#ddd8cc'; ctx.fillRect(426, top, 44, GY - top); ctx.fillStyle = '#c4beb2'; ctx.beginPath(); ctx.arc(448, top, 22, Math.PI, 0); ctx.fill();
        ctx.strokeStyle = 'rgba(120,115,105,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let y = GY - 30; y > top + 10; y -= 30) { ctx.moveTo(426, y); ctx.lineTo(470, y); } ctx.stroke();
        if (S.i >= 2) for (const [gy, gh, gc] of [[GY - 110, 12, 'rgba(80,140,220,0.8)'], [GY - 70, 16, 'rgba(230,90,110,0.8)'], [GY - 36, 10, 'rgba(250,200,80,0.8)']]) { if (gy < top + 6) continue; ctx.fillStyle = gc; ctx.fillRect(428, gy, 14, gh); }
        ctx.fillStyle = '#c4beb2'; ctx.fillRect(560, GY - 90 * wallH, 10, 90 * wallH);
      }
      // People.
      const crowd = S.i === 3 ? smooth(S.lt / 2) : S.i >= 4 ? 1 : 0;
      const W = [[330, '#cfe0ff'], [362, '#d8e4ff'], [398, '#c0d4ff'], [300, '#d0d8f0'], [270, '#c8d8ff'], [240, '#d8e0ff']];
      const Ea = [[586, '#ffd8dc'], [618, '#ffe0d0'], [652, '#f8d0d8'], [686, '#ffe4d8'], [720, '#f0d0d0'], [752, '#ffd8d0']];
      const meet = S.i === 4 ? smooth((S.lt - 1.6) / 2) : S.i === 5 ? 1 : 0;
      W.forEach(([x, c], i) => {
        if (i >= 3 + Math.round(crowd * 3)) return;
        const tx = x + meet * (i < 3 ? 116 : 0); const moving = S.i === 4 && meet > 0 && meet < 1 && i < 3;
        const arms = S.i === 2 && i === 0 ? 'wave' : (S.i >= 3 ? (i % 2 ? 'up' : 'raise') : 'down');
        person(ctx, tx, GY + 4 + (i % 2) * 6, 56, c, { face: 1, walk: moving ? k * 5 + i : undefined, arms: meet >= 1 && i < 3 ? 'hug' : arms, ph: k * 3, alpha: 0.95, col: c });
      });
      Ea.forEach(([x, c], i) => {
        if (i >= 3 + Math.round(crowd * 3)) return;
        const tx = x - meet * (i < 3 ? 116 : 0); const moving = S.i === 4 && meet > 0 && meet < 1 && i < 3;
        const arms = S.i === 2 && i === 0 ? 'wave' : (S.i >= 3 ? (i % 2 ? 'raise' : 'up') : 'down');
        person(ctx, tx, GY + 4 + (i % 2) * 6, 56, c, { face: -1, walk: moving ? k * 5 + i : undefined, arms: meet >= 1 && i < 3 ? 'hug' : arms, ph: k * 3 + 1, alpha: 0.95, col: c });
      });
      if (S.i === 3 && wallH > 0.9) { const up = smooth((S.lt - 1.5) / 1); if (up > 0) { person(ctx, 438, GY - 150, 50, '#fff0c8', { arms: 'up', a: up, col: '#fff0c8' }); person(ctx, 458, GY - 150, 48, '#e0f0ff', { arms: 'raise', a: up, col: '#e0f0ff' }); } }
      if (night) for (let i = 0; i < 3; i++) { const q = mod(k * 0.5 + i / 3, 1); const fx = 200 + i * 260; const fy = 250 + i * 20; for (let s = 0; s < 10; s++) { const a = (s / 10) * TAU; dot(ctx, fx + Math.cos(a) * 40 * q, fy + Math.sin(a) * 40 * q + q * q * 10, 2.5 * (1 - q) * night + 0.1, ['#ffd27a', '#7fd0ff', '#ff9fb0'][i]); } }
      if (S.i === 5) { const fh = smooth(S.lt / 2.2); line(ctx, 448, GY, 448, 430, '#d0d0d0', 3); flag(ctx, 449, lerp(GY - 40, 432, fh), 70, 42, ['#1a1a1a', '#d00000', '#ffce00'], false, k * 3); }
      endBox(ctx);
      chip(ctx, ['1945', '1961', '1961–1989', '1989', '1989', '1990'][S.i], 150, 210, 'yellow', 20);
      caption(ctx, S);
      ctx.restore();
    },

    // Five moments of the US civil rights movement, each a small living
    // scene, along a timeline: walking instead of riding, a quarter of a
    // million at the Lincoln Memorial, a law signed, a march, a vote.
    'civil-rights'(b, ctx, it, t) {
      const S = stages(t, [
        [5, '1955–56: the Montgomery bus boycott', 'yellow', 'After Rosa Parks was arrested, people walked for 381 days'],
        [5, '28 August 1963: the March on Washington', 'cyan', 'About 250,000 people; Martin Luther King Jr: "I have a dream"'],
        [5, '2 July 1964: the Civil Rights Act becomes law', 'green', 'It bans segregation in public places and job discrimination'],
        [4.5, 'March 1965: marchers walk from Selma to Montgomery', 'orange', 'Peaceful protesters demanding the right to vote'],
        [5, '6 August 1965: the Voting Rights Act', 'purple', 'It banned literacy tests used to stop Black citizens voting'],
      ]);
      const k = b.clock; const A = (j) => S.on(j, 0.45); const SIL = '#1e2236';
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'The US civil rights movement');
      sceneBox(ctx, [[0, '#6a8ec4'], [0.72, '#d8e2ee'], [0.73, '#8a8a8a'], [1, '#6a6a6a']], PX, PY, PW, 432);
      if (A(0)) {
        ctx.save(); ctx.globalAlpha *= A(0);
        ctx.fillStyle = '#5a5a60'; ctx.fillRect(PX, 486, PW, 60); line(ctx, PX, 516, PX + PW, 516, '#e8e0a0', 3, [24, 18]);
        ctx.fillStyle = '#b8b0a0'; ctx.fillRect(PX, 546, PW, 64);
        const bx = 160 + S.lt * 70;
        ctx.fillStyle = '#3a8a5a'; rounded(ctx, bx, 420, 230, 84, 10); ctx.fill(); ctx.fillStyle = '#f2f2e8'; ctx.fillRect(bx, 470, 230, 10);
        ctx.fillStyle = '#cfe4f4'; for (let i = 0; i < 6; i++) ctx.fillRect(bx + 14 + i * 34, 432, 26, 26);
        person(ctx, bx + 213, 466, 30, SIL, { sit: true });
        dot(ctx, bx + 46, 506, 14, '#1a1a1a'); dot(ctx, bx + 186, 506, 14, '#1a1a1a');
        for (let i = 0; i < 9; i++) { const x = 820 - mod(S.lt * 34 + i * 82, 760); person(ctx, x, 600 + (i % 2) * 4, 62, SIL, { face: -1, walk: k * 4 + i, hat: i % 3 === 0, robe: i % 2 === 1 }); }
        chip(ctx, '381 days', 760, 214, 'yellow', 20);
        label(ctx, 'The buses ran almost empty', 460, 330, { size: 20, weight: 700, fill: '#14203a' });
        ctx.restore();
      }
      if (A(1)) {
        ctx.save(); ctx.globalAlpha *= A(1);
        ctx.fillStyle = '#ece6da'; ctx.fillRect(280, 300, 360, 22); ctx.fillRect(270, 404, 380, 14); ctx.fillRect(256, 418, 408, 14);
        for (let i = 0; i < 12; i++) ctx.fillRect(290 + i * 29.5, 322, 14, 82);
        ctx.fillStyle = '#d8d0c0'; ctx.fillRect(296, 284, 328, 16);
        person(ctx, 460, 404, 26, SIL, { arms: mod(k, 2) < 1 ? 'raise' : 'point' });
        ctx.fillStyle = 'rgba(140,180,220,0.9)'; ctx.fillRect(PX, 470, PW, 26);
        let id = 0;
        for (let r = 0; r < 3; r++) for (let x = PX + 10 + r * 12; x < PX + PW; x += 24) { id++; if (r === 0 && x > 300 && x < 620) continue; person(ctx, x, 540 + r * 30, 40 + r * 4, ['#24283c', '#2e2a3a', '#20303a'][id % 3], { arms: rnd(id) < 0.15 ? 'raise' : 'down', lean: Math.sin(k + id) * 0.04 }); }
        sign(ctx, 170, 456, 'FREEDOM', '#7a1a1a', 18, 30); sign(ctx, 740, 456, 'JOBS', '#1a3a7a', 18, 30); sign(ctx, 620, 500, 'EQUAL RIGHTS', '#1a5a3a', 18, 26);
        chip(ctx, 'Lincoln Memorial', 460, 232, 'cyan', 19);
        ctx.restore();
      }
      if (A(2)) {
        ctx.save(); ctx.globalAlpha *= A(2);
        ctx.fillStyle = '#efe6cc'; rounded(ctx, 210, 206, 500, 386, 10); ctx.fill(); ctx.strokeStyle = '#8a7a50'; ctx.lineWidth = 2; ctx.stroke();
        label(ctx, 'Civil Rights Act of 1964', 460, 248, { size: 28, weight: 800, fill: '#2a2414' });
        para(ctx, 'Ends segregation in public places such as restaurants, hotels and parks', 240, 320, 440, 20, '#2a2414', 600, 2);
        para(ctx, 'Bans job discrimination by race, colour, religion, sex or national origin', 240, 400, 440, 20, '#2a2414', 600, 2);
        const sg = clamp((S.lt - 1) / 2.4); ctx.strokeStyle = '#1a2a6a'; ctx.lineWidth = 3; ctx.beginPath();
        for (let i = 0; i <= 60 * sg; i++) { const q = i / 60; const x = 300 + q * 260; const y = 500 + Math.sin(q * 26) * 10 * Math.sin(q * 3 + 0.4) - q * 8; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke(); line(ctx, 290, 522, 600, 522, '#8a7a50', 1.5);
        if (sg > 0 && sg < 1) { const x = 300 + sg * 260; line(ctx, x, 500, x + 22, 470, '#2a2a2a', 4); }
        label(ctx, 'Signed by President Lyndon B. Johnson', 460, 556, { size: 18, weight: 600, fill: '#4a4024' });
        ctx.restore();
      }
      if (A(3)) {
        ctx.save(); ctx.globalAlpha *= A(3);
        ctx.fillStyle = 'rgba(70,110,150,0.9)'; ctx.fillRect(PX, 520, PW, 90);
        ctx.strokeStyle = '#8a9aa8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(110, 480); ctx.quadraticCurveTo(460, 250, 810, 480); ctx.stroke();
        ctx.lineWidth = 2.5; ctx.beginPath();
        for (let i = 0; i <= 14; i++) { const q = i / 14; const x = 110 + q * 700; const y = 480 - 4 * q * (1 - q) * 115; ctx.moveTo(x, 480); ctx.lineTo(x, y); if (i < 14) { const x2 = 110 + ((i + 1) / 14) * 700; const y2 = 480 - 4 * ((i + 1) / 14) * (1 - (i + 1) / 14) * 115; ctx.moveTo(x, 480); ctx.lineTo(x2, y2); } }
        ctx.stroke(); ctx.fillStyle = '#6a7a88'; ctx.fillRect(100, 480, 720, 10); ctx.fillRect(130, 490, 14, 120); ctx.fillRect(776, 490, 14, 120);
        for (let i = 0; i < 12; i++) { const x = 120 + mod(S.lt * 26 + i * 58, 690); person(ctx, x, 480, 48, SIL, { walk: k * 4 + i, face: 1, arms: i % 4 === 0 ? 'hold' : 'down' }); if (i % 4 === 0) { line(ctx, x + 10, 446, x + 10, 412, '#c8a46a', 2); flag(ctx, x + 10, 412, 24, 14, ['#b22234', '#f2f2f2', '#b22234', '#f2f2f2'], false, k * 3 + i); } }
        label(ctx, 'Edmund Pettus Bridge, Selma, Alabama', 460, 212, { size: 19, weight: 700, fill: '#14203a' });
        ctx.restore();
      }
      if (A(4)) {
        ctx.save(); ctx.globalAlpha *= A(4);
        ctx.fillStyle = '#e8eef6'; ctx.fillRect(400, 390, 120, 110); ctx.strokeStyle = '#2a3a6a'; ctx.lineWidth = 3; ctx.strokeRect(400, 390, 120, 110);
        ctx.fillStyle = '#2a3a6a'; ctx.fillRect(430, 386, 60, 8);
        label(ctx, 'VOTE', 460, 450, { size: 28, weight: 800, fill: '#2a3a6a' });
        const q = mod(S.lt * 0.8, 1); ctx.fillStyle = '#f8f8f0'; ctx.fillRect(448, lerp(320, 384, smooth(q)), 24, 30);
        for (let i = 0; i < 6; i++) { const x = 140 + i * 40 + Math.min(1, mod(S.lt * 0.8, 1)) * 18; person(ctx, x, 560, 56, SIL, { face: 1, walk: k * 2 + i, hat: i % 3 === 1 }); }
        for (let i = 0; i < 4; i++) person(ctx, 640 + i * 46, 560, 56, '#3a6a4a', { face: 1, arms: i % 2 ? 'raise' : 'down' });
        mark(ctx, 709, 410, true, 22);
        label(ctx, 'Registered to vote', 709, 452, { size: 18, weight: 700, fill: '#1a4a2a' });
        ctx.restore();
      }
      endBox(ctx, PX, PY, PW, 432);
      // Timeline.
      const xs = [130, 295, 460, 625, 790]; const yrs = ['1955–56', '1963', '1964', 'Mar 1965', 'Aug 1965'];
      line(ctx, xs[0], 652, xs[4], 652, 'rgba(200,215,255,0.45)', 3);
      line(ctx, xs[0], 652, xs[S.i], 652, 'yellow', 4);
      xs.forEach((x, i) => { if (i === S.i) ping(ctx, x, 652, k, 'yellow', 6); else dot(ctx, x, 652, 5, i < S.i ? 'yellow' : 'rgba(200,215,255,0.6)'); label(ctx, yrs[i], x, 686, { size: 18, weight: i === S.i ? 800 : 600, fill: i === S.i ? 'yellow' : 'muted' }); });
      caption(ctx, S);
      ctx.restore();
    },

    // Places light up on a world map as women win the vote, year by year,
    // and fill a list below; each with a note on who was still left out.
    'votes-for-women'(b, ctx, it, t) {
      const E = [
        [1893, 'New Zealand', 174, -41, 'The first country where all women could vote'],
        [1902, 'Australia', 134, -25, 'But most Aboriginal women had to wait until 1962'],
        [1906, 'Finland', 26, 63, 'The first in Europe; women could stand for parliament too'],
        [1913, 'Norway', 9, 61, 'After decades of campaigning'],
        [1917, 'Russia', 40, 56, 'Granted during the revolution of 1917'],
        [1918, 'UK (over 30)', -2, 53, 'Only women over 30 who met property rules'],
        [1918, 'Germany', 10, 51, 'In the new republic after the First World War'],
        [1920, 'USA', -98, 39, 'The 19th Amendment; many Black women were blocked until 1965'],
        [1928, 'UK (equal)', -2, 53, 'Women voted on equal terms with men, from age 21'],
        [1932, 'Brazil', -50, -12, 'One of the first in South America'],
        [1934, 'Turkey', 33, 39, 'In national elections'],
        [1944, 'France', 2, 47, 'Women first voted in 1945'],
        [1945, 'Japan', 138, 36, 'In the new post-war constitution'],
        [1950, 'India', 79, 22, 'Every adult could vote under the new constitution'],
        [1971, 'Switzerland', 8, 47, 'In national elections'],
        [2015, 'Saudi Arabia', 45, 24, 'In local council elections'],
      ];
      const SD = 1.45; const HOLD = 4.5; const total = E.length * SD + HOLD;
      const u = cycle(t, total, 0.5); const n = Math.min(E.length, Math.floor(u / SD) + 1); const j = n - 1; const lt = u - j * SD;
      const final = u >= E.length * SD; const k = b.clock;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'Votes for women');
      const R = { x: PX + 4, y: 186, w: PW - 8, h: 260, lon0: -170, lon1: 180, lat0: -50, lat1: 75 };
      world(ctx, R);
      for (let i = 0; i < n; i++) {
        const [, , lon, lat] = E[i]; const p = proj(R, lon, lat);
        if (i === j && !final) ping(ctx, p.x, p.y, k, 'purple', 7); else dot(ctx, p.x, p.y, 6, 'purple', final ? 6 : 0);
      }
      // The list.
      for (let i = 0; i < n; i++) {
        const col = i % 4; const row = Math.floor(i / 4); const x = 92 + col * 196; const y = 482 + row * 38;
        const a = i === j && !final ? smooth(lt / 0.3) : 1; ctx.save(); ctx.globalAlpha *= a;
        label(ctx, String(E[i][0]), x, y, { size: 19, weight: 800, fill: i === j && !final ? 'yellow' : 'purple', align: 'left' });
        label(ctx, E[i][1], x + 54, y, { size: 18, weight: 600, fill: 'ink', align: 'left' });
        ctx.restore();
      }
      // The current one.
      ctx.save();
      if (!final) {
        ctx.globalAlpha *= fadeIO(lt, SD, 0.2);
        label(ctx, `${E[j][0]} · ${E[j][1]}`, cx, 660, { size: 28, weight: 800, fill: 'yellow' });
        chip(ctx, E[j][4], cx, Y1 - 58, 'purple', 19);
      } else {
        ctx.globalAlpha *= fadeIO(u - E.length * SD, HOLD, 0.4);
        label(ctx, 'Won by decades of campaigning', cx, 660, { size: 28, weight: 800, fill: 'yellow' });
        chip(ctx, 'Petitions, marches and protest by suffragists and suffragettes', cx, Y1 - 58, 'purple', 19);
      }
      ctx.restore();
      label(ctx, 'When women won the vote: national elections, with exceptions noted', cx, Y1 - 19, { size: 18, weight: 500, fill: 'muted' });
      ctx.restore();
    },

    // Gandhi's Salt March to the sea, the Quit India rally, the flag rising
    // at midnight in 1947, partition told with care on a map, and the
    // republic's constitution in 1950.
    'indian-independence'(b, ctx, it, t) {
      const S = stages(t, [
        [5.5, '12 March 1930: Gandhi begins the Salt March', 'orange', '385 km on foot, from Sabarmati Ashram to the sea at Dandi'],
        [4, '6 April 1930: he picks up salt, breaking the salt law', 'yellow', 'Peaceful protest: more than 60,000 people were arrested'],
        [4.5, '8 August 1942: the Quit India movement', 'red', 'Gandhi\'s call, "Do or die"; leaders were jailed the next day'],
        [4.5, '15 August 1947: India becomes independent', 'green', 'Jawaharlal Nehru becomes the first prime minister'],
        [6, 'Partition: British India splits into India and Pakistan', 'muted', 'About 15 million people were uprooted, and many lives lost'],
        [4, '26 January 1950: India becomes a republic', 'blue', 'Its constitution gives every adult the vote'],
      ]);
      const k = b.clock; const A = (j) => S.on(j, 0.45); const GY = 610;
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || "India's road to independence");
      const dark = A(3) ? 1 : 0;
      sceneBox(ctx, [[0, '#f0b070'], [0.78, '#f6d6a0'], [0.79, '#b88a5a'], [1, '#8a643a']]);
      // The Salt March and the salt.
      const aM = Math.max(A(0), A(1));
      if (aM) {
        ctx.save(); ctx.globalAlpha *= aM;
        ctx.fillStyle = '#d8b07a'; ctx.fillRect(PX, GY, PW, 34);
        ctx.fillStyle = '#3a7ab0'; ctx.beginPath(); ctx.moveTo(720, GY - 4); for (let y = GY - 4; y <= PB; y += 10) ctx.lineTo(712 + Math.sin(y * 0.1 + k * 2) * 4, y); ctx.lineTo(850, PB); ctx.lineTo(850, GY - 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8a5a34'; ctx.fillRect(96, 548, 76, 62); poly(ctx, [88, 548, 134, 518, 180, 548], true); ctx.fill();
        label(ctx, 'Sabarmati Ashram', 162, 494, { size: 18, weight: 700, fill: '#3a1d08' });
        label(ctx, 'Dandi', 786, 560, { size: 19, weight: 800, fill: '#0e2a4a' });
        const q = S.i === 0 ? smooth(S.lt / 4.8) : 1; const lead = S.i === 0 ? lerp(230, 680, q) : 690;
        const nF = S.i === 0 ? 5 + Math.floor(q * 15) : 20;
        for (let i = nF; i >= 1; i--) { const x = lead - 30 - i * 26; if (x < 190) continue; person(ctx, x, GY + 14 + (i % 2) * 6, 58, '#f4efe2', { robe: true, walk: S.i === 0 ? k * 4 + i : undefined, col: i % 3 ? '#f4efe2' : '#e8e0cc', arms: S.i === 1 && i % 3 === 0 ? 'raise' : 'down' }); }
        const bend = S.i === 1 ? Math.sin(clamp(S.lt / 1.6) * Math.PI) : 0;
        person(ctx, lead, GY + 14, 64, '#ffffff', { robe: true, staff: S.i === 0 || S.lt > 1.6, walk: S.i === 0 ? k * 4 : undefined, lean: bend * 0.5, arms: S.i === 1 && S.lt > 1.6 ? 'raise' : 'hold', col: '#fbf8f0' });
        if (S.i === 1 && S.lt > 1.6) for (let i = 0; i < 6; i++) dot(ctx, lead + 9 + Math.cos(i + k * 3) * 6, GY + 14 - 76 + Math.sin(i * 2 + k * 3) * 5, 2.5, '#ffffff', 6);
        chip(ctx, S.i === 0 ? `Day ${1 + Math.floor(q * 23)} · ${Math.round(385 * q)} km` : 'Dandi, 6 April 1930', 700, 214, 'orange', 19);
        ctx.restore();
      }
      // Quit India.
      if (A(2)) {
        ctx.save(); ctx.globalAlpha *= A(2);
        ctx.fillStyle = '#d8b07a'; ctx.fillRect(PX, GY, PW, 120);
        let id = 0;
        for (let r = 0; r < 3; r++) for (let x = PX + 20 + r * 14; x < PX + PW; x += 30) { id++; person(ctx, x, 560 + r * 34, 54 + r * 4, ['#f4efe2', '#e8dcc0', '#fbf6ea'][id % 3], { robe: id % 2 === 0, arms: (id + Math.floor(k)) % 5 === 0 ? 'raise' : 'down', col: ['#f4efe2', '#e8dcc0', '#fbf6ea'][id % 3] }); }
        sign(ctx, 250, 446, 'QUIT INDIA', '#8a1a1a', 22, 40); sign(ctx, 640, 446, 'QUIT INDIA', '#8a1a1a', 22, 40);
        chip(ctx, 'Bombay (Mumbai), 1942', cx, 228, 'red', 20);
        ctx.restore();
      }
      // Midnight: the flag rises.
      if (A(3)) {
        ctx.save(); ctx.globalAlpha *= A(3) * dark;
        const sky = ctx.createLinearGradient(0, PY, 0, PB); sky.addColorStop(0, '#0a1030'); sky.addColorStop(1, '#2a2050'); ctx.fillStyle = sky; ctx.fillRect(PX, PY, PW, PH);
        stars(ctx, PX, PY, PW, 300, 50, k);
        ctx.fillStyle = '#1a1830'; ctx.fillRect(PX, 640, PW, 90);
        const fh = smooth(S.lt / 2.6); const fy = lerp(560, 270, fh);
        line(ctx, 400, 640, 400, 262, '#d0d0d0', 4);
        flag(ctx, 401, fy, 150, 96, ['#ff9933', '#ffffff', '#138808'], false, k * 2.5);
        ctx.strokeStyle = '#000080'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(476, fy + 48, 13, 0, TAU);
        for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; ctx.moveTo(476, fy + 48); ctx.lineTo(476 + Math.cos(a) * 13, fy + 48 + Math.sin(a) * 13); }
        ctx.stroke();
        for (let i = 0; i < 22; i++) person(ctx, 90 + i * 34, 700 + (i % 2) * 6, 60, '#e8e0f0', { arms: fh > 0.95 && i % 3 === 0 ? 'up' : 'down', col: 'rgba(230,224,245,0.85)' });
        for (let i = 0; i < 3; i++) { const q = mod(k * 0.45 + i / 3, 1); const fx = 620 + i * 70; const fy2 = 260 + i * 40; for (let s = 0; s < 12; s++) { const a = (s / 12) * TAU; dot(ctx, fx + Math.cos(a) * 46 * q, fy2 + Math.sin(a) * 46 * q, 2.5 * (1 - q) + 0.1, ['#ff9933', '#ffffff', '#3ac24a'][i]); } }
        chip(ctx, 'Midnight, 14–15 August 1947', 230, 214, 'green', 19);
        ctx.restore();
      }
      // Partition, on a map.
      if (A(4)) {
        ctx.save(); ctx.globalAlpha *= A(4);
        ctx.fillStyle = 'rgba(14,20,44,0.96)'; ctx.fillRect(PX, PY, PW, PH);
        const R = { x: 196, y: 192, w: 502, h: 436, lon0: 60, lon1: 98, lat0: 5, lat1: 38 };
        ctx.fillStyle = 'rgba(52,211,153,0.28)'; ctx.strokeStyle = 'rgba(200,230,220,0.8)'; ctx.lineWidth = 1.5; shape(ctx, R, SUBCONTINENT); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(160,140,220,0.45)'; shape(ctx, R, WEST_PAK); ctx.fill(); ctx.stroke(); shape(ctx, R, EAST_PAK); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(150,150,160,0.55)'; ctx.setLineDash([4, 3]); shape(ctx, R, KASHMIR); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        const kp = proj(R, 76.5, 34.6); line(ctx, kp.x + 10, kp.y - 4, 556, 214, 'rgba(200,200,210,0.7)', 1.5);
        label(ctx, 'Kashmir: disputed', 562, 214, { size: 18, weight: 600, fill: 'muted', align: 'left' });
        const pk = proj(R, 67.5, 28.5); label(ctx, 'Pakistan', pk.x, pk.y, { size: 20, weight: 800, fill: 'purple' });
        label(ctx, '14 Aug 1947', pk.x, pk.y + 26, { size: 18, weight: 600, fill: 'ink' });
        const ip = proj(R, 78, 20); label(ctx, 'India', ip.x, ip.y, { size: 22, weight: 800, fill: 'green' });
        label(ctx, '15 Aug 1947', ip.x, ip.y + 26, { size: 18, weight: 600, fill: 'ink' });
        const ep = proj(R, 90.3, 23.8); line(ctx, ep.x + 4, ep.y + 8, 646, 452, 'rgba(200,190,240,0.7)', 1.5);
        label(ctx, 'East Pakistan', 640, 470, { size: 18, weight: 700, fill: 'purple', align: 'left' });
        label(ctx, '(now Bangladesh)', 640, 494, { size: 18, weight: 500, fill: 'muted', align: 'left' });
        const flows = [[[72.6, 31.2], [76.4, 30.4]], [[87.6, 23.2], [90.6, 24.4]]];
        for (const [p0, p1] of flows) {
          const a0 = proj(R, p0[0], p0[1]); const a1 = proj(R, p1[0], p1[1]);
          for (let i = 0; i < 6; i++) { const q = mod(k * 0.18 + i / 6, 1); const fw = i % 2 === 0; const x = fw ? lerp(a0.x, a1.x, q) : lerp(a1.x, a0.x, q); const y = (fw ? lerp(a0.y, a1.y, q) : lerp(a1.y, a0.y, q)) + (fw ? -5 : 5); dot(ctx, x, y, 3.5, fw ? '#ffd27a' : '#e8e0ff'); }
        }
        para(ctx, 'Families on both sides still remember those who were lost', 110, 690, 700, 19, 'ink', 600, 2);
        ctx.restore();
      }
      // The republic.
      if (A(5)) {
        ctx.save(); ctx.globalAlpha *= A(5);
        ctx.fillStyle = 'rgba(14,20,44,0.94)'; ctx.fillRect(PX, PY, PW, PH);
        ctx.fillStyle = '#2a3a7a'; rounded(ctx, 320, 240, 280, 360, 12); ctx.fill(); ctx.strokeStyle = '#e6c770'; ctx.lineWidth = 3; rounded(ctx, 334, 254, 252, 332, 8); ctx.stroke();
        label(ctx, 'The Constitution', 460, 330, { size: 26, weight: 800, fill: '#f6e7b8' });
        label(ctx, 'of India', 460, 366, { size: 26, weight: 800, fill: '#f6e7b8' });
        ctx.strokeStyle = '#e6c770'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(460, 452, 30, 0, TAU);
        for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU + k * 0.3; ctx.moveTo(460, 452); ctx.lineTo(460 + Math.cos(a) * 30, 452 + Math.sin(a) * 30); }
        ctx.stroke();
        label(ctx, '26 January 1950', 460, 540, { size: 20, weight: 700, fill: '#f6e7b8' });
        ctx.restore();
      }
      endBox(ctx);
      caption(ctx, S);
      ctx.restore();
    },

    // Computers light up across the map as the network grows from four
    // university machines to billions of people, with a small scene for
    // each step: "LO", the @ sign, TCP/IP, the Web, the smartphone.
    'internet-history'(b, ctx, it, t) {
      const S = stages(t, [
        [4.5, '1969: ARPANET links four university computers', 'cyan', 'The first message, "LO", crashed the system before "LOGIN"'],
        [4, '1971: Ray Tomlinson sends the first network email', 'blue', 'He chose the @ sign: name@computer'],
        [4, '1983: networks share one language, TCP/IP', 'teal', 'Many networks joined into one: the internet'],
        [4.5, '1989–91: Tim Berners-Lee invents the World Wide Web', 'purple', 'Pages joined by links, first made at CERN'],
        [4, '2007: smartphones put the internet in your pocket', 'orange', 'The iPhone, then Android phones, spread fast'],
        [4.5, 'Today: about 5.5 billion people are online', 'green', 'About two in three people on Earth (2024)'],
      ]);
      const k = b.clock;
      const R = { x: PX + 4, y: 186, w: PW - 8, h: 270, lon0: -170, lon1: 180, lat0: -50, lat1: 75 };
      const C = it._c || (it._c = (() => {
        const pts = [[-118.4, 34.1], [-122.2, 37.5], [-119.8, 34.4], [-111.9, 40.8]];
        const cand = [];
        for (let i = 0; cand.length < 170 && i < 6000; i++) {
          const lon = -150 + rnd(i * 2.3 + 1) * 320; const lat = -45 + rnd(i * 3.7 + 2) * 110;
          if (!LAND.some((P) => inPoly(lon, lat, P))) continue;
          const na = lon < -50 && lat > 15; const eu = lon > -12 && lon < 40 && lat > 35;
          cand.push([lon, lat, (na ? 0 : eu ? 1 : 2) + rnd(i + 99)]);
        }
        cand.sort((a, c) => a[2] - c[2]);
        for (const [lon, lat] of cand.slice(0, 136)) pts.push([lon, lat]);
        const xy = pts.map(([lon, lat]) => proj(R, lon, lat));
        const edges = [];
        for (let i = 1; i < xy.length; i++) {
          const ds = []; for (let j = 0; j < i; j++) ds.push([Math.hypot(xy[i].x - xy[j].x, xy[i].y - xy[j].y), j]);
          ds.sort((a, c) => a[0] - c[0]); edges.push([i, ds[0][1]]); if (i % 3 === 0 && ds[1]) edges.push([i, ds[1][1]]);
        }
        return { xy, edges };
      })());
      const counts = [4, 14, 40, 80, 112, 140];
      const prev = S.i ? counts[S.i - 1] : 0; const nVis = Math.round(lerp(prev, counts[S.i], smooth(S.lt / 2.4)));
      ctx.save(); fade(ctx, t);
      title(ctx, it.label || 'How the internet grew');
      world(ctx, R, { land: 'rgba(130,160,210,0.22)', edge: 'rgba(170,195,240,0.35)' });
      ctx.strokeStyle = 'rgba(34,211,238,0.45)'; ctx.lineWidth = 1.3; ctx.beginPath();
      for (const [i, j] of C.edges) { if (i >= nVis) continue; ctx.moveTo(C.xy[i].x, C.xy[i].y); ctx.lineTo(C.xy[j].x, C.xy[j].y); }
      ctx.stroke();
      C.edges.forEach(([i, j], e) => { if (i >= nVis || e % 4) return; const q = mod(k * 0.7 + rnd(e), 1); dot(ctx, lerp(C.xy[j].x, C.xy[i].x, q), lerp(C.xy[j].y, C.xy[i].y, q), 2.2, '#e9fbff'); });
      for (let i = 0; i < nVis; i++) dot(ctx, C.xy[i].x, C.xy[i].y, i < 4 ? 4.5 : 3, i < 4 ? '#fbbf24' : '#22d3ee');
      chip(ctx, `${nVis < 140 ? nVis : 'Billions of'} ${nVis === 140 ? 'devices' : 'computers shown'}`, 742, 432, 'cyan', 18);
      // A small scene for each step.
      panel(ctx, PX, 470, PW, 168, 'blue', 0.06, 14);
      const A = (j) => S.on(j, 0.4);
      if (A(0)) {
        ctx.save(); ctx.globalAlpha *= A(0);
        const N = { UCLA: [150, 600], UCSB: [310, 600], SRI: [230, 510], Utah: [400, 510] };
        for (const [a, c] of [['UCLA', 'SRI'], ['UCLA', 'UCSB'], ['SRI', 'UCSB'], ['SRI', 'Utah']]) line(ctx, N[a][0], N[a][1], N[c][0], N[c][1], 'rgba(34,211,238,0.7)', 3);
        for (const [nm, [x, y]] of Object.entries(N)) { panel(ctx, x - 40, y - 18, 80, 36, 'cyan', 0.2, 8); label(ctx, nm, x, y + 1, { size: 18, weight: 700, fill: 'ink' }); }
        const q = clamp((S.lt - 0.5) / 1.4); if (q > 0 && q < 1) { label(ctx, 'LO', lerp(150, 230, q), lerp(600, 510, q) - 4, { size: 20, weight: 800, fill: 'yellow' }); }
        ctx.fillStyle = '#05070f'; rounded(ctx, 500, 488, 320, 132, 10); ctx.fill();
        label(ctx, '> L', 520, 520, { size: 22, weight: 700, fill: '#4ade80', align: 'left' });
        if (S.lt > 1.2) label(ctx, '> LO', 520, 552, { size: 22, weight: 700, fill: '#4ade80', align: 'left' });
        if (S.lt > 2.2) label(ctx, 'System crashed!', 520, 590, { size: 20, weight: 700, fill: 'red', align: 'left' });
        ctx.restore();
      }
      if (A(1)) {
        ctx.save(); ctx.globalAlpha *= A(1);
        const ex = 250 + Math.sin(k * 2) * 6;
        ctx.fillStyle = '#f2ead6'; ctx.fillRect(ex - 90, 500, 180, 110); ctx.strokeStyle = '#8a7a5a'; ctx.lineWidth = 2; ctx.strokeRect(ex - 90, 500, 180, 110);
        ctx.beginPath(); ctx.moveTo(ex - 90, 500); ctx.lineTo(ex, 560); ctx.lineTo(ex + 90, 500); ctx.stroke();
        label(ctx, '@', ex, 582, { size: 40, weight: 800, fill: '#2a4a9a' });
        label(ctx, 'name@computer', 640, 532, { size: 26, weight: 700, fill: 'blue' });
        label(ctx, 'A message from one machine', 640, 576, { size: 18, weight: 500, fill: 'muted' });
        label(ctx, 'to another, across the network', 640, 602, { size: 18, weight: 500, fill: 'muted' });
        ctx.restore();
      }
      if (A(2)) {
        ctx.save(); ctx.globalAlpha *= A(2);
        for (const [x, nm] of [[200, 'Network A'], [720, 'Network B']]) { ctx.fillStyle = tint('teal', 0.18); ctx.beginPath(); ctx.ellipse(x, 556, 110, 56, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = tint('teal', 0.7); ctx.lineWidth = 2; ctx.stroke(); label(ctx, nm, x, 556, { size: 19, weight: 700, fill: 'ink' }); }
        line(ctx, 310, 556, 610, 556, 'rgba(45,212,191,0.8)', 4);
        for (let i = 0; i < 4; i++) { const q = mod(k * 0.5 + i / 4, 1); const fw = i % 2 === 0; ctx.fillStyle = fw ? '#fbbf24' : '#e9eeff'; ctx.fillRect(lerp(fw ? 310 : 600, fw ? 600 : 310, q) - 6, 550, 12, 12); }
        chip(ctx, 'TCP/IP', 460, 520, 'teal', 20);
        ctx.restore();
      }
      if (A(3)) {
        ctx.save(); ctx.globalAlpha *= A(3);
        ctx.fillStyle = '#f2f4f8'; rounded(ctx, 160, 484, 600, 142, 10); ctx.fill();
        ctx.fillStyle = '#d0d4dc'; ctx.fillRect(160, 484, 600, 32); dot(ctx, 180, 500, 6, '#fb7185'); dot(ctx, 198, 500, 6, '#fbbf24'); dot(ctx, 216, 500, 6, '#34d399');
        label(ctx, 'http://info.cern.ch', 250, 501, { size: 18, weight: 600, fill: '#2a2a3a', align: 'left' });
        label(ctx, 'World Wide Web', 190, 546, { size: 24, weight: 800, fill: '#1a1a2a', align: 'left' });
        const hov = mod(S.lt, 2.2) > 1.2;
        label(ctx, 'hypertext links', 190, 588, { size: 20, weight: 600, fill: hov ? '#a21caf' : '#1d4ed8', align: 'left' });
        line(ctx, 190, 600, 344, 600, hov ? '#a21caf' : '#1d4ed8', 2);
        label(ctx, 'join pages together', 360, 588, { size: 20, weight: 500, fill: '#3a3a4a', align: 'left' });
        const cxp = lerp(600, 280, smooth(mod(S.lt, 2.2) / 1.2)); ctx.fillStyle = '#1a1a1a'; poly(ctx, [cxp, 584, cxp, 604, cxp + 5, 599, cxp + 9, 607, cxp + 12, 605, cxp + 8, 597, cxp + 14, 597], true); ctx.fill();
        ctx.restore();
      }
      if (A(4)) {
        ctx.save(); ctx.globalAlpha *= A(4);
        ctx.fillStyle = '#1a1a22'; rounded(ctx, 410, 482, 100, 146, 14); ctx.fill();
        ctx.fillStyle = '#2a4a8a'; rounded(ctx, 418, 496, 84, 116, 4); ctx.fill();
        for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { ctx.fillStyle = ['#fb7185', '#fbbf24', '#34d399', '#22d3ee', '#a78bfa', '#ff9f43'][(r * 3 + c) % 6]; rounded(ctx, 426 + c * 26, 504 + r * 26, 18, 18, 4); ctx.fill(); }
        for (let i = 0; i < 3; i++) { const q = mod(k * 0.7 + i / 3, 1); ctx.strokeStyle = `rgba(255,159,67,${(0.8 * (1 - q)).toFixed(3)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(510, 555, 16 + q * 34, -0.7, 0.7); ctx.stroke(); ctx.beginPath(); ctx.arc(410, 555, 16 + q * 34, Math.PI - 0.7, Math.PI + 0.7); ctx.stroke(); }
        label(ctx, 'Maps, messages,', 240, 540, { size: 20, weight: 700, fill: 'ink' }); label(ctx, 'music, video', 240, 572, { size: 20, weight: 700, fill: 'ink' });
        label(ctx, 'Anywhere,', 680, 540, { size: 20, weight: 700, fill: 'ink' }); label(ctx, 'any time', 680, 572, { size: 20, weight: 700, fill: 'ink' });
        ctx.restore();
      }
      if (A(5)) {
        ctx.save(); ctx.globalAlpha *= A(5);
        const v = 5.5 * smooth(S.lt / 2.5);
        label(ctx, `${v.toFixed(1)} billion`, 250, 540, { size: 40, weight: 800, fill: 'green' });
        label(ctx, 'people online', 250, 590, { size: 20, weight: 600, fill: 'ink' });
        for (let i = 0; i < 10; i++) { const on = i < 7 && S.lt > 0.6 + i * 0.25; person(ctx, 500 + i * 32, 600, 72, on ? '#34d399' : '#5a6478', { col: on ? '#34d399' : 'rgba(120,130,150,0.6)' }); }
        label(ctx, '7 in 10 shown', 644, 504, { size: 18, weight: 500, fill: 'muted' });
        ctx.restore();
      }
      // Timeline.
      const xs = [130, 260, 390, 520, 650, 790]; const yrs = ['1969', '1971', '1983', '1991', '2007', 'Today'];
      line(ctx, xs[0], 664, xs[5], 664, 'rgba(200,215,255,0.45)', 3); line(ctx, xs[0], 664, xs[S.i], 664, 'cyan', 4);
      xs.forEach((x, i) => { if (i === S.i) ping(ctx, x, 664, k, 'cyan', 6); else dot(ctx, x, 664, 5, i < S.i ? 'cyan' : 'rgba(200,215,255,0.6)'); label(ctx, yrs[i], x, 696, { size: 18, weight: i === S.i ? 800 : 600, fill: i === S.i ? 'cyan' : 'muted' }); });
      caption(ctx, S);
      ctx.restore();
    },
  };
}
