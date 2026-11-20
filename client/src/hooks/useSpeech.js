import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getSpeechLang } from "../utils/speechLang";
import { getQuestionLang } from "../utils/questionLang";
import { narrate, stopNarration } from "../utils/narrator";

// Shared voice + SpeechRecognition wiring for the question card ("Read to
// me", "Listen", hints and feedback) and speech-graded interactions (the
// mic_record widget). Everything is said through the site's narrator
// (utils/narrator.js): the AI teacher's voice, at the learner's own speed,
// with maths made speakable.
export function useSpeech(subject) {
  const { i18n } = useTranslation();
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      stopNarration();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  // The language to speak and listen in. A question says which language its
  // spoken text is in (`audio_lang`, set by the server): that always wins, so
  // the voice matches the words. Otherwise English lessons are English, and
  // the rest follow the site's language.
  const speechLangFor = (textLang) => {
    if (textLang) return getSpeechLang(String(textLang).split("-")[0].toLowerCase());
    const useEnglish = subject === "english" || getQuestionLang(i18n.language) === "en";
    return useEnglish ? "en-US" : getSpeechLang(i18n.language);
  };

  // speak(text | [parts], { lang?, user?, caption?, queue?, onStart?, onEnd?, onError?, onNoVoice? })
  // `user: true` when the learner pressed something to hear it (spoken even
  // when the teacher's voice is set not to speak by herself).
  const speak = (text, { lang, ...opts } = {}) => narrate(text, { ...opts, lang: speechLangFor(lang) });

  /**
   * Listens once and resolves with what was heard:
   *  { transcript, alternatives, confidence }   something was said
   *  { error: "not-allowed" | "no-speech" | "audio-capture" | "network" | … }
   *  { unsupported: true }                     this browser cannot transcribe
   * It never rejects: a problem is an answer the card can be kind about.
   */
  const recognizeSpeech = (lang) =>
    new Promise((resolve) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { resolve({ unsupported: true }); return; }

      let rec;
      try {
        rec = new SR();
      } catch {
        resolve({ unsupported: true });
        return;
      }
      rec.lang = speechLangFor(lang);
      rec.interimResults = false;
      rec.maxAlternatives = 5;
      recognitionRef.current = rec;

      let settled = false;
      const done = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      rec.onresult = (e) => {
        const res = e.results?.[0];
        const alts = res ? Array.from(res).map((a) => a.transcript).filter(Boolean) : [];
        done({ transcript: alts[0] || "", alternatives: alts.slice(1), confidence: res?.[0]?.confidence ?? null });
      };
      rec.onerror = (e) => done({ error: e?.error || "error" });
      rec.onend = () => {
        recognitionRef.current = null;
        done({ error: "no-speech" });
      };
      try {
        rec.start();
      } catch (e) {
        recognitionRef.current = null;
        done({ error: e?.name === "NotAllowedError" ? "not-allowed" : "start-failed" });
      }
    });

  const stopRecognition = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  return { speak, recognizeSpeech, stopRecognition, speechLangFor };
}
