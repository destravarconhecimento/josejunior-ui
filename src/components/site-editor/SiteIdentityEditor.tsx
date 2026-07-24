"use client";

import { useState } from "react";
import {
  Box,
  Field,
  HStack,
  IconButton,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Plus, Trash2, Save, Check, BarChart3, Link2, Copy, Palette } from "lucide-react";
import { Button } from "../Button";
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
 * apps/web). Todas as seções ("sections") e o módulo de rastreamento vivem aqui.
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
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box className="admin-card" p={{ base: 5, md: 7 }} h="100%">
      <HStack gap={2} mb={5}>
        {icon}
        <Text fontSize="lg" fontWeight="700" color="var(--admin-primary)" className="admin-h">
          {title}
        </Text>
      </HStack>
      <Stack gap={5}>{children}</Stack>
    </Box>
  );
}

function TextField({
  label,
  value,
  onChange,
  textarea,
  type,
  placeholder,
  helper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  type?: string;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <Field.Root>
      <Field.Label fontWeight="600" fontSize="sm" color="var(--admin-primary)">{label}</Field.Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} placeholder={placeholder} {...inputProps} />
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

/** Seletor de ícone (nomes espelhados do web em icon-options.ts). */
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
 * item corrente. Reaproveitado por todas as seções em lista (benefícios,
 * serviços, projetos, trajetória, depoimentos, destaques, contatos, skills…).
 */
function ListBlock<T extends object>({
  label,
  items,
  onChange,
  empty,
  addLabel,
  max,
  renderRow,
}: {
  label: string;
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
      <Text fontWeight="600" fontSize="sm" color="var(--admin-primary)" mb={2}>{label}</Text>
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
}: SiteIdentityEditorProps) {
  const [c, setC] = useState<SiteIdentityContent>(initial);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSaved, setContentSaved] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const [m, setM] = useState<SiteMarketing>(initialMarketing);
  const [mktLoading, setMktLoading] = useState(false);
  const [mktSaved, setMktSaved] = useState(false);
  const [mktError, setMktError] = useState<string | null>(null);

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
  const setMkt = (patch: Partial<SiteMarketing>) => setM((s) => ({ ...s, ...patch }));

  const onSaveContentClick = async () => {
    setContentLoading(true);
    setContentError(null);
    setContentSaved(false);
    const res = await onSaveContent(c);
    setContentLoading(false);
    if (!res.ok) {
      setContentError(res.error);
      return;
    }
    setContentSaved(true);
    setTimeout(() => setContentSaved(false), 2500);
  };

  const onSaveMarketingClick = async () => {
    setMktLoading(true);
    setMktError(null);
    setMktSaved(false);
    const res = await onSaveMarketing(m);
    setMktLoading(false);
    if (!res.ok) {
      setMktError(res.error);
      return;
    }
    setMktSaved(true);
    setTimeout(() => setMktSaved(false), 2500);
  };

  return (
    <Stack gap={6} maxW="1180px" pb={24}>
      {/* ——— Conteúdo do site ——— */}
      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6} alignItems="stretch">
        <Card title="Marca">
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Nome" value={c.brand.name} onChange={(v) => setBrand({ name: v })} />
            <TextField label="Wordmark" value={c.brand.wordmark} onChange={(v) => setBrand({ wordmark: v })} />
            <TextField label="Cargo / título" value={c.brand.role} onChange={(v) => setBrand({ role: v })} />
            <TextField label="WhatsApp (só dígitos)" value={c.brand.whatsapp} onChange={(v) => setBrand({ whatsapp: v })} />
          </SimpleGrid>
        </Card>

        <Card title="Contato">
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <TextField label="Eyebrow" value={c.contact.eyebrow} onChange={(v) => setContact({ eyebrow: v })} />
            <TextField label="Título" value={c.contact.title} onChange={(v) => setContact({ title: v })} />
          </SimpleGrid>
          <TextField label="Subtítulo" value={c.contact.subtitle} onChange={(v) => setContact({ subtitle: v })} textarea />
          <TextField label="Email" value={c.contact.email} onChange={(v) => setContact({ email: v })} />
        </Card>
      </SimpleGrid>

      <Card title="Cores do site" icon={<Palette size={18} color="var(--admin-primary)" />}>
        <Text fontSize="sm" color="var(--admin-text-soft)">
          A cor do seu site é a MESMA do painel do sistema. Deixe vazio para usar a marca padrão
          (lilás do José). A “Aparência do painel” (/aparencia) ainda sobrescreve, se preferir separar.
        </Text>
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

      <Card title="Hero (topo)">
        <TextField label="Eyebrow" value={c.hero.eyebrow} onChange={(v) => setHero({ eyebrow: v })} />
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <TextField label="Título (parte 1)" value={c.hero.titleLead} onChange={(v) => setHero({ titleLead: v })} />
          <TextField label="Título (destaque)" value={c.hero.titleHighlight} onChange={(v) => setHero({ titleHighlight: v })} />
        </SimpleGrid>
        <TextField label="Subtítulo" value={c.hero.subtitle} onChange={(v) => setHero({ subtitle: v })} textarea />
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <TextField label="Botão primário" value={c.hero.primaryCtaLabel} onChange={(v) => setHero({ primaryCtaLabel: v })} />
          <TextField label="Botão secundário" value={c.hero.secondaryCtaLabel} onChange={(v) => setHero({ secondaryCtaLabel: v })} />
        </SimpleGrid>

        <Box>
          <Text fontWeight="600" fontSize="sm" color="var(--admin-primary)" mb={2}>Foto do hero (seu perfil)</Text>
          <HStack gap={4} align="center" flexWrap="wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.hero.photo?.trim() || "/assets/perfil.png"}
              alt="Foto do hero"
              style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, border: "1px solid var(--admin-border)", background: "#0b0614" }}
            />
            <Stack gap={1} align="flex-start">
              {renderImageUpload?.({ folder: "landing/hero", label: "Trocar foto", onUploaded: (url) => setHero({ photo: url }) })}
              {c.hero.photo && c.hero.photo !== "/assets/perfil.png" ? (
                <Button size="sm" variant="ghost" color="red.500" borderRadius="10px" onClick={() => setHero({ photo: "/assets/perfil.png" })}>
                  Usar padrão (perfil.png)
                </Button>
              ) : null}
            </Stack>
          </HStack>
          <Text fontSize="xs" color="var(--admin-text-soft)" mt={1} mb={4}>PNG/JPG/WebP até 8MB. Ideal: foto sua em fundo transparente. Vazio usa /assets/perfil.png.</Text>
        </Box>

        <Box>
          <Text fontWeight="600" fontSize="sm" color="var(--admin-primary)" mb={2}>Estatísticas</Text>
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
                <Plus size={14} style={{ marginRight: 4 }} /> Adicionar estatística
              </Button>
            )}
          </Stack>
        </Box>
      </Card>

      <Card title="Sobre">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <TextField label="Eyebrow" value={c.about.eyebrow} onChange={(v) => setAbout({ eyebrow: v })} />
          <TextField label="Título" value={c.about.title} onChange={(v) => setAbout({ title: v })} />
        </SimpleGrid>
        <Box>
          <Text fontWeight="600" fontSize="sm" color="var(--admin-primary)" mb={2}>Parágrafos</Text>
          <Stack gap={2}>
            {c.about.paragraphs.map((p, i) => (
              <HStack key={i} gap={2} align="flex-start">
                <Textarea
                  value={p}
                  rows={2}
                  flex="1"
                  onChange={(e) => {
                    const paragraphs = [...c.about.paragraphs];
                    paragraphs[i] = e.target.value;
                    setAbout({ paragraphs });
                  }}
                  {...inputProps}
                />
                <IconButton
                  aria-label="Remover"
                  size="sm"
                  variant="ghost"
                  color="red.500"
                  onClick={() => setAbout({ paragraphs: c.about.paragraphs.filter((_, j) => j !== i) })}
                >
                  <Trash2 size={15} />
                </IconButton>
              </HStack>
            ))}
            {c.about.paragraphs.length < 6 && (
              <Button
                size="sm"
                variant="outline"
                alignSelf="flex-start"
                borderColor="var(--admin-border)"
                color="var(--admin-primary)"
                borderRadius="10px"
                onClick={() => setAbout({ paragraphs: [...c.about.paragraphs, ""] })}
              >
                <Plus size={14} style={{ marginRight: 4 }} /> Adicionar parágrafo
              </Button>
            )}
          </Stack>
        </Box>
        <TextField label="Texto do card de stack" value={c.about.roleCardText} onChange={(v) => setAbout({ roleCardText: v })} textarea />
        <TextField label="Bio curta (abaixo da foto)" value={c.about.bio} onChange={(v) => setAbout({ bio: v })} textarea />

        <ListBlock
          label="Destaques (idade, nacionalidade, idiomas…)"
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

        <ListBlock
          label="Informações de contato (coluna direita)"
          items={c.about.contactInfo}
          onChange={(contactInfo) => setAbout({ contactInfo })}
          empty={{ icon: "map-pin", label: "", value: "" }}
          addLabel="Adicionar contato"
          max={8}
          renderRow={(info, i, update) => (
            <HStack gap={2} flexWrap="wrap">
              <IconSelect value={info.icon} onChange={(v) => update({ icon: v })} />
              <Input value={info.label} placeholder="Endereço" w="150px" onChange={(e) => update({ label: e.target.value })} {...inputProps} />
              <Input value={info.value} placeholder="São Caetano do Sul/SP" flex="1" minW="180px" onChange={(e) => update({ value: e.target.value })} {...inputProps} />
            </HStack>
          )}
        />

        <ListBlock
          label="Habilidades técnicas (nome, nível 0-100, cor)"
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
      </Card>

      <Card title="Benefícios (Por que comigo)">
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
      </Card>

      <Card title="Como funciona (3 passos)">
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
      </Card>

      <Card title="Soluções (O que eu construo)">
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
      </Card>

      <Card title="Projetos (portfólio)">
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <TextField label="Eyebrow" value={c.projects.eyebrow} onChange={(v) => setProjects({ eyebrow: v })} />
          <TextField label="Título" value={c.projects.title} onChange={(v) => setProjects({ title: v })} />
          <TextField label="Subtítulo" value={c.projects.subtitle} onChange={(v) => setProjects({ subtitle: v })} />
        </SimpleGrid>
        <ListBlock
          label="Projetos"
          items={c.projects.items}
          onChange={(items) => setProjects({ items })}
          empty={{ slug: "", name: "", tagline: "", description: "", category: "site", status: "live", stack: [], color: "#8B5CF6" }}
          addLabel="Adicionar projeto"
          max={24}
          renderRow={(p, i, update) => (
            <Stack gap={2}>
              <HStack gap={2} flexWrap="wrap">
                <Input value={p.name} placeholder="Nome" w="160px" onChange={(e) => update({ name: e.target.value })} {...inputProps} />
                <Input value={p.slug} placeholder="slug" w="140px" onChange={(e) => update({ slug: e.target.value })} {...inputProps} />
                <Input value={p.category} placeholder="categoria" w="120px" onChange={(e) => update({ category: e.target.value })} {...inputProps} />
                <NativeSelect.Root size="lg" w="100px">
                  <NativeSelect.Field
                    value={p.status}
                    onChange={(e) => update({ status: e.target.value as "live" | "beta" | "wip" })}
                    bg="white"
                    borderColor="var(--admin-border)"
                    borderRadius="10px"
                  >
                    <option value="live">live</option>
                    <option value="beta">beta</option>
                    <option value="wip">wip</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
                <Input type="color" value={p.color} w="56px" px={1} onChange={(e) => update({ color: e.target.value })} {...inputProps} />
              </HStack>
              <Input value={p.tagline} placeholder="Tagline curta" onChange={(e) => update({ tagline: e.target.value })} {...inputProps} />
              <Textarea value={p.description} rows={2} placeholder="Descrição" onChange={(e) => update({ description: e.target.value })} {...inputProps} />
              <HStack gap={2} flexWrap="wrap">
                <Input
                  value={p.stack.join(", ")}
                  placeholder="Next.js, TypeScript, PostgreSQL"
                  flex="1"
                  minW="220px"
                  onChange={(e) => update({ stack: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                  {...inputProps}
                />
                <Input value={p.website ?? ""} placeholder="https:// (opcional)" w="220px" onChange={(e) => update({ website: e.target.value })} {...inputProps} />
              </HStack>
            </Stack>
          )}
        />
      </Card>

      <Card title="Trajetória (linha do tempo)">
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
      </Card>

      <Card title="Depoimentos (vazio = seção oculta)">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <TextField label="Eyebrow" value={c.testimonials.eyebrow} onChange={(v) => setTestimonials({ eyebrow: v })} />
          <TextField label="Título" value={c.testimonials.title} onChange={(v) => setTestimonials({ title: v })} />
        </SimpleGrid>
        <ListBlock
          label="Depoimentos (só coloque reais)"
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
      </Card>

      <Card title="CTA final">
        <TextField label="Título" value={c.finalCta.title} onChange={(v) => setFinalCta({ title: v })} />
        <TextField label="Texto" value={c.finalCta.text} onChange={(v) => setFinalCta({ text: v })} textarea />
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <TextField label="Botão WhatsApp" value={c.finalCta.whatsappLabel} onChange={(v) => setFinalCta({ whatsappLabel: v })} />
          <TextField label="Botão projetos" value={c.finalCta.projectsLabel} onChange={(v) => setFinalCta({ projectsLabel: v })} />
        </SimpleGrid>
      </Card>

      <Card title="Redes e canais">
        <Box>
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
          <Text fontSize="xs" color="var(--admin-text-soft)" mt={2}>
            O WhatsApp usa sempre o número da Marca. Os demais usam o link informado aqui.
          </Text>
        </Box>
      </Card>

      <Card title="SEO (título e descrição da página)">
        <TextField label="Título (aba do navegador / Google)" value={c.seo.title} onChange={(v) => setSeo({ title: v })} />
        <TextField label="Meta description" value={c.seo.description} onChange={(v) => setSeo({ description: v })} textarea helper="Resumo que aparece nos resultados de busca e ao compartilhar o link." />
      </Card>

      <SaveBar label="Salvar conteúdo" onSave={onSaveContentClick} loading={contentLoading} saved={contentSaved} error={contentError} />

      {/* ——— Marketing & Rastreamento ——— */}
      <Box h="1px" bg="var(--admin-divider)" my={2} />
      <HStack gap={2}>
        <BarChart3 size={20} style={{ color: "var(--admin-primary)" }} />
        <Text fontSize="xl" fontWeight="800" color="var(--admin-primary)" className="admin-h">
          Marketing & Rastreamento
        </Text>
      </HStack>
      <Text fontSize="sm" color="var(--admin-text-soft)" mt={-2}>
        Mede quem vê o site, quem usa o gerador e quem fala no WhatsApp. Os eventos vão pro GA4 e pro
        Facebook (Pixel no navegador + Conversions API no servidor, deduplicados).
      </Text>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6} alignItems="stretch">
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
