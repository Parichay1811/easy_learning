import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FaUserFriends, FaPlayCircle } from "react-icons/fa";
import { journeyFetch, signedIn } from "../journey/journeyApi";
import { words } from "../../pages/together/words";
import { sfx } from "../../utils/sounds";
import s from "./shortcuts.module.css";

/**
 * One tap from Home to what is waiting with other learners: a round a friend left for
 * you, a friend request, your team's bar, a new award. And always one tap to Together and
 * Shorts (on a phone the menu would be two). Shows nothing to a visitor.
 */
export default function TogetherShortcuts() {
  const { t } = useTranslation();
  const w = useMemo(() => words(t), [t]);
  const navigate = useNavigate();
  const [sum, setSum] = useState(null);
  const on = signedIn();
  useEffect(() => {
    if (!on) return undefined;
    let live = true;
    journeyFetch("/social/summary").then((r) => { if (live && r.ok) setSum(r); });
    return () => { live = false; };
  }, [on]);
  if (!on) return null;
  const go = (to) => { sfx.forward(); navigate(to); };
  // A phone has room for one waiting thing beside Together and Shorts.
  const narrow = typeof window !== "undefined" && window.matchMedia?.("(max-width: 700px)").matches;
  const items = [];
  if (sum?.round) items.push({ key: "round", emoji: "▶️", tone: s.go, to: `/together/round/${sum.round.id}`, text: sum.round.with ? t("shortcuts.round", { defaultValue: "{{name}} is waiting: play!", name: w.who(sum.round.with) }) : t("shortcuts.roundMystery", "A round is waiting: play!") });
  if (sum?.ceremony) items.push({ key: "award", emoji: "🏆", tone: s.gold, to: "/together?tab=team", text: t("shortcuts.award", "Your team award is here!") });
  else if (sum?.team) items.push({ key: "team", emoji: sum.team.emoji || "🚩", tone: s.team, to: "/together?tab=team", text: sum.team.reached ? t("shortcuts.teamReached", "Your team reached its goal!") : t("shortcuts.team", { defaultValue_one: "Your team: {{count}} star to the flag", defaultValue_other: "Your team: {{count}} stars to the flag", count: sum.team.left }) });
  if (sum?.requests) items.push({ key: "req", emoji: "👋", tone: s.pink, to: "/together", text: t("shortcuts.requests", { defaultValue_one: "{{count}} friend request", defaultValue_other: "{{count}} friend requests", count: sum.requests }) });
  if (sum?.cheers) items.push({ key: "cheer", emoji: "💛", tone: s.pink, to: "/together", text: t("shortcuts.cheers", { defaultValue_one: "{{count}} cheer for you", defaultValue_other: "{{count}} cheers for you", count: sum.cheers }) });
  return (
    <div className={s.strip}>
      {items.slice(0, narrow ? 1 : 2).map((it) => (
        <button key={it.key} type="button" className={`${s.chip} ${it.tone}`} onClick={() => go(it.to)} data-sound="none">
          <span aria-hidden="true">{it.emoji}</span><span className={s.text}>{it.text}</span>
        </button>
      ))}
      <button type="button" className={`${s.chip} ${s.plain} ${items.length ? s.small : ""}`} onClick={() => go("/together")} data-sound="none" aria-label={t("navbar.together", "Together")}><FaUserFriends aria-hidden="true" /><span className={s.text}>{t("navbar.together", "Together")}</span></button>
      <button type="button" className={`${s.chip} ${s.plain} ${items.length ? s.small : ""}`} onClick={() => go("/shorts")} data-sound="none" aria-label={t("navbar.shorts", "Shorts")}><FaPlayCircle aria-hidden="true" /><span className={s.text}>{t("navbar.shorts", "Shorts")}</span></button>
    </div>
  );
}
