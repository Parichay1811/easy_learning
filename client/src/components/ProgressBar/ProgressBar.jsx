import { useTranslation } from "react-i18next";
import styles from "./ProgressBar.module.css";

// Where the child is in the round: a track of steps, the done ones filled.
const ProgressBar = ({ current, total }) => {
  const { t } = useTranslation();
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div
      className={styles.wrapper}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={t("progressBar.label", { defaultValue: "Question {{current}} of {{total}}", current, total })}
    >
      <span className={styles.label}>{current}<span className={styles.of}>/{total}</span></span>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
        {total > 1 && total <= 12 && (
          <div className={styles.steps} aria-hidden="true">
            {Array.from({ length: total - 1 }, (_, i) => <span key={i} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;
