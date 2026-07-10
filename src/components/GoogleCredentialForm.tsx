"use client";

import { useState, useTransition } from "react";
import { Box, chakra, HStack, Stack, Text } from "@chakra-ui/react";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  KeyRound,
} from "lucide-react";
import { Accordion, type AccordionItemDef } from "./Accordion";
import { Button } from "./Button";
import { FormInput } from "./form";

/* ============================================================
 * Credencial OAuth do Google (Client ID/Secret) — compartilhada
 * por Gmail (enviar/ler) e Drive (gravar). Componente PURO: recebe
 * o estado atual + um callback `onSave` (o app decide onde grava).
 * Traz um passo a passo pensado pra quem nunca mexeu no Google Cloud.
 * ============================================================ */

export type GoogleCredentialSaveResult = { ok: true } | { ok: false; error: string };

export type GoogleRedirectUri = { label: string; uri: string };

function CopyableUri({ label, uri }: GoogleRedirectUri) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard
      .writeText(uri)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }
  return (
    <Box
      p={3}
      borderRadius="10px"
      bg="var(--admin-surface)"
      borderWidth="1px"
      borderColor="var(--admin-border)"
    >
      <Text fontSize="xs" color="var(--admin-text-soft)" mb={1}>
        {label}
      </Text>
      <HStack gap={2} align="stretch">
        <Text fontSize="xs" fontFamily="mono" wordBreak="break-all" flex="1" minW={0}>
          {uri}
        </Text>
        <Button tone="outline" size="xs" onClick={copy} flexShrink={0}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </HStack>
    </Box>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <HStack gap={3} align="flex-start">
      <Box
        flexShrink={0}
        w="22px"
        h="22px"
        borderRadius="full"
        bg="var(--admin-primary)"
        color="white"
        fontSize="xs"
        fontWeight="700"
        display="flex"
        alignItems="center"
        justifyContent="center"
        mt="1px"
      >
        {n}
      </Box>
      <Text fontSize="sm" color="var(--admin-text-soft)" lineHeight="1.65">
        {children}
      </Text>
    </HStack>
  );
}

export function GoogleCredentialForm(props: {
  /** Redirect URIs que precisam ser cadastrados na credencial (Gmail e/ou Drive). */
  redirectUris: GoogleRedirectUri[];
  /** Já existe um Client ID salvo? */
  hasClientId: boolean;
  /** Já existe um Secret salvo? (deixe o campo em branco pra manter) */
  hasSecret: boolean;
  /** Client ID atual (não é segredo) — pré-preenche o campo. */
  initialClientId?: string;
  onSave: (input: {
    clientId: string;
    clientSecret: string;
  }) => Promise<GoogleCredentialSaveResult>;
  /** Chamado após salvar com sucesso (ex.: router.refresh). */
  onSaved?: () => void;
  /** Abre o passo a passo já expandido (default: abre quando falta configurar). */
  defaultGuideOpen?: boolean;
}) {
  const [clientId, setClientId] = useState(props.initialClientId ?? "");
  const [clientSecret, setClientSecret] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const ready = props.hasClientId && props.hasSecret;
  const guideOpen = props.defaultGuideOpen ?? !ready;

  function save() {
    setErr(null);
    setOk(null);
    start(async () => {
      const r = await props.onSave({ clientId: clientId.trim(), clientSecret });
      if (r.ok) {
        setOk("Credencial salva. Agora é só conectar.");
        setClientSecret("");
        props.onSaved?.();
      } else {
        setErr(r.error);
      }
    });
  }

  const guideItems: AccordionItemDef[] = [
    {
      value: "guide",
      title: "Como criar a credencial no Google (passo a passo)",
      content: (
        <Stack gap={3} pt={1}>
          <Step n={1}>
            Abra o{" "}
            <chakra.a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noopener noreferrer"
              color="var(--admin-primary)"
              textDecoration="underline"
            >
              Google Cloud Console <ExternalLink size={11} style={{ display: "inline" }} />
            </chakra.a>{" "}
            e entre com a conta do Google que vai enviar/ler os e-mails.
          </Step>
          <Step n={2}>
            No topo da página, crie (ou selecione) um <strong>projeto</strong>.
          </Step>
          <Step n={3}>
            Menu <strong>☰ → APIs e serviços → Tela de consentimento OAuth</strong>. Escolha{" "}
            <strong>Externo</strong>, preencha o nome do app e seu e-mail e, em{" "}
            <strong>Usuários de teste</strong>, adicione o seu próprio e-mail.
          </Step>
          <Step n={4}>
            Menu <strong>☰ → APIs e serviços → Biblioteca</strong>. Busque{" "}
            <strong>Gmail API</strong> e clique <strong>Ativar</strong> (e{" "}
            <strong>Google Drive API</strong>, se for usar o Drive).
          </Step>
          <Step n={5}>
            Menu{" "}
            <chakra.a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              color="var(--admin-primary)"
              textDecoration="underline"
            >
              APIs e serviços → Credenciais <ExternalLink size={11} style={{ display: "inline" }} />
            </chakra.a>{" "}
            → <strong>Criar credenciais → ID do cliente OAuth</strong>. Em{" "}
            <strong>Tipo de aplicativo</strong>, escolha <strong>Aplicativo da Web</strong>.
          </Step>
          <Step n={6}>
            Em <strong>URIs de redirecionamento autorizados</strong>, clique{" "}
            <strong>Adicionar URI</strong> e cole <strong>exatamente</strong> cada endereço da caixa{" "}
            <em>“URIs de redirecionamento”</em> abaixo (um por vez).
          </Step>
          <Step n={7}>
            Clique <strong>Criar</strong>. O Google mostra o <strong>ID do cliente</strong> e a{" "}
            <strong>Chave secreta do cliente</strong> — copie os dois.
          </Step>
          <Step n={8}>
            Cole os dois nos campos abaixo e clique <strong>Salvar credencial</strong>. Pronto —
            depois é só clicar em <strong>Conectar</strong>.
          </Step>
        </Stack>
      ),
    },
  ];

  return (
    <Stack gap={5}>
      {ready ? (
        <HStack
          gap={2}
          bg="green.50"
          borderWidth="1px"
          borderColor="green.200"
          borderRadius="10px"
          px={4}
          py={3}
          flexWrap="wrap"
        >
          <Check size={16} color="green" />
          <Text fontSize="sm" fontWeight="700" color="green.700">
            Credencial do Google configurada
          </Text>
          <Text fontSize="xs" color="var(--admin-text-soft)">
            Vale pro Gmail e pro Drive. Deixe os campos em branco pra manter, ou cole novos pra trocar.
          </Text>
        </HStack>
      ) : (
        <HStack gap={2} color="#a16207">
          <KeyRound size={16} />
          <Text fontSize="sm" fontWeight="700">
            Falta configurar a credencial do Google (é rápido — siga o passo a passo)
          </Text>
        </HStack>
      )}

      <Accordion items={guideItems} defaultValue={guideOpen ? ["guide"] : []} />

      {props.redirectUris.length > 0 ? (
        <Stack gap={2}>
          <Text fontSize="xs" fontWeight="700" color="var(--admin-text)">
            URIs de redirecionamento — cadastre EXATAMENTE {props.redirectUris.length > 1 ? "estes" : "este"} na credencial OAuth:
          </Text>
          {props.redirectUris.map((r) => (
            <CopyableUri key={r.uri} label={r.label} uri={r.uri} />
          ))}
        </Stack>
      ) : null}

      <FormInput
        label="ID do cliente (Client ID)"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        placeholder="123-abc.apps.googleusercontent.com"
        fontFamily="mono"
        autoComplete="off"
        help={props.hasClientId ? "Já existe um Client ID salvo — edite se quiser trocar." : undefined}
      />
      <FormInput
        label="Chave secreta do cliente (Client Secret)"
        type="password"
        value={clientSecret}
        onChange={(e) => setClientSecret(e.target.value)}
        placeholder={props.hasSecret ? "●●●●●●●● (deixe vazio pra manter)" : "GOCSPX-..."}
        fontFamily="mono"
        autoComplete="off"
        help={props.hasSecret ? "Já existe um Secret salvo — deixe em branco para mantê-lo." : undefined}
      />

      {err ? (
        <HStack gap={2} color="red.600" fontSize="sm">
          <AlertTriangle size={15} />
          <Text>{err}</Text>
        </HStack>
      ) : null}
      {ok ? (
        <HStack gap={2} color="green.600" fontSize="sm">
          <Check size={15} />
          <Text>{ok}</Text>
        </HStack>
      ) : null}

      <HStack justify="flex-end">
        <Button
          tone="primary"
          onClick={save}
          loading={pending}
          disabled={!clientId.trim() || (!clientSecret.trim() && !props.hasSecret)}
        >
          <KeyRound size={15} /> Salvar credencial
        </Button>
      </HStack>
    </Stack>
  );
}
