import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoiceInputOptions {
  value: string;
  onChange: (value: string) => void;
  lang?: string;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  unsupportedReason: string | null;
  toggle: () => void;
  error: string | null;
}

export function useVoiceInput({
  value,
  onChange,
  lang = "ru-RU",
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextRef = useRef<string>("");

  const hasSpeechApi =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window || "mozSpeechRecognition" in window);

  const isSecure = typeof window === "undefined" || window.isSecureContext;

  const isSupported = hasSpeechApi && isSecure;

  const unsupportedReason = !hasSpeechApi
    ? "Голосовой ввод не поддерживается вашим браузером"
    : !isSecure
      ? "Голосовой ввод требует защищённого соединения (HTTPS)"
      : null;

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const toggle = useCallback(() => {
    if (!isSupported) return;

    if (isListening) {
      stop();
      return;
    }

    setError(null);
    baseTextRef.current = value;

    const SpeechRecognitionImpl =
      window.webkitSpeechRecognition ?? window.SpeechRecognition;

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const base = baseTextRef.current;

      if (finalTranscript) {
        const separator = base.length > 0 ? " " : "";
        const committed = base + separator + finalTranscript.trim();
        baseTextRef.current = committed;
        onChange(committed);
      } else if (interimTranscript) {
        const separator = base.length > 0 ? " " : "";
        onChange(base + separator + interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError(
          "Доступ к микрофону заблокирован. Нажмите на значок 🔒 в адресной строке → «Разрешения для сайта» → Микрофон → Разрешить.",
        );
      } else if (event.error === "no-speech") {
        // silent: no speech detected, just stop
      } else {
        setError(`Ошибка распознавания речи: ${event.error}`);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, isListening, value, lang, stop, onChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return { isListening, isSupported, unsupportedReason, toggle, error };
}
