"use client";

import { useMemo, useState } from "react";
import { Box, chakra, Flex, HStack, Popover, Portal, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export type DateRangePreset = { value: string; label: string };

export type DateRangeValue = {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
};

export type DateRangeTextos = {
  selecione: string;
  personalizado: string;
  limpar: string;
  ate: string;
  escolhaFim: string;
  mesAnterior: string;
  proximoMes: string;
  meses: string[];
  diasCurtos: string[];
};

const TEXTOS_PADRAO: DateRangeTextos = {
  selecione: "Selecionar período",
  personalizado: "Personalizado",
  limpar: "Limpar",
  ate: "até",
  escolhaFim: "Escolha a data final",
  mesAnterior: "Mês anterior",
  proximoMes: "Próximo mês",
  meses: [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ],
  diasCurtos: ["D", "S", "T", "Q", "Q", "S", "S"],
};

type Partes = { y: number; m: number; d: number };

const pad2 = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

function partes(v?: string | null): Partes | null {
  const mt = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v ?? "");
  if (!mt) return null;
  return { y: Number(mt[1]), m: Number(mt[2]) - 1, d: Number(mt[3]) };
}

function hojePartes(): Partes {
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth(), d: n.getDate() };
}

function mesesDoLocale(locale: string): string[] {
  const f = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
  return Array.from({ length: 12 }, (_, m) => {
    const s = f.format(new Date(Date.UTC(2021, m, 1)));
    return s.charAt(0).toUpperCase() + s.slice(1);
  });
}

function diasDoLocale(locale: string): string[] {
  const f = new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" });
  return Array.from({ length: 7 }, (_, d) => f.format(new Date(Date.UTC(2021, 7, 1 + d))));
}

function formatador(locale?: string): (v?: string | null) => string {
  if (!locale) return (v) => {
    const p = partes(v);
    return p ? `${pad2(p.d)}/${pad2(p.m + 1)}/${p.y}` : "";
  };
  const f = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
  return (v) => {
    const p = partes(v);
    return p ? f.format(new Date(Date.UTC(p.y, p.m, p.d))) : "";
  };
}

function celulas(y: number, m: number): (number | null)[] {
  const primeiro = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const total = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const lista: (number | null)[] = Array.from({ length: primeiro }, () => null);
  for (let d = 1; d <= total; d += 1) lista.push(d);
  while (lista.length % 7 !== 0) lista.push(null);
  return lista;
}

function somarMes(v: { y: number; m: number }, passo: number): { y: number; m: number } {
  const total = v.y * 12 + v.m + passo;
  return { y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 };
}

export function DateRangePicker({
  value,
  presets = [],
  onChange,
  mode = "range",
  size = "sm",
  align = "end",
  min,
  max,
  colorPalette = "blue",
  textos,
  locale,
  disabled = false,
  rotulo,
}: {
  value: DateRangeValue;
  presets?: DateRangePreset[];
  onChange: (value: DateRangeValue) => void;
  mode?: "range" | "single";
  size?: "sm" | "md";
  align?: "start" | "end";
  min?: string;
  max?: string;
  colorPalette?: string;
  textos?: Partial<DateRangeTextos>;
  locale?: string;
  disabled?: boolean;
  rotulo?: string;
}) {
  const doLocale = useMemo<Partial<DateRangeTextos>>(
    () => (locale ? { meses: mesesDoLocale(locale), diasCurtos: diasDoLocale(locale) } : {}),
    [locale],
  );
  const formatar = useMemo(() => formatador(locale), [locale]);
  const t = { ...TEXTOS_PADRAO, ...doLocale, ...textos };
  const [open, setOpen] = useState(false);
  const [vista, setVista] = useState<{ y: number; m: number }>(() => {
    const p = partes(value.from) ?? { y: 2000, m: 0, d: 1 };
    return { y: p.y, m: p.m };
  });
  const [rascunho, setRascunho] = useState<{ from: string | null; to: string | null }>({
    from: value.from ?? null,
    to: value.to ?? null,
  });
  const [sobre, setSobre] = useState<string | null>(null);

  const alturaGatilho = size === "md" ? "40px" : "34px";
  const presetAtivo = presets.find((p) => p.value === value.preset) ?? null;

  const rotuloGatilho = presetAtivo
    ? presetAtivo.label
    : value.from && value.to
      ? `${formatar(value.from)} — ${formatar(value.to)}`
      : value.from
        ? formatar(value.from)
        : t.selecione;

  const abrir = (proximo: boolean) => {
    if (proximo) {
      const base = partes(value.from) ?? partes(value.to) ?? hojePartes();
      setVista({ y: base.y, m: base.m });
      setRascunho({ from: value.from ?? null, to: value.to ?? null });
      setSobre(null);
    }
    setOpen(proximo);
  };

  const escolherPreset = (p: DateRangePreset) => {
    setOpen(false);
    onChange({ preset: p.value, from: null, to: null });
  };

  const limpar = () => {
    setRascunho({ from: null, to: null });
    setSobre(null);
    setOpen(false);
    onChange({ preset: null, from: null, to: null });
  };

  const clicarDia = (dia: string) => {
    if (mode === "single") {
      setRascunho({ from: dia, to: null });
      setOpen(false);
      onChange({ preset: null, from: dia, to: null });
      return;
    }
    if (!rascunho.from || rascunho.to) {
      setRascunho({ from: dia, to: null });
      setSobre(null);
      return;
    }
    const from = dia < rascunho.from ? dia : rascunho.from;
    const to = dia < rascunho.from ? rascunho.from : dia;
    setRascunho({ from, to });
    setOpen(false);
    onChange({ preset: null, from, to });
  };

  const hoje = iso(hojePartes().y, hojePartes().m, hojePartes().d);
  const fimVisual = rascunho.to ?? (rascunho.from && sobre && sobre > rascunho.from ? sobre : null);

  const dias = celulas(vista.y, vista.m);
  const emProgresso = mode === "range" && !!rascunho.from && !rascunho.to;
  const temSelecao = !!value.preset || !!value.from;

  return (
    <Popover.Root
      open={open}
      onOpenChange={(e) => abrir(e.open)}
      positioning={{ placement: align === "end" ? "bottom-end" : "bottom-start" }}
    >
      <Popover.Trigger asChild>
        <chakra.button
          type="button"
          disabled={disabled}
          aria-label={rotulo ?? t.selecione}
          display="inline-flex"
          alignItems="center"
          justifyContent="space-between"
          gap="2"
          h={alturaGatilho}
          px="3"
          maxW="100%"
          borderWidth="1px"
          borderColor="border"
          borderRadius="lg"
          bg="bg.panel"
          color="fg"
          fontSize="sm"
          fontWeight="medium"
          cursor={disabled ? "not-allowed" : "pointer"}
          opacity={disabled ? 0.5 : 1}
          whiteSpace="nowrap"
          _hover={disabled ? undefined : { bg: "bg.subtle", borderColor: `${colorPalette}.solid` }}
        >
          <HStack gap="2" minW="0">
            <Box color={`${colorPalette}.fg`} flexShrink="0" display="inline-flex">
              <Calendar size={size === "md" ? 16 : 14} />
            </Box>
            <Text lineClamp={1}>{rotuloGatilho}</Text>
          </HStack>
          <Box color="fg.muted" flexShrink="0" display="inline-flex">
            <ChevronDown size={14} />
          </Box>
        </chakra.button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            w="auto"
            maxW="min(94vw, 460px)"
            borderRadius="xl"
            colorPalette={colorPalette}
          >
            <Flex direction={{ base: "column", sm: presets.length ? "row" : "column" }} align="stretch">
              {presets.length ? (
                <Stack
                  gap="1"
                  p="2"
                  minW={{ base: "auto", sm: "140px" }}
                  borderBottomWidth={{ base: "1px", sm: "0" }}
                  borderRightWidth={{ base: "0", sm: "1px" }}
                  borderColor="border"
                >
                  <Flex direction={{ base: "row", sm: "column" }} wrap="wrap" gap="1">
                    {presets.map((p) => {
                      const ativo = p.value === value.preset;
                      return (
                        <chakra.button
                          type="button"
                          key={p.value}
                          onClick={() => escolherPreset(p)}
                          textAlign={{ base: "center", sm: "left" }}
                          px="2.5"
                          py="1.5"
                          borderRadius="md"
                          fontSize="sm"
                          fontWeight={ativo ? "semibold" : "medium"}
                          whiteSpace="nowrap"
                          bg={ativo ? `${colorPalette}.solid` : "transparent"}
                          color={ativo ? `${colorPalette}.contrast` : "fg"}
                          cursor="pointer"
                          _hover={ativo ? undefined : { bg: "bg.subtle" }}
                        >
                          {p.label}
                        </chakra.button>
                      );
                    })}
                  </Flex>
                </Stack>
              ) : null}

              <Stack gap="2" p="3" minW="252px">
                <HStack justify="space-between">
                  <chakra.button
                    type="button"
                    aria-label={t.mesAnterior}
                    onClick={() => setVista((v) => somarMes(v, -1))}
                    display="inline-flex"
                    p="1"
                    borderRadius="md"
                    color="fg.muted"
                    cursor="pointer"
                    _hover={{ bg: "bg.subtle", color: "fg" }}
                  >
                    <ChevronLeft size={16} />
                  </chakra.button>
                  <Text fontSize="sm" fontWeight="semibold">
                    {t.meses[vista.m]} {vista.y}
                  </Text>
                  <chakra.button
                    type="button"
                    aria-label={t.proximoMes}
                    onClick={() => setVista((v) => somarMes(v, 1))}
                    display="inline-flex"
                    p="1"
                    borderRadius="md"
                    color="fg.muted"
                    cursor="pointer"
                    _hover={{ bg: "bg.subtle", color: "fg" }}
                  >
                    <ChevronRight size={16} />
                  </chakra.button>
                </HStack>

                <SimpleGrid columns={7} gap="0">
                  {t.diasCurtos.map((d, i) => (
                    <Text
                      key={`${d}-${i}`}
                      textAlign="center"
                      fontSize="10px"
                      fontWeight="bold"
                      color="fg.muted"
                      textTransform="uppercase"
                      py="1"
                    >
                      {d}
                    </Text>
                  ))}
                  {dias.map((d, i) => {
                    if (d == null) return <Box key={`v-${i}`} h="32px" />;
                    const chave = iso(vista.y, vista.m, d);
                    const fora = (min && chave < min) || (max && chave > max);
                    const inicio = chave === rascunho.from;
                    const fim = chave === fimVisual;
                    const dentro =
                      !!rascunho.from && !!fimVisual && chave > rascunho.from && chave < fimVisual;
                    const marcado = inicio || fim;
                    return (
                      <chakra.button
                        key={chave}
                        type="button"
                        disabled={!!fora}
                        onClick={() => {
                          if (!fora) clicarDia(chave);
                        }}
                        onMouseEnter={() => setSobre(chave)}
                        h="32px"
                        fontSize="sm"
                        fontWeight={marcado ? "bold" : "medium"}
                        lineHeight="32px"
                        textAlign="center"
                        bg={marcado ? `${colorPalette}.solid` : dentro ? `${colorPalette}.subtle` : "transparent"}
                        color={marcado ? `${colorPalette}.contrast` : fora ? "fg.subtle" : "fg"}
                        borderWidth="1px"
                        borderColor={!marcado && chave === hoje ? `${colorPalette}.solid` : "transparent"}
                        borderTopLeftRadius={inicio || !dentro ? "md" : "0"}
                        borderBottomLeftRadius={inicio || !dentro ? "md" : "0"}
                        borderTopRightRadius={fim || !dentro ? "md" : "0"}
                        borderBottomRightRadius={fim || !dentro ? "md" : "0"}
                        opacity={fora ? 0.4 : 1}
                        cursor={fora ? "not-allowed" : "pointer"}
                        _hover={fora || marcado ? undefined : { bg: "bg.subtle" }}
                      >
                        {d}
                      </chakra.button>
                    );
                  })}
                </SimpleGrid>

                <HStack justify="space-between" gap="2" pt="1" borderTopWidth="1px" borderColor="border">
                  <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                    {emProgresso
                      ? t.escolhaFim
                      : value.from && value.to
                        ? `${formatar(value.from)} ${t.ate} ${formatar(value.to)}`
                        : value.from
                          ? formatar(value.from)
                          : (presetAtivo?.label ?? t.personalizado)}
                  </Text>
                  {temSelecao || rascunho.from ? (
                    <chakra.button
                      type="button"
                      onClick={limpar}
                      px="2"
                      py="1"
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight="semibold"
                      color={`${colorPalette}.fg`}
                      cursor="pointer"
                      flexShrink="0"
                      _hover={{ bg: "bg.subtle" }}
                    >
                      {t.limpar}
                    </chakra.button>
                  ) : null}
                </HStack>
              </Stack>
            </Flex>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
