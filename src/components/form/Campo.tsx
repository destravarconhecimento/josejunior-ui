"use client";

import { useState, type ReactNode } from "react";
import { Stack } from "../../primitives";
import { Checkbox } from "../../chakra-controls";
import { Field, Input, NativeSelect, Switch, Textarea } from "../controls";
import { SearchSelect } from "../SearchSelect";
import { MaskedInput } from "../MaskedInput";
import { CampoArquivo } from "../CampoArquivo";
import { CampoCor } from "../CampoCor";
import { CampoNumero } from "../CampoNumero";
import { CampoMarcacao, CampoOpcoes } from "../CampoOpcoes";
import { CampoSegredo } from "../CampoSegredo";
import { useUiMascaras } from "../../provider/textos";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * O CAMPO É DADO, NÃO DESENHO
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `<Campo>` é a porta ÚNICA de campo do painel: a tela declara `{ name, label,
 * type }` e o kit escolhe o controle. É o que permite a MESMA lista de campos
 * servir o formulário da página e o do diálogo sem ser reescrita — e é o que
 * faz "select com busca" ser um `type`, não um componente à parte.
 *
 * Duas regras que nasceram de estrago real:
 *
 * · **Campo sem `name` e sem rótulo é defeito, não gabarito.** Um migrador
 *   trocou quatro seletores por `{ name: "", label: "", type: "text" }` e o que
 *   foi para produção foi uma caixa de texto sem nome: quatro formulários
 *   enviando POST sem o id do produto. Nem tsc nem lint viram, porque o
 *   gabarito é válido. Quem migra tem de FALHAR, nunca preencher com vazio.
 * · **Lista longa vira busca sozinha** (acima de 8 opções): o select nativo com
 *   200 itens é uma parede, e ninguém lembra de ligar `searchable` em cada uma.
 */
export type AtributosNativos = Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  "maxLength" | "inputMode" | "min" | "max" | "readOnly" | "autoComplete" | "accept" | "id" | "pattern"
> & { rows?: number };

export type CampoSpec = {
  name: string;
  label: string;
  /**
   * Além dos tipos nativos: `select` (vira busca acima de 8 opções), `textarea`,
   * `checkbox`/`switch`, `file`, `cor`, `segredo`, `opcoes`, `numero`, `livre`
   * (só a moldura, o controle vem por `children`) — e o nome de uma MÁSCARA
   * registrada no provider (`cpf`, `cnpj`, `cep`, `phone`).
   */
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "select"
    | "textarea"
    | "date"
    | "url"
    | "range"
    | "datetime-local"
    | "month"
    | "checkbox"
    | "switch"
    | "file"
    | "cor"
    | "segredo"
    | "opcoes"
    | "numero"
    | "livre"
    | (string & {});
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  step?: string;
  options?: { value: string; label: string }[];
  colSpan?: 1 | 2;
  hint?: string;
  /** Força a busca mesmo com poucas opções. */
  searchable?: boolean;
  /** Força o select NATIVO mesmo com muitas opções (lista curta e fixa). */
  nativo?: boolean;
  /** Select com a opção "outro" que abre um campo numérico. */
  otherNumber?: { label: string; min: number; max: number };
  testId?: string;
  atributos?: AtributosNativos;
  ariaLabel?: string;
  /** `id` do `<form>` quando o controle mora fora dele. */
  form?: string;
  multiplo?: boolean;
  nulavel?: boolean;
  sufixo?: string;
  min?: number;
  max?: number;
  passo?: number | "any";
  larguraMax?: string;
  w?: string;
  minW?: string;
  flex?: string;
};

const OUTRO = "__outro__";

function SelectComOutroNumero({
  name,
  options,
  defaultValue,
  other,
}: {
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  other: { label: string; min: number; max: number };
}) {
  const [sel, setSel] = useState(() =>
    options.some((o) => o.value === (defaultValue ?? "")) ? (defaultValue ?? "") : OUTRO,
  );
  return (
    <Stack gap="1.5" w="full">
      <NativeSelect.Root>
        <NativeSelect.Field value={sel} onChange={(e) => setSel(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value={OUTRO}>{other.label}</option>
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
      {sel === OUTRO ? (
        <Input name={name} type="number" min={other.min} max={other.max} defaultValue={defaultValue} required />
      ) : (
        <input type="hidden" name={name} value={sel} />
      )}
    </Stack>
  );
}

function SelectBuscavel({
  name,
  options,
  defaultValue,
  value,
  onValueChange,
  placeholder,
  disabled,
  testId,
}: {
  name?: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
}) {
  const [interno, setInterno] = useState(defaultValue ?? "");
  const atual = value ?? interno;
  return (
    <>
      {/* o valor vai no envio por aqui: o combo é busca, não campo de form */}
      <input type="hidden" name={name} value={atual} />
      <SearchSelect
        value={atual}
        onChange={(v) => {
          setInterno(v);
          onValueChange?.(v);
        }}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
        clearable
        testId={testId}
      />
    </>
  );
}

function CampoDeCor({
  f,
  valor,
  aoMudar,
  desabilitado,
}: {
  f: CampoSpec;
  valor?: string;
  aoMudar?: (v: string) => void;
  desabilitado: boolean;
}) {
  // Sem `aoMudar` o campo é NÃO controlado (o padrão num form de POST): guarda o
  // próprio valor e entrega no `name`, como qualquer input.
  const [interno, setInterno] = useState<string | null>(f.defaultValue ?? null);
  const controlado = aoMudar != null;
  const atual = controlado ? (valor ?? null) : interno;
  return (
    <CampoCor
      label={f.label}
      valor={atual}
      aoMudar={(v) => {
        if (controlado) aoMudar?.(v ?? "");
        else setInterno(v);
      }}
      name={f.name}
      nulavel={f.nulavel}
      desabilitado={desabilitado}
      hint={f.hint}
    />
  );
}

export function Campo({
  campo: f,
  valor,
  aoMudar,
  erro,
  desabilitado = false,
  size,
  children,
  aoMudarArquivos,
}: {
  campo: CampoSpec;
  valor?: string;
  aoMudar?: (valor: string) => void;
  erro?: string;
  desabilitado?: boolean;
  size?: "xs" | "sm" | "md";
  children?: ReactNode;
  aoMudarArquivos?: (arquivos: File[]) => void;
}) {
  const mascaras = useUiMascaras();
  const controlado = aoMudar != null;
  const testId = f.testId ?? `campo-${f.name}`;
  const { rows, ...nativos } = f.atributos ?? {};
  const comum = {
    name: f.name,
    disabled: desabilitado,
    "aria-label": f.ariaLabel,
    form: f.form,
    "data-testid": testId,
    ...(controlado ? { value: valor ?? "" } : { defaultValue: f.defaultValue }),
  };

  if (f.type === "livre") {
    // O campo livre e' o unico que embrulha conteudo de fora, e por isso e o
    // que mais aparece ocupando duas colunas da grade. Sem repassar `colSpan` e
    // as larguras, quem precisasse disso voltaria a escrever o Field.Root na
    // tela — que e de onde este componente veio.
    return (
      <Field.Root
        invalid={!!erro}
        required={f.required}
        gridColumn={{ base: "auto", sm: f.colSpan === 2 ? "span 2" : "auto" }}
        w={f.w}
        minW={f.minW}
        maxW={f.larguraMax}
        flex={f.flex}
      >
        <Field.Label>{f.label}</Field.Label>
        {children}
        {f.hint && !erro && <Field.HelperText>{f.hint}</Field.HelperText>}
        {erro && <Field.ErrorText>{erro}</Field.ErrorText>}
      </Field.Root>
    );
  }
  if (f.type === "segredo") {
    return <CampoSegredo label={f.label} valor={valor ?? f.defaultValue} vazio={f.placeholder} />;
  }
  if (f.type === "file") {
    return (
      <CampoArquivo
        name={f.name}
        label={f.label || undefined}
        accept={f.atributos?.accept}
        multiple={f.multiplo}
        desabilitado={desabilitado}
        aoMudar={aoMudarArquivos}
        testId={f.testId}
        size={size}
        maxW={f.larguraMax}
      />
    );
  }
  if (f.type === "cor") {
    return <CampoDeCor f={f} valor={valor} aoMudar={aoMudar} desabilitado={desabilitado} />;
  }
  if (f.type === "numero") {
    return (
      <CampoNumero
        label={f.label || undefined}
        hint={f.hint}
        valor={valor === "" || valor == null ? null : Number(valor)}
        aoMudar={(v) => aoMudar?.(v == null ? "" : String(v))}
        min={f.min}
        max={f.max}
        step={f.passo}
        desabilitado={desabilitado}
        nulavel={f.nulavel}
        sufixo={f.sufixo}
        size={size}
        name={f.name}
        larguraMax={f.larguraMax}
      />
    );
  }
  if (f.type === "opcoes") {
    return (
      <CampoOpcoes
        name={f.name}
        rotulo={f.label}
        opcoes={f.options ?? []}
        marcadas={(valor ?? f.defaultValue ?? "").split(",").filter(Boolean)}
        hint={f.hint}
      />
    );
  }
  if ((f.type === "checkbox" || f.type === "switch") && f.nativo) {
    return (
      <CampoMarcacao
        name={f.name}
        rotulo={f.label}
        hint={f.hint}
        marcado={valor === "1" || valor === "true" || f.defaultValue === "1"}
        testId={f.testId}
      />
    );
  }

  let controle: ReactNode;
  if (f.type === "checkbox" || f.type === "switch") {
    const marcado = controlado ? valor === "1" || valor === "true" : undefined;
    const padrao = !controlado ? f.defaultValue === "1" || f.defaultValue === "true" : undefined;
    const Comp = f.type === "switch" ? Switch : Checkbox;
    return (
      <Field.Root
        required={f.required}
        invalid={!!erro}
        gridColumn={{ base: "auto", sm: f.colSpan === 2 ? "span 2" : "auto" }}
      >
        <Comp.Root
          name={f.name}
          value="1"
          checked={marcado}
          defaultChecked={padrao}
          disabled={desabilitado}
          size={size}
          onCheckedChange={aoMudar ? (e) => aoMudar(e.checked ? "1" : "") : undefined}
        >
          <Comp.HiddenInput data-testid={testId} />
          <Comp.Control />
          <Comp.Label>{f.label}</Comp.Label>
        </Comp.Root>
        {f.hint && <Field.HelperText>{f.hint}</Field.HelperText>}
        {erro && <Field.ErrorText>{erro}</Field.ErrorText>}
      </Field.Root>
    );
  } else if (f.type === "select" && f.otherNumber) {
    controle = (
      <SelectComOutroNumero
        name={f.name}
        options={f.options ?? []}
        defaultValue={f.defaultValue}
        other={f.otherNumber}
      />
    );
  } else if (f.type === "select") {
    controle =
      !f.nativo && (f.searchable || (f.options?.length ?? 0) > 8) ? (
        <SelectBuscavel
          name={f.name}
          options={f.options ?? []}
          defaultValue={controlado ? undefined : f.defaultValue}
          value={controlado ? valor : undefined}
          onValueChange={aoMudar}
          placeholder={f.placeholder}
          disabled={desabilitado}
          testId={testId}
        />
      ) : (
        <NativeSelect.Root size={size}>
          <NativeSelect.Field {...comum} onChange={aoMudar ? (e) => aoMudar(e.target.value) : undefined}>
            {f.placeholder && !f.required && <option value="">{f.placeholder}</option>}
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      );
  } else if (f.type === "textarea") {
    controle = (
      <Textarea
        {...comum}
        {...nativos}
        rows={rows}
        size={size}
        placeholder={f.placeholder}
        onChange={aoMudar ? (e) => aoMudar(e.target.value) : undefined}
      />
    );
  } else if (f.type && mascaras[f.type]) {
    const m = mascaras[f.type];
    controle = (
      <MaskedInput
        name={f.name}
        formatar={m.formatar}
        crua={m.crua}
        defaultValue={f.defaultValue}
        placeholder={f.placeholder}
      />
    );
  } else {
    controle = (
      <Input
        {...comum}
        {...nativos}
        size={size}
        type={f.type ?? "text"}
        step={f.step}
        placeholder={f.placeholder}
        onChange={aoMudar ? (e) => aoMudar(e.target.value) : undefined}
      />
    );
  }

  return (
    <Field.Root
      required={f.required}
      invalid={!!erro}
      gridColumn={{ base: "auto", sm: f.colSpan === 2 ? "span 2" : "auto" }}
      w={f.w}
      minW={f.minW}
      maxW={f.larguraMax}
      flex={f.flex}
    >
      {f.label !== "" && <Field.Label>{f.label}</Field.Label>}
      {controle}
      {f.hint && <Field.HelperText>{f.hint}</Field.HelperText>}
      {erro && <Field.ErrorText>{erro}</Field.ErrorText>}
    </Field.Root>
  );
}
