import { IconButton } from "@chakra-ui/react";
import { useEffect } from "react";
import { LuMic, LuMicOff } from "react-icons/lu";
import { toaster } from "@/components/ui/toaster";
import { Tooltip } from "@/components/ui/tooltip";
import { useVoiceInput } from "@/lib/hooks/shared/useVoiceInput";

interface VoiceInputButtonProps {
  value: string;
  onChange: (v: string) => void;
  lang?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "2xs" | "xs" | undefined;
  disabled?: boolean;
}

export function VoiceInputButton({
  value,
  onChange,
  lang = "ru-RU",
  size = "sm",
  disabled = false,
}: VoiceInputButtonProps) {
  const { isListening, isSupported, unsupportedReason, toggle, error } = useVoiceInput({
    value,
    onChange,
    lang,
  });

  useEffect(() => {
    if (error) {
      toaster.create({
        type: "error",
        title: "Голосовой ввод",
        description: error,
        duration: 5000,
      });
    }
  }, [error]);

  if (!isSupported) {
    return (
      <Tooltip content={unsupportedReason ?? "Голосовой ввод недоступен"}>
        <IconButton variant="ghost" size={size} disabled aria-label="Голосовой ввод недоступен">
          <LuMicOff />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <>
      {isListening && (
        <style>{`
          @keyframes voice-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.15); }
          }
          .voice-listening {
            animation: voice-pulse 1.2s ease-in-out infinite;
          }
        `}</style>
      )}
      <IconButton
        variant="ghost"
        size={size}
        disabled={disabled}
        onClick={toggle}
        aria-label={isListening ? "Остановить запись" : "Начать голосовой ввод"}
        color={isListening ? "red.500" : undefined}
        className={isListening ? "voice-listening" : undefined}
      >
        {isListening ? <LuMicOff /> : <LuMic />}
      </IconButton>
    </>
  );
}
