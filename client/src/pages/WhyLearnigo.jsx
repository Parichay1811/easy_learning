import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "../components/SEO/SEO";
import ExploreLinks from "../components/SEO/ExploreLinks";
import CueStrip from "../components/QuestionCard/CueStrip";
import Mascot from "../components/Mascot/Mascot";
import { useSeo } from "../seo/useSeo";
import { LANGUAGES } from "../seo/registry";
import { usePrefsState } from "../components/settings/usePrefs";
import { narrate, onNarration, stopNarration } from "../utils/narrator";
import { sfx } from "../utils/sounds";
import styles from "./WhyLearnigo.module.css";

const PATH = "/about-us/why-learnigo";
const PROFILE_ICONS = { reading: "📖", focus: "🎯", literal: "🧩", language: "💬", numbers: "🔢", movement: "🤸", newLanguage: "🌍", adults: "🧑‍🎓" };
const AUDIENCE_ICONS = { learner: "🧒", parent: "👪", teacher: "🧑‍🏫", school: "🏫" };
const REGIONS = ["ie", "uk", "us", "eu", "adult"];
const SUBJECTS = ["english", "maths", "science"];
const fill = (text, values = {}) => String(text || "").replace(/\{\{(\w+)\}\}/g, (_, k) => values[k] ?? "");

/**
 * "Why Learnigo" (About Us): who Learnigo is for, every feature by audience, how a question is
 * built (a live example with the action strip), the curriculum map (loaded on demand), fair play
 * and prizes, the comfort settings to try, safety, languages, and what we do not claim.
 * Every claim on this page is true of the product today (docs/learning/TEACHING-STANDARDS.md,
 * docs/learning/STANDARDS.md). The words are in seo.json (pages[PATH] and why.*), 14 languages.
 */
export default function WhyLearnigo() {
  const { seo, lang } = useSeo();
  const page = seo.pages?.[PATH] || {};
  const w = seo.why || {};
  return (
    <main className={styles.page}>
      <SEO path={PATH} />
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.eyebrow}>{w.eyebrow}</span>
          <h1>{page.h1}</h1>
          <p className={styles.lead}>{page.lead}</p>
          <div className={styles.ctas}>
            <Link to="/home" className={styles.primary}>{w.ctaStart}</Link>
            <Link to="/contact-us" className={styles.ghost}>{w.ctaTalk}</Link>
          </div>
        </div>
        <div className={styles.heroArt} aria-hidden="true"><Mascot size={150} mood="wave" butterfly={false} /></div>
      </header>

      <ul className={styles.facts}>
        {(w.facts || []).map((f) => (
          <li key={f.label} className={styles.fact}><b>{f.value}</b><span>{f.label}</span></li>
        ))}
      </ul>

      <Profiles w={w} />
      <Audiences w={w} />
      <QuestionDemo w={w} lang={lang} />
      <Standards w={w} />
      <section className={styles.section} aria-labelledby="why-fair">
        <h2 id="why-fair">{w.fairTitle}</h2>
        <ul className={styles.ticks}>{(w.fairPoints || []).map((p) => <li key={p}>{p}</li>)}</ul>
      </section>
      <Comfort w={w} />
      <section className={styles.section} aria-labelledby="why-safe">
        <h2 id="why-safe">{w.safetyTitle}</h2>
        <ul className={styles.cards2}>{(w.safety || []).map((p) => <li key={p} className={styles.safeCard}><span aria-hidden="true">🛡️</span> {p}</li>)}</ul>
      </section>
      <section className={styles.section} aria-labelledby="why-lang">
        <h2 id="why-lang">{w.langTitle}</h2>
        <p className={styles.sub}>{w.langLead}</p>
        <ul className={styles.langs}>{LANGUAGES.map((l) => <li key={l.code} lang={l.code}>{l.native}</li>)}</ul>
      </section>
      <aside className={styles.honest} aria-labelledby="why-not">
        <h2 id="why-not">{w.notTitle}</h2>
        <p>{w.notText}</p>
      </aside>
      <section className={`${styles.section} ${styles.final}`}>
        <h2>{w.ctaTitle}</h2>
        <p className={styles.sub}>{w.ctaText}</p>
        <div className={styles.ctas}>
          <Link to="/home" className={styles.primary}>{w.ctaStart}</Link>
          <Link to="/contact-us" className={styles.ghost}>{w.ctaTalk}</Link>
        </div>
      </section>
      <ExploreLinks path={PATH} />
    </main>
  );
}

// Who it is for: pick a description, see what Learnigo does for that learner.
function Profiles({ w }) {
  const keys = Object.keys(w.profiles || {});
  const [open, setOpen] = useState(keys[0] || "");
  const p = w.profiles?.[open];
  return (
    <section className={styles.section} aria-labelledby="why-for">
      <h2 id="why-for">{w.forTitle}</h2>
      <p className={styles.sub}>{w.forLead}</p>
      <div className={styles.chips} role="group" aria-labelledby="why-for">
        {keys.map((k) => (
          <button key={k} type="button" className={`${styles.chip} ${open === k ? styles.chipOn : ""}`} aria-pressed={open === k} onClick={() => { sfx.tab?.(); setOpen(k); }}>
            <span aria-hidden="true">{PROFILE_ICONS[k] || "✨"}</span> {w.profiles[k].label}
          </button>
        ))}
      </div>
      {p && (
        <div className={styles.profile} aria-live="polite">
          <span className={styles.tag}>{p.tag}</span>
          <ul className={styles.ticks}>{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
      )}
    </section>
  );
}

// Every feature, by who is looking: accessible tabs.
function Audiences({ w }) {
  const keys = Object.keys(w.audiences || {});
  const [tab, setTab] = useState(keys[0] || "");
  const refs = useRef({});
  const move = (e, i) => {
    const next = e.key === "ArrowRight" ? (i + 1) % keys.length : e.key === "ArrowLeft" ? (i - 1 + keys.length) % keys.length : e.key === "Home" ? 0 : e.key === "End" ? keys.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    setTab(keys[next]);
    refs.current[keys[next]]?.focus();
  };
  const a = w.audiences?.[tab];
  return (
    <section className={styles.section} aria-labelledby="why-aud">
      <h2 id="why-aud">{w.audTitle}</h2>
      <p className={styles.sub}>{w.audLead}</p>
      <div className={styles.tabs} role="tablist" aria-labelledby="why-aud">
        {keys.map((k, i) => (
          <button key={k} ref={(el) => { refs.current[k] = el; }} type="button" role="tab" id={`why-tab-${k}`} aria-controls="why-tabpanel" aria-selected={tab === k} tabIndex={tab === k ? 0 : -1}
            className={`${styles.tab} ${tab === k ? styles.tabOn : ""}`} onClick={() => { sfx.tab?.(); setTab(k); }} onKeyDown={(e) => move(e, i)}>
            <span aria-hidden="true">{AUDIENCE_ICONS[k]}</span> {w.audiences[k].label}
          </button>
        ))}
      </div>
      <div id="why-tabpanel" role="tabpanel" aria-labelledby={`why-tab-${tab}`} className={styles.grid}>
        {(a?.items || []).map((it) => (
          <article key={it.title} className={styles.card}>
            <span className={styles.cardIcon} aria-hidden="true">{it.icon}</span>
            <h3>{it.title}</h3>
            <p>{it.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// A question being read: the voice says each step and the action strip lights it.
function QuestionDemo({ w, lang }) {
  const lines = useMemo(() => w.qNarration || [], [w.qNarration]);
  const cues = ["listen", "tap"];
  const [active, setActive] = useState([]);
  const [playing, setPlaying] = useState(false);
  const timers = useRef([]);
  useEffect(() => onNarration((e) => {
    if (e.type === "sentence") { const k = lines.findIndex((x) => x.trim() === String(e.text || "").trim()); if (k >= 0) setActive([Math.min(k, cues.length - 1)]); }
  }), [lines]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { timers.current.forEach(clearTimeout); stopNarration(); }, []);
  const play = () => {
    timers.current.forEach(clearTimeout);
    setPlaying(true);
    setActive([0]);
    // The light follows the voice; on a device with no voice it follows a gentle timer.
    timers.current = [setTimeout(() => setActive([1]), 1800), setTimeout(() => { setActive([]); setPlaying(false); }, 3800)];
    Promise.resolve(narrate(lines.join(" "), { lang, user: true })).catch(() => {});
  };
  return (
    <section className={styles.section} aria-labelledby="why-q">
      <h2 id="why-q">{w.qTitle}</h2>
      <p className={styles.sub}>{w.qLead}</p>
      <div className={styles.demo}>
        <div className={styles.demoCard}>
          <CueStrip cues={cues} active={active} />
          <p className={styles.demoInstruction}>{w.qInstruction}</p>
          <div className={styles.demoOptions} aria-hidden="true">
            {(w.qOptions || []).map((o, i) => <span key={o} className={styles.demoOption}><b>{String.fromCharCode(65 + i)}</b> {o}</span>)}
          </div>
          <button type="button" className={styles.primary} onClick={play} disabled={playing} data-sound="none">
            🔊 {playing ? w.qPlaying : w.qPlay}
          </button>
          <p className={styles.demoCaption} aria-live="polite">{playing ? lines[active[0] ?? 0] : lines.join(" ")}</p>
        </div>
        <ol className={styles.rules}>
          {(w.rules || []).map((r, i) => (
            <li key={r.title}><span className={styles.ruleNo} aria-hidden="true">{i + 1}</span><span><b>{r.title}</b> {r.text}</span></li>
          ))}
        </ol>
      </div>
      <p className={styles.note}>{w.rulesNote}</p>
    </section>
  );
}

// The curriculum map: a region and a subject, every skill and what it is mapped to.
function Standards({ w }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [region, setRegion] = useState("ie");
  const [subject, setSubject] = useState("english");
  const [all, setAll] = useState(false);
  const box = useRef(null);
  // Loaded when the section comes near the screen: the map is big, most visitors never scroll this far.
  useEffect(() => {
    const el = box.current;
    if (!el || data) return undefined;
    const load = () => import("../data/standards.json").then((m) => setData(m.default || m)).catch(() => setData({ skills: [] }));
    if (!("IntersectionObserver" in window)) { load(); return undefined; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); load(); } }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [data]);
  const rows = (data?.skills || []).filter((s) => s.subject === subject).sort((a, b) => a.level - b.level);
  const shown = all ? rows : rows.slice(0, 8);
  const mapped = (s) => {
    const m = s[region];
    if (!m) return "–";
    // The stage, unless the official outcome text already names it ("(Stages 1–2)").
    if (region === "ie") return `${m.fw}: ${m.text}${m.stage && !/\bStages?\b/.test(m.text) ? ` (${fill(w.stage, { n: m.stage })})` : ""}${m.classes ? ` · ${m.classes}` : ""}`;
    if (region === "uk") return m.text;
    if (region === "us") return `${(m.codes || []).join(", ") || m.fw}${m.grade ? ` · grade ${m.grade}` : ""}`;
    if (region === "eu") return m.cefr ? `CEFR ${m.cefr}` : m.text;
    return `NFQ ${m.nfq} · CCRS ${m.ccrs}`;
  };
  const skillName = (s) => t(`skills.${s.subject}.${s.id.split(".")[1]}`, s.name);
  return (
    <section className={styles.section} aria-labelledby="why-std" ref={box}>
      <h2 id="why-std">{w.sTitle}</h2>
      <p className={styles.sub}>{w.sLead}</p>
      <div className={styles.chips} role="group" aria-label={w.sTitle}>
        {REGIONS.map((r) => <button key={r} type="button" className={`${styles.chip} ${region === r ? styles.chipOn : ""}`} aria-pressed={region === r} onClick={() => setRegion(r)}>{w.regions?.[r]}</button>)}
      </div>
      <div className={styles.chips} role="group" aria-label={w.colSkill}>
        {SUBJECTS.map((s) => <button key={s} type="button" className={`${styles.chip} ${styles.chipSmall} ${subject === s ? styles.chipOn : ""}`} aria-pressed={subject === s} onClick={() => { setSubject(s); setAll(false); }}>{w.subjects?.[s]}</button>)}
      </div>
      {!data ? <p className={styles.sub}>{w.sLoading}</p> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead><tr><th scope="col">{w.colSkill}</th><th scope="col">{w.colLevel}</th><th scope="col">{w.colMapped}</th></tr></thead>
            <tbody>{shown.map((s) => <tr key={s.id}><th scope="row">{skillName(s)}</th><td>{s.level}</td><td lang="en">{mapped(s)}</td></tr>)}</tbody>
          </table>
          {rows.length > 8 && <button type="button" className={styles.ghost} onClick={() => setAll((x) => !x)} aria-expanded={all}>{all ? "−" : `+ ${rows.length - 8}`}</button>}
        </div>
      )}
      <p className={styles.note}>{w.sNote}</p>
    </section>
  );
}

// The comfort settings, live: they change the whole site for this visitor.
function Comfort({ w }) {
  const [prefs, setPrefs] = usePrefsState();
  const tg = w.toggles || {};
  const items = [
    { key: "font", on: prefs.font === "dyslexic", set: (on) => setPrefs({ font: on ? "dyslexic" : "default" }) },
    { key: "bigger", on: prefs.textScale >= 1.2, set: (on) => setPrefs({ textScale: on ? 1.2 : 1 }) },
    { key: "spacing", on: prefs.spacing === "wide", set: (on) => setPrefs({ spacing: on ? "wide" : "normal" }) },
    { key: "contrast", on: prefs.contrast === "high", set: (on) => setPrefs({ contrast: on ? "high" : "normal" }) },
    { key: "motion", on: prefs.motion === "reduced", set: (on) => setPrefs({ motion: on ? "reduced" : "system" }) },
  ];
  return (
    <section className={styles.section} aria-labelledby="why-comfort">
      <h2 id="why-comfort">{w.comfortTitle}</h2>
      <p className={styles.sub}>{w.comfortLead}</p>
      <div className={styles.toggles}>
        {items.map((it) => (
          <button key={it.key} type="button" role="switch" aria-checked={it.on} className={`${styles.toggle} ${it.on ? styles.toggleOn : ""}`} onClick={() => it.set(!it.on)}>
            <span className={styles.knob} aria-hidden="true" /> {tg[it.key]}
          </button>
        ))}
        <button type="button" className={styles.ghost} onClick={() => setPrefs({ font: "default", textScale: 1, spacing: "normal", contrast: "normal", motion: "system" })}>{tg.reset}</button>
      </div>
    </section>
  );
}
