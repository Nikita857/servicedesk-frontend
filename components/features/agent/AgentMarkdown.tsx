"use client";

import { memo, useMemo, useState } from "react";
import ReactMarkdown, {
  defaultUrlTransform,
  type Components,
  type UrlTransform,
} from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Box,
  Code,
  Image,
  chakra,
  Heading,
  Link,
  Text,
} from "@chakra-ui/react";
import { LuDownload, LuFileText } from "react-icons/lu";
import { ImageLightbox } from "@/components/ui";

/**
 * Рендер ответа агента.
 *
 * Сырой HTML намеренно НЕ включаем (нет rehype-raw): текст приходит от LLM,
 * и единственная защита от инъекции — то, что react-markdown по умолчанию
 * не пропускает теги. remark-gfm нужен ради таблиц, зачёркивания и автоссылок.
 */

/**
 * Префикс, которым YandexAiAgentLlmGateway помечает ссылку на заполненный документ
 * (маркер [[SD_FILE|url|имя]] из MCP-тула превращается в «[📄 имя.docx](ссылка)»).
 */
const FILE_LINK_PREFIX = "📄";

/** Текст ссылки: react-markdown отдаёт children массивом узлов, а не строкой. */
function plainText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) {
    return children.map((child) => (typeof child === "string" ? child : "")).join("");
  }
  return "";
}

/** Заголовки в узком виджете почти не отличаются по весу — только по отступам. */
const headingProps = {
  fontSize: "xs",
  fontWeight: "semibold",
  mt: 2.5,
  mb: 1,
  _first: { mt: 0 },
} as const;

const components: Components = {
  p: ({ children }) => (
    <Text mb={2} _last={{ mb: 0 }}>
      {children}
    </Text>
  ),

  h1: ({ children }) => <Heading {...headingProps}>{children}</Heading>,
  h2: ({ children }) => <Heading {...headingProps}>{children}</Heading>,
  h3: ({ children }) => <Heading {...headingProps}>{children}</Heading>,
  h4: ({ children }) => <Heading {...headingProps}>{children}</Heading>,
  h5: ({ children }) => <Heading {...headingProps}>{children}</Heading>,
  h6: ({ children }) => <Heading {...headingProps}>{children}</Heading>,

  ul: ({ children }) => (
    <chakra.ul my={2} pl={4} listStyleType="disc" _last={{ mb: 0 }}>
      {children}
    </chakra.ul>
  ),
  ol: ({ children }) => (
    <chakra.ol my={2} pl={4} listStyleType="decimal" _last={{ mb: 0 }}>
      {children}
    </chakra.ol>
  ),
  li: ({ children }) => (
    <chakra.li mb={1} _last={{ mb: 0 }}>
      {children}
    </chakra.li>
  ),

  // Цвет наследуем: на пузыре пользователя своя подложка, синяя ссылка на ней теряется
  a: ({ href, children }) => {
    const label = plainText(children);

    // Заполненный агентом документ гейтвей вставляет как ссылку «📄 имя.docx» —
    // показываем её карточкой файла, а не строчкой текста среди абзаца.
    if (label.startsWith(FILE_LINK_PREFIX)) {
      return (
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          display="flex"
          alignItems="center"
          gap={2}
          my={2}
          px={2.5}
          py={2}
          borderWidth="1px"
          borderColor="border.default"
          borderRadius="md"
          bg="bg.subtle"
          color="fg.default"
          textDecoration="none"
          _hover={{ borderColor: "fg.subtle", textDecoration: "none" }}
        >
          <Box color="fg.muted" display="flex" flexShrink={0}>
            <LuFileText size={14} />
          </Box>
          <Box flex={1} minW={0} truncate fontWeight="medium">
            {label.slice(FILE_LINK_PREFIX.length).trim()}
          </Box>
          <Box color="fg.muted" display="flex" flexShrink={0}>
            <LuDownload size={14} />
          </Box>
        </Link>
      );
    }

    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        color="inherit"
        textDecoration="underline"
        textUnderlineOffset="2px"
      >
        {children}
      </Link>
    );
  },

  /*
   * react-markdown, начиная с 9-й версии, не передаёт флаг inline — отличаем блок
   * от вставки в строке сами: у блока с языком есть className, а многострочный
   * блок без языка выдаёт себя переносом внутри текста.
   */
  code: ({ className, children }) => {
    const isBlock =
      className?.includes("language-") ||
      (typeof children === "string" && children.includes("\n"));

    if (isBlock) {
      return (
        <chakra.code fontFamily="mono" fontSize="inherit" whiteSpace="pre">
          {children}
        </chakra.code>
      );
    }
    return (
      <Code fontSize="0.9em" px={1} py={0.5} borderRadius="sm">
        {children}
      </Code>
    );
  },

  pre: ({ children }) => (
    <Box
      as="pre"
      my={2}
      p={2}
      bg="bg.subtle"
      borderRadius="md"
      overflowX="auto"
      fontSize="xs"
      _last={{ mb: 0 }}
    >
      {children}
    </Box>
  ),

  blockquote: ({ children }) => (
    <Box
      my={2}
      pl={3}
      borderLeftWidth="2px"
      borderColor="border.default"
      color="fg.muted"
    >
      {children}
    </Box>
  ),

  hr: () => <chakra.hr my={3} borderColor="border.default" />,

  // Таблицы в узкой панели не помещаются — даём им собственный горизонтальный скролл
  table: ({ children }) => (
    <Box my={2} overflowX="auto">
      <chakra.table width="100%" borderCollapse="collapse">
        {children}
      </chakra.table>
    </Box>
  ),
  th: ({ children }) => (
    <chakra.th
      px={2}
      py={1}
      textAlign="left"
      fontWeight="semibold"
      borderWidth="1px"
      borderColor="border.default"
    >
      {children}
    </chakra.th>
  ),
  td: ({ children }) => (
    <chakra.td
      px={2}
      py={1}
      borderWidth="1px"
      borderColor="border.default"
      verticalAlign="top"
    >
      {children}
    </chakra.td>
  ),
};

const remarkPlugins = [remarkGfm];

/**
 * react-markdown по умолчанию (defaultUrlTransform) пропускает только протоколы
 * https/ircs/mailto/xmpp, а любой другой URL заменяет ПУСТОЙ СТРОКОЙ. Из-за этого
 * data:-URI скриншота от MCP-тула превращался в <img src="">: текст исчезал, картинка
 * не появлялась. Пропускаем растровые data:image/*, остальное — прежней проверкой.
 * SVG исключён намеренно: он может нести скрипт внутри.
 */
const DATA_IMAGE_URI = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i;

const urlTransform: UrlTransform = (url) =>
  DATA_IMAGE_URI.test(url) ? url : defaultUrlTransform(url);

interface AgentMarkdownProps {
  content: string;
}

function AgentMarkdownComponent({ content }: AgentMarkdownProps) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(
    null,
  );

  /*
   * img — единственный рендерер, которому нужен стейт, поэтому он не в модульной
   * карте components, а здесь. useMemo обязателен: react-markdown разбирает markdown
   * на каждый рендер, и новая ссылка на карту компонентов заставляла бы его
   * перерисовывать всё дерево на каждой дельте стрима.
   */
  const componentsWithLightbox = useMemo<Components>(
    () => ({
      ...components,
      // Вложения от MCP-тулов (скриншоты страниц PDF) приходят как data:-URI —
      // без maxW полноразмерный скриншот распирал бы 400px-панель виджета.
      img: ({ src, alt }) => {
        // React 19 типизирует src как string | Blob, нам нужен только URL
        const imageSrc = typeof src === "string" ? src : undefined;
        const imageAlt = alt ?? "Вложение";

        return (
          <Image
            src={imageSrc}
            alt={imageAlt}
            maxW="100%"
            borderRadius="md"
            border="1px black solid"
            my={2}
            cursor="zoom-in"
            onClick={() =>
              imageSrc && setLightbox({ src: imageSrc, alt: imageAlt })
            }
          />
        );
      },
    }),
    [],
  );

  return (
    <>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        components={componentsWithLightbox}
        urlTransform={urlTransform}
      >
        {content}
      </ReactMarkdown>

      {/* Один лайтбокс на сообщение, а не на каждую картинку: какую открыли — та и в стейте */}
      <ImageLightbox
        src={lightbox?.src ?? null}
        alt={lightbox?.alt}
        onClose={() => setLightbox(null)}
        downloadable
      />
    </>
  );
}

/**
 * memo обязателен: во время стрима стейт обновляется на каждой дельте, и без него
 * заново разбирался бы markdown ВСЕХ сообщений треда, а не только растущего.
 */
export const AgentMarkdown = memo(AgentMarkdownComponent);
