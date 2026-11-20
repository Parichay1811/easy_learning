import { useTranslation } from "react-i18next";
import { describeSum } from "./support";
import styles from "./PictureMaths.module.css";

const ITEMS = ["🍎", "⭐", "🐟", "🌸", "🍪"];

/**
 * A small sum drawn with counters: 4 − 1 as four apples with one crossed out,
 * 2 + 3 as two apples and three more, 3 × 2 as three groups of two.
 *
 *   <PictureMaths sum={{ a: 4, b: 1, op: "−", result: 3 }} />
 */
export default function PictureMaths({ sum, seed = 0 }) {
  const { t } = useTranslation();
  if (!sum) return null;
  const { a, b, op } = sum;
  const item = ITEMS[Math.abs(seed) % ITEMS.length];
  const key = op === "+" ? "pictureAdd" : op === "−" ? "pictureTake" : "pictureGroups";
  const label = t(`questionCard.${key}`, { defaultValue: describeSum({ ...sum, result: "{{result}}", a: "{{a}}", b: "{{b}}" }), a, b, result: sum.result });
  const counters = (n, cls = "", key = "") => Array.from({ length: n }, (_, i) => (
    <span key={`${key}${i}`} className={`${styles.item} ${cls}`} style={{ "--i": i }}>{item}</span>
  ));

  let body;
  if (op === "+") {
    body = (
      <>
        <span className={styles.group}>{counters(a, "", "a")}</span>
        <span className={styles.sign}>+</span>
        <span className={`${styles.group} ${styles.more}`}>{counters(b, styles.added, "b")}</span>
      </>
    );
  } else if (op === "−") {
    body = (
      <span className={styles.group}>
        {counters(a - b, "", "k")}
        {counters(b, styles.gone, "g")}
      </span>
    );
  } else {
    body = Array.from({ length: a }, (_, g) => (
      <span key={g} className={`${styles.group} ${styles.boxed}`}>{counters(b, "", `${g}-`)}</span>
    ));
  }
  return (
    <figure className={styles.picture} role="img" aria-label={label}>
      <div className={styles.row} aria-hidden="true">{body}</div>
      <figcaption className={styles.caption} aria-hidden="true">{label}</figcaption>
    </figure>
  );
}
