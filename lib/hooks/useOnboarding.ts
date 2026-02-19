import { useCallback, useState, useEffect } from "react";

const COOKIE_KEY = "sd_onboarding_seen";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 год

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

export interface OnboardingControls {
  isActive: boolean;
  currentStep: number;
  next: () => void;
  prev: () => void;
  finish: () => void;
  start: () => void;
}

/**
 * Управляет состоянием онбординга для пользователей с ролью USER.
 * Факт просмотра сохраняется в cookie — не нужен endpoint или таблица в БД.
 *
 * @param enabled — включить онбординг (только для роли USER)
 */
export function useOnboarding(
  enabled: boolean,
  cookieKey: string = COOKIE_KEY,
): OnboardingControls {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const seen = getCookie(cookieKey);
    if (!seen) {
      // Небольшая задержка — даём лейауту отрисоваться
      const timer = setTimeout(() => setIsActive(true), 900);
      return () => clearTimeout(timer);
    }
  }, [enabled, cookieKey]);

  const next = useCallback(() => {
    setCurrentStep((s) => s + 1);
  }, []);

  const prev = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const finish = useCallback(() => {
    setCookie(cookieKey, "1", COOKIE_MAX_AGE);
    setIsActive(false);
    setCurrentStep(0);
  }, [cookieKey]);

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  return { isActive, currentStep, next, prev, finish, start };
}
