// Illustrated emblems for the entry screens: one round "medallion" per kind of
// player, drawn so a child (or a busy grown-up) knows at a glance which door
// is theirs. Flat, soft shapes in the meadow palette; decorative (the card
// next to it carries the words), so they are hidden from screen readers.
import { useId } from "react";

const SKIN = "#f9d0a8";
const SKIN2 = "#e9b48a";
const INK = "#2b2b3a";

function Medallion({ bg, children, size, className }) {
  const raw = useId();
  const clip = `m${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="60" cy="60" r="57" />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="58" fill={bg} />
      <g clipPath={`url(#${clip})`}>
        <ellipse cx="42" cy="30" rx="34" ry="20" fill="#fff" opacity="0.38" />
        {children}
      </g>
      <circle cx="60" cy="60" r="56.5" fill="none" stroke="#fff" strokeWidth="3" opacity="0.9" />
    </svg>
  );
}

const Face = ({ cx, cy, s = 1 }) => (
  <g>
    <circle cx={cx - 5.5 * s} cy={cy} r={2.1 * s} fill={INK} />
    <circle cx={cx + 5.5 * s} cy={cy} r={2.1 * s} fill={INK} />
    <circle cx={cx - 5.3 * s} cy={cy - 0.7 * s} r={0.7 * s} fill="#fff" />
    <circle cx={cx + 5.7 * s} cy={cy - 0.7 * s} r={0.7 * s} fill="#fff" />
    <circle cx={cx - 9 * s} cy={cy + 5 * s} r={2.8 * s} fill="#ff8fa3" opacity="0.55" />
    <circle cx={cx + 9 * s} cy={cy + 5 * s} r={2.8 * s} fill="#ff8fa3" opacity="0.55" />
    <path
      d={`M${cx - 4.5 * s} ${cy + 5 * s} Q${cx} ${cy + 9.5 * s} ${cx + 4.5 * s} ${cy + 5 * s}`}
      stroke={INK}
      strokeWidth={1.9 * s}
      fill="none"
      strokeLinecap="round"
    />
  </g>
);

/** A child with a backpack, holding an open book. */
export function StudentEmblem({ size = 96, className }) {
  return (
    <Medallion bg="#cfe8ff" size={size} className={className}>
      <ellipse cx="60" cy="112" rx="36" ry="8" fill="#9fd0ff" />
      {/* backpack behind the shoulders */}
      <rect x="31" y="64" width="58" height="44" rx="14" fill="#1c7ed6" />
      <rect x="35" y="68" width="10" height="20" rx="5" fill="#4dabf7" />
      {/* t-shirt */}
      <path d="M41 78 Q41 66 53 65 L67 65 Q79 66 79 78 L79 112 L41 112 Z" fill="#ff8a3d" />
      <path d="M53 65 Q60 71 67 65" fill={SKIN} />
      {/* straps */}
      <rect x="45" y="66" width="5.5" height="26" rx="2.5" fill="#1864ab" />
      <rect x="69.5" y="66" width="5.5" height="26" rx="2.5" fill="#1864ab" />
      {/* open book */}
      <path d="M38 85 Q49 79 60 84 Q71 79 82 85 L82 104 Q71 99 60 104 Q49 99 38 104 Z" fill="#2f9e44" />
      <path d="M41 85 Q50 81 59 85 L59 101 Q50 97 41 101 Z" fill="#fff" />
      <path d="M61 85 Q70 81 79 85 L79 101 Q70 97 61 101 Z" fill="#f1f3f5" />
      <path d="M45 89 Q50 87 55 89 M45 93 Q50 91 55 93 M65 89 Q70 87 75 89 M65 93 Q70 91 75 93" stroke="#adb5bd" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="39" cy="96" r="4.2" fill={SKIN} />
      <circle cx="81" cy="96" r="4.2" fill={SKIN} />
      {/* head */}
      <circle cx="42" cy="47" r="4" fill={SKIN} />
      <circle cx="78" cy="47" r="4" fill={SKIN} />
      <circle cx="60" cy="45" r="18" fill={SKIN} />
      <path d="M42 44 Q41 25 60 25 Q79 25 78 44 Q72 35 63 36 Q58 31 54 36 Q47 36 42 44 Z" fill="#6b3f22" />
      <path d="M57 26 Q59 19 66 21" stroke="#6b3f22" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <Face cx={60} cy={47} />
    </Medallion>
  );
}

/** A grown-up and a child holding hands, with a heart above them. */
export function ParentEmblem({ size = 96, className }) {
  return (
    <Medallion bg="#ffdce9" size={size} className={className}>
      <ellipse cx="60" cy="112" rx="40" ry="8" fill="#ffbcd3" />
      {/* heart */}
      <path d="M60 36 C49 29 46 19 53 16.5 C56.5 15.5 59 17.5 60 20 C61 17.5 63.5 15.5 67 16.5 C74 19 71 29 60 36 Z" fill="#f03e7a" />
      <ellipse cx="54.5" cy="21" rx="2.4" ry="1.6" fill="#fff" opacity="0.7" />
      {/* grown-up */}
      <path d="M29 112 L32 70 Q33 60 43 60 Q53 60 54 70 L57 112 Z" fill="#8b5cf6" />
      <path d="M31 58 Q29 34 43 34 Q57 34 55 58 Z" fill="#8a4b2a" />
      <circle cx="43" cy="49" r="11.5" fill={SKIN2} />
      <path d="M31.5 47 Q33 35 45 36 Q53 37 55 46 Q46 41 31.5 47 Z" fill="#8a4b2a" />
      <Face cx={43} cy={50} s={0.85} />
      {/* joined arms */}
      <path d="M52 70 Q58 80 63 84" stroke="#7048e8" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M74 80 Q69 84 65 85" stroke="#f59f00" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="64" cy="85" r="4" fill={SKIN} />
      {/* child */}
      <path d="M67 112 L68.5 82 Q69 75 76.5 75 Q84 75 84.5 82 L86 112 Z" fill="#fcc419" />
      <circle cx="76.5" cy="64" r="10" fill={SKIN} />
      <path d="M66.5 63 Q66 52 76.5 52 Q87 52 86.5 63 Q81 57 76 58.5 Q71 57 66.5 63 Z" fill="#3b2a1a" />
      <circle cx="66" cy="56" r="3.6" fill="#3b2a1a" />
      <circle cx="87" cy="56" r="3.6" fill="#3b2a1a" />
      <Face cx={76.5} cy={65} s={0.72} />
    </Medallion>
  );
}

/** A teacher pointing at a chalkboard with "ABC" on it. */
export function TeacherEmblem({ size = 96, className }) {
  return (
    <Medallion bg="#d3f5da" size={size} className={className}>
      <ellipse cx="60" cy="112" rx="40" ry="8" fill="#a9e5b5" />
      {/* board */}
      <rect x="13" y="27" width="66" height="47" rx="6" fill="#c98a4b" />
      <rect x="17.5" y="31.5" width="57" height="38" rx="3.5" fill="#2f6b4f" />
      <path d="M24 61 L28.5 43 L33 61 M25.8 54.5 L31.2 54.5" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 43 L38 61 M38 43 Q46 43 46 47.2 Q46 51.5 38 51.5 Q47 51.5 47 56.2 Q47 61 38 61" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M60 45.5 Q57.5 42.5 54.5 44 Q51 46 51.5 52.5 Q52 59.5 56 60.5 Q58.5 61 60.5 58.5" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M67 37 l1.6 3.3 3.6 .5 -2.6 2.5 .6 3.6 -3.2 -1.7 -3.2 1.7 .6 -3.6 -2.6 -2.5 3.6 -.5 Z" fill="#ffe066" />
      <rect x="20" y="70" width="52" height="4" rx="2" fill="#a86b32" />
      <rect x="27" y="68.5" width="7" height="2.5" rx="1.2" fill="#fff" />
      {/* teacher */}
      <path d="M74 114 L76 84 Q77 74 88 74 Q99 74 100 84 L102 114 Z" fill="#339af0" />
      <path d="M84 75 L88 82 L92 75 Z" fill="#fff" />
      <path d="M79 84 Q72 74 66 64" stroke="#1c7ed6" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="65.5" cy="63" r="3.8" fill={SKIN2} />
      <path d="M63 61 L50 47" stroke="#8a5a00" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="88" cy="61" r="11.5" fill={SKIN2} />
      <circle cx="92" cy="45.5" r="5.5" fill="#4a2c17" />
      <path d="M76.5 60 Q76 48 88 48 Q100 48 99.5 60 Q94 53 88 54 Q81 53 76.5 60 Z" fill="#4a2c17" />
      <Face cx={88} cy={62} s={0.82} />
      <circle cx="83.5" cy="62" r="3.4" fill="none" stroke={INK} strokeWidth="1.2" />
      <circle cx="92.5" cy="62" r="3.4" fill="none" stroke={INK} strokeWidth="1.2" />
      <path d="M86.9 61.6 L89.1 61.6" stroke={INK} strokeWidth="1.2" />
    </Medallion>
  );
}

/** A school building with a clock tower and a flag. */
export function SchoolEmblem({ size = 96, className }) {
  return (
    <Medallion bg="#ffe3c7" size={size} className={className}>
      <ellipse cx="60" cy="110" rx="58" ry="14" fill="#8ce99a" />
      {/* flag */}
      <path d="M60 18 L60 5" stroke="#868e96" strokeWidth="2" strokeLinecap="round" />
      <path d="M60 5.5 L73 9.5 L60 13.5 Z" fill="#40c057" />
      {/* tower */}
      <rect x="49" y="28" width="22" height="24" fill="#fff4e6" />
      <path d="M45 31 L60 17 L75 31 Z" fill="#e8590c" />
      <circle cx="60" cy="40" r="6.2" fill="#fff" stroke="#e8590c" strokeWidth="2" />
      <path d="M60 36.5 L60 40 L62.6 41.6" stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* roof + walls */}
      <path d="M20 58 L38 44 L82 44 L100 58 Z" fill="#f76707" />
      <rect x="25" y="57" width="70" height="44" fill="#fff4e6" />
      <rect x="25" y="57" width="70" height="4" fill="#ffd8a8" />
      {/* windows */}
      {[[31, 65], [77, 65], [31, 82], [77, 82]].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="12" height="11" rx="2" fill="#74c0fc" stroke="#fff" strokeWidth="2" />
          <path d={`M${x + 6} ${y} L${x + 6} ${y + 11}`} stroke="#fff" strokeWidth="1.6" />
        </g>
      ))}
      {/* door */}
      <path d="M51 101 L51 79 Q60 70 69 79 L69 101 Z" fill="#1864ab" />
      <circle cx="65" cy="91" r="1.4" fill="#ffe066" />
      <rect x="47" y="100" width="26" height="4" rx="1.5" fill="#ced4da" />
      {/* bushes */}
      <circle cx="22" cy="100" r="7" fill="#51cf66" />
      <circle cx="98" cy="100" r="7" fill="#51cf66" />
    </Medallion>
  );
}

/** The Learnigo team: a globe with a golden key. */
export function TeamEmblem({ size = 96, className }) {
  return (
    <Medallion bg="#e5dbff" size={size} className={className}>
      <circle cx="55" cy="55" r="31" fill="#4dabf7" />
      <path d="M36 42 Q44 32 54 37 Q59 44 52 49 Q49 56 42 54 Q34 50 36 42 Z" fill="#69db7c" />
      <path d="M60 62 Q69 57 76 64 Q78 73 69 77 Q62 79 60 72 Z" fill="#69db7c" />
      <path d="M62 32 Q68 30 72 36 Q68 40 63 37 Z" fill="#69db7c" />
      <ellipse cx="55" cy="55" rx="13" ry="31" fill="none" stroke="#fff" strokeWidth="1.6" opacity="0.6" />
      <path d="M24 55 L86 55 M28 40 L82 40 M28 70 L82 70" stroke="#fff" strokeWidth="1.6" opacity="0.5" />
      <ellipse cx="44" cy="38" rx="9" ry="5" fill="#fff" opacity="0.35" transform="rotate(-30 44 38)" />
      {/* key */}
      <path d="M78 86 L60 104" stroke="#f08c00" strokeWidth="7.5" strokeLinecap="round" />
      <path d="M78 86 L60 104" stroke="#fcc419" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M65 99 L70 104 M69.5 94.5 L73.5 98.5" stroke="#f08c00" strokeWidth="4" strokeLinecap="round" />
      <circle cx="85" cy="79" r="10" fill="#fcc419" stroke="#f08c00" strokeWidth="2.5" />
      <circle cx="85" cy="79" r="3.6" fill="#e5dbff" />
    </Medallion>
  );
}

/** Private tutoring: an apple on a stack of books. */
export function TutorEmblem({ size = 96, className }) {
  return (
    <Medallion bg="#c9f5e5" size={size} className={className}>
      <ellipse cx="60" cy="104" rx="40" ry="8" fill="#96f2d7" />
      <rect x="28" y="84" width="64" height="14" rx="4" fill="#339af0" />
      <rect x="31" y="87" width="58" height="3" rx="1.5" fill="#fff" opacity="0.8" />
      <rect x="34" y="70" width="54" height="14" rx="4" fill="#f06595" />
      <rect x="37" y="73" width="48" height="3" rx="1.5" fill="#fff" opacity="0.8" />
      <path d="M60 46 C50 38 36 44 39 58 C41 68 52 72 60 67 C68 72 79 68 81 58 C84 44 70 38 60 46 Z" fill="#fa5252" />
      <ellipse cx="49" cy="52" rx="4" ry="6" fill="#fff" opacity="0.35" transform="rotate(25 49 52)" />
      <path d="M60 46 Q59 38 63 32" stroke="#8a5a00" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M62 37 Q70 28 79 32 Q72 41 62 37 Z" fill="#40c057" />
    </Medallion>
  );
}
