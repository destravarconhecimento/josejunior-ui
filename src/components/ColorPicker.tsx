"use client";

import { Box, chakra, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { Check, Wand2 } from "lucide-react";

const lc = (c: string) => c.trim().toLowerCase();
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Estilo em degradê selecionável (ex.: "rasta") — o `id` vira o `value`. */
export type ColorScheme = { id: string; label: string; gradient: string };

/**
 * Seletor de cor "inteligente": grade de swatches pré-definidos. A cor atual fica
 * com anel + check; as cores já EM USO por outras pessoas (`usedColors`) ficam
 * marcadas com um ponto (ainda selecionáveis). Botão "Automática" escolhe a 1ª
 * cor livre. Opcional: input nativo p/ uma cor custom (hex arbitrário).
 */
export function ColorPicker({
  value,
  onChange,
  colors,
  usedColors = [],
  columns = 10,
  allowCustom = true,
  schemes,
}: {
  value: string;
  onChange: (hex: string) => void;
  colors: readonly string[];
  /** Cores já usadas por OUTROS (marca com ponto pra evitar repetir). */
  usedColors?: string[];
  columns?: number;
  allowCustom?: boolean;
  /** Estilos em degradê ("rasta" etc.) — mostrados numa fileira acima da grade. */
  schemes?: readonly ColorScheme[];
}) {
  const used = new Set(usedColors.map(lc));
  const selected = lc(value);
  const inPalette = colors.some((c) => lc(c) === selected);
  const selectedScheme = schemes?.find((s) => lc(s.id) === selected) ?? null;
  const safeHex = HEX.test(value) ? value : "#6366f1";

  const pickAuto = () => {
    const free = colors.find((c) => !used.has(lc(c)) && lc(c) !== selected);
    onChange(free ?? colors[0]);
  };

  return (
    <Box>
      {schemes && schemes.length ? (
        <Box mb={3}>
          <Text fontSize="10px" fontWeight="700" textTransform="uppercase" letterSpacing="0.08em" color="var(--admin-text-soft)" mb={1.5}>
            Estilos
          </Text>
          <HStack gap={1.5} flexWrap="wrap">
            {schemes.map((sch) => {
              const isSel = lc(sch.id) === selected;
              return (
                <chakra.button
                  key={sch.id}
                  type="button"
                  aria-label={`Estilo ${sch.label}`}
                  title={sch.label}
                  onClick={() => onChange(sch.id)}
                  position="relative"
                  w="26px"
                  h="26px"
                  borderRadius="8px"
                  cursor="pointer"
                  style={{ backgroundImage: sch.gradient }}
                  boxShadow={
                    isSel
                      ? "0 0 0 2px var(--admin-surface), 0 0 0 4px var(--admin-primary)"
                      : "inset 0 0 0 1px rgba(0,0,0,0.08)"
                  }
                  transition="transform .08s ease"
                  _hover={{ transform: "scale(1.12)" }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {isSel ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
                </chakra.button>
              );
            })}
          </HStack>
        </Box>
      ) : null}

      <SimpleGrid columns={columns} gap={1.5}>
        {colors.map((c) => {
          const isSel = lc(c) === selected;
          const isUsed = used.has(lc(c)) && !isSel;
          return (
            <chakra.button
              key={c}
              type="button"
              aria-label={`Cor ${c}${isUsed ? " (em uso)" : ""}`}
              title={isUsed ? `${c} — já em uso` : c}
              onClick={() => onChange(c)}
              position="relative"
              w="26px"
              h="26px"
              borderRadius="8px"
              bg={c}
              cursor="pointer"
              opacity={isUsed ? 0.55 : 1}
              boxShadow={
                isSel
                  ? `0 0 0 2px var(--admin-surface), 0 0 0 4px ${c}`
                  : "inset 0 0 0 1px rgba(0,0,0,0.08)"
              }
              transition="transform .08s ease, opacity .12s ease"
              _hover={{ transform: "scale(1.12)", opacity: 1 }}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {isSel ? <Check size={14} color="#fff" strokeWidth={3} /> : null}
              {isUsed ? (
                <Box
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg="var(--admin-text-soft)"
                  border="1.5px solid var(--admin-surface)"
                />
              ) : null}
            </chakra.button>
          );
        })}
      </SimpleGrid>

      <HStack mt={3} gap={3} flexWrap="wrap">
        <chakra.button
          type="button"
          onClick={pickAuto}
          display="inline-flex"
          alignItems="center"
          gap={1.5}
          fontSize="sm"
          fontWeight="600"
          color="var(--admin-primary)"
          cursor="pointer"
          _hover={{ textDecoration: "underline" }}
        >
          <Wand2 size={14} /> Automática
        </chakra.button>

        <HStack gap={2} align="center">
          <Box
            w="18px"
            h="18px"
            borderRadius="6px"
            bg={selectedScheme ? undefined : value}
            style={selectedScheme ? { backgroundImage: selectedScheme.gradient } : undefined}
            boxShadow="inset 0 0 0 1px rgba(0,0,0,0.12)"
          />
          <Text fontFamily={selectedScheme ? undefined : "mono"} fontSize="xs" color="var(--admin-text-soft)">
            {selectedScheme ? selectedScheme.label : value}
            {!inPalette && !selectedScheme ? " · custom" : ""}
          </Text>
        </HStack>

        {allowCustom ? (
          <Box as="label" display="inline-flex" alignItems="center" gap={1.5} cursor="pointer">
            <input
              type="color"
              value={safeHex}
              onChange={(e) => onChange(e.target.value)}
              aria-label="Cor personalizada"
              style={{ width: 26, height: 26, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
            />
            <Text fontSize="xs" color="var(--admin-text-soft)">
              outra…
            </Text>
          </Box>
        ) : null}
      </HStack>
    </Box>
  );
}
