import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "../components/SEO/SEO";
import styles from "./Pricing.module.css";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/$/, "");

// Who each audience is, where its button leads, and what it costs. Prices are
// decided with billing; until then paid plans say "Talk to us" and free ones say Free.
const AUDIENCES = [
  { key: "family", plans: ["free", "family_plus"], emoji: "👨‍👩‍👧", cta: "/parent-login" },
  { key: "solo", plans: ["solo_free", "solo_pro"], emoji: "🧑‍🏫", cta: "/teacher-login" },
  { key: "institute", plans: ["institute", "enterprise"], emoji: "🏫", cta: "/contact-us" },
];
const FREE = new Set(["free", "solo_free"]);

// Used if the API cannot be reached, so the page never looks broken.
const FALLBACK = {
  free: { label: "Free", modules: ["Learning modules and games", "AI Teacher", "Link a parent and their children", "Progress overview (last 90 days)"] },
  family_plus: { label: "Family Plus", modules: ["Everything in Free", "Full history, skill maps, patterns and yearly views"] },
  solo_free: { label: "Solo Free", modules: ["Groups of students", "Tests with rules", "Write and import your own questions"], limits: { groups: 1, students: 15 } },
  solo_pro: { label: "Solo Pro", modules: ["Everything in Solo Free", "Unlimited groups and students", "Reports with your logo", "Mark typed and spoken answers"] },
  institute: { label: "Institute", modules: ["Campus, grade and section structure", "School-wide analytics", "Coordinators and staff roles", "Messaging policies and office hours"] },
  enterprise: { label: "Enterprise", modules: ["Everything in Institute", "Several campuses and single sign-on", "Data export and API"] },
};

export default function Pricing() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState(null);
  const [audience, setAudience] = useState("family");

  useEffect(() => {
    let live = true;
    fetch(`${API}/plans`).then((r) => r.json()).then((d) => { if (live && d.plans) setPlans(Object.fromEntries(d.plans.map((p) => [p.id, { label: p.label, limits: p.limits, modules: p.modules.map((m) => m.label) }]))); }).catch(() => {});
    return () => { live = false; };
  }, []);

  const data = plans || FALLBACK;
  const current = useMemo(() => AUDIENCES.find((a) => a.key === audience), [audience]);
  const copy = {
    family: [t("pricing.family.title", { defaultValue: "For families" }), t("pricing.family.text", { defaultValue: "Learn for free. Link your child and see how they are doing, day by day, week by week and over the whole year." })],
    solo: [t("pricing.solo.title", { defaultValue: "For private teachers" }), t("pricing.solo.text", { defaultValue: "Run your own groups, set tests and see every student's progress. Start free, grow when you are ready." })],
    institute: [t("pricing.institute.title", { defaultValue: "For schools and institutes" }), t("pricing.institute.text", { defaultValue: "Build your school's structure, add teachers and students, and see performance at every level, from the whole school to one learner." })],
  }[audience];

  return (
    <main className={styles.page}>
      <SEO path="/pricing" />
      <section className={styles.hero}>
        <span className={styles.eyebrow}>{t("pricing.eyebrow", { defaultValue: "Plans" })}</span>
        <h1>{t("pricing.title", { defaultValue: "One platform. Use it your way." })}</h1>
        <p>{t("pricing.subtitle", { defaultValue: "Families, private teachers and whole schools all learn on the same Learnigo. Choose what fits you." })}</p>
        <div className={styles.tabs} role="tablist" aria-label={t("pricing.audience", { defaultValue: "Who is it for?" })}>
          {AUDIENCES.map((a) => (
            <button key={a.key} role="tab" aria-selected={audience === a.key} className={audience === a.key ? styles.tabOn : styles.tab} onClick={() => setAudience(a.key)}>
              <span aria-hidden="true">{a.emoji}</span> {a.key === "family" ? t("pricing.tab.family", { defaultValue: "Families" }) : a.key === "solo" ? t("pricing.tab.solo", { defaultValue: "Teachers" }) : t("pricing.tab.institute", { defaultValue: "Schools" })}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.panel} role="tabpanel">
        <h2>{copy[0]}</h2>
        <p className={styles.lead}>{copy[1]}</p>
        <div className={styles.cards}>
          {current.plans.map((id, i) => {
            const p = data[id];
            if (!p) return null;
            return (
              <article key={id} className={`${styles.card} ${i === 1 ? styles.featured : ""}`}>
                <h3>{id === "free" ? t("pricing.everyone", { defaultValue: "For everyone" }) : p.label}</h3>
                <p className={styles.price}>{FREE.has(id) || id === "free" ? t("pricing.free", { defaultValue: "Free" }) : t("pricing.talk", { defaultValue: "Talk to us" })}</p>
                {p.limits && (p.limits.groups || p.limits.students) ? (
                  <p className={styles.limits}>{t("pricing.limits", { defaultValue: "{{groups}} group, up to {{students}} students", groups: p.limits.groups, students: p.limits.students })}</p>
                ) : null}
                <ul>
                  {p.modules.map((m) => <li key={m}>{m}</li>)}
                </ul>
                <Link to={current.cta} className={styles.button}>
                  {id === "free" || id === "solo_free" ? t("pricing.start", { defaultValue: "Get started" }) : t("pricing.contact", { defaultValue: "Contact us" })}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.note}>
        <p>{t("pricing.note", { defaultValue: "Learnigo is an educational practice platform, not a diagnostic or medical service. Questions? Write to us any time." })} <Link to="/contact-us">{t("pricing.writeUs", { defaultValue: "Contact us" })}</Link></p>
      </section>
    </main>
  );
}
