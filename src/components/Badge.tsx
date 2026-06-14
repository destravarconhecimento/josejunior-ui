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
      display="inline-block"
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
  paused: { bg: "rgba(234,179,8,0.14)", color: "#a16207", label: "Pausado" },
  inactive: { bg: "rgba(100,116,139,0.14)", color: "#475569", label: "Inativo" },
  inativo: { bg: "rgba(100,116,139,0.14)", color: "#475569", label: "Inativo" },
  canceled: { bg: "rgba(100,116,139,0.14)", color: "#475569", label: "Cancelado" },
};

/** Badge de status com mapeamento padrão (ou `label` custom). */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.canceled;
  return (
    <Tag bg={s.bg} color={s.color}>
      {label ?? s.label}
    </Tag>
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
