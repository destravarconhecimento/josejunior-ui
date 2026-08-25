"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

/**
 * Grade semanal/diária de VAGAS da agenda clínica (portada do drmaurilio).
 * Puro: recebe as vagas já carregadas e devolve cliques. Não sabe de servidor.
 *
 * Cada coluna é um dia; cada vaga é posicionada pela hora (top/height em px).
 * Clique em área vazia devolve (date, "HH:MM") pra abrir uma vaga nova; clique
 * numa vaga devolve a vaga (quem abre painel de detalhe é a tela).
 */

export type AgendaGradeStatus =
  | "disponivel"
  | "reservado"
  | "agendado"
  | "confirmado"
  | "atendido"
  | "faltou"
  | "cancelado"
  | "bloqueado";

export const AGENDA_STATUS_LABELS: Record<AgendaGradeStatus, string> = {
  disponivel: "Disponível",
  reservado: "Reservado (site)",
  agendado: "Agendado",
  confirmado: "Confirmado",
  atendido: "Atendido",
  faltou: "Faltou",
  cancelado: "Cancelado",
  bloqueado: "Bloqueado",
};

export const AGENDA_STATUS_STYLES: Record<AgendaGradeStatus, { bg: string; color: string; border: string }> = {
  disponivel: { bg: "rgba(34,197,94,0.10)", color: "#15803d", border: "rgba(34,197,94,0.45)" },
  reservado: { bg: "rgba(245,158,11,0.14)", color: "#b45309", border: "rgba(245,158,11,0.5)" },
  agendado: { bg: "rgba(37,99,235,0.12)", color: "#1d4ed8", border: "rgba(37,99,235,0.45)" },
  confirmado: { bg: "rgba(20,184,166,0.14)", color: "#0f766e", border: "rgba(20,184,166,0.5)" },
  atendido: { bg: "rgba(100,116,139,0.14)", color: "#334155", border: "rgba(100,116,139,0.4)" },
  faltou: { bg: "rgba(239,68,68,0.10)", color: "#b91c1c", border: "rgba(239,68,68,0.4)" },
  cancelado: { bg: "rgba(148,163,184,0.12)", color: "#64748b", border: "rgba(148,163,184,0.4)" },
  bloqueado: { bg: "repeating-linear-gradient(45deg, rgba(100,116,139,0.10) 0 6px, transparent 6px 12px)", color: "#475569", border: "rgba(100,116,139,0.35)" },
};

export interface AgendaGradeSlot {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM */
  startTime: string;
  /** HH:MM */
  endTime: string;
  status: AgendaGradeStatus;
  /** Linha principal (nome do paciente, "Vaga aberta", motivo do bloqueio…). */
  title: string;
  subtitle?: string | null;
  /** Cor do profissional (faixa lateral). */
  color?: string | null;
  /** Ícone/marcador extra à direita do título (ex.: pago, teleconsulta). */
  badge?: ReactNode;
}

export interface AgendaGradeDay {
  /** YYYY-MM-DD */
  date: string;
  /** Ex.: "seg 25/08" */
  label: string;
  /** Dia sem expediente (fica cinza, mas continua clicável). */
  blocked?: boolean;
  today?: boolean;
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const pad = (n: number) => String(n).padStart(2, "0");

export function AgendaGrade({
  days,
  slots,
  startHour = 7,
  endHour = 20,
  stepMinutes = 30,
  rowHeight = 44,
  selectedId,
  onSlotClick,
  onEmptyClick,
}: {
  days: AgendaGradeDay[];
  slots: AgendaGradeSlot[];
  startHour?: number;
  endHour?: number;
  stepMinutes?: number;
  /** Altura (px) de cada passo de `stepMinutes`. */
  rowHeight?: number;
  selectedId?: string | null;
  onSlotClick?: (slot: AgendaGradeSlot) => void;
  /** Clique em espaço vazio: dia + hora arredondada ao passo. */
  onEmptyClick?: (date: string, time: string) => void;
}) {
  const startMin = startHour * 60;
  const endMin = endHour * 60;
  const steps = Math.max(1, Math.ceil((endMin - startMin) / stepMinutes));
  const pxPerMin = rowHeight / stepMinutes;
  const totalH = steps * rowHeight;

  const byDay = new Map<string, AgendaGradeSlot[]>();
  for (const s of slots) {
    const arr = byDay.get(s.date) ?? [];
    arr.push(s);
    byDay.set(s.date, arr);
  }

  const hourMarks: number[] = [];
  for (let m = startMin; m < endMin; m += 60) hourMarks.push(m);

  const gutter = 56;

  return (
    <Box data-jj-agenda-grade="" w="100%">
      {/* Cabeçalho dos dias */}
      <Box
        display="grid"
        gridTemplateColumns={`${gutter}px repeat(${days.length}, minmax(120px, 1fr))`}
        position="sticky"
        top="var(--admin-sticky-top, 0px)"
        zIndex={2}
        bg="var(--admin-surface, #fff)"
        borderBottom="1px solid var(--admin-border, #e2e8f0)"
      >
        <Box />
        {days.map((d) => (
          <Box
            key={d.date}
            px={2}
            py={2}
            textAlign="center"
            fontSize="xs"
            fontWeight="700"
            color={d.today ? "var(--admin-primary)" : d.blocked ? "var(--admin-muted, #94a3b8)" : "var(--admin-fg, #0f172a)"}
            borderLeft="1px solid var(--admin-border, #e2e8f0)"
            textTransform="capitalize"
          >
            {d.label}
            {d.blocked ? (
              <Text as="span" display="block" fontSize="10px" fontWeight="500" color="var(--admin-muted, #94a3b8)">
                sem expediente
              </Text>
            ) : null}
          </Box>
        ))}
      </Box>

      {/* Corpo */}
      <Box display="grid" gridTemplateColumns={`${gutter}px repeat(${days.length}, minmax(120px, 1fr))`}>
        {/* Régua das horas */}
        <Box position="relative" h={`${totalH}px`}>
          {hourMarks.map((m) => (
            <Text
              key={m}
              position="absolute"
              top={`${(m - startMin) * pxPerMin - 7}px`}
              right={2}
              fontSize="11px"
              color="var(--admin-muted, #94a3b8)"
              fontVariantNumeric="tabular-nums"
            >
              {pad(Math.floor(m / 60))}:00
            </Text>
          ))}
        </Box>

        {days.map((d) => {
          const daySlots = byDay.get(d.date) ?? [];
          return (
            <Box
              key={d.date}
              position="relative"
              h={`${totalH}px`}
              borderLeft="1px solid var(--admin-border, #e2e8f0)"
              bg={d.blocked ? "rgba(148,163,184,0.06)" : undefined}
              cursor={onEmptyClick ? "cell" : undefined}
              onClick={(e) => {
                if (!onEmptyClick) return;
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const y = e.clientY - rect.top;
                const min = startMin + Math.floor(y / pxPerMin / stepMinutes) * stepMinutes;
                onEmptyClick(d.date, `${pad(Math.floor(min / 60))}:${pad(min % 60)}`);
              }}
            >
              {/* linhas de hora */}
              {hourMarks.map((m) => (
                <Box
                  key={m}
                  position="absolute"
                  left={0}
                  right={0}
                  top={`${(m - startMin) * pxPerMin}px`}
                  borderTop="1px solid var(--admin-border, #e2e8f0)"
                  pointerEvents="none"
                />
              ))}
              {daySlots.map((s) => {
                const top = Math.max(0, (toMin(s.startTime) - startMin) * pxPerMin);
                const h = Math.max(rowHeight * 0.6, (toMin(s.endTime) - toMin(s.startTime)) * pxPerMin - 2);
                const st = AGENDA_STATUS_STYLES[s.status] ?? AGENDA_STATUS_STYLES.agendado;
                const selected = selectedId != null && selectedId === s.id;
                return (
                  <Box
                    key={s.id}
                    position="absolute"
                    left="3px"
                    right="3px"
                    top={`${top + 1}px`}
                    h={`${h}px`}
                    overflow="hidden"
                    borderRadius="md"
                    px={2}
                    py={1}
                    bg={st.bg}
                    color={st.color}
                    borderWidth="1px"
                    borderStyle="solid"
                    borderColor={selected ? "var(--admin-primary)" : st.border}
                    boxShadow={selected ? "0 0 0 2px var(--admin-primary)" : undefined}
                    borderLeftWidth={s.color ? "4px" : "1px"}
                    style={s.color ? { borderLeftColor: s.color } : undefined}
                    cursor={onSlotClick ? "pointer" : "default"}
                    title={`${s.startTime}–${s.endTime} · ${AGENDA_STATUS_LABELS[s.status]} · ${s.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotClick?.(s);
                    }}
                    _hover={onSlotClick ? { filter: "brightness(0.97)" } : undefined}
                  >
                    <HStack gap={1} justify="space-between" align="start">
                      <Text fontSize="11px" fontWeight="700" lineHeight="1.2" fontVariantNumeric="tabular-nums" whiteSpace="nowrap">
                        {s.startTime}
                      </Text>
                      {s.badge ? <Box fontSize="11px">{s.badge}</Box> : null}
                    </HStack>
                    <Text fontSize="xs" fontWeight="600" lineHeight="1.25" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                      {s.title}
                    </Text>
                    {s.subtitle && h >= rowHeight ? (
                      <Text fontSize="11px" opacity={0.85} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                        {s.subtitle}
                      </Text>
                    ) : null}
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/** Legenda dos status (pra colocar no rodapé/filtros da tela). */
export function AgendaGradeLegenda({ only }: { only?: AgendaGradeStatus[] }) {
  const keys = (only ?? (Object.keys(AGENDA_STATUS_LABELS) as AgendaGradeStatus[]));
  return (
    <HStack gap={3} flexWrap="wrap">
      {keys.map((k) => {
        const st = AGENDA_STATUS_STYLES[k];
        return (
          <HStack key={k} gap={1.5}>
            <Box w="12px" h="12px" borderRadius="sm" bg={st.bg} borderWidth="1px" borderStyle="solid" borderColor={st.border} />
            <Text fontSize="xs" color="var(--admin-muted, #64748b)">
              {AGENDA_STATUS_LABELS[k]}
            </Text>
          </HStack>
        );
      })}
    </HStack>
  );
}
