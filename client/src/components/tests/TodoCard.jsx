// "To do" on the learner's home: tests and practice from their teacher (TCH-033).
// Renders nothing for learners without a school/tutor or with nothing assigned.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaClipboardList, FaLeaf, FaCheckCircle, FaPlay } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { sget } from "./studentApi";
import s from "./TodoCard.module.css";

export default function TodoCard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const tt = (k, d, o = {}) => t(`tests.todo.${k}`, { defaultValue: d, ...o });
  const [tests, setTests] = useState(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    sget("/tests").then((r) => { if (alive && r.ok) setTests(r.tests); });
    return () => { alive = false; };
  }, [user]);

  if (!user || !tests || !tests.length) return null;
  const open = tests.filter((x) => x.inProgressId || (x.canStart && !x.finished) || x.phase === "upcoming");
  const recent = tests.filter((x) => x.finished && !open.includes(x)).slice(0, 2);
  const shown = [...open.slice(0, 4), ...recent];
  if (!shown.length) return null;

  const due = (iso) => new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const line = (x) => {
    if (x.inProgressId) return tt("inProgress", "You started this. Carry on!");
    if (x.phase === "upcoming") return tt("opens", "Opens soon");
    if (x.finished) return x.best != null ? tt("score", "Done · {{p}} %", { p: x.best }) : tt("waiting", "Done · waiting for your teacher");
    if (x.progress) return tt("minutes", "{{m}} of {{goal}} minutes", { m: x.progress.minutes, goal: x.progress.goal || "?" });
    if (x.dueAt) return tt("due", "Hand in by {{when}}", { when: due(x.dueAt) });
    return tt("ready", "Ready when you are");
  };

  return (
    <section className={s.card} aria-labelledby="todo-h">
      <h2 id="todo-h" className={s.h}><FaClipboardList aria-hidden="true" /> {tt("title", "To do")}</h2>
      <ul className={s.list}>
        {shown.map((x) => (
          <li key={x._id}>
            <Link to={`/test/${x._id}`} className={s.row}>
              <span className={`${s.icon} ${x.kind === "practice" ? s.iconPractice : ""}`} aria-hidden="true">{x.finished && !x.inProgressId ? <FaCheckCircle /> : x.kind === "practice" ? <FaLeaf /> : <FaClipboardList />}</span>
              <span className={s.text}>
                <span className={s.title}>{x.title}</span>
                <span className={s.sub}>{x.kind === "practice" ? tt("practice", "Practice") : tt("test", "Test")} · {line(x)}</span>
              </span>
              {(x.inProgressId || (x.canStart && !x.finished)) && <span className={s.go}><FaPlay aria-hidden="true" /> {x.inProgressId ? tt("resume", "Carry on") : tt("start", "Start")}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
