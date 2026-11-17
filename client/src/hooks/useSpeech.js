import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getSpeechLang } from "../utils/speechLang";
import { getQuestionLang } from "../utils/questionLang";
import { narrate, stopNarration } from "../utils/narrator";

// Speaks `text` through the site's narrator (utils/narrator.js): the natural
// server voice, or the browser's best voice for the language. A little slower
// than normal for young readers.
function speakText(text, langCode, callbacks = {}) {
  narrate(text, { lang: langCode, rate: 0.85, ...callbacks });
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

  const speechLangFor = () => {
    const useEnglish = subject === "english" || getQuestionLang(i18n.language) === "en";
    return useEnglish ? "en-US" : getSpeechLang(i18n.language);
  };

  const speak = (text, callbacks) => speakText(text, speechLangFor(), callbacks);

  // Records the mic and transcribes it. Resolves with {transcript} or
  // {unsupported: true} if the browser has no SpeechRecognition, so callers
  // can fall back to a best-effort pass rather than failing the attempt.
  const recognizeSpeech = () =>
    new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { resolve({ unsupported: true }); return; }

      const rec = new SR();
      rec.lang = speechLangFor();
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
