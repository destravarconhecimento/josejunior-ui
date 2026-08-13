"use client";

import { Box, HStack, Spinner } from "@chakra-ui/react";
import { BadgeCheck, HelpCircle, PhoneOff } from "lucide-react";
import { TextoCopiavel } from "./TextoCopiavel";

/**
 * O que se sabe do número: "tem" WhatsApp, "nao" tem, "?" ninguém perguntou
 * ainda, "checando" a pergunta está no ar.
 */
export type SituacaoWhats = "tem" | "nao" | "?" | "checando";

/**
 * O SELO ao lado do número — a resposta da pergunta "esse número tem WhatsApp?"
 * escrita na linha. Sem ele a resposta ficava implícita (qual botão aparecia) e
 * o resultado da verificação passava despercebido: ninguém verificado e ninguém
 * confirmado ficavam idênticos na tela.
 */
const SELO: Record<SituacaoWhats, { cor: string; titulo: string; Icone: typeof BadgeCheck }> = {
  tem: { cor: "green.600", titulo: "Tem WhatsApp (verificado)", Icone: BadgeCheck },
  nao: { cor: "red.500", titulo: "Não tem WhatsApp — só ligação", Icone: PhoneOff },
  "?": { cor: "fg.muted", titulo: "Ainda não verificado no WhatsApp", Icone: HelpCircle },
  checando: { cor: "fg.muted", titulo: "Perguntando ao WhatsApp…", Icone: HelpCircle },
};

/**
 * O TELEFONE de uma linha de lista: o selo do WhatsApp + o número, que é o
 * próprio botão de copiar. Existe porque em lista de trabalho o número precisa
 * responder duas coisas de relance — "dá pra mandar mensagem?" e "me dá isso
 * pra colar" — sem gastar a coluna de ações (que fica congelada à direita e é
 * só pra AGIR).
 *
 * Quem quiser agir no número (enviar, ligar, marcar "não é WhatsApp") usa o
 * `LeadWhatsActions` do funil, que embrulha este selo nos botões.
 */
export function NumeroWhats({
  numero,
  situacao = "?",
  fontSize = "sm",
  vazio = "sem número",
  title,
}: {
  /** O número como se lê e se copia (rótulo formatado, quando houver). */
  numero: string | null | undefined;
  situacao?: SituacaoWhats;
  fontSize?: string;
  /** O que aparece quando o lead não tem número. */
  vazio?: string;
  /** Legenda do hover (padrão: número + o que diz o selo). */
  title?: string;
}) {
  const selo = SELO[situacao];
  const legenda = title ?? `${numero || vazio} — ${selo.titulo}`;

  return (
    <HStack gap={1} minW={0}>
      <Box
        as="span"
        color={selo.cor}
        display="inline-flex"
        alignItems="center"
        flexShrink={0}
        title={legenda}
        aria-label={selo.titulo}
      >
        {situacao === "checando" ? <Spinner size="xs" /> : <selo.Icone size={14} />}
      </Box>
      {/* O número é o próprio botão de copiar: na coluna do contato não cabe um
          ícone de cópia por dado, e o que ela faz o dia inteiro é pegar o número
          pra colar em outro lugar. */}
      <TextoCopiavel
        texto={numero}
        rotulo="Número copiado"
        title={`${legenda} · clique para copiar`}
        fontSize={fontSize}
        color={numero && situacao !== "nao" ? undefined : "var(--admin-text-soft)"}
        vazio={vazio}
      />
    </HStack>
  );
}
