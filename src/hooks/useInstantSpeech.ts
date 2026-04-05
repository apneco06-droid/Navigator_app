import { useEffect, useRef } from "react";

type SupportedLanguage = "en" | "es";
type BrowserVoice = SpeechSynthesisVoice;
type BackendStatus = "unknown" | "available" | "unavailable";

const DUPLICATE_WINDOW_MS = 900;
export const STOP_SPEECH_EVENT = "navigator-stop-speech";
const TTS_ENDPOINT = "/api/tts";

export function useInstantSpeech() {
  const lastSignatureRef = useRef("");
  const lastSpokenAtRef = useRef(0);
  const speakTimeoutRef = useRef<number | null>(null);
  const voicesReadyRef = useRef(false);
  const backendStatusRef = useRef<BackendStatus>("unknown");
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const synthesis = "speechSynthesis" in window ? window.speechSynthesis : null;

    const stopPlayback = () => {
      if (speakTimeoutRef.current !== null) {
        window.clearTimeout(speakTimeoutRef.current);
        speakTimeoutRef.current = null;
      }

      requestAbortRef.current?.abort();
      requestAbortRef.current = null;

      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = "";
        activeAudioRef.current = null;
      }

      if (activeAudioUrlRef.current) {
        URL.revokeObjectURL(activeAudioUrlRef.current);
        activeAudioUrlRef.current = null;
      }

      synthesis?.cancel();
    };

    function handleExternalStop() {
      stopPlayback();
    }

    window.addEventListener(STOP_SPEECH_EVENT, handleExternalStop);

    if (!synthesis) {
      return () => {
        window.removeEventListener(STOP_SPEECH_EVENT, handleExternalStop);
        stopPlayback();
      };
    }

    const availableSynthesis = synthesis;

    function syncVoices() {
      voicesReadyRef.current = availableSynthesis.getVoices().length > 0;
    }

    syncVoices();
    availableSynthesis.addEventListener("voiceschanged", syncVoices);

    return () => {
      window.removeEventListener(STOP_SPEECH_EVENT, handleExternalStop);
      stopPlayback();
      availableSynthesis.removeEventListener("voiceschanged", syncVoices);
    };
  }, []);

  function speak(text: string, language: SupportedLanguage = "en") {
    const normalizedText = text.trim();
    if (!normalizedText) {
      return;
    }

    const signature = `${language}:${normalizedText}`;
    const now = Date.now();
    if (
      signature === lastSignatureRef.current &&
      now - lastSpokenAtRef.current < DUPLICATE_WINDOW_MS
    ) {
      return;
    }

    const synthesis = window.speechSynthesis;
    lastSignatureRef.current = signature;
    lastSpokenAtRef.current = now;
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    stopActiveSpeech(synthesis);
    void speakWithPreferredEngine(normalizedText, language, currentRequestId);
  }

  function selectVoice(language: SupportedLanguage) {
    const voices = window.speechSynthesis.getVoices();
    const matchingVoices = voices.filter((voice) =>
      language === "es"
        ? voice.lang.toLowerCase().startsWith("es")
        : voice.lang.toLowerCase().startsWith("en"),
    );

    if (matchingVoices.length === 0) {
      return null;
    }

    return matchingVoices
      .map((voice) => ({
        voice,
        score: scoreVoice(voice, language),
      }))
      .sort((left, right) => right.score - left.score)[0]?.voice ?? null;
  }

  return { speak };

  async function speakWithPreferredEngine(
    normalizedText: string,
    language: SupportedLanguage,
    requestId: number,
  ) {
    if (backendStatusRef.current !== "unavailable") {
      const usedBackend = await speakWithBackend(normalizedText, language, requestId);
      if (usedBackend) {
        return;
      }
    }

    speakWithBrowser(normalizedText, language, requestId);
  }

  async function speakWithBackend(
    normalizedText: string,
    language: SupportedLanguage,
    requestId: number,
  ) {
    const controller = new AbortController();
    requestAbortRef.current = controller;

    try {
      const response = await fetch(TTS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language,
          text: normalizedText,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if ([404, 405, 501, 503].includes(response.status)) {
          backendStatusRef.current = "unavailable";
        }
        return false;
      }

      const audioBlob = await response.blob();
      if (requestId !== requestIdRef.current) {
        return false;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.preload = "auto";

      audio.onended = () => {
        if (activeAudioRef.current === audio) {
          activeAudioRef.current = null;
        }
        if (activeAudioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          activeAudioUrlRef.current = null;
        }
      };

      audio.onerror = () => {
        if (activeAudioRef.current === audio) {
          activeAudioRef.current = null;
        }
        if (activeAudioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          activeAudioUrlRef.current = null;
        }
      };

      activeAudioRef.current = audio;
      activeAudioUrlRef.current = audioUrl;
      backendStatusRef.current = "available";

      await audio.play();
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return false;
      }

      backendStatusRef.current = "unavailable";
      return false;
    } finally {
      if (requestAbortRef.current === controller) {
        requestAbortRef.current = null;
      }
    }
  }

  function speakWithBrowser(
    normalizedText: string,
    language: SupportedLanguage,
    requestId: number,
  ) {
    if (!("speechSynthesis" in window)) {
      return;
    }

    speakTimeoutRef.current = window.setTimeout(() => {
      if (requestId !== requestIdRef.current) {
        return;
      }

      const utterance = new SpeechSynthesisUtterance(normalizeSpokenText(normalizedText));
      utterance.lang = language === "es" ? "es-US" : "en-US";
      utterance.rate = language === "es" ? 0.91 : 0.94;
      utterance.pitch = language === "es" ? 1.02 : 1.01;
      utterance.volume = 1;
      utterance.voice = selectVoice(language);
      window.speechSynthesis.speak(utterance);
    }, voicesReadyRef.current ? 40 : 140);
  }
}

function stopActiveSpeech(synthesis: SpeechSynthesis | null) {
  if (synthesis?.speaking || synthesis?.pending) {
    synthesis.cancel();
  }

  window.dispatchEvent(new Event(STOP_SPEECH_EVENT));
}

function scoreVoice(voice: BrowserVoice, language: SupportedLanguage) {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  let score = 0;

  const premiumMarkers = [
    "enhanced",
    "premium",
    "natural",
    "neural",
    "siri",
  ];
  const roboticMarkers = ["compact", "novelty", "ting", "zarvox", "boing"];

  const preferredEnglish = ["samantha", "ava", "allison", "karen", "daniel", "google us english"];
  const preferredSpanish = ["monica", "paulina", "soledad", "jorge", "google español", "google spanish"];

  if (language === "en" && lang.startsWith("en-us")) {
    score += 20;
  }

  if (language === "es" && (lang.startsWith("es-us") || lang.startsWith("es-mx"))) {
    score += 20;
  }

  if (premiumMarkers.some((marker) => name.includes(marker))) {
    score += 18;
  }

  if (voice.default) {
    score += 8;
  }

  if (!voice.localService) {
    score += 4;
  }

  if (language === "en" && preferredEnglish.some((marker) => name.includes(marker))) {
    score += 24;
  }

  if (language === "es" && preferredSpanish.some((marker) => name.includes(marker))) {
    score += 24;
  }

  if (roboticMarkers.some((marker) => name.includes(marker))) {
    score -= 30;
  }

  if (name.includes("eloquence")) {
    score -= 18;
  }

  return score;
}

function normalizeSpokenText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\bPDF\b/g, "P D F")
    .trim();
}
