"use client";

import { Box } from "@chakra-ui/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renderiza markdown de mensagem de chat (negrito, listas, links, tabelas, code)
 * com o tom do painel. Usado no FAB do admin e no widget do site — um só estilo.
 */
export function ChatMarkdown({ children }: { children: string }) {
  return (
    <Box
      fontSize="sm"
      lineHeight="1.6"
      css={{
        "& p": { margin: 0 },
        "& p + p": { marginTop: "0.5em" },
        "& ul, & ol": { paddingLeft: "1.25em", margin: "0.35em 0" },
        "& li": { margin: "0.15em 0" },
        "& a": { color: "var(--admin-primary)", textDecoration: "underline", wordBreak: "break-word" },
        "& strong": { fontWeight: 700 },
        "& code": {
          background: "var(--admin-surface-2, rgba(0,0,0,0.06))",
          padding: "0.1em 0.35em",
          borderRadius: "5px",
          fontSize: "0.85em",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        },
        "& pre": {
          background: "var(--admin-surface-2, rgba(0,0,0,0.06))",
          padding: "0.75em",
          borderRadius: "10px",
          overflowX: "auto",
          margin: "0.5em 0",
        },
        "& pre code": { background: "transparent", padding: 0 },
        "& h1, & h2, & h3": { fontWeight: 700, margin: "0.5em 0 0.25em", lineHeight: 1.25 },
        "& h1": { fontSize: "1.15em" },
        "& h2": { fontSize: "1.05em" },
        "& h3": { fontSize: "1em" },
        "& blockquote": {
          borderLeft: "3px solid var(--admin-divider, #ddd)",
          paddingLeft: "0.75em",
          color: "var(--admin-text-soft)",
          margin: "0.5em 0",
        },
        "& table": { borderCollapse: "collapse", width: "100%", margin: "0.5em 0", fontSize: "0.92em" },
        "& th, & td": { border: "1px solid var(--admin-divider, #e2e2e2)", padding: "0.3em 0.55em", textAlign: "left" },
        "& th": { background: "var(--admin-surface-2, rgba(0,0,0,0.04))", fontWeight: 600 },
        "& img": { maxWidth: "100%", borderRadius: "8px", margin: "0.4em 0" },
        "& hr": { border: "none", borderTop: "1px solid var(--admin-divider, #eee)", margin: "0.75em 0" },
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </Box>
  );
}
