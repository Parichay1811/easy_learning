import { useTranslation } from "react-i18next";
import { FaRoute } from "react-icons/fa";
import { SUBJECT_META } from "../learning/levels";
import { STAGE_COUNT, stageName, stageText, subjectLabel, normalizeJourney } from "./words";
import s from "./journey.module.css";

function stateOf(st) {
  if (!st.skills) return st.practiceOnly ? "practice" : "empty";
  if (st.mastered >= st.skills) return "full";
  if (st.mastered > 0) return "some";
  if (st.attempted > 0) return "tried";
  return "ahead";
}

/**
 * "My learning journey": per subject, the six kinds of thinking (stages 0-5:
 * wonder, spot it, understand, use it, explain why, use it anywhere) as stops
 * on a road. A stop fills with the share of its skills mastered, a ring shows
 * skills tried, and the numbers are always written: nothing is made to look
 * further along than it is. A stage with no questions yet is a faint outline.
 *
 *   <JourneyMap journey={json} />
 */
export default function JourneyMap({ journey, headingId = "jr-map", className = "" }) {
  const { t } = useTranslation();
  const subjects = normalizeJourney(journey);
  const anything = subjects.some((sj) => sj.stages.some((st) => st.attempted > 0));

  return (
    <section className={`${s.card} ${s.map} ${className}`} aria-labelledby={headingId}>
      <h3 id={headingId} className={s.title}><FaRoute aria-hidden="true" /> {t("journey.map.title", "My learning journey")}</h3>
      <p className={s.help}>
        {anything
          ? t("journey.map.help", "Each stop is a different kind of thinking. A stop fills up as you master its skills.")
          : t("journey.map.helpNew", "Each stop is a different kind of thinking. Play a round and your road starts here.")}
      </p>
      {subjects.length === 0 ? (
        <p className={s.empty}>{t("journey.map.empty", "Your journey will appear here after your first round.")}</p>
      ) : (
        <>
          <ol className={s.legend} aria-hidden="true">
            {Array.from({ length: STAGE_COUNT }, (_, n) => <li key={n} title={stageText(t, n)}>{stageName(t, n)}</li>)}
          </ol>
          <ul className={s.subjects}>
            {subjects.map((sj) => {
              const meta = SUBJECT_META[sj.subject];
              const Icon = meta?.Icon;
              const name = subjectLabel(t, sj.subject);
              return (
                <li key={sj.subject} className={s.subject} style={{ "--sj": meta?.color, "--sj-ink": meta?.ink }}>
                  <h4 className={s.subjectHead}>
                    <span>
                      {Icon && <Icon aria-hidden="true" />}{name}
                      {sj.level != null && <small>{t("journey.map.level", { defaultValue: "Level {{n}}", n: sj.level })}</small>}
                    </span>
                    <small>
                      {sj.reached != null
                        ? t("journey.map.reached", { defaultValue: "Reached: {{stage}}", stage: stageName(t, sj.reached) })
                        : t("journey.map.notYet", "Not started yet")}
                    </small>
                  </h4>
                  <ol className={s.path} aria-label={t("journey.map.pathLabel", { defaultValue: "{{subject}} journey", subject: name })}>
                    {sj.stages.map((st) => {
                      const state = stateOf(st);
                      const here = sj.reached === st.stage;
                      const pct = st.skills ? Math.round((st.mastered / st.skills) * 100) : 0;
                      const said = state === "practice"
                        ? t("journey.map.stopPractice", { defaultValue: "Stage {{n}}, {{name}}: practice questions only, nothing to master here yet.", n: st.stage, name: stageName(t, st.stage) })
                        : !st.skills
                        ? t("journey.map.stopEmpty", { defaultValue: "Stage {{n}}, {{name}}: no questions here yet.", n: st.stage, name: stageName(t, st.stage) })
                        : t("journey.map.stop", {
                          defaultValue: "Stage {{n}}, {{name}} ({{what}}): {{m}} of {{k}} skills mastered, {{a}} tried.",
                          n: st.stage, name: stageName(t, st.stage), what: stageText(t, st.stage), m: st.mastered, k: st.skills, a: st.attempted,
                        });
                      return (
                        <li key={st.stage} className={s.stop} data-state={state} data-here={here || undefined} style={{ "--p": pct }}>
                          <span className={s.dot} aria-hidden="true"><span>{st.stage}</span></span>
                          <span className={s.count} aria-hidden="true">
                            {state === "practice" ? t("journey.map.practice", "practice") : `${st.mastered}/${st.skills}`}
                          </span>
                          <span className={s.srOnly}>{said}{here ? ` ${t("journey.map.youAreHere", "You are here.")}` : ""}</span>
                        </li>
                      );
                    })}
                  </ol>
                </li>
              );
            })}
          </ul>
          <ul className={s.mapKey} aria-hidden="true">
            <li><span className={s.keyDot} data-k="full" /> {t("journey.map.keyMastered", "Mastered")}</li>
            <li><span className={s.keyDot} data-k="tried" /> {t("journey.map.keyTried", "Tried")}</li>
            <li><span className={s.keyDot} /> {t("journey.map.keyAhead", "Still ahead")}</li>
            <li><span className={s.keyDot} data-k="here" /> {t("journey.map.keyHere", "Furthest so far")}</li>
            {subjects.some((sj) => sj.stages.some((st) => !st.skills && st.practiceOnly)) && (
              <li><span className={s.keyDot} data-k="practice" /> {t("journey.map.keyPractice", "Practice only, nothing to master yet")}</li>
            )}
          </ul>
        </>
      )}
    </section>
  );
}
