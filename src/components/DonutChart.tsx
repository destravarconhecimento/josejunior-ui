import { Box, Text, VStack } from "@chakra-ui/react";

export type DonutItem = { label: string; value: number; color: string };

/**
 * Donut chart em SVG puro (sem dependência). Anel com segmentos coloridos e
 * rótulo central. A legenda fica por conta do consumidor (mais flexível).
 */
export function DonutChart({
  items,
  size = 168,
  thickness = 20,
  centerTop,
  centerBottom,
}: {
  items: DonutItem[];
  size?: number;
  thickness?: number;
  centerTop?: string;
  centerBottom?: string;
}) {
  const total = items.reduce((s, i) => s + Math.max(0, i.value), 0) || 1;
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`} flexShrink={0}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--admin-divider)"
          strokeWidth={thickness}
          opacity={0.5}
        />
        {items.map((it, i) => {
          const frac = Math.max(0, it.value) / total;
          const dash = frac * circ;
          const seg = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={it.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return seg;
        })}
      </svg>
      {centerTop || centerBottom ? (
        <VStack position="absolute" top={0} left={0} right={0} bottom={0} justify="center" gap={0}>
          {centerTop ? (
            <Text fontSize="xs" color="var(--admin-text-soft)" fontWeight="600">
              {centerTop}
            </Text>
          ) : null}
          {centerBottom ? (
            <Text
              fontSize="2xl"
              fontWeight="800"
              color="var(--admin-text)"
              fontFamily="var(--admin-font-heading)"
              lineHeight="1"
            >
              {centerBottom}
            </Text>
          ) : null}
        </VStack>
      ) : null}
    </Box>
  );
}
