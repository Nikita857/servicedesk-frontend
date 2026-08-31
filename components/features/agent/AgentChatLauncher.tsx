"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  Box,
  Flex,
  IconButton,
  Portal,
  Spinner,
  useBreakpointValue,
} from "@chakra-ui/react";
import { LuBot, LuMoveDiagonal2, LuX } from "react-icons/lu";
import {
  DEFAULT_AGENT_CHAT_SIZE,
  MAX_AGENT_CHAT_SIZE,
  MIN_AGENT_CHAT_SIZE,
  useAgentChatStore,
  type AgentChatSize,
} from "@/stores/agentChatStore";
import { useCurrentPermissions } from "@/lib/hooks/shared/usePermissions";
import { PERM } from "@/lib/constants/permissions";
import { Tooltip } from "@/components/ui";

// Панель тянет ~1.8 МБ зависимостей — грузим отдельным чанком при первом открытии.
// ssr: false обязателен: внутри работа с cookie, crypto.randomUUID и стримами.
const AgentChatPanel = dynamic(() => import("./AgentChatPanel"), {
  ssr: false,
  loading: () => (
    <Flex align="center" justify="center" h="100%">
      <Spinner size="md" color="accent.500" />
    </Flex>
  ),
});

/** Отступы вокруг панели на md+ — те же, что заданы в bottom/right ниже; нужны для клампа по вьюпорту. */
const VIEWPORT_MARGIN_PX = 24;

function clampSize(size: AgentChatSize): AgentChatSize {
  const maxW = Math.min(
    MAX_AGENT_CHAT_SIZE.width,
    window.innerWidth - VIEWPORT_MARGIN_PX,
  );
  const maxH = Math.min(
    MAX_AGENT_CHAT_SIZE.height,
    window.innerHeight - VIEWPORT_MARGIN_PX * 3,
  );
  return {
    width: Math.min(maxW, Math.max(MIN_AGENT_CHAT_SIZE.width, size.width)),
    height: Math.min(maxH, Math.max(MIN_AGENT_CHAT_SIZE.height, size.height)),
  };
}

/**
 * Хендл в левом верхнем углу панели: та прибита к правому нижнему краю экрана
 * (bottom/right), поэтому «расти» она может только влево-вверх — туда и тянем.
 */
function ResizeHandle({
  size,
  onLiveResize,
  onResizeEnd,
}: {
  size: AgentChatSize;
  onLiveResize: (size: AgentChatSize) => void;
  onResizeEnd: (size: AgentChatSize) => void;
}) {
  const dragStart = useRef<{
    x: number;
    y: number;
    size: AgentChatSize;
  } | null>(null);

  const handlePointerDown = (event: React.PointerEvent) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = { x: event.clientX, y: event.clientY, size };
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!dragStart.current) return;
    const { x, y, size: startSize } = dragStart.current;
    onLiveResize(
      clampSize({
        width: startSize.width + (x - event.clientX),
        height: startSize.height + (y - event.clientY),
      }),
    );
  };

  const endDrag = () => {
    if (!dragStart.current) return;
    dragStart.current = null;
    onResizeEnd(size);
  };

  return (
    <Tooltip content="Растянуть окно (двойной клик — сбросить размер)">
      <Box
        position="absolute"
        top={0}
        left={0}
        w="18px"
        h="18px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="fg.subtle"
        cursor="nwse-resize"
        zIndex={2}
        _hover={{ color: "fg.default" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => onResizeEnd(DEFAULT_AGENT_CHAT_SIZE)}
      >
        <LuMoveDiagonal2 size={12} />
      </Box>
    </Tooltip>
  );
}

/**
 * Плавающая кнопка ИИ-помощника в правом нижнем углу.
 *
 * z-index 1200 выбран осознанно: выше RatingToast (1000) и меню чата тикета (1001),
 * но ниже OnboardingOverlay (9998) — иначе виджет пролезал бы поверх затемнения тура.
 * Отступ bottom=20, потому что угол bottom-end уже занят тостером Chakra.
 */
export function AgentChatLauncher() {
  const { has } = useCurrentPermissions();
  const { isOpen, toggle, close } = useAgentChatStore();
  const storedSize = useAgentChatStore((state) => state.size);
  const setSize = useAgentChatStore((state) => state.setSize);
  // На мобильных панель на весь экран — ресайз и масштаб компонентов там не нужны.
  const isResizable = useBreakpointValue({ base: false, md: true });
  const pathname = usePathname();

  // Живой размер во время драга — отдельный стейт, чтобы не долбить persist/localStorage
  // на каждый pointermove. В сторе размер обновляется только по отпусканию хендла.
  const [liveSize, setLiveSize] = useState<AgentChatSize | null>(null);
  const size = liveSize ?? storedSize;

  const commitSize = useCallback(
    (next: AgentChatSize) => {
      setLiveSize(null);
      setSize(next);
    },
    [setSize],
  );

  if (!has(PERM.AI_AGENT_USE)) return null;
  // На полноэкранной странице чата тот же диалог уже открыт во всю ширину —
  // плавающая кнопка и мини-панель поверх неё были бы избыточны.
  if (pathname?.startsWith("/dashboard/agent")) return null;

  // Пропорция стороны к «дизайновой» ширине — во столько раз растут шрифты, иконки,
  // отступы внутри панели: чтобы при увеличении окна не просто становилось больше
  // пустого места, а весь контент визуально увеличивался вместе с ним.
  const scale = isResizable ? size.width / DEFAULT_AGENT_CHAT_SIZE.width : 1;

  return (
    <Portal>
      {isOpen && (
        <Box
          position="fixed"
          bottom={{ base: 0, md: 36 }}
          right={{ base: 0, md: 4 }}
          w={{ base: "100vw", md: `${size.width}px` }}
          h={{ base: "100dvh", md: `${size.height}px` }}
          bg="bg.surface"
          borderWidth={{ base: 0, md: "1px" }}
          borderColor="border.default"
          borderRadius={{ base: 0, md: "xl" }}
          boxShadow="xl"
          overflow="hidden"
          zIndex={1200}
        >
          {isResizable ? (
            <Box
              position="absolute"
              top={0}
              left={0}
              w={`${DEFAULT_AGENT_CHAT_SIZE.width}px`}
              h={`${size.height / scale}px`}
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <AgentChatPanel onClose={close} />
            </Box>
          ) : (
            <AgentChatPanel onClose={close} />
          )}

          {isResizable && (
            <ResizeHandle
              size={size}
              onLiveResize={setLiveSize}
              onResizeEnd={commitSize}
            />
          )}
        </Box>
      )}
      {/*
        Пульсация раз в 10с, только пока чат закрыт — привлекает внимание к кнопке.
        10-секундный keyframes-цикл, в котором само движение укладывается в первую
        секунду с небольшим «эхом», а остальное время кнопка неподвижна.
      */}
      {!isOpen && (
        <style>{`
          @keyframes agent-launcher-bump {
            0%, 10%, 100% { transform: scale(1); }
            3% { transform: scale(1.12); }
            6% { transform: scale(1.5); }
            8% { transform: scale(1.06); }
          }
          @keyframes agent-launcher-ring {
            0%, 10%, 100% { transform: scale(1); opacity: 0; }
            1% { transform: scale(1.5); opacity: 0.6; }
            10% { transform: scale(2); opacity: 0; }
          }
          .agent-launcher-btn {
            animation: agent-launcher-bump 5s ease-in-out infinite;
          }
          /*
            Кольцо, а не заливка: сплошной background перекрывал бы иконку бота на
            момент вспышки (::after красится поверх содержимого кнопки). Прозрачная
            середина оставляет иконку видимой всё время.
          */
          .agent-launcher-btn::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            border: 2px solid currentColor;
            pointer-events: none;
            animation: agent-launcher-ring 10s ease-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .agent-launcher-btn, .agent-launcher-btn::after { animation: none; }
          }
        `}</style>
      )}
      <Tooltip content={isOpen ? "Закрыть" : "ИИ помощник"} portalled>
        <IconButton
          aria-label={isOpen ? "Закрыть ИИ-помощника" : "Открыть ИИ-помощника"}
          onClick={toggle}
          className={isOpen ? undefined : "agent-launcher-btn"}
          position="fixed"
          bottom={10}
          right={4}
          // На мобильных панель раскрывается на весь экран, и кнопка легла бы
          // поверх поля ввода — там её прячем, закрытие есть в шапке панели
          display={{ base: isOpen ? "none" : "inline-flex", md: "inline-flex" }}
          size="lg"
          borderRadius="full"
          boxShadow="lg"
          bg="fg.default"
          color="bg.surface"
          _hover={{ bg: "gray.700", _dark: { bg: "gray.300" } }}
          zIndex={1201}
        >
          {isOpen ? <LuX /> : <LuBot />}
        </IconButton>
      </Tooltip>
    </Portal>
  );
}
