import { useEffect, useRef, useState } from "react";
import { STOP_SPEECH_EVENT } from "./useInstantSpeech";

type SupportedLanguage = "en" | "es";

type SpeechRecognitionCtor = new () => SpeechRecognition;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    start(): void;
    stop(): void;
  }

  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent {
    error: string;
  }
}

export function useSpeechRecognition(
  language: SupportedLanguage,
  onTranscript: (transcript: string) => void,
) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const RecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setIsSupported(false);
      recognitionRef.current = null;
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === "es" ? "es-US" : "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        onTranscript(transcript);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setIsSupported(true);

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore stop errors during teardown.
      }
      recognitionRef.current = null;
    };
  }, [language, onTranscript]);

  function startListening() {
    if (!recognitionRef.current || isListening) {
      return;
    }

    recognitionRef.current.lang = language === "es" ? "es-US" : "en-US";

    window.dispatchEvent(new Event(STOP_SPEECH_EVENT));

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    try {
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
    }
  }

  return {
    isSupported,
    isListening,
    startListening,
  };
}
