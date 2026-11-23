import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as FM from "framer-motion";
import { useCalmMotion } from "../../utils/useCalmMotion";
import { fmtDuration, fmtDate, subjectLabel, moduleLabel } from "../../components/dashboard";
import y from "./year.module.css";

const BG = ["#5a4bd6", "#0b5cad", "#0a7a62", "#a35200", "#b0245f", "#4f3fc4", "#1d7a38", "#0a6c99", "#6c2bb5", "#187a62"]; // all >= 4.5:1 with white text
const esc = (x) => String(x ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// "Year in Learnigo" (PAR-080), with then-vs-now (PAR-081) and milestones (PAR-082).
export default function YearInReview({ data, onClose }) {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`parent.year.${k}`, { defaultValue: d, ...o });
  const reduce = useCalmMotion();
  const first = (data.child?.name || "").split(" ")[0];
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = useMemo(() => {
    const out = [];
    out.push({ big: `${data.child?.avatar || "✨"}`, title: T("s1", "{{name}}'s {{year}} in Learnigo", { name: first, year: data.year }), text: T("s1t", "Let's look back together.") });
    out.push({ big: fmtDuration(data.minutes), title: T("s2", "of learning"), text: T("s2t", "on {{n}} different days, with {{q}} questions answered.", { n: data.activeDays, q: data.answered.toLocaleString() }) });
    if (data.topSubject) out.push({ big: subjectLabel(t, data.topSubject), title: T("s3", "Favourite subject"), text: T("s3t", "The subject {{name}} spent the most time on.", { name: first }) });
    out.push({ big: String(data.mastered.length), title: T("s4", "areas mastered"), text: data.mastered.length ? data.mastered.slice(0, 4).map((m) => `${moduleLabel(t, m.module)} · ${subjectLabel(t, m.subject)}`).join(", ") : T("s4none", "Mastery is on its way: every answer counts.") });
    if (data.longestStreak > 1) out.push({ big: `🔥 ${data.longestStreak}`, title: T("s5", "days in a row"), text: T("s5t", "The longest learning streak of the year.") });
    if (data.bestMonth) out.push({ big: fmtDate(`${data.bestMonth.month}-01`, { style: "month" }), title: T("s6", "Best month"), text: T("s6t", "{{t}} of learning in one month.", { t: fmtDuration(data.bestMonth.minutes) }) });
    if (data.favouriteAiTopic) out.push({ big: "🧑‍🏫", title: T("s7", "Favourite AI Teacher topic"), text: data.favouriteAiTopic.title });
    const tv = data.thenVsNow;
    if (tv && tv.then?.accuracy != null && tv.now?.accuracy != null) {
      out.push({
        big: `${tv.then.accuracy}% → ${tv.now.accuracy}%`, title: T("s8", "Then and now"),
        text: T("s8t", "Right answers in {{a}} compared with {{b}}.", { a: fmtDate(`${tv.then.month}-01`, { style: "month" }), b: fmtDate(`${tv.now.month}-01`, { style: "month" }) })
          + (tv.then.hintsPer100 != null && tv.now.hintsPer100 != null && tv.now.hintsPer100 < tv.then.hintsPer100 ? ` ${T("s8h", "And fewer hints needed.")}` : ""),
      });
    }
    if (data.milestones?.length) out.push({ big: data.milestones.slice(-3).map((m) => m.icon).join(" "), title: T("s9", "Big moments"), text: data.milestones.slice(-3).map((m) => t(`parent.milestone.${m.key}`, { defaultValue: m.text })).join(" · ") });
    out.push({ cert: true, big: "🏆", title: T("s10", "Certificate of learning"), text: T("s10t", "Awarded to {{name}} for {{t}} of curious, brave learning in {{year}}.", { name: data.child?.name, t: fmtDuration(data.minutes), year: data.year }) });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const last = slides.length - 1;
  const next = () => setI((x) => Math.min(last, x + 1));
  const prev = () => setI((x) => Math.max(0, x - 1));
  useEffect(() => {
    if (paused || reduce || i >= last) return undefined;
    const tm = setTimeout(() => setI((x) => Math.min(last, x + 1)), 4500);
    return () => clearTimeout(tm);
  }, [i, paused, reduce, last]);
  useEffect(() => {
    const key = (e) => {
      if (e.key === "ArrowRight") setI((x) => Math.min(last, x + 1));
      else if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [last, onClose]);

  const printCert = () => {
    const w = window.open("", "_blank", "width=900,height=650");
    if (!w) return;
    w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(T("s10", "Certificate of learning"))}</title>
      <style>@page{size:A4 landscape;margin:12mm}body{font-family:Fredoka,system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:95vh}
      .c{border:10px double #6c5ce7;border-radius:28px;padding:48px 64px;text-align:center;max-width:820px}
      h1{font-size:44px;margin:8px 0;color:#4f3fc4}.n{font-size:56px;font-weight:700;margin:18px 0}.t{font-size:20px;color:#333}
      .b{font-size:72px}.f{margin-top:28px;color:#666;letter-spacing:.2em;font-weight:700}</style>
      <div class="c"><div class="b">🏆</div><h1>${esc(T("s10", "Certificate of learning"))}</h1>
      <div class="n">${esc(data.child?.name)}</div><div class="t">${esc(slides[slides.length - 1].text)}</div>
      <div class="f">LEARNIGO · ${esc(data.year)}</div></div><script>window.onload=()=>{window.print()}</script>`);
    w.document.close();
  };

  const sl = slides[i];
  return (
    <div className={y.wrap} role="dialog" aria-modal="true" aria-label={T("aria", "Year in Learnigo story")} style={{ background: BG[i % BG.length] }}>
      <div className={y.progress} aria-hidden="true">
        {slides.map((_, k) => (
          <span key={k} className={y.seg}>
            <span key={k === i ? `run${i}` : k} className={`${y.fill} ${k === i && !reduce ? y.run : ""}`}
              style={{ width: k < i || (k === i && reduce) ? "100%" : undefined, animationPlayState: paused ? "paused" : "running" }} />
          </span>
        ))}
      </div>
      <div className={y.top}>
        <button type="button" className={y.ctl} onClick={() => setPaused((p) => !p)}>{paused ? T("play", "Play") : T("pause", "Pause")}</button>
        <button type="button" className={y.ctl} onClick={onClose} aria-label={T("close", "Close")}>✕</button>
      </div>
      <button type="button" className={y.tapPrev} onClick={prev} aria-label={T("prev", "Previous")} />
      <button type="button" className={y.tapNext} onClick={next} aria-label={T("next", "Next")} />
      <FM.AnimatePresence mode="wait">
        <FM.motion.div key={i} className={`${y.slide} ${sl.cert ? y.cert : ""}`}
          initial={reduce ? false : { opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? undefined : { opacity: 0, y: -20 }}
          transition={{ duration: 0.45 }} aria-live="polite">
          <div className={y.big}>{sl.big}</div>
          <h2 className={y.title}>{sl.title}</h2>
          <p className={y.text}>{sl.text}</p>
          {sl.cert && <button type="button" className={y.print} onClick={printCert}>{T("printCert", "Print the certificate")}</button>}
        </FM.motion.div>
      </FM.AnimatePresence>
      <p className={y.count}>{i + 1} / {slides.length}</p>
    </div>
  );
}
