import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authHeaders } from "../../utils/authHeaders";
import { useLinks } from "../links";
import s from "./FamilyLayer.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; } })();
const STICKERS = { star: "⭐", trophy: "🏆", heart: "💖", rocket: "🚀", rainbow: "🌈", thumbs: "👍", party: "🎉", medal: "🏅", sun: "🌞", hug: "🤗" };
// Learner pages only: never on logins, role select or the grown-up dashboards.
const LEARNER = /^\/(home|dashboard|subject|module|games|ai-teacher|about-us|contact-us)(\/|$)/;
const LEARNING = /^\/(home|subject|module|games|ai-teacher|shorts|together)(\/|$)/;
const BREAK_KEY = "family_break";
const TOAST_KEY = "links_toast_dismissed";
const dismissedIds = () => { try { return new Set(JSON.parse(sessionStorage.getItem(TOAST_KEY) || "[]")); } catch { return new Set(); } };

// What the child sees of their family's settings (PAR-012, PAR-042, PAR-060, PAR-061):
// cheers from their guardians, their weekly goal and reward, and gentle healthy-use screens.
export default function FamilyLayer() {
  const { t } = useTranslation();
  const T = (k, d, o) => t(`family.${k}`, { defaultValue: d, ...o });
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [fam, setFam] = useState(null);
  const [goalHidden, setGoalHidden] = useState(false);
  const [breakDue, setBreakDue] = useState(false);
  const [voice, setVoice] = useState({ id: null, url: null });
  const audio = useRef(null);
  const learnerPage = LEARNER.test(pathname);

  const signedIn = Boolean(authHeaders().Authorization);

  // Requests from grown-ups, teachers and schools waiting for the learner (services/linkRequests.js):
  // a friendly toast on learner pages, linking to Dashboard → My people. The hook plays the
  // notify sound once for a request that wasn't seen before.
  const links = useLinks("student", { enabled: learnerPage && signedIn, poll: 60000 });
  const [hiddenReqs, setHiddenReqs] = useState(dismissedIds);
  const onPeopleTab = pathname === "/dashboard" && new URLSearchParams(search).get("tab") === "people";
  const waiting = (links.data?.incoming || []).filter((r) => !hiddenReqs.has(r.id));
  const hideRequests = () => {
    const next = new Set([...hiddenReqs, ...waiting.map((r) => r.id)]);
    setHiddenReqs(next);
    try { sessionStorage.setItem(TOAST_KEY, JSON.stringify([...next])); } catch { /* private mode */ }
  };
  const requestToast = learnerPage && signedIn && !onPeopleTab && waiting.length > 0 ? (
    <div className={s.reqToast} role="status" aria-live="polite">
      <span className={s.reqIcon} aria-hidden="true">💌</span>
      <span className={s.reqText}>
        <strong>{waiting.length === 1
          ? T("reqOne", "{{name}} sent you a request!", { name: waiting[0].from.name || waiting[0].org?.name || waiting[0].from.email })
          : T("reqMany", "You have {{n}} new requests!", { n: waiting.length })}</strong>
        <span>{T("reqHelp", "Tap to see it and say yes or no.")}</span>
      </span>
      <button type="button" data-sound="forward" className={s.btnSmall} onClick={() => { hideRequests(); navigate("/dashboard?tab=people"); }}>{T("reqSee", "See it")}</button>
      <button type="button" data-sound="close" className={s.close} aria-label={T("hide", "Hide")} onClick={hideRequests}>✕</button>
    </div>
  ) : null;
  useEffect(() => {
    if (!learnerPage || !signedIn) return undefined;
    let live = true;
    const load = async () => {
      try {
        const r = await fetch(`${API}/api/dashboard/family`, { headers: { ...authHeaders(), "X-Timezone": TZ }, credentials: "include" });
        const d = await r.json();
        if (live) setFam(d.success && d.linked ? d : null);
      } catch { /* offline: no family layer */ }
    };
    load();
    const iv = setInterval(load, 60000);
    return () => { live = false; clearInterval(iv); };
  }, [learnerPage, signedIn, pathname]);

  // Break reminder: counts minutes on learning pages in this tab.
  const breakEvery = fam?.healthy?.breakEveryMin || 0;
  useEffect(() => {
    if (!breakEvery || !LEARNING.test(pathname)) return undefined;
    const iv = setInterval(() => {
      let used = 0;
      try { used = Number(sessionStorage.getItem(BREAK_KEY)) || 0; } catch { /* ignore */ }
      used += 1;
      try { sessionStorage.setItem(BREAK_KEY, String(used)); } catch { /* ignore */ }
      if (used >= breakEvery) setBreakDue(true);
    }, 60000);
    return () => clearInterval(iv);
  }, [breakEvery, pathname]);

  const cheer = fam?.cheers?.[0];
  useEffect(() => {
    if (!cheer?.hasVoice) return undefined;
    let url = null;
    (async () => {
      try {
        const r = await fetch(`${API}/api/dashboard/cheers/${cheer.id}/voice`, { headers: authHeaders() });
        if (r.ok) { url = URL.createObjectURL(await r.blob()); setVoice({ id: cheer.id, url }); }
      } catch { /* no voice */ }
    })();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [cheer?.id, cheer?.hasVoice]);
  const voiceUrl = cheer && voice.id === cheer.id ? voice.url : null;

  if (!learnerPage || !signedIn) return null;
  if (!fam) return requestToast;

  const seen = async () => {
    try { await fetch(`${API}/api/dashboard/cheers/${cheer.id}/seen`, { method: "POST", headers: authHeaders() }); } catch { /* ignore */ }
    setFam((f) => ({ ...f, cheers: f.cheers.slice(1) }));
  };

  const h = fam.healthy || {};
  const resting = LEARNING.test(pathname) && (h.quietNow || h.limitReached);
  if (resting) {
    return (
      <div className={s.rest} role="dialog" aria-modal="true" aria-labelledby="rest-h">
        <div className={s.restCard}>
          <div className={s.restIcon} aria-hidden="true">{h.quietNow ? "🌙" : "🌳"}</div>
          <h2 id="rest-h">{h.quietNow ? T("quietT", "It's quiet time") : T("limitT", "Great learning today!")}</h2>
          <p>{h.quietNow
            ? T("quietD", "Learnigo is resting until {{t}}. See you then!", { t: h.quietEnd })
            : T("limitD", "You've done your learning time for today. Time to play, read or go outside. See you tomorrow!")}</p>
          <button type="button" className={s.btn} onClick={() => navigate("/dashboard")}>{T("progress", "See my progress")}</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {!cheer && requestToast}
      {cheer && (
        <div className={s.backdrop} role="presentation">
          <div className={s.cheer} role="dialog" aria-modal="true" aria-labelledby="cheer-h">
            <div className={s.sticker} aria-hidden="true">{STICKERS[cheer.sticker] || "⭐"}</div>
            <h2 id="cheer-h">{T("cheerFrom", "A cheer from {{name}}!", { name: cheer.fromName || T("family", "your family") })}</h2>
            {cheer.message && <p className={s.msg}>{cheer.message}</p>}
            {voiceUrl && (
              <button type="button" className={s.btnSoft} onClick={() => audio.current?.play()}>🔊 {T("listen", "Listen")}
                <audio ref={audio} src={voiceUrl} preload="auto" />
              </button>
            )}
            <button type="button" className={s.btn} onClick={seen}>{T("thanks", "Thank you!")}</button>
          </div>
        </div>
      )}
      {breakDue && !cheer && (
        <div className={s.toast} role="status">
          <span aria-hidden="true">🤸</span> {T("break", "Time for a little stretch! Stand up, wiggle, drink some water.")}
          <button type="button" className={s.btnSmall} onClick={() => { setBreakDue(false); try { sessionStorage.setItem(BREAK_KEY, "0"); } catch { /* ignore */ } }}>{T("done", "Done")}</button>
        </div>
      )}
      {fam.goal && fam.progress && !goalHidden && /^\/home$/.test(pathname) && (
        <aside className={s.goal} aria-label={T("goalLabel", "My weekly goal")}>
          <span className={s.goalRing} aria-hidden="true">{fam.progress.reached ? "🏆" : "🎯"}</span>
          <span>
            <strong>{fam.progress.reached ? T("goalDone", "Goal reached this week!") : T("goalDays", "{{met}} of {{n}} days this week", { met: fam.progress.daysMet, n: fam.progress.daysPerWeek })}</strong>
            <span className={s.goalSub}>
              {fam.goal.reward ? `${fam.goal.rewardEmoji || "🎁"} ${fam.progress.reached ? T("rewardWon", "You earned: {{r}}", { r: fam.goal.reward }) : fam.goal.reward}` : T("goalRule", "{{m}} minutes makes a goal day", { m: fam.goal.minutesPerDay })}
            </span>
          </span>
          <button type="button" className={s.close} aria-label={T("hide", "Hide")} onClick={() => setGoalHidden(true)}>✕</button>
        </aside>
      )}
    </>
  );
}
