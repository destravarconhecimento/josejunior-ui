"use client";

import { useMemo, useState } from "react";
import { Box, HStack, Input, Stack, Text, Textarea } from "@chakra-ui/react";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "./Button";

/**
 * RepSiteSectionsEditor — editor ÚNICO das sections do site do representante (G7).
 * Puro e controlado: recebe o `base` (subtree pt do dicionário do site do rep — os
 * DEFAULTS em código) e o `value` (overrides parciais `repsite:<slug>`), e emite o
 * próximo overrides via `onChange`. Não sabe de banco nem de action — o sistema
 * (representante-editor) e o portal do rep (/painel/site) plugam o save cada um.
 *
 * Regras de UX:
 *  - Campo vazio = SEM override (o site usa o texto padrão, mostrado no placeholder).
 *  - A estrutura (nº de passos/planos/depoimentos) vem do default — aqui só se troca
 *    TEXTO, posição a posição; o shape é podado no servidor (`sanitizeRepSiteOverrides`).
 *  - Depoimentos ganham o campo extra `name` (identidade; não traduz).
 */

export type RepSiteSectionsEditorProps = {
  /** Subtree pt-BR do dicionário (defaults) — só as seções editáveis. */
  base: Record<string, unknown>;
  /** Overrides atuais (subtree parcial; `{}` = tudo padrão). */
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
};

const SECTIONS: { key: string; label: string; hint: string }[] = [
  { key: "trust", label: "Números (confiança)", hint: "A faixa de números logo abaixo do topo." },
  { key: "how", label: "Como funciona + Oferta", hint: "Os passos e o que está incluído." },
  { key: "ai", label: "Assistente de IA", hint: "A seção que compara com e sem IA." },
  { key: "showcase", label: "Vitrine (agenda)", hint: "O mock de agenda e os benefícios." },
  { key: "testimonials", label: "Depoimentos", hint: "Quem depõe, cargo e texto." },
  { key: "pricing", label: "Planos e preços", hint: "Nome, slogan e itens de cada plano." },
  { key: "finalCta", label: "Chamada final", hint: "O convite de fechamento da página." },
];

/** Rótulos pt-BR por NOME de campo (folha). Fallback = o próprio nome. */
const LEAF_LABELS: Record<string, string> = {
  value: "Número",
  label: "Rótulo",
  title: "Título",
  text: "Texto",
  name: "Nome",
  role: "Cargo",
  howEyebrow: "Chapéu",
  howTitle: "Título",
  howTitleSub: "Subtítulo",
  offerEyebrow: "Chapéu da oferta",
  offerTitle: "Título da oferta",
  offerHighlight: "Destaque da oferta",
  badge: "Selo",
  titleLead: "Título (início)",
  titleHighlight: "Título (destaque)",
  titleTail: "Título (fim)",
  paragraph: "Parágrafo",
  description: "Descrição",
  eyebrow: "Chapéu",
  withoutAi: "Sem IA — rótulo",
  withoutAiMsg: "Sem IA — mensagem",
  withoutAiNote: "Sem IA — nota",
  withAi: "Com IA — rótulo",
  withAiMsg: "Com IA — mensagem",
  withAiNote: "Com IA — nota",
  cta: "Botão (CTA)",
  ctaWa: "Mensagem do WhatsApp",
  weekAgenda: "Rótulo 'agenda da semana'",
  synced: "Rótulo 'sincronizado'",
  statusConfirmed: "Status confirmado",
  statusWaiting: "Status aguardando",
  serviceSample: "Serviço de exemplo",
  popular: "Selo 'popular'",
  onRequest: "Rótulo 'sob consulta'",
  tagline: "Slogan",
  msg: "Mensagem do WhatsApp",
};

/** Rótulo do ITEM de cada array (steps.2 → "Passo 3"). Fallback = "Item". */
const ITEM_LABELS: Record<string, string> = {
  items: "Item",
  steps: "Passo",
  offer: "Incluído",
  capabilities: "Capacidade",
  benefits: "Benefício",
  plans: "Plano",
  features: "Item do plano",
};

/** Campos EXTRAS (fora do dicionário) por array — identidade editável, não traduz. */
const EXTRA_ARRAY_FIELDS: Record<string, { key: string; label: string; placeholder: string }[]> = {
  "testimonials.items": [{ key: "name", label: "Nome (quem depõe)", placeholder: "Nome exibido no card" }],
};

/**
 * Rótulos pt-BR por PATTERN da allow-list `REPSITE_SECTIONS_PATHS` — pra
 * TranslationsSection dos DOIS editores (sistema + portal do rep) não divergirem.
 */
export const REPSITE_I18N_LABELS: Record<string, string> = {
  "trust.items.*.value": "Confiança — número",
  "trust.items.*.label": "Confiança — rótulo",
  "how.howEyebrow": "Como funciona — chapéu",
  "how.howTitle": "Como funciona — título",
  "how.howTitleSub": "Como funciona — subtítulo",
  "how.steps.*.title": "Passo — título",
  "how.steps.*.text": "Passo — texto",
  "how.offerEyebrow": "Oferta — chapéu",
  "how.offerTitle": "Oferta — título",
  "how.offerHighlight": "Oferta — destaque",
  "how.offer.*.title": "Oferta — item (título)",
  "how.offer.*.text": "Oferta — item (texto)",
  "ai.badge": "IA — selo",
  "ai.title": "IA — título",
  "ai.titleHighlight": "IA — título (destaque)",
  "ai.paragraph": "IA — parágrafo",
  "ai.capabilities.*.title": "IA — capacidade (título)",
  "ai.capabilities.*.text": "IA — capacidade (texto)",
  "ai.withoutAi": "IA — sem IA (rótulo)",
  "ai.withoutAiMsg": "IA — sem IA (mensagem)",
  "ai.withoutAiNote": "IA — sem IA (nota)",
  "ai.withAi": "IA — com IA (rótulo)",
  "ai.withAiMsg": "IA — com IA (mensagem)",
  "ai.withAiNote": "IA — com IA (nota)",
  "ai.cta": "IA — botão",
  "ai.ctaWa": "IA — mensagem do WhatsApp",
  "showcase.eyebrow": "Vitrine — chapéu",
  "showcase.titleLead": "Vitrine — título (início)",
  "showcase.titleHighlight": "Vitrine — título (destaque)",
  "showcase.titleTail": "Vitrine — título (fim)",
  "showcase.description": "Vitrine — descrição",
  "showcase.weekAgenda": "Vitrine — rótulo 'agenda da semana'",
  "showcase.synced": "Vitrine — rótulo 'sincronizado'",
  "showcase.statusConfirmed": "Vitrine — status confirmado",
  "showcase.statusWaiting": "Vitrine — status aguardando",
  "showcase.serviceSample": "Vitrine — serviço de exemplo",
  "showcase.benefits.*.title": "Vitrine — benefício (título)",
  "showcase.benefits.*.text": "Vitrine — benefício (texto)",
  "testimonials.eyebrow": "Depoimentos — chapéu",
  "testimonials.titleLead": "Depoimentos — título (início)",
  "testimonials.titleHighlight": "Depoimentos — título (destaque)",
  "testimonials.items.*.role": "Depoimento — cargo",
  "testimonials.items.*.text": "Depoimento — texto",
  "pricing.eyebrow": "Planos — chapéu",
  "pricing.titleLead": "Planos — título (início)",
  "pricing.titleHighlight": "Planos — título (destaque)",
  "pricing.description": "Planos — descrição",
  "pricing.popular": "Planos — selo 'popular'",
  "pricing.onRequest": "Planos — rótulo 'sob consulta'",
  "pricing.plans.*.name": "Plano — nome",
  "pricing.plans.*.tagline": "Plano — slogan",
  "pricing.plans.*.features.*": "Plano — item",
  "pricing.plans.*.cta": "Plano — botão",
  "pricing.plans.*.msg": "Plano — mensagem do WhatsApp",
  "finalCta.badge": "Chamada final — selo",
  "finalCta.title": "Chamada final — título",
  "finalCta.paragraph": "Chamada final — parágrafo",
  "finalCta.cta": "Chamada final — botão",
};

const SOFT = "var(--admin-text-soft, #64748b)";

function get(obj: unknown, segs: string[]): unknown {
  let cur: unknown = obj;
  for (const s of segs) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[s];
  }
  return cur;
}

/**
 * Grava `val` no path (imutável); vazio/undefined REMOVE e poda containers que
 * ficarem vazios. Segmento numérico = posição de array (buracos viram null,
 * espelhando o shape que o sanitize do servidor grava).
 */
function setAtPath(root: Record<string, unknown>, segs: string[], val: string | undefined): Record<string, unknown> {
  const step = (node: unknown, i: number): unknown => {
    const seg = segs[i];
    const isIndex = /^\d+$/.test(seg);
    const last = i === segs.length - 1;
    if (isIndex) {
      const idx = Number(seg);
      const arr: unknown[] = Array.isArray(node) ? [...node] : [];
      while (arr.length <= idx) arr.push(null);
      const next = last ? (val ?? null) : step(arr[idx], i + 1);
      arr[idx] = next ?? null;
      // Poda: array só de null = sem override.
      return arr.some((v) => v != null) ? arr : undefined;
    }
    const obj: Record<string, unknown> =
      node && typeof node === "object" && !Array.isArray(node) ? { ...(node as Record<string, unknown>) } : {};
    const next = last ? val : step(obj[seg], i + 1);
    if (next === undefined) delete obj[seg];
    else obj[seg] = next;
    return Object.keys(obj).length > 0 ? obj : undefined;
  };
  return (step(root, 0) as Record<string, unknown> | undefined) ?? {};
}

function FieldRow({
  label,
  defaultText,
  value,
  onChange,
}: {
  label: string;
  defaultText: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const long = defaultText.length > 90 || defaultText.includes("\n");
  const inputProps = {
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    placeholder: defaultText || "Texto próprio (vazio = padrão)",
    size: "sm" as const,
    bg: "var(--admin-surface)",
    borderColor: "var(--admin-border)",
    borderRadius: "10px",
  };
  return (
    <Box>
      <HStack gap={2} mb={1}>
        <Text fontSize="xs" fontWeight="700" color="var(--admin-text)">
          {label}
        </Text>
        {value.trim() !== "" ? (
          <Box as="span" fontSize="10px" fontWeight="700" px="6px" py="1px" borderRadius="6px" bg="rgba(59,130,246,0.12)" color="#2563eb">
            personalizado
          </Box>
        ) : null}
      </HStack>
      {long ? <Textarea {...inputProps} rows={Math.min(5, Math.max(2, Math.ceil(defaultText.length / 90)))} /> : <Input {...inputProps} />}
    </Box>
  );
}

export function RepSiteSectionsEditor({ base, value, onChange }: RepSiteSectionsEditorProps) {
  const [open, setOpen] = useState<string | null>(null);

  const overrideCount = useMemo(() => {
    const count = (node: unknown): number => {
      if (typeof node === "string") return node.trim() === "" ? 0 : 1;
      if (Array.isArray(node)) return node.reduce((n: number, v) => n + count(v), 0);
      if (node && typeof node === "object") return Object.values(node).reduce((n: number, v) => n + count(v), 0);
      return 0;
    };
    return count(value);
  }, [value]);

  const setField = (segs: string[], v: string) => {
    onChange(setAtPath(value, segs, v.trim() === "" ? undefined : v));
  };

  // Percorre o subtree default; toda folha string vira um campo editável.
  const renderNode = (node: unknown, segs: string[], keyPattern: string): React.ReactNode => {
    if (typeof node === "string") {
      const cur = get(value, segs);
      const leaf = segs.filter((s) => !/^\d+$/.test(s)).pop() ?? "";
      return (
        <FieldRow
          key={segs.join(".")}
          label={LEAF_LABELS[leaf] ?? leaf}
          defaultText={node}
          value={typeof cur === "string" ? cur : ""}
          onChange={(v) => setField(segs, v)}
        />
      );
    }
    if (Array.isArray(node)) {
      const itemLabel = ITEM_LABELS[segs[segs.length - 1]] ?? "Item";
      const extras = EXTRA_ARRAY_FIELDS[keyPattern] ?? [];
      // Array de STRINGS (ex.: itens do plano): um campo por posição, sem wrapper.
      if (node.every((it) => typeof it === "string")) {
        return node.map((item, i) => {
          const cur = get(value, [...segs, String(i)]);
          return (
            <FieldRow
              key={`${segs.join(".")}.${i}`}
              label={`${itemLabel} ${i + 1}`}
              defaultText={item as string}
              value={typeof cur === "string" ? cur : ""}
              onChange={(v) => setField([...segs, String(i)], v)}
            />
          );
        });
      }
      return node.map((item, i) => (
        <Box key={`${segs.join(".")}.${i}`} pl={3} borderLeft="2px solid var(--admin-border)">
          <Text fontSize="xs" fontWeight="800" color={SOFT} mb={2} textTransform="uppercase" letterSpacing="0.04em">
            {itemLabel} {i + 1}
          </Text>
          <Stack gap={3}>
            {extras.map((x) => {
              const cur = get(value, [...segs, String(i), x.key]);
              return (
                <FieldRow
                  key={`${segs.join(".")}.${i}.${x.key}`}
                  label={x.label}
                  defaultText={x.placeholder}
                  value={typeof cur === "string" ? cur : ""}
                  onChange={(v) => setField([...segs, String(i), x.key], v)}
                />
              );
            })}
            {renderNode(item, [...segs, String(i)], keyPattern)}
          </Stack>
        </Box>
      ));
    }
    if (node && typeof node === "object") {
      return Object.entries(node as Record<string, unknown>).map(([k, v]) =>
        renderNode(v, [...segs, k], keyPattern ? `${keyPattern}.${k}` : k),
      );
    }
    return null;
  };

  return (
    <Stack gap={3}>
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Text fontSize="xs" color={SOFT}>
          Texto próprio por seção — o que ficar vazio usa o padrão da plataforma (e é
          traduzido automaticamente nos idiomas ativos).
        </Text>
        {overrideCount > 0 ? (
          <HStack gap={2}>
            <Text fontSize="xs" fontWeight="700" color="var(--admin-text)">
              {overrideCount} personalizado{overrideCount > 1 ? "s" : ""}
            </Text>
            <Button type="button" size="xs" tone="outline" onClick={() => onChange({})}>
              <RotateCcw size={12} /> Restaurar padrão
            </Button>
          </HStack>
        ) : null}
      </HStack>
      {SECTIONS.filter((s) => base[s.key] != null).map((s) => {
        const isOpen = open === s.key;
        const sectionCount = (() => {
          const count = (node: unknown): number => {
            if (typeof node === "string") return node.trim() === "" ? 0 : 1;
            if (Array.isArray(node)) return node.reduce((n: number, v) => n + count(v), 0);
            if (node && typeof node === "object") return Object.values(node).reduce((n: number, v) => n + count(v), 0);
            return 0;
          };
          return count(value[s.key]);
        })();
        return (
          <Box key={s.key} className="admin-card" p={0} overflow="hidden">
            <HStack
              as="button"
              // `type` não existe em StackProps — sem isto o header viraria submit
              // dentro do <form> do portal do rep.
              {...({ type: "button" } as Record<string, unknown>)}
              onClick={() => setOpen(isOpen ? null : s.key)}
              w="100%"
              px={4}
              py={3}
              justify="space-between"
              cursor="pointer"
              _hover={{ bg: "var(--admin-surface)" }}
            >
              <HStack gap={2}>
                <Box color="var(--admin-primary)">{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</Box>
                <Text fontWeight="700" fontSize="sm" color="var(--admin-text)">
                  {s.label}
                </Text>
                {sectionCount > 0 ? (
                  <Box as="span" fontSize="10px" fontWeight="700" px="6px" py="1px" borderRadius="6px" bg="rgba(59,130,246,0.12)" color="#2563eb">
                    {sectionCount}
                  </Box>
                ) : null}
              </HStack>
              <Text fontSize="xs" color={SOFT} display={{ base: "none", md: "block" }}>
                {s.hint}
              </Text>
            </HStack>
            {isOpen ? (
              <Stack gap={4} px={4} pb={4} pt={1}>
                {renderNode(base[s.key], [s.key], s.key)}
              </Stack>
            ) : null}
          </Box>
        );
      })}
    </Stack>
  );
}
