"use client";

import { Flex } from "../primitives";
import { chakra } from "../chakra-controls";
import { Field, Input, Badge } from "./controls";
import { Button } from "./Button";
import { useUiTextos } from "../provider/textos";

/**
 * A REGRA DO CAMPO DE COR — separada do desenho, porque é ela que tem teste.
 *
 * O `<input type="color">` só entende `#rrggbb`. Com valor nulo ou torto ele
 * mostraria PRETO — e quem está olhando acharia que apagou a cor, ou que
 * escolheu preto. Por isso o seletor recebe uma cor de espera quando o texto
 * não é um hex válido, e o campo de texto é quem mostra o que está gravado.
 */
export const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function hexValido(v: string | null | undefined): boolean {
  return !!v && HEX.test(v);
}

/**
 * O que o seletor nativo mostra. `nulavel` é o campo que aceita "sem cor =
 * padrão do sistema": aí a espera é cinza neutro, para não parecer escolha. No
 * campo obrigatório a espera é preto, que é o que o navegador faria — só que
 * agora de propósito e com o texto ao lado dizendo que está inválido.
 */
export function corDoSeletor(valor: string | null | undefined, nulavel: boolean): string {
  if (hexValido(valor)) return valor as string;
  return nulavel ? "#cccccc" : "#000000";
}

/**
 * Campo de cor que aceita VAZIO como "usa o padrão do sistema" (`nulavel`) — a
 * diferença para o `FormColor`, que sempre tem uma cor. É o que permite um tema
 * herdar do pai sem inventar um hex igual ao dele, que depois não acompanha
 * quando o padrão muda.
 */
export function CampoCor({
  label,
  valor,
  aoMudar,
  name,
  nulavel = false,
  desabilitado = false,
  hint,
}: {
  label: string;
  valor: string | null;
  aoMudar: (v: string | null) => void;
  name?: string;
  nulavel?: boolean;
  desabilitado?: boolean;
  hint?: string;
}) {
  const textos = useUiTextos();
  const valido = hexValido(valor);
  const invalido = !!valor && !valido;
  return (
    <Field.Root invalid={invalido}>
      <Field.Label>{label}</Field.Label>
      <Flex gap="2" align="center" w="full" wrap="wrap">
        <chakra.input
          type="color"
          value={corDoSeletor(valor, nulavel)}
          disabled={desabilitado}
          onChange={(e) => aoMudar(e.target.value)}
          w="10"
          h="9"
          p="0"
          border="0"
          bg="transparent"
          cursor={desabilitado ? "default" : "pointer"}
          flexShrink="0"
        />
        <Input
          size="sm"
          value={valor ?? ""}
          placeholder={nulavel ? textos.corPadrao : "#000000"}
          disabled={desabilitado}
          fontFamily="mono"
          maxW="36"
          onChange={(e) => {
            const v = e.target.value.trim();
            aoMudar(nulavel ? v || null : v);
          }}
        />
        {nulavel && valor !== null && !desabilitado && (
          <Button tone="ghost" size="xs" type="button" onClick={() => aoMudar(null)}>
            {textos.restaurarPadrao}
          </Button>
        )}
        {nulavel && valor === null && <Badge variant="subtle">{textos.corPadrao}</Badge>}
      </Flex>
      {name && <input type="hidden" name={name} value={valor ?? ""} />}
      {hint && <Field.HelperText>{hint}</Field.HelperText>}
    </Field.Root>
  );
}
