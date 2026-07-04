"use client";

import { useMemo, useRef, useState, useTransition } from "react";
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
  ArrowLeft,
  AtSign,
  Check,
  Copy,
  Globe,
  Inbox,
  Mail,
  Paperclip,
  PenLine,
  RefreshCw,
  Reply,
  Send,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { Accordion, type AccordionItemDef } from "../Accordion";
import { Tag } from "../Badge";
import { Button } from "../Button";
import { Card } from "../Card";
import { DataTable } from "../DataTable";
import { EmailHtmlView } from "../EmailHtmlView";
import { EmptyState } from "../EmptyState";
import { FormField, FormInput, FormSelect, FormTextarea } from "../form";
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
};

export type MailInboxAccount = {
  id: string;
  address: string;
  name: string | null;
  type: "shared" | "personal";
};

export type MailAttachment = { filename: string; url?: string };

export type MailMessage = {
  id: string;
  accountId: string;
  direction: "inbound" | "sent";
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
  // recarregar a tela (router.refresh no app)
  onRefresh: () => void;
};

type Folder = "inbox" | "sent";

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
  /** Contas Resend (multi-conta). Quando presente, as Configurações mostram o
   *  gerenciador de contas em vez do "1 provedor". Ausente = mono-conta (tenants). */
  connections?: MailConnectionRow[];
  /** Ações extras no cabeçalho (ex.: botão "Templates" no sistema). */
  headerActions?: React.ReactNode;
}) {
  const [view, setView] = useState<"inbox" | "settings">(props.initialView);
  const hasAccounts = props.inboxAccounts.length > 0;
  const cb = props.callbacks;

  return (
    <Box>
      <PageHeader
        title={props.title ?? "Email"}
        actions={
          <>
            <Tag
              bg={props.conn.provider ? "rgba(34,197,94,0.12)" : "rgba(234,179,8,0.14)"}
              color={props.conn.provider ? "#15803d" : "#a16207"}
            >
              {props.conn.provider === "resend"
                ? "Resend conectado"
                : props.conn.provider === "gmail"
                  ? "Gmail conectado"
                  : "Provedor não configurado"}
            </Tag>
            {props.headerActions}
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

      <PageBody>
        {view === "settings" ? (
          <SettingsView
            conn={props.conn}
            webhookUrl={props.webhookUrl}
            domains={props.domains}
            accounts={props.accounts}
            users={props.users}
            connections={props.connections}
            callbacks={cb}
          />
        ) : (
          <Mailbox
            accounts={props.inboxAccounts}
            messages={props.messages}
            callbacks={cb}
            onGoSettings={props.isAdmin ? () => setView("settings") : undefined}
          />
        )}
      </PageBody>
    </Box>
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

  return <Accordion items={items} multiple defaultValue={connected ? ["domains"] : ["provider"]} />;
}

// ============================================================
// Conectar provedor
// ============================================================

function ConnectProviderForm({
  initial,
  webhookUrl,
  callbacks,
}: {
  initial: MailConnEditor;
  webhookUrl?: string;
  callbacks: MailCallbacks;
}) {
  const [pending, start] = useTransition();
  const [provider, setProvider] = useState<MailProvider>(initial.provider ?? "resend");
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
            desc="Cada usuário conecta a própria caixa via Google."
            badge="em breve"
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
              placeholder="josejunior.com.br"
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
  callbacks,
  onGoSettings,
}: {
  accounts: MailInboxAccount[];
  messages: MailMessage[];
  callbacks: MailCallbacks;
  onGoSettings?: () => void;
}) {
  const [pending, start] = useTransition();
  const ALL = "__all__";
  const [accountId, setAccountId] = useState<string>(accounts.length > 1 ? ALL : (accounts[0]?.id ?? ""));
  const [folder, setFolder] = useState<Folder>("inbox");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compose, setCompose] = useState<null | ComposeState>(null);

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
  const folderMessages = useMemo(
    () =>
      accountMessages
        .filter((m) => (folder === "inbox" ? m.direction === "inbound" : m.direction === "sent"))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [accountMessages, folder],
  );
  /** Não-lidas por conta (para o seletor) + total. */
  const unreadByAccount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of messages) if (m.direction === "inbound" && !m.read) map[m.accountId] = (map[m.accountId] ?? 0) + 1;
    return map;
  }, [messages]);
  const unreadCount = accountMessages.filter((m) => m.direction === "inbound" && !m.read).length;
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

  function startCompose() {
    setSelectedId(null);
    setCompose({
      fromAccountId: isAll ? (accounts[0]?.id ?? "") : accountId,
      to: "", cc: "", subject: "", html: "", inReplyTo: null, threadId: null, attachments: [],
    });
  }

  function startReply(m: MailMessage) {
    const replyTo = m.direction === "inbound" ? m.fromAddress : m.toAddresses[0] ?? "";
    const subj = m.subject ?? "";
    setCompose({
      // responde PELA conta que recebeu (ou a atual, se enviado)
      fromAccountId: m.accountId || (isAll ? (accounts[0]?.id ?? "") : accountId),
      to: replyTo,
      cc: "",
      subject: subj.toLowerCase().startsWith("re:") ? subj : `Re: ${subj}`,
      html: "",
      inReplyTo: m.resendId ?? m.inReplyTo ?? null,
      threadId: m.threadId ?? m.resendId ?? null,
      attachments: [],
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
    <Flex
      borderWidth="1px"
      borderColor="var(--admin-border)"
      borderRadius="16px"
      overflow="hidden"
      bg="var(--admin-surface)"
      minH="560px"
      h={{ base: "auto", md: "calc(100dvh - 132px)" }}
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
              ...accounts.map((a) => ({ value: a.id, label: `${a.address}${unreadByAccount[a.id] ? ` (${unreadByAccount[a.id]})` : ""}` })),
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
            active={folder === "inbox"}
            onClick={() => { setFolder("inbox"); setSelectedId(null); }}
            icon={<Inbox size={16} />}
            label="Caixa de entrada"
            count={unreadCount}
          />
          <FolderButton
            active={folder === "sent"}
            onClick={() => { setFolder("sent"); setSelectedId(null); }}
            icon={<Send size={16} />}
            label="Enviados"
          />
        </Stack>
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
        <HStack justify="space-between" px={4} py={3} borderBottomWidth="1px" borderColor="var(--admin-border)">
          <Text fontWeight="700" fontSize="sm">
            {folder === "inbox" ? "Caixa de entrada" : "Enviados"}
          </Text>
          <HStack gap={2}>
            {syncMsg ? (
              <Text fontSize="2xs" color="var(--admin-text-soft)">{syncMsg}</Text>
            ) : null}
            <IconButton
              aria-label="Buscar novos no Resend"
              title="Buscar novos e-mails (Resend)"
              size="xs"
              variant="ghost"
              onClick={folder === "inbox" ? doSync : callbacks.onRefresh}
              loading={pending}
            >
              <RefreshCw size={14} />
            </IconButton>
          </HStack>
        </HStack>

        {folderMessages.length === 0 ? (
          <Stack p={6} gap={3} align="flex-start">
            <Text fontSize="sm" color="var(--admin-text-soft)">
              {folder === "inbox"
                ? "Nenhuma mensagem recebida ainda."
                : "Nenhuma mensagem enviada ainda."}
            </Text>
            {folder === "inbox" ? (
              <>
                <Button size="xs" tone="outline" borderRadius="8px" onClick={doSync} loading={pending}>
                  <RefreshCw size={13} /> Buscar no Resend
                </Button>
                <Text fontSize="2xs" color="var(--admin-text-soft)" lineHeight="1.6">
                  Para receber, ative o Inbound do domínio no Resend e aponte o webhook.
                </Text>
              </>
            ) : null}
          </Stack>
        ) : (
          folderMessages.map((m) => {
            const who = folder === "inbox"
              ? displayName(m.fromAddress, m.fromName)
              : m.toAddresses.join(", ");
            const unread = m.direction === "inbound" && !m.read;
            return (
              <Box
                key={m.id}
                onClick={() => openMessage(m)}
                cursor="pointer"
                px={4}
                py={3}
                borderBottomWidth="1px"
                borderColor="var(--admin-border)"
                bg={selectedId === m.id ? "var(--admin-surface-2)" : "transparent"}
                _hover={{ bg: "var(--admin-surface-2)" }}
                position="relative"
              >
                {unread ? (
                  <Box position="absolute" left="6px" top="50%" transform="translateY(-50%)" w="6px" h="6px" borderRadius="full" bg="var(--admin-primary)" />
                ) : null}
                <HStack justify="space-between" gap={2}>
                  <Text fontSize="sm" fontWeight={unread ? "800" : "600"} truncate flex="1">
                    {who}
                  </Text>
                  <Text fontSize="xs" color="var(--admin-text-soft)" flexShrink={0}>
                    {fmtDate(m.date)}
                  </Text>
                </HStack>
                <Text fontSize="sm" fontWeight={unread ? "700" : "500"} truncate>
                  {m.subject || "(sem assunto)"}
                </Text>
                <Text fontSize="xs" color="var(--admin-text-soft)" truncate>
                  {snippet(m)}
                </Text>
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
          <MessageView message={selected} onBack={() => setSelectedId(null)} onReply={() => startReply(selected)} />
        ) : (
          <Flex h="100%" minH="400px" align="center" justify="center" p={8}>
            <Stack align="center" gap={2}>
              <Icon as={Mail} boxSize={8} color="var(--admin-text-soft)" />
              <Text color="var(--admin-text-soft)" fontSize="sm">
                Selecione uma mensagem para ler
              </Text>
            </Stack>
          </Flex>
        )}
      </Box>
    </Flex>
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
  onBack,
  onReply,
}: {
  message: MailMessage;
  onBack: () => void;
  onReply: () => void;
}) {
  const attachments = message.attachments ?? [];
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
        <Button size="sm" tone="outline" onClick={onReply}>
          <Reply size={14} /> Responder
        </Button>
      </HStack>

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
