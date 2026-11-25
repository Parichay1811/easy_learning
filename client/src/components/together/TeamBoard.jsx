import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { words } from "../../pages/together/words";
import s from "./together.module.css";

/**
 * The teams of one match or class quest as bars towards each team's goal. Teams only:
 * there is no list of children here. `mine` marks the reader's (child's) team.
 */
export default function TeamBoard({ teams, mine }) {
  const { t } = useTranslation();
  const w = useMemo(() => words(t), [t]);
  return (
    <ul className={s.teams}>
      {teams.map((tm) => (
        <li key={tm.key} className={s.team}>
          <span className={s.teamName}>
            <span aria-hidden="true">{tm.emoji}</span> {teams.length === 1 ? t("together.team.class", "Our class") : w.team(tm.key)}
            {mine === tm.key && teams.length > 1 && <span className={s.teamMine}>{t("interests.theirTeam", "their team")}</span>}
          </span>
          <span className={s.teamBar} role="progressbar" aria-valuemin={0} aria-valuemax={tm.goal} aria-valuenow={Math.min(tm.goal, tm.stars)} aria-label={`${w.team(tm.key)}: ${tm.stars} / ${tm.goal}`}>
            <span className={s.teamFill} style={{ background: tm.color, transform: `scaleX(${Math.max(0.02, tm.progress)})` }} />
          </span>
          <span className={s.teamNum}>{tm.reached ? "🏆 " : "⭐ "}{tm.stars} / {tm.goal}{tm.firstFlag ? " 🚩" : ""}</span>
        </li>
      ))}
    </ul>
  );
}
