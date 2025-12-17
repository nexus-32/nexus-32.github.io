import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type SpeakOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
};

type ListenOptions = {
  lang?: string;
};

type VoiceContextValue = {
  isListening: boolean;
  listenOnce: (options?: ListenOptions) => Promise<string>;
  stopListening: () => void;
  speak: (text: string, options?: SpeakOptions) => void;
  cancelSpeak: () => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  setSelectedVoiceURI: (voiceURI: string | null) => void;
};

const VoiceContext = createContext<VoiceContextValue | null>(null);

function pickDefaultVoice(voices: SpeechSynthesisVoice[]) {
  const ru = voices.filter((v) => v.lang?.toLowerCase().startsWith("ru"));
  const pool = ru.length > 0 ? ru : voices;

  const maleByName = pool.find((v) => /male|муж/i.test(v.name));
  if (maleByName) return maleByName;

  const google = pool.find((v) => /google/i.test(v.name));
  if (google) return google;

  return pool[0] ?? null;
}

export function VoiceProvider({ children }: { children: React.ReactNode }) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const syncVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      setSelectedVoiceURI((prev) => {
        if (prev && voices.some((v) => v.voiceURI === prev)) return prev;
        const fallback = pickDefaultVoice(voices);
        return fallback?.voiceURI ?? null;
      });
    };

    syncVoices();
    window.speechSynthesis.addEventListener("voiceschanged", syncVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", syncVoices);
  }, []);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } finally {
      setIsListening(false);
    }
  }, []);

  const listenOnce = useCallback((options?: ListenOptions) => {
    return new Promise<string>((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Speech recognition is not available"));
        return;
      }

      const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Ctor) {
        reject(new Error("Speech recognition not supported"));
        return;
      }

      stopListening();

      const recognition = new Ctor();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = options?.lang ?? "ru-RU";

      setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? "";
        setIsListening(false);
        resolve(transcript);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        reject(new Error(event.error ?? "Speech recognition error"));
      };

      try {
        recognition.start();
      } catch (e) {
        setIsListening(false);
        reject(e instanceof Error ? e : new Error("Failed to start recognition"));
      }
    });
  }, [stopListening]);

  const cancelSpeak = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      if (!text.trim()) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.lang ?? "ru-RU";
      utterance.rate = options?.rate ?? 1;
      utterance.pitch = options?.pitch ?? 1;
      utterance.volume = options?.volume ?? 1;

      const voice = availableVoices.find((v) => (selectedVoiceURI ? v.voiceURI === selectedVoiceURI : false));
      if (voice) utterance.voice = voice;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [availableVoices, selectedVoiceURI]
  );

  const value = useMemo<VoiceContextValue>(
    () => ({
      isListening,
      listenOnce,
      stopListening,
      speak,
      cancelSpeak,
      availableVoices,
      selectedVoiceURI,
      setSelectedVoiceURI,
    }),
    [isListening, listenOnce, stopListening, speak, cancelSpeak, availableVoices, selectedVoiceURI]
  );

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used within VoiceProvider");
  return ctx;
}
