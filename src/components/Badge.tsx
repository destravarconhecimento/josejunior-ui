import { Box } from "@chakra-ui/react";
import type { ReactNode } from "react";

/** Pílula genérica de status/tag. */
export function Tag({
  children,
  bg = "var(--admin-nav-active)",
  color = "var(--admin-primary)",
  title,
}: {
  children: ReactNode;
  bg?: string;
  color?: string;
  /** Tooltip nativo (atributo HTML `title`). */
  title?: string;
}) {
  return (
    <Box
      as="span"
      title={title}
      // inline-FLEX (não inline-block): o preflight do Chakra força `svg{display:block}`,
      // e um filho block dentro de fluxo inline quebra a linha (empurra o texto pra
      // baixo do ícone) — `whiteSpace:nowrap` não segura block. Flex força ícone+texto
      // na mesma linha. overflow/maxW = rede de segurança em coluna estreita (trunca em vez de vazar).
      display="inline-flex"
      alignItems="center"
      gap="1"
      maxW="100%"
      whiteSpace="nowrap"
      overflow="hidden"
      textOverflow="ellipsis"
      fontSize="xs"
      fontWeight="600"
      px={2.5}
      py={1}
      borderRadius="full"
      bg={bg}
      color={color}
    >
      {children}
    </Box>
  );
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: "rgba(34,197,94,0.12)", color: "#15803d", label: "Ativo" },
  ativo: { bg: "rgba(34,197,94,0.12)", color: "#15803d", label: "Ativo" },
  trial: { bg: "rgba(168,85,247,0.12)", color: "#7c3aed", label: "Trial" },
  pendente: { bg: "rgba(245,158,11,0.16)", color: "#b45309", label: "Pendente" },
  interessado: { bg: "rgba(37,99,235,0.12)", color: "#1d4ed8", label: "Interessado" },
  paused: { bg: "rgba(234,179,8,0.14)", color: "#a16207", label: "Pausado" },
  expirado: { bg: "rgba(100,116,139,0.14)", color: "#475569", label: "Expirado" },
  inactive: { bg: "rgba(100,116,139,0.14)", color: "#475569", label: "Inativo" },
  inativo: { bg: "rgba(100,116,139,0.14)", color: "#475569", label: "Inativo" },
  canceled: { bg: "rgba(100,116,139,0.14)", color: "#475569", label: "Cancelado" },
  cancelado: { bg: "rgba(100,116,139,0.14)", color: "#475569", label: "Cancelado" },
  // Cobrança (ver apps/sistema/src/lib/billing.ts → normalizeChargeStatus).
  // "pendente" acima já serve; estes fecham o vocabulário.
  // Solicitações (pedido de número de WhatsApp) — "pendente" acima já serve.
  aprovada: { bg: "rgba(34,197,94,0.12)", color: "#15803d", label: "Aprovada" },
  recusada: { bg: "rgba(239,68,68,0.12)", color: "#b91c1c", label: "Recusada" },
  cancelada: { bg: "rgba(100,116,139,0.14)", color: "#475569", label: "Cancelada" },
  usada: { bg: "rgba(37,99,235,0.12)", color: "#1d4ed8", label: "Número criado" },
  pago: { bg: "rgba(34,197,94,0.12)", color: "#15803d", label: "Pago" },
  atrasado: { bg: "rgba(239,68,68,0.12)", color: "#b91c1c", label: "Atrasado" },
  estornado: { bg: "rgba(168,85,247,0.12)", color: "#7c3aed", label: "Estornado" },
};

/**
 * Estilo do vocabulário de status (cor de fundo/texto/rótulo pt) ou `undefined`
 * quando o código não está no catálogo — diferente do `StatusBadge`, que cai no
 * "Cancelado" quando não conhece o valor.
 */
export function estiloDeStatus(status: string): { bg: string; color: string; label: string } | undefined {
  return STATUS_STYLES[status];
}

/** Badge de status com mapeamento padrão (ou `label` custom). */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.canceled;
  return (
    <Tag bg={s.bg} color={s.color}>
      {label ?? s.label}
    </Tag>
  );
}

const PONTO_CORES = {
  ok: "#15803d",
  alerta: "#b45309",
  inativo: "var(--admin-border-strong, #cbd5e1)",
} as const;

/**
 * Ponto de estado: o status reduzido a uma bolinha, pra linha de lista onde a
 * pílula do `StatusBadge` rouba a largura do dado. `oco` = estado que ainda não
 * foi medido (contorno sem preenchimento), diferente de medido e inativo.
 */
export function PontoDeEstado({
  tom,
  oco = false,
  title,
}: {
  tom: keyof typeof PONTO_CORES;
  oco?: boolean;
  title?: string;
}) {
  const cor = PONTO_CORES[tom];
  return (
    <Box
      as="span"
      title={title}
      display="inline-block"
      w="8px"
      h="8px"
      flexShrink={0}
      borderRadius="full"
      bg={oco ? "transparent" : cor}
      borderWidth={oco ? "1.5px" : "0"}
      borderColor={cor}
    />
  );
}

/** Modo de entrega do tenant (central / self-hosted). */
export function DeliveryBadge({ mode }: { mode: string }) {
  const isCentral = mode === "central";
  return (
    <Tag
      bg={isCentral ? "rgba(124,110,224,0.12)" : "rgba(100,116,139,0.10)"}
      color={isCentral ? "#6d28d9" : "#475569"}
    >
      {isCentral ? "Central" : "Próprio"}
    </Tag>
  );
}
