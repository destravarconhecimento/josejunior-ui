"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, HStack, Input, Stack, Text } from "@chakra-ui/react";
import { CornerDownLeft, Search } from "lucide-react";
import { useShellNav } from "./ShellNav";
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
      const hay = norm(`${item.label} ${item.group ?? ""} ${section.title} ${item.href}`);
      if (q.split(/\s+/).every((tok) => hay.includes(tok))) hits.push({ ...item, section: section.title });
    }
  }
  return hits.slice(0, 8);
}

function sectionOf(sections: NavSection[], href: string): string {
  return sections.find((s) => s.items.some((it) => it.href === href))?.title ?? "";
}

export function NavSearch({
  sections,
  onNavigate,
  onDark = false,
  placeholder,
  suggestions,
  hotkey = false,
}: {
  sections: NavSection[];
  onNavigate?: () => void;
  onDark?: boolean;
  placeholder?: string;
  suggestions?: NavItem[];
  hotkey?: boolean;
}) {
  const { navigate, textos } = useShellNav();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editable, setEditable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hits = useMemo<Hit[]>(
    () =>
      query
        ? search(sections, query)
        : (suggestions ?? []).map((it) => ({ ...it, section: sectionOf(sections, it.href) })),
    [sections, query, suggestions],
  );

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setEditable(true);
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hotkey]);

  const go = (href: string) => {
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
    navigate(href);
    onNavigate?.();
  };

  const fg = onDark ? "white" : "var(--admin-text)";
  const soft = onDark ? "rgba(255,255,255,0.5)" : "var(--admin-text-soft)";
  const mostrar = open && (query !== "" || hits.length > 0);

  return (
    <Box position="relative" w="full">
      <HStack
        gap={2}
        px={3}
        h="34px"
        borderRadius="9px"
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
            setOpen(true);
          }}
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
          placeholder={placeholder ?? textos.buscarNoMenu}
          aria-label={textos.buscarNoMenuAria}
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

      {mostrar ? (
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
          {!query ? (
            <Text px={2.5} pb={1} fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="0.06em" color="var(--admin-text-soft)">
              {textos.maisUsados}
            </Text>
          ) : null}
          {hits.length === 0 ? (
            <Text px={2} py={2} fontSize="sm" color="var(--admin-text-soft)">
              {textos.nadaEncontrado}
            </Text>
          ) : (
            <Stack gap={0.5}>
              {hits.map((hit, i) => (
                <HStack
                  key={hit.href}
                  as="button"
                  className="admin-nav-item"
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
                      {hit.group ? `${hit.section} · ${hit.group}` : hit.section}
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
