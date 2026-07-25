"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { Box, HStack, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { Languages, Sparkles } from "lucide-react";
import { Button } from "./Button";
import { FlagIcon } from "./FlagIcon";
import { toaster } from "./Toast";

/**
 * TranslationsSection — a UI ÚNICA de idiomas dos editores de conteúdo (plano G2).
 * Puro: não sabe de banco nem de entidade — recebe 3 actions injetadas pelo app
 * (`load`/`save`/`translateNow`) e renderiza, por idioma ≠ pt, os campos traduzíveis
 * da allow-list com a fonte pt ao lado: tradução atual (IA ou manual), edição à mão
 * (vira `origin='manual'`, que SEMPRE vence a IA) e o selo "desatualizada" quando o
 * pt mudou depois da tradução (staleness por srcHash — o público já caiu no pt).
 *
 * Contrato:
 *  - `load()` devolve o payload inteiro (idiomas habilitados ≠ pt, campos com a fonte
 *    pt ATUAL e as traduções existentes). Sem idioma ligado → dica de ativar.
 *  - `save(entries)` grava override MANUAL; valor vazio APAGA a tradução (o público
 *    volta a ver o pt até a IA regenerar).
 *  - `translateNow()` roda o traduz-agora no servidor (mesmo caminho blindado do
 *    traduz-no-save, FORA do after) e o componente recarrega o payload.
 *
 * Cada editor só monta o mapa `labels` (pattern da allow-list → rótulo pt-BR) e as
 * 3 actions fininhas. Molde de consumo: venda-editor (páginas de venda).
 */

export type TranslationsLocale = { code: string; label: string; flag: string };
export type TranslationsField = { field: string; source: string };
export type TranslationsEntry = {
  field: string;
  locale: string;
  value: string;
  origin: string;
  stale: boolean;
};

export type TranslationsPayload = {
  /** Idiomas habilitados ALÉM do pt (vazio = site monolíngue → só a dica). */
  locales: TranslationsLocale[];
  /** Campos traduzíveis com o texto-fonte pt ATUAL (paths concretos, ex. `faq.0.q`). */
  fields: TranslationsField[];
  /** Traduções já gravadas (todas as línguas), com origem e staleness. */
  entries: TranslationsEntry[];
};

export type TranslationsActionResult = { ok: boolean; error?: string };

export type TranslationsSectionProps = {
  /** Título do card (padrão "Idiomas"). */
  title?: string;
  /** Rótulos pt-BR por PATTERN da allow-list (`faq.*.q` → "FAQ — pergunta"). */
  labels?: Record<string, string>;
  load: () => Promise<TranslationsPayload>;
  save: (
    entries: { field: string; locale: string; value: string; source: string }[],
  ) => Promise<TranslationsActionResult>;
  translateNow: () => Promise<TranslationsActionResult>;
};

/** `faq.0.q` → `faq.*.q` (índices viram `*` pra casar com a allow-list/labels). */
function patternOf(path: string): string {
  return path.replace(/(^|\.)\d+(?=\.|$)/g, "$1*");
}

/** Índice humano do 1º segmento numérico (`faq.2.q` → 3) — distingue itens de array. */
function indexOf(path: string): number | null {
  const m = path.match(/(?:^|\.)(\d+)(?:\.|$)/);
  return m ? Number(m[1]) + 1 : null;
}

const SOFT = "var(--admin-text-soft, #64748b)";

function OriginBadge({ entry }: { entry: TranslationsEntry | undefined }) {
  if (!entry) return null;
  if (entry.origin === "manual") {
    return (
      <Box as="span" fontSize="10px" fontWeight="700" px="6px" py="1px" borderRadius="6px" bg="rgba(59,130,246,0.12)" color="#2563eb">
        manual
      </Box>
    );
  }
  if (entry.stale) {
    return (
      <Box as="span" fontSize="10px" fontWeight="700" px="6px" py="1px" borderRadius="6px" bg="rgba(245,158,11,0.14)" color="#b45309">
        desatualizada
      </Box>
    );
  }
  return (
    <Box as="span" fontSize="10px" fontWeight="700" px="6px" py="1px" borderRadius="6px" bg="rgba(16,185,129,0.12)" color="#059669">
      IA
    </Box>
  );
}

export function TranslationsSection({ title = "Idiomas", labels, load, save, translateNow }: TranslationsSectionProps) {
  const [payload, setPayload] = useState<TranslationsPayload | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [active, setActive] = useState<string>("");
  // Rascunhos por `${locale}::${field}` — só o que o admin digitou nesta sessão.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, startSave] = useTransition();
  const [translating, startTranslate] = useTransition();

  const reload = useCallback(async () => {
    try {
      const p = await load();
      setPayload(p);
      setLoadError(false);
      setDrafts({});
      setActive((cur) => (p.locales.some((l) => l.code === cur) ? cur : (p.locales[0]?.code ?? "")));
    } catch {
      setLoadError(true);
    }
  }, [load]);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entryMap = useMemo(() => {
    const m = new Map<string, TranslationsEntry>();
    for (const e of payload?.entries ?? []) m.set(`${e.locale}::${e.field}`, e);
    return m;
  }, [payload]);

  const dirty = useMemo(() => {
    const out: { field: string; locale: string; value: string; source: string }[] = [];
    if (!payload) return out;
    const sourceOf = new Map(payload.fields.map((f) => [f.field, f.source]));
    for (const [key, value] of Object.entries(drafts)) {
      const i = key.indexOf("::");
      const locale = key.slice(0, i);
      const field = key.slice(i + 2);
      const base = entryMap.get(key)?.value ?? "";
      if (value === base) continue;
      const source = sourceOf.get(field);
      if (source == null) continue;
      out.push({ field, locale, value, source });
    }
    return out;
  }, [drafts, payload, entryMap]);

  const doSave = () => {
    if (dirty.length === 0) return;
    startSave(async () => {
      const r = await save(dirty);
      if (r.ok) {
        toaster.create({ title: "Traduções salvas", description: "O texto manual vence a IA no site.", type: "success" });
        await reload();
      } else {
        toaster.create({ title: "Não foi possível salvar", description: r.error, type: "error" });
      }
    });
  };

  const doTranslate = () => {
    startTranslate(async () => {
      const r = await translateNow();
      if (r.ok) {
        toaster.create({ title: "Traduções geradas", description: "A IA preencheu o que faltava ou mudou.", type: "success" });
        await reload();
      } else {
        toaster.create({ title: "Não foi possível traduzir", description: r.error, type: "error" });
      }
    });
  };

  const header = (
    <HStack gap={2} mb={1}>
      <Box color="var(--admin-primary)">
        <Languages size={16} />
      </Box>
      <Text fontWeight="700" color="var(--admin-text)">
        {title}
      </Text>
    </HStack>
  );

  // Sem payload ainda (carregando) ou erro: card discreto, nunca quebra o editor.
  if (!payload) {
    return (
      <Box className="admin-card" p={5}>
        {header}
        <Text fontSize="xs" color={SOFT}>
          {loadError ? "Não foi possível carregar as traduções." : "Carregando traduções…"}
        </Text>
      </Box>
    );
  }

  if (payload.locales.length === 0) {
    return (
      <Box className="admin-card" p={5}>
        {header}
        <Text fontSize="xs" color={SOFT}>
          Só o português está ativo. Ligue outros idiomas na tela Idiomas para traduzir este conteúdo.
        </Text>
      </Box>
    );
  }

  const fields = payload.fields;

  return (
    <Box className="admin-card" p={{ base: 5, md: 6 }}>
      <HStack justify="space-between" align="start" flexWrap="wrap" gap={3} mb={1}>
        {header}
        <HStack gap={2}>
          <Button size="sm" tone="outline" onClick={doTranslate} loading={translating}>
            <Sparkles size={14} /> Traduzir agora
          </Button>
          <Button size="sm" tone="primary" onClick={doSave} loading={saving} disabled={dirty.length === 0}>
            Salvar traduções{dirty.length > 0 ? ` (${dirty.length})` : ""}
          </Button>
        </HStack>
      </HStack>
      <Text fontSize="xs" color={SOFT} mb={4}>
        O que você editar aqui vira tradução manual e vence a IA. Deixar vazio apaga a
        tradução (o público vê o português até a IA regenerar).
      </Text>

      {/* Abas de idioma (≠ pt) */}
      <HStack gap={2} mb={4} flexWrap="wrap">
        {payload.locales.map((l) => {
          const isActive = l.code === active;
          return (
            <Button
              key={l.code}
              size="sm"
              tone={isActive ? "primary" : "outline"}
              onClick={() => setActive(l.code)}
            >
              <FlagIcon code={l.flag} size={16} /> {l.label}
            </Button>
          );
        })}
      </HStack>

      {fields.length === 0 ? (
        <Text fontSize="xs" color={SOFT}>
          Nada traduzível ainda — escreva o conteúdo em português e salve primeiro.
        </Text>
      ) : (
        <Stack gap={4}>
          {fields.map((f) => {
            const key = `${active}::${f.field}`;
            const entry = entryMap.get(key);
            const value = drafts[key] ?? entry?.value ?? "";
            const idx = indexOf(f.field);
            const label = labels?.[patternOf(f.field)] ?? f.field;
            const long = f.source.includes("\n") || f.source.length > 90;
            const inputProps = {
              value,
              onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                setDrafts((d) => ({ ...d, [key]: e.target.value })),
              placeholder: "Sem tradução — o público vê o texto em português",
              size: "sm" as const,
              bg: "var(--admin-surface)",
              borderColor: "var(--admin-border)",
              borderRadius: "10px",
            };
            return (
              <Box key={f.field}>
                <HStack gap={2} mb={1} flexWrap="wrap">
                  <Text fontSize="xs" fontWeight="700" color="var(--admin-text)">
                    {label}
                    {idx != null ? ` #${idx}` : ""}
                  </Text>
                  <OriginBadge entry={entry} />
                </HStack>
                <Text fontSize="xs" color={SOFT} mb={1.5} lineClamp={2}>
                  {f.source}
                </Text>
                {long ? (
                  <Textarea {...inputProps} rows={Math.min(6, Math.max(2, f.source.split("\n").length))} />
                ) : (
                  <Input {...inputProps} />
                )}
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
