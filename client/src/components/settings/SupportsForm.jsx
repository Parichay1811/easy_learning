import { useId } from "react";
import { useTranslation } from "react-i18next";
import { FaVolumeUp, FaMusic, FaCheck } from "react-icons/fa";
import "@fontsource/lexend/400.css";
import "@fontsource/opendyslexic/400.css";
import { PREF_FIELDS, PRESETS, DEFAULT_PREFS, sanitizePrefs } from "../../utils/learnerPrefs";
import { narrate } from "../../utils/narrator";
import { previewSound } from "../../utils/sounds";
import { getSpeechLang } from "../../utils/speechLang";
import {
  GROUP_ORDER, groupTitle, fieldLabel, fieldHelp, optionLabel, rangeText,
  PRESET_ORDER, presetLabel, presetHelp,
} from "./prefText";
import s from "./SupportsForm.module.css";

const presetOn = (prefs, name) => Object.entries(PRESETS[name] || {}).every(([k, v]) => prefs[k] === v);

/**
 * Every comfort setting for one learner, grouped, each with a one-line plain
 * explanation. It only renders a prefs object and reports changes: it stores
 * nothing, so the learner's own settings sheet (which saves to this browser and
 * their profile) and the parent/teacher learning-plan editor (which saves to the
 * child's plan) can both use it.
 *
 *   <SupportsForm value={supports} onChange={setSupports} />
 *
 * Props:
 *  - value      the settings (missing keys take their defaults)
 *  - onChange   called with (the whole new settings object, just the keys that changed)
 *  - presets    show the one-tap presets (default true)
 *  - preview    show the reading preview and the voice/sound samples (default true)
 *  - groups     which groups to show, in order (default: all)
 *  - disabled   read-only
 *  - previewVoice  play the voice sample on "Hear the voice" (default true)
 */
export function SupportsForm({ value, onChange, presets = true, preview = true, groups = GROUP_ORDER, disabled = false, previewVoice = true, className = "" }) {
  const { t, i18n } = useTranslation();
  const uid = useId();
  const prefs = sanitizePrefs(value);
  // onChange(next, patch): the whole new object, and just what changed.
  const set = (patch) => { if (!disabled) onChange?.(sanitizePrefs({ ...prefs, ...patch }), patch); };

  const togglePreset = (name) => {
    if (presetOn(prefs, name)) {
      // Pressed again: those settings go back to how they start.
      set(Object.fromEntries(Object.keys(PRESETS[name]).map((k) => [k, DEFAULT_PREFS[k]])));
    } else {
      set(PRESETS[name]);
    }
  };

  const hearVoice = () => {
    if (!previewVoice) return;
    narrate(t("prefs.sample.voice", "Hello! This is how fast I will talk. You can change it any time."), {
      lang: getSpeechLang(i18n.language || "en"),
      rate: prefs.voiceRate,
      user: true,
    });
  };

  const field = (f) => {
    const id = `${uid}-${f.key}`;
    const labelId = `${id}-label`;
    const helpId = `${id}-help`;
    const text = (
      <span className={s.text}>
        <span id={labelId} className={s.label}>{fieldLabel(t, f.key)}</span>
        <span id={helpId} className={s.help}>{fieldHelp(t, f.key)}</span>
      </span>
    );
    if (f.type === "bool") {
      const on = Boolean(prefs[f.key]);
      return (
        <div key={f.key} className={s.row} data-field={f.key}>
          {text}
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-labelledby={labelId}
            aria-describedby={helpId}
            className={`${s.switch} ${on ? s.switchOn : ""}`}
            onClick={() => set({ [f.key]: !on })}
            disabled={disabled}
            data-sound="toggle"
          >
            <span className={s.knob} aria-hidden="true">{on ? <FaCheck /> : null}</span>
            <span className={s.switchWord} aria-hidden="true">{on ? t("prefs.on", "On") : t("prefs.off", "Off")}</span>
          </button>
        </div>
      );
    }
    if (f.type === "choice") {
      return (
        <div key={f.key} className={`${s.row} ${s.stack}`} data-field={f.key}>
          {text}
          <div role="radiogroup" aria-labelledby={labelId} aria-describedby={helpId} className={s.segments}>
            {f.options.map((o) => {
              const checked = prefs[f.key] === o;
              return (
                <label key={String(o)} className={`${s.seg} ${checked ? s.segOn : ""}`} data-font-option={f.key === "font" ? o : undefined}>
                  <input
                    type="radio"
                    className={s.radio}
                    name={`${id}-radio`}
                    value={String(o)}
                    checked={checked}
                    disabled={disabled}
                    onChange={() => set({ [f.key]: o })}
                  />
                  <span className={s.segText} data-font-sample={f.key === "font" ? "" : undefined}>{optionLabel(t, f.key, o)}</span>
                </label>
              );
            })}
          </div>
        </div>
      );
    }
    // range
    const v = prefs[f.key];
    const words = rangeText(t, f.key, v);
    return (
      <div key={f.key} className={`${s.row} ${s.stack}`} data-field={f.key}>
        {text}
        <div className={s.rangeRow}>
          <input
            id={id}
            type="range"
            className={s.range}
            min={f.min}
            max={f.max}
            step={f.step}
            value={v}
            disabled={disabled}
            aria-labelledby={labelId}
            aria-describedby={helpId}
            aria-valuetext={words}
            onChange={(e) => set({ [f.key]: Number(e.target.value) })}
            style={{ "--fill": `${((v - f.min) / (f.max - f.min)) * 100}%` }}
          />
          <output htmlFor={id} className={s.rangeValue}>{words}</output>
        </div>
      </div>
    );
  };

  const previewBox = (
    <div
      className={s.preview}
      data-font={prefs.font}
      data-spacing={prefs.spacing}
      data-contrast={prefs.contrast}
      style={{ "--sf-scale": prefs.textScale }}
    >
      <span className={s.previewTag}>{t("prefs.preview", "Preview")}</span>
      <p className={s.previewText} data-font-sample="">{t("prefs.sample.text", "The little fox jumped over the log. 3 + 4 = 7")}</p>
    </div>
  );

  return (
    <div className={`${s.form} ${className}`}>
      {presets && (
        <section className={s.presets} aria-labelledby={`${uid}-presets`}>
          <h3 id={`${uid}-presets`} className={s.groupTitle}>{t("prefs.presetsTitle", "Quick choices")}</h3>
          <p className={s.groupHelp}>{t("prefs.presetsHelp", "One tap changes a few settings together. You can still change each one below.")}</p>
          <div className={s.presetGrid}>
            {PRESET_ORDER.filter((n) => PRESETS[n]).map((name) => {
              const on = presetOn(prefs, name);
              return (
                <button
                  key={name}
                  type="button"
                  className={`${s.preset} ${on ? s.presetOn : ""}`}
                  aria-pressed={on}
                  onClick={() => togglePreset(name)}
                  disabled={disabled}
                  data-sound="toggle"
                >
                  <span className={s.presetName}>{on && <FaCheck aria-hidden="true" />} {presetLabel(t, name)}</span>
                  <span className={s.presetHelp}>{presetHelp(t, name)}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {groups.map((g) => {
        const fields = PREF_FIELDS.filter((f) => f.group === g);
        if (!fields.length) return null;
        return (
          <fieldset key={g} className={s.group} disabled={disabled}>
            <legend className={s.groupTitle}>{groupTitle(t, g)}</legend>
            {preview && g === "reading" && previewBox}
            {fields.map(field)}
            {preview && g === "voice" && previewVoice && (
              <button type="button" className={s.sample} onClick={hearVoice} data-sound="none">
                <FaVolumeUp aria-hidden="true" /> {t("prefs.hearVoice", "Hear the voice")}
              </button>
            )}
            {preview && g === "sound" && (
              <button
                type="button"
                className={s.sample}
                onClick={() => previewSound(prefs.soundVolume)}
                disabled={!prefs.uiSounds}
                data-sound="none"
              >
                <FaMusic aria-hidden="true" /> {t("prefs.trySound", "Try a sound")}
              </button>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}

export default SupportsForm;
