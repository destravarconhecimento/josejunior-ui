"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Box,
  chakra,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  AlertTriangle,
  ArrowLeft,
  AtSign,
  Check,
  Copy,
  Folder as FolderIcon,
  Globe,
  Inbox,
  Mail,
  Paperclip,
  PenLine,
  Plus,
  RefreshCw,
  Reply,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { Accordion, type AccordionItemDef } from "../Accordion";
import { ActionMenu } from "../ActionMenu";
import { Tag } from "../Badge";
import { Button } from "../Button";
import { Card } from "../Card";
import { Switch } from "../controls";
import { DataTable } from "../DataTable";
import { EmailHtmlView } from "../EmailHtmlView";
import { markdownToEmailHtml } from "./markdown";
import { EmptyState } from "../EmptyState";
import { FormField, FormInput, FormSelect, FormTextarea } from "../form";
import { GoogleCredentialForm } from "../GoogleCredentialForm";
import { Modal } from "../Modal";
import { PageBody } from "../PageBody";
import { PageHeader } from "../PageHeader";
import { useConfirm } from "../useConfirm";

/* ============================================================
 * Cliente de e-mail — super-componente PURO do core.
 * Mesma experiência no tenant e no sistema; cada app passa os
 * dados + os callbacks (server actions próprias). IDs sempre
 * STRING (serve serial number e uuid). Zero import de @/server.
 * ============================================================ */

export type MailResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export type MailProvider = "resend" | "gmail";

export type MailConnEditor = {
  provider: MailProvider | null;
  resendRegion: string;
  hasResendApiKey: boolean;
  hasWebhookSecret: boolean;
  source: "db" | "env" | "none";
};

/** Uma conta Resend (multi-conta). Só o sistema usa; tenants ficam mono-conta. */
export type MailConnectionRow = {
  id: string;
  label: string;
  region: string;
  hasApiKey: boolean;
  hasWebhookSecret: boolean;
  domainCount: number;
};

export type MailDnsRecord = {
  record?: string;
  type: string;
  name: string;
  value: string;
  ttl?: string;
  priority?: number;
  status?: string;
};

export type MailDomain = {
  id: string;
  domain: string;
  status: string;
  verified: boolean;
  inboundEnabled: boolean;
  region: string | null;
  dnsRecords: MailDnsRecord[];
  /** Conta Resend dona do domínio (multi-conta). */
  connectionId?: string | null;
  connectionLabel?: string | null;
};

export type MailDomainOption = { id: string; domain: string; verified: boolean };
export type MailUserOption = { id: string; name: string | null; email: string };

export type MailAccountRow = {
  id: string;
  address: string;
  name: string | null;
  type: "shared" | "personal";
  active: boolean;
  assignedUserIds: string[];
  /** Motor da conta. Ausente = 'resend' (compat. com o sistema). */
  provider?: MailProvider;
};

export type MailInboxAccount = {
  id: string;
  address: string;
  name: string | null;
  type: "shared" | "personal";
  /** Motor da conta. Ausente = 'resend'. Só Gmail traz a pasta de Spam. */
  provider?: MailProvider;
};

export type MailAttachment = { filename: string; url?: string };

export type MailMessage = {
  id: string;
  accountId: string;
  direction: "inbound" | "sent";
  /** Caixa lógica. Ausente → deriva de `direction` (compat. sistema). */
  mailbox?: "inbox" | "sent" | "spam" | "trash";
  fromAddress: string;
  fromName: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string | null;
  bodyHtml: string | null;
  bodyText: string | null;
  read: boolean;
  threadId: string | null;
  resendId: string | null;
  inReplyTo: string | null;
  date: string; // ISO
  attachments?: MailAttachment[];
  /** Slug da pasta inteligente atribuída (IA/regras). Ausente = não classificado. */
  category?: string | null;
  /** Rascunho de resposta gerado pela IA (pré-preenche o "Responder"). */
  aiDraft?: string | null;
  /** Quando a IA respondeu esta mensagem automaticamente (ISO). */
  aiRepliedAt?: string | null;
};

/** Pasta inteligente (categoria). `slug` é a chave estável usada por IA/regras/filtro
 *  E como identificador nos callbacks; `name` é editável. `system` = uma das 5 padrão
 *  (renomeável, não removível). */
export type MailFolder = {
  slug: string;
  name: string;
  color?: string | null;
  system?: boolean;
};

/** Config da IA da caixa (por conta). `off` = IA parada. */
export type MailAiSettings = {
  /** Distribui os recebidos nas pastas automaticamente. */
  organize: boolean;
  /** off = nada; draft = só rascunha; safe_auto = envia sozinha em casos seguros. */
  autoReply: "off" | "draft" | "safe_auto";
};

/** As 5 pastas inteligentes PADRÃO (slug canônico + rótulo pt-BR + cor). FONTE
 *  ÚNICA: os apps semeiam a partir daqui e o classificador usa estes slugs como
 *  enum-alvo — nunca redefina os slugs em outro lugar. `nome` é editável depois. */
export const DEFAULT_MAIL_CATEGORIES: { slug: string; label: string; color: string; hint: string }[] = [
  { slug: "clientes", label: "Clientes", color: "#2563eb", hint: "Clientes atuais e leads: dúvidas, pedidos, suporte, respostas a propostas." },
  { slug: "financeiro", label: "Financeiro", color: "#16a34a", hint: "Cobranças, boletos, pagamentos, notas fiscais, Asaas, Mercado Pago, bancos." },
  { slug: "fornecedores", label: "Fornecedores", color: "#9333ea", hint: "Prestadores, ferramentas, hospedagem, contratos B2B, faturas de serviços." },
  { slug: "marketing", label: "Marketing", color: "#ea580c", hint: "Newsletters, promoções, redes sociais, descadastros e comunicados em massa." },
  { slug: "sistema", label: "Sistema", color: "#64748b", hint: "Alertas técnicos, DMARC, no-reply, notificações automáticas e monitoramento." },
];

/** Rótulo humano dos modos de auto-resposta (usado no modal e nas configs). */
const AUTO_REPLY_LABEL: Record<MailAiSettings["autoReply"], string> = {
  off: "Desligado",
  draft: "Só rascunhar",
  safe_auto: "Enviar automático (casos seguros)",
};

export type MailCallbacks = {
  // conexão / provedor
  onSaveConnection: (input: {
    provider: MailProvider;
    resendApiKey?: string;
    resendRegion?: string;
    resendWebhookSecret?: string;
  }) => Promise<MailResult>;
  onTestKey: (
    apiKey: string,
  ) => Promise<{ ok: true; domains: number } | { ok: false; error: string }>;
  // contas Resend (multi-conta — só o sistema passa; opcionais)
  onCreateConnection?: (input: {
    label: string;
    resendApiKey: string;
    resendRegion?: string;
    resendWebhookSecret?: string;
  }) => Promise<MailResult<{ id: string }>>;
  onUpdateConnection?: (
    id: string,
    input: {
      label?: string;
      resendApiKey?: string;
      resendRegion?: string;
      resendWebhookSecret?: string;
    },
  ) => Promise<MailResult>;
  onRemoveConnection?: (id: string) => Promise<MailResult>;
  // domínios (connectionId opcional → escolhe a conta Resend dona)
  onAddDomain: (domain: string, connectionId?: string) => Promise<MailResult<{ id: string }>>;
  onSyncDomain: (id: string) => Promise<MailResult<{ verified: boolean }>>;
  onRemoveDomain: (id: string) => Promise<MailResult>;
  // contas
  onCreateAccount: (input: {
    localPart: string;
    domainId: string;
    name?: string;
    type: "shared" | "personal";
    assignedUserIds: string[];
  }) => Promise<MailResult<{ address: string }>>;
  onToggleAccount: (id: string, active: boolean) => Promise<MailResult>;
  onRemoveAccount: (id: string) => Promise<MailResult>;
  // caixa
  onSend: (input: {
    accountId: string;
    to: string;
    cc: string;
    subject: string;
    html: string;
    inReplyTo: string | null;
    threadId: string | null;
    attachments: MailAttachment[];
  }) => Promise<MailResult<{ id: string; resendId: string | null }>>;
  /** Sobe um anexo (Blob) e devolve a URL pública + nome. */
  onUploadAttachment?: (file: File) => Promise<{ ok: true; url: string; filename: string } | { ok: false; error: string }>;
  onSync: () => Promise<MailResult<{ synced: number }>>;
  onMarkRead: (id: string, read: boolean) => Promise<MailResult>;
  // pastas inteligentes (ausentes → some a affordance correspondente)
  /** Cria uma pasta nova (nome livre; o app gera o slug). Ausente = "+ Nova pasta" some. */
  onCreateFolder?: (name: string) => Promise<MailResult>;
  /** Renomeia uma pasta (o slug NÃO muda). */
  onRenameFolder?: (slug: string, name: string) => Promise<MailResult>;
  /** Remove uma pasta custom (as `system` não podem). */
  onRemoveFolder?: (slug: string) => Promise<MailResult>;
  /** Move UMA mensagem para a pasta `slug` (null = tira da pasta / volta pra caixa).
   *  Mover manualmente também ENSINA uma regra ao classificador. */
  onMoveToFolder?: (messageId: string, slug: string | null) => Promise<MailResult>;
  /** Move UMA mensagem para uma caixa fixa: Recebidos (inbox), Spam ou Lixeira (trash).
   *  Ausente → some as ações "Marcar como spam"/"Mover para Lixeira" na leitura. */
  onSetMailbox?: (messageId: string, mailbox: "inbox" | "spam" | "trash") => Promise<MailResult>;
  // IA da caixa (ausentes → o botão "IA" some)
  /** Salva a config da IA da caixa (organizar / respostas). */
  onSaveAiSettings?: (settings: MailAiSettings) => Promise<MailResult>;
  /** Classifica em lote os e-mails já existentes ("Organizar caixa agora"). */
  onBackfillOrganize?: () => Promise<MailResult<{ organized: number }>>;
  /** Inicia o OAuth do Gmail (redireciona pro Google). Ausente = "em breve". */
  onConnectGmail?: () => void;
  /** Salva a credencial OAuth do Google (Client ID/Secret) — compartilhada Gmail+Drive.
   *  Presente = mostra o formulário de credencial inline quando ela falta. */
  onSaveGoogleCredential?: (input: {
    clientId: string;
    clientSecret: string;
  }) => Promise<MailResult>;
  /** Define a conta PRINCIPAL do tenant. Ausente = recurso oculto (ex.: sistema). */
  onSetDefaultAccount?: (id: string) => Promise<MailResult>;
  // recarregar a tela (router.refresh no app)
  onRefresh: () => void;
};

type Folder = "inbox" | "sent" | "spam" | "trash";

/** Caixa lógica de uma mensagem — cai na direção p/ linhas antigas/sistema. */
function mailboxOf(m: MailMessage): Folder {
  return m.mailbox ?? (m.direction === "sent" ? "sent" : "inbox");
}

const FOLDER_LABEL: Record<Folder, string> = {
  inbox: "Recebidos",
  sent: "Enviados",
  spam: "Spam",
  trash: "Lixeira",
};

type ComposeState = {
  fromAccountId: string;
  to: string;
  cc: string;
  subject: string;
  html: string;
  inReplyTo: string | null;
  threadId: string | null;
  attachments: MailAttachment[];
};

const REGIONS = ["us-east-1", "eu-west-1", "sa-east-1", "ap-northeast-1"];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function displayName(addr: string, name: string | null) {
  return name && name.trim() ? name : addr;
}

/** decodeURIComponent que nunca lança (URI malformada → devolve como veio). */
function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function snippet(m: MailMessage): string {
  const base = (m.bodyText || m.bodyHtml || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return base.slice(0, 90);
}

// ============================================================
// Componente principal
// ============================================================

export function MailClient(props: {
  /** título do cabeçalho (padrão "Email") */
  title?: string;
  isAdmin: boolean;
  initialView: "inbox" | "settings";
  conn: MailConnEditor;
  webhookUrl: string;
  domains: MailDomain[];
  accounts: MailAccountRow[];
  inboxAccounts: MailInboxAccount[];
  users: MailUserOption[];
  messages: MailMessage[];
  callbacks: MailCallbacks;
  /** Id da conta PRINCIPAL do tenant (abre a caixa nela + marca nas configs). */
  defaultAccountId?: string;
  /** Credencial OAuth do Google pronta (client id/secret)? `false` desabilita o
   *  botão "Conectar Google" e mostra o que falta configurar. Ausente = não checa. */
  gmailOAuthReady?: boolean;
  /** Resultado do fluxo OAuth do Gmail (`?gmail=ok|denied|missing-client|err:...`). */
  gmailResult?: string;
  /** Redirect URI do callback do Gmail — pra cadastrar na credencial OAuth do Google. */
  gmailRedirectUri?: string;
  /** Link pra tela dedicada de credencial do Google (ex.: "/integracoes-google"). */
  gmailCredentialHref?: string;
  /** Contas Resend (multi-conta). Quando presente, as Configurações mostram o
   *  gerenciador de contas em vez do "1 provedor". Ausente = mono-conta (tenants). */
  connections?: MailConnectionRow[];
  /** Ações extras no cabeçalho (ex.: botão "Templates" no sistema). */
  headerActions?: React.ReactNode;
  /** Pastas inteligentes (categorias). Ausente/vazio = só as caixas fixas. */
  folders?: MailFolder[];
  /** Config da IA da caixa. Ausente = botão "IA" some (superfície sem IA). */
  aiSettings?: MailAiSettings;
}) {
  const [view, setView] = useState<"inbox" | "settings">(props.initialView);
  const [aiOpen, setAiOpen] = useState(false);
  const hasAccounts = props.inboxAccounts.length > 0;
  const cb = props.callbacks;
  // Botão "IA" só aparece quando a superfície oferece IA (config + admin).
  const aiEnabled = Boolean(props.aiSettings && cb.onSaveAiSettings && props.isAdmin);
  // Gmail conecta por CONTA (não pelo `conn.provider`, que é o editor do Resend).
  const gmailConnected = props.accounts.some((a) => a.provider === "gmail");
  const anyConnected = Boolean(props.conn.provider) || gmailConnected;
  const providerLabel =
    props.conn.provider === "resend" && gmailConnected
      ? "Resend + Gmail"
      : props.conn.provider === "resend"
        ? "Resend conectado"
        : props.conn.provider === "gmail" || gmailConnected
          ? "Gmail conectado"
          : "Provedor não configurado";

  return (
    // A caixa ocupa a tela inteira (scroll INTERNO nas colunas); as
    // Configurações são um formulário longo e seguem no scroll da página.
    // `--admin-content-h` vem do <main> do shell — o fallback cobre quem
    // renderizar o MailClient fora de um shell nosso.
    <Box
      display="flex"
      flexDirection="column"
      h={view === "settings" ? undefined : { md: "var(--admin-content-h, calc(100dvh - 132px))" }}
    >
      <PageHeader
        title={props.title ?? "Email"}
        actions={
          <>
            <Tag
              bg={anyConnected ? "rgba(34,197,94,0.12)" : "rgba(234,179,8,0.14)"}
              color={anyConnected ? "#15803d" : "#a16207"}
            >
              {providerLabel}
            </Tag>
            {props.headerActions}
            {aiEnabled && view === "inbox" ? (
              <Button tone="outline" onClick={() => setAiOpen(true)}>
                <Sparkles size={16} /> IA
              </Button>
            ) : null}
            {props.isAdmin ? (
              view === "settings" ? (
                <Button tone="outline" onClick={() => setView("inbox")} disabled={!hasAccounts}>
                  <ArrowLeft size={16} /> Voltar à caixa
                </Button>
              ) : (
                <Button tone="outline" onClick={() => setView("settings")}>
                  <Settings size={16} /> Configurações
                </Button>
              )
            ) : null}
          </>
        }
      />

      {aiEnabled && props.aiSettings ? (
        <AiSettingsModal
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          settings={props.aiSettings}
          onSave={cb.onSaveAiSettings!}
          onBackfill={cb.onBackfillOrganize}
          onRefresh={cb.onRefresh}
        />
      ) : null}

      <PageBody fill={view !== "settings"}>
        {view === "settings" ? (
          <SettingsView
            conn={props.conn}
            webhookUrl={props.webhookUrl}
            domains={props.domains}
            accounts={props.accounts}
            users={props.users}
            connections={props.connections}
            defaultAccountId={props.defaultAccountId}
            gmailOAuthReady={props.gmailOAuthReady}
            gmailResult={props.gmailResult}
            gmailRedirectUri={props.gmailRedirectUri}
            gmailCredentialHref={props.gmailCredentialHref}
            callbacks={cb}
          />
        ) : (
          <Mailbox
            accounts={props.inboxAccounts}
            messages={props.messages}
            defaultAccountId={props.defaultAccountId}
            folders={props.folders ?? []}
            aiSettings={props.aiSettings}
            isAdmin={props.isAdmin}
            callbacks={cb}
            onGoSettings={props.isAdmin ? () => setView("settings") : undefined}
          />
        )}
      </PageBody>
    </Box>
  );
}

// ============================================================
// Modal "IA da caixa" — organizar em pastas + modo de resposta
// ============================================================

/** Card com os controles da IA da caixa (organizar + respostas). Reusado no
 *  modal "IA" (topo) e — se algum dia quisermos — dentro das Configurações. */
function AiSettingsControls({
  organize,
  setOrganize,
  autoReply,
  setAutoReply,
  onBackfill,
  pending,
  running,
}: {
  organize: boolean;
  setOrganize: (v: boolean) => void;
  autoReply: MailAiSettings["autoReply"];
  setAutoReply: (v: MailAiSettings["autoReply"]) => void;
  onBackfill?: () => void;
  pending: boolean;
  running: boolean;
}) {
  return (
    <Stack gap={5}>
      {/* Organizar em pastas */}
      <Stack gap={2}>
        <HStack justify="space-between" align="flex-start" gap={4}>
          <Stack gap={0.5} flex="1" minW={0}>
            <Text fontWeight="700" fontSize="sm">Organizar e-mails em pastas</Text>
            <Text fontSize="xs" color="var(--admin-text-soft)" lineHeight="1.5">
              A IA lê o assunto de cada recebido e o guarda na pasta certa (Clientes,
              Financeiro, Fornecedores, Marketing, Sistema). Vai aprendendo os remetentes
              e, com o tempo, passa a acertar sozinha — quase sem chamar a IA.
            </Text>
          </Stack>
          <Switch.Root
            checked={organize}
            onCheckedChange={(e) => setOrganize(e.checked)}
            flexShrink={0}
          >
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </HStack>
        {onBackfill ? (
          <Button
            size="sm"
            tone="outline"
            borderRadius="10px"
            alignSelf="flex-start"
            onClick={onBackfill}
            loading={running}
            disabled={pending && !running}
          >
            <Sparkles size={14} /> Organizar caixa agora
          </Button>
        ) : null}
      </Stack>

      <Box h="1px" bg="var(--admin-border)" />

      {/* Respostas automáticas */}
      <Stack gap={2}>
        <Stack gap={0.5}>
          <Text fontWeight="700" fontSize="sm">Respostas automáticas</Text>
          <Text fontSize="xs" color="var(--admin-text-soft)" lineHeight="1.5">
            A IA pode redigir uma resposta pra você. Em <b>Só rascunhar</b>, o texto já vem
            pronto ao clicar em Responder — você revisa e envia. Em <b>Enviar automático</b>,
            ela responde sozinha apenas casos simples e seguros (nunca cobranças, contratos,
            jurídico, cancelamentos ou listas/no-reply).
          </Text>
        </Stack>
        <FormSelect
          value={autoReply}
          onChange={(e) => setAutoReply(e.currentTarget.value as MailAiSettings["autoReply"])}
          options={[
            { value: "off", label: AUTO_REPLY_LABEL.off },
            { value: "draft", label: AUTO_REPLY_LABEL.draft },
            { value: "safe_auto", label: AUTO_REPLY_LABEL.safe_auto },
          ]}
        />
        {autoReply === "safe_auto" ? (
          <HStack
            gap={2}
            align="flex-start"
            px={3}
            py={2.5}
            borderRadius="10px"
            bg="rgba(234,179,8,0.10)"
            borderWidth="1px"
            borderColor="rgba(234,179,8,0.35)"
          >
            <Icon as={AlertTriangle} boxSize={4} color="#a16207" mt="1px" flexShrink={0} />
            <Text fontSize="xs" color="#854d0e" lineHeight="1.5">
              Envio automático ligado. A IA só dispara em casos seguros, uma única vez por
              conversa; qualquer caso sensível vira rascunho pra sua revisão.
            </Text>
          </HStack>
        ) : null}
      </Stack>
    </Stack>
  );
}

function AiSettingsModal({
  open,
  onClose,
  settings,
  onSave,
  onBackfill,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  settings: MailAiSettings;
  onSave: (settings: MailAiSettings) => Promise<MailResult>;
  onBackfill?: () => Promise<MailResult<{ organized: number }>>;
  onRefresh: () => void;
}) {
  const [organize, setOrganize] = useState(settings.organize);
  const [autoReply, setAutoReply] = useState<MailAiSettings["autoReply"]>(settings.autoReply);
  const [pending, start] = useTransition();
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Reabriu → re-sincroniza com o que veio do servidor (pode ter mudado no refresh).
  useEffect(() => {
    if (open) {
      setOrganize(settings.organize);
      setAutoReply(settings.autoReply);
      setMsg(null);
      setErr(null);
    }
  }, [open, settings.organize, settings.autoReply]);

  function save() {
    start(async () => {
      setErr(null);
      setMsg(null);
      const r = await onSave({ organize, autoReply });
      if (r.ok) {
        setMsg("Configuração salva.");
        onRefresh();
      } else {
        setErr(r.error);
      }
    });
  }

  function backfill() {
    if (!onBackfill) return;
    setRunning(true);
    start(async () => {
      setErr(null);
      setMsg(null);
      const r = await onBackfill();
      setRunning(false);
      if (r.ok) {
        setMsg(`Caixa organizada: ${r.data?.organized ?? 0} e-mail(s) classificado(s).`);
        onRefresh();
      } else {
        setErr(r.error);
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="IA da caixa de e-mail"
      footer={
        <>
          {msg ? <Text fontSize="xs" color="#15803d" mr="auto">{msg}</Text> : null}
          {err ? <Text fontSize="xs" color="#dc2626" mr="auto">{err}</Text> : null}
          <Button tone="ghost" onClick={onClose} disabled={pending}>Fechar</Button>
          <Button tone="primary" onClick={save} loading={pending && !running}>Salvar</Button>
        </>
      }
    >
      <AiSettingsControls
        organize={organize}
        setOrganize={setOrganize}
        autoReply={autoReply}
        setAutoReply={setAutoReply}
        onBackfill={onBackfill ? backfill : undefined}
        pending={pending}
        running={running}
      />
    </Modal>
  );
}

// ============================================================
// Configurações (provedor → domínios → contas)
// ============================================================

function SettingsView(props: {
  conn: MailConnEditor;
  webhookUrl: string;
  domains: MailDomain[];
  accounts: MailAccountRow[];
  users: MailUserOption[];
  connections?: MailConnectionRow[];
  defaultAccountId?: string;
  gmailOAuthReady?: boolean;
  gmailResult?: string;
  gmailRedirectUri?: string;
  gmailCredentialHref?: string;
  callbacks: MailCallbacks;
}) {
  const domainOptions: MailDomainOption[] = props.domains.map((d) => ({
    id: d.id,
    domain: d.domain,
    verified: d.verified,
  }));
  // Multi-conta quando o app passa `connections` + o callback de criar conta.
  const multi = Boolean(props.connections && props.callbacks.onCreateConnection);
  const anyConnKey = (props.connections ?? []).some((c) => c.hasApiKey);
  const connected = multi
    ? anyConnKey
    : props.conn.provider === "resend" && props.conn.hasResendApiKey;
  const verified = props.domains.filter((d) => d.verified).length;

  const items: AccordionItemDef[] = [
    multi
      ? {
          value: "provider",
          title: "1. Contas Resend",
          meta: (
            <Tag
              bg={anyConnKey ? "rgba(34,197,94,0.12)" : "rgba(234,179,8,0.14)"}
              color={anyConnKey ? "#15803d" : "#a16207"}
            >
              {(props.connections ?? []).length} conta(s)
            </Tag>
          ),
          content: (
            <ConnectionsManager
              connections={props.connections ?? []}
              webhookUrl={props.webhookUrl}
              callbacks={props.callbacks}
            />
          ),
        }
      : {
          value: "provider",
          title: "1. Provedor & API key",
          meta: connected ? (
            <Tag bg="rgba(34,197,94,0.12)" color="#15803d">conectado</Tag>
          ) : (
            <Tag bg="rgba(234,179,8,0.14)" color="#a16207">pendente</Tag>
          ),
          content: (
            <ConnectProviderForm
              initial={props.conn}
              webhookUrl={props.webhookUrl}
              gmailAccounts={props.accounts.filter((a) => a.provider === "gmail")}
              gmailOAuthReady={props.gmailOAuthReady}
              gmailResult={props.gmailResult}
              gmailRedirectUri={props.gmailRedirectUri}
              gmailCredentialHref={props.gmailCredentialHref}
              callbacks={props.callbacks}
            />
          ),
        },
  ];
  const showDomains = multi ? true : props.conn.provider === "resend";
  if (showDomains) {
    items.push({
      value: "domains",
      title: "2. Domínios & DNS",
      meta: (
        <Tag
          bg={verified > 0 ? "rgba(34,197,94,0.12)" : props.domains.length ? "rgba(234,179,8,0.14)" : "rgba(100,116,139,0.14)"}
          color={verified > 0 ? "#15803d" : props.domains.length ? "#a16207" : "#475569"}
        >
          {props.domains.length === 0 ? "nenhum" : `${verified}/${props.domains.length} verificado(s)`}
        </Tag>
      ),
      content: (
        <DomainManager
          domains={props.domains}
          connections={multi ? props.connections : undefined}
          callbacks={props.callbacks}
        />
      ),
    });
    items.push({
      value: "accounts",
      title: "3. Contas de e-mail",
      meta: (
        <Tag
          bg={props.accounts.length ? "rgba(59,130,246,0.12)" : "rgba(100,116,139,0.14)"}
          color={props.accounts.length ? "#1d4ed8" : "#475569"}
        >
          {props.accounts.length} conta(s)
        </Tag>
      ),
      content: (
        <AccountManager
          accounts={props.accounts}
          domains={domainOptions}
          users={props.users}
          callbacks={props.callbacks}
        />
      ),
    });
  }

  return (
    <Stack gap={5}>
      {props.callbacks.onSetDefaultAccount && props.accounts.length > 0 ? (
        <DefaultAccountCard
          accounts={props.accounts}
          defaultAccountId={props.defaultAccountId}
          onSetDefault={props.callbacks.onSetDefaultAccount}
          onRefresh={props.callbacks.onRefresh}
        />
      ) : null}
      <Accordion
        items={items}
        multiple
        // Voltando do Google (?gmail=...) ou sem provedor → abre no passo 1 (provedor/
        // credencial). Só pula pra "Domínios" quando já está conectado E não é retorno OAuth.
        defaultValue={!props.gmailResult && connected ? ["domains"] : ["provider"]}
      />
    </Stack>
  );
}

// ============================================================
// Conta principal (remetente do sistema + pré-seleção + caixa padrão)
// ============================================================

function DefaultAccountCard({
  accounts,
  defaultAccountId,
  onSetDefault,
  onRefresh,
}: {
  accounts: MailAccountRow[];
  defaultAccountId?: string;
  onSetDefault: (id: string) => Promise<MailResult>;
  onRefresh: () => void;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const active = accounts.filter((a) => a.active);
  const current = (defaultAccountId && active.find((a) => a.id === defaultAccountId)) || null;

  const label = (a: MailAccountRow) =>
    `${a.name ? `${a.name} ` : ""}<${a.address}>${a.provider === "gmail" ? " · Gmail" : ""}`;

  function choose(id: string) {
    if (!id || id === (current?.id ?? "")) return;
    setErr(null);
    setMsg(null);
    start(async () => {
      const r = await onSetDefault(id);
      if (r.ok) {
        setMsg("Conta principal atualizada.");
        onRefresh();
      } else {
        setErr(r.error);
      }
    });
  }

  return (
    <Card>
      <Stack gap={4}>
        <HStack gap={2} align="flex-start">
          <Box color="var(--admin-primary)" mt="2px">
            <Star size={18} />
          </Box>
          <Stack gap={0}>
            <Text fontWeight="700" color="var(--admin-primary)">
              Conta principal
            </Text>
            <Text fontSize="sm" color="var(--admin-text-soft)">
              É o remetente dos e-mails automáticos do sistema (acesso e redefinição de senha),
              a opção já selecionada em campanhas e ao escrever, e a caixa que a tela abre por padrão.
            </Text>
          </Stack>
        </HStack>

        {active.length === 0 ? (
          <Box
            bg="var(--admin-surface-2)"
            borderRadius="12px"
            p={4}
            borderWidth="1px"
            borderColor="var(--admin-border)"
          >
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Conecte o Gmail ou crie uma conta de e-mail para escolher a principal.
            </Text>
          </Box>
        ) : (
          <Box maxW="440px">
            <FormSelect
              label="Conta que envia pelo sistema"
              value={current?.id ?? ""}
              disabled={pending}
              onChange={(e) => choose(e.currentTarget.value)}
              options={[
                ...(current ? [] : [{ value: "", label: "— selecione a conta principal" }]),
                ...active.map((a) => ({ value: a.id, label: label(a) })),
              ]}
            />
          </Box>
        )}

        {current ? (
          <HStack gap={2}>
            <Tag bg="rgba(234,179,8,0.14)" color="#a16207">
              <Star size={11} /> principal
            </Tag>
            <Text fontSize="sm" color="var(--admin-text)">
              {current.name ? `${current.name} · ` : ""}
              {current.address}
            </Text>
          </HStack>
        ) : active.length > 0 ? (
          <Text fontSize="xs" color="var(--admin-text-soft)">
            Nenhuma conta principal definida — os e-mails do sistema usam a primeira conta ativa.
          </Text>
        ) : null}

        {err && (
          <Text color="red.600" fontSize="sm">
            {err}
          </Text>
        )}
        {msg && (
          <Text color="green.600" fontSize="sm">
            {msg}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

// ============================================================
// Conectar provedor
// ============================================================

function ConnectProviderForm({
  initial,
  webhookUrl,
  gmailAccounts = [],
  gmailOAuthReady,
  gmailResult,
  gmailRedirectUri,
  gmailCredentialHref,
  callbacks,
}: {
  initial: MailConnEditor;
  webhookUrl?: string;
  gmailAccounts?: MailAccountRow[];
  gmailOAuthReady?: boolean;
  gmailResult?: string;
  gmailRedirectUri?: string;
  gmailCredentialHref?: string;
  callbacks: MailCallbacks;
}) {
  const { confirm, confirmDialog } = useConfirm();
  const [pending, start] = useTransition();
  // Voltando do Google (?gmail=...), abre já na aba Gmail pra mostrar o resultado.
  const [provider, setProvider] = useState<MailProvider>(
    gmailResult ? "gmail" : (initial.provider ?? "resend"),
  );
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [region, setRegion] = useState(initial.resendRegion || "us-east-1");
  const [test, setTest] = useState<
    { ok: true; domains: number } | { ok: false; error: string } | null
  >(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function copyWebhook() {
    if (!webhookUrl) return;
    navigator.clipboard
      .writeText(webhookUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => setErr("Não consegui copiar — selecione e copie manualmente."));
  }

  function runTest() {
    setErr(null);
    setMsg(null);
    setTest(null);
    start(async () => {
      const r = await callbacks.onTestKey(apiKey);
      setTest(r);
    });
  }

  function save() {
    setErr(null);
    setMsg(null);
    start(async () => {
      const r = await callbacks.onSaveConnection({
        provider,
        resendApiKey: apiKey,
        resendRegion: region,
        resendWebhookSecret: webhookSecret,
      });
      if (r.ok) {
        setMsg("Provedor conectado. O módulo de e-mail está ativo.");
        callbacks.onRefresh();
      } else {
        setErr(r.error);
      }
    });
  }

  async function removeGmail(id: string, address: string) {
    if (!(await confirm({ title: `Desconectar ${address}?`, confirmLabel: "Desconectar", tone: "danger" }))) return;
    start(async () => {
      const r = await callbacks.onRemoveAccount(id);
      if (!r.ok) setErr(r.error);
      else callbacks.onRefresh();
    });
  }

  return (
    <Card>
      <Stack gap={5}>
        <Stack gap={1}>
          <Text fontWeight="700" color="var(--admin-primary)">
            Conectar provedor de e-mail
          </Text>
          <Text fontSize="sm" color="var(--admin-text-soft)">
            Escolha como envia e recebe e-mails. Um provedor por caixa (dá pra trocar depois).
          </Text>
        </Stack>

        <HStack gap={3} flexDir={{ base: "column", sm: "row" }} align="stretch">
          <ProviderCard
            active={provider === "resend"}
            onClick={() => setProvider("resend")}
            icon={<Send size={18} />}
            title="Resend"
            desc="API key + domínio próprio. Cria endereços (atendimento@…)."
          />
          <ProviderCard
            active={provider === "gmail"}
            onClick={() => setProvider("gmail")}
            icon={<Mail size={18} />}
            title="Gmail"
            desc="Conecte uma caixa do Google (ler + enviar) via autorização."
            badge={callbacks.onConnectGmail ? undefined : "em breve"}
          />
        </HStack>

        {provider === "resend" ? (
          <Stack gap={4}>
            {initial.hasResendApiKey ? (
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
                  Resend conectado{initial.source === "env" ? " (via ambiente)" : ""}
                </Text>
                <Text fontSize="xs" color="var(--admin-text-soft)">
                  A key está salva — deixe os campos em branco pra manter, ou cole novos pra trocar.
                </Text>
              </HStack>
            ) : null}
            <FormInput
              label="API key do Resend"
              type="password"
              value={apiKey}
              placeholder="re_..."
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              help={
                initial.hasResendApiKey
                  ? "Já existe uma key salva — deixe em branco para mantê-la."
                  : "Cole a Secret API key do painel do Resend (resend.com/api-keys)."
              }
            />

            <Box maxW="260px">
              <FormSelect
                label="Região (para criar domínios)"
                value={region}
                onChange={(e) => setRegion(e.currentTarget.value)}
                options={REGIONS.map((r) => ({ value: r, label: r }))}
              />
            </Box>

            {webhookUrl ? (
              <FormField
                label="URL do webhook (cole no Resend)"
                help={
                  <>
                    No Resend → Webhooks → Add Endpoint, cole esta URL e marque o
                    evento <code>email.received</code> (e os de entrega, se quiser
                    status). O Resend gera um Signing secret — cole-o no campo abaixo.
                  </>
                }
              >
                <HStack gap={2} align="stretch" w="full">
                  <Input
                    bg="var(--admin-surface)"
                    value={webhookUrl}
                    readOnly
                    onFocus={(e) => e.currentTarget.select()}
                    fontSize="sm"
                  />
                  <Button tone="outline" onClick={copyWebhook} flexShrink={0}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copiado" : "Copiar"}
                  </Button>
                </HStack>
              </FormField>
            ) : null}

            <FormInput
              label="Signing secret do webhook (whsec_…)"
              type="password"
              value={webhookSecret}
              placeholder="whsec_..."
              onChange={(e) => setWebhookSecret(e.target.value)}
              autoComplete="off"
              help={
                initial.hasWebhookSecret
                  ? "Já existe um secret salvo — deixe em branco para mantê-lo."
                  : "Cole aqui o Signing secret gerado pelo Resend ao criar o webhook acima. Valida a assinatura dos eventos."
              }
            />

            {test ? (
              test.ok ? (
                <HStack gap={2} color="green.600" fontSize="sm">
                  <Check size={16} />
                  <Text>Key válida — {test.domains} domínio(s) na conta Resend.</Text>
                </HStack>
              ) : (
                <HStack gap={2} color="red.600" fontSize="sm">
                  <X size={16} />
                  <Text>{test.error}</Text>
                </HStack>
              )
            ) : null}

            {err && (
              <Text color="red.600" fontSize="sm">
                {err}
              </Text>
            )}
            {msg && (
              <Text color="green.600" fontSize="sm">
                {msg}
              </Text>
            )}

            <HStack justify="flex-end" gap={3}>
              <Button tone="outline" onClick={runTest} loading={pending} disabled={!apiKey.trim()}>
                Testar key
              </Button>
              <Button tone="primary" onClick={save} loading={pending}>
                Conectar Resend
              </Button>
            </HStack>
          </Stack>
        ) : callbacks.onConnectGmail ? (
          <Stack gap={4}>
            <Box
              bg="var(--admin-surface-2)"
              borderRadius="12px"
              p={4}
              borderWidth="1px"
              borderColor="var(--admin-border)"
            >
              <Text fontSize="sm" color="var(--admin-text-soft)" lineHeight="1.7">
                Conecte uma caixa do Google para <strong>ler e enviar</strong> direto por aqui.
                Você será levado ao Google para autorizar (ler + enviar) — nenhuma senha é
                compartilhada. Dá pra conectar mais de uma conta.
              </Text>
            </Box>

            {gmailResult === "ok" ? (
              <HStack gap={2} color="green.600" fontSize="sm">
                <Check size={16} />
                <Text>Conta Google conectada com sucesso!</Text>
              </HStack>
            ) : gmailResult === "denied" ? (
              <HStack gap={2} color="red.600" fontSize="sm">
                <X size={16} />
                <Text>Autorização cancelada no Google.</Text>
              </HStack>
            ) : gmailResult === "missing-client" ? (
              <HStack gap={2} color="#a16207" fontSize="sm">
                <AlertTriangle size={16} />
                <Text>Credencial OAuth do Google ainda não configurada — veja abaixo como resolver.</Text>
              </HStack>
            ) : gmailResult && gmailResult.startsWith("err") ? (
              <HStack gap={2} color="red.600" fontSize="sm">
                <X size={16} />
                <Text>Falha ao conectar: {safeDecode(gmailResult.slice(4))}</Text>
              </HStack>
            ) : null}

            {gmailAccounts.length > 0 ? (
              <Stack gap={2}>
                {gmailAccounts.map((a) => (
                  <HStack
                    key={a.id}
                    justify="space-between"
                    borderWidth="1px"
                    borderColor="var(--admin-border)"
                    borderRadius="10px"
                    px={3}
                    py={2}
                    flexWrap="wrap"
                    gap={2}
                  >
                    <HStack gap={2} minW={0}>
                      <Mail size={16} color="#15803d" />
                      <Stack gap={0} minW={0}>
                        <Text fontWeight="600" fontSize="sm" truncate>
                          {a.address}
                        </Text>
                        <Text fontSize="xs" color="var(--admin-text-soft)">
                          {a.active ? "conectada" : "inativa"}
                          {a.name ? ` · ${a.name}` : ""}
                        </Text>
                      </Stack>
                    </HStack>
                    <Button
                      size="xs"
                      tone="ghost"
                      color="#dc2626"
                      onClick={() => removeGmail(a.id, a.address)}
                      loading={pending}
                    >
                      <Trash2 size={13} /> Desconectar
                    </Button>
                  </HStack>
                ))}
              </Stack>
            ) : null}

            {gmailOAuthReady === false ? (
              <Box
                bg="rgba(234,179,8,0.10)"
                borderWidth="1px"
                borderColor="rgba(234,179,8,0.35)"
                borderRadius="12px"
                p={4}
              >
                <HStack gap={2} mb={2} color="#a16207">
                  <AlertTriangle size={16} />
                  <Text fontWeight="700" fontSize="sm">
                    Falta 1 passo: conectar sua conta Google
                  </Text>
                </HStack>
                <Text fontSize="sm" color="var(--admin-text-soft)" lineHeight="1.7" mb={3}>
                  Pra ativar o Gmail aqui, cadastre a credencial do Google{" "}
                  <strong>uma única vez</strong> (vale também pro Drive). Siga o passo a passo
                  abaixo e cole o Client ID + Secret — depois é só clicar em{" "}
                  <strong>Conectar Google</strong>.
                </Text>

                {callbacks.onSaveGoogleCredential ? (
                  <GoogleCredentialForm
                    redirectUris={
                      gmailRedirectUri ? [{ label: "Redirect URI do Gmail", uri: gmailRedirectUri }] : []
                    }
                    hasClientId={false}
                    hasSecret={false}
                    onSave={callbacks.onSaveGoogleCredential}
                    onSaved={callbacks.onRefresh}
                    defaultGuideOpen
                  />
                ) : gmailRedirectUri ? (
                  <Box
                    mt={1}
                    p={3}
                    borderRadius="10px"
                    bg="var(--admin-surface)"
                    borderWidth="1px"
                    borderColor="var(--admin-border)"
                  >
                    <Text fontSize="xs" color="var(--admin-text-soft)" mb={1}>
                      Redirect URI (cadastre EXATAMENTE este na credencial OAuth):
                    </Text>
                    <Text fontSize="xs" fontFamily="mono" wordBreak="break-all">
                      {gmailRedirectUri}
                    </Text>
                  </Box>
                ) : null}

                {gmailCredentialHref ? (
                  <HStack mt={3} gap={1} flexWrap="wrap">
                    <Text fontSize="xs" color="var(--admin-text-soft)">
                      Prefere gerenciar num só lugar (Gmail + Drive)?
                    </Text>
                    <chakra.a
                      href={gmailCredentialHref}
                      fontSize="xs"
                      fontWeight="600"
                      color="var(--admin-primary)"
                      textDecoration="underline"
                    >
                      Abrir Integrações Google
                    </chakra.a>
                  </HStack>
                ) : null}
              </Box>
            ) : null}

            {err && (
              <Text color="red.600" fontSize="sm">
                {err}
              </Text>
            )}

            <HStack justify="flex-end">
              <Button
                tone="primary"
                onClick={() => callbacks.onConnectGmail?.()}
                disabled={gmailOAuthReady === false}
              >
                <Mail size={16} /> Conectar Google
              </Button>
            </HStack>
          </Stack>
        ) : (
          <Box
            bg="var(--admin-surface-2)"
            borderRadius="12px"
            p={4}
            borderWidth="1px"
            borderColor="var(--admin-border)"
          >
            <HStack gap={2} mb={1}>
              <Tag bg="rgba(168,85,247,0.12)" color="#7c3aed">Em breve</Tag>
              <Text fontWeight="600" color="var(--admin-primary)">
                Conexão com Gmail
              </Text>
            </HStack>
            <Text fontSize="sm" color="var(--admin-text-soft)" lineHeight="1.7">
              Em seguida, cada atendente vai clicar em “Conectar Google” e autorizar a própria
              caixa — sem compartilhar senha. Por enquanto, use o Resend para deixar o e-mail
              funcional.
            </Text>
          </Box>
        )}
      </Stack>
      {confirmDialog}
    </Card>
  );
}

function ProviderCard({
  active,
  onClick,
  icon,
  title,
  desc,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge?: string;
}) {
  return (
    <chakra.button
      type="button"
      onClick={onClick}
      flex={1}
      textAlign="left"
      borderRadius="14px"
      borderWidth="2px"
      borderColor={active ? "var(--admin-primary)" : "var(--admin-border)"}
      bg={active ? "var(--admin-surface-2)" : "var(--admin-surface)"}
      p={4}
      transition="all 0.15s"
      _hover={{ borderColor: "var(--admin-primary)" }}
    >
      <HStack gap={2} mb={1}>
        <Box color="var(--admin-primary)">{icon}</Box>
        <Text fontWeight="700" color="var(--admin-primary)">
          {title}
        </Text>
        {badge ? <Tag bg="rgba(168,85,247,0.12)" color="#7c3aed">{badge}</Tag> : null}
        {active ? (
          <Box ml="auto" color="var(--admin-primary)">
            <Check size={16} />
          </Box>
        ) : null}
      </HStack>
      <Text fontSize="xs" color="var(--admin-text-soft)" lineHeight="1.6">
        {desc}
      </Text>
    </chakra.button>
  );
}

// ============================================================
// Contas Resend (multi-conta) — só o sistema
// ============================================================

function WebhookBox({ webhookUrl }: { webhookUrl: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard
      .writeText(webhookUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  }
  return (
    <FormField
      label="URL do webhook (cole a MESMA em TODAS as contas Resend)"
      help={
        <>
          No Resend de cada conta → Webhooks → Add Endpoint, cole esta URL, marque{" "}
          <code>email.received</code> (e os de entrega). Cole o Signing secret de cada
          conta no campo da conta correspondente abaixo.
        </>
      }
    >
      <HStack gap={2} align="stretch" w="full">
        <Input
          bg="var(--admin-surface)"
          value={webhookUrl}
          readOnly
          onFocus={(e) => e.currentTarget.select()}
          fontSize="sm"
        />
        <Button tone="outline" onClick={copy} flexShrink={0}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </HStack>
    </FormField>
  );
}

function ConnectionsManager({
  connections,
  webhookUrl,
  callbacks,
}: {
  connections: MailConnectionRow[];
  webhookUrl: string;
  callbacks: MailCallbacks;
}) {
  const { confirm, confirmDialog } = useConfirm();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  // form de nova conta
  const [nLabel, setNLabel] = useState("");
  const [nKey, setNKey] = useState("");
  const [nRegion, setNRegion] = useState("us-east-1");
  const [nSecret, setNSecret] = useState("");

  // form de edição (por conta aberta)
  const [eLabel, setELabel] = useState("");
  const [eKey, setEKey] = useState("");
  const [eRegion, setERegion] = useState("us-east-1");
  const [eSecret, setESecret] = useState("");

  function openEdit(c: MailConnectionRow) {
    setEditId(c.id);
    setELabel(c.label);
    setEKey("");
    setERegion(c.region || "us-east-1");
    setESecret("");
    setErr(null);
    setMsg(null);
  }

  function create() {
    if (!callbacks.onCreateConnection) return;
    setErr(null);
    setMsg(null);
    start(async () => {
      const r = await callbacks.onCreateConnection!({
        label: nLabel,
        resendApiKey: nKey,
        resendRegion: nRegion,
        resendWebhookSecret: nSecret,
      });
      if (r.ok) {
        setNLabel("");
        setNKey("");
        setNSecret("");
        setMsg("Conta conectada. Adicione o domínio dela na seção de Domínios.");
        callbacks.onRefresh();
      } else {
        setErr(r.error);
      }
    });
  }

  function saveEdit(id: string) {
    if (!callbacks.onUpdateConnection) return;
    setErr(null);
    setMsg(null);
    start(async () => {
      const r = await callbacks.onUpdateConnection!(id, {
        label: eLabel,
        resendApiKey: eKey,
        resendRegion: eRegion,
        resendWebhookSecret: eSecret,
      });
      if (r.ok) {
        setEditId(null);
        setMsg("Conta atualizada.");
        callbacks.onRefresh();
      } else {
        setErr(r.error);
      }
    });
  }

  async function remove(c: MailConnectionRow) {
    if (c.domainCount > 0) {
      setErr(`A conta "${c.label}" tem ${c.domainCount} domínio(s). Remova-os antes.`);
      return;
    }
    if (!callbacks.onRemoveConnection) return;
    if (!(await confirm({ title: `Remover a conta ${c.label}?`, description: "A conexão Resend será desvinculada da plataforma.", confirmLabel: "Remover", tone: "danger" }))) return;
    setErr(null);
    setMsg(null);
    start(async () => {
      const r = await callbacks.onRemoveConnection!(c.id);
      if (r.ok) callbacks.onRefresh();
      else setErr(r.error);
    });
  }

  return (
    <Card>
      <Stack gap={5}>
        <Stack gap={1}>
          <Text fontWeight="700" color="var(--admin-primary)">
            Contas Resend conectadas
          </Text>
          <Text fontSize="sm" color="var(--admin-text-soft)">
            Cada conta Resend tem sua API key, seus domínios e seu webhook. O envio
            automático escolhe a conta pelo domínio do remetente.
          </Text>
        </Stack>

        {webhookUrl ? <WebhookBox webhookUrl={webhookUrl} /> : null}

        {err && <Text color="red.600" fontSize="sm">{err}</Text>}
        {msg && <Text color="green.600" fontSize="sm">{msg}</Text>}

        {connections.length === 0 ? (
          <Text fontSize="sm" color="var(--admin-text-soft)">
            Nenhuma conta ainda. Adicione a primeira abaixo.
          </Text>
        ) : (
          <Stack gap={3}>
            {connections.map((c) => (
              <Box key={c.id} borderWidth="1px" borderColor="var(--admin-border)" borderRadius="12px" p={4}>
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                  <HStack gap={3} flexWrap="wrap">
                    <Text fontWeight="600">{c.label}</Text>
                    <Tag
                      bg={c.hasApiKey ? "rgba(34,197,94,0.12)" : "rgba(234,179,8,0.14)"}
                      color={c.hasApiKey ? "#15803d" : "#a16207"}
                    >
                      {c.hasApiKey ? "key ok" : "sem key"}
                    </Tag>
                    <Tag
                      bg={c.hasWebhookSecret ? "rgba(59,130,246,0.12)" : "rgba(100,116,139,0.14)"}
                      color={c.hasWebhookSecret ? "#1d4ed8" : "#475569"}
                    >
                      {c.hasWebhookSecret ? "webhook ok" : "sem webhook"}
                    </Tag>
                    <Tag bg="rgba(100,116,139,0.14)" color="#475569">{c.region}</Tag>
                    <Tag bg="rgba(100,116,139,0.14)" color="#475569">{c.domainCount} domínio(s)</Tag>
                  </HStack>
                  <HStack gap={2}>
                    <Button size="sm" tone="outline" onClick={() => (editId === c.id ? setEditId(null) : openEdit(c))}>
                      {editId === c.id ? "Fechar" : "Editar"}
                    </Button>
                    <Button size="sm" tone="ghost" color="#dc2626" onClick={() => remove(c)} loading={pending}>
                      <Trash2 size={14} />
                    </Button>
                  </HStack>
                </HStack>

                {editId === c.id ? (
                  <Stack gap={3} mt={4}>
                    <FormInput label="Nome da conta" value={eLabel} onChange={(e) => setELabel(e.target.value)} autoComplete="off" />
                    <FormInput
                      label="Nova API key (deixe em branco pra manter)"
                      type="password"
                      value={eKey}
                      placeholder="re_..."
                      onChange={(e) => setEKey(e.target.value)}
                      autoComplete="off"
                    />
                    <Box maxW="260px">
                      <FormSelect
                        label="Região"
                        value={eRegion}
                        onChange={(e) => setERegion(e.currentTarget.value)}
                        options={REGIONS.map((r) => ({ value: r, label: r }))}
                      />
                    </Box>
                    <FormInput
                      label="Novo Signing secret (deixe em branco pra manter)"
                      type="password"
                      value={eSecret}
                      placeholder="whsec_..."
                      onChange={(e) => setESecret(e.target.value)}
                      autoComplete="off"
                    />
                    <HStack justify="flex-end">
                      <Button tone="primary" onClick={() => saveEdit(c.id)} loading={pending}>
                        Salvar alterações
                      </Button>
                    </HStack>
                  </Stack>
                ) : null}
              </Box>
            ))}
          </Stack>
        )}

        <Box borderTopWidth="1px" borderColor="var(--admin-border)" pt={4}>
          <Text fontWeight="700" color="var(--admin-primary)" mb={3}>
            Adicionar conta Resend
          </Text>
          <Stack gap={3}>
            <FormInput
              label="Nome da conta"
              value={nLabel}
              placeholder="themion.com.br"
              onChange={(e) => setNLabel(e.target.value)}
              autoComplete="off"
              help="Só pra você identificar (ex.: o domínio principal dela)."
            />
            <FormInput
              label="API key do Resend"
              type="password"
              value={nKey}
              placeholder="re_..."
              onChange={(e) => setNKey(e.target.value)}
              autoComplete="off"
            />
            <Box maxW="260px">
              <FormSelect
                label="Região"
                value={nRegion}
                onChange={(e) => setNRegion(e.currentTarget.value)}
                options={REGIONS.map((r) => ({ value: r, label: r }))}
              />
            </Box>
            <FormInput
              label="Signing secret do webhook (whsec_…)"
              type="password"
              value={nSecret}
              placeholder="whsec_..."
              onChange={(e) => setNSecret(e.target.value)}
              autoComplete="off"
              help="Opcional agora; sem ele os eventos entram best-effort. Cole depois de criar o webhook."
            />
            <HStack justify="flex-end">
              <Button tone="primary" onClick={create} loading={pending} disabled={!nLabel.trim() || !nKey.trim()}>
                Conectar conta
              </Button>
            </HStack>
          </Stack>
        </Box>
      </Stack>
      {confirmDialog}
    </Card>
  );
}

// ============================================================
// Domínios
// ============================================================

function domStatusTone(status: string, verified: boolean): { bg: string; color: string } {
  if (verified || status === "verified") return { bg: "rgba(34,197,94,0.12)", color: "#15803d" };
  if (status === "failed" || status === "partially_failed") return { bg: "rgba(239,68,68,0.12)", color: "#b91c1c" };
  return { bg: "rgba(234,179,8,0.14)", color: "#a16207" };
}

function domStatusLabel(status: string, verified: boolean) {
  if (verified || status === "verified") return "verificado";
  if (status === "pending") return "aguardando DNS";
  if (status === "not_started") return "não iniciado";
  return status;
}

function DomainManager({
  domains,
  connections,
  callbacks,
}: {
  domains: MailDomain[];
  connections?: MailConnectionRow[];
  callbacks: MailCallbacks;
}) {
  const { confirm, confirmDialog } = useConfirm();
  const [pending, start] = useTransition();
  const [newDomain, setNewDomain] = useState("");
  const connOptions = (connections ?? []).filter((c) => c.hasApiKey);
  const [connId, setConnId] = useState<string>(connOptions[0]?.id ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  function add() {
    setErr(null);
    setMsg(null);
    start(async () => {
      const r = await callbacks.onAddDomain(newDomain, connId || undefined);
      if (r.ok) {
        setNewDomain("");
        setMsg("Domínio adicionado. Publique os registros DNS abaixo e clique em Verificar.");
        setOpenId(r.data?.id ?? null);
        callbacks.onRefresh();
      } else {
        setErr(r.error);
      }
    });
  }

  function verify(id: string) {
    setErr(null);
    setMsg(null);
    start(async () => {
      const r = await callbacks.onSyncDomain(id);
      if (r.ok) {
        setMsg(
          r.data?.verified
            ? "Domínio verificado! Já dá pra criar contas nele."
            : "Ainda não verificado — o DNS pode levar até algumas horas pra propagar.",
        );
        callbacks.onRefresh();
      } else {
        setErr(r.error);
      }
    });
  }

  async function remove(id: string, domain: string) {
    if (!(await confirm({ title: `Remover o domínio ${domain}?`, description: "As contas vinculadas perdem o domínio.", confirmLabel: "Remover", tone: "danger" }))) return;
    setErr(null);
    setMsg(null);
    start(async () => {
      const r = await callbacks.onRemoveDomain(id);
      if (r.ok) callbacks.onRefresh();
      else setErr(r.error);
    });
  }

  return (
    <Card>
      <Stack gap={5}>
        <HStack gap={2}>
          <Box color="var(--admin-primary)">
            <Globe size={18} />
          </Box>
          <Stack gap={0}>
            <Text fontWeight="700" color="var(--admin-primary)">
              Domínios
            </Text>
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Adicione o domínio, publique os registros DNS e verifique.
            </Text>
          </Stack>
        </HStack>

        <HStack gap={3} align="flex-end" flexWrap="wrap">
          <Box flex="1" minW="240px">
            <FormInput
              label="Novo domínio"
              value={newDomain}
              placeholder="conecta.com.br"
              onChange={(e) => setNewDomain(e.target.value)}
              autoComplete="off"
            />
          </Box>
          {connOptions.length > 1 ? (
            <Box minW="220px">
              <FormSelect
                label="Conta Resend"
                value={connId}
                onChange={(e) => setConnId(e.currentTarget.value)}
                options={connOptions.map((c) => ({ value: c.id, label: c.label }))}
              />
            </Box>
          ) : null}
          <Button tone="primary" onClick={add} loading={pending} disabled={!newDomain.trim()}>
            Adicionar domínio
          </Button>
        </HStack>

        {err && (
          <Text color="red.600" fontSize="sm">
            {err}
          </Text>
        )}
        {msg && (
          <Text color="green.600" fontSize="sm">
            {msg}
          </Text>
        )}

        {domains.length === 0 ? (
          <Text fontSize="sm" color="var(--admin-text-soft)">
            Nenhum domínio ainda. Adicione um acima para começar.
          </Text>
        ) : (
          <Stack gap={3}>
            {domains.map((d) => (
              <Box
                key={d.id}
                borderWidth="1px"
                borderColor="var(--admin-border)"
                borderRadius="12px"
                p={4}
              >
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                  <HStack gap={3} flexWrap="wrap">
                    <Text fontWeight="600">{d.domain}</Text>
                    <Tag {...domStatusTone(d.status, d.verified)}>
                      {domStatusLabel(d.status, d.verified)}
                    </Tag>
                    {d.inboundEnabled ? (
                      <Tag bg="rgba(59,130,246,0.12)" color="#1d4ed8">recebe e-mails</Tag>
                    ) : null}
                    {connections && d.connectionLabel ? (
                      <Tag bg="rgba(100,116,139,0.14)" color="#475569">{d.connectionLabel}</Tag>
                    ) : null}
                  </HStack>
                  <HStack gap={2}>
                    <Button
                      size="sm"
                      tone="outline"
                      onClick={() => setOpenId(openId === d.id ? null : d.id)}
                    >
                      {openId === d.id ? "Ocultar DNS" : "Ver DNS"}
                    </Button>
                    <Button size="sm" tone="outline" onClick={() => verify(d.id)} loading={pending}>
                      <RefreshCw size={14} /> Verificar
                    </Button>
                    <Button
                      size="sm"
                      tone="ghost"
                      color="#dc2626"
                      onClick={() => remove(d.id, d.domain)}
                      loading={pending}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </HStack>
                </HStack>

                {openId === d.id ? (
                  <Box mt={4} overflowX="auto">
                    <Text fontSize="xs" color="var(--admin-text-soft)" mb={2}>
                      Publique estes registros no seu provedor de DNS. Depois clique em Verificar.
                    </Text>
                    <DataTable
                      columns={[
                        { key: "type", header: "Tipo", render: (r: MailDnsRecord) => <Text whiteSpace="nowrap">{r.type}</Text> },
                        { key: "name", header: "Nome", render: (r: MailDnsRecord) => <Text wordBreak="break-all" fontSize="xs">{r.name}</Text> },
                        { key: "value", header: "Valor", render: (r: MailDnsRecord) => <Text wordBreak="break-all" fontSize="xs">{r.value}</Text> },
                        { key: "prio", header: "Prior.", render: (r: MailDnsRecord) => <Text>{r.priority ?? "—"}</Text>, hideOnMobile: true },
                        {
                          key: "status",
                          header: "Status",
                          render: (r: MailDnsRecord) => (
                            <HStack gap={1} fontSize="xs">
                              {r.status === "verified" ? <Check size={13} color="green" /> : <X size={13} color="orange" />}
                              <Text>{r.status ?? "—"}</Text>
                            </HStack>
                          ),
                        },
                      ]}
                      rows={d.dnsRecords}
                      getRowKey={(r, i) => `${r.type}-${r.name}-${i}`}
                      fillHeight={false}
                      empty={<Text fontSize="sm" color="var(--admin-text-soft)" p={4}>Sem registros — clique em Verificar para buscar na Resend.</Text>}
                    />
                  </Box>
                ) : null}
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
      {confirmDialog}
    </Card>
  );
}

// ============================================================
// Contas de e-mail
// ============================================================

function AccountManager({
  accounts,
  domains,
  users,
  callbacks,
}: {
  accounts: MailAccountRow[];
  domains: MailDomainOption[];
  users: MailUserOption[];
  callbacks: MailCallbacks;
}) {
  const { confirm, confirmDialog } = useConfirm();
  const [pending, start] = useTransition();

  const verifiedDomains = domains.filter((d) => d.verified);
  const [localPart, setLocalPart] = useState("");
  const [domainId, setDomainId] = useState<string>(verifiedDomains[0]?.id ?? "");
  const [name, setName] = useState("");
  const [type, setType] = useState<"shared" | "personal">("shared");
  const [assigned, setAssigned] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const selectedDomain = domains.find((d) => d.id === domainId);

  function toggleAssigned(id: string) {
    setAssigned((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function create() {
    setErr(null);
    setMsg(null);
    if (domainId === "") {
      setErr("Selecione um domínio verificado.");
      return;
    }
    start(async () => {
      const r = await callbacks.onCreateAccount({
        localPart,
        domainId,
        name: name || undefined,
        type,
        assignedUserIds: type === "personal" ? assigned : [],
      });
      if (r.ok) {
        setLocalPart("");
        setName("");
        setAssigned([]);
        setMsg(`Conta ${r.data?.address} criada.`);
        callbacks.onRefresh();
      } else {
        setErr(r.error);
      }
    });
  }

  function toggle(id: string, active: boolean) {
    start(async () => {
      const r = await callbacks.onToggleAccount(id, active);
      if (!r.ok) setErr(r.error);
      else callbacks.onRefresh();
    });
  }

  async function remove(id: string, address: string) {
    if (!(await confirm({ title: `Remover a conta ${address}?`, confirmLabel: "Remover", tone: "danger" }))) return;
    start(async () => {
      const r = await callbacks.onRemoveAccount(id);
      if (!r.ok) setErr(r.error);
      else callbacks.onRefresh();
    });
  }

  const userLabel = (id: string) => {
    const u = users.find((x) => x.id === id);
    return u ? (u.name ?? u.email) : `#${id}`;
  };

  return (
    <Card>
      <Stack gap={5}>
        <HStack gap={2}>
          <Box color="var(--admin-primary)">
            <AtSign size={18} />
          </Box>
          <Stack gap={0}>
            <Text fontWeight="700" color="var(--admin-primary)">
              Contas de e-mail
            </Text>
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Crie endereços (atendimento@, contato@…) sobre um domínio verificado.
            </Text>
          </Stack>
        </HStack>

        {verifiedDomains.length === 0 ? (
          <Box
            bg="var(--admin-surface-2)"
            borderRadius="12px"
            p={4}
            borderWidth="1px"
            borderColor="var(--admin-border)"
          >
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Verifique um domínio acima para liberar a criação de contas.
            </Text>
          </Box>
        ) : (
          <Stack gap={4}>
            <HStack gap={3} align="flex-end" flexWrap="wrap">
              <Box flex="1" minW="160px">
                <FormInput
                  label="Endereço"
                  value={localPart}
                  placeholder="atendimento"
                  onChange={(e) => setLocalPart(e.target.value)}
                  autoComplete="off"
                />
              </Box>
              <Box maxW="240px">
                <FormSelect
                  label="Domínio"
                  value={domainId}
                  onChange={(e) => setDomainId(e.currentTarget.value)}
                  options={verifiedDomains.map((d) => ({ value: d.id, label: `@${d.domain}` }))}
                />
              </Box>
            </HStack>

            {selectedDomain ? (
              <Text fontSize="xs" color="var(--admin-text-soft)">
                Será criado: <strong>{(localPart || "atendimento")}@{selectedDomain.domain}</strong>
              </Text>
            ) : null}

            <Box maxW="360px">
              <FormInput
                label="Nome de exibição (opcional)"
                value={name}
                placeholder="Atendimento"
                onChange={(e) => setName(e.target.value)}
              />
            </Box>

            <Box maxW="260px">
              <FormSelect
                label="Visibilidade"
                value={type}
                onChange={(e) =>
                  setType(e.currentTarget.value === "personal" ? "personal" : "shared")
                }
                options={[
                  { value: "shared", label: "Compartilhada (toda a equipe)" },
                  { value: "personal", label: "Pessoal (atendentes específicos)" },
                ]}
              />
            </Box>

            {type === "personal" ? (
              <Box>
                <Text fontSize="sm" fontWeight="600" mb={2}>
                  Quem enxerga esta caixa
                </Text>
                {users.length === 0 ? (
                  <Text fontSize="sm" color="var(--admin-text-soft)">
                    Nenhum atendente cadastrado.
                  </Text>
                ) : (
                  <Stack gap={1}>
                    {users.map((u) => (
                      <label
                        key={u.id}
                        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                      >
                        <input
                          type="checkbox"
                          checked={assigned.includes(u.id)}
                          onChange={() => toggleAssigned(u.id)}
                        />
                        <Text fontSize="sm">
                          {u.name ?? u.email}{" "}
                          <Text as="span" color="var(--admin-text-soft)">
                            ({u.email})
                          </Text>
                        </Text>
                      </label>
                    ))}
                  </Stack>
                )}
              </Box>
            ) : null}

            {err && (
              <Text color="red.600" fontSize="sm">
                {err}
              </Text>
            )}
            {msg && (
              <Text color="green.600" fontSize="sm">
                {msg}
              </Text>
            )}

            <HStack justify="flex-end">
              <Button
                tone="primary"
                onClick={create}
                loading={pending}
                disabled={!localPart.trim() || domainId === ""}
              >
                Criar conta
              </Button>
            </HStack>
          </Stack>
        )}

        {accounts.length > 0 ? (
          <DataTable
            columns={[
              { key: "address", header: "Endereço", render: (a: MailAccountRow) => <Text fontWeight="600">{a.address}</Text> },
              { key: "name", header: "Nome", render: (a: MailAccountRow) => <Text>{a.name ?? "—"}</Text> },
              {
                key: "vis",
                header: "Visibilidade",
                render: (a: MailAccountRow) =>
                  a.type === "shared" ? (
                    <Tag bg="rgba(59,130,246,0.12)" color="#1d4ed8">compartilhada</Tag>
                  ) : (
                    <Tag bg="rgba(168,85,247,0.12)" color="#7c3aed">
                      pessoal ({a.assignedUserIds.map(userLabel).join(", ") || "ninguém"})
                    </Tag>
                  ),
              },
              {
                key: "status",
                header: "Status",
                render: (a: MailAccountRow) => (
                  <Tag
                    bg={a.active ? "rgba(34,197,94,0.12)" : "rgba(100,116,139,0.14)"}
                    color={a.active ? "#15803d" : "#475569"}
                  >
                    {a.active ? "ativa" : "inativa"}
                  </Tag>
                ),
              },
            ]}
            rows={accounts}
            getRowKey={(a) => a.id}
            fillHeight={false}
            actions={(a) => (
              <>
                <Button size="xs" tone="outline" onClick={() => toggle(a.id, !a.active)} loading={pending}>
                  {a.active ? "Desativar" : "Ativar"}
                </Button>
                <Button size="xs" tone="ghost" color="#dc2626" onClick={() => remove(a.id, a.address)} loading={pending}>
                  <Trash2 size={13} />
                </Button>
              </>
            )}
          />
        ) : null}
      </Stack>
      {confirmDialog}
    </Card>
  );
}

// ============================================================
// Caixa (recebidos / enviados + leitura + compor/responder)
// ============================================================

function Mailbox({
  accounts,
  messages,
  defaultAccountId,
  folders,
  aiSettings,
  isAdmin,
  callbacks,
  onGoSettings,
}: {
  accounts: MailInboxAccount[];
  messages: MailMessage[];
  defaultAccountId?: string;
  folders: MailFolder[];
  aiSettings?: MailAiSettings;
  isAdmin: boolean;
  callbacks: MailCallbacks;
  onGoSettings?: () => void;
}) {
  const [pending, start] = useTransition();
  const ALL = "__all__";
  // Conta principal acessível (se houver) — é onde a caixa abre e o "De:" padrão.
  const primaryId =
    defaultAccountId && accounts.some((a) => a.id === defaultAccountId) ? defaultAccountId : null;
  const [accountId, setAccountId] = useState<string>(
    primaryId ?? (accounts.length > 1 ? ALL : (accounts[0]?.id ?? "")),
  );
  // Navegação: "inbox" | "sent" | "spam" | "c:<slug>" (pasta inteligente).
  const [sel, setSel] = useState<string>("inbox");
  const catSlug = sel.startsWith("c:") ? sel.slice(2) : null;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compose, setCompose] = useState<null | ComposeState>(null);
  // Modal de criar/renomear pasta (só admin com onCreateFolder).
  const [folderModal, setFolderModal] = useState<
    null | { mode: "create" } | { mode: "rename"; slug: string; name: string }
  >(null);

  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  function doSync() {
    start(async () => {
      setSyncMsg(null);
      const r = await callbacks.onSync();
      if (r.ok) {
        setSyncMsg(r.data && r.data.synced > 0 ? `+${r.data.synced} nova(s)` : "Em dia");
        callbacks.onRefresh();
      } else {
        setSyncMsg(r.error);
      }
    });
  }

  const account = accounts.find((a) => a.id === accountId) ?? null;
  const isAll = accountId === ALL;

  const accountMessages = useMemo(
    () => (isAll ? messages : messages.filter((m) => m.accountId === accountId)),
    [messages, accountId, isAll],
  );
  // Spam e Lixeira são caixas fixas (sempre visíveis). hasGmail só ajusta a dica de
  // sincronização (o Gmail traz o Spam da conta; no Resend o Spam é manual).
  const currentAccounts = isAll ? accounts : accounts.filter((a) => a.id === accountId);
  const hasGmail = currentAccounts.some((a) => a.provider === "gmail");

  // Slugs de pasta conhecidos — separa "classificado" de "solto na caixa".
  const knownSlugs = useMemo(() => new Set(folders.map((f) => f.slug)), [folders]);
  const isClassified = (m: MailMessage) => !!(m.category && knownSlugs.has(m.category));

  // Caixa fixa "em foco" (categoria = sempre dentro de Recebidos).
  const activeFolder: Folder = catSlug
    ? "inbox"
    : sel === "sent"
      ? "sent"
      : sel === "spam"
        ? "spam"
        : sel === "trash"
          ? "trash"
          : "inbox";
  const currentFolder = catSlug ? (folders.find((f) => f.slug === catSlug) ?? null) : null;
  // Se a pasta selecionada sumiu (removida), cai na caixa de entrada.
  const catMissing = catSlug !== null && !currentFolder;

  const folderMessages = useMemo(() => {
    let list: MailMessage[];
    if (catSlug && !catMissing) {
      list = accountMessages.filter((m) => mailboxOf(m) === "inbox" && m.category === catSlug);
    } else if (activeFolder === "inbox") {
      // Caixa de entrada = recebidos que NÃO estão numa pasta inteligente conhecida.
      list = accountMessages.filter((m) => mailboxOf(m) === "inbox" && !isClassified(m));
    } else {
      list = accountMessages.filter((m) => mailboxOf(m) === activeFolder);
    }
    return list.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountMessages, activeFolder, catSlug, catMissing, knownSlugs]);

  /** Não-lidas por conta (para o seletor) + total — só a Caixa de entrada (exclui spam). */
  const unreadByAccount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of messages) if (mailboxOf(m) === "inbox" && !m.read) map[m.accountId] = (map[m.accountId] ?? 0) + 1;
    return map;
  }, [messages]);
  // Não-lidas da Caixa de entrada = recebidas não-lidas AINDA soltas (sem pasta).
  const unreadCount = accountMessages.filter(
    (m) => mailboxOf(m) === "inbox" && !m.read && !isClassified(m),
  ).length;
  const spamUnread = accountMessages.filter((m) => mailboxOf(m) === "spam" && !m.read).length;
  // Contagem por pasta inteligente (não-lidas p/ o badge; total p/ o resumo).
  const catCounts = useMemo(() => {
    const unread: Record<string, number> = {};
    const total: Record<string, number> = {};
    for (const m of accountMessages) {
      if (mailboxOf(m) !== "inbox" || !isClassified(m)) continue;
      const s = m.category as string;
      total[s] = (total[s] ?? 0) + 1;
      if (!m.read) unread[s] = (unread[s] ?? 0) + 1;
    }
    return { unread, total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountMessages, knownSlugs]);
  const selected = folderMessages.find((m) => m.id === selectedId) ?? null;

  function openMessage(m: MailMessage) {
    setSelectedId(m.id);
    if (m.direction === "inbound" && !m.read) {
      start(async () => {
        await callbacks.onMarkRead(m.id, true);
        callbacks.onRefresh();
      });
    }
  }

  // "De:" padrão ao escrever: a conta em foco, ou a principal quando em "Todas".
  const composeDefaultId = isAll ? (primaryId ?? accounts[0]?.id ?? "") : accountId;

  function startCompose() {
    setSelectedId(null);
    setCompose({
      fromAccountId: composeDefaultId,
      to: "", cc: "", subject: "", html: "", inReplyTo: null, threadId: null, attachments: [],
    });
  }

  function startReply(m: MailMessage) {
    const replyTo = m.direction === "inbound" ? m.fromAddress : m.toAddresses[0] ?? "";
    const subj = m.subject ?? "";
    // Rascunho da IA (se houver) pré-preenche o corpo — texto puro vira HTML simples.
    const draft = (m.aiDraft ?? "").trim();
    const html = draft
      ? draft.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`).join("")
      : "";
    setCompose({
      // responde PELA conta que recebeu (ou a principal/atual, se enviado)
      fromAccountId: m.accountId || composeDefaultId,
      to: replyTo,
      cc: "",
      subject: subj.toLowerCase().startsWith("re:") ? subj : `Re: ${subj}`,
      html,
      inReplyTo: m.resendId ?? m.inReplyTo ?? null,
      threadId: m.threadId ?? m.resendId ?? null,
      attachments: [],
    });
  }

  // ── Pastas inteligentes: mover mensagem, criar/renomear/remover pasta ──
  function moveTo(m: MailMessage, slug: string | null) {
    if (!callbacks.onMoveToFolder) return;
    start(async () => {
      const r = await callbacks.onMoveToFolder!(m.id, slug);
      if (r.ok) {
        setSelectedId(null);
        callbacks.onRefresh();
      }
    });
  }

  // Move p/ caixa fixa: Recebidos / Spam / Lixeira (marcar como spam, restaurar, etc.).
  function setMailbox(m: MailMessage, mailbox: "inbox" | "spam" | "trash") {
    if (!callbacks.onSetMailbox) return;
    start(async () => {
      const r = await callbacks.onSetMailbox!(m.id, mailbox);
      if (r.ok) {
        setSelectedId(null);
        callbacks.onRefresh();
      }
    });
  }

  const [folderErr, setFolderErr] = useState<string | null>(null);
  function submitFolder(name: string) {
    const clean = name.trim();
    if (!clean) return;
    const modal = folderModal;
    if (!modal) return;
    start(async () => {
      setFolderErr(null);
      const r =
        modal.mode === "create"
          ? await callbacks.onCreateFolder?.(clean)
          : await callbacks.onRenameFolder?.(modal.slug, clean);
      if (r?.ok) {
        setFolderModal(null);
        callbacks.onRefresh();
      } else {
        setFolderErr(r?.error ?? "Não foi possível salvar a pasta.");
      }
    });
  }
  function removeFolder(slug: string) {
    start(async () => {
      const r = await callbacks.onRemoveFolder?.(slug);
      if (r?.ok) {
        if (catSlug === slug) setSel("inbox");
        callbacks.onRefresh();
      }
    });
  }

  if (!accounts.length) {
    return (
      <Box
        borderRadius="16px"
        borderWidth="1px"
        borderColor="var(--admin-border)"
        bg="var(--admin-surface)"
      >
        <EmptyState
          icon={Mail}
          title="Nenhuma conta disponível"
          description={
            onGoSettings
              ? "Crie uma conta de e-mail em Configurações para começar."
              : "Assim que o administrador criar uma conta, sua caixa aparecerá aqui."
          }
          action={
            onGoSettings ? (
              <Button tone="outline" onClick={onGoSettings}>
                Ir para Configurações
              </Button>
            ) : undefined
          }
        />
      </Box>
    );
  }

  return (
    <>
    <Flex
      borderWidth="1px"
      borderColor="var(--admin-border)"
      borderRadius="16px"
      overflow="hidden"
      bg="var(--admin-surface)"
      minH={{ base: "560px", md: 0 }}
      flex={{ md: "1" }}
      direction={{ base: "column", md: "row" }}
    >
      {/* Sidebar */}
      <Stack
        w={{ base: "100%", md: "232px" }}
        flexShrink={0}
        borderRightWidth={{ md: "1px" }}
        borderColor="var(--admin-border)"
        p={4}
        gap={4}
        bg="var(--admin-surface-2)"
      >
        <Button tone="primary" borderRadius="12px" onClick={startCompose}>
          <PenLine size={16} /> Escrever
        </Button>

        {accounts.length > 1 ? (
          <FormSelect
            value={accountId}
            onChange={(e) => {
              setAccountId(e.currentTarget.value);
              setSelectedId(null);
            }}
            options={[
              { value: ALL, label: `📥 Todas as contas${Object.values(unreadByAccount).reduce((a, b) => a + b, 0) ? ` (${Object.values(unreadByAccount).reduce((a, b) => a + b, 0)})` : ""}` },
              ...accounts.map((a) => ({
                value: a.id,
                label: `${a.id === primaryId ? "★ " : ""}${a.address}${unreadByAccount[a.id] ? ` (${unreadByAccount[a.id]})` : ""}`,
              })),
            ]}
          />
        ) : (
          <Box px={3} py={2.5} borderRadius="10px" bg="var(--admin-surface)" borderWidth="1px" borderColor="var(--admin-border)">
            <Text fontSize="sm" fontWeight="700" lineHeight="1.2" truncate>
              {(account ?? accounts[0]).name ?? (account ?? accounts[0]).address.split("@")[0]}
            </Text>
            <Text fontSize="xs" color="var(--admin-text-soft)" truncate title={(account ?? accounts[0]).address}>
              {(account ?? accounts[0]).address}
            </Text>
          </Box>
        )}

        <Stack gap={1}>
          <FolderButton
            active={sel === "inbox"}
            onClick={() => { setSel("inbox"); setSelectedId(null); }}
            icon={<Inbox size={16} />}
            label="Recebidos"
            count={unreadCount}
          />
          <FolderButton
            active={sel === "sent"}
            onClick={() => { setSel("sent"); setSelectedId(null); }}
            icon={<Send size={16} />}
            label="Enviados"
          />
          <FolderButton
            active={sel === "spam"}
            onClick={() => { setSel("spam"); setSelectedId(null); }}
            icon={<ShieldAlert size={16} />}
            label="Spam"
            count={spamUnread}
          />
          <FolderButton
            active={sel === "trash"}
            onClick={() => { setSel("trash"); setSelectedId(null); }}
            icon={<Trash2 size={16} />}
            label="Lixeira"
          />
        </Stack>

        {/* Pastas inteligentes (categorias por assunto). Só aparecem quando a
            superfície passa `folders` — a IA/regras distribuem os recebidos aqui. */}
        {folders.length ? (
          <Stack gap={1}>
            <Text
              px={3}
              fontSize="2xs"
              fontWeight="800"
              letterSpacing="0.06em"
              textTransform="uppercase"
              color="var(--admin-text-soft)"
            >
              Pastas
            </Text>
            {folders.map((f) => (
              <FolderButton
                key={f.slug}
                active={catSlug === f.slug}
                onClick={() => { setSel(`c:${f.slug}`); setSelectedId(null); }}
                icon={<FolderIcon size={16} color={f.color ?? undefined} />}
                label={f.name}
                count={catCounts.unread[f.slug] ?? 0}
              />
            ))}
            {callbacks.onCreateFolder ? (
              <HStack
                as="button"
                onClick={() => { setFolderErr(null); setFolderModal({ mode: "create" }); }}
                w="100%"
                px={3}
                py={2}
                borderRadius="10px"
                color="var(--admin-text-soft)"
                fontWeight="500"
                _hover={{ bg: "var(--admin-surface)", color: "var(--admin-primary)" }}
                cursor="pointer"
                gap={2}
              >
                <Plus size={16} />
                <Text fontSize="sm">Nova pasta</Text>
              </HStack>
            ) : null}
          </Stack>
        ) : null}
      </Stack>

      {/* Lista de mensagens */}
      <Stack
        w={{ base: "100%", md: "340px" }}
        flexShrink={0}
        borderRightWidth={{ md: "1px" }}
        borderColor="var(--admin-border)"
        gap={0}
        display={{ base: selected || compose ? "none" : "flex", md: "flex" }}
        maxH={{ base: "560px", md: "100%" }}
        overflowY="auto"
      >
        <HStack justify="space-between" px={4} py={3} borderBottomWidth="1px" borderColor="var(--admin-border)" gap={2}>
          <HStack gap={2} minW={0}>
            <Text fontWeight="700" fontSize="sm" truncate>
              {currentFolder ? currentFolder.name : FOLDER_LABEL[activeFolder]}
            </Text>
            {currentFolder && (catCounts.total[currentFolder.slug] ?? 0) > 0 ? (
              <Text fontSize="2xs" color="var(--admin-text-soft)" flexShrink={0}>
                {catCounts.total[currentFolder.slug]}
              </Text>
            ) : null}
          </HStack>
          <HStack gap={1} flexShrink={0}>
            {syncMsg ? (
              <Text fontSize="2xs" color="var(--admin-text-soft)">{syncMsg}</Text>
            ) : null}
            {currentFolder && (callbacks.onRenameFolder || callbacks.onRemoveFolder) ? (
              <ActionMenu
                label=""
                size="xs"
                tone="ghost"
                icon={<Settings size={14} />}
                items={[
                  ...(callbacks.onRenameFolder
                    ? [{
                        label: "Renomear pasta",
                        icon: <PenLine size={14} />,
                        onClick: () => { setFolderErr(null); setFolderModal({ mode: "rename", slug: currentFolder.slug, name: currentFolder.name }); },
                      }]
                    : []),
                  ...(callbacks.onRemoveFolder && !currentFolder.system
                    ? [{
                        label: "Excluir pasta",
                        icon: <Trash2 size={14} />,
                        danger: true,
                        onClick: () => removeFolder(currentFolder.slug),
                      }]
                    : []),
                ]}
              />
            ) : null}
            <IconButton
              aria-label="Buscar novos e-mails"
              title="Buscar novos e-mails"
              size="xs"
              variant="ghost"
              onClick={activeFolder === "sent" ? callbacks.onRefresh : doSync}
              loading={pending}
            >
              <RefreshCw size={14} />
            </IconButton>
          </HStack>
        </HStack>

        {folderMessages.length === 0 ? (
          currentFolder ? (
            <Stack p={6} gap={2} align="flex-start">
              <Text fontSize="sm" color="var(--admin-text-soft)">
                Nenhum e-mail nesta pasta ainda.
              </Text>
              <Text fontSize="2xs" color="var(--admin-text-soft)" lineHeight="1.6">
                A IA move pra cá os recebidos deste tema conforme chegam. Você também
                pode mover manualmente pelo botão “Mover para” ao abrir um e-mail.
              </Text>
            </Stack>
          ) : (
            <Stack p={6} gap={3} align="flex-start">
              <Text fontSize="sm" color="var(--admin-text-soft)">
                {activeFolder === "inbox"
                  ? "Nenhuma mensagem recebida ainda."
                  : activeFolder === "spam"
                    ? "Nenhuma mensagem marcada como spam."
                    : activeFolder === "trash"
                      ? "A Lixeira está vazia."
                      : "Nenhuma mensagem enviada ainda."}
              </Text>
              {activeFolder === "inbox" || activeFolder === "spam" ? (
                <>
                  <Button size="xs" tone="outline" borderRadius="8px" onClick={doSync} loading={pending}>
                    <RefreshCw size={13} /> Buscar novos
                  </Button>
                  <Text fontSize="2xs" color="var(--admin-text-soft)" lineHeight="1.6">
                    {hasGmail
                      ? "Sincroniza os Recebidos e o Spam da conta Google conectada."
                      : "Para receber, ative o recebimento (inbound) do domínio nas Configurações."}
                  </Text>
                </>
              ) : null}
            </Stack>
          )
        ) : (
          folderMessages.map((m) => {
            const who = activeFolder === "sent"
              ? m.toAddresses.join(", ")
              : displayName(m.fromAddress, m.fromName);
            const unread = m.direction === "inbound" && !m.read;
            // Etiqueta da pasta — só na Caixa de entrada "misturada" não faz sentido
            // (lá é tudo não-classificado); mostra em "Todas as contas" e afins.
            const cat = m.category && knownSlugs.has(m.category)
              ? folders.find((f) => f.slug === m.category)
              : null;
            return (
              <Box
                key={m.id}
                onClick={() => openMessage(m)}
                cursor="pointer"
                pl={6}
                pr={4}
                py={3.5}
                borderBottomWidth="1px"
                borderColor="var(--admin-border)"
                bg={selectedId === m.id ? "var(--admin-surface-2)" : "transparent"}
                _hover={{ bg: "var(--admin-surface-2)" }}
                position="relative"
                overflow="hidden"
              >
                {unread ? (
                  <Box position="absolute" left="8px" top="50%" transform="translateY(-50%)" w="7px" h="7px" borderRadius="full" bg="var(--admin-primary)" />
                ) : null}
                <Stack gap={1} minW={0}>
                  <HStack justify="space-between" gap={2} minW={0}>
                    <Text fontSize="sm" fontWeight={unread ? "800" : "600"} truncate flex="1" minW={0} lineHeight="1.3">
                      {who}
                    </Text>
                    <Text fontSize="xs" color="var(--admin-text-soft)" flexShrink={0} lineHeight="1.3">
                      {fmtDate(m.date)}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight={unread ? "700" : "500"} truncate minW={0} lineHeight="1.35">
                    {m.subject || "(sem assunto)"}
                  </Text>
                  <HStack gap={2} minW={0}>
                    {cat && !currentFolder ? (
                      <Box
                        flexShrink={0}
                        px={1.5}
                        py="1px"
                        borderRadius="5px"
                        fontSize="2xs"
                        fontWeight="700"
                        bg={`${cat.color ?? "#64748b"}1a`}
                        color={cat.color ?? "#64748b"}
                      >
                        {cat.name}
                      </Box>
                    ) : null}
                    <Text fontSize="xs" color="var(--admin-text-soft)" truncate flex="1" minW={0} lineHeight="1.4">
                      {snippet(m)}
                    </Text>
                  </HStack>
                </Stack>
              </Box>
            );
          })
        )}
      </Stack>

      {/* Leitura / composição */}
      <Box flex="1" minW={0} display={{ base: selected || compose ? "block" : "none", md: "block" }}>
        {compose ? (
          <Composer
            accounts={accounts}
            compose={compose}
            setCompose={setCompose}
            pending={pending}
            start={start}
            onSend={callbacks.onSend}
            onUploadAttachment={callbacks.onUploadAttachment}
            onSent={() => { setCompose(null); callbacks.onRefresh(); }}
          />
        ) : selected ? (
          <MessageView
            message={selected}
            folders={folders}
            mailbox={mailboxOf(selected)}
            onBack={() => setSelectedId(null)}
            onReply={() => startReply(selected)}
            onMove={callbacks.onMoveToFolder ? (slug) => moveTo(selected, slug) : undefined}
            onSetMailbox={callbacks.onSetMailbox ? (mb) => setMailbox(selected, mb) : undefined}
          />
        ) : (
          <InboxOverview
            unreadCount={unreadCount}
            totalInbox={accountMessages.filter((m) => mailboxOf(m) === "inbox").length}
            folders={folders}
            catCounts={catCounts}
            syncMsg={syncMsg}
            organize={aiSettings?.organize}
            onOpenFolder={(slug) => { setSel(`c:${slug}`); setSelectedId(null); }}
            onSync={doSync}
            pending={pending}
          />
        )}
      </Box>
    </Flex>

      {/* Modal criar/renomear pasta */}
      {folderModal ? (
        <FolderNameModal
          mode={folderModal.mode}
          initial={folderModal.mode === "rename" ? folderModal.name : ""}
          error={folderErr}
          pending={pending}
          onCancel={() => { setFolderModal(null); setFolderErr(null); }}
          onSubmit={submitFolder}
        />
      ) : null}
    </>
  );
}

/** Resumo da caixa (painel de leitura vazio) — visão geral em vez do texto seco. */
function InboxOverview({
  unreadCount,
  totalInbox,
  folders,
  catCounts,
  syncMsg,
  organize,
  onOpenFolder,
  onSync,
  pending,
}: {
  unreadCount: number;
  totalInbox: number;
  folders: MailFolder[];
  catCounts: { unread: Record<string, number>; total: Record<string, number> };
  syncMsg: string | null;
  organize?: boolean;
  onOpenFolder: (slug: string) => void;
  onSync: () => void;
  pending: boolean;
}) {
  return (
    <Flex h="100%" minH="400px" align="center" justify="center" p={{ base: 6, md: 10 }}>
      <Stack gap={6} maxW="440px" w="100%" align="stretch">
        <Stack gap={1} align="center" textAlign="center">
          <Icon as={Inbox} boxSize={8} color="var(--admin-primary)" />
          <Text fontWeight="800" fontSize="lg">Sua caixa de entrada</Text>
          <Text fontSize="sm" color="var(--admin-text-soft)">
            {unreadCount > 0
              ? `${unreadCount} não lida${unreadCount > 1 ? "s" : ""} · ${totalInbox} recebida${totalInbox === 1 ? "" : "s"}`
              : `Tudo em dia · ${totalInbox} recebida${totalInbox === 1 ? "" : "s"}`}
          </Text>
        </Stack>

        {folders.length ? (
          <Stack gap={2}>
            <Text fontSize="2xs" fontWeight="800" letterSpacing="0.06em" textTransform="uppercase" color="var(--admin-text-soft)">
              Pastas
            </Text>
            <Box display="grid" gridTemplateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap={2}>
              {folders.map((f) => {
                const total = catCounts.total[f.slug] ?? 0;
                const unread = catCounts.unread[f.slug] ?? 0;
                return (
                  <HStack
                    key={f.slug}
                    as="button"
                    onClick={() => onOpenFolder(f.slug)}
                    gap={2}
                    px={3}
                    py={2.5}
                    borderRadius="12px"
                    borderWidth="1px"
                    borderColor="var(--admin-border)"
                    bg="var(--admin-surface)"
                    _hover={{ borderColor: "var(--admin-primary)" }}
                    cursor="pointer"
                    justify="space-between"
                    textAlign="left"
                  >
                    <HStack gap={2} minW={0}>
                      <FolderIcon size={15} color={f.color ?? undefined} />
                      <Text fontSize="sm" fontWeight="600" truncate>{f.name}</Text>
                    </HStack>
                    <Text fontSize="xs" color={unread ? "var(--admin-primary)" : "var(--admin-text-soft)"} fontWeight={unread ? "800" : "500"} flexShrink={0}>
                      {unread ? unread : total || ""}
                    </Text>
                  </HStack>
                );
              })}
            </Box>
          </Stack>
        ) : null}

        <Stack gap={2} align="center">
          <Button size="sm" tone="outline" borderRadius="10px" onClick={onSync} loading={pending}>
            <RefreshCw size={14} /> Buscar novos
          </Button>
          <Text fontSize="2xs" color="var(--admin-text-soft)" textAlign="center" lineHeight="1.6">
            {syncMsg ? `${syncMsg} · ` : ""}
            {organize === false
              ? "Organização por IA desligada — ligue no botão “IA” do topo."
              : folders.length
                ? "Selecione um e-mail à esquerda para ler. A IA organiza os recebidos nas pastas."
                : "Selecione um e-mail à esquerda para ler."}
          </Text>
        </Stack>
      </Stack>
    </Flex>
  );
}

/** Modalzinho de nome de pasta (criar/renomear). */
function FolderNameModal({
  mode,
  initial,
  error,
  pending,
  onCancel,
  onSubmit,
}: {
  mode: "create" | "rename";
  initial: string;
  error: string | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  return (
    <Modal
      open
      onClose={onCancel}
      title={mode === "create" ? "Nova pasta" : "Renomear pasta"}
      size="sm"
      footer={
        <>
          <Button tone="ghost" onClick={onCancel} disabled={pending}>Cancelar</Button>
          <Button tone="primary" onClick={() => onSubmit(name)} loading={pending} disabled={!name.trim()}>
            {mode === "create" ? "Criar" : "Salvar"}
          </Button>
        </>
      }
    >
      <FormInput
        label="Nome da pasta"
        value={name}
        autoFocus
        placeholder="Ex.: Parceiros"
        error={error ?? undefined}
        onChange={(e) => setName(e.currentTarget.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSubmit(name); }}
      />
    </Modal>
  );
}

function FolderButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <HStack
      as="button"
      onClick={onClick}
      w="100%"
      px={3}
      py={2}
      borderRadius="10px"
      bg={active ? "var(--admin-surface)" : "transparent"}
      color={active ? "var(--admin-primary)" : "var(--admin-text-soft)"}
      fontWeight={active ? "700" : "500"}
      _hover={{ bg: "var(--admin-surface)" }}
      justify="space-between"
      cursor="pointer"
    >
      <HStack gap={2}>
        {icon}
        <Text fontSize="sm">{label}</Text>
      </HStack>
      {count ? (
        <Tag bg="var(--admin-primary)" color="white">
          {count}
        </Tag>
      ) : null}
    </HStack>
  );
}

function MessageView({
  message,
  folders,
  mailbox,
  onBack,
  onReply,
  onMove,
  onSetMailbox,
}: {
  message: MailMessage;
  folders: MailFolder[];
  mailbox?: Folder;
  onBack: () => void;
  onReply: () => void;
  onMove?: (slug: string | null) => void;
  onSetMailbox?: (mailbox: "inbox" | "spam" | "trash") => void;
}) {
  const attachments = message.attachments ?? [];
  const mb: Folder = mailbox ?? mailboxOf(message);
  const inInbox = mb === "inbox";
  // Mover pra PASTA só faz sentido nos Recebidos (não em Spam/Lixeira/Enviados).
  const canMove = !!onMove && message.direction === "inbound" && folders.length > 0 && inInbox;
  const curCat = message.category && folders.some((f) => f.slug === message.category)
    ? message.category
    : null;
  // Ações de caixa fixa (marcar spam / mandar p/ lixeira / restaurar) — dependem de onde está.
  const canMailbox = !!onSetMailbox && message.direction === "inbound";
  const mailboxItems = !canMailbox
    ? []
    : mb === "trash"
      ? [{ label: "Restaurar para Recebidos", icon: <Inbox size={14} />, onClick: () => onSetMailbox!("inbox") }]
      : mb === "spam"
        ? [
            { label: "Não é spam", icon: <Inbox size={14} />, onClick: () => onSetMailbox!("inbox") },
            { label: "Mover para Lixeira", icon: <Trash2 size={14} />, danger: true, onClick: () => onSetMailbox!("trash") },
          ]
        : [
            { label: "Marcar como spam", icon: <ShieldAlert size={14} />, onClick: () => onSetMailbox!("spam") },
            { label: "Mover para Lixeira", icon: <Trash2 size={14} />, danger: true, onClick: () => onSetMailbox!("trash") },
          ];
  const folderItems = !canMove
    ? []
    : [
        ...folders.map((f) => ({
          label: f.slug === curCat ? `${f.name} ✓` : f.name,
          icon: <FolderIcon size={14} color={f.color ?? undefined} />,
          onClick: () => onMove!(f.slug === curCat ? null : f.slug),
        })),
        ...(curCat
          ? [{ label: "Tirar da pasta", icon: <Inbox size={14} />, onClick: () => onMove!(null) }]
          : []),
      ];
  const menuItems = [...folderItems, ...mailboxItems];
  return (
    <Stack gap={0} h="100%">
      <HStack justify="space-between" px={5} py={4} borderBottomWidth="1px" borderColor="var(--admin-border)" gap={3}>
        <HStack gap={2} minW={0}>
          <IconButton aria-label="Voltar" size="xs" variant="ghost" display={{ md: "none" }} onClick={onBack}>
            <ArrowLeft size={16} />
          </IconButton>
          <Text fontWeight="800" fontSize="md" truncate>
            {message.subject || "(sem assunto)"}
          </Text>
        </HStack>
        <HStack gap={2} flexShrink={0}>
          {menuItems.length ? (
            <ActionMenu
              label="Mover"
              size="sm"
              tone="ghost"
              icon={<FolderIcon size={14} />}
              items={menuItems}
            />
          ) : null}
          <Button size="sm" tone="outline" onClick={onReply}>
            <Reply size={14} /> Responder
          </Button>
        </HStack>
      </HStack>

      {message.aiRepliedAt ? (
        <HStack px={5} py={2} bg="rgba(37,99,235,0.06)" borderBottomWidth="1px" borderColor="var(--admin-border)" gap={2}>
          <Icon as={Sparkles} boxSize={3.5} color="var(--admin-primary)" />
          <Text fontSize="2xs" color="var(--admin-text-soft)">
            Respondido automaticamente pela IA em {new Date(message.aiRepliedAt).toLocaleString("pt-BR")}
          </Text>
        </HStack>
      ) : null}

      <Box px={5} py={3} borderBottomWidth="1px" borderColor="var(--admin-border)">
        <HStack justify="space-between" flexWrap="wrap" gap={1}>
          <Text fontSize="sm" fontWeight="700">
            {displayName(message.fromAddress, message.fromName)}
          </Text>
          <Text fontSize="xs" color="var(--admin-text-soft)">
            {new Date(message.date).toLocaleString("pt-BR")}
          </Text>
        </HStack>
        <Text fontSize="xs" color="var(--admin-text-soft)">
          para: {message.toAddresses.join(", ") || "—"}
          {message.ccAddresses.length ? ` · cc: ${message.ccAddresses.join(", ")}` : ""}
        </Text>
      </Box>

      <Box flex="1" overflowY="auto" p={message.bodyHtml ? 0 : 5}>
        <EmailHtmlView html={message.bodyHtml} text={message.bodyText} minHeight={360} />
      </Box>

      {attachments.length ? (
        <Box px={5} py={3} borderTopWidth="1px" borderColor="var(--admin-border)">
          <Text fontSize="xs" fontWeight="700" color="var(--admin-text-soft)" mb={2}>
            Anexos
          </Text>
          <HStack gap={2} flexWrap="wrap">
            {attachments.map((a, i) =>
              a.url ? (
                <chakra.a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  fontSize="xs"
                  px={3}
                  py={2}
                  borderRadius="8px"
                  borderWidth="1px"
                  borderColor="var(--admin-border)"
                  _hover={{ bg: "var(--admin-surface-2)" }}
                >
                  {a.filename}
                </chakra.a>
              ) : (
                <Tag key={i} bg="var(--admin-surface-2)" color="var(--admin-text-soft)">
                  {a.filename}
                </Tag>
              ),
            )}
          </HStack>
        </Box>
      ) : null}
    </Stack>
  );
}

function Composer({
  accounts,
  compose,
  setCompose,
  pending,
  start,
  onSend,
  onUploadAttachment,
  onSent,
}: {
  accounts: MailInboxAccount[];
  compose: ComposeState;
  setCompose: React.Dispatch<React.SetStateAction<null | ComposeState>>;
  pending: boolean;
  start: (cb: () => void | Promise<void>) => void;
  onSend: MailCallbacks["onSend"];
  onUploadAttachment?: MailCallbacks["onUploadAttachment"];
  onSent: () => void;
}) {
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const from = accounts.find((a) => a.id === compose.fromAccountId) ?? accounts[0] ?? null;

  function patch(p: Partial<ComposeState>) {
    setCompose((c) => (c ? { ...c, ...p } : c));
  }

  async function onPickFiles(files: FileList | null) {
    if (!files?.length || !onUploadAttachment) return;
    setErr(null);
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) { setErr(`"${file.name}" passa de 20MB.`); continue; }
      const r = await onUploadAttachment(file);
      if (r.ok) setCompose((c) => (c ? { ...c, attachments: [...c.attachments, { filename: r.filename, url: r.url }] } : c));
      else setErr(r.error);
    }
    setUploading(false);
  }

  function removeAttachment(i: number) {
    patch({ attachments: compose.attachments.filter((_, j) => j !== i) });
  }

  function send() {
    setErr(null);
    if (!from) { setErr("Selecione a conta remetente."); return; }
    start(async () => {
      const r = await onSend({
        accountId: from.id,
        to: compose.to,
        cc: compose.cc,
        subject: compose.subject,
        html: compose.html ? compose.html.replace(/\n/g, "<br/>") : "",
        inReplyTo: compose.inReplyTo,
        threadId: compose.threadId,
        attachments: compose.attachments,
      });
      if (r.ok) onSent();
      else setErr(r.error);
    });
  }

  return (
    <Stack gap={0} h="100%">
      <HStack justify="space-between" px={5} py={4} borderBottomWidth="1px" borderColor="var(--admin-border)">
        <Text fontWeight="800" fontSize="md">
          {compose.inReplyTo ? "Responder" : "Nova mensagem"}
        </Text>
        <IconButton aria-label="Fechar" size="xs" variant="ghost" onClick={() => setCompose(null)}>
          <X size={16} />
        </IconButton>
      </HStack>

      <Stack gap={3} p={5} flex="1" overflowY="auto">
        {accounts.length > 1 ? (
          <FormSelect
            value={compose.fromAccountId}
            onChange={(e) => patch({ fromAccountId: e.currentTarget.value })}
            options={accounts.map((a) => ({ value: a.id, label: `De: ${a.name ? `${a.name} <${a.address}>` : a.address}` }))}
          />
        ) : (
          <Text fontSize="xs" color="var(--admin-text-soft)">
            De: <strong>{from ? (from.name ? `${from.name} <${from.address}>` : from.address) : "—"}</strong>
          </Text>
        )}
        <FormInput placeholder="Para (separe múltiplos por vírgula)" value={compose.to} onChange={(e) => patch({ to: e.target.value })} />
        <FormInput placeholder="Cc (opcional)" value={compose.cc} onChange={(e) => patch({ cc: e.target.value })} />
        <FormInput placeholder="Assunto" value={compose.subject} onChange={(e) => patch({ subject: e.target.value })} />
        <FormTextarea placeholder="Escreva sua mensagem..." value={compose.html} onChange={(e) => patch({ html: e.target.value })} rows={12} resize="vertical" />

        {compose.attachments.length ? (
          <HStack gap={2} flexWrap="wrap">
            {compose.attachments.map((a, i) => (
              <HStack key={i} gap={1.5} px={3} py={1.5} borderRadius="8px" borderWidth="1px" borderColor="var(--admin-border)" bg="var(--admin-surface-2)">
                <Paperclip size={13} />
                <Text fontSize="xs" maxW="180px" truncate>{a.filename}</Text>
                <Box as="button" onClick={() => removeAttachment(i)} color="var(--admin-text-soft)" _hover={{ color: "red.500" }} aria-label="Remover">
                  <X size={13} />
                </Box>
              </HStack>
            ))}
          </HStack>
        ) : null}

        {err ? <Text color="red.600" fontSize="sm">{err}</Text> : null}
      </Stack>

      <HStack justify="space-between" px={5} py={4} borderTopWidth="1px" borderColor="var(--admin-border)" gap={3}>
        <HStack gap={2}>
          {onUploadAttachment ? (
            <>
              <input ref={fileRef} type="file" multiple hidden onChange={(e) => { onPickFiles(e.target.files); e.target.value = ""; }} />
              <Button tone="outline" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
                <Paperclip size={14} /> Anexar
              </Button>
            </>
          ) : null}
        </HStack>
        <HStack gap={3}>
          <Button tone="ghost" onClick={() => setCompose(null)}>Descartar</Button>
          <Button tone="primary" onClick={send} loading={pending} disabled={!compose.to.trim() || uploading}>
            <Send size={15} /> Enviar
          </Button>
        </HStack>
      </HStack>
    </Stack>
  );
}
