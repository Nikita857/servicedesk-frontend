import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AgentChatSize {
  width: number;
  height: number;
}

/**
 * «Дизайновые» размеры панели — на них рассчитана вёрстка (AgentChatLauncher).
 * Масштаб при растягивании считается относительно них: width/DEFAULT_AGENT_CHAT_SIZE.width.
 */
export const DEFAULT_AGENT_CHAT_SIZE: AgentChatSize = { width: 400, height: 600 };
export const MIN_AGENT_CHAT_SIZE: AgentChatSize = { width: 320, height: 420 };
export const MAX_AGENT_CHAT_SIZE: AgentChatSize = { width: 900, height: 900 };

interface AgentChatState {
  isOpen: boolean;
  /**
   * Виджет ведёт один постоянный диалог. Id переживает перезагрузку страницы,
   * чтобы переписка не начиналась заново. Управление списком диалогов — на будущее.
   */
  conversationId: number | null;
  /** Размер панели, который пользователь выставил вручную через ресайз-хендл. */
  size: AgentChatSize;
  isHydrated: boolean;

  // Actions
  open: () => void;
  close: () => void;
  toggle: () => void;
  setConversationId: (id: number | null) => void;
  setSize: (size: AgentChatSize) => void;
  resetSize: () => void;
  setHydrated: () => void;
}

export const useAgentChatStore = create<AgentChatState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      conversationId: null,
      size: DEFAULT_AGENT_CHAT_SIZE,
      isHydrated: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),

      setConversationId: (id) => set({ conversationId: id }),
      setSize: (size) => set({ size }),
      resetSize: () => set({ size: DEFAULT_AGENT_CHAT_SIZE }),

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: "agent-chat-storage",
      // isOpen намеренно не персистим: чат не должен сам открываться при заходе
      partialize: (state) => ({
        conversationId: state.conversationId,
        size: state.size,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);
