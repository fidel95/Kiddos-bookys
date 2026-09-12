import type { Language } from "@/types/story";
import { tokenizeWords, wordIndexAtCharIndex } from "@/lib/words";

const LANG_TAG: Record<Language, string> = { en: "en", es: "es" };
const WORDS_PER_MINUTE: Record<Language, number> = { en: 150, es: 140 };
const BOUNDARY_FALLBACK_TIMEOUT_MS = 400;

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/** Resolves once the browser's voice list is populated (Chrome loads it asynchronously). */
export function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) return Promise.resolve([]);
  if (voicesReadyPromise) return voicesReadyPromise;

  voicesReadyPromise = new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    const handle = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        window.speechSynthesis.removeEventListener("voiceschanged", handle);
        resolve(voices);
      }
    };
    window.speechSynthesis.addEventListener("voiceschanged", handle);
    // Some browsers never fire voiceschanged if voices were already ready; give up gracefully.
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 2000);
  });
  return voicesReadyPromise;
}

export function pickVoice(voices: SpeechSynthesisVoice[], lang: Language): SpeechSynthesisVoice | undefined {
  const tag = LANG_TAG[lang];
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(tag) && v.localService) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(tag))
  );
}

export interface SpeakCallbacks {
  onWordBoundary: (wordIndex: number) => void;
  onEnd: () => void;
  onNoVoice?: () => void;
}

export interface SpeakHandle {
  cancel: () => void;
}

/** Speaks a single sentence, reporting word-boundary progress (real or estimated) via callbacks. */
export function speakSentence(text: string, lang: Language, callbacks: SpeakCallbacks): SpeakHandle {
  if (!isSpeechSupported()) {
    callbacks.onNoVoice?.();
    callbacks.onEnd();
    return { cancel: () => {} };
  }

  const words = tokenizeWords(text);
  let cancelled = false;
  let usedRealBoundary = false;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  let fallbackInterval: ReturnType<typeof setInterval> | null = null;

  const clearFallback = () => {
    if (fallbackTimer) clearTimeout(fallbackTimer);
    if (fallbackInterval) clearInterval(fallbackInterval);
    fallbackTimer = null;
    fallbackInterval = null;
  };

  const startFallbackHighlighting = () => {
    if (cancelled || usedRealBoundary || words.length === 0) return;
    const msPerWord = 60000 / WORDS_PER_MINUTE[lang];
    let index = 0;
    callbacks.onWordBoundary(0);
    fallbackInterval = setInterval(() => {
      index += 1;
      if (index >= words.length || cancelled) {
        clearFallback();
        return;
      }
      callbacks.onWordBoundary(index);
    }, msPerWord);
  };

  waitForVoices().then((voices) => {
    if (cancelled) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "es" ? "es-ES" : "en-US";
    const voice = pickVoice(voices, lang);
    if (voice) {
      utterance.voice = voice;
    } else {
      callbacks.onNoVoice?.();
    }

    utterance.onboundary = (event) => {
      if (event.name && event.name !== "word") return;
      usedRealBoundary = true;
      clearFallback();
      const idx = wordIndexAtCharIndex(words, event.charIndex);
      if (idx >= 0) callbacks.onWordBoundary(idx);
    };

    utterance.onend = () => {
      clearFallback();
      if (!cancelled) callbacks.onEnd();
    };

    utterance.onerror = () => {
      clearFallback();
      if (!cancelled) callbacks.onEnd();
    };

    fallbackTimer = setTimeout(startFallbackHighlighting, BOUNDARY_FALLBACK_TIMEOUT_MS);
    window.speechSynthesis.speak(utterance);
  });

  return {
    cancel: () => {
      cancelled = true;
      clearFallback();
      if (isSpeechSupported()) window.speechSynthesis.cancel();
    },
  };
}

export function pauseSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.pause();
}

export function resumeSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.resume();
}

export function cancelSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
