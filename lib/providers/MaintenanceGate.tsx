"use client";

import React, { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { maintenanceApi } from "@/lib/api/maintenance";
import type { MaintenanceStatus } from "@/types/maintenance";
import MaintenanceScreen from "@/components/features/maintenance/MaintenanceScreen";

const CACHE_KEY = "maintenance:cache";
const POLL_INTERVAL = 15_000;
// Запас после endsAt, в течение которого ещё доверяем кэшу при недоступном бэке.
// Деплой ~7-9 мин; даём широкий буфер, чтобы старый кэш недели спустя не блокировал UI.
const CACHE_GRACE_MS = 30 * 60_000;
// Маршруты, на которых экран обслуживания не показывается:
// /login — чтобы можно было войти; /dashboard/admin/maintenance — чтобы админ выключил режим.
const EXEMPT_PREFIXES = ["/login", "/dashboard/admin/maintenance"];

interface CachedState {
  enabled: boolean;
  endsAt: string | null;
  message: string | null;
}

function readCache(): CachedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedState) : null;
  } catch {
    return null;
  }
}

function writeCache(state: CachedState | null) {
  if (typeof window === "undefined") return;
  try {
    if (state) window.localStorage.setItem(CACHE_KEY, JSON.stringify(state));
    else window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

// Доверяем кэшу, только если режим включён и срок ещё не истёк (с запасом).
function cacheStillTrustworthy(c: CachedState | null): boolean {
  if (!c || !c.enabled) return false;
  if (!c.endsAt) return true;
  return Date.parse(c.endsAt) > Date.now() - CACHE_GRACE_MS;
}

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // На сервере и при первой гидрации active=null (localStorage недоступен на сервере),
  // иначе серверный и клиентский рендер разойдутся (hydration mismatch).
  // Кэш читаем уже после монтирования — в useEffect ниже.
  const [active, setActive] = useState<CachedState | null>(null);

  const poll = useCallback(async () => {
    try {
      const s: MaintenanceStatus = await maintenanceApi.getStatus();
      if (s.active) {
        const next: CachedState = {
          enabled: true,
          endsAt: s.endsAt,
          message: s.message,
        };
        writeCache(next);
        setActive(next);
      } else {
        writeCache(null);
        setActive(null);
      }
    } catch {
      // Бэк недоступен: держим экран только если кэш ещё валиден, иначе показываем приложение.
      const c = readCache();
      setActive(cacheStillTrustworthy(c) ? c : null);
    }
  }, []);

  const applyCachedState = useCallback(() => {
    const c = readCache();
    if (cacheStillTrustworthy(c)) setActive(c);
  }, []);

  useEffect(() => {
    // Сразу после монтирования показываем экран из кэша (если бэк лежит — переживём даунтайм),
    // затем запускаем поллинг, который перезапишет состояние при первом ответе.
    // Применяем кэш и делаем первый опрос в микротаске — без синхронного setState в теле эффекта.
    queueMicrotask(applyCachedState);
    queueMicrotask(poll);

    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [poll, applyCachedState]);

  const exempt = EXEMPT_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (active && !exempt) {
    return (
      <MaintenanceScreen endsAt={active.endsAt} message={active.message} />
    );
  }

  return <>{children}</>;
}
