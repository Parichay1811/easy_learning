import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { narrate, stopNarration, onNarration } from "../../utils/narrator";
import { useVoiceBarHost } from "../VoiceBar/useNarration";

/**
 * The language a translated text is really shown in: the site language when
 * that language has the key, otherwise English (t() fell back to the English
 * default). Speech must follow the words on screen, never the site setting,
 * so an untranslated English text is never read by a German voice.
 */
export function shownLang(i18n, key) {
  const lng = String(i18n.resolvedLanguage || i18n.language || "en");
  if (lng.startsWith("en")) return "en";
  try {
    return i18n.getResource(lng, "translation", key) != null ? lng : "en";
  } catch {
    return "en";
  }
}

const IDLE = { speaking: false, sentence: "", index: -1, source: null, noVoice: false, key: null };

/**
 * Plays a text with the site's own narrator (utils/narrator.js: the AI
 * Teacher's voice, else the device's voice for that language) as if the
 * visitor pressed a Listen button (`user: true`), and follows that one
 * narration for captions: { speaking, sentence, index, source, noVoice, key }.
 *
 * While it speaks, the component shows its own captions, so the floating voice
 * bar steps aside (useVoiceBarHost). It stops when the component goes away or
 * the site language changes.
 *
 * strict (default): when the device has no voice for the language, the one
 * sentence the browser was about to say is cancelled at once and `noVoice` is
 * set, so the page shows the words instead. Never a wrong-language voice.
 */
export function useDemoVoice({ strict = true } = {}) {
  const { i18n } = useTranslation();
  const [state, setState] = useState(IDLE);
  const mine = useRef(null); // the id of the narration this component started
  const waiting = useRef(false); // the next "start" event is ours

  useEffect(() => onNarration((e) => {
    if (e.type === "start" && waiting.current) {
      waiting.current = false;
      mine.current = e.id;
      return;
    }
    if (mine.current == null || e.id !== mine.current) return;
    if (e.type === "sentence") {
      setState((s) => ({ ...s, speaking: true, sentence: e.text, index: e.index, source: e.source, noVoice: s.noVoice || e.source === "none" }));
    } else if (e.type === "end") {
      mine.current = null;
      setState((s) => ({ ...s, speaking: false, index: -1, source: e.source || s.source, noVoice: s.noVoice || e.source === "none" }));
    }
  }), []);

  // A new site language, or leaving the page: stop what this component said.
  useEffect(() => () => {
    if (mine.current != null) stopNarration();
  }, [i18n.language]);

  useVoiceBarHost(state.speaking);

  const play = useCallback((text, { lang = "en-US", key = null } = {}) => {
    setState({ ...IDLE, speaking: true, key });
    waiting.current = true;
    const done = narrate(text, {
      lang,
      user: true,
      onNoVoice: () => {
        setState((s) => ({ ...s, noVoice: true }));
        // The narrator calls this just before handing the sentence to the
        // browser without a voice of that language; cancel it right after.
        if (strict) queueMicrotask(() => stopNarration());
      },
    });
    // narrate() announces its start synchronously; if it did not (nothing to
    // say), nothing of ours is playing.
    if (waiting.current) {
      waiting.current = false;
      setState((s) => ({ ...s, speaking: false }));
    }
    return done;
  }, [strict]);

  const stop = useCallback(() => {
    if (mine.current != null) stopNarration();
  }, []);

  return { ...state, play, stop };
}
