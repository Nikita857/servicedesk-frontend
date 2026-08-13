/**
 * Типы модуля ИИ-агента (бэкенд: feature/agent).
 * Контракт сверен с AgentController / AgentConversationResponse / AgentMessageResponse.
 */

export interface AgentConversation {
  id: number;
  title: string | null;
  createdAt: string; // ISO-8601
  updatedAt: string;
}

export type AgentMessageRole = "USER" | "ASSISTANT";

export interface AgentMessageDto {
  id: number;
  conversationId: number;
  role: AgentMessageRole;
  content: string;
  cancelled: boolean;
  createdAt: string;
}

/**
 * Бланк Word/Excel, приложенный к диалогу. Ответ POST /agent/conversations/{id}/files.
 * Ссылки на скачивание здесь нет намеренно: файл пользователь только что выбрал сам.
 */
export interface AgentFile {
  id: number;
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

/** Сообщение в том виде, в каком его показывает виджет. */
export interface AgentUiMessage {
  /** У истории — id из БД, у растущего ответа — временный клиентский. */
  id: string;
  role: "user" | "assistant";
  content: string;
  /**
   * Приложенные бланки. Есть только у сообщений текущей сессии: бэкенд связывает
   * файл с диалогом, а не с сообщением, поэтому после перезагрузки истории их нет.
   */
  files?: AgentFile[];
}

/**
 * submitted — запрос ушёл, первого токена ещё нет (показываем «думает»);
 * streaming — токены идут.
 */
export type AgentChatStatus = "ready" | "submitted" | "streaming" | "error";

/**
 * Коды ошибок, приходящие в SSE-кадре `error`.
 * Важно: это НЕ HTTP-ошибки — стрим отдаёт их с кодом 200.
 */
export type AgentErrorCode =
  | "AGENT_DISABLED" // ai.agent.enabled=false — бины LLM не подняты
  | "CONVERSATION_BUSY" // для этого диалога уже идёт генерация
  | "AGENT_BUSY" // переполнен пул agentStreamExecutor
  | "AGENT_ERROR"; // ошибка от LLM, есть errorId для логов

export interface AgentDeltaEvent {
  delta: string;
}

/** ВНИМАНИЕ: message — это ПОЛНЫЙ текст ответа, а не статусная строка. */
export interface AgentDoneEvent {
  message: string;
  responseId: string | null;
}

export interface AgentErrorEvent {
  code: AgentErrorCode | string;
  message: string;
  errorId: string | null;
}

export interface AgentCancelledEvent {
  message: string;
}
