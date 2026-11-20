import { useTranslation } from "react-i18next";
import { FaCheckCircle, FaSeedling, FaRedo, FaRegCircle } from "react-icons/fa";
import { SUBJECT_META, skillName, skillStateText, skillSubject, subjectName } from "./levels";
import s from "./learning.module.css";

const GLYPH = { mastered: FaCheckCircle, learning: FaSeedling, review_due: FaRedo, new: FaRegCircle };

/**
 * A list of skills: the subject's colour dot, the skill's name, how it is
 * going (an icon and a word, never a score) and an optional action.
 *
 *   <SkillList skills={needsPractice} who="me" action={(sk) => <Link to={practiseHref(sk)}>Practise now</Link>} />
 *
 * Props: skills [{ id | skill, name, subject?, state?, mastery?, misconception? }], who "me" | "them",
 * showState (default true), showSubject (the subject's name under the skill), showMisconception,
 * action(skill) -> node, empty (node shown when the list is empty), label (the list's name), max.
 */
export default function SkillList({ skills = [], who = "me", showState = true, showSubject = false, showMisconception = false, action, empty = null, label, max, className = "" }) {
  const { t } = useTranslation();
  const list = (Array.isArray(skills) ? skills : []).filter(Boolean).slice(0, max || undefined);
  if (!list.length) return empty;
  return (
    <ul className={`${s.skillList} ${className}`} aria-label={label}>
      {list.map((sk, i) => {
        const id = sk.id || sk.skill || `skill-${i}`;
        const subject = skillSubject(sk);
        const meta = SUBJECT_META[subject];
        const Glyph = GLYPH[sk.state];
        const word = showState && sk.state ? skillStateText(t, sk.state, who) : "";
        return (
          <li key={id} className={s.skillRow} style={meta ? { "--sk": meta.color } : undefined}>
            <span className={s.skillDot} aria-hidden="true" />
            <span className={s.skillMain}>
              <span className={s.skillName}>{skillName(t, sk)}</span>
              {(showSubject && subject) || word ? (
                <span className={s.skillMeta}>
                  {showSubject && subject && <span>{subjectName(t, subject)}</span>}
                  {word && (
                    <span className={s.skillState} data-state={sk.state}>
                      {Glyph && <Glyph aria-hidden="true" />} {word}
                    </span>
                  )}
                </span>
              ) : null}
              {showMisconception && sk.misconception && (
                <span className={s.skillHint}>{sk.misconception}</span>
              )}
            </span>
            {action && <span className={s.skillAction}>{action(sk)}</span>}
          </li>
        );
      })}
    </ul>
  );
}
