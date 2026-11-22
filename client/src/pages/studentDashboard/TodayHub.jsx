import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCompass, FaRoute, FaStar } from "react-icons/fa";
import WelcomeBack from "../../components/journey/WelcomeBack";
import NextUpList from "../../components/journey/NextUpList";
import JourneyMap from "../../components/journey/JourneyMap";
import DiscoveryCard from "../../components/journey/DiscoveryCard";
import GrowthShelf from "../../components/journey/GrowthShelf";
import { discoveryDone } from "../../components/journey/journeyApi";
import { isGrowth } from "../../components/journey/words";
import { usePrefs } from "../../components/settings/usePrefs";
import { reducedMotion } from "../../utils/learnerPrefs";
import TabBar from "./TabBar";
import { useMedia } from "./hooks";
import h from "./TodayHub.module.css";

/**
 * The "Today" hub (the student dashboard's first view, contract §3): the
 * welcome-back message with Continue / Review / Something new, the main
 * recommendation and "What next?", today's quick discovery, the journey map
 * (stages 0-5 per subject) and the growth badges. The learner's numbers (XP,
 * stars, streak, today's goal) are one tap away under "My stars".
 *
 * Big screens show the plan, the map and the badges together; phones and
 * tablets show one part at a time (Up next / My journey / My stars), and
 * "Up next" always comes first so the learner can see what to do.
 *
 *   <TodayHub journey={useJourney()} classic={<ClassicOverview … />} achievements={…} … />
 */
export default function TodayHub({ journey, classic, achievements, displayName, now, onGoTab }) {
  const { t } = useTranslation();
  const prefs = usePrefs();
  const wide = useMedia("(orientation: landscape) and (min-width: 1100px) and (min-height: 600px)");
  const [part, setPart] = useState("today");
  const [doneHere] = useState(() => Boolean(discoveryDone()));
  // Answered today (the server's word, or this device's note).
  const doneToday = Boolean(journey.discovery?.answered) || doneHere;
  const calm = reducedMotion(prefs) || Boolean(prefs.focusMode);

  const hasGrowth = (achievements || []).some(isGrowth);
  const hasMap = Boolean(journey.journey);
  const parts = [
    { key: "today", label: t("journey.parts.today", "Up next"), Icon: FaCompass },
    ...(!wide && (hasMap || hasGrowth) ? [{ key: "journey", label: t("journey.parts.journey", "My journey"), Icon: FaRoute }] : []),
    { key: "me", label: t("journey.parts.me", "My stars"), Icon: FaStar },
  ];
  const active = parts.some((p) => p.key === part) ? part : "today";

  const welcome = (
    <WelcomeBack welcome={journey.welcome} name={displayName} calm={calm} compact={!wide} />
  );
  const next = journey.next ? <NextUpList items={journey.next.items} className={h.next} /> : null;
  const discovery = <DiscoveryCard discovery={journey.discovery} done={doneToday} className={h.discovery} />;
  const map = hasMap ? <JourneyMap journey={journey.journey} className={h.map} /> : null;
  const growth = <GrowthShelf achievements={achievements} now={now} onSeeAll={() => onGoTab?.("achievements")} className={h.growth} limit={wide ? 4 : 7} />;

  let body;
  if (active === "me") {
    body = <div className={h.me}>{classic}</div>;
  } else if (active === "journey") {
    body = <div className={h.journeyPart}>{map}{growth}</div>;
  } else if (wide) {
    body = (
      <div className={h.wide}>
        <div className={h.welcomeSlot}>{welcome}</div>
        {next}
        {discovery}
        {map}
        {growth}
      </div>
    );
  } else {
    body = (
      <div className={h.compact}>
        <div className={h.welcomeSlot}>{welcome}</div>
        {next}
        {discovery}
      </div>
    );
  }

  return (
    <div className={h.hub} data-layout={wide ? "wide" : "compact"} data-today-hub="">
      <TabBar
        variant="seg"
        tabs={parts}
        active={active}
        onChange={setPart}
        idPrefix="sd-today"
        label={t("journey.parts.label", "Today")}
        className={h.seg}
      />
      <div
        role="tabpanel"
        id={`sd-today-panel-${active}`}
        aria-labelledby={`sd-today-tab-${active}`}
        className={h.part}
        data-part={active}
      >
        {body}
      </div>
    </div>
  );
}
