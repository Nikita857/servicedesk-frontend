"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Плотность вёрстки чата.
 *
 * Компоненты чата одни и те же в плавающем виджете и на странице «ИИ-агент» —
 * различаются только размеры. Чтобы не плодить два набора компонентов, размеры
 * вынесены в контекст: виджет оборачивает дерево в density="compact",
 * страница — в density="comfortable". Всё остальное (шапка, лента, поле ввода,
 * сообщения) одно и то же.
 */
export type AgentDensity = "compact" | "comfortable";

export interface AgentDensityTokens {
  /** Основной текст сообщения. */
  body: string;
  /** Подписи: время, размер файла, вторая строка в шапке. */
  caption: string;
  /** Микро-заголовок «ИИ-агент» над ответом. */
  label: string;
  /** Название диалога в шапке. */
  title: string;
  /** Заголовок пустого состояния. */
  emptyTitle: string;
  /** Пояснение под заголовком пустого состояния. */
  emptyText: string;
  /** Расстояние между сообщениями (шкала Chakra). */
  messageGap: number;
  /** Горизонтальные отступы шапки, ленты и поля ввода. */
  gutter: number;
  /** Вертикальные отступы ленты. */
  listPaddingY: number;
  /** Сторона квадратной иконки агента в шапке. */
  avatar: string;
  /** Кнопка отправки. */
  sendButton: string;
  /** Кнопки-иконки: действия шапки, скрепка, копирование, удаление. */
  iconButton: string;
  /** Скругление пузыря пользователя (уголок к автору). */
  bubbleRadius: string;
  /** Максимальная ширина пузыря пользователя. */
  bubbleMaxW: string;
  /** Ширина колонки сообщений; undefined — во всю доступную ширину. */
  contentMaxW?: string;
}

const TOKENS: Record<AgentDensity, AgentDensityTokens> = {
  compact: {
    body: "13px",
    caption: "11px",
    label: "11px",
    title: "14px",
    emptyTitle: "19px",
    emptyText: "13px",
    messageGap: 4.5,
    gutter: 3.5,
    listPaddingY: 4,
    avatar: "28px",
    sendButton: "32px",
    iconButton: "26px",
    bubbleRadius: "16px 16px 4px 16px",
    bubbleMaxW: "82%",
  },
  comfortable: {
    body: "14px",
    caption: "12px",
    label: "11.5px",
    title: "16px",
    emptyTitle: "24px",
    emptyText: "15px",
    messageGap: 6.5,
    gutter: 6,
    listPaddingY: 7,
    avatar: "32px",
    sendButton: "36px",
    iconButton: "30px",
    bubbleRadius: "18px 18px 6px 18px",
    bubbleMaxW: "76%",
    contentMaxW: "65%",
  },
};

const AgentDensityContext = createContext<AgentDensityTokens>(TOKENS.compact);

export function AgentDensityProvider({
  density,
  children,
}: {
  density: AgentDensity;
  children: ReactNode;
}) {
  return (
    <AgentDensityContext.Provider value={TOKENS[density]}>
      {children}
    </AgentDensityContext.Provider>
  );
}

export function useAgentDensity(): AgentDensityTokens {
  return useContext(AgentDensityContext);
}
