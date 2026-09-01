"use client";

import { useState } from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { CalendarClock, Headset, PhoneCall } from "lucide-react";
import { Button } from "../Button";
import { Modal } from "../Modal";
import { Tag } from "../Badge";
import { InlineSelect } from "../InlineSelect";
import { FormGrid, FormInput, FormTextarea } from "../form";
import { CONTATO_META, type LinhaFunil } from "./types";
import { diaLocal, fmtData } from "./blocos";

/**
 * Os 4 modais do trabalho de funil — os MESMOS nos dois painéis (vieram da
 * tela do representante, que já era pura). Recebem a `LinhaFunil` e devolvem
 * a intenção pelo `onSalvar`; quem fala com o servidor é o wrapper.
 */

export const CANAIS_CONTATO = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "ligacao", label: "Ligação" },
  { value: "email", label: "E-mail" },
  { value: "outro", label: "Outro" },
];

export const MOTIVOS_CONTATO = [
  { value: "nao_atendeu", label: "Não atendeu / não respondeu" },
  { value: "sem_whatsapp", label: "O número não tem WhatsApp" },
  { value: "outro", label: "Outro motivo" },
];

function quemE(linha: LinhaFunil | null): string {
  return linha?.nome || linha?.empresa || "contato";
}

/** "O que fazer, e quando" — também atende a ação em massa (`linha=null` + `titulo`). */
export function PassoModal({
  linha,
  titulo,
  pendente,
  onClose,
  onSalvar,
}: {
  linha: LinhaFunil | null;
  /** Título custom (ex.: "Próximo passo — 12 contatos" na ação em massa). */
  titulo?: string;
  pendente: boolean;
  onClose: () => void;
  onSalvar: (acao: string, diaISO: string) => void;
}) {
  const [acao, setAcao] = useState(linha?.proximaAcao ?? "");
  const [dia, setDia] = useState((linha?.proximaAcaoEm ?? "").slice(0, 10) || diaLocal());

  const atalhos: Array<{ rotulo: string; offset: number }> = [
    { rotulo: "Hoje", offset: 0 },
    { rotulo: "Amanhã", offset: 1 },
    { rotulo: "Em 3 dias", offset: 3 },
    { rotulo: "Semana que vem", offset: 7 },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title={titulo ?? `Próximo passo — ${quemE(linha)}`}
      size="md"
      footer={
        <HStack gap={2} justify="flex-end" w="full">
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button tone="primary" disabled={pendente || !acao.trim()} onClick={() => onSalvar(acao.trim(), dia)}>
            <CalendarClock size={15} /> Salvar
          </Button>
        </HStack>
      }
    >
      <FormGrid columns={1}>
        <FormInput
          label="O que você vai fazer"
          placeholder="Ex.: ligar e perguntar quantos atendimentos ela perde por semana"
          value={acao}
          maxLength={500}
          onChange={(e) => setAcao(e.currentTarget.value)}
        />
        <FormInput label="Quando" type="date" value={dia} onChange={(e) => setDia(e.currentTarget.value)} />
      </FormGrid>
      <HStack gap={1.5} flexWrap="wrap">
        {atalhos.map((a) => (
          <Button key={a.rotulo} size="xs" tone="outline" onClick={() => setDia(diaLocal(a.offset))}>
            {a.rotulo}
          </Button>
        ))}
      </HStack>
    </Modal>
  );
}

/** "Falei / tentei e não consegui" — registra o contato humano. */
export function ContatoModal({
  linha,
  pendente,
  onClose,
  onSalvar,
}: {
  linha: LinhaFunil;
  pendente: boolean;
  onClose: () => void;
  onSalvar: (dados: { falou: boolean; canal: string; motivo?: string; obs?: string }) => void;
}) {
  const [falou, setFalou] = useState(true);
  const [canal, setCanal] = useState(linha.telefone ? "whatsapp" : linha.email ? "email" : "outro");
  const [motivo, setMotivo] = useState("nao_atendeu");
  const [obs, setObs] = useState("");
  const meta = CONTATO_META[linha.contato.estado];

  return (
    <Modal
      open
      onClose={onClose}
      title={`Registrar contato — ${quemE(linha)}`}
      size="md"
      footer={
        <HStack gap={2} justify="flex-end" w="full">
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            tone="primary"
            disabled={pendente}
            onClick={() =>
              onSalvar({
                falou,
                canal,
                motivo: falou ? undefined : motivo,
                obs: obs.trim() || undefined,
              })
            }
          >
            <PhoneCall size={15} /> {falou ? "Falei" : "Tentei e não consegui"}
          </Button>
        </HStack>
      }
    >
      <HStack gap={2} flexWrap="wrap">
        <Text fontSize="sm" color="var(--admin-text-soft)">
          Hoje:
        </Text>
        <Tag bg={meta.bg} color={meta.color}>
          {meta.label}
        </Tag>
        {linha.contato.em ? (
          <Text fontSize="xs" color="var(--admin-text-soft)">
            {fmtData(linha.contato.em)}
          </Text>
        ) : null}
      </HStack>
      <HStack gap={2}>
        <Button size="sm" tone={falou ? "primary" : "outline"} onClick={() => setFalou(true)}>
          Falei com ele
        </Button>
        <Button size="sm" tone={!falou ? "primary" : "outline"} onClick={() => setFalou(false)}>
          Tentei e não consegui
        </Button>
      </HStack>
      <HStack gap={2} flexWrap="wrap">
        <Text fontSize="sm" color="var(--admin-text-soft)">
          Por onde:
        </Text>
        <InlineSelect
          value={canal}
          options={CANAIS_CONTATO}
          onChange={setCanal}
          render={(v) => (
            <Tag bg="var(--admin-nav-hover)" color="var(--admin-text)">
              {CANAIS_CONTATO.find((c) => c.value === v)?.label ?? "Outro"} ▾
            </Tag>
          )}
        />
        {!falou ? (
          <>
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Por quê:
            </Text>
            <InlineSelect
              value={motivo}
              options={MOTIVOS_CONTATO}
              onChange={setMotivo}
              render={(v) => (
                <Tag bg="var(--admin-nav-hover)" color="var(--admin-text)">
                  {MOTIVOS_CONTATO.find((m) => m.value === v)?.label ?? "Outro"} ▾
                </Tag>
              )}
            />
          </>
        ) : null}
      </HStack>
      <FormTextarea
        label="Observação (opcional)"
        rows={2}
        value={obs}
        placeholder={falou ? "Ex.: pediu pra ligar depois das 14h" : "Ex.: caixa postal direto"}
        onChange={(e) => setObs(e.currentTarget.value.slice(0, 500))}
      />
      <Text fontSize="xs" color="var(--admin-text-soft)">
        {falou
          ? 'A conta sai de "Novo" e, se não tiver próximo passo, ganha "Cobrar retorno" em 2 dias.'
          : 'Se não tiver próximo passo, a conta ganha "Tentar de novo" pra amanhã.'}
      </Text>
    </Modal>
  );
}

/** Nota livre no histórico da conta. */
export function NotaModal({
  linha,
  pendente,
  onClose,
  onSalvar,
}: {
  linha: LinhaFunil;
  pendente: boolean;
  onClose: () => void;
  onSalvar: (texto: string) => void;
}) {
  const [texto, setTexto] = useState("");

  return (
    <Modal
      open
      onClose={onClose}
      title={`Nota — ${quemE(linha)}`}
      size="md"
      footer={
        <HStack gap={2} justify="flex-end" w="full">
          <Button tone="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button tone="primary" disabled={pendente || !texto.trim()} onClick={() => onSalvar(texto.trim())}>
            Salvar nota
          </Button>
        </HStack>
      }
    >
      <FormTextarea
        label="O que aconteceu"
        placeholder="Ex.: falei com a sócia, ela decide junto com o marido; retomar depois do dia 20"
        rows={4}
        value={texto}
        onChange={(e) => setTexto(e.currentTarget.value)}
      />
      {linha.notas.length > 0 ? (
        <Box className="admin-card" bg="var(--admin-nav-hover)" p={3} borderRadius="12px" maxH="220px" overflowY="auto">
          <Text fontSize="xs" fontWeight={700} textTransform="uppercase" letterSpacing="0.04em" color="var(--admin-text-soft)" mb={2}>
            Histórico
          </Text>
          <Stack gap={2}>
            {linha.notas.map((n, i) => (
              <Text key={i} fontSize="sm" whiteSpace="pre-wrap" color="var(--admin-text)">
                {n}
              </Text>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Modal>
  );
}

/** Escalar pro dono — a venda está madura ou a decisão é dele. */
export function ChamarJoseModal({
  linha,
  pendente,
  onClose,
  onChamar,
}: {
  linha: LinhaFunil;
  pendente: boolean;
  onClose: () => void;
  onChamar: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const pronto = motivo.trim().length >= 3;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Chamar o José — ${linha.empresa || linha.nome || "contato"}`}
      size="md"
      footer={
        <HStack gap={2} justify="flex-end" w="full">
          <Button tone="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button tone="primary" disabled={pendente || !pronto} onClick={() => onChamar(motivo.trim())}>
            <Headset size={15} /> Chamar o José
          </Button>
        </HStack>
      }
    >
      <Text fontSize="sm" color="var(--admin-text-soft)">
        Ele recebe na hora, no WhatsApp e por e-mail, com o seu motivo e o link desta ficha. Use quando a venda
        está madura ou a decisão é dele (preço, prazo, escopo). A conta continua com você.
      </Text>
      <FormTextarea
        label="Por que o José precisa entrar"
        placeholder="Ex.: quer fechar hoje, mas pediu desconto e parcelamento em 3x"
        rows={3}
        value={motivo}
        onChange={(e) => setMotivo(e.currentTarget.value.slice(0, 400))}
      />
    </Modal>
  );
}
