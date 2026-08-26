// Базовый URL API (с /api/v1)
export const API_BASE_URL = "http://192.168.0.71:2007/api/v1";

// URL для WebSocket соединения
export const WS_URL = "http://192.168.0.71:2007/ws";

// Фича ИИ-агента временно скрыта на проде — включается флагом сборки,
// пока бэк тоже не поднят с ai.agent.enabled=true
export const AGENT_ENABLED = process.env.NEXT_PUBLIC_AGENT_ENABLED === "true";
