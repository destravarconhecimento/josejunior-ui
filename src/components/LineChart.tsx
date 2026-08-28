"use client";

import { useMemo, useState } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";

export type LineSeries = { key: string; label: string; color: string; points: number[] };

/** Teto de rótulos no eixo X — acima disso eles se atropelam e vazam do card. */
const MAX_LABELS = 8;

/**
 * Gráfico de linha em SVG puro (sem dependência), responsivo. Toggle de séries
 * (chips) — mostra uma série por vez com área degradê. Strokes usam
 * vector-effect non-scaling-stroke pra ficarem nítidos em qualquer largura.
 */
export function LineChart({
  series,
  labels,
  height = 240,
}: {
  series: LineSeries[];
  labels: string[];
  height?: number;
}) {
  const [active, setActive] = useState(series[0]?.key ?? "");
  const s = series.find((x) => x.key === active) ?? series[0];

  const W = 600;
  const H = 200;
  const pad = { l: 6, r: 6, t: 14, b: 8 };
  const n = Math.max(1, labels.length);
  const max = useMemo(
    () => Math.max(1, ...series.flatMap((x) => x.points)),
    [series],
  );

  const px = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / Math.max(1, n - 1);
  const py = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);

  const pts = s?.points ?? [];
  const linePath = pts.map((v, i) => `${i === 0 ? "M" : "L"} ${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(" ");
  const areaPath = pts.length
    ? `${linePath} L ${px(pts.length - 1).toFixed(1)} ${H - pad.b} L ${px(0).toFixed(1)} ${H - pad.b} Z`
    : "";
  const gradId = `lc-${s?.key ?? "x"}`;
  const color = s?.color ?? "var(--admin-primary)";

  return (
    <Box>
      {series.length > 1 ? (
        <HStack gap={2} mb={3} flexWrap="wrap">
          {series.map((x) => {
            const on = x.key === active;
            return (
              <HStack
                as="button"
                key={x.key}
                onClick={() => setActive(x.key)}
                gap={1.5}
                px={2.5}
                py={1}
                borderRadius="full"
                fontSize="xs"
                fontWeight="600"
                bg={on ? "var(--admin-nav-active)" : "transparent"}
                color={on ? "var(--admin-primary)" : "var(--admin-text-soft)"}
                _hover={{ bg: "var(--admin-nav-hover)" }}
              >
                <Box w="8px" h="8px" borderRadius="full" bg={x.color} />
                {x.label}
              </HStack>
            );
          })}
        </HStack>
      ) : null}

      <Box position="relative" w="full" h={`${height}px`}>
        <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* gridlines horizontais */}
          {[0, 0.25, 0.5, 0.75, 1].map((g) => (
            <line
              key={g}
              x1={pad.l}
              x2={W - pad.r}
              y1={pad.t + g * (H - pad.t - pad.b)}
              y2={pad.t + g * (H - pad.t - pad.b)}
              stroke="var(--admin-divider)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              opacity="0.6"
            />
          ))}
          {areaPath ? <path d={areaPath} fill={`url(#${gradId})`} /> : null}
          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
      </Box>

      {/* Rótulos do eixo X: no máximo ~8, cada um preso ao ponto que representa.
          Imprimir todos (30 dias) estourava a largura do card e fazia a página
          rolar na horizontal — a lista de dias não pode ditar a largura. */}
      <Box position="relative" h="14px" mt={2} overflow="hidden">
        {labels.map((l, i) => {
          const step = Math.max(1, Math.ceil(n / MAX_LABELS));
          const ultimo = i === n - 1;
          // O último dia sempre aparece; o rótulo de grade que ficaria colado nele sai.
          if (!ultimo && (i % step !== 0 || n - 1 - i < step / 2)) return null;
          const x = n > 1 ? (i / (n - 1)) * 100 : 0;
          const transform = i === 0 ? "none" : ultimo ? "translateX(-100%)" : "translateX(-50%)";
          return (
            <Text key={i} as="span" position="absolute" left={`${x}%`} top={0} transform={transform} fontSize="10px" color="var(--admin-text-soft)" whiteSpace="nowrap" lineHeight="14px">
              {l}
            </Text>
          );
        })}
      </Box>
    </Box>
  );
}
