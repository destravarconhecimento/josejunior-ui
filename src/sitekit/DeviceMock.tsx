/**
 * Mockup de produto como DADO. O conteúdo (`MockSpec`) descreve *o que* a tela
 * mostra; este componente decide *como* desenha. É o que permite a IA montar um
 * mockup convincente por segmento sem escrever uma linha de layout — e o que
 * acaba com a "caixa cinza genérica" que toda landing não-cartório mostrava.
 *
 * CELULAR é o padrão, de propósito: o produto é usado no telefone e a landing
 * é vista no telefone. `browser` existe pra quem vende site institucional, e
 * `both` empilha os dois (browser ao fundo, celular na frente) em telas largas.
 *
 * RSC-safe: sem hooks, sem handlers, sem estado. Determinístico (nada de
 * `Math.random`/`Date.now` — quebraria hidratação e o resume de workflow).
 * Só CSS: nenhuma imagem, nenhum asset, nada pra carregar.
 */
import { Box, HStack, Stack, Text } from "../primitives";
import { resolveSiteIcon } from "./icons";
import { brandGradient, resolveSiteTheme, tint, type ResolvedSiteTheme, type SiteTheme } from "./theme";

export type MockDevice = "phone" | "browser" | "both";

/** Tipos de tela que a plataforma realmente entrega (ver trava de capacidades). */
export type MockKind =
  | "agenda"
  | "kanban"
  | "chat"
  | "lista"
  | "dashboard"
  | "ficha"
  | "catalogo"
  /** Único que NÃO é tela de painel: é o site público (sem barra de app/abas). */
  | "site";

export type MockRow = {
  /** Texto principal da linha (nome, tarefa, mensagem, produto). */
  label: string;
  /** Coluna direita: horário, preço, número. */
  value?: string;
  /** Etiqueta curta (status, categoria). */
  tag?: string;
};

export type MockKpi = { label: string; value: string };

export type MockSpec = {
  device?: MockDevice;
  kind?: MockKind;
  /** Título da tela dentro do app (ex.: "Treinos da semana"). */
  title?: string;
  rows?: MockRow[];
  kpi?: MockKpi[];
  /** Ícone do app (nome do registry) — aparece na barra do topo. */
  icon?: string;
};

export const MOCK_KINDS: { id: MockKind; label: string; hint: string }[] = [
  { id: "agenda", label: "Agenda", hint: "Horários do dia com pessoa e status — agendamento, consultas, aulas." },
  { id: "lista", label: "Lista", hint: "Base de pessoas ou itens com valor à direita — clientes, alunos, membros." },
  { id: "kanban", label: "Quadro", hint: "Colunas por etapa — processos, funil, tarefas." },
  { id: "chat", label: "Conversa", hint: "Atendimento no WhatsApp com a IA respondendo." },
  { id: "dashboard", label: "Painel", hint: "Números do negócio e gráfico — financeiro, resultados." },
  { id: "ficha", label: "Ficha", hint: "Detalhe de uma pessoa ou item com campos — prontuário, imóvel, cadastro." },
  { id: "catalogo", label: "Catálogo", hint: "Grade de cards com preço — produtos, planos, imóveis." },
  { id: "site", label: "Site", hint: "O site público em si (menu, chamada e cards) — quando o que se vende é o site." },
];

/** Alturas das barras do gráfico — fixas (determinístico, sem random). */
const BAR_HEIGHTS = [46, 72, 55, 88, 64, 100, 78];

const FALLBACK_ROWS: MockRow[] = [
  { label: "Primeiro item", value: "09:00", tag: "Novo" },
  { label: "Segundo item", value: "10:30", tag: "Em dia" },
  { label: "Terceiro item", value: "14:00", tag: "Feito" },
  { label: "Quarto item", value: "16:15" },
];

function initials(s: string): string {
  const parts = s.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "•";
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase();
}

/* ─────────────────────────── conteúdo por tipo ─────────────────────────── */

/**
 * Tradutor do CHROME do mockup (rótulos que o componente inventa: "A fazer",
 * "Fale conosco"). O conteúdo do `spec` NÃO passa por aqui — ele já chega
 * localizado do banco. Ausente = devolve o pt-BR, que é a fonte.
 */
export type MockTranslate = (s: string) => string;
const IDENT: MockTranslate = (s) => s;

type BodyProps = { rows: MockRow[]; kpi: MockKpi[]; t: ResolvedSiteTheme; tr: MockTranslate };

function Agenda({ rows, t }: BodyProps) {
  return (
    <Stack gap={2}>
      {rows.slice(0, 5).map((r, i) => (
        <HStack key={i} gap={2.5} align="stretch">
          <Text
            fontSize="10px"
            fontWeight="800"
            color={t.soft}
            minW="34px"
            pt="9px"
            letterSpacing="-0.01em"
          >
            {r.value || `${8 + i}:00`}
          </Text>
          <Box
            flex="1"
            bg="#fff"
            borderRadius="10px"
            borderWidth="1px"
            borderColor={t.line}
            borderLeftWidth="3px"
            borderLeftColor={i === 0 ? t.accent : t.primary}
            px={2.5}
            py={2}
          >
            <Text fontSize="11px" fontWeight="700" color={t.ink} lineClamp={1}>
              {r.label}
            </Text>
            {r.tag ? (
              <Text fontSize="9px" fontWeight="600" color={t.soft} mt="1px" lineClamp={1}>
                {r.tag}
              </Text>
            ) : null}
          </Box>
        </HStack>
      ))}
    </Stack>
  );
}

function Lista({ rows, t }: BodyProps) {
  return (
    <Stack gap={1.5}>
      {rows.slice(0, 6).map((r, i) => (
        <HStack
          key={i}
          gap={2.5}
          bg="#fff"
          borderRadius="10px"
          borderWidth="1px"
          borderColor={t.line}
          px={2.5}
          py={2}
        >
          <Box
            w="26px"
            h="26px"
            borderRadius="full"
            flexShrink={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            style={{ background: i % 2 === 0 ? tint(t.primary, 0.12) : tint(t.accent, 0.16) }}
          >
            <Text fontSize="9px" fontWeight="800" color={i % 2 === 0 ? t.primary : t.accent}>
              {initials(r.label)}
            </Text>
          </Box>
          <Box flex="1" minW={0}>
            <Text fontSize="11px" fontWeight="700" color={t.ink} lineClamp={1}>
              {r.label}
            </Text>
            {r.tag ? (
              <Text fontSize="9px" color={t.soft} lineClamp={1}>
                {r.tag}
              </Text>
            ) : null}
          </Box>
          {r.value ? (
            <Text fontSize="10px" fontWeight="800" color={t.primary} flexShrink={0}>
              {r.value}
            </Text>
          ) : null}
        </HStack>
      ))}
    </Stack>
  );
}

function Kanban({ rows, t, tr }: BodyProps) {
  const labels = ["A fazer", "Em andamento", "Concluído"].map(tr);
  const cols = [0, 1, 2].map((c) => rows.filter((_, i) => i % 3 === c));
  return (
    <HStack gap={1.5} align="flex-start">
      {cols.map((items, c) => (
        <Stack key={c} flex="1" gap={1.5} minW={0}>
          <HStack gap={1}>
            <Box w="5px" h="5px" borderRadius="full" bg={c === 2 ? t.accent : t.primary} flexShrink={0} />
            <Text fontSize="8px" fontWeight="800" color={t.soft} textTransform="uppercase" letterSpacing="0.04em" lineClamp={1}>
              {labels[c]}
            </Text>
          </HStack>
          {items.slice(0, 3).map((r, i) => (
            <Box
              key={i}
              bg="#fff"
              borderRadius="8px"
              borderWidth="1px"
              borderColor={t.line}
              px={1.5}
              py={1.5}
              style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.05)" }}
            >
              <Text fontSize="9px" fontWeight="700" color={t.ink} lineClamp={2} lineHeight="1.25">
                {r.label}
              </Text>
              {r.tag ? (
                <Box
                  mt="4px"
                  display="inline-block"
                  px="4px"
                  py="1px"
                  borderRadius="4px"
                  style={{ background: tint(c === 2 ? t.accent : t.primary, 0.12) }}
                >
                  <Text fontSize="7px" fontWeight="800" color={c === 2 ? t.accent : t.primary} lineClamp={1}>
                    {r.tag}
                  </Text>
                </Box>
              ) : null}
            </Box>
          ))}
        </Stack>
      ))}
    </HStack>
  );
}

function Chat({ rows, t }: BodyProps) {
  return (
    <Stack gap={2}>
      {rows.slice(0, 5).map((r, i) => {
        const mine = i % 2 === 1;
        return (
          <HStack key={i} justify={mine ? "flex-end" : "flex-start"} gap={1}>
            <Box
              maxW="82%"
              px={2.5}
              py={1.5}
              borderRadius="12px"
              borderBottomRightRadius={mine ? "3px" : "12px"}
              borderBottomLeftRadius={mine ? "12px" : "3px"}
              bg={mine ? undefined : "#fff"}
              borderWidth={mine ? "0" : "1px"}
              borderColor={t.line}
              style={mine ? { background: brandGradient(t) } : undefined}
            >
              <Text fontSize="10.5px" fontWeight={mine ? "600" : "500"} color={mine ? "#fff" : t.ink} lineHeight="1.4">
                {r.label}
              </Text>
              <Text
                fontSize="8px"
                fontWeight="600"
                textAlign="right"
                mt="2px"
                color={mine ? "rgba(255,255,255,0.75)" : t.soft}
              >
                {r.value || (mine ? "✓✓" : "")}
              </Text>
            </Box>
          </HStack>
        );
      })}
    </Stack>
  );
}

function Dashboard({ rows, kpi, t, tr }: BodyProps) {
  const cards = kpi.length ? kpi.slice(0, 2) : [{ label: tr("Este mês"), value: "—" }];
  return (
    <Stack gap={2.5}>
      <HStack gap={1.5}>
        {cards.map((k, i) => (
          <Box
            key={i}
            flex="1"
            borderRadius="10px"
            px={2}
            py={2}
            minW={0}
            style={{ background: i === 0 ? brandGradient(t) : tint(t.accent, 0.12) }}
          >
            <Text fontSize="8px" fontWeight="700" color={i === 0 ? "rgba(255,255,255,0.8)" : t.soft} lineClamp={1}>
              {k.label}
            </Text>
            <Text fontSize="15px" fontWeight="900" color={i === 0 ? "#fff" : t.ink} letterSpacing="-0.02em" lineClamp={1}>
              {k.value}
            </Text>
          </Box>
        ))}
      </HStack>
      <Box bg="#fff" borderRadius="10px" borderWidth="1px" borderColor={t.line} px={2.5} py={2.5}>
        <HStack gap={1.5} align="flex-end" h="76px">
          {BAR_HEIGHTS.map((h, i) => (
            <Box
              key={i}
              flex="1"
              h={`${h}%`}
              borderRadius="3px"
              style={{ background: i === BAR_HEIGHTS.length - 2 ? t.accent : tint(t.primary, 0.55) }}
            />
          ))}
        </HStack>
      </Box>
      <Stack gap={1}>
        {rows.slice(0, 2).map((r, i) => (
          <HStack key={i} justify="space-between" gap={2}>
            <HStack gap={1.5} minW={0}>
              <Box w="6px" h="6px" borderRadius="full" bg={i === 0 ? t.primary : t.accent} flexShrink={0} />
              <Text fontSize="10px" fontWeight="600" color={t.body} lineClamp={1}>
                {r.label}
              </Text>
            </HStack>
            {r.value ? (
              <Text fontSize="10px" fontWeight="800" color={t.ink} flexShrink={0}>
                {r.value}
              </Text>
            ) : null}
          </HStack>
        ))}
      </Stack>
    </Stack>
  );
}

function Ficha({ rows, kpi, t }: BodyProps) {
  const head = rows[0] ?? FALLBACK_ROWS[0];
  const fields = rows.slice(1, 5);
  return (
    <Stack gap={2.5}>
      <HStack gap={2.5} bg="#fff" borderRadius="12px" borderWidth="1px" borderColor={t.line} px={2.5} py={2.5}>
        <Box
          w="40px"
          h="40px"
          borderRadius="12px"
          flexShrink={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          style={{ background: brandGradient(t) }}
        >
          <Text fontSize="13px" fontWeight="900" color="#fff">
            {initials(head.label)}
          </Text>
        </Box>
        <Box minW={0} flex="1">
          <Text fontSize="12px" fontWeight="800" color={t.ink} lineClamp={1}>
            {head.label}
          </Text>
          {head.tag ? (
            <Box mt="3px" display="inline-block" px="6px" py="1px" borderRadius="5px" style={{ background: tint(t.accent, 0.16) }}>
              <Text fontSize="8px" fontWeight="800" color={t.accent}>
                {head.tag}
              </Text>
            </Box>
          ) : null}
        </Box>
      </HStack>
      {kpi.length ? (
        <HStack gap={1.5}>
          {kpi.slice(0, 3).map((k, i) => (
            <Box key={i} flex="1" bg="#fff" borderRadius="9px" borderWidth="1px" borderColor={t.line} px={1.5} py={1.5} minW={0}>
              <Text fontSize="12px" fontWeight="900" color={t.primary} lineClamp={1} letterSpacing="-0.02em">
                {k.value}
              </Text>
              <Text fontSize="7.5px" fontWeight="700" color={t.soft} lineClamp={1}>
                {k.label}
              </Text>
            </Box>
          ))}
        </HStack>
      ) : null}
      <Stack gap={0} bg="#fff" borderRadius="10px" borderWidth="1px" borderColor={t.line} overflow="hidden">
        {fields.map((r, i) => (
          <HStack
            key={i}
            justify="space-between"
            gap={2}
            px={2.5}
            py={2}
            borderTopWidth={i === 0 ? "0" : "1px"}
            borderColor={t.line}
          >
            <Text fontSize="10px" fontWeight="600" color={t.soft} lineClamp={1}>
              {r.label}
            </Text>
            <Text fontSize="10px" fontWeight="800" color={t.ink} flexShrink={0} lineClamp={1}>
              {r.value || r.tag || "—"}
            </Text>
          </HStack>
        ))}
      </Stack>
    </Stack>
  );
}

function Catalogo({ rows, t }: BodyProps) {
  return (
    <Box display="grid" gridTemplateColumns="1fr 1fr" gap="8px">
      {rows.slice(0, 4).map((r, i) => (
        <Box key={i} bg="#fff" borderRadius="10px" borderWidth="1px" borderColor={t.line} overflow="hidden">
          <Box
            h="52px"
            position="relative"
            style={{
              background:
                i % 2 === 0
                  ? `linear-gradient(135deg, ${tint(t.primary, 0.22)}, ${tint(t.primary, 0.08)})`
                  : `linear-gradient(135deg, ${tint(t.accent, 0.26)}, ${tint(t.accent, 0.08)})`,
            }}
          >
            {r.tag ? (
              <Box position="absolute" top="5px" left="5px" px="5px" py="1px" borderRadius="4px" bg="rgba(255,255,255,0.9)">
                <Text fontSize="7px" fontWeight="800" color={i % 2 === 0 ? t.primary : t.accent} lineClamp={1}>
                  {r.tag}
                </Text>
              </Box>
            ) : null}
          </Box>
          <Box px={1.5} py={1.5}>
            <Text fontSize="9.5px" fontWeight="700" color={t.ink} lineClamp={2} lineHeight="1.25">
              {r.label}
            </Text>
            {r.value ? (
              <Text fontSize="10px" fontWeight="900" color={t.primary} mt="3px" letterSpacing="-0.01em">
                {r.value}
              </Text>
            ) : null}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/** Tipos que são tela de PAINEL (moldura com barra de app + abas embaixo). */
type PanelKind = Exclude<MockKind, "site">;

const BODIES: Record<PanelKind, (p: BodyProps) => React.ReactElement> = {
  agenda: Agenda,
  lista: Lista,
  kanban: Kanban,
  chat: Chat,
  dashboard: Dashboard,
  ficha: Ficha,
  catalogo: Catalogo,
};

/* ──────────────────────────── molduras ──────────────────────────── */

type ScreenProps = { spec: MockSpec; t: ResolvedSiteTheme; tr: MockTranslate; compact?: boolean };

/** O site público dentro da moldura — sem barra de app nem abas. */
function SiteScreen({ spec, t, tr, compact }: ScreenProps) {
  const rows = spec.rows?.length ? spec.rows : FALLBACK_ROWS;
  const Icon = resolveSiteIcon(spec.icon);
  const pad = compact ? 3 : 3.5;
  return (
    <Stack gap={0} h="100%" bg="#fff" overflow="hidden">
      {/* menu do site */}
      <HStack justify="space-between" px={pad} py={2.5} borderBottomWidth="1px" borderColor={t.line} flexShrink={0}>
        <HStack gap={1.5} minW={0}>
          <Box
            w="18px"
            h="18px"
            borderRadius="5px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            style={{ background: brandGradient(t) }}
          >
            <Icon size={10} color="#fff" />
          </Box>
          <Text fontSize="10px" fontWeight="800" color={t.ink} lineClamp={1}>
            {spec.title || tr("Seu negócio")}
          </Text>
        </HStack>
        <HStack gap="4px" flexShrink={0}>
          {[16, 13, 15].map((w, i) => (
            <Box key={i} w={`${w}px`} h="3px" borderRadius="full" bg={t.line} />
          ))}
          <Box px="7px" py="3px" borderRadius="full" ml="3px" style={{ background: brandGradient(t) }}>
            <Text fontSize="7px" fontWeight="800" color="#fff">
              {tr("Fale conosco")}
            </Text>
          </Box>
        </HStack>
      </HStack>

      {/* hero */}
      <Box px={pad} py={compact ? 4 : 5} style={{ background: `linear-gradient(180deg, ${tint(t.primary, 0.07)}, #fff)` }} flexShrink={0}>
        <Box display="inline-block" px="7px" py="2px" borderRadius="full" mb="7px" style={{ background: tint(t.accent, 0.16) }}>
          <Text fontSize="7.5px" fontWeight="800" color={t.accent} lineClamp={1}>
            {rows[0]?.tag || tr("Atendimento hoje")}
          </Text>
        </Box>
        <Text fontSize="15px" fontWeight="900" color={t.ink} lineHeight="1.15" letterSpacing="-0.02em" lineClamp={2}>
          {rows[0]?.label || tr("O seu site profissional, no ar.")}
        </Text>
        <Box w="72%" h="4px" borderRadius="full" bg={t.line} mt="7px" />
        <Box w="52%" h="4px" borderRadius="full" bg={t.line} mt="4px" />
        <HStack gap={1.5} mt={2.5}>
          <Box px="10px" py="5px" borderRadius="8px" style={{ background: brandGradient(t) }}>
            <Text fontSize="8px" fontWeight="800" color="#fff">
              {rows[0]?.value || tr("Quero saber mais")}
            </Text>
          </Box>
          <Box px="10px" py="5px" borderRadius="8px" borderWidth="1px" borderColor={t.line}>
            <Text fontSize="8px" fontWeight="700" color={t.body}>
              {tr("Serviços")}
            </Text>
          </Box>
        </HStack>
      </Box>

      {/* cards de serviço */}
      <Box flex="1" minH={0} px={pad} py={compact ? 2.5 : 3} bg={t.surface} overflow="hidden">
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap="7px">
          {rows.slice(1, 5).map((r, i) => (
            <Box key={i} bg="#fff" borderRadius="9px" borderWidth="1px" borderColor={t.line} px={2} py={2}>
              <Box
                w="18px"
                h="18px"
                borderRadius="6px"
                mb="5px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                style={{ background: i % 2 === 0 ? tint(t.primary, 0.12) : tint(t.accent, 0.16) }}
              >
                <Box w="7px" h="7px" borderRadius="2px" bg={i % 2 === 0 ? t.primary : t.accent} />
              </Box>
              <Text fontSize="9px" fontWeight="700" color={t.ink} lineClamp={1}>
                {r.label}
              </Text>
              <Box w="80%" h="3px" borderRadius="full" bg={t.line} mt="4px" />
            </Box>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}

function AppScreen({ spec, t, tr, compact }: ScreenProps) {
  const kind: PanelKind = spec.kind && spec.kind !== "site" && BODIES[spec.kind] ? spec.kind : "lista";
  const rows = spec.rows?.length ? spec.rows : FALLBACK_ROWS;
  const kpi = spec.kpi ?? [];
  const Body = BODIES[kind];
  const Icon = resolveSiteIcon(spec.icon);
  return (
    <Stack gap={0} h="100%" bg={t.surface}>
      {/* barra do app */}
      <Box px={3} py={2.5} style={{ background: brandGradient(t) }} flexShrink={0}>
        <HStack justify="space-between" gap={2}>
          <HStack gap={1.5} minW={0}>
            <Box
              w="20px"
              h="20px"
              borderRadius="6px"
              bg="rgba(255,255,255,0.18)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon size={11} color="#fff" />
            </Box>
            <Text fontSize="11.5px" fontWeight="800" color="#fff" lineClamp={1} letterSpacing="-0.01em">
              {spec.title || tr("Meu painel")}
            </Text>
          </HStack>
          <HStack gap="3px" flexShrink={0}>
            {[0, 1, 2].map((i) => (
              <Box key={i} w="3px" h="3px" borderRadius="full" bg="rgba(255,255,255,0.6)" />
            ))}
          </HStack>
        </HStack>
      </Box>
      {/* corpo */}
      <Box flex="1" minH={0} px={compact ? 2 : 3} py={compact ? 2 : 3} overflow="hidden">
        <Body rows={rows} kpi={kpi} t={t} tr={tr} />
      </Box>
      {/* barra inferior de navegação */}
      <HStack justify="space-around" px={3} py={2} bg="#fff" borderTopWidth="1px" borderColor={t.line} flexShrink={0}>
        {[0, 1, 2, 3].map((i) => (
          <Stack key={i} gap="3px" align="center">
            <Box w="16px" h="3px" borderRadius="full" bg={i === 0 ? t.primary : t.line} />
            <Box w="11px" h="3px" borderRadius="full" bg={i === 0 ? tint(t.primary, 0.4) : "#F1F5F9"} />
          </Stack>
        ))}
      </HStack>
    </Stack>
  );
}

/** Escolhe a moldura interna: site público ou tela de painel. */
function Screen({ spec, t, tr, compact }: ScreenProps) {
  return spec.kind === "site" ? (
    <SiteScreen spec={spec} t={t} tr={tr} compact={compact} />
  ) : (
    <AppScreen spec={spec} t={t} tr={tr} compact={compact} />
  );
}

function PhoneFrame({ spec, t, tr }: { spec: MockSpec; t: ResolvedSiteTheme; tr: MockTranslate }) {
  return (
    <Box
      w="272px"
      maxW="100%"
      borderRadius="42px"
      p="9px"
      bg="#0B1220"
      flexShrink={0}
      style={{ boxShadow: "0 30px 60px -18px rgba(15,23,42,0.42), 0 0 0 1px rgba(15,23,42,0.06)" }}
    >
      <Box position="relative" borderRadius="34px" overflow="hidden" bg={t.surface} h="500px">
        {/* ilha dinâmica */}
        <Box
          position="absolute"
          top="8px"
          left="50%"
          w="78px"
          h="20px"
          borderRadius="full"
          bg="#0B1220"
          zIndex={3}
          style={{ transform: "translateX(-50%)" }}
        />
        {/* barra de status */}
        <HStack
          justify="space-between"
          px={4}
          h="32px"
          flexShrink={0}
          position="relative"
          zIndex={2}
          style={{ background: t.primary }}
        >
          <Text fontSize="10px" fontWeight="800" color="#fff">
            9:41
          </Text>
          <HStack gap="3px">
            <Box w="3px" h="6px" borderRadius="1px" bg="rgba(255,255,255,0.85)" />
            <Box w="3px" h="8px" borderRadius="1px" bg="rgba(255,255,255,0.85)" />
            <Box w="3px" h="10px" borderRadius="1px" bg="rgba(255,255,255,0.85)" />
            <Box w="16px" h="8px" borderRadius="2px" ml="3px" borderWidth="1px" borderColor="rgba(255,255,255,0.7)" p="1px">
              <Box w="70%" h="100%" borderRadius="1px" bg="rgba(255,255,255,0.9)" />
            </Box>
          </HStack>
        </HStack>
        <Box position="absolute" top="32px" left="0" right="0" bottom="0">
          <Screen spec={spec} t={t} tr={tr} />
        </Box>
        {/* indicador de home */}
        <Box
          position="absolute"
          bottom="6px"
          left="50%"
          w="96px"
          h="4px"
          borderRadius="full"
          bg="rgba(15,23,42,0.3)"
          zIndex={3}
          style={{ transform: "translateX(-50%)" }}
        />
      </Box>
    </Box>
  );
}

function BrowserFrame({ spec, t, tr, host }: { spec: MockSpec; t: ResolvedSiteTheme; tr: MockTranslate; host?: string }) {
  return (
    <Box
      borderRadius="16px"
      overflow="hidden"
      bg="#fff"
      borderWidth="1px"
      borderColor={t.line}
      w="100%"
      style={{ boxShadow: "0 24px 48px -20px rgba(15,23,42,0.28)" }}
    >
      <HStack gap={2} px={3} py={2.5} bg="#F1F5F9" borderBottomWidth="1px" borderColor={t.line}>
        <HStack gap="5px" flexShrink={0}>
          {["#F87171", "#FBBF24", "#34D399"].map((c) => (
            <Box key={c} w="9px" h="9px" borderRadius="full" bg={c} />
          ))}
        </HStack>
        <Box flex="1" bg="#fff" borderRadius="full" borderWidth="1px" borderColor={t.line} px={2.5} py="3px" minW={0}>
          <Text fontSize="10px" fontWeight="600" color={t.soft} lineClamp={1}>
            {host || "seu-negocio.com.br"}
          </Text>
        </Box>
      </HStack>
      <Box h="330px">
        <Screen spec={spec} t={t} tr={tr} compact />
      </Box>
    </Box>
  );
}

/**
 * Mockup do produto. `spec.device`:
 *  - `phone` (padrão) — só o celular
 *  - `browser` — só o navegador
 *  - `both` — navegador ao fundo + celular na frente (≥ lg); no celular do
 *    visitante mostra só o telefone, que é o que importa ali.
 */
export function DeviceMock({
  spec,
  theme,
  host,
  translate,
}: {
  spec: MockSpec;
  theme?: SiteTheme | null;
  /** Domínio mostrado na barra do navegador. */
  host?: string;
  /** Traduz só o chrome do mockup; o `spec` já chega no idioma do visitante. */
  translate?: MockTranslate;
}) {
  const t = resolveSiteTheme(theme);
  const tr = translate ?? IDENT;
  const device: MockDevice = spec.device ?? "phone";

  if (device === "browser") return <BrowserFrame spec={spec} t={t} tr={tr} host={host} />;
  if (device === "phone") {
    return (
      <Box display="flex" justifyContent="center">
        <PhoneFrame spec={spec} t={t} tr={tr} />
      </Box>
    );
  }

  // both — navegador atrás, celular na frente (só quando há largura pra isso)
  return (
    <Box position="relative" display="flex" justifyContent="center">
      <Box display={{ base: "none", lg: "block" }} w="100%" pl="120px" pt="28px">
        <BrowserFrame spec={spec} t={t} tr={tr} host={host} />
      </Box>
      <Box position={{ base: "static", lg: "absolute" }} left="0" bottom="0" zIndex={2}>
        <PhoneFrame spec={spec} t={t} tr={tr} />
      </Box>
    </Box>
  );
}
