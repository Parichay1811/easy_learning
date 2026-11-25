/* Hand-drawn line art for the mission films (paper-and-pencil look).
 *
 * Put an element in the page and the library fills it with an SVG drawing:
 *   <div data-kid="stand" data-skin="2" data-color="sky" data-w="1" data-h="1"></div>
 *   <div data-draw="plant"></div>
 *
 * Every stroke has class "ink" and pathLength="1", so a composition draws it on with
 *   tl.fromTo(el.querySelectorAll(".ink"), { strokeDashoffset: 1 }, { strokeDashoffset: 0, ... })
 * Washes (soft colour fills) have class "wash" and fade in after the line.
 * Deterministic: no randomness, no network. Call LearnigoDrawings.fill() before building the timeline.
 */
(function () {
  const SKIN = ["#f6dcc4", "#f0c9a5", "#d9a77f", "#b07a52", "#7f5638"];
  const WASH = { sky: "#bfe1f6", leaf: "#bfe3b4", rose: "#f6c9c2", sun: "#ffd98a", lilac: "#d9cff5", peach: "#ffd2b0" };
  const P = (d, extra = "") => `<path class="ink ${extra}" pathLength="1" d="${d}"/>`;
  const C = (cx, cy, r, extra = "") => `<circle class="ink ${extra}" pathLength="1" cx="${cx}" cy="${cy}" r="${r}"/>`;
  const W = (d, color, op = 0.85) => `<path class="wash" fill="${WASH[color] || color}" opacity="${op}" d="${d}"/>`;
  const WC = (cx, cy, r, color, op = 0.85) => `<circle class="wash" fill="${WASH[color] || color}" opacity="${op}" cx="${cx}" cy="${cy}" r="${r}"/>`;

  // A child, feet at (0,0). pose: stand | up (looking up) | book | jump | wave
  function kid({ pose = "stand", skin = 1, color = "sky", w = 1, h = 1 } = {}) {
    const y = (v) => (v * h).toFixed(1);
    const x = (v) => (v * w).toFixed(1);
    const lift = pose === "jump" ? -26 : 0;
    const headY = -205 * h;
    const body = `M${x(-34)},${y(-165)} Q${x(-46)},${y(-70)} ${x(-30)},${y(-60)} L${x(30)},${y(-60)} Q${x(46)},${y(-70)} ${x(34)},${y(-165)} Q0,${y(-184)} ${x(-34)},${y(-165)} Z`;
    let legs, arms, extra = "";
    if (pose === "jump") {
      legs = P(`M${x(-12)},${y(-60)} L${x(-40)},${y(-6)}`) + P(`M${x(12)},${y(-60)} L${x(40)},${y(-6)}`);
      arms = P(`M${x(-30)},${y(-150)} L${x(-66)},${y(-235)}`) + P(`M${x(30)},${y(-150)} L${x(66)},${y(-235)}`);
    } else {
      legs = P(`M${x(-13)},${y(-60)} L${x(-15)},0`) + P(`M${x(13)},${y(-60)} L${x(15)},0`);
      if (pose === "book") {
        arms = P(`M${x(-32)},${y(-150)} Q${x(-50)},${y(-120)} ${x(-34)},${y(-104)}`) + P(`M${x(32)},${y(-150)} Q${x(50)},${y(-120)} ${x(34)},${y(-104)}`);
        extra = W(`M${x(-42)},${y(-122)} L0,${y(-112)} L${x(42)},${y(-122)} L${x(42)},${y(-92)} L0,${y(-82)} L${x(-42)},${y(-92)} Z`, "#ffffff", 1) +
          P(`M${x(-42)},${y(-122)} L0,${y(-112)} L${x(42)},${y(-122)} L${x(42)},${y(-92)} L0,${y(-82)} L${x(-42)},${y(-92)} Z M0,${y(-112)} L0,${y(-82)}`, "thin");
      } else if (pose === "wave") {
        arms = P(`M${x(-32)},${y(-150)} Q${x(-52)},${y(-110)} ${x(-46)},${y(-82)}`) + P(`M${x(30)},${y(-150)} Q${x(62)},${y(-180)} ${x(58)},${y(-222)}`);
      } else {
        arms = P(`M${x(-32)},${y(-150)} Q${x(-52)},${y(-110)} ${x(-46)},${y(-82)}`) + P(`M${x(32)},${y(-150)} Q${x(52)},${y(-110)} ${x(46)},${y(-82)}`);
      }
    }
    const look = pose === "up" ? -9 : pose === "book" ? 5 : 0;
    const face =
      `<circle cx="-10" cy="${(headY + look).toFixed(1)}" r="3.2" fill="#2f3e66"/><circle cx="10" cy="${(headY + look).toFixed(1)}" r="3.2" fill="#2f3e66"/>` +
      P(`M-9,${(headY + 12 + look).toFixed(1)} Q0,${(headY + 19 + look).toFixed(1)} 9,${(headY + 12 + look).toFixed(1)}`, "thin");
    const hair = P(`M-29,${(headY - 8).toFixed(1)} Q-6,${(headY - 44).toFixed(1)} 29,${(headY - 10).toFixed(1)}`);
    return `<svg viewBox="-90 -270 180 290" overflow="visible" aria-hidden="true"><g transform="translate(0 ${lift})">
      ${W(body, color)}${P(body)}${legs}${arms}${extra}
      <g class="head">${WC(0, headY, 30, SKIN[skin % SKIN.length], 1)}${C(0, headY, 30)}${hair}${face}</g>
    </g></svg>`;
  }

  const DRAW = {
    sky: () =>
      WC(150, 150, 128, "sky", 0.55) + WC(95, 95, 38, "sun") + C(95, 95, 38) +
      [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const r = (a * Math.PI) / 180;
        return P(`M${(95 + Math.cos(r) * 52).toFixed(1)},${(95 + Math.sin(r) * 52).toFixed(1)} L${(95 + Math.cos(r) * 70).toFixed(1)},${(95 + Math.sin(r) * 70).toFixed(1)}`);
      }).join("") +
      W("M140,205 q0,-36 36,-36 q12,-32 48,-20 q32,-4 36,26 q26,6 20,30 Z", "#ffffff", 1) + P("M140,205 q0,-36 36,-36 q12,-32 48,-20 q32,-4 36,26 q26,6 20,30 Z"),
    plant: () =>
      WC(240, 62, 22, "sun") + C(240, 62, 22) + P("M240,24 L240,10 M274,62 L288,62 M264,36 L274,26") +
      W("M108,228 L192,228 L182,286 L118,286 Z", "rose") + P("M108,228 L192,228 L182,286 L118,286 Z") +
      P("M150,228 C150,190 144,160 150,108") +
      W("M150,172 C120,162 104,142 110,120 C136,124 149,146 150,172 Z", "leaf") + P("M150,172 C120,162 104,142 110,120 C136,124 149,146 150,172 Z") +
      W("M150,142 C180,132 196,112 190,90 C164,94 152,116 150,142 Z", "leaf") + P("M150,142 C180,132 196,112 190,90 C164,94 152,116 150,142 Z"),
    moon: () =>
      W("M176,64 A86,86 0 1,0 176,236 A64,64 0 1,1 176,64 Z", "#fff1c4", 1) + P("M176,64 A86,86 0 1,0 176,236 A64,64 0 1,1 176,64 Z") +
      P("M232,92 l0,22 M221,103 l22,0", "thin") + P("M250,190 l0,16 M242,198 l16,0", "thin") + P("M210,250 l0,14 M203,257 l14,0", "thin"),
    book: () =>
      P("M118,80 Q150,58 182,80", "thin") + P("M102,56 Q150,22 198,56", "thin") + P("M88,32 Q150,-12 212,32", "thin") +
      W("M50,206 Q150,176 150,206 Q150,176 250,206 L250,118 Q150,88 150,118 Q150,88 50,118 Z", "#ffffff", 1) +
      P("M50,206 Q150,176 150,206 Q150,176 250,206 L250,118 Q150,88 150,118 Q150,88 50,118 Z") + P("M150,118 L150,206") +
      P("M74,134 L128,124 M74,152 L128,142 M74,170 L120,161 M172,124 L226,134 M172,142 L226,152 M172,161 L218,170", "thin"),
    clock: () =>
      WC(150, 155, 86, "peach", 0.8) + C(150, 155, 86) + P("M150,155 L150,104") + P("M150,155 L190,174") +
      P("M150,46 A110,110 0 1,1 56,214", "thin") + P("M56,214 L50,192 M56,214 L76,206", "thin"),
    star: () =>
      W("M150,30 L166,78 L216,78 L176,108 L191,156 L150,127 L109,156 L124,108 L84,78 L134,78 Z", "sun") +
      P("M150,30 L166,78 L216,78 L176,108 L191,156 L150,127 L109,156 L124,108 L84,78 L134,78 Z"),
    water: () =>
      W("M114,130 L126,262 L174,262 L186,130 Q150,140 114,130 Z", "sky") +
      P("M108,90 L124,264 L176,264 L192,90") + P("M114,132 Q150,144 186,132", "thin") +
      W("M150,22 C128,54 128,72 150,78 C172,72 172,54 150,22 Z", "sky") + P("M150,22 C128,54 128,72 150,78 C172,72 172,54 150,22 Z"),
    kite: () =>
      W("M150,36 L204,108 L150,196 L96,108 Z", "rose") + P("M150,36 L204,108 L150,196 L96,108 Z") + P("M150,36 L150,196 M96,108 L204,108", "thin") +
      P("M150,196 C126,224 176,244 140,286", "thin") + P("M140,222 l-12,-8 l4,16 Z M154,252 l12,-8 l-2,16 Z", "thin"),
    house: () =>
      W("M76,172 L150,110 L224,172 L224,262 L76,262 Z", "peach", 0.7) + P("M76,172 L150,110 L224,172 L224,262 L76,262 Z") +
      W("M128,182 h44 v40 h-44 Z", "sun", 1) + P("M128,182 h44 v40 h-44 Z M150,182 v40 M128,202 h44", "thin") +
      P("M98,262 v-44 h26 v44", "thin") + P("M190,128 v-26 h18 v40", "thin"),
    globe: () =>
      WC(150, 150, 96, "sky", 0.7) + C(150, 150, 96) +
      `<ellipse class="ink thin" pathLength="1" cx="150" cy="150" rx="44" ry="96"/>` +
      P("M54,150 L246,150 M68,104 Q150,124 232,104 M68,196 Q150,176 232,196", "thin") +
      W("M110,92 q20,-14 36,4 q10,22 -14,30 q-20,4 -22,-34 Z M168,170 q24,-6 30,14 q-4,24 -26,22 q-14,-14 -4,-36 Z", "leaf", 0.9),
    hill: () =>
      W("M0,300 C120,200 330,180 600,230 C800,268 960,210 1200,240 L1200,320 L0,320 Z", "leaf", 0.8) +
      P("M0,300 C120,200 330,180 600,230 C800,268 960,210 1200,240"),
    door: () =>
      P("M20,300 L580,300") + P("M60,300 L60,40 L540,40 L540,300", "thin") +
      P("M60,100 L540,100 M60,160 L540,160 M60,220 L540,220 M180,40 L180,100 M360,40 L360,100 M120,100 L120,160 M300,100 L300,160 M480,100 L480,160 M200,160 L200,220 M420,160 L420,220", "thin") +
      W("M250,300 L250,130 L350,130 L350,300 Z", "#fff6e2", 1) + P("M250,300 L250,130 L350,130 L350,300 Z", "thick"),
    sofa: () =>
      W("M40,190 Q40,150 80,150 L320,150 Q360,150 360,190 L360,250 L40,250 Z", "lilac") +
      P("M40,190 Q40,150 80,150 L320,150 Q360,150 360,190 L360,250 L40,250 Z") +
      P("M40,200 Q20,200 20,220 L20,262 L380,262 L380,220 Q380,200 360,200", "thin") + P("M60,262 v20 M340,262 v20", "thin"),
    lamp: () =>
      WC(110, 120, 120, "sun", 0.35) + W("M70,60 L150,60 L170,120 L50,120 Z", "sun", 1) +
      P("M70,60 L150,60 L170,120 L50,120 Z") + P("M110,120 L110,300 M80,300 L140,300"),
    window: () =>
      W("M30,30 h220 v260 h-220 Z", "#2a3560", 1) + P("M30,30 h220 v260 h-220 Z M140,30 v260 M30,160 h220", "thin") +
      W("M196,64 A30,30 0 1,0 196,124 A22,22 0 1,1 196,64 Z", "#fff1c4", 1) +
      `<circle cx="70" cy="80" r="3" fill="#fff1c4"/><circle cx="100" cy="200" r="2.5" fill="#fff1c4"/><circle cx="210" cy="230" r="3" fill="#fff1c4"/>`,
    sprout: () =>
      W("M110,230 L190,230 L182,286 L118,286 Z", "rose") + P("M110,230 L190,230 L182,286 L118,286 Z") +
      P("M150,230 C150,214 150,204 150,190", "s1") +
      W("M150,206 C134,200 126,190 130,178 C144,180 150,192 150,206 Z", "leaf") + P("M150,206 C134,200 126,190 130,178 C144,180 150,192 150,206 Z", "s1") +
      P("M150,190 C150,160 152,130 150,100", "s2") +
      W("M150,150 C176,142 188,124 182,104 C160,108 152,128 150,150 Z", "leaf") + P("M150,150 C176,142 188,124 182,104 C160,108 152,128 150,150 Z", "s2") +
      P("M150,100 C150,80 150,64 150,50", "s3") +
      W("M150,120 C124,112 112,94 118,74 C140,78 150,98 150,120 Z", "leaf") + P("M150,120 C124,112 112,94 118,74 C140,78 150,98 150,120 Z", "s3") +
      W("M150,50 c-14,-14 -14,-30 0,-34 c14,4 14,20 0,34 Z", "rose") + P("M150,50 c-14,-14 -14,-30 0,-34 c14,4 14,20 0,34 Z", "s3"),
  };
  const VIEW = { hill: "0 150 1200 170", door: "0 0 600 320", sofa: "0 120 400 180", lamp: "0 0 230 310", window: "0 0 280 320" };

  function fill(root = document) {
    root.querySelectorAll("[data-kid]").forEach((el) => {
      el.innerHTML = kid({
        pose: el.dataset.kid,
        skin: Number(el.dataset.skin || 1),
        color: el.dataset.color || "sky",
        w: Number(el.dataset.w || 1),
        h: Number(el.dataset.h || 1),
      });
    });
    root.querySelectorAll("[data-draw]").forEach((el) => {
      const name = el.dataset.draw;
      el.innerHTML = `<svg viewBox="${VIEW[name] || "0 0 300 300"}" overflow="visible" aria-hidden="true">${DRAW[name]()}</svg>`;
    });
  }
  window.LearnigoDrawings = { fill, kid };
})();
