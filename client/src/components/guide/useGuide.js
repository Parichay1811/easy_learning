// How a page marks "tap this next" for the guide (components/guide/GuideCoach.jsx).
//
//   const guide = useGuide();
//   <button {...guide("home.start", "Tap the big orange button to start learning.")}>
//   <button {...guide("round.next", "Tap Next.", { order: 2, name })}>
//
// The words go through i18n (key `guide.<name>`), and are spoken in the language they are
// actually written in: when a language has no translation yet, the English words are said
// by an English voice, never read out by another language's voice.
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useGuide() {
  const { t, i18n } = useTranslation();
  return useCallback((name, words, { order = 5, ...values } = {}) => {
    const key = `guide.${name}`;
    const lng = String(i18n.language || "en").split("-")[0];
    const translated = lng === "en" || i18n.exists(key, { lng, fallbackLng: [] });
    return {
      "data-guide": name,
      "data-guide-say": t(key, { defaultValue: words, ...values }),
      "data-guide-lang": translated ? lng : "en",
      "data-guide-order": order,
    };
  }, [t, i18n]);
}

export default useGuide;
