"use client";

import { Plus, Trash2 } from "lucide-react";
import { Flex, Stack, Text } from "../primitives";
import { Field, Input } from "./controls";
import { Button } from "./Button";
import { useUiTextos } from "../provider/textos";

/**
 * Mini-grade EDITÁVEL dentro de um formulário: as faixas de frete, os horários
 * de um dia, as parcelas de um plano. Um punhado de linhas curtas que nascem e
 * morrem junto com o formulário em volta.
 *
 * Não é a `DataTable`: aquela mostra dados que já existem, com busca, ordem e
 * filtro. Aqui o assunto é DIGITAR — e por isso o cabeçalho some no celular
 * (cada campo já tem `aria-label`), as linhas quebram, e o "remover" respeita
 * um `minimo` para a grade nunca ficar vazia por acidente.
 */
export type ColunaEditavel = {
  chave: string;
  rotulo: string;
  tipo?: "text" | "number";
  placeholder?: string;
  largura?: string;
  min?: number;
};

export function LinhasEditaveis<T extends { id: string }>({
  rotulo,
  linhas,
  colunas,
  valor,
  aoMudar,
  aoAdicionar,
  aoRemover,
  minimo = 1,
  rotuloAdicionar,
  rotuloRemover,
  testIdPrefix,
  testIdAdicionar,
}: {
  rotulo: string;
  linhas: T[];
  colunas: ColunaEditavel[];
  valor: (linha: T, chave: string) => string;
  aoMudar: (id: string, chave: string, valor: string) => void;
  aoAdicionar: () => void;
  aoRemover: (id: string) => void;
  minimo?: number;
  rotuloAdicionar?: string;
  rotuloRemover?: string;
  testIdPrefix?: string;
  testIdAdicionar?: string;
}) {
  const textos = useUiTextos();
  return (
    <Field.Root>
      <Field.Label>{rotulo}</Field.Label>
      <Stack gap="2" w="full">
        <Flex gap="2" display={{ base: "none", sm: "flex" }}>
          {colunas.map((c) => (
            <Text
              key={c.chave}
              fontSize="xs"
              color="fg.muted"
              flex={c.largura ? `0 0 ${c.largura}` : "1"}
            >
              {c.rotulo}
            </Text>
          ))}
          <Flex flex="0 0 2.25rem" />
        </Flex>
        {linhas.map((l) => (
          <Flex key={l.id} gap="2" align="center" wrap={{ base: "wrap", sm: "nowrap" }}>
            {colunas.map((c) => (
              <Input
                key={c.chave}
                size="sm"
                type={c.tipo ?? "text"}
                inputMode={c.tipo === "number" ? "numeric" : undefined}
                min={c.min}
                placeholder={c.placeholder}
                aria-label={c.rotulo}
                value={valor(l, c.chave)}
                onChange={(e) => aoMudar(l.id, c.chave, e.target.value)}
                data-testid={testIdPrefix ? `${testIdPrefix}-${c.chave}` : undefined}
                flex={c.largura ? `0 0 ${c.largura}` : "1 1 8rem"}
              />
            ))}
            <Button
              tone="ghost"
              size="sm"
              type="button"
              onClick={() => aoRemover(l.id)}
              disabled={linhas.length <= minimo}
            >
              <Trash2 />
              {rotuloRemover ?? textos.remover}
            </Button>
          </Flex>
        ))}
        <Flex>
          <Button
            tone="outline"
            size="sm"
            type="button"
            onClick={aoAdicionar}
            data-testid={testIdAdicionar}
          >
            <Plus />
            {rotuloAdicionar ?? textos.adicionar}
          </Button>
        </Flex>
      </Stack>
    </Field.Root>
  );
}
