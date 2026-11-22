import { useId } from "react";
import { useTranslation } from "react-i18next";
import { FaChartBar, FaLightbulb, FaInfoCircle } from "react-icons/fa";
import shell from "./Landing.module.css";
import styles from "./ParentExample.module.css";

// Made-up numbers for the illustration (the shape of the real evidence view:
// baseline vs now, on their own vs with help, a weekly insight). Every number
// the insight sentence quotes is one of these.
const BASE = { level: 1, right: 6, of: 10 };
const NOW = { level: 2, right: 16, of: 20 };
const WEEKS = [
  { own: 8, help: 6 },
  { own: 10, help: 5 },
  { own: 11, help: 4 },
  { own: 13, help: 3 },
];
const MAX = Math.max(...WEEKS.map((w) => w.own + w.help));

/**
 * What a parent sees: a small static illustration of the evidence panel,
 * clearly labelled as example data (no real child, no real results).
 */
export default function ParentExample() {
  const { t } = useTranslation();
  const uid = useId();
  const week = (n) => t("landing.parent.week", { defaultValue: "Week {{n}}", n });
  const last = WEEKS[WEEKS.length - 1];
  const first = WEEKS[0];

  return (
    <section id="landing-parents" className={`${shell.section} ${shell.rise}`} aria-labelledby={`${uid}-title`}>
      <div className={shell.head}>
        <p className={shell.eyebrow}><FaChartBar aria-hidden="true" /> {t("landing.parent.eyebrow", "For parents and teachers")}</p>
        <h2 id={`${uid}-title`} className={shell.title}>{t("landing.parent.title", "What a parent sees")}</h2>
        <p className={shell.lead}>
          {t("landing.parent.lead", "Parents and teachers see evidence of learning, not time spent on screen. This is an illustration of that view, with made-up numbers.")}
        </p>
      </div>

      <figure className={styles.dash} aria-labelledby={`${uid}-cap`}>
        <div className={styles.dashHead}>
          <div>
            <p className={styles.child}>{t("landing.parent.child", "Sam · Science")}</p>
            <p className={styles.childSub}>{t("landing.parent.childSub", "An example learner, not a real child")}</p>
          </div>
          <span className={styles.example}>{t("landing.parent.badge", "Example data")}</span>
        </div>

        <div className={styles.blocks}>
          <div className={styles.block}>
            <h3 className={styles.blockTitle}>{t("landing.parent.baselineTitle", "Where Sam started, and now")}</h3>
            <dl className={styles.compare}>
              {[
                ["start", t("landing.parent.start", "At the start"), BASE, t("landing.parent.startDetail", { defaultValue: "Level {{level}} · {{right}} of the first {{of}} answers right", ...BASE })],
                ["now", t("landing.parent.now", "Now"), NOW, t("landing.parent.nowDetail", { defaultValue: "Level {{level}} · {{right}} of the last {{of}} answers right", ...NOW })],
              ].map(([k, label, v, detail]) => (
                <div key={k} className={styles.compareRow}>
                  <dt className={styles.compareLabel}>{label}</dt>
                  <dd className={styles.compareValue}>
                    <span className={styles.compareText}>{detail}</span>
                    <span className={styles.track} aria-hidden="true">
                      <span className={`${styles.fill} ${k === "now" ? styles.fillNow : ""}`} style={{ width: `${Math.round((v.right / v.of) * 100)}%` }} />
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className={styles.note}>{t("landing.parent.baselineNote", "The starting point is the placement check, or the first 10 answers in a subject.")}</p>
          </div>

          <div className={styles.block}>
            <h3 className={styles.blockTitle}>{t("landing.parent.helpTitle", "On their own, or with help")}</h3>
            <ul className={styles.legend}>
              <li><span className={`${styles.swatch} ${styles.own}`} aria-hidden="true" />{t("landing.parent.own", "On their own")}</li>
              <li><span className={`${styles.swatch} ${styles.help}`} aria-hidden="true" />{t("landing.parent.help", "With a hint or help")}</li>
            </ul>
            <div className={styles.bars} aria-hidden="true">
              {WEEKS.map((w, i) => (
                <div key={i} className={styles.barCol} title={`${week(i + 1)}: ${w.own} / ${w.help}`}>
                  <div className={styles.barStack} style={{ height: `${Math.round(((w.own + w.help) / MAX) * 100)}%` }}>
                    <span className={`${styles.seg} ${styles.help}`} style={{ flexGrow: w.help }} />
                    <span className={`${styles.seg} ${styles.own}`} style={{ flexGrow: w.own }} />
                    {i === WEEKS.length - 1 && (
                      <span className={styles.values}>
                        <span style={{ flexGrow: w.help }}>{w.help}</span>
                        <span style={{ flexGrow: w.own }}>{w.own}</span>
                      </span>
                    )}
                  </div>
                  <span className={styles.barLabel}>{week(i + 1)}</span>
                </div>
              ))}
            </div>
            <div className={shell.srOnly}>
            <table>
              <caption>{t("landing.parent.tableCaption", "Questions answered each week (example data)")}</caption>
              <thead>
                <tr>
                  <th scope="col">{t("landing.parent.weekCol", "Week")}</th>
                  <th scope="col">{t("landing.parent.own", "On their own")}</th>
                  <th scope="col">{t("landing.parent.help", "With a hint or help")}</th>
                </tr>
              </thead>
              <tbody>
                {WEEKS.map((w, i) => (
                  <tr key={i}><th scope="row">{week(i + 1)}</th><td>{w.own}</td><td>{w.help}</td></tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <div className={`${styles.block} ${styles.insight}`}>
            <h3 className={styles.blockTitle}><FaLightbulb aria-hidden="true" className={styles.bulb} /> {t("landing.parent.insightTitle", "This week's insight")}</h3>
            <p className={styles.insightText}>
              {t("landing.parent.insight", {
                defaultValue: "This week Sam answered {{own}} of {{total}} science questions on their own, up from {{own1}} of {{total1}} in week 1. A mix-up about melting came up twice and was cleared up both times.",
                own: last.own, total: last.own + last.help, own1: first.own, total1: first.own + first.help,
              })}
            </p>
          </div>
        </div>

        <figcaption id={`${uid}-cap`} className={styles.caption}>
          <FaInfoCircle aria-hidden="true" className={styles.captionIcon} />
          <span>
            {t("landing.parent.caption", "Example data: an illustration of the parent view, not real results. In the app, every insight sentence is built from recorded numbers. Time on screen is never shown as success, and there are no IQ-like scores.")}
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
