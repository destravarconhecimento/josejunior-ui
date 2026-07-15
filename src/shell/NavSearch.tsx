"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, HStack, Input, Stack, Text } from "@chakra-ui/react";
import { CornerDownLeft, Search } from "lucide-react";
import type { NavItem, NavSection } from "./types";

const DIACRITICS = /[̀-ͯ]/g;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(DIACRITICS, "").trim();

type Hit = NavItem & { section: string };

function search(sections: NavSection[], query: string): Hit[] {
  const q = norm(query);
  if (!q) return [];
  const hits: Hit[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      // Casa contra o rótulo, o grupo e a rota: "gestao", "clientes" e "/cobranca"
      // levam ao mesmo lugar. O grupo entra porque no topo ele some do texto.
      const hay = norm(`${item.label} ${section.title} ${item.href}`);
      if (q.split(/\s+/).every((tok) => hay.includes(tok))) hits.push({ ...item, section: section.title });
    }
  }
  return hits.slice(0, 8);
}

/**
 * Busca do menu: digita → lista os destinos → Enter vai pro primeiro (Esc limpa).
 * Antes o campo só FILTRAVA a sidebar; aqui ele navega, que é o que se espera de
 * uma busca no topo.
 *
 * Anti-autofill de verdade: o campo nasce `readOnly` e só libera no foco. Os
 * atributos (`autoComplete="off"`, `data-1p-ignore`…) NÃO bastam — o Chrome e os
 * gerenciadores de senha ignoram `autocomplete=off` e usam heurística de "primeiro
 * input de texto visível", que despejava o e-mail salvo aqui. Campo `readOnly` é
 * pulado por todos eles, e como o usuário precisa focar pra digitar, o gate é
 * invisível no uso.
 */
export function NavSearch({
  sections,
  onNavigate,
  onDark = false,
  placeholder = "Buscar no menu…",
}: {
  sections: NavSection[];
  /** Chamado após escolher um destino (ex.: fechar o drawer no mobile). */
  onNavigate?: () => void;
  /** Campo sobre fundo escuro (sidebar/topbar de marca). */
  onDark?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editable, setEditable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => search(sections, query), [sections, query]);

  const go = (href: string) => {
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
    router.push(href);
    onNavigate?.();
  };

  const fg = onDark ? "white" : "var(--admin-text)";
  const soft = onDark ? "rgba(255,255,255,0.5)" : "var(--admin-text-soft)";

  return (
    <Box position="relative" w="full">
      <HStack
        gap={2}
        px={3}
        h="38px"
        borderRadius="10px"
        bg={onDark ? "rgba(255,255,255,0.06)" : "var(--admin-surface-2)"}
        borderWidth="1px"
        borderColor={onDark ? "rgba(255,255,255,0.12)" : "var(--admin-border)"}
      >
        <Box color={soft} flexShrink={0} display="flex">
          <Search size={15} />
        </Box>
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
            setOpen(true);
          }}
          onFocus={() => {
            setEditable(true);
            if (query) setOpen(true);
          }}
          // Deixa o clique no resultado acontecer antes de fechar.
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && hits[0]) {
              e.preventDefault();
              go(hits[0].href);
            }
            if (e.key === "Escape") {
              setQuery("");
              setOpen(false);
            }
          }}
          readOnly={!editable}
          placeholder={placeholder}
          aria-label="Buscar no menu"
          type="text"
          name="jj-nav-search"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-1p-ignore
          data-lpignore="true"
          data-bwignore="true"
          data-form-type="other"
          unstyled
          flex="1"
          minW={0}
          h="full"
          bg="transparent"
          border="none"
          fontSize="sm"
          color={fg}
          cursor="text"
          _placeholder={{ color: soft }}
          _focusVisible={{ outline: "none" }}
        />
      </HStack>

      {open && query ? (
        <Box
          className="admin-dropdown"
          position="absolute"
          top="calc(100% + 6px)"
          left={0}
          right={0}
          zIndex={60}
          minW="240px"
          p={2}
          borderRadius="12px"
        >
          {hits.length === 0 ? (
            <Text px={2} py={2} fontSize="sm" color="var(--admin-text-soft)">
              Nada encontrado.
            </Text>
          ) : (
            <Stack gap={0.5}>
              {hits.map((hit, i) => (
                <HStack
                  key={hit.href}
                  as="button"
                  className="admin-nav-item"
                  // Impede o blur do input antes do clique registrar.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => go(hit.href)}
                  gap={2.5}
                  px={2.5}
                  py={2}
                  borderRadius="8px"
                  textAlign="left"
                  w="full"
                >
                  {hit.icon ? (
                    <Box flexShrink={0} display="flex" color="var(--admin-text-soft)">
                      {hit.icon}
                    </Box>
                  ) : null}
                  <Box flex="1" minW={0}>
                    <Text fontSize="sm" fontWeight="600" lineClamp={1}>
                      {hit.label}
                    </Text>
                    <Text fontSize="10px" color="var(--admin-text-soft)" lineClamp={1}>
                      {hit.section}
                    </Text>
                  </Box>
                  {i === 0 ? (
                    <Box flexShrink={0} color="var(--admin-text-soft)">
                      <CornerDownLeft size={13} />
                    </Box>
                  ) : null}
                </HStack>
              ))}
            </Stack>
          )}
        </Box>
      ) : null}
    </Box>
  );
}
