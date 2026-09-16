"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Box, Flex, HStack, Spinner, Stack, Text, chakra } from "@chakra-ui/react";
import {
  ArrowLeft,
  Bot,
  BotOff,
  Maximize2,
  MessageCircle,
  PanelRight,
  Paperclip,
  PictureInPicture2,
  Plus,
  RefreshCw,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { EntityAvatar } from "../EntityAvatar";
import { Textarea } from "../controls";
import {
  useFabAcoplado,
  useFabDock,
  useFabModo,
  setFabOpen,
  FAB_BASE,
  FAB_LATERAL_W,
  FAB_SIZE,
} from "../fab/dock";
import type { UiRealtimeSubscribe } from "../realtime";
import {
  ChatRow,
  MessageBubble,
  NovaConversaModal,
  WA_CREAM,
  WA_DOODLE,
  displayName,
  groupByDay,
  mensagemJaNoFio,
  type UiMessage,
  type WhatsAppChat,
  type WhatsAppMessage,
  type WhatsAppResult,
} from "./WhatsAppClient";

/* ============================================================
 * WhatsAppFab — o WhatsApp FLUTUANTE do painel: botão arrastável
 * que abre uma janelinha "de telemóvel" (lista → conversa) em
 * QUALQUER tela, sem sair de onde se está.
 *
 * Não é uma segunda implementação do WhatsApp: a linha da lista
 * (`ChatRow`) e a bolha (`MessageBubble`) são as MESMAS do
 * `WhatsAppClient` — importadas dele. O que muda aqui é só a
 * moldura (janela pequena, uma coluna de cada vez) e o seletor
 * Conversas/Grupos, que na tela cheia é a barra de categorias.
 *
 * Puro: zero fetch/server action. Dados+callbacks por props, IDs
 * string. Quem monta decide de onde vêm os chats.
 * ============================================================ */

const WA_GREEN = "#128c7e";
const WA_GREEN_DARK = "#075e54";

/** Link do Next com as props de estilo do Chakra (o botão de expandir). */
const ChakraLink = chakra(Link);

export type WhatsAppFabCallbacks = {
  /** Abre a conversa — devolve o fio completo (mesma callback da tela cheia). */
  onSelecionar: (chatId: string) => Promise<WhatsAppResult<WhatsAppMessage[]>>;
  onResponder: (chatId: string, texto: string) => Promise<WhatsAppResult<{ messageId?: string }>>;
  /** Recarrega a lista de conversas (o dono é que sabe como). */
  onActualizar: () => void | Promise<void>;
  /**
   * Inicia conversa com um número NOVO (mesmo contrato da tela cheia): no
   * WhatsApp a conversa nasce da primeira mensagem, então isto ENVIA e devolve
   * o `chatId` pra janelinha abrir o fio. Sem a callback o botão "+" não aparece.
   */
  onNovaConversa?: (
    numeroDigits: string,
    texto: string,
    nome?: string,
  ) => Promise<WhatsAppResult<{ chatId: string }>>;
  /**
   * Sobe + envia um ANEXO (imagem/vídeo/áudio/documento) — mesma callback da
   * tela cheia. Com ela o balão ganha o clipe, aceita Ctrl+V de imagem
   * (print da tela) e arrastar-e-soltar no fio. Sem ela, nada disso aparece.
   * `legenda` é o texto digitado junto (vai como caption da mídia).
   */
  onEnviarAnexo?: (chatId: string, file: File, legenda?: string) => Promise<WhatsAppResult>;
};

/** Tipo de bolha pro anexo (o mesmo mapa que o servidor usa no upload). */
function tipoDoArquivo(file: File): "image" | "video" | "audio" | "document" {
  const m = file.type || "";
  return m.startsWith("image/") ? "image" : m.startsWith("video/") ? "video" : m.startsWith("audio/") ? "audio" : "document";
}

/**
 * Arquivos de um evento de colar/soltar. No Ctrl+V de um print o browser
 * entrega um `File` sem nome ("image.png") — ganha nome com hora pra não
 * virar dez "image.png" no Blob.
 */
function arquivosDe(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  const out: File[] = [];
  const vistos = new Set<File>();
  for (const f of Array.from(dt.files ?? [])) {
    if (!vistos.has(f)) {
      vistos.add(f);
      out.push(f);
    }
  }
  if (!out.length) {
    for (const it of Array.from(dt.items ?? [])) {
      if (it.kind !== "file") continue;
      const f = it.getAsFile();
      if (f && !vistos.has(f)) {
        vistos.add(f);
        out.push(f);
      }
    }
  }
  return out.map((f) => {
    if (f.name && f.name !== "image.png") return f;
    const ext = (f.type.split("/")[1] || "png").replace(/[^a-z0-9]/gi, "");
    const carimbo = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
    return new File([f], `colado-${carimbo}.${ext}`, { type: f.type });
  });
}

/**
 * Pedido de "abrir o balão NESTA conversa", vindo de qualquer tela (ex.: o
 * botão de WhatsApp no card do lead do funil). `phone` pode vir formatado —
 * só os dígitos contam. `nome` é como o painel chama o contato enquanto o
 * WhatsApp não disser o verdadeiro; `rascunho` pré-preenche o campo de
 * mensagem (NÃO envia — quem envia é a pessoa, depois de ler).
 */
export type WhatsAppFabOpenChat = {
  chatId?: string;
  phone?: string;
  nome?: string;
  rascunho?: string;
};

export const WA_FAB_OPEN_CHAT_EVENT = "wa-fab:open-chat";

/** Atalho pra qualquer tela abrir o balão numa conversa (sem prop drilling). */
export function abrirWhatsAppFab(detail: WhatsAppFabOpenChat) {
  window.dispatchEvent(new CustomEvent<WhatsAppFabOpenChat>(WA_FAB_OPEN_CHAT_EVENT, { detail }));
}

/**
 * Aviso de "mensagem ENVIADA pelo balão" (confirmada pelo servidor) — quem
 * abriu a conversa (ex.: o botão do lead no funil) escuta isto pra registrar
 * o contato no lugar certo, em vez de registrar no clique (que não é envio).
 */
export type WhatsAppFabSent = { chatId: string };
export const WA_FAB_SENT_EVENT = "wa-fab:sent";

const soDigitos = (s: string) => (s || "").replace(/\D/g, "");

/** Estado da IA numa conversa: a instância TEM agente ativo? E este número está ligado? */
export type WhatsAppFabIaEstado = { disponivel: boolean; ligada: boolean };

/**
 * Liga/desliga a IA POR CONVERSA (opcional — sem isto o botão nem aparece).
 * Quem monta decide o que "desligar" significa (no sistema: pausa por número no
 * gateway; o agente segue atendendo os demais). Grupo não tem IA por conversa.
 */
export type WhatsAppFabIa = {
  estado: (chatId: string) => Promise<WhatsAppResult<WhatsAppFabIaEstado>>;
  alternar: (chatId: string, ligar: boolean) => Promise<WhatsAppResult<WhatsAppFabIaEstado>>;
};

export type WhatsAppFabProps = {
  /** Desligado = o FAB nem existe (é o "se tiver conectado" do pedido). */
  connected: boolean;
  phone?: string | null;
  chats: WhatsAppChat[];
  loadingChats?: boolean;
  assistantName?: string;
  /** Rota da tela cheia — presente = mostra o botão de expandir. */
  expandHref?: string;
  /** Rotas onde o FAB some (a própria tela do WhatsApp, por exemplo). */
  hideOnPaths?: string[];
  /** Avisa quando abre/fecha — o dono usa pra ligar/desligar o polling. */
  onOpenChange?: (open: boolean) => void;
  callbacks: WhatsAppFabCallbacks;
  /** Liga/desliga da IA por conversa (opcional — ver `WhatsAppFabIa`). */
  ia?: WhatsAppFabIa;
  /**
   * TEMPO REAL por injeção (opcional): `(aviso) => cancelar`. O FAB não tinha
   * ciclo nenhum — o fio aberto ficava congelado até fechar e abrir de novo.
   * Com isto, mensagem nova aparece sozinha (e a lista se atualiza pelo dono).
   */
  onRealtime?: UiRealtimeSubscribe;
};

export function WhatsAppFab({
  connected,
  phone,
  chats,
  loadingChats = false,
  assistantName,
  expandHref,
  hideOnPaths = [],
  onOpenChange,
  callbacks,
  ia,
  onRealtime,
}: WhatsAppFabProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [vista, setVista] = useState<"conversas" | "grupos">("conversas");
  const [busca, setBusca] = useState("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<UiMessage[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [novaOpen, setNovaOpen] = useState(false);
  // Conversa "virtual": aberta por evento (lead do funil) antes de existir na
  // lista — só serve pro cabeçalho ter nome/número enquanto o fio carrega.
  const [virtualChat, setVirtualChat] = useState<WhatsAppChat | null>(null);
  // IA por conversa: null = ainda não perguntei (ou não há callback) — sem botão.
  const [iaEstado, setIaEstado] = useState<WhatsAppFabIaEstado | null>(null);
  const [iaBusy, setIaBusy] = useState(false);
  // Anexo: subindo? e alguém está arrastando um arquivo por cima do fio?
  const [anexando, setAnexando] = useState(false);
  const [soltando, setSoltando] = useState(false);
  // Anexos PREPARADOS (clipe, Ctrl+V ou arrastar): ficam à vista em cima da
  // caixa, com a legenda embaixo, e só saem no Enviar — junto com o texto.
  // Antes a imagem saía na hora e a pessoa não tinha onde escrever a legenda.
  const [anexos, setAnexos] = useState<File[]>([]);
  const previews = useMemo(() => anexos.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null)), [anexos]);
  useEffect(() => () => previews.forEach((u) => u && URL.revokeObjectURL(u)), [previews]);
  const textoRef = useRef<HTMLTextAreaElement>(null);
  const anexar = useCallback((files: File[]) => {
    if (!files.length) return;
    setAnexos((prev) => [...prev, ...files]);
    setErro(null);
    setTimeout(() => textoRef.current?.focus(), 0);
  }, []);
  const fileRef = useRef<HTMLInputElement>(null);
  const fioRef = useRef<HTMLDivElement>(null);

  // Dock partilhado: empilha os FABs (WhatsApp em baixo) e garante que só um
  // painel abre de cada vez — abrir a IA some com este, e vice-versa.
  const wantShow = connected && !hideOnPaths.includes(pathname);
  const { bottom, lado, othersOpen, arrastoProps, arrastando, arrastou } = useFabDock("whatsapp", wantShow);
  const { style: arrastoStyle, ...arrastoHandlers } = arrastoProps;
  // Flutuante (janelinha no canto) × lateral (encostado na direita, altura
  // inteira). A escolha fica guardada — ver `useFabModo`.
  const [modo, setModo] = useFabModo("whatsapp");
  const lateral = modo === "lateral";
  // Encostado = ACOPLADO: a página encolhe pela direita em vez de ficar tapada.
  // A condição espelha o que de facto aparece na tela (ver os `return null`
  // abaixo) — reservar espaço pra um painel escondido deixaria um vão vazio.
  useFabAcoplado("whatsapp", lateral && open && !othersOpen && !hideOnPaths.includes(pathname));

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  // Espelha o aberto no dock e recua se o irmão (IA) abrir.
  useEffect(() => setFabOpen("whatsapp", open), [open]);
  useEffect(() => {
    if (othersOpen && open) setOpen(false);
  }, [othersOpen, open]);

  // Abrir por evento: dá um atalho a quem quiser ("abrir o WhatsApp") sem prop drilling.
  useEffect(() => {
    const abrir = () => setOpen(true);
    window.addEventListener("wa-fab:open", abrir);
    return () => window.removeEventListener("wa-fab:open", abrir);
  }, []);

  const abrirConversa = useCallback(
    async (id: string) => {
      setChatId(id);
      setMsgs([]);
      setErro(null);
      // Troca de conversa não pode herdar rascunho da anterior (quem abre com
      // rascunho — evento — repõe o texto DEPOIS desta limpeza síncrona).
      setTexto("");
      setCarregando(true);
      const r = await callbacks.onSelecionar(id);
      setCarregando(false);
      if (r.ok) setMsgs(r.data ?? []);
      else setErro(r.error);
    },
    [callbacks],
  );

  // Abrir NUMA conversa por evento (ex.: botão de WhatsApp no lead do funil).
  // Se a conversa ainda não existe na lista, monta um chat "virtual" só pro
  // cabeçalho — o envio segue o caminho normal (a conversa nasce da mensagem).
  useEffect(() => {
    const abrirEm = (e: Event) => {
      const detail = (e as CustomEvent<WhatsAppFabOpenChat>).detail;
      if (!detail) return;
      const digits = soDigitos(detail.phone ?? detail.chatId ?? "");
      const id = detail.chatId ?? (digits ? `${digits}@s.whatsapp.net` : null);
      setOpen(true);
      if (!id) return;
      setVista("conversas");
      setVirtualChat({
        chatId: id,
        peer: digits || id,
        isGroup: id.endsWith("@g.us"),
        contactName: detail.nome?.trim() || null,
        savedName: null,
        lastBody: "",
        lastDirection: "out",
        lastType: "text",
        lastAt: null,
        lastSentBy: null,
        lastSentByName: null,
        total: 0,
      });
      void abrirConversa(id);
      if (detail.rascunho) setTexto(detail.rascunho);
    };
    window.addEventListener(WA_FAB_OPEN_CHAT_EVENT, abrirEm);
    return () => window.removeEventListener(WA_FAB_OPEN_CHAT_EVENT, abrirEm);
  }, [abrirConversa]);

  // Estado da IA da conversa aberta. Pergunta uma vez por conversa; grupo fica
  // de fora (a pausa do gateway é por NÚMERO — grupo não tem um).
  useEffect(() => {
    setIaEstado(null);
    if (!ia || !chatId || chatId.endsWith("@g.us")) return;
    let vivo = true;
    void ia.estado(chatId).then((r) => {
      if (vivo && r.ok && r.data) setIaEstado(r.data);
    });
    return () => {
      vivo = false;
    };
  }, [ia, chatId]);

  const alternarIa = useCallback(async () => {
    if (!ia || !chatId || !iaEstado?.disponivel || iaBusy) return;
    setIaBusy(true);
    const r = await ia.alternar(chatId, !iaEstado.ligada);
    setIaBusy(false);
    if (r.ok && r.data) setIaEstado(r.data);
    else if (!r.ok) setErro(r.error);
  }, [ia, chatId, iaEstado, iaBusy]);

  // TEMPO REAL: recarrega o fio aberto SEM piscar (não limpa as mensagens nem
  // acende o spinner — a bolha nova entra e pronto).
  useEffect(() => {
    if (!open || !chatId || !onRealtime) return;
    return onRealtime(() => {
      void callbacks.onSelecionar(chatId).then((r) => {
        if (r.ok) setMsgs(r.data ?? []);
      });
    });
  }, [open, chatId, onRealtime, callbacks]);

  const enviar = useCallback(async () => {
    const t = texto.trim();
    if (anexos.length) {
      void enviarAnexo(anexos, t);
      return;
    }
    if (!t || !chatId || enviando) return;
    setTexto("");
    setEnviando(true);
    // Bolha otimista: a mensagem aparece já, marcada "a enviar…", e é
    // substituída pelo fio real assim que o servidor confirma.
    const local: UiMessage = {
      id: `local-${chatId}-${msgs.length}`,
      chatId,
      from: "",
      to: chatId,
      body: t,
      type: "text",
      direction: "out",
      fromMe: true,
      status: null,
      hasMedia: false,
      mediaUrl: null,
      mediaType: null,
      contactName: null,
      savedName: null,
      sentBy: "painel",
      sentByName: null,
      at: new Date().toISOString(),
      pendingLocal: true,
    };
    setMsgs((prev) => [...prev, local]);
    const r = await callbacks.onResponder(chatId, t);
    setEnviando(false);
    if (!r.ok) {
      // Tempo esgotado do gateway ≠ mensagem perdida: confere o fio antes de
      // devolver o texto pra caixa, senão a pessoa reenvia e o contacto recebe
      // em dobro. Se está lá, o envio CONTA (avisa o funil também).
      if (r.talvezEnviada) {
        const check = await callbacks.onSelecionar(chatId);
        const fio = check.ok ? (check.data ?? []) : [];
        if (mensagemJaNoFio(fio, t)) {
          setMsgs(fio);
          setErro(null);
          window.dispatchEvent(new CustomEvent<WhatsAppFabSent>(WA_FAB_SENT_EVENT, { detail: { chatId } }));
          void callbacks.onActualizar();
          return;
        }
      }
      setErro(r.error);
      setMsgs((prev) => prev.filter((m) => m.id !== local.id));
      setTexto(t);
      return;
    }
    window.dispatchEvent(new CustomEvent<WhatsAppFabSent>(WA_FAB_SENT_EVENT, { detail: { chatId } }));
    const fresco = await callbacks.onSelecionar(chatId);
    if (fresco.ok) setMsgs(fresco.data ?? []);
    void callbacks.onActualizar();
    // `enviarAnexo` é function declaration (içada) — lê o estado fresco por closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, chatId, enviando, msgs.length, callbacks, anexos]);

  // Anexo preparado + legenda: sobe pela callback do dono e mostra a bolha
  // otimista com o próprio arquivo (object URL) até o fio real voltar. Vários
  // arquivos saem em sequência; a legenda vai no PRIMEIRO (é o que o WhatsApp
  // faz quando se manda um álbum com texto).
  async function enviarAnexo(files: File[], legenda: string) {
    {
      const cb = callbacks.onEnviarAnexo;
      if (!cb || !chatId || anexando || !files.length) return;
      setAnexando(true);
      setErro(null);
      setAnexos([]);
      setTexto("");
      let indice = 0;
      for (const file of files) {
        const kind = tipoDoArquivo(file);
        const url = URL.createObjectURL(file);
        const local: UiMessage = {
          id: `local-anexo-${chatId}-${Date.now()}-${file.name}`,
          chatId,
          from: "",
          to: chatId,
          body: indice === 0 && legenda ? legenda : kind === "document" ? file.name : "",
          type: kind,
          direction: "out",
          fromMe: true,
          status: null,
          hasMedia: true,
          mediaUrl: url,
          mediaType: kind,
          contactName: null,
          savedName: null,
          sentBy: "painel",
          sentByName: null,
          at: new Date().toISOString(),
          pendingLocal: true,
        };
        setMsgs((prev) => [...prev, local]);
        const r = await cb(chatId, file, indice === 0 && legenda ? legenda : undefined);
        URL.revokeObjectURL(url);
        if (!r.ok) {
          // Anexo não dá pra conferir por texto — recarrega o fio pra pessoa
          // VER se saiu antes de mandar de novo. O que não saiu volta pra
          // caixa (arquivo e legenda), pra não ter que colar tudo de novo.
          setErro(`${file.name}: ${r.error}`);
          setMsgs((prev) => prev.filter((m) => m.id !== local.id));
          if (r.talvezEnviada) {
            const check = await callbacks.onSelecionar(chatId);
            if (check.ok) setMsgs(check.data ?? []);
          } else {
            setAnexos(files.slice(indice));
            if (indice === 0) setTexto(legenda);
          }
          break;
        }
        indice += 1;
        window.dispatchEvent(new CustomEvent<WhatsAppFabSent>(WA_FAB_SENT_EVENT, { detail: { chatId } }));
      }
      setAnexando(false);
      const fresco = await callbacks.onSelecionar(chatId);
      if (fresco.ok) setMsgs(fresco.data ?? []);
      void callbacks.onActualizar();
    }
  }

  // Rola pro fim sempre que o fio muda (abrir conversa ou mensagem nova).
  useEffect(() => {
    if (!open || !chatId) return;
    const el = fioRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, chatId, msgs]);

  const chatAberto = useMemo(() => {
    if (!chatId) return null;
    const daLista = chats.find((c) => c.chatId === chatId);
    if (daLista) return daLista;
    // Conversa que ainda não existe na lista (aberta por evento): usa o virtual.
    return virtualChat && virtualChat.chatId === chatId ? virtualChat : null;
  }, [chats, chatId, virtualChat]);

  const { conversas, grupos } = useMemo(() => {
    const naoArquivados = chats.filter((c) => !c.arquivado);
    return {
      conversas: naoArquivados.filter((c) => !c.isGroup),
      grupos: naoArquivados.filter((c) => c.isGroup),
    };
  }, [chats]);

  const lista = useMemo(() => {
    const base = vista === "grupos" ? grupos : conversas;
    const q = busca.trim().toLowerCase();
    const filtrados = q
      ? base.filter((c) => `${displayName(c)} ${c.peer} ${c.lastBody}`.toLowerCase().includes(q))
      : base;
    // Fixados primeiro; o resto mantém a ordem que veio do servidor (mais recente).
    return [...filtrados].sort((a, b) => Number(b.fixado) - Number(a.fixado));
  }, [vista, grupos, conversas, busca]);

  const naoLidas = useMemo(() => chats.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0), [chats]);

  if (othersOpen || hideOnPaths.includes(pathname)) return null;
  // Desconectado: o botão redondo não existe, mas se alguma tela pediu pra
  // abrir (evento), o painel aparece com o aviso — melhor do que clicar no
  // WhatsApp do lead e "não acontecer nada".
  if (!connected && !open) return null;

  // O botão redondo só existe com o painel FECHADO: aberto, quem fecha é o ×
  // do cabeçalho. O botão-que-vira-× ficava escondido atrás da janelinha (e no
  // modo lateral nem apareceria) — era um "fechar" que ninguém achava.
  const botao = (
    <chakra.button
      type="button"
      // Arrastar não pode abrir a janelinha — ver `arrastou()` no dock.
      onClick={() => {
        if (arrastou()) return;
        setOpen(true);
      }}
      position="fixed"
      data-jj-fab=""
      {...arrastoHandlers}
      style={{ background: "#25d366", boxShadow: "0 8px 22px rgba(7,26,51,0.28)", ...arrastoStyle }}
      bottom={`${bottom}px`}
      left={lado === "esq" ? `${FAB_BASE}px` : undefined}
      right={lado === "dir" ? `${FAB_BASE}px` : undefined}
      zIndex={1400}
      w={`${FAB_SIZE}px`}
      h={`${FAB_SIZE}px`}
      borderRadius="full"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      color="white"
      _hover={arrastando ? undefined : { transform: "scale(1.06)" }}
      transition={arrastando ? "none" : "transform .15s, bottom .18s ease"}
      aria-label="WhatsApp (arraste pra mudar de canto)"
      title="WhatsApp — arraste pra mudar de canto"
    >
      <FaWhatsapp size={18} />
      {naoLidas > 0 ? (
        <Box
          position="absolute"
          top="-2px"
          right="-2px"
          bg="#ef4444"
          color="white"
          borderRadius="full"
          minW="20px"
          h="20px"
          px={1}
          fontSize="11px"
          fontWeight="700"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          border="2px solid white"
        >
          {naoLidas > 99 ? "99+" : naoLidas}
        </Box>
      ) : null}
    </chakra.button>
  );

  if (!open) return connected ? botao : null;

  // Uma moldura, dois formatos. As MESMAS chaves nos dois ramos — assim o
  // objeto tem um tipo só e entra no `Flex` sem ginástica de tipos.
  const moldura = {
    top: lateral ? "0px" : undefined,
    // O botão some com o painel aberto, então o painel ocupa o lugar dele — é
    // o que faz a janelinha acompanhar o dock arrastado.
    bottom: lateral ? "0px" : `${bottom}px`,
    // Flutuante abre pro MESMO lado do dock; encostado é sempre à direita, que
    // é o lado que o `--jj-fab-dock` reserva no shell.
    left: lateral || lado === "dir" ? undefined : `${FAB_BASE}px`,
    right: lateral ? "0px" : lado === "dir" ? `${FAB_BASE}px` : undefined,
    w: lateral
      ? { base: "100vw", sm: `min(${FAB_LATERAL_W}px, 100vw)` }
      : { base: "calc(100vw - 32px)", sm: "380px" },
    h: lateral ? undefined : { base: "72vh", sm: "580px" },
    maxH: lateral ? undefined : "calc(100vh - 120px)",
    borderRadius: lateral ? "0" : "18px",
    boxShadow: lateral ? "-18px 0 44px rgba(17,12,40,0.16)" : "0 24px 60px rgba(17,12,40,0.22)",
  };

  return (
    <>
      <Flex
        position="fixed"
        data-jj-fab=""
        zIndex={1400}
        {...moldura}
        bg="var(--admin-surface, white)"
        border="1px solid var(--admin-border)"
        overflow="hidden"
        direction="column"
      >
        {/* ── Cabeçalho ───────────────────────────────────── */}
        <HStack
          px={3.5}
          py={2.5}
          gap={2}
          flexShrink={0}
          style={{ background: chatAberto ? WA_GREEN_DARK : WA_GREEN }}
          color="white"
        >
          {chatAberto ? (
            <>
              <chakra.button
                type="button"
                onClick={() => {
                  setChatId(null);
                  setMsgs([]);
                  setErro(null);
                  setTexto("");
                  setVirtualChat(null);
                }}
                aria-label="Voltar"
                display="inline-flex"
                alignItems="center"
                flexShrink={0}
              >
                <ArrowLeft size={18} />
              </chakra.button>
              <EntityAvatar name={displayName(chatAberto)} size="sm" />
              <Stack gap={0} flex={1} minW={0}>
                <Text fontSize="sm" fontWeight="700" lineClamp={1}>
                  {displayName(chatAberto)}
                </Text>
                <Text fontSize="10px" opacity={0.85} lineClamp={1}>
                  {chatAberto.isGroup
                    ? "Grupo"
                    : chatAberto.vinculo && displayName(chatAberto) !== chatAberto.vinculo.nome
                      ? `${chatAberto.peer.replace(/\D/g, "")} · ${chatAberto.vinculo.nome}`
                      : chatAberto.peer.replace(/\D/g, "")}
                </Text>
              </Stack>
              {iaEstado?.disponivel ? (
                <chakra.button
                  type="button"
                  onClick={() => void alternarIa()}
                  disabled={iaBusy}
                  aria-label={iaEstado.ligada ? "Desligar a IA nesta conversa" : "Ligar a IA nesta conversa"}
                  title={
                    iaEstado.ligada
                      ? "IA respondendo esta conversa — clique pra desligar"
                      : "IA desligada nesta conversa — clique pra ligar"
                  }
                  display="inline-flex"
                  alignItems="center"
                  flexShrink={0}
                  opacity={iaBusy ? 0.45 : iaEstado.ligada ? 1 : 0.6}
                  _hover={{ opacity: 1 }}
                >
                  {iaEstado.ligada ? <Bot size={17} /> : <BotOff size={17} />}
                </chakra.button>
              ) : null}
            </>
          ) : (
            <>
              <FaWhatsapp size={18} />
              <Stack gap={0} flex={1} minW={0}>
                <Text fontSize="sm" fontWeight="700">
                  WhatsApp
                </Text>
                <Text fontSize="10px" opacity={0.85} lineClamp={1}>
                  {!connected ? "Não conectado" : phone ? `Conectado — ${phone}` : "Conectado"}
                </Text>
              </Stack>
              {connected && callbacks.onNovaConversa ? (
                <chakra.button
                  type="button"
                  onClick={() => setNovaOpen(true)}
                  aria-label="Nova conversa"
                  title="Nova conversa"
                  opacity={0.85}
                  _hover={{ opacity: 1 }}
                  flexShrink={0}
                >
                  <Plus size={17} />
                </chakra.button>
              ) : null}
              <chakra.button
                type="button"
                onClick={() => void callbacks.onActualizar()}
                aria-label="Atualizar"
                title="Atualizar"
                opacity={0.85}
                _hover={{ opacity: 1 }}
                flexShrink={0}
              >
                <RefreshCw size={15} />
              </chakra.button>
            </>
          )}
          {/* Encostar na lateral × voltar pro balão: o mesmo painel, só que
              colado na direita e do tamanho da janela. Quem trabalha o dia todo
              aqui deixa encostado; quem só espia volta pro balão. */}
          <chakra.button
            type="button"
            onClick={() => setModo(lateral ? "flutuante" : "lateral")}
            aria-label={lateral ? "Voltar pro balão" : "Encostar na lateral"}
            title={lateral ? "Voltar pro balão" : "Encostar na lateral"}
            display="inline-flex"
            alignItems="center"
            opacity={0.85}
            _hover={{ opacity: 1 }}
            flexShrink={0}
          >
            {lateral ? <PictureInPicture2 size={15} /> : <PanelRight size={15} />}
          </chakra.button>
          {expandHref ? (
            <ChakraLink
              href={expandHref}
              aria-label="Abrir na tela cheia"
              title="Abrir na tela cheia"
              display="inline-flex"
              alignItems="center"
              color="white"
              opacity={0.85}
              _hover={{ opacity: 1 }}
              flexShrink={0}
            >
              <Maximize2 size={15} />
            </ChakraLink>
          ) : null}
          <chakra.button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            title="Fechar"
            display="inline-flex"
            alignItems="center"
            opacity={0.85}
            _hover={{ opacity: 1 }}
            flexShrink={0}
          >
            <X size={16} />
          </chakra.button>
        </HStack>

        {!connected ? (
          /* ── Sem número conectado (painel aberto por evento) ── */
          <Stack flex={1} align="center" justify="center" gap={2.5} px={6} textAlign="center">
            <FaWhatsapp size={34} color="var(--admin-text-soft)" />
            <Text fontSize="sm" fontWeight="700" color="var(--admin-text)">
              WhatsApp não conectado
            </Text>
            <Text fontSize="xs" color="var(--admin-text-soft)">
              Conecte o número da plataforma pra conversar por aqui.
            </Text>
            {expandHref ? (
              <ChakraLink
                href={expandHref}
                fontSize="sm"
                fontWeight="700"
                color="var(--admin-primary)"
                _hover={{ textDecoration: "underline" }}
              >
                Conectar agora
              </ChakraLink>
            ) : null}
          </Stack>
        ) : chatAberto ? (
          /* ── Conversa ──────────────────────────────────── */
          <>
            <Box
              ref={fioRef}
              flex={1}
              overflowY="auto"
              px={3}
              py={2.5}
              position="relative"
              style={{ background: WA_CREAM, backgroundImage: `url("${WA_DOODLE}")` }}
              // Arrastar-e-soltar um arquivo em cima do fio = anexo.
              onDragOver={(e) => {
                if (!callbacks.onEnviarAnexo || !Array.from(e.dataTransfer.types).includes("Files")) return;
                e.preventDefault();
                setSoltando(true);
              }}
              onDragLeave={() => setSoltando(false)}
              onDrop={(e) => {
                if (!callbacks.onEnviarAnexo) return;
                e.preventDefault();
                setSoltando(false);
                anexar(arquivosDe(e.dataTransfer));
              }}
            >
              {soltando ? (
                <Flex
                  position="absolute"
                  inset={0}
                  align="center"
                  justify="center"
                  bg="rgba(37,211,102,0.14)"
                  border="2px dashed #25d366"
                  pointerEvents="none"
                  zIndex={1}
                >
                  <Text fontSize="sm" fontWeight="700" color="#075e54">
                    Solte pra anexar
                  </Text>
                </Flex>
              ) : null}
              {carregando ? (
                <HStack justify="center" py={6}>
                  <Spinner size="sm" />
                </HStack>
              ) : msgs.length === 0 ? (
                <Text fontSize="xs" color="#667781" textAlign="center" py={6}>
                  Sem mensagens nesta conversa.
                </Text>
              ) : (
                <Stack gap={1.5}>
                  {groupByDay(msgs).map((g) => (
                    <Stack key={g.label} gap={1.5}>
                      <Text
                        alignSelf="center"
                        fontSize="10px"
                        fontWeight="600"
                        color="#667781"
                        bg="rgba(255,255,255,0.85)"
                        borderRadius="6px"
                        px={2}
                        py="2px"
                      >
                        {g.label}
                      </Text>
                      {g.items.map((m) => (
                        <MessageBubble key={m.id} m={m} isGroup={chatAberto.isGroup} assistantName={assistantName} />
                      ))}
                    </Stack>
                  ))}
                </Stack>
              )}
            </Box>

            {erro ? (
              <Box bg="rgba(220,38,38,0.06)" borderTopWidth="1px" borderColor="rgba(220,38,38,0.2)" px={3} py={1.5} flexShrink={0}>
                <Text color="red.700" fontSize="11px">
                  {erro}
                </Text>
              </Box>
            ) : null}

            {anexos.length ? (
              <Box
                px={2.5}
                pt={2}
                pb={1}
                flexShrink={0}
                borderTopWidth="1px"
                borderColor="var(--admin-border)"
                bg="var(--admin-surface, white)"
              >
                <Text fontSize="10px" fontWeight="600" color="var(--admin-text-soft)" mb={1}>
                  {anexos.length === 1 ? "1 anexo pronto" : `${anexos.length} anexos prontos`} — escreva a legenda embaixo e Enviar
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  {anexos.map((f, i) => (
                    <Box
                      key={`${f.name}-${f.size}-${i}`}
                      position="relative"
                      borderWidth="1px"
                      borderColor="var(--admin-border)"
                      borderRadius="10px"
                      overflow="hidden"
                      bg="var(--admin-bg-soft, #f4f4f5)"
                      title={f.name}
                    >
                      {previews[i] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previews[i] as string} alt={f.name} style={{ width: 96, height: 96, objectFit: "cover", display: "block" }} />
                      ) : (
                        <Flex w="96px" h="64px" align="center" justify="center" px={2}>
                          <Text fontSize="10px" color="var(--admin-text-soft)" lineClamp={2} textAlign="center">
                            📎 {f.name}
                          </Text>
                        </Flex>
                      )}
                      <chakra.button
                        type="button"
                        onClick={() => setAnexos((prev) => prev.filter((_, j) => j !== i))}
                        position="absolute"
                        top="3px"
                        right="3px"
                        w="20px"
                        h="20px"
                        borderRadius="full"
                        display="inline-flex"
                        alignItems="center"
                        justifyContent="center"
                        color="white"
                        style={{ background: "rgba(0,0,0,0.55)" }}
                        aria-label="Tirar anexo"
                        title="Tirar este anexo"
                      >
                        <X size={12} />
                      </chakra.button>
                    </Box>
                  ))}
                </HStack>
              </Box>
            ) : null}

            <HStack
              gap={2}
              p={2.5}
              flexShrink={0}
              borderTopWidth="1px"
              borderColor="var(--admin-border)"
              bg="var(--admin-surface, white)"
              align={anexos.length ? "flex-end" : "center"}
            >
              {/* Textarea (e não Input): rascunho de proposta tem quebra de
                  linha, e o <input> do browser as descarta em silêncio. */}
              {callbacks.onEnviarAnexo ? (
                <>
                  <input
                    ref={fileRef}
                    type="file"
                    hidden
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      e.target.value = "";
                      anexar(files);
                    }}
                  />
                  <chakra.button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={anexando}
                    w="32px"
                    h="36px"
                    flexShrink={0}
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    color="var(--admin-text-soft)"
                    _hover={{ color: "var(--admin-text)" }}
                    opacity={anexando ? 0.5 : 1}
                    aria-label="Anexar arquivo"
                    title="Anexar (ou cole com Ctrl+V / arraste pro fio)"
                  >
                    {anexando ? <Spinner size="xs" /> : <Paperclip size={17} />}
                  </chakra.button>
                </>
              ) : null}
              <Textarea
                ref={textoRef}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void enviar();
                  }
                }}
                // Ctrl+V com imagem na área de transferência (print) = anexo.
                // Texto colado segue o caminho normal do textarea.
                onPaste={(e) => {
                  if (!callbacks.onEnviarAnexo) return;
                  const files = arquivosDe(e.clipboardData);
                  if (!files.length) return;
                  e.preventDefault();
                  anexar(files);
                }}
                placeholder={
                  anexos.length ? "Legenda (opcional)…" : callbacks.onEnviarAnexo ? "Escreva ou cole uma imagem…" : "Escreva uma mensagem…"
                }
                size="sm"
                rows={anexos.length ? 3 : texto.includes("\n") ? 3 : 1}
                resize="none"
                borderRadius="18px"
              />
              <chakra.button
                type="button"
                onClick={() => void enviar()}
                disabled={enviando || anexando || (!texto.trim() && !anexos.length)}
                w="36px"
                h="36px"
                flexShrink={0}
                borderRadius="full"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                color="white"
                style={{ background: "#25d366", opacity: enviando || anexando || (!texto.trim() && !anexos.length) ? 0.5 : 1 }}
                aria-label="Enviar"
                title={anexos.length ? "Enviar anexo(s) com a legenda" : "Enviar"}
              >
                {anexando ? <Spinner size="xs" /> : <Send size={16} />}
              </chakra.button>
            </HStack>
          </>
        ) : (
          /* ── Lista (com o seletor Conversas/Grupos) ────── */
          <>
            <HStack gap={1.5} px={2.5} pt={2.5} pb={1.5} flexShrink={0}>
              <SeletorBotao
                ativo={vista === "conversas"}
                onClick={() => setVista("conversas")}
                icon={<MessageCircle size={13} />}
                label="Conversas"
                count={conversas.length}
              />
              <SeletorBotao
                ativo={vista === "grupos"}
                onClick={() => setVista("grupos")}
                icon={<Users size={13} />}
                label="Grupos"
                count={grupos.length}
              />
            </HStack>

            <Box px={2.5} pb={2} flexShrink={0}>
              <HStack
                gap={2}
                px={2.5}
                py={1.5}
                borderRadius="10px"
                bg="var(--admin-surface-2)"
                borderWidth="1px"
                borderColor="var(--admin-border)"
              >
                <Search size={13} color="var(--admin-text-soft)" />
                <chakra.input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Procurar…"
                  flex={1}
                  fontSize="13px"
                  bg="transparent"
                  outline="none"
                  color="var(--admin-text)"
                />
              </HStack>
            </Box>

            <Box flex={1} overflowY="auto" borderTopWidth="1px" borderColor="var(--admin-border)">
              {loadingChats && lista.length === 0 ? (
                <HStack justify="center" py={8}>
                  <Spinner size="sm" />
                </HStack>
              ) : lista.length === 0 ? (
                <Text fontSize="xs" color="var(--admin-text-soft)" textAlign="center" py={8} px={4}>
                  {busca.trim()
                    ? "Nada encontrado."
                    : vista === "grupos"
                      ? "Nenhum grupo por aqui."
                      : "Nenhuma conversa ainda."}
                </Text>
              ) : (
                lista.map((c) => (
                  <ChatRow
                    key={c.chatId}
                    chat={c}
                    active={false}
                    assistantName={assistantName}
                    onOpen={(id) => void abrirConversa(id)}
                    onToggleFavorito={() => {}}
                  />
                ))
              )}
            </Box>
          </>
        )}
      </Flex>
      {callbacks.onNovaConversa ? (
        <NovaConversaModal
          open={novaOpen}
          onClose={() => setNovaOpen(false)}
          onEnviar={callbacks.onNovaConversa}
          onCriada={(id) => {
            setNovaOpen(false);
            setVirtualChat(null);
            // Nova conversa = a 1ª mensagem JÁ saiu (é assim que ela nasce).
            window.dispatchEvent(new CustomEvent<WhatsAppFabSent>(WA_FAB_SENT_EVENT, { detail: { chatId: id } }));
            void abrirConversa(id);
            void callbacks.onActualizar();
          }}
        />
      ) : null}
    </>
  );
}

function SeletorBotao({
  ativo,
  onClick,
  icon,
  label,
  count,
}: {
  ativo: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <HStack
      as="button"
      onClick={onClick}
      flex={1}
      justify="center"
      gap={1.5}
      px={2}
      py={1.5}
      borderRadius="9px"
      cursor="pointer"
      bg={ativo ? "var(--admin-nav-active)" : "transparent"}
      color={ativo ? "var(--admin-primary)" : "var(--admin-text-soft)"}
      _hover={{ bg: ativo ? "var(--admin-nav-active)" : "var(--admin-nav-hover)" }}
    >
      {icon}
      <Text fontSize="12px" fontWeight={ativo ? "700" : "500"}>
        {label}
      </Text>
      {count > 0 ? (
        <Text fontSize="10px" fontWeight="700" opacity={0.75}>
          {count}
        </Text>
      ) : null}
    </HStack>
  );
}
