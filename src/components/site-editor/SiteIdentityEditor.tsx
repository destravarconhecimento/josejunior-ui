"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Field,
  Flex,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import {
  Plus,
  Trash2,
  Save,
  Check,
  BarChart3,
  Link2,
  Copy,
  Palette,
  Home,
  Briefcase,
  Users,
  Layers,
  Languages,
} from "lucide-react";
import { Button } from "../Button";
import { Tabs, type TabDef } from "../Tabs";
import { Accordion, type AccordionItemDef } from "../Accordion";
import { SITE_ICON_OPTIONS } from "./icon-options";
import type {
  SiteIdentityContent,
  SiteMarketing,
  SiteSaveResult,
  SiteImageUploadSlot,
} from "./types";

/**
 * Editor "Meu site" — componente PURO do design-system (molde `MailClient`):
 * recebe o conteúdo + marketing por props e devolve as gravações por callbacks
 * (`onSaveContent`/`onSaveMarketing`). O upload de imagem é um SLOT injetado pelo
 * app (`renderImageUpload`), pois quem sobe o arquivo pro Blob é a server action.
 *
 * Consumido por `apps/sistema` (Meu site → josejunior.dev, renderizado pelo
 * apps/web).
 *
 * ORGANIZAÇÃO (o porquê das abas): era um rolo único de ~15 cartões com UM botão
 * de salvar lá embaixo — dar manutenção era impossível. Agora cada assunto é uma
 * ABA com o seu próprio botão de salvar, e as seções longas (home, portfólio,
 * outras páginas) vêm FECHADAS em grupos: clicou, abriu, editou.
 *
 * ⚠️ O conteúdo do site é UM documento só (`landing_content.main`): qualquer
 * "Salvar" grava o documento inteiro. O botão fica perto do que você está
 * editando — mas ele não perde a edição que você fez em outra aba (por isso o
 * texto de apoio diz isso em voz alta, em vez de fingir gravação parcial).
 */

const inputProps = {
  bg: "white",
  size: "lg",
  borderColor: "var(--admin-border)",
  _hover: { borderColor: "var(--admin-accent-soft)" },
  _focus: { borderColor: "var(--admin-accent)", boxShadow: "0 0 0 3px rgba(168,85,247,0.18)" },
  borderRadius: "10px",
} as const;

function Card({
  title,
  icon,
  hint,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Box className="admin-card" p={{ base: 5, md: 7 }} h="100%">
      <Stack gap={hint ? 1 : 0} mb={5}>
        <HStack gap={2}>
          {icon}
          <Text fontSize="lg" fontWeight="700" color="var(--admin-primary)" className="admin-h">
            {title}
          </Text>
        </HStack>
        {hint ? (
          <Text fontSize="sm" color="var(--admin-text-soft)">
            {hint}
          </Text>
        ) : null}
      </Stack>
      <Stack gap={5}>{children}</Stack>
    </Box>
  );
}

/** Etiqueta curta (onde a seção aparece, se está no ar, contador de itens). */
function Tag({ children, tone = "soft" }: { children: React.ReactNode; tone?: "soft" | "warn" | "off" }) {
  const styles = {
    soft: { bg: "var(--admin-nav-active)", color: "var(--admin-primary)", border: "1px solid var(--admin-border)" },
    warn: { bg: "rgba(234,179,8,0.12)", color: "#854d0e", border: "1px solid rgba(234,179,8,0.35)" },
    off: { bg: "rgba(100,116,139,0.10)", color: "#475569", border: "1px solid rgba(100,116,139,0.25)" },
  }[tone];
  return (
    <Box
      as="span"
      display="inline-block"
      px={2}
      py={0.5}
      borderRadius="full"
      fontSize="11px"
      fontWeight="700"
      whiteSpace="nowrap"
      {...styles}
    >
      {children}
    </Box>
  );
}

function TextField({
  label,
  value,
  onChange,
  textarea,
  rows,
  type,
  placeholder,
  helper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
  type?: string;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <Field.Root>
      <Field.Label fontWeight="600" fontSize="sm" color="var(--admin-primary)">{label}</Field.Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows ?? 2} placeholder={placeholder} {...inputProps} />
      ) : (
        <Input value={value} type={type} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} {...inputProps} />
      )}
      {helper && <Field.HelperText>{helper}</Field.HelperText>}
    </Field.Root>
  );
}

/** Campo de cor: swatch nativo + hex digitável (vazio = herda a marca do José). */
function ColorField({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  helper?: string;
}) {
  const hex = /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : "";
  return (
    <Field.Root>
      <Field.Label fontWeight="600" fontSize="sm" color="var(--admin-primary)">{label}</Field.Label>
      <HStack gap={2} w="100%">
        <input
          type="color"
          value={hex || "#5b21b6"}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} (seletor)`}
          style={{ width: 44, height: 44, padding: 0, border: "1px solid var(--admin-border)", borderRadius: 10, background: "white", cursor: "pointer", flexShrink: 0 }}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#5b21b6" {...inputProps} flex="1" />
      </HStack>
      {helper && <Field.HelperText>{helper}</Field.HelperText>}
    </Field.Root>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Field.Root>
      <Field.Label fontWeight="600" fontSize="sm" color="var(--admin-primary)">{label}</Field.Label>
      <NativeSelect.Root size="lg">
        <NativeSelect.Field
          value={value ? "true" : "false"}
          onChange={(e) => onChange(e.target.value === "true")}
          bg="white"
          borderColor="var(--admin-border)"
          borderRadius="10px"
        >
          <option value="false">Desativado</option>
          <option value="true">Ativado</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field.Root>
  );
}

/** Seletor de ícone (nomes vindos do registry do design-system). */
function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <NativeSelect.Root size="lg" w="180px">
      <NativeSelect.Field
        value={value}
        onChange={(e) => onChange(e.target.value)}
        bg="white"
        borderColor="var(--admin-border)"
        borderRadius="10px"
      >
        {SITE_ICON_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}

/**
 * Editor genérico de lista: cada item vira uma linha (renderRow) com botão de
 * remover; botão de adicionar no fim. `update(patch)` faz o merge imutável do
 * item corrente. Reaproveitado por todas as seções em lista (portas, dores,
 * passos, projetos, trajetória, depoimentos, destaques, contatos, skills…).
 */
function ListBlock<T extends object>({
  label,
  hint,
  items,
  onChange,
  empty,
  addLabel,
  max,
  renderRow,
}: {
  label: string;
  hint?: string;
  items: T[];
  onChange: (next: T[]) => void;
  empty: T;
  addLabel: string;
  max?: number;
  renderRow: (item: T, i: number, update: (patch: Partial<T>) => void) => React.ReactNode;
}) {
  const update = (i: number) => (patch: Partial<T>) => {
    const next = items.slice();
    next[i] = { ...(next[i] as object), ...patch } as T;
    onChange(next);
  };
  return (
    <Box>
      <Text fontWeight="600" fontSize="sm" color="var(--admin-primary)" mb={hint ? 0.5 : 2}>{label}</Text>
      {hint ? <Text fontSize="xs" color="var(--admin-text-soft)" mb={2}>{hint}</Text> : null}
      <Stack gap={3}>
        {items.map((item, i) => (
          <HStack
            key={i}
            gap={2}
            align="flex-start"
            p={3}
            borderRadius="12px"
            border="1px solid var(--admin-border)"
            bg="rgba(0,0,0,0.015)"
          >
            <Box flex="1" minW={0}>{renderRow(item, i, update(i))}</Box>
            <IconButton
              aria-label="Remover"
              size="sm"
              variant="ghost"
              color="red.500"
              flexShrink={0}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              <Trash2 size={15} />
            </IconButton>
          </HStack>
        ))}
        {(max === undefined || items.length < max) && (
          <Button
            size="sm"
            variant="outline"
            alignSelf="flex-start"
            borderColor="var(--admin-border)"
            color="var(--admin-primary)"
            borderRadius="10px"
            onClick={() => onChange([...items, empty])}
          >
            <Plus size={14} style={{ marginRight: 4 }} /> {addLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
}

/** Lista de textos simples (parágrafos do Sobre, o que eu preciso de você…). */
function StringList({
  label,
  hint,
  items,
  onChange,
  addLabel,
  max,
  placeholder,
  rows = 2,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  max?: number;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Box>
      <Text fontWeight="600" fontSize="sm" color="var(--admin-primary)" mb={hint ? 0.5 : 2}>{label}</Text>
      {hint ? <Text fontSize="xs" color="var(--admin-text-soft)" mb={2}>{hint}</Text> : null}
      <Stack gap={2}>
        {items.map((v, i) => (
          <HStack key={i} gap={2} align="flex-start">
            <Textarea
              value={v}
              rows={rows}
              flex="1"
              placeholder={placeholder}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              {...inputProps}
            />
            <IconButton
              aria-label="Remover"
              size="sm"
              variant="ghost"
              color="red.500"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              <Trash2 size={15} />
            </IconButton>
          </HStack>
        ))}
        {(max === undefined || items.length < max) && (
          <Button
            size="sm"
            variant="outline"
            alignSelf="flex-start"
            borderColor="var(--admin-border)"
            color="var(--admin-primary)"
            borderRadius="10px"
            onClick={() => onChange([...items, ""])}
          >
            <Plus size={14} style={{ marginRight: 4 }} /> {addLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
}

/** Campo de imagem: prévia + botão de upload (slot do app) + voltar ao padrão. */
function ImageField({
  label,
  hint,
  value,
  fallback,
  folder,
  onChange,
  renderImageUpload,
}: {
  label: string;
  hint: string;
  value: string;
  /** O que o site mostra quando o campo está vazio (só pra prévia). */
  fallback: string;
  folder: string;
  onChange: (url: string) => void;
  renderImageUpload?: (slot: SiteImageUploadSlot) => React.ReactNode;
}) {
  const src = value.trim() || fallback;
  return (
    <Box>
      <Text fontWeight="600" fontSize="sm" color="var(--admin-primary)" mb={2}>{label}</Text>
      <HStack gap={4} align="flex-start" flexWrap="wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12, border: "1px solid var(--admin-border)", background: "#0b0614" }}
        />
        <Stack gap={2} flex="1" minW="240px">
          <HStack gap={2} flexWrap="wrap">
            {renderImageUpload?.({ folder, label: "Enviar imagem", onUploaded: onChange })}
            {value.trim() ? (
              <Button size="sm" variant="ghost" color="red.500" borderRadius="10px" onClick={() => onChange("")}>
                Usar o padrão
              </Button>
            ) : null}
          </HStack>
          <Input
            value={value}
            placeholder={fallback}
            onChange={(e) => onChange(e.target.value)}
            {...inputProps}
          />
          <Text fontSize="xs" color="var(--admin-text-soft)">{hint}</Text>
        </Stack>
      </HStack>
    </Box>
  );
}

function SaveBar({
  label,
  onSave,
  loading,
  saved,
  error,
}: {
  label: string;
  onSave: () => void;
  loading: boolean;
  saved: boolean;
  error: string | null;
}) {
  return (
    <Stack gap={3}>
      {error && (
        <Box bg="rgba(220,38,38,0.06)" border="1px solid rgba(220,38,38,0.25)" borderRadius="10px" px={3} py={2}>
          <Text color="red.700" fontSize="sm">{error}</Text>
        </Box>
      )}
      <HStack>
        <Button
          onClick={onSave}
          loading={loading}
          size="lg"
          bg="var(--admin-primary)"
          color="white"
          _hover={{ bg: "var(--admin-primary-dark)" }}
          borderRadius="10px"
        >
          <Save size={16} style={{ marginRight: 6 }} /> {label}
        </Button>
        {saved && (
          <HStack gap={1.5} color="#15803d" fontSize="sm" fontWeight="600">
            <Check size={16} /> Salvo
          </HStack>
        )}
      </HStack>
    </Stack>
  );
}

/** Cabeçalho da aba: o que ela edita + o botão de salvar DELA (topo, sempre à mão). */
function TabHeader({
  title,
  desc,
  saveLabel,
  onSave,
  loading,
  saved,
  error,
  dirty,
}: {
  title: string;
  desc: string;
  saveLabel: string;
  onSave: () => void;
  loading: boolean;
  saved: boolean;
  error: string | null;
  dirty: boolean;
}) {
  return (
    <Box className="admin-card" p={{ base: 4, md: 5 }}>
      <Flex gap={4} direction={{ base: "column", md: "row" }} align={{ base: "stretch", md: "center" }}>
        <Stack gap={1} flex="1" minW={0}>
          <Text fontSize="lg" fontWeight="800" color="var(--admin-primary)" className="admin-h">
            {title}
          </Text>
          <Text fontSize="sm" color="var(--admin-text-soft)">{desc}</Text>
        </Stack>
        <HStack gap={3} flexShrink={0} justify={{ base: "flex-start", md: "flex-end" }} flexWrap="wrap">
          {dirty ? <Tag tone="warn">alterações não salvas</Tag> : null}
          {saved ? (
            <HStack gap={1.5} color="#15803d" fontSize="sm" fontWeight="700">
              <Check size={16} /> Salvo
            </HStack>
          ) : null}
          <Button
            onClick={onSave}
            loading={loading}
            size="lg"
            bg="var(--admin-primary)"
            color="white"
            _hover={{ bg: "var(--admin-primary-dark)" }}
            borderRadius="10px"
          >
            <Save size={16} style={{ marginRight: 6 }} /> {saveLabel}
          </Button>
        </HStack>
      </Flex>
      {error ? (
        <Box mt={3} bg="rgba(220,38,38,0.06)" border="1px solid rgba(220,38,38,0.25)" borderRadius="10px" px={3} py={2}>
          <Text color="red.700" fontSize="sm">{error}</Text>
        </Box>
      ) : null}
    </Box>
  );
}

/**
 * Título de um grupo do acordeão: nome + linha de apoio (onde aparece no site).
 * Tudo em `span` porque isso é renderizado DENTRO do `<button>` do trigger.
 */
function groupTitle(title: string, hint: string) {
  return (
    <Box as="span" display="flex" flexDirection="column" gap={0.5}>
      <Text as="span" fontWeight="700" fontSize="sm" color="var(--admin-primary)">{title}</Text>
      <Text as="span" fontWeight="400" fontSize="xs" color="var(--admin-text-soft)">{hint}</Text>
    </Box>
  );
}

const TABS: TabDef[] = [
  { value: "marca", label: "Marca & imagens", icon: <Palette size={15} /> },
  { value: "home", label: "Home", icon: <Home size={15} /> },
  { value: "portfolio", label: "Portfólio", icon: <Briefcase size={15} /> },
  { value: "sobre", label: "Sobre & contato", icon: <Users size={15} /> },
  { value: "outras", label: "Outras páginas", icon: <Layers size={15} /> },
  { value: "seo", label: "SEO & rastreamento", icon: <BarChart3 size={15} /> },
  { value: "idiomas", label: "Idiomas", icon: <Languages size={15} /> },
];

export interface SiteIdentityCallbacks {
  /** Grava o conteúdo do site (banco do sistema, key 'main'). */
  onSaveContent: (content: SiteIdentityContent) => Promise<SiteSaveResult>;
  /** Grava a config de rastreamento (GA4/Pixel/CAPI). */
  onSaveMarketing: (marketing: SiteMarketing) => Promise<SiteSaveResult>;
  /**
   * Slot do botão de upload de imagem. O app injeta um botão que sobe o arquivo
   * pro Blob e chama `onUploaded(url)`. Sem ele, o botão de trocar foto não aparece.
   */
  renderImageUpload?: (slot: SiteImageUploadSlot) => React.ReactNode;
  /** Slot da aba "Idiomas" (TranslationsSection montada pelo app com as actions dele). */
  translations?: React.ReactNode;
}

export interface SiteIdentityEditorProps extends SiteIdentityCallbacks {
  initial: SiteIdentityContent;
  initialMarketing: SiteMarketing;
}

export function SiteIdentityEditor({
  initial,
  initialMarketing,
  onSaveContent,
  onSaveMarketing,
  renderImageUpload,
  translations,
}: SiteIdentityEditorProps) {
  const [tab, setTab] = useState("marca");

  const [c, setC] = useState<SiteIdentityContent>(initial);
  /** Última versão GRAVADA — é contra ela que "alterações não salvas" compara. */
  const [saved0, setSaved0] = useState<SiteIdentityContent>(initial);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSaved, setContentSaved] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const [m, setM] = useState<SiteMarketing>(initialMarketing);
  const [mkt0, setMkt0] = useState<SiteMarketing>(initialMarketing);
  const [mktLoading, setMktLoading] = useState(false);
  const [mktSaved, setMktSaved] = useState(false);
  const [mktError, setMktError] = useState<string | null>(null);

  const contentDirty = useMemo(() => JSON.stringify(c) !== JSON.stringify(saved0), [c, saved0]);
  const mktDirty = useMemo(() => JSON.stringify(m) !== JSON.stringify(mkt0), [m, mkt0]);

  // helpers de atualização imutável por seção
  const setBrand = (patch: Partial<SiteIdentityContent["brand"]>) =>
    setC((s) => ({ ...s, brand: { ...s.brand, ...patch } }));
  const setHero = (patch: Partial<SiteIdentityContent["hero"]>) =>
    setC((s) => ({ ...s, hero: { ...s.hero, ...patch } }));
  const setAbout = (patch: Partial<SiteIdentityContent["about"]>) =>
    setC((s) => ({ ...s, about: { ...s.about, ...patch } }));
  const setContact = (patch: Partial<SiteIdentityContent["contact"]>) =>
    setC((s) => ({ ...s, contact: { ...s.contact, ...patch } }));
  const setBenefits = (patch: Partial<SiteIdentityContent["benefits"]>) =>
    setC((s) => ({ ...s, benefits: { ...s.benefits, ...patch } }));
  const setHowItWorks = (patch: Partial<SiteIdentityContent["howItWorks"]>) =>
    setC((s) => ({ ...s, howItWorks: { ...s.howItWorks, ...patch } }));
  const setServices = (patch: Partial<SiteIdentityContent["services"]>) =>
    setC((s) => ({ ...s, services: { ...s.services, ...patch } }));
  const setProjects = (patch: Partial<SiteIdentityContent["projects"]>) =>
    setC((s) => ({ ...s, projects: { ...s.projects, ...patch } }));
  const setTrajectory = (patch: Partial<SiteIdentityContent["trajectory"]>) =>
    setC((s) => ({ ...s, trajectory: { ...s.trajectory, ...patch } }));
  const setTestimonials = (patch: Partial<SiteIdentityContent["testimonials"]>) =>
    setC((s) => ({ ...s, testimonials: { ...s.testimonials, ...patch } }));
  const setFinalCta = (patch: Partial<SiteIdentityContent["finalCta"]>) =>
    setC((s) => ({ ...s, finalCta: { ...s.finalCta, ...patch } }));
  const setSeo = (patch: Partial<SiteIdentityContent["seo"]>) =>
    setC((s) => ({ ...s, seo: { ...s.seo, ...patch } }));
  const setTheme = (patch: Partial<NonNullable<SiteIdentityContent["theme"]>>) =>
    setC((s) => ({ ...s, theme: { ...s.theme, ...patch } }));
  const setSocials = (socials: SiteIdentityContent["socials"]) =>
    setC((s) => ({ ...s, socials }));
  // blocos da home nova
  const setOperationHero = (patch: Partial<SiteIdentityContent["operationHero"]>) =>
    setC((s) => ({ ...s, operationHero: { ...s.operationHero, ...patch } }));
  const setContextDoors = (patch: Partial<SiteIdentityContent["contextDoors"]>) =>
    setC((s) => ({ ...s, contextDoors: { ...s.contextDoors, ...patch } }));
  const setPainToChange = (patch: Partial<SiteIdentityContent["painToChange"]>) =>
    setC((s) => ({ ...s, painToChange: { ...s.painToChange, ...patch } }));
  const setOperationShowcase = (patch: Partial<SiteIdentityContent["operationShowcase"]>) =>
    setC((s) => ({ ...s, operationShowcase: { ...s.operationShowcase, ...patch } }));
  const setImplantation = (patch: Partial<SiteIdentityContent["implantation"]>) =>
    setC((s) => ({ ...s, implantation: { ...s.implantation, ...patch } }));
  const setDiagnosticCta = (patch: Partial<SiteIdentityContent["diagnosticCta"]>) =>
    setC((s) => ({ ...s, diagnosticCta: { ...s.diagnosticCta, ...patch } }));
  const setRepresentanteCta = (patch: Partial<SiteIdentityContent["representanteCta"]>) =>
    setC((s) => ({ ...s, representanteCta: { ...s.representanteCta, ...patch } }));
  const setMkt = (patch: Partial<SiteMarketing>) => setM((s) => ({ ...s, ...patch }));

  const onSaveContentClick = async () => {
    setContentLoading(true);
    setContentError(null);
    setContentSaved(false);
    const snapshot = c;
    const res = await onSaveContent(snapshot);
    setContentLoading(false);
    if (!res.ok) {
      setContentError(res.error);
      return;
    }
    setSaved0(snapshot);
    setContentSaved(true);
    setTimeout(() => setContentSaved(false), 2500);
  };

  const onSaveMarketingClick = async () => {
    setMktLoading(true);
    setMktError(null);
    setMktSaved(false);
    const snapshot = m;
    const res = await onSaveMarketing(snapshot);
    setMktLoading(false);
    if (!res.ok) {
      setMktError(res.error);
      return;
    }
    setMkt0(snapshot);
    setMktSaved(true);
    setTimeout(() => setMktSaved(false), 2500);
  };

  /** Cabeçalho + botão de salvar de uma aba de CONTEÚDO (todas gravam o mesmo doc). */
  const contentHeader = (title: string, desc: string, saveLabel: string) => (
    <TabHeader
      title={title}
      desc={desc}
      saveLabel={saveLabel}
      onSave={onSaveContentClick}
      loading={contentLoading}
      saved={contentSaved}
      error={contentError}
      dirty={contentDirty}
    />
  );

  /* ───────────────────────────── HOME (grupos fechados) ───────────────────────────── */
  const homeGroups: AccordionItemDef[] = [
    {
      value: "topo",
      title: groupTitle("Topo da home", "Primeira dobra: chamada, botão do diagnóstico e os números"),
      meta: <Tag>bloco 1</Tag>,
      content: (
        <Stack gap={5}>
          <TextField label="Eyebrow (linha de cima)" value={c.operationHero.eyebrow} onChange={(v) => setOperationHero({ eyebrow: v })} />
          <TextField label="Título (parte normal, parada)" value={c.operationHero.titleLead} onChange={(v) => setOperationHero({ titleLead: v })} />
          <StringList
            label="Título (parte em destaque) — frases que giram"
            hint="Só a parte colorida troca sozinha, uma a cada ~4s. Uma frase só = título fixo. A 1ª também é o texto de compatibilidade."
            items={c.operationHero.rotating.length ? c.operationHero.rotating : [c.operationHero.titleHighlight]}
            rows={1}
            max={6}
            placeholder="mais uma ferramenta solta."
            addLabel="Adicionar frase"
            onChange={(rotating) => setOperationHero({ rotating, titleHighlight: rotating[0] ?? "" })}
          />
          <TextField label="Subtítulo" value={c.operationHero.subtitle} onChange={(v) => setOperationHero({ subtitle: v })} textarea rows={3} />
          <TextField
            label="Botão (leva ao /diagnostico)"
            value={c.operationHero.ctaLabel}
            onChange={(v) => setOperationHero({ ctaLabel: v })}
            helper="O site inteiro usa o MESMO verbo nessa ação — mude aqui e no CTA final junto."
          />
          <Box>
            <Text fontWeight="600" fontSize="sm" color="var(--admin-primary)" mb={0.5}>Números do topo</Text>
            <Text fontSize="xs" color="var(--admin-text-soft)" mb={2}>Aparecem embaixo do botão (ex.: “+50 · Projetos entregues”).</Text>
            <Stack gap={2}>
              {c.hero.stats.map((s, i) => (
                <HStack key={i} gap={2}>
                  <Input
                    value={s.value}
                    placeholder="+50"
                    w="120px"
                    onChange={(e) => {
                      const stats = [...c.hero.stats];
                      stats[i] = { ...stats[i], value: e.target.value };
                      setHero({ stats });
                    }}
                    {...inputProps}
                  />
                  <Input
                    value={s.label}
                    placeholder="Projetos entregues"
                    flex="1"
                    onChange={(e) => {
                      const stats = [...c.hero.stats];
                      stats[i] = { ...stats[i], label: e.target.value };
                      setHero({ stats });
                    }}
                    {...inputProps}
                  />
                  <IconButton
                    aria-label="Remover"
                    size="sm"
                    variant="ghost"
                    color="red.500"
                    onClick={() => setHero({ stats: c.hero.stats.filter((_, j) => j !== i) })}
                  >
                    <Trash2 size={15} />
                  </IconButton>
                </HStack>
              ))}
              {c.hero.stats.length < 6 && (
                <Button
                  size="sm"
                  variant="outline"
                  alignSelf="flex-start"
                  borderColor="var(--admin-border)"
                  color="var(--admin-primary)"
                  borderRadius="10px"
                  onClick={() => setHero({ stats: [...c.hero.stats, { value: "", label: "" }] })}
                >
                  <Plus size={14} style={{ marginRight: 4 }} /> Adicionar número
                </Button>
              )}
            </Stack>
          </Box>
          <Text fontSize="xs" color="var(--admin-text-soft)">
            O celular animado ao lado não tem campo próprio: ele se monta com as{" "}
            <b>Portas de contexto</b>, a <b>Dor → o que muda</b>, a <b>Operação rodando</b> e os{" "}
            <b>Serviços</b>. Editou lá, mudou aqui.
          </Text>
        </Stack>
      ),
    },
    {
      value: "portas",
      title: groupTitle("Portas de contexto", "“Qual é o seu negócio?” — os cards que abrem cada solução"),
      meta: <Tag>{c.contextDoors.doors.length} portas</Tag>,
      content: (
        <Stack gap={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Eyebrow" value={c.contextDoors.eyebrow} onChange={(v) => setContextDoors({ eyebrow: v })} />
            <TextField label="Título" value={c.contextDoors.title} onChange={(v) => setContextDoors({ title: v })} />
          </SimpleGrid>
          <TextField label="Subtítulo" value={c.contextDoors.subtitle} onChange={(v) => setContextDoors({ subtitle: v })} textarea />
          <ListBlock
            label="Portas"
            hint="“Segmento” tem de ser o SLUG do registro de segmentos (ex.: clinica, personal-trainer, cartorio, outro) — é o que vai no diagnóstico e no funil. “Destino” é a página que abre."
            items={c.contextDoors.doors}
            onChange={(doors) => setContextDoors({ doors })}
            empty={{ vertical: "outro", label: "", desc: "", href: "/solucoes/sob-medida", icon: "sparkles" }}
            addLabel="Adicionar porta"
            max={8}
            renderRow={(d, i, update) => (
              <Stack gap={2}>
                <HStack gap={2} flexWrap="wrap">
                  <IconSelect value={d.icon ?? "sparkles"} onChange={(v) => update({ icon: v })} />
                  <Input value={d.label} placeholder="Tenho uma clínica" flex="1" minW="200px" onChange={(e) => update({ label: e.target.value })} {...inputProps} />
                </HStack>
                <Textarea value={d.desc} rows={2} placeholder="O que essa porta promete" onChange={(e) => update({ desc: e.target.value })} {...inputProps} />
                <HStack gap={2} flexWrap="wrap">
                  <Input value={d.vertical} placeholder="segmento (slug)" w="200px" onChange={(e) => update({ vertical: e.target.value })} {...inputProps} />
                  <Input value={d.href} placeholder="/solucoes/clinicas" flex="1" minW="220px" onChange={(e) => update({ href: e.target.value })} {...inputProps} />
                </HStack>
              </Stack>
            )}
          />
        </Stack>
      ),
    },
    {
      value: "prova",
      title: groupTitle("Prova (projetos)", "Os 3 primeiros projetos aparecem aqui, na home"),
      meta: <Tag tone="soft">na aba Portfólio</Tag>,
      content: (
        <Stack gap={4}>
          <Text fontSize="sm" color="var(--admin-text-soft)">
            Esse bloco da home mostra os <b>3 primeiros</b> projetos do portfólio (a página
            <b> /projetos</b> mostra todos). Os textos e a ordem estão na aba <b>Portfólio</b>.
          </Text>
          <Button
            size="sm"
            variant="outline"
            alignSelf="flex-start"
            borderColor="var(--admin-border)"
            color="var(--admin-primary)"
            borderRadius="10px"
            onClick={() => setTab("portfolio")}
          >
            Abrir a aba Portfólio
          </Button>
        </Stack>
      ),
    },
    {
      value: "dor",
      title: groupTitle("Dor → o que muda", "A perda de hoje e o depois, por tipo de negócio"),
      meta: <Tag>{c.painToChange.items.length} contextos</Tag>,
      content: (
        <Stack gap={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Eyebrow" value={c.painToChange.eyebrow} onChange={(v) => setPainToChange({ eyebrow: v })} />
            <TextField label="Título" value={c.painToChange.title} onChange={(v) => setPainToChange({ title: v })} />
          </SimpleGrid>
          <ListBlock
            label="Contextos"
            hint="Um par “dor de hoje → como fica depois” para cada tipo de negócio."
            items={c.painToChange.items}
            onChange={(items) => setPainToChange({ items })}
            empty={{ vertical: "outro", label: "", pain: "", after: "" }}
            addLabel="Adicionar contexto"
            max={8}
            renderRow={(p, i, update) => (
              <Stack gap={2}>
                <HStack gap={2} flexWrap="wrap">
                  <Input value={p.vertical} placeholder="segmento (slug)" w="200px" onChange={(e) => update({ vertical: e.target.value })} {...inputProps} />
                  <Input value={p.label} placeholder="Clínica" flex="1" minW="180px" onChange={(e) => update({ label: e.target.value })} {...inputProps} />
                </HStack>
                <Textarea value={p.pain} rows={2} placeholder="A dor de hoje" onChange={(e) => update({ pain: e.target.value })} {...inputProps} />
                <Textarea value={p.after} rows={2} placeholder="Como fica depois" onChange={(e) => update({ after: e.target.value })} {...inputProps} />
              </Stack>
            )}
          />
        </Stack>
      ),
    },
    {
      value: "operacao",
      title: groupTitle("Uma operação rodando", "Da mensagem ao portal do cliente — o fluxo em passos"),
      meta: <Tag>{c.operationShowcase.steps.length} passos</Tag>,
      content: (
        <Stack gap={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Eyebrow" value={c.operationShowcase.eyebrow} onChange={(v) => setOperationShowcase({ eyebrow: v })} />
            <TextField label="Título" value={c.operationShowcase.title} onChange={(v) => setOperationShowcase({ title: v })} />
          </SimpleGrid>
          <TextField label="Subtítulo" value={c.operationShowcase.subtitle} onChange={(v) => setOperationShowcase({ subtitle: v })} textarea />
          <ListBlock
            label="Passos do fluxo"
            items={c.operationShowcase.steps}
            onChange={(steps) => setOperationShowcase({ steps })}
            empty={{ icon: "sparkles", title: "", desc: "" }}
            addLabel="Adicionar passo"
            max={8}
            renderRow={(st, i, update) => (
              <Stack gap={2}>
                <HStack gap={2} flexWrap="wrap">
                  <IconSelect value={st.icon} onChange={(v) => update({ icon: v })} />
                  <Input value={st.title} placeholder="A mensagem chega" flex="1" minW="200px" onChange={(e) => update({ title: e.target.value })} {...inputProps} />
                </HStack>
                <Textarea value={st.desc} rows={2} placeholder="Descrição" onChange={(e) => update({ desc: e.target.value })} {...inputProps} />
              </Stack>
            )}
          />
        </Stack>
      ),
    },
    {
      value: "implantacao",
      title: groupTitle("Como a implantação acontece", "Etapas, o que você precisa entregar e o recado do prazo"),
      meta: <Tag>{c.implantation.steps.length} etapas</Tag>,
      content: (
        <Stack gap={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Eyebrow" value={c.implantation.eyebrow} onChange={(v) => setImplantation({ eyebrow: v })} />
            <TextField label="Título" value={c.implantation.title} onChange={(v) => setImplantation({ title: v })} />
          </SimpleGrid>
          <TextField label="Subtítulo" value={c.implantation.subtitle} onChange={(v) => setImplantation({ subtitle: v })} textarea />
          <ListBlock
            label="Etapas"
            items={c.implantation.steps}
            onChange={(steps) => setImplantation({ steps })}
            empty={{ number: "", title: "", desc: "" }}
            addLabel="Adicionar etapa"
            max={6}
            renderRow={(st, i, update) => (
              <Stack gap={2}>
                <HStack gap={2}>
                  <Input value={st.number} placeholder="1" w="70px" onChange={(e) => update({ number: e.target.value })} {...inputProps} />
                  <Input value={st.title} placeholder="Diagnóstico" flex="1" onChange={(e) => update({ title: e.target.value })} {...inputProps} />
                </HStack>
                <Textarea value={st.desc} rows={2} placeholder="Descrição" onChange={(e) => update({ desc: e.target.value })} {...inputProps} />
              </Stack>
            )}
          />
          <TextField label="Título do “o que eu preciso de você”" value={c.implantation.needsTitle} onChange={(v) => setImplantation({ needsTitle: v })} />
          <StringList
            label="O que eu preciso de você"
            items={c.implantation.needs}
            onChange={(needs) => setImplantation({ needs })}
            addLabel="Adicionar item"
            max={8}
            placeholder="Os acessos do que já existe — domínio, redes, planilhas…"
          />
          <TextField
            label="Recado do prazo"
            value={c.implantation.note}
            onChange={(v) => setImplantation({ note: v })}
            textarea
            rows={3}
            helper="Sem preço, nunca — o valor sai da proposta, não do site."
          />
        </Stack>
      ),
    },
    {
      value: "cta",
      title: groupTitle("Chamada final (diagnóstico)", "A mesma conversão do topo, repetida no fim da home"),
      meta: <Tag>bloco 7</Tag>,
      content: (
        <Stack gap={5}>
          <TextField label="Título" value={c.diagnosticCta.title} onChange={(v) => setDiagnosticCta({ title: v })} />
          <TextField label="Texto" value={c.diagnosticCta.text} onChange={(v) => setDiagnosticCta({ text: v })} textarea rows={3} />
          <TextField label="Botão" value={c.diagnosticCta.ctaLabel} onChange={(v) => setDiagnosticCta({ ctaLabel: v })} />
        </Stack>
      ),
    },
    {
      value: "representante",
      title: groupTitle("Seja meu representante", "Última faixa da home — o convite para quem quer VENDER comigo"),
      meta: <Tag tone={c.representanteCta.enabled ? "soft" : "off"}>{c.representanteCta.enabled ? "no ar" : "oculta"}</Tag>,
      content: (
        <Stack gap={5}>
          <ToggleField
            label="Mostrar a faixa na home"
            value={c.representanteCta.enabled}
            onChange={(v) => setRepresentanteCta({ enabled: v })}
          />
          <TextField label="Eyebrow (linha de cima)" value={c.representanteCta.eyebrow} onChange={(v) => setRepresentanteCta({ eyebrow: v })} />
          <TextField label="Título" value={c.representanteCta.title} onChange={(v) => setRepresentanteCta({ title: v })} />
          <TextField label="Texto" value={c.representanteCta.text} onChange={(v) => setRepresentanteCta({ text: v })} textarea rows={3} />
          <TextField
            label="Botão (leva ao /representante)"
            value={c.representanteCta.ctaLabel}
            onChange={(v) => setRepresentanteCta({ ctaLabel: v })}
            helper="Botão secundário de propósito: quem vem comprar não pode se perder aqui."
          />
        </Stack>
      ),
    },
    {
      value: "depoimentos",
      title: groupTitle("Depoimentos", "Fica no fim da home. Lista vazia = a seção some do site"),
      meta: <Tag tone={c.testimonials.items.length ? "soft" : "off"}>{c.testimonials.items.length ? `${c.testimonials.items.length} no ar` : "oculta"}</Tag>,
      content: (
        <Stack gap={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Eyebrow" value={c.testimonials.eyebrow} onChange={(v) => setTestimonials({ eyebrow: v })} />
            <TextField label="Título" value={c.testimonials.title} onChange={(v) => setTestimonials({ title: v })} />
          </SimpleGrid>
          <ListBlock
            label="Depoimentos"
            hint="Só coloque depoimentos reais."
            items={c.testimonials.items}
            onChange={(items) => setTestimonials({ items })}
            empty={{ name: "", role: "", quote: "" }}
            addLabel="Adicionar depoimento"
            max={12}
            renderRow={(t, i, update) => (
              <Stack gap={2}>
                <HStack gap={2}>
                  <Input value={t.name} placeholder="Nome" flex="1" onChange={(e) => update({ name: e.target.value })} {...inputProps} />
                  <Input value={t.role} placeholder="Cargo / empresa" flex="1" onChange={(e) => update({ role: e.target.value })} {...inputProps} />
                </HStack>
                <Textarea value={t.quote} rows={2} placeholder="Depoimento" onChange={(e) => update({ quote: e.target.value })} {...inputProps} />
              </Stack>
            )}
          />
        </Stack>
      ),
    },
  ];

  /* ───────────────────────────── PORTFÓLIO (um grupo por projeto) ───────────────────────────── */
  const projectGroups: AccordionItemDef[] = c.projects.items.map((p, i) => {
    const update = (patch: Partial<typeof p>) => {
      const items = c.projects.items.slice();
      items[i] = { ...items[i], ...patch };
      setProjects({ items });
    };
    return {
      value: `projeto-${i}`,
      title: groupTitle(p.name || "(projeto sem nome)", p.tagline || "sem tagline"),
      meta: (
        <Box as="span" display="inline-flex" alignItems="center" gap={2}>
          <Box as="span" display="inline-block" w="14px" h="14px" borderRadius="4px" bg={p.color || "#8B5CF6"} border="1px solid var(--admin-border)" />
          <Tag tone={p.status === "live" ? "soft" : "off"}>{p.status}</Tag>
        </Box>
      ),
      content: (
        <Stack gap={4}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Nome" value={p.name} onChange={(v) => update({ name: v })} />
            <TextField label="Slug (URL)" value={p.slug} onChange={(v) => update({ slug: v })} helper="Sem espaço nem acento — ex.: frota360." />
          </SimpleGrid>
          <TextField label="Tagline (uma linha)" value={p.tagline} onChange={(v) => update({ tagline: v })} />
          <TextField label="Descrição" value={p.description} onChange={(v) => update({ description: v })} textarea rows={3} />
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <TextField label="Categoria" value={p.category} onChange={(v) => update({ category: v })} placeholder="saas, portal, site…" />
            <Field.Root>
              <Field.Label fontWeight="600" fontSize="sm" color="var(--admin-primary)">Situação</Field.Label>
              <NativeSelect.Root size="lg">
                <NativeSelect.Field
                  value={p.status}
                  onChange={(e) => update({ status: e.target.value as "live" | "beta" | "wip" })}
                  bg="white"
                  borderColor="var(--admin-border)"
                  borderRadius="10px"
                >
                  <option value="live">No ar (live)</option>
                  <option value="beta">Beta</option>
                  <option value="wip">Em construção (wip)</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <ColorField label="Cor do card" value={p.color} onChange={(v) => update({ color: v })} />
          </SimpleGrid>
          <TextField
            label="Tecnologias"
            value={p.stack.join(", ")}
            onChange={(v) => update({ stack: v.split(",").map((x) => x.trim()).filter(Boolean) })}
            placeholder="Next.js, TypeScript, PostgreSQL"
            helper="Separe por vírgula."
          />
          <TextField label="Site do projeto (opcional)" value={p.website ?? ""} onChange={(v) => update({ website: v })} placeholder="https://…" />
          <Button
            size="sm"
            variant="ghost"
            color="red.500"
            alignSelf="flex-start"
            borderRadius="10px"
            onClick={() => setProjects({ items: c.projects.items.filter((_, j) => j !== i) })}
          >
            <Trash2 size={14} style={{ marginRight: 6 }} /> Remover este projeto
          </Button>
        </Stack>
      ),
    };
  });

  /* ───────────────────────────── SOBRE (grupos fechados) ───────────────────────────── */
  const aboutGroups: AccordionItemDef[] = [
    {
      value: "textos",
      title: groupTitle("Textos do Sobre", "Eyebrow, título, parágrafos e as legendas da foto"),
      content: (
        <Stack gap={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Eyebrow" value={c.about.eyebrow} onChange={(v) => setAbout({ eyebrow: v })} />
            <TextField label="Título" value={c.about.title} onChange={(v) => setAbout({ title: v })} />
          </SimpleGrid>
          <StringList
            label="Parágrafos"
            items={c.about.paragraphs}
            onChange={(paragraphs) => setAbout({ paragraphs })}
            addLabel="Adicionar parágrafo"
            max={6}
            rows={3}
          />
          <TextField label="Texto do card de stack" value={c.about.roleCardText} onChange={(v) => setAbout({ roleCardText: v })} textarea />
          <TextField label="Bio curta (abaixo da foto)" value={c.about.bio} onChange={(v) => setAbout({ bio: v })} textarea />
          <Text fontSize="xs" color="var(--admin-text-soft)">
            A foto de perfil desta seção fica na aba <b>Marca &amp; imagens</b>.
          </Text>
        </Stack>
      ),
    },
    {
      value: "destaques",
      title: groupTitle("Destaques", "Idade, nacionalidade, idiomas — os selinhos ao lado da foto"),
      meta: <Tag>{c.about.highlights.length}</Tag>,
      content: (
        <ListBlock
          label="Destaques"
          items={c.about.highlights}
          onChange={(highlights) => setAbout({ highlights })}
          empty={{ icon: "sparkles", title: "", subtitle: "" }}
          addLabel="Adicionar destaque"
          max={6}
          renderRow={(h, i, update) => (
            <Stack gap={2}>
              <HStack gap={2} flexWrap="wrap">
                <IconSelect value={h.icon} onChange={(v) => update({ icon: v })} />
                <Input value={h.title} placeholder="34" w="120px" onChange={(e) => update({ title: e.target.value })} {...inputProps} />
                <Input value={h.unit ?? ""} placeholder="anos (opcional)" w="150px" onChange={(e) => update({ unit: e.target.value })} {...inputProps} />
              </HStack>
              <Input value={h.subtitle} placeholder="Idade" onChange={(e) => update({ subtitle: e.target.value })} {...inputProps} />
            </Stack>
          )}
        />
      ),
    },
    {
      value: "infos",
      title: groupTitle("Informações de contato", "A coluna da direita do Sobre (endereço, telefone, e-mail…)"),
      meta: <Tag>{c.about.contactInfo.length}</Tag>,
      content: (
        <ListBlock
          label="Informações"
          items={c.about.contactInfo}
          onChange={(contactInfo) => setAbout({ contactInfo })}
          empty={{ icon: "map-pin", label: "", value: "" }}
          addLabel="Adicionar informação"
          max={8}
          renderRow={(info, i, update) => (
            <HStack gap={2} flexWrap="wrap">
              <IconSelect value={info.icon} onChange={(v) => update({ icon: v })} />
              <Input value={info.label} placeholder="Endereço" w="150px" onChange={(e) => update({ label: e.target.value })} {...inputProps} />
              <Input value={info.value} placeholder="São Caetano do Sul/SP" flex="1" minW="180px" onChange={(e) => update({ value: e.target.value })} {...inputProps} />
            </HStack>
          )}
        />
      ),
    },
    {
      value: "skills",
      title: groupTitle("Habilidades técnicas", "As barrinhas de nível (nome, 0–100 e cor)"),
      meta: <Tag>{c.about.skills.length}</Tag>,
      content: (
        <ListBlock
          label="Habilidades"
          items={c.about.skills}
          onChange={(skills) => setAbout({ skills })}
          empty={{ name: "", level: 80, color: "#8B5CF6" }}
          addLabel="Adicionar habilidade"
          max={16}
          renderRow={(sk, i, update) => (
            <HStack gap={2}>
              <Input value={sk.name} placeholder="Next.js" flex="1" onChange={(e) => update({ name: e.target.value })} {...inputProps} />
              <Input type="number" value={String(sk.level)} placeholder="90" w="90px" onChange={(e) => update({ level: Number(e.target.value) || 0 })} {...inputProps} />
              <Input type="color" value={sk.color} w="56px" px={1} onChange={(e) => update({ color: e.target.value })} {...inputProps} />
            </HStack>
          )}
        />
      ),
    },
  ];

  /* ───────────────────────────── OUTRAS PÁGINAS (fechados) ───────────────────────────── */
  const otherGroups: AccordionItemDef[] = [
    {
      value: "hero-assistente",
      title: groupTitle("Hero do assistente", "Topo da landing de anúncio /ia-para-negocios"),
      meta: <Tag>no ar</Tag>,
      content: (
        <Stack gap={5}>
          <Text fontSize="sm" color="var(--admin-text-soft)">
            Este é o hero ANTIGO do site. Ele saiu da home (a home usa o “Topo da home”, na aba
            Home), mas continua no ar na landing de anúncio <b>/ia-para-negocios</b> — cada
            campanha ainda pode sobrescrever o texto por cima dele.
          </Text>
          <TextField label="Eyebrow" value={c.hero.eyebrow} onChange={(v) => setHero({ eyebrow: v })} />
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Título (parte normal)" value={c.hero.titleLead} onChange={(v) => setHero({ titleLead: v })} />
            <TextField label="Título (destaque)" value={c.hero.titleHighlight} onChange={(v) => setHero({ titleHighlight: v })} />
          </SimpleGrid>
          <TextField label="Subtítulo" value={c.hero.subtitle} onChange={(v) => setHero({ subtitle: v })} textarea rows={3} />
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Botão primário" value={c.hero.primaryCtaLabel} onChange={(v) => setHero({ primaryCtaLabel: v })} />
            <TextField label="Botão secundário" value={c.hero.secondaryCtaLabel} onChange={(v) => setHero({ secondaryCtaLabel: v })} />
          </SimpleGrid>
        </Stack>
      ),
    },
    {
      value: "beneficios",
      title: groupTitle("Benefícios (Por que comigo)", "Guardado — hoje nenhuma página mostra esta seção"),
      meta: <Tag tone="off">fora do ar</Tag>,
      content: (
        <Stack gap={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Eyebrow" value={c.benefits.eyebrow} onChange={(v) => setBenefits({ eyebrow: v })} />
            <TextField label="Título" value={c.benefits.title} onChange={(v) => setBenefits({ title: v })} />
          </SimpleGrid>
          <ListBlock
            label="Cards de benefício"
            items={c.benefits.items}
            onChange={(items) => setBenefits({ items })}
            empty={{ icon: "sparkles", title: "", desc: "" }}
            addLabel="Adicionar benefício"
            max={8}
            renderRow={(b, i, update) => (
              <Stack gap={2}>
                <HStack gap={2}>
                  <IconSelect value={b.icon} onChange={(v) => update({ icon: v })} />
                  <Input value={b.title} placeholder="Título" flex="1" onChange={(e) => update({ title: e.target.value })} {...inputProps} />
                </HStack>
                <Textarea value={b.desc} rows={2} placeholder="Descrição" onChange={(e) => update({ desc: e.target.value })} {...inputProps} />
              </Stack>
            )}
          />
        </Stack>
      ),
    },
    {
      value: "como-funciona",
      title: groupTitle("Como funciona (3 passos)", "Guardado — hoje nenhuma página mostra esta seção"),
      meta: <Tag tone="off">fora do ar</Tag>,
      content: (
        <Stack gap={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Eyebrow" value={c.howItWorks.eyebrow} onChange={(v) => setHowItWorks({ eyebrow: v })} />
            <TextField label="Título" value={c.howItWorks.title} onChange={(v) => setHowItWorks({ title: v })} />
          </SimpleGrid>
          <ListBlock
            label="Passos"
            items={c.howItWorks.steps}
            onChange={(steps) => setHowItWorks({ steps })}
            empty={{ number: "", title: "", desc: "" }}
            addLabel="Adicionar passo"
            max={6}
            renderRow={(st, i, update) => (
              <Stack gap={2}>
                <HStack gap={2}>
                  <Input value={st.number} placeholder="1" w="70px" onChange={(e) => update({ number: e.target.value })} {...inputProps} />
                  <Input value={st.title} placeholder="Título" flex="1" onChange={(e) => update({ title: e.target.value })} {...inputProps} />
                </HStack>
                <Textarea value={st.desc} rows={2} placeholder="Descrição" onChange={(e) => update({ desc: e.target.value })} {...inputProps} />
              </Stack>
            )}
          />
        </Stack>
      ),
    },
    {
      value: "solucoes",
      title: groupTitle("Soluções (O que eu construo)", "Guardado — hoje nenhuma página mostra esta seção"),
      meta: <Tag tone="off">fora do ar</Tag>,
      content: (
        <Stack gap={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Eyebrow" value={c.services.eyebrow} onChange={(v) => setServices({ eyebrow: v })} />
            <TextField label="Título" value={c.services.title} onChange={(v) => setServices({ title: v })} />
          </SimpleGrid>
          <ListBlock
            label="Cards de solução"
            items={c.services.items}
            onChange={(items) => setServices({ items })}
            empty={{ icon: "sparkles", title: "", desc: "" }}
            addLabel="Adicionar solução"
            max={12}
            renderRow={(sv, i, update) => (
              <Stack gap={2}>
                <HStack gap={2}>
                  <IconSelect value={sv.icon} onChange={(v) => update({ icon: v })} />
                  <Input value={sv.title} placeholder="Título" flex="1" onChange={(e) => update({ title: e.target.value })} {...inputProps} />
                </HStack>
                <Textarea value={sv.desc} rows={2} placeholder="Descrição" onChange={(e) => update({ desc: e.target.value })} {...inputProps} />
              </Stack>
            )}
          />
        </Stack>
      ),
    },
    {
      value: "trajetoria",
      title: groupTitle("Trajetória (linha do tempo)", "Guardado — hoje nenhuma página mostra esta seção"),
      meta: <Tag tone="off">fora do ar</Tag>,
      content: (
        <Stack gap={5}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Eyebrow" value={c.trajectory.eyebrow} onChange={(v) => setTrajectory({ eyebrow: v })} />
            <TextField label="Título" value={c.trajectory.title} onChange={(v) => setTrajectory({ title: v })} />
          </SimpleGrid>
          <ListBlock
            label="Marcos"
            items={c.trajectory.items}
            onChange={(items) => setTrajectory({ items })}
            empty={{ year: "", title: "", desc: "" }}
            addLabel="Adicionar marco"
            max={12}
            renderRow={(it, i, update) => (
              <Stack gap={2}>
                <HStack gap={2}>
                  <Input value={it.year} placeholder="2024" w="110px" onChange={(e) => update({ year: e.target.value })} {...inputProps} />
                  <Input value={it.title} placeholder="Título" flex="1" onChange={(e) => update({ title: e.target.value })} {...inputProps} />
                </HStack>
                <Textarea value={it.desc} rows={2} placeholder="Descrição" onChange={(e) => update({ desc: e.target.value })} {...inputProps} />
              </Stack>
            )}
          />
        </Stack>
      ),
    },
    {
      value: "cta-antigo",
      title: groupTitle("CTA final antigo (WhatsApp)", "Guardado — a home usa a chamada do diagnóstico"),
      meta: <Tag tone="off">fora do ar</Tag>,
      content: (
        <Stack gap={5}>
          <TextField label="Título" value={c.finalCta.title} onChange={(v) => setFinalCta({ title: v })} />
          <TextField label="Texto" value={c.finalCta.text} onChange={(v) => setFinalCta({ text: v })} textarea rows={3} />
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Botão WhatsApp" value={c.finalCta.whatsappLabel} onChange={(v) => setFinalCta({ whatsappLabel: v })} />
            <TextField label="Botão projetos" value={c.finalCta.projectsLabel} onChange={(v) => setFinalCta({ projectsLabel: v })} />
          </SimpleGrid>
        </Stack>
      ),
    },
  ];

  return (
    <Stack gap={5} maxW="1180px" pb={24}>
      <Tabs value={tab} onChange={setTab} items={TABS} sidebarLabel="Meu site" />

      {/* ───────────── Marca & imagens ───────────── */}
      {tab === "marca" && (
        <Stack gap={5}>
          {contentHeader(
            "Marca & imagens",
            "Nome, WhatsApp, a sua foto, cores/fontes e os links das redes.",
            "Salvar marca",
          )}

          <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5} alignItems="stretch">
            <Card title="Marca">
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <TextField label="Nome" value={c.brand.name} onChange={(v) => setBrand({ name: v })} />
                <TextField label="Wordmark" value={c.brand.wordmark} onChange={(v) => setBrand({ wordmark: v })} />
                <TextField label="Cargo / título" value={c.brand.role} onChange={(v) => setBrand({ role: v })} />
                <TextField
                  label="WhatsApp (só dígitos)"
                  value={c.brand.whatsapp}
                  onChange={(v) => setBrand({ whatsapp: v })}
                  helper="Fonte única de TODO link de WhatsApp do site."
                />
              </SimpleGrid>
            </Card>

            <Card
              title="Imagens do site"
              hint="Só uma: a sua foto. O topo da home é o celular animado — não tem mais imagem de fundo."
            >
              <ImageField
                label="Foto de perfil (seção Sobre)"
                hint="A foto redonda do “Sobre” — o único lugar do site onde você aparece. Vazio = /assets/perfil.png. PNG/JPG/WebP até 8MB."
                value={c.hero.photo ?? ""}
                fallback="/assets/perfil.png"
                folder="landing/perfil"
                onChange={(url) => setHero({ photo: url })}
                renderImageUpload={renderImageUpload}
              />
            </Card>
          </SimpleGrid>

          <Card
            title="Cores e fontes do site"
            icon={<Palette size={18} color="var(--admin-primary)" />}
            hint="A cor do seu site é a MESMA do painel do sistema. Vazio = marca padrão (lilás do José); a “Aparência do painel” (/aparencia) ainda sobrescreve, se quiser separar."
          >
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <ColorField
                label="Primária"
                value={c.theme?.primaryColor ?? ""}
                onChange={(v) => setTheme({ primaryColor: v })}
                helper="Botões, links e navegação ativa."
              />
              <ColorField
                label="Destaque (accent)"
                value={c.theme?.accentColor ?? ""}
                onChange={(v) => setTheme({ accentColor: v })}
                helper="Realces e detalhes."
              />
              <ColorField
                label="Escura"
                value={c.theme?.darkColor ?? ""}
                onChange={(v) => setTheme({ darkColor: v })}
                helper="Opcional — derivada da primária se vazia."
              />
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <TextField
                label="Fonte dos títulos"
                value={c.theme?.fontHeading ?? ""}
                onChange={(v) => setTheme({ fontHeading: v })}
                placeholder="ex.: Oswald"
                helper="Nome da família (Google Fonts). Vazio = padrão."
              />
              <TextField
                label="Fonte do corpo"
                value={c.theme?.fontBody ?? ""}
                onChange={(v) => setTheme({ fontBody: v })}
                placeholder="ex.: Lato"
                helper="Nome da família (Google Fonts). Vazio = padrão."
              />
            </SimpleGrid>
          </Card>

          <Card
            title="Redes e canais"
            hint="Aparecem no rodapé e na seção de contato. O WhatsApp usa sempre o número da Marca."
          >
            <Stack gap={3}>
              {c.socials.map((soc, i) => (
                <HStack key={i} gap={2} p={3} borderRadius="12px" border="1px solid var(--admin-border)" bg="rgba(0,0,0,0.015)" flexWrap="wrap">
                  <Text w="90px" fontSize="sm" fontWeight="700" textTransform="capitalize" color="var(--admin-primary)">{soc.kind}</Text>
                  <Input
                    value={soc.label}
                    placeholder="Rótulo"
                    w="150px"
                    onChange={(e) => {
                      const next = [...c.socials];
                      next[i] = { ...next[i], label: e.target.value };
                      setSocials(next);
                    }}
                    {...inputProps}
                  />
                  {soc.kind === "whatsapp" ? (
                    <Input value={`Usa o WhatsApp da Marca (${c.brand.whatsapp})`} disabled flex="1" minW="200px" {...inputProps} />
                  ) : (
                    <Input
                      value={soc.href}
                      placeholder="https://…"
                      flex="1"
                      minW="200px"
                      onChange={(e) => {
                        const next = [...c.socials];
                        next[i] = { ...next[i], href: e.target.value };
                        setSocials(next);
                      }}
                      {...inputProps}
                    />
                  )}
                </HStack>
              ))}
            </Stack>
          </Card>

          <SaveBar label="Salvar marca" onSave={onSaveContentClick} loading={contentLoading} saved={contentSaved} error={contentError} />
        </Stack>
      )}

      {/* ───────────── Home ───────────── */}
      {tab === "home" && (
        <Stack gap={5}>
          {contentHeader(
            "Home (josejunior.dev)",
            "Os blocos da página inicial, na ordem em que aparecem. Clique num grupo para abrir e editar.",
            "Salvar home",
          )}
          <Box className="admin-card" p={{ base: 3, md: 4 }}>
            <Accordion items={homeGroups} multiple collapsible />
          </Box>
          <SaveBar label="Salvar home" onSave={onSaveContentClick} loading={contentLoading} saved={contentSaved} error={contentError} />
        </Stack>
      )}

      {/* ───────────── Portfólio ───────────── */}
      {tab === "portfolio" && (
        <Stack gap={5}>
          {contentHeader(
            "Portfólio",
            "Os projetos que aparecem na home (os 3 primeiros) e na página /projetos (todos).",
            "Salvar portfólio",
          )}

          <Card title="Cabeçalho da seção">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <TextField label="Eyebrow" value={c.projects.eyebrow} onChange={(v) => setProjects({ eyebrow: v })} />
              <TextField label="Título" value={c.projects.title} onChange={(v) => setProjects({ title: v })} />
            </SimpleGrid>
            <TextField label="Subtítulo" value={c.projects.subtitle} onChange={(v) => setProjects({ subtitle: v })} textarea />
          </Card>

          <Box className="admin-card" p={{ base: 3, md: 4 }}>
            <HStack justify="space-between" mb={3} px={1} flexWrap="wrap" gap={2}>
              <Text fontSize="sm" fontWeight="700" color="var(--admin-primary)">
                Projetos ({c.projects.items.length})
              </Text>
              <Text fontSize="xs" color="var(--admin-text-soft)">
                A ordem daqui é a ordem do site — os 3 primeiros vão pra home.
              </Text>
            </HStack>
            {projectGroups.length ? (
              <Accordion items={projectGroups} multiple collapsible />
            ) : (
              <Text fontSize="sm" color="var(--admin-text-soft)" px={1} py={4}>
                Nenhum projeto cadastrado.
              </Text>
            )}
            {c.projects.items.length < 24 && (
              <Button
                size="sm"
                variant="outline"
                mt={3}
                borderColor="var(--admin-border)"
                color="var(--admin-primary)"
                borderRadius="10px"
                onClick={() =>
                  setProjects({
                    items: [
                      ...c.projects.items,
                      { slug: "", name: "Novo projeto", tagline: "", description: "", category: "site", status: "live" as const, stack: [], color: "#8B5CF6" },
                    ],
                  })
                }
              >
                <Plus size={14} style={{ marginRight: 4 }} /> Adicionar projeto
              </Button>
            )}
          </Box>

          <SaveBar label="Salvar portfólio" onSave={onSaveContentClick} loading={contentLoading} saved={contentSaved} error={contentError} />
        </Stack>
      )}

      {/* ───────────── Sobre & contato ───────────── */}
      {tab === "sobre" && (
        <Stack gap={5}>
          {contentHeader(
            "Sobre & contato",
            "As duas últimas seções da home: quem é você e como falam com você.",
            "Salvar sobre & contato",
          )}

          <Box className="admin-card" p={{ base: 3, md: 4 }}>
            <Accordion items={aboutGroups} multiple collapsible />
          </Box>

          <Card title="Seção de contato" hint="Fica no fim da home, antes do rodapé.">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <TextField label="Eyebrow" value={c.contact.eyebrow} onChange={(v) => setContact({ eyebrow: v })} />
              <TextField label="Título" value={c.contact.title} onChange={(v) => setContact({ title: v })} />
            </SimpleGrid>
            <TextField label="Subtítulo" value={c.contact.subtitle} onChange={(v) => setContact({ subtitle: v })} textarea />
            <TextField label="E-mail" value={c.contact.email} onChange={(v) => setContact({ email: v })} />
          </Card>

          <SaveBar label="Salvar sobre & contato" onSave={onSaveContentClick} loading={contentLoading} saved={contentSaved} error={contentError} />
        </Stack>
      )}

      {/* ───────────── Outras páginas ───────────── */}
      {tab === "outras" && (
        <Stack gap={5}>
          {contentHeader(
            "Outras páginas",
            "O hero da landing de anúncio e as seções antigas — guardadas, mas hoje fora do ar na home.",
            "Salvar outras páginas",
          )}
          <Box className="admin-card" p={{ base: 3, md: 4 }}>
            <Accordion items={otherGroups} multiple collapsible />
          </Box>
          <SaveBar label="Salvar outras páginas" onSave={onSaveContentClick} loading={contentLoading} saved={contentSaved} error={contentError} />
        </Stack>
      )}

      {/* ───────────── SEO & rastreamento ───────────── */}
      {tab === "seo" && (
        <Stack gap={5}>
          {contentHeader(
            "SEO & rastreamento",
            "O que o Google mostra e como os cliques são medidos. São duas gravações separadas: conteúdo e rastreamento.",
            "Salvar SEO",
          )}

          <Card title="SEO (título e descrição da página)">
            <TextField label="Título (aba do navegador / Google)" value={c.seo.title} onChange={(v) => setSeo({ title: v })} />
            <TextField
              label="Meta description"
              value={c.seo.description}
              onChange={(v) => setSeo({ description: v })}
              textarea
              rows={3}
              helper="Resumo que aparece nos resultados de busca e ao compartilhar o link."
            />
          </Card>

          <Box h="1px" bg="var(--admin-divider)" my={2} />

          <Stack gap={1}>
            <HStack gap={2}>
              <BarChart3 size={20} style={{ color: "var(--admin-primary)" }} />
              <Text fontSize="xl" fontWeight="800" color="var(--admin-primary)" className="admin-h">
                Marketing &amp; Rastreamento
              </Text>
              {mktDirty ? <Tag tone="warn">alterações não salvas</Tag> : null}
            </HStack>
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Mede quem vê o site, quem usa o gerador e quem fala no WhatsApp. Os eventos vão pro GA4 e
              pro Facebook (Pixel no navegador + Conversions API no servidor, deduplicados). Este bloco
              tem o <b>seu próprio botão de salvar</b> — não é o conteúdo do site.
            </Text>
          </Stack>

          <SimpleGrid columns={{ base: 1, xl: 2 }} gap={5} alignItems="stretch">
            <Card title="Google Analytics 4" icon={<BarChart3 size={18} style={{ color: "var(--admin-primary)" }} />}>
              <TextField
                label="ID de medição"
                placeholder="G-XXXXXXXXXX"
                value={m.ga4MeasurementId}
                onChange={(v) => setMkt({ ga4MeasurementId: v })}
                helper="Encontre em Admin → Fluxos de dados, no painel do GA4."
              />
              <ToggleField label="Ativar GA4" value={m.ga4Enabled} onChange={(v) => setMkt({ ga4Enabled: v })} />
            </Card>

            <Card title="Meta Pixel & Conversions API">
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <TextField
                  label="Pixel ID"
                  placeholder="123456789012345"
                  value={m.facebookPixelId}
                  onChange={(v) => setMkt({ facebookPixelId: v })}
                />
                <TextField
                  label="Access Token"
                  type="password"
                  placeholder="EAAB..."
                  value={m.facebookAccessToken}
                  onChange={(v) => setMkt({ facebookAccessToken: v })}
                  helper="Token da Conversions API (Events Manager → Configurações)."
                />
                <ToggleField label="Ativar Meta Pixel" value={m.facebookPixelEnabled} onChange={(v) => setMkt({ facebookPixelEnabled: v })} />
                <ToggleField
                  label="Ativar Conversions API"
                  value={m.facebookConversionsApiEnabled}
                  onChange={(v) => setMkt({ facebookConversionsApiEnabled: v })}
                />
              </SimpleGrid>
              <TextField
                label="Test Event Code (opcional)"
                placeholder="TEST12345"
                value={m.facebookTestEventCode}
                onChange={(v) => setMkt({ facebookTestEventCode: v })}
                helper="Use para validar eventos no Events Manager sem poluir a produção."
              />
            </Card>
          </SimpleGrid>

          <SaveBar label="Salvar rastreamento" onSave={onSaveMarketingClick} loading={mktLoading} saved={mktSaved} error={mktError} />

          <MetaCampaignCard />
        </Stack>
      )}

      {/* ───────────── Idiomas ───────────── */}
      {tab === "idiomas" && (
        <Stack gap={5}>
          <Box className="admin-card" p={{ base: 4, md: 5 }}>
            <Stack gap={1}>
              <Text fontSize="lg" fontWeight="800" color="var(--admin-primary)" className="admin-h">
                Idiomas
              </Text>
              <Text fontSize="sm" color="var(--admin-text-soft)">
                O português é a FONTE: o que você escreve nas outras abas é o original. Aqui ficam as
                traduções (EN/ES) — com botão de gravar próprio, dentro da própria seção.
              </Text>
            </Stack>
          </Box>
          {translations}
        </Stack>
      )}
    </Stack>
  );
}

/** Caixa de texto monoespaçada com botão de copiar. */
function CopyBox({ label, value, help }: { label: string; value: string; help?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponível */
    }
  };
  return (
    <Box>
      <Text fontWeight="600" fontSize="sm" color="var(--admin-primary)" mb={1}>{label}</Text>
      <HStack gap={2} align="stretch">
        <Box flex="1" px={3} py={2} borderRadius="10px" border="1px solid var(--admin-border)" bg="white" fontFamily="mono" fontSize="xs" color="var(--admin-text)" overflowX="auto" whiteSpace="nowrap">
          {value}
        </Box>
        <Button size="sm" variant="outline" borderColor="var(--admin-border)" color="var(--admin-primary)" borderRadius="10px" onClick={copy} flexShrink={0}>
          {copied ? <><Check size={14} style={{ marginRight: 4 }} /> Copiado</> : <><Copy size={14} style={{ marginRight: 4 }} /> Copiar</>}
        </Button>
      </HStack>
      {help ? <Text fontSize="xs" color="var(--admin-text-soft)" mt={1}>{help}</Text> : null}
    </Box>
  );
}

/** Gera os links de campanha (Meta/Facebook Ads) prontos pra copiar e colar. */
function MetaCampaignCard() {
  const [dest, setDest] = useState("https://josejunior.dev/ia-para-negocios");
  const [camp, setCamp] = useState("meta-lancamento");
  const slug = camp.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "meta";
  const base = dest.trim().replace(/[?#].*$/, "").replace(/\/+$/, "") || "https://josejunior.dev";
  const fullLink = `${base}?utm_source=facebook&utm_medium=paid&utm_campaign=${slug}`;
  const metaParams = "utm_source=facebook&utm_medium=paidsocial&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&utm_placement={{placement}}";
  return (
    <Card title="Link para campanha (Meta / Facebook Ads)" icon={<Link2 size={18} style={{ color: "var(--admin-primary)" }} />}>
      <Text fontSize="sm" color="var(--admin-text-soft)">
        Cole no seu anúncio para medir de onde vem cada clique (GA4 + UTM). O Pixel/Conversions API acima cuida da conversão; estes parâmetros dizem a ORIGEM.
      </Text>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
        <Box>
          <Text fontWeight="600" fontSize="sm" color="var(--admin-primary)" mb={1}>Página de destino</Text>
          <Input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="https://josejunior.dev/ia-para-negocios" {...inputProps} />
        </Box>
        <Box>
          <Text fontWeight="600" fontSize="sm" color="var(--admin-primary)" mb={1}>Nome da campanha</Text>
          <Input value={camp} onChange={(e) => setCamp(e.target.value)} placeholder="meta-lancamento" {...inputProps} />
        </Box>
      </SimpleGrid>
      <CopyBox
        label="1) Link de destino do anúncio"
        value={fullLink}
        help="Cole no campo do site/URL do anúncio (Ads Manager → Destino → Site)."
      />
      <CopyBox
        label="2) Parâmetros de URL (dinâmicos do Meta)"
        value={metaParams}
        help="Cole no campo “Parâmetros de URL” do anúncio. O Meta preenche {{campaign.name}}, {{ad.name}}, {{adset.name}} e {{placement}} automaticamente em cada clique."
      />
    </Card>
  );
}
