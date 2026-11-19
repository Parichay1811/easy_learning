import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getSpeechLang } from "../utils/speechLang";
import { getQuestionLang } from "../utils/questionLang";
import { narrate, stopNarration } from "../utils/narrator";

// Speaks `text` through the site's narrator (utils/narrator.js): the natural
// server voice, or the browser's best voice for the language. A little slower
// than normal for young readers.
function speakText(text, langCode, callbacks = {}) {
  narrate(text, { rate: 0.85, ...callbacks, lang: langCode });
}

// Shared TTS + SpeechRecognition wiring for question audio playback
// (QuestionCard's "Listen" button) and speech-graded interactions
// (the mic_record widget).
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

  // speak(text, { lang?, onStart?, onEnd?, onError? })
  const speak = (text, { lang, ...callbacks } = {}) => speakText(text, speechLangFor(lang), callbacks);

  // Records the mic and transcribes it. Resolves with {transcript} or
  // {unsupported: true} if the browser has no SpeechRecognition, so callers
  // can fall back to a best-effort pass rather than failing the attempt.
  const recognizeSpeech = (lang) =>
    new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { resolve({ unsupported: true }); return; }

      const rec = new SR();
      rec.lang = speechLangFor(lang);
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      recognitionRef.current = rec;

      let settled = false;
      rec.onresult = (e) => {
        settled = true;
        resolve({ transcript: e.results[0][0].transcript });
      };
      rec.onerror = () => {
        if (!settled) { settled = true; resolve({ unsupported: true }); }
      };
      rec.onend = () => {
        recognitionRef.current = null;
        if (!settled) { settled = true; resolve({ unsupported: true }); }
      };
      try {
        rec.start();
      } catch (e) {
        reject(e);
      }
    });

  const stopRecognition = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
  };

  return { speak, recognizeSpeech, stopRecognition };
}
