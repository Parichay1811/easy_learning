import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaLayerGroup, FaBullseye, FaHeart, FaCrosshairs, FaLightbulb, FaChartLine, FaSave, FaUndo, FaCheckCircle, FaExclamationCircle, FaHome, FaChalkboardTeacher } from "react-icons/fa";
import { SubTabs, SubPanel, Button, EmptyState, Skeleton } from "../dashboard";
import SupportsForm from "../settings/SupportsForm";
import LevelBadge from "./LevelBadge";
import LevelPicker from "./LevelPicker";
import SkillList from "./SkillList";
import GoalList from "./GoalList";
import WeeklyProgress from "./WeeklyProgress";
import {
  SUBJECTS, SUBJECT_META, PACES, MAX_LEVEL, asFraction, changedBy, classNote, generalTip, homeNote, levelLabel, paceName, paceText,
  goalsForServer, shortDate, skillName, skillSubject, sourceText, statusText, subjectName, suggestionText,
} from "./levels";
import s from "./learning.module.css";

const SECTIONS = ["levels", "goals", "comfort", "skills", "tricky", "progress"];
const SKILL_PLAN = ["", "focus_skill", "skip_skill"];

// A stable string for comparing plain objects (keys sorted).
function stable(v) {
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}

// The server's name for who is editing ("guardian" | "teacher").
const serverRole = (role) => (role === "teacher" ? "teacher" : "guardian");
const otherRoleText = (t, by) => (by === "teacher"
  ? t("learning.plan.byTeacher", "set by a teacher")
  : t("learning.plan.byParent", "set by a parent or carer"));

// Overrides someone else (the other grown-up role) set: shown, never sent back.
function othersOf(data, role) {
  const p = data?.profile || {};
  const list = Array.isArray(data?.overrides) ? data.overrides : Array.isArray(p.overrides) ? p.overrides : [];
  return list.filter((o) => o?.by && o.by !== serverRole(role));
}

// Server data -> the editor's draft (only this role's own overrides).
function fromData(data, role) {
  const p = data?.profile || {};
  const levels = {};
  for (const subj of SUBJECTS) {
    const l = p.levels?.[subj] || {};
    levels[subj] = { level: l.level ?? null, locked: !!l.locked };
  }
  const list = Array.isArray(data?.overrides) ? data.overrides : Array.isArray(p.overrides) ? p.overrides : [];
  const holds = {};
  const skills = {};
  for (const o of list.filter((x) => !x?.by || x.by === serverRole(role))) {
    if (o?.type === "hold_level" && o.subject) holds[o.subject] = true;
    else if ((o?.type === "focus_skill" || o?.type === "skip_skill") && o.skill) skills[o.skill] = o.type;
  }
  return {
    levels,
    pace: PACES.includes(p.pace) ? p.pace : "steady",
    goals: Array.isArray(p.goals) ? p.goals : [],
    supports: p.supports && typeof p.supports === "object" ? p.supports : {},
    holds,
    skills,
  };
}

function overridesOf(d) {
  return [
    ...SUBJECTS.filter((subj) => d.holds[subj]).map((subject) => ({ type: "hold_level", subject })),
    ...Object.entries(d.skills).filter(([, type]) => type).map(([skill, type]) => ({ type, skill, subject: skillSubject(skill) || undefined })),
  ];
}

// Only what changed, in the PUT body's shape.
function diff(base, draft) {
  const out = {};
  const levels = {};
  for (const subj of SUBJECTS) {
    const a = base.levels[subj];
    const b = draft.levels[subj];
    if (b.level != null && (a.level !== b.level || a.locked !== b.locked)) levels[subj] = { level: b.level, locked: b.locked };
  }
  if (Object.keys(levels).length) out.levels = levels;
  if (base.pace !== draft.pace) out.pace = draft.pace;
  if (stable(goalsForServer(base.goals)) !== stable(goalsForServer(draft.goals))) out.goals = goalsForServer(draft.goals);
  if (stable(base.supports) !== stable(draft.supports)) out.supports = draft.supports;
  if (stable(overridesOf(base)) !== stable(overridesOf(draft))) out.overrides = overridesOf(draft);
  return out;
}

function SubjectLevel({ subj, data, base, draft, onLevel, onLock, onHold, name, othersHold }) {
  const { t, i18n } = useTranslation();
  const info = data?.profile?.levels?.[subj] || {};
  const meta = SUBJECT_META[subj];
  const Icon = meta.Icon;
  const acc = asFraction(info.accuracy);
  const who = changedBy(info);
  const src = [sourceText(t, info.source, "them"),
    info.locked && info.lockedBy ? t("learning.plan.lockedBy", { defaultValue: "kept fixed, {{who}}", who: otherRoleText(t, info.lockedBy) }) : ""].filter(Boolean).join(", ");
  const changed = base.level !== draft.level;
  const headId = `plan-lv-${subj}`;
  return (
    <section className={s.subjCard} style={{ "--sk": meta.color, "--sk-soft": meta.soft, "--sk-ink": meta.ink }} aria-labelledby={headId}>
      <header className={s.subjHead}>
        <span className={s.subjIcon} aria-hidden="true"><Icon /></span>
        <h3 id={headId} className={s.subjName}>{subjectName(t, subj)}</h3>
        {info.status && <span className={s.statusChip} data-status={info.status}>{statusText(t, info.status, "them")}</span>}
      </header>
      <div className={s.subjNow}>
        <LevelBadge level={base.level} subject={subj} locked={base.locked} size="sm" />
        <p className={s.subjFacts}>
          {[src, who.by, who.at ? shortDate(who.at, i18n.language) : ""].filter(Boolean).join(" · ")}
          {acc != null && info.attempts > 0 && (
            <><br />{t("learning.plan.accuracy", { defaultValue: "{{pct}} right over {{n}} marked answers at this level", pct: `${Math.round(acc * 100)} %`, n: info.attempts })}</>
          )}
        </p>
      </div>
      <LevelPicker
        legend={t("learning.plan.levelFor", { defaultValue: "{{subject}} level", subject: subjectName(t, subj) })}
        subject={subj}
        value={draft.level}
        current={base.level}
        max={info.ceiling ?? MAX_LEVEL}
        onChange={onLevel}
      />
      {changed && (
        <p className={s.changeNote}>
          {t("learning.plan.levelChange", { defaultValue: "Changes from {{from}} to {{to}} when you save.", from: base.level == null ? "—" : levelLabel(t, base.level), to: levelLabel(t, draft.level) })}
        </p>
      )}
      <label className={s.check}>
        <input type="checkbox" checked={draft.locked} onChange={(e) => onLock(e.target.checked)} />
        <span>
          {t("learning.plan.lock", "Only grown-ups can change this level")}
          <small>{t("learning.plan.lockHelp", { defaultValue: "{{name}} sees who chose it and can ask for a change.", name })}</small>
        </span>
      </label>
      <label className={s.check}>
        <input type="checkbox" checked={!!draft.hold} onChange={(e) => onHold(e.target.checked)} />
        <span>
          {t("learning.plan.hold", "Don't move up automatically for now")}
          <small>{t("learning.plan.holdHelp", "Learnigo keeps practising at this level until you change it.")}</small>
          {othersHold && <small className={s.otherNote}>{t("learning.plan.holdOther", { defaultValue: "Moving up is also paused, {{who}}.", who: otherRoleText(t, othersHold.by) })}</small>}
        </span>
      </label>
    </section>
  );
}

/**
 * The learning plan for one learner, for a parent or a teacher: level and lock
 * per subject, pace, goals, comfort settings, skills to focus on or skip, the
 * mistakes that keep coming back (with what helps) and the weeks so far.
 * Changes collect in a draft; one Save sends only what changed.
 *
 *   <LearningPlanEditor data={GET …/learning} onSave={(patch) => put(patch)} role="parent" name="Aanya" />
 *
 * Props:
 *  - data      { profile, skills, needsPractice, difficulties, history, overrides? } (GET …/learning)
 *  - onSave    async (patch) -> { ok, message? }; the page reloads `data` after a save
 *  - role      "parent" | "teacher" (wording only)
 *  - name      the learner's first name
 *  - loading, error, onRetry   load state
 */
export default function LearningPlanEditor({ data, onSave, role = "parent", name, loading = false, error = "", onRetry, idBase = "plan" }) {
  const { t } = useTranslation();
  const [section, setSection] = useState("levels");
  const [seen, setSeen] = useState(data);
  const [draft, setDraft] = useState(() => fromData(data, role));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ kind: "", text: "" });
  const [skillSubj, setSkillSubj] = useState("all");
  // New data from the server (a reload after saving, another child): start from it.
  if (data !== seen) {
    setSeen(data);
    setDraft(fromData(data, role));
  }
  const base = useMemo(() => fromData(data, role), [data, role]);
  const others = useMemo(() => othersOf(data, role), [data, role]);
  const patch = useMemo(() => diff(base, draft), [base, draft]);
  const dirty = Object.keys(patch).length > 0;
  const who = name || t("learning.theLearner", "the learner");

  if (loading && !data) return <><Skeleton variant="text" lines={2} /><Skeleton variant="rect" height={220} /></>;
  if (error && !data) {
    return (
      <EmptyState tone="error" title={t("learning.plan.loadError", "We couldn't load the learning plan")} text={error}
        actionLabel={onRetry ? t("learning.plan.retry", "Try again") : undefined} onAction={onRetry} />
    );
  }
  if (!data) return null;

  // Any edit clears the last "Saved" / "didn't save" line.
  const change = (fn) => { setDraft(fn); if (status.kind !== "busy" && status.text) setStatus({ kind: "", text: "" }); };
  const setLevel = (subj, patchOne) => change((d) => ({ ...d, levels: { ...d.levels, [subj]: { ...d.levels[subj], ...patchOne } } }));
  const setHold = (subj, on) => change((d) => ({ ...d, holds: { ...d.holds, [subj]: on } }));
  const setSkillPlan = (id, type) => change((d) => ({ ...d, skills: { ...d.skills, [id]: type } }));
  const edit = (patchAll) => change((d) => ({ ...d, ...patchAll }));

  const save = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setStatus({ kind: "busy", text: t("learning.plan.saving", "Saving…") });
    let r;
    try { r = await onSave?.(patch); } catch { r = { ok: false }; }
    setSaving(false);
    if (r?.ok) {
      let time = "";
      try { time = new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); } catch { /* no time */ }
      setStatus({ kind: "ok", text: t("learning.plan.saved", { defaultValue: "Saved at {{time}}. {{name}} gets the new plan the next time they learn.", time, name: who }) });
    } else {
      setStatus({ kind: "error", text: r?.message || t("learning.plan.saveError", "That didn't save. Check your connection and try again.") });
    }
  };
  const undo = () => { setDraft(fromData(data, role)); setStatus({ kind: "", text: t("learning.plan.undone", "Changes undone.") }); };

  const p = data.profile || {};
  const skills = Array.isArray(data.skills) ? data.skills : [];
  const difficulties = Array.isArray(data.difficulties) ? data.difficulties : [];
  // A grown-up sees what they can act on (moving a level, a skill to look at together);
  // "take a break" is for the learner in the moment.
  const suggestions = (Array.isArray(p.suggestions) ? p.suggestions : []).filter((x) => x && x.type !== "break").slice(0, 3);
  const last = changedBy(p);
  const changes = Array.isArray(data.changes) ? data.changes : Array.isArray(p.changes) ? p.changes : [];
  const focusCount = Object.values(draft.skills).filter(Boolean).length;
  const shownSkills = skills.filter((sk) => skillSubj === "all" || skillSubject(sk) === skillSubj);

  const tabs = [
    { id: "levels", label: t("learning.plan.tab.levels", "Levels and pace"), short: t("learning.plan.tab.levelsShort", "Levels"), icon: FaLayerGroup },
    { id: "goals", label: t("learning.plan.tab.goals", "Goals"), icon: FaBullseye },
    { id: "comfort", label: t("learning.plan.tab.comfort", "Comfort settings"), short: t("learning.plan.tab.comfortShort", "Comfort"), icon: FaHeart },
    { id: "skills", label: t("learning.plan.tab.skills", "Focus and skip"), short: t("learning.plan.tab.skillsShort", "Skills"), icon: FaCrosshairs, badge: focusCount || undefined },
    { id: "tricky", label: t("learning.plan.tab.tricky", "Tricky spots"), icon: FaLightbulb },
    { id: "progress", label: t("learning.plan.tab.progress", "Weekly progress"), short: t("learning.plan.tab.progressShort", "Weeks"), icon: FaChartLine },
  ];
  const current = SECTIONS.includes(section) ? section : "levels";

  return (
    <div className={s.plan}>
      <SubTabs label={t("learning.plan.sections", { defaultValue: "{{name}}'s learning plan", name: who })} tabs={tabs} value={current} onChange={setSection} idBase={idBase} sticky={false} />

      <SubPanel id="levels" value={current} idBase={idBase} className={s.planPanel}>
        <p className={s.planIntro}>
          {t("learning.plan.levelsIntro", "A level is a learning stage, not an age or a grade. Learnigo moves up one level at a time after steady practice and never moves down on its own. Here you can set a level yourself, keep it fixed, or pause moving up.")}
        </p>
        {(last.by || last.at) && (
          <p className={s.muted}>
            {t("learning.plan.lastChange", { defaultValue: "Last changed{{by}}{{at}}.", by: last.by ? ` ${t("learning.plan.by", { defaultValue: "by {{who}}", who: last.by })}` : "", at: last.at ? ` · ${shortDate(last.at)}` : "" })}
          </p>
        )}
        {suggestions.length > 0 && (
          <ul className={s.suggestList} aria-label={t("learning.plan.suggestions", "Learnigo's suggestions")}>
            {suggestions.map((sg) => {
              const lv = draft.levels[sg.subject]?.level;
              const target = sg.type !== "level_up" && sg.type !== "level_down" ? null
                : sg.to != null ? sg.to : lv == null ? null : sg.type === "level_up" ? lv + 1 : Math.max(0, lv - 1);
              return (
                <li key={sg.id} className={s.suggestRow}>
                  <FaLightbulb aria-hidden="true" />
                  <span>{sg.subject ? <b>{subjectName(t, sg.subject)}: </b> : null}{suggestionText(t, sg)}</span>
                  {target != null && target <= MAX_LEVEL && target !== lv && (
                    <Button size="sm" variant="soft" onClick={() => setLevel(sg.subject, { level: target })}>
                      {t("learning.plan.useSuggestion", { defaultValue: "Set level {{n}}", n: target })}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className={s.subjGrid}>
          {SUBJECTS.map((subj) => (
            <SubjectLevel key={subj} subj={subj} data={data} name={who}
              othersHold={others.find((o) => o.type === "hold_level" && (!o.subject || o.subject === subj))}
              base={base.levels[subj]} draft={{ ...draft.levels[subj], hold: draft.holds[subj] }}
              onLevel={(n) => setLevel(subj, { level: n })} onLock={(on) => setLevel(subj, { locked: on })} onHold={(on) => setHold(subj, on)} />
          ))}
        </div>
        <fieldset className={s.paceSet}>
          <legend className={s.pickerLegend}>{t("learning.plan.pace", "Pace")}</legend>
          <div className={s.paceGrid}>
            {PACES.map((pc) => (
              <label key={pc} className={s.paceOption} data-on={draft.pace === pc || undefined}>
                <input type="radio" name={`${idBase}-pace`} value={pc} checked={draft.pace === pc} onChange={() => edit({ pace: pc })} />
                <span><b>{paceName(t, pc)}</b><small>{paceText(t, pc)}</small></span>
              </label>
            ))}
          </div>
        </fieldset>
        {changes.length > 0 && (
          <details className={s.changes}>
            <summary>{t("learning.plan.history", "Recent changes")}</summary>
            <ul>
              {changes.slice(0, 8).map((c, i) => {
                const w = changedBy(c);
                return <li key={c.id || i}>{[c.text || c.what || c.field, w.by, w.at ? shortDate(w.at) : ""].filter(Boolean).join(" · ")}</li>;
              })}
            </ul>
          </details>
        )}
      </SubPanel>

      <SubPanel id="goals" value={current} idBase={idBase} className={s.planPanel}>
        <p className={s.planIntro}>
          {t("learning.plan.goalsIntro", { defaultValue: "Small, clear goals work best, set together with {{name}}. {{name}} sees them on their dashboard and can tick them off.", name: who })}
        </p>
        <GoalList goals={draft.goals} onChange={(goals) => edit({ goals })} who="them" viewer={serverRole(role)} name={who} />
      </SubPanel>

      <SubPanel id="comfort" value={current} idBase={idBase} className={s.planPanel}>
        <p className={s.planIntro}>
          {t("learning.plan.comfortIntro", { defaultValue: "These are comfort settings, like bigger text, a calmer screen, more time or having questions read aloud. Anyone can use them and no diagnosis is needed. They never lower a level or count against {{name}}. {{name}} can change them too.", name: who })}
        </p>
        <SupportsForm value={draft.supports} onChange={(supports) => edit({ supports })} />
      </SubPanel>

      <SubPanel id="skills" value={current} idBase={idBase} className={s.planPanel}>
        <p className={s.planIntro}>
          {t("learning.plan.skillsIntro", "Focus a skill to see it more often, or skip one for now (for example one that's taught later in class). Learnigo still checks skipped skills now and then, gently.")}
        </p>
        {skills.length ? (
          <>
            <div className={s.filterRow} role="group" aria-label={t("learning.plan.filter", "Show skills for")}>
              {["all", ...SUBJECTS].map((k) => (
                <button key={k} type="button" className={s.filterBtn} aria-pressed={skillSubj === k} onClick={() => setSkillSubj(k)}>
                  {k === "all" ? t("learning.plan.all", "All") : subjectName(t, k)}
                </button>
              ))}
            </div>
            <SkillList
              skills={shownSkills}
              who="them"
              showSubject={skillSubj === "all"}
              label={t("learning.plan.skillsList", "Skills")}
              action={(sk) => {
                const id = sk.id || sk.skill;
                const other = others.find((o) => (o.type === "focus_skill" || o.type === "skip_skill") && o.skill === id);
                return (
                  <span className={s.skillPlan}>
                  {other && (
                    <small className={s.otherNote}>
                      {other.type === "focus_skill" ? t("learning.plan.otherFocus", { defaultValue: "Focus, {{who}}", who: otherRoleText(t, other.by) }) : t("learning.plan.otherSkip", { defaultValue: "Skipped, {{who}}", who: otherRoleText(t, other.by) })}
                    </small>
                  )}
                  <select className={s.select} value={draft.skills[id] || ""} onChange={(e) => setSkillPlan(id, e.target.value)}
                    aria-label={t("learning.plan.skillPlan", { defaultValue: "Plan for {{skill}}", skill: skillName(t, sk) })}>
                    {SKILL_PLAN.map((v) => (
                      <option key={v} value={v}>
                        {v === "focus_skill" ? t("learning.plan.focus", "Focus on this") : v === "skip_skill" ? t("learning.plan.skip", "Skip for now") : t("learning.plan.asPlanned", "As usual")}
                      </option>
                    ))}
                  </select>
                  </span>
                );
              }}
            />
          </>
        ) : (
          <p className={s.muted}>{t("learning.plan.noSkills", { defaultValue: "Skills show up here once {{name}} has practised a little.", name: who })}</p>
        )}
      </SubPanel>

      <SubPanel id="tricky" value={current} idBase={idBase} className={s.planPanel}>
        <p className={s.planIntro}>
          {t("learning.plan.trickyIntro", "Mistakes that came back more than once, in plain words. They show what to practise, not what someone can or can't do.")}
        </p>
        {difficulties.length ? (
          <ul className={s.trickyList}>
            {difficulties.map((d, i) => {
              const id = d.skill || d.id;
              const general = generalTip(t, skillSubject(d), role);
              const home = homeNote(d);
              const cls = classNote(d);
              const focused = draft.skills[id] === "focus_skill";
              return (
                <li key={`${id}-${i}`} className={s.tricky} style={SUBJECT_META[skillSubject(d)] ? { "--sk": SUBJECT_META[skillSubject(d)].color } : undefined}>
                  <div className={s.trickyHead}>
                    <h3 className={s.trickyName}>{skillName(t, { id, name: d.name })}</h3>
                    {d.count > 0 && <span className={s.countChip}>{t("learning.plan.seen", { defaultValue: "Seen {{count}} times", count: d.count })}</span>}
                  </div>
                  {d.misconception && <p className={s.trickyWhat}><b>{t("learning.plan.whatHappens", "What happens:")}</b> {d.misconception}</p>}
                  {role !== "teacher" && <p className={s.trickyHome}><FaHome aria-hidden="true" /> <span><b>{t("learning.plan.atHome", "What you can do at home:")}</b> {home || general}</span></p>}
                  {role === "teacher" && (
                    <p className={s.trickyHome}><FaChalkboardTeacher aria-hidden="true" /> <span><b>{t("learning.plan.inClass", "What to try:")}</b> {cls || general}</span></p>
                  )}
                  {id && (
                    <Button size="sm" variant={focused ? "ghost" : "soft"} aria-pressed={focused} onClick={() => setSkillPlan(id, focused ? "" : "focus_skill")}>
                      {focused ? t("learning.plan.focused", "Focusing on this (tap to undo)") : t("learning.plan.focusThis", "Focus on this skill")}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={s.muted}>{t("learning.plan.noTricky", "Nothing keeps coming back at the moment.")}</p>
        )}
      </SubPanel>

      <SubPanel id="progress" value={current} idBase={idBase} className={s.planPanel}>
        <WeeklyProgress history={data.history} who="them" name={who} height={220} />
      </SubPanel>

      <div className={s.saveBar} data-dirty={dirty || undefined} data-said={status.text ? true : undefined} data-print="hide">
        <p className={s.saveStatus} data-kind={status.kind || undefined}>
          {status.kind === "ok" && <FaCheckCircle aria-hidden="true" />}
          {status.kind === "error" && <FaExclamationCircle aria-hidden="true" />}
          {/* Only the result of Save / Undo is announced; "unsaved" is a quiet note. */}
          <span role="status" aria-live="polite">{status.text}</span>
          {!status.text && <span>{dirty ? t("learning.plan.unsaved", "You have changes that aren't saved yet.") : t("learning.plan.upToDate", "Everything is saved.")}</span>}
        </p>
        <div className={s.saveBtns}>
          <Button variant="ghost" icon={FaUndo} onClick={undo} disabled={!dirty || saving} className={s.undoBtn} aria-label={t("learning.plan.undo", "Undo changes")}>{t("learning.plan.undo", "Undo changes")}</Button>
          <Button icon={FaSave} onClick={save} disabled={!dirty || saving}>{saving ? t("learning.plan.saving", "Saving…") : t("learning.plan.save", "Save changes")}</Button>
        </div>
      </div>
    </div>
  );
}
