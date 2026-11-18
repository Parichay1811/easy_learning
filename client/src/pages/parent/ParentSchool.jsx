import { useTranslation } from "react-i18next";
import { ChartCard, EmptyState, Skeleton } from "../../components/dashboard";
import { AnnouncementsPanel } from "../../components/comms";
import { useLoad } from "./parentApi";
import s from "./parent.module.css";

// PAR-050..053: tests and practice from the child's teachers, released results with the
// teacher's comments, and school notices. Only for a verified link (the server checks).
const fmtWhen = (d, lang) => (d ? new Intl.DateTimeFormat(lang, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(d)) : null);

export default function ParentSchool({ api, child }) {
  const { t, i18n } = useTranslation();
  const T = (k, d, o) => t(`parent.school.${k}`, { defaultValue: d, ...o });
  const tests = useLoad(api.get, `/children/${child._id}/tests`);
  const d = tests.data;
  const status = (r) => ({
    not_started: T("notStarted", "Not started yet"), in_progress: T("inProgress", "Started"), waiting_for_result: T("waiting", "Handed in, waiting for the result"),
  }[r.status] || "");

  return (
    <>
      <ChartCard
        title={T("title", "What is {{name}} working on at school?", { name: child.name })}
        answer={d ? T("answer", "{{open}} to do, {{soon}} coming up, {{done}} results.", { open: d.assigned.length, soon: d.upcoming.length, done: d.results.length }) : undefined}
        loading={tests.loading}
        error={tests.error ? T("error", "We couldn't load school work.") : undefined}
        onRetry={tests.reload}
      >
        {!d ? <Skeleton variant="rect" height={120} /> : (!d.assigned.length && !d.upcoming.length && !d.results.length) ? (
          <EmptyState compact title={T("empty", "Nothing from teachers yet")} text={T("emptyText", "When a teacher sets a test or practice for {{name}}, it shows up here with the dates and, later, the result.", { name: child.name })} />
        ) : (
          <div className={s.schoolLists}>
            {[...d.assigned, ...d.upcoming].length > 0 && (
              <section>
                <h3 className={s.schoolHeading}>{T("todo", "To do and coming up")}</h3>
                <ul className={s.schoolList}>
                  {[...d.assigned, ...d.upcoming].map((r) => (
                    <li key={r.testId} className={s.schoolItem}>
                      <strong>{r.title || T("untitled", "Untitled test")}</strong>
                      <span className={s.schoolMeta}>
                        {r.teacher && `${r.teacher} · `}
                        {r.phase === "upcoming" && r.opensAt ? T("opens", "Opens {{when}}", { when: fmtWhen(r.opensAt, i18n.language) })
                          : r.closesAt ? T("closes", "Due {{when}}", { when: fmtWhen(r.closesAt, i18n.language) }) : T("noDeadline", "No deadline")}
                      </span>
                      {status(r) && <span className={s.schoolStatus}>{status(r)}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {d.results.length > 0 && (
              <section>
                <h3 className={s.schoolHeading}>{T("results", "Results")}</h3>
                <ul className={s.schoolList}>
                  {d.results.map((r) => (
                    <li key={r.testId} className={s.schoolItem}>
                      <strong>{r.title || T("untitled", "Untitled test")}</strong>
                      <span className={s.schoolMeta}>{r.teacher && `${r.teacher} · `}{fmtWhen(r.submittedAt, i18n.language)}</span>
                      <span className={s.schoolScore}>
                        {r.needsMarking ? T("marking", "Being marked") : r.percent != null ? `${Math.round(r.percent)} %` : "—"}
                        {r.passed === true && ` · ${T("passed", "passed")}`}
                        {r.late && ` · ${T("late", "handed in late")}`}
                      </span>
                      {r.comments?.length > 0 && <p className={s.schoolComment}>“{r.comments.join(" ")}”</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </ChartCard>
      <AnnouncementsPanel role="parent" compact title={T("notices", "Notices from school")} />
    </>
  );
}
