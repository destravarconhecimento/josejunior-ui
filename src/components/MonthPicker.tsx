"use client";

import { useEffect, useState } from "react";
import { Box, HStack, Popover, Portal, SimpleGrid, Text } from "@chakra-ui/react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const MES_ABBR = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MES_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const pad2 = (n: number) => String(n).padStart(2, "0");

function parse(v: string): [number, number] {
  const m = /^(\d{4})-(\d{2})/.exec(v || "");
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
}

/**
 * Seletor de mês/ano padrão do painel: gatilho compacto ("Junho 2026") + popover
 * com navegação de ano e grade dos 12 meses. Marca o MÊS ATUAL (contorno) e os
 * meses COM DADOS (`withData`, ponto). Controlado por `value` ("YYYY-MM").
 */
export function MonthPicker({
  value,
  onChange,
  withData = [],
  minYear,
  maxYear,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Meses (YYYY-MM) que têm dados — recebem um ponto indicador. */
  withData?: string[];
  minYear?: number;
  maxYear?: number;
}) {
  const [open, setOpen] = useState(false);
  const [selYear, selMonth] = parse(value);
  const now = new Date();
  const [viewYear, setViewYear] = useState(selYear || now.getUTCFullYear());

  // Ao abrir, posiciona no ano do mês selecionado.
  useEffect(() => {
    if (open && selYear) setViewYear(selYear);
  }, [open, selYear]);

  const curKey = `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}`;
  const data = new Set(withData);
  const dataYears = withData.map((k) => parse(k)[0]).filter(Boolean);
  const loYear = minYear ?? Math.min(now.getUTCFullYear() - 2, ...(dataYears.length ? dataYears : [now.getUTCFullYear()]));
  const hiYear = maxYear ?? Math.max(now.getUTCFullYear() + 1, ...(dataYears.length ? dataYears : [now.getUTCFullYear()]));

  const label = value && selMonth ? `${MES_FULL[selMonth - 1]} ${selYear}` : "Selecionar mês";

  const pick = (monthIndex: number) => {
    onChange(`${viewYear}-${pad2(monthIndex + 1)}`);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={(e) => setOpen(e.open)} positioning={{ placement: "bottom-end" }}>
      <Popover.Trigger asChild>
        <HStack
          as="button"
          aria-label="Selecionar mês"
          gap={2}
          h="40px"
          px={3}
          minW="170px"
          justify="space-between"
          borderWidth="1px"
          borderColor="var(--admin-border)"
          borderRadius="10px"
          bg="var(--admin-surface)"
          _hover={{ borderColor: "var(--admin-primary)" }}
        >
          <HStack gap={2} minW={0}>
            <Box color="var(--admin-primary)" flexShrink={0}><Calendar size={16} /></Box>
            <Text fontSize="sm" fontWeight={600} lineClamp={1}>{label}</Text>
          </HStack>
          <ChevronDown size={15} />
        </HStack>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content className="admin-dropdown" w="288px" p={3} borderRadius="14px">
            <HStack justify="space-between" mb={3}>
              <Box
                as="button"
                aria-label="Ano anterior"
                onClick={() => setViewYear((y) => Math.max(loYear, y - 1))}
                p={1}
                borderRadius="8px"
                color="var(--admin-text-soft)"
                opacity={viewYear <= loYear ? 0.35 : 1}
                cursor={viewYear <= loYear ? "default" : "pointer"}
                _hover={{ bg: "var(--admin-nav-hover)" }}
              >
                <ChevronLeft size={18} />
              </Box>
              <Text fontWeight={800} fontSize="md" color="var(--admin-primary)">{viewYear}</Text>
              <Box
                as="button"
                aria-label="Próximo ano"
                onClick={() => setViewYear((y) => Math.min(hiYear, y + 1))}
                p={1}
                borderRadius="8px"
                color="var(--admin-text-soft)"
                opacity={viewYear >= hiYear ? 0.35 : 1}
                cursor={viewYear >= hiYear ? "default" : "pointer"}
                _hover={{ bg: "var(--admin-nav-hover)" }}
              >
                <ChevronRight size={18} />
              </Box>
            </HStack>

            <SimpleGrid columns={3} gap={2}>
              {MES_ABBR.map((mes, i) => {
                const key = `${viewYear}-${pad2(i + 1)}`;
                const selected = key === value;
                const isCurrent = key === curKey;
                const hasData = data.has(key);
                return (
                  <Box
                    as="button"
                    key={key}
                    onClick={() => pick(i)}
                    position="relative"
                    py={2}
                    borderRadius="10px"
                    fontSize="sm"
                    fontWeight={600}
                    bg={selected ? "var(--admin-primary)" : "transparent"}
                    color={selected ? "white" : "var(--admin-text)"}
                    borderWidth="1px"
                    borderColor={selected ? "var(--admin-primary)" : isCurrent ? "var(--admin-primary)" : "transparent"}
                    _hover={{ bg: selected ? "var(--admin-primary)" : "var(--admin-nav-hover)" }}
                  >
                    {mes}
                    {hasData && !selected ? (
                      <Box position="absolute" bottom="5px" left="50%" transform="translateX(-50%)" w="4px" h="4px" borderRadius="full" bg="var(--admin-primary)" />
                    ) : null}
                  </Box>
                );
              })}
            </SimpleGrid>

            <Box
              as="button"
              onClick={() => { onChange(curKey); setOpen(false); }}
              mt={3}
              w="full"
              py={1.5}
              borderRadius="8px"
              fontSize="xs"
              fontWeight={600}
              color="var(--admin-primary)"
              _hover={{ bg: "var(--admin-nav-hover)" }}
            >
              Ir para o mês atual
            </Box>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
