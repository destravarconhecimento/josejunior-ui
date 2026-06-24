"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Box, Button, HStack, Input, NativeSelect, Stack, Text, Textarea } from "@chakra-ui/react";
import { EmailHtmlView } from "./EmailHtmlView";

/**
 * GESTOR DE E-MAIL — componente ÚNICO (puro) usado no sistema e nos tenants.
 * Não faz I/O: recebe dados (contas/mensagens) e devolve ações por callbacks.
 * Cada app liga os callbacks no SEU backend (banco/auth próprios). Corrige aqui,
 * vale em todos. Tema via variáveis `--admin-*` (funciona nos dois painéis).
 */
export type EmailAccountView = { id: string; name: string; address: string; active: boolean };
export type EmailMessageView = {
  id: string;
  direction: "in" | "out";
  fromAddr: string | null;
  toAddr: string | null;
  subject: string | null;
  body: string | null;
  bodyHtml: string | null;
  deliveryStatus: string | null;
  read: boolean;
  createdAt: string;
};
export type EmailAttachment = { filename: string; content: string };
export type EmailComposePayload = {
  accountId: string;
  to: string;
  cc?: string;
  subject?: string;
  body: string;
  attachments?: EmailAttachment[];
};
type Result = { ok: boolean; error?: string };

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function EmailManager({
  accounts,
  messages,
  resendConfigured,
  fallbackFrom,
  onSend,
  onAddAccount,
  onRemoveAccount,
  onOpen,
}: {
  accounts: EmailAccountView[];
  messages: EmailMessageView[];
  resendConfigured: boolean;
  fallbackFrom: string | null;
  onSend: (p: EmailComposePayload) => Promise<Result>;
  onAddAccount: (a: { name: string; address: string }) => Promise<Result>;
  onRemoveAccount: (id: string) => Promise<Result>;
  onOpen: (id: string) => Promise<Result>;
}) {
  const [tab, setTab] = useState<"in" | "out">("in");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return messages
      .filter((m) => m.direction === tab)
      .filter((m) =>
        !q ||
        [m.subject, m.fromAddr, m.toAddr, m.body].some((v) => (v || "").toLowerCase().includes(q)),
      );
  }, [messages, tab, query]);
  const selected = useMemo(() => messages.find((m) => m.id === selectedId) || null, [messages, selectedId]);
  const unread = useMemo(() => messages.filter((m) => m.direction === "in" && !m.read).length, [messages]);

  const open = (m: EmailMessageView) => {
    setSelectedId(m.id);
    setComposing(false);
    if (m.direction === "in" && !m.read) void onOpen(m.id);
  };

  return (
    <Stack gap={5}>
      <AccountsBar accounts={accounts} resendConfigured={resendConfigured} fallbackFrom={fallbackFrom} onAddAccount={onAddAccount} onRemoveAccount={onRemoveAccount} />

      <HStack gap={2} flexWrap="wrap" justify="space-between">
        <HStack gap={2} flexWrap="wrap">
          <Pill active={tab === "in"} onClick={() => { setTab("in"); setSelectedId(null); }}>Recebidos{unread ? ` (${unread})` : ""}</Pill>
          <Pill active={tab === "out"} onClick={() => { setTab("out"); setSelectedId(null); }}>Enviados</Pill>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" size="sm" maxW="220px" borderColor="var(--admin-border)" borderRadius="10px" />
        </HStack>
        <Button size="sm" onClick={() => { setComposing(true); setSelectedId(null); }} bg="var(--admin-accent)" color="#fff" borderRadius="10px">
          Escrever
        </Button>
      </HStack>

      <Box display={{ base: "block", lg: "grid" }} gridTemplateColumns={{ lg: "minmax(0,360px) minmax(0,1fr)" }} gap={4}>
        {/* lista */}
        <Stack gap={2} maxH={{ lg: "70vh" }} overflowY={{ lg: "auto" }}>
          {list.length === 0 ? (
            <Box className="admin-card" p={6} textAlign="center">
              <Text color="var(--admin-text-soft)" fontSize="sm">{tab === "in" ? "Nenhum e-mail recebido." : "Nenhum e-mail enviado."}</Text>
            </Box>
          ) : (
            list.map((m) => {
              const who = m.direction === "in" ? m.fromAddr : m.toAddr;
              const isUnread = m.direction === "in" && !m.read;
              return (
                <Box
                  key={m.id}
                  className="admin-card"
                  p={3.5}
                  cursor="pointer"
                  onClick={() => open(m)}
                  borderLeftWidth={isUnread ? "3px" : selectedId === m.id ? "3px" : "0"}
                  borderLeftColor={isUnread ? "var(--admin-accent)" : "var(--admin-primary)"}
                  bg={selectedId === m.id ? "var(--admin-nav-active)" : undefined}
                >
                  <HStack justify="space-between" gap={2}>
                    <Text fontWeight={isUnread ? "800" : "600"} color="var(--admin-text)" lineClamp={1}>{m.subject || "(sem assunto)"}</Text>
                    <Text fontSize="11px" color="var(--admin-text-soft)" flexShrink={0}>{fmt(m.createdAt)}</Text>
                  </HStack>
                  <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>{who || "—"}</Text>
                  {m.body ? <Text fontSize="xs" color="var(--admin-text-soft)" lineClamp={1}>{m.body}</Text> : null}
                </Box>
              );
            })
          )}
        </Stack>

        {/* leitura / compor */}
        <Box>
          {composing ? (
            <Composer accounts={accounts} fallbackFrom={fallbackFrom} onSend={onSend} onClose={() => setComposing(false)} />
          ) : selected ? (
            <Box className="admin-card" p={0} overflow="hidden">
              <Box p={4} borderBottom="1px solid var(--admin-divider)">
                <Text fontWeight="800" color="var(--admin-text)" mb={1}>{selected.subject || "(sem assunto)"}</Text>
                <Text fontSize="sm" color="var(--admin-text-soft)">
                  {selected.direction === "in" ? "De" : "Para"}: {(selected.direction === "in" ? selected.fromAddr : selected.toAddr) || "—"}
                  {selected.deliveryStatus ? ` · ${selected.deliveryStatus}` : ""} · {fmt(selected.createdAt)}
                </Text>
              </Box>
              <Box p={selected.bodyHtml ? 0 : 4}>
                <EmailHtmlView html={selected.bodyHtml} text={selected.body} minHeight={420} />
              </Box>
            </Box>
          ) : (
            <Box className="admin-card" p={10} textAlign="center" color="var(--admin-text-soft)">
              <Text>Selecione um e-mail para ler, ou clique em <strong>Escrever</strong>.</Text>
            </Box>
          )}
        </Box>
      </Box>
    </Stack>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button size="sm" onClick={onClick} variant={active ? "solid" : "outline"} bg={active ? "var(--admin-accent)" : "transparent"} color={active ? "#fff" : "var(--admin-text)"} borderColor="var(--admin-border)" borderRadius="10px">
      {children}
    </Button>
  );
}

function AccountsBar({
  accounts,
  resendConfigured,
  fallbackFrom,
  onAddAccount,
  onRemoveAccount,
}: {
  accounts: EmailAccountView[];
  resendConfigured: boolean;
  fallbackFrom: string | null;
  onAddAccount: (a: { name: string; address: string }) => Promise<Result>;
  onRemoveAccount: (id: string) => Promise<Result>;
}) {
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: "", address: "" });
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const add = () => start(async () => {
    setErr(null);
    const r = await onAddAccount(f);
    if (r.ok) { setF({ name: "", address: "" }); setAdding(false); } else setErr(r.error || "Falha.");
  });
  const remove = (id: string) => start(async () => { await onRemoveAccount(id); });
  const ip = { size: "sm" as const, borderColor: "var(--admin-border)", borderRadius: "10px" };

  return (
    <Box className="admin-card" p={4}>
      <HStack justify="space-between" flexWrap="wrap" gap={2} mb={accounts.length || adding ? 3 : 0}>
        <Text fontWeight="700" color="var(--admin-text)" fontSize="sm">
          Contas de e-mail <Text as="span" color="var(--admin-text-soft)" fontWeight="500">· {resendConfigured ? "Resend conectado" : "Resend não configurado"}</Text>
        </Text>
        <Button size="xs" onClick={() => setAdding((v) => !v)} variant="outline" borderColor="var(--admin-border)" borderRadius="9px">+ Nova conta</Button>
      </HStack>
      {adding ? (
        <HStack gap={2} mb={3} flexWrap="wrap" align="flex-end">
          <Input placeholder="Nome (ex.: Suporte)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxW="180px" {...ip} />
          <Input placeholder="suporte@josejunior.dev" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} maxW="240px" {...ip} />
          <Button size="sm" onClick={add} loading={pending} bg="var(--admin-accent)" color="#fff" borderRadius="10px">Salvar</Button>
          {err ? <Text fontSize="xs" color="#dc2626">{err}</Text> : null}
        </HStack>
      ) : null}
      {accounts.length === 0 ? (
        <Text fontSize="xs" color="var(--admin-text-soft)">Sem contas — envia com o remetente padrão{fallbackFrom ? `: ${fallbackFrom}` : ""}.</Text>
      ) : (
        <HStack gap={2} flexWrap="wrap">
          {accounts.map((a) => (
            <HStack key={a.id} gap={2} px={3} py={1.5} borderRadius="999px" border="1px solid var(--admin-divider)" bg="var(--admin-surface, #fff)">
              <Text fontSize="xs" color="var(--admin-text)"><strong>{a.name}</strong> · {a.address}</Text>
              <Box as="button" onClick={() => remove(a.id)} aria-label="Remover" color="#dc2626" fontSize="12px" fontWeight="700">×</Box>
            </HStack>
          ))}
        </HStack>
      )}
    </Box>
  );
}

function Composer({
  accounts,
  fallbackFrom,
  onSend,
  onClose,
}: {
  accounts: EmailAccountView[];
  fallbackFrom: string | null;
  onSend: (p: EmailComposePayload) => Promise<Result>;
  onClose: () => void;
}) {
  const active = useMemo(() => accounts.filter((a) => a.active), [accounts]);
  const [f, setF] = useState<EmailComposePayload>({ accountId: active[0]?.id ?? "", to: "", cc: "", subject: "", body: "" });
  const [files, setFiles] = useState<EmailAttachment[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const ip = { size: "sm" as const, borderColor: "var(--admin-border)", borderRadius: "10px" };

  const onPick = async (fl: FileList | null) => {
    if (!fl) return;
    const read = (file: File) =>
      new Promise<EmailAttachment>((res) => {
        const r = new FileReader();
        r.onload = () => res({ filename: file.name, content: String(r.result).split(",").pop() || "" });
        r.readAsDataURL(file);
      });
    const out = await Promise.all(Array.from(fl).slice(0, 5).map(read));
    setFiles((p) => [...p, ...out].slice(0, 5));
  };

  const send = () => start(async () => {
    setErr(null);
    const r = await onSend({ ...f, attachments: files });
    if (r.ok) onClose(); else setErr(r.error || "Falha ao enviar.");
  });

  return (
    <Box className="admin-card" p={5}>
      <Text fontWeight="800" color="var(--admin-primary)" mb={3}>Novo e-mail</Text>
      {active.length ? (
        <Box mb={3}>
          <Text fontSize="xs" color="var(--admin-text-soft)" mb={1} fontWeight="600">De (conta)</Text>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field value={f.accountId} onChange={(e) => setF({ ...f, accountId: e.currentTarget.value })}>
              {active.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.address})</option>)}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Box>
      ) : (
        <Text fontSize="xs" color="var(--admin-text-soft)" mb={3}>De: {fallbackFrom || "remetente padrão"}</Text>
      )}
      <Input placeholder="Para" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} {...ip} mb={3} />
      <Input placeholder="Cc (opcional)" value={f.cc} onChange={(e) => setF({ ...f, cc: e.target.value })} {...ip} mb={3} />
      <Input placeholder="Assunto" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} {...ip} mb={3} />
      <Textarea placeholder="Mensagem" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} rows={8} {...ip} mb={3} />
      <HStack gap={2} flexWrap="wrap" mb={3}>
        <Button size="xs" variant="outline" borderColor="var(--admin-border)" borderRadius="9px" onClick={() => fileRef.current?.click()}>📎 Anexar</Button>
        <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={(e) => onPick(e.target.files)} />
        {files.map((a, i) => (
          <HStack key={i} gap={1} px={2.5} py={1} borderRadius="999px" border="1px solid var(--admin-divider)" fontSize="xs">
            <Text color="var(--admin-text)">{a.filename}</Text>
            <Box as="button" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} color="#dc2626" fontWeight="700">×</Box>
          </HStack>
        ))}
      </HStack>
      <HStack gap={2}>
        <Button size="sm" onClick={send} loading={pending} disabled={!f.to.trim() || !f.body.trim()} bg="var(--admin-accent)" color="#fff" borderRadius="10px">Enviar</Button>
        <Button size="sm" variant="ghost" onClick={onClose} borderRadius="10px">Cancelar</Button>
        {err ? <Text fontSize="xs" color="#dc2626">{err}</Text> : null}
      </HStack>
    </Box>
  );
}
