"use client";

import { useState, type ReactNode } from "react";
import { Box, HStack, Stack, Text } from "../../primitives";
import { Button } from "../Button";
import { Card } from "../Card";
import { Tag } from "../Badge";
import { Modal } from "../Modal";
import { FormInput, FormTextarea } from "../form";
import { ArrowRight, Check, Chrome, Clock, Cloud, Plus, Smartphone, TriangleAlert } from "lucide-react";

/**
 * CONTAS de WhatsApp do painel — a porta de entrada que responde "por onde este
 * painel fala no WhatsApp?" antes de qualquer configuração.
 *
 * Por que existe: antes eram três blocos soltos (servidor-whats, Meta, Plugin) e
 * a pessoa precisava saber a diferença técnica entre eles pra escolher. Aqui a
 * pergunta é outra — **como você quer ligar?** — e cada via se explica pelo que
 * muda na vida dela (sai em 2 minutos × precisa de liberação; depende do PC
 * ligado × roda sozinho). Escolheu, o painel daquela via abre ali mesmo, no
 * mesmo fluxo, sem caça ao acordeão.
 *
 * Número próprio não se cria sozinho: quem não tem autorização PEDE por aqui e
 * o José aprova no sistema. O Plugin (WhatsApp Web do próprio navegador) não
 * precisa de nada disso — é o caminho de quem quer começar hoje.
 *
 * PURO por contrato: nada de fetch, action ou router. O app injeta as contas, os
 * painéis prontos e os callbacks — é o mesmo componente no cliente, no sistema e
 * no representante.
 */

export type WaContaModo = "plugin" | "instancia" | "meta";

export type WaContaView = {
  id: string;
  modo: WaContaModo;
  /** Como a pessoa reconhece a conta: apelido, número, nome do navegador. */
  nome: string;
  detalhe?: string | null;
  conectado: boolean;
  /** Alerta na própria conta (ex.: o mesmo número ligado por duas vias). */
  aviso?: string | null;
};

export type WaPedidoStatus = "pendente" | "aprovada" | "recusada" | "cancelada" | "usada";

export type WaPedidoView = {
  status: WaPedidoStatus;
  label: string | null;
  phone: string | null;
  motivo: string | null;
};

export type WaContaAcao = { ok: boolean; error?: string };

export interface ContasWhatsAppProps {
  contas: WaContaView[];
  /** Vias que ESTE painel pode adicionar (representante/cliente sem número: só `plugin`). */
  modos: WaContaModo[];
  /** Painel pronto de cada via (o app injeta: plugin, formulário de conexão, Meta). */
  paineis?: Partial<Record<WaContaModo, ReactNode>>;
  /** Pedido em aberto (ou a última recusa, para a tela explicar o motivo). */
  pedido?: WaPedidoView | null;
  /** O José já aprovou: em vez de pedir, a pessoa cria o número. */
  podeCriarInstancia?: boolean;
  onCriarInstancia?: (nome: string) => Promise<WaContaAcao>;
  onSolicitar?: (input: { label: string; phone: string; note: string }) => Promise<WaContaAcao>;
  onCancelarPedido?: () => Promise<WaContaAcao>;
}

const MODOS: Record<
  WaContaModo,
  { titulo: string; curto: string; icone: typeof Chrome; resumo: string; bom: string[]; atencao: string }
> = {
  plugin: {
    titulo: "Usar o WhatsApp deste navegador",
    curto: "Navegador",
    icone: Chrome,
    resumo: "O painel usa o WhatsApp Web que você já deixa aberto no Chrome.",
    bom: ["Pronto em 2 minutos", "Sem número novo", "Sem liberação"],
    atencao: "Só envia com o computador ligado e o WhatsApp Web aberto.",
  },
  instancia: {
    titulo: "Escanear um número próprio",
    curto: "Número próprio",
    icone: Smartphone,
    resumo: "Um número dedicado, ligado no nosso servidor — trabalha sozinho, dia e noite.",
    bom: ["Roda 24h sem o seu PC", "Campanhas maiores", "A IA atende sempre"],
    atencao: "Precisa de liberação: você pede aqui e a gente aprova.",
  },
  meta: {
    titulo: "WhatsApp oficial (Meta)",
    curto: "Oficial (Meta)",
    icone: Cloud,
    resumo: "Número oficial da Meta, o mesmo usado na captação e nos anúncios.",
    bom: ["Selo oficial", "Ligado aos anúncios", "Sem risco de bloqueio"],
    atencao: "A configuração é feita junto com a gente.",
  },
};

const PILL: Record<WaContaModo, { bg: string; color: string }> = {
  plugin: { bg: "rgba(37,211,102,0.14)", color: "#15803d" },
  instancia: { bg: "rgba(59,130,246,0.14)", color: "#1d4ed8" },
  meta: { bg: "rgba(168,85,247,0.14)", color: "#7c3aed" },
};

function apenasDigitos(v: string): string {
  return v.replace(/\D/g, "");
}

/** Cartão clicável de uma via de conexão (passo "escolha" do modal). */
function OpcaoModo({ modo, onClick }: { modo: WaContaModo; onClick: () => void }) {
  const m = MODOS[modo];
  const Icone = m.icone;
  return (
    <Box
      as="button"
      onClick={onClick}
      textAlign="left"
      w="full"
      borderWidth="1px"
      borderColor="var(--admin-border)"
      borderRadius="14px"
      p={4}
      bg="var(--admin-surface)"
      cursor="pointer"
      transition="border-color .15s, box-shadow .15s"
      _hover={{ borderColor: "var(--admin-primary)", boxShadow: "0 6px 18px rgba(15,23,42,0.08)" }}
    >
      <HStack align="flex-start" gap={3}>
        <Box
          minW="38px"
          h="38px"
          borderRadius="12px"
          bg={PILL[modo].bg}
          color={PILL[modo].color}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icone size={19} />
        </Box>
        <Stack gap={1.5} flex="1" minW={0}>
          <HStack justify="space-between" gap={2}>
            <Text fontWeight="700" color="var(--admin-primary)">{m.titulo}</Text>
            <ArrowRight size={16} />
          </HStack>
          <Text fontSize="sm" color="var(--admin-text-soft)">{m.resumo}</Text>
          <HStack gap={1.5} flexWrap="wrap">
            {m.bom.map((b) => (
              <Tag key={b} bg="rgba(34,197,94,0.12)" color="#15803d">
                <Check size={11} /> {b}
              </Tag>
            ))}
          </HStack>
          <HStack gap={1.5} color="var(--admin-text-soft)">
            <TriangleAlert size={13} />
            <Text fontSize="xs">{m.atencao}</Text>
          </HStack>
        </Stack>
      </HStack>
    </Box>
  );
}

type Passo = "escolha" | "pedido" | "painel";

export function ContasWhatsApp({
  contas,
  modos,
  paineis,
  pedido,
  podeCriarInstancia = false,
  onCriarInstancia,
  onSolicitar,
  onCancelarPedido,
}: ContasWhatsAppProps) {
  const [aberto, setAberto] = useState(false);
  const [passo, setPasso] = useState<Passo>("escolha");
  const [modo, setModo] = useState<WaContaModo>("plugin");
  const [nome, setNome] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const pendente = pedido?.status === "pendente";
  const recusado = pedido?.status === "recusada";
  const soUmaVia = modos.length === 1;

  function irPara(m: WaContaModo) {
    setModo(m);
    setErro(null);
    // Número próprio passa pelo pedido/criação antes do QR; as outras vias abrem
    // o painel direto — não há o que autorizar.
    setPasso(m === "instancia" || !paineis?.[m] ? "pedido" : "painel");
  }

  function abrir() {
    setErro(null);
    if (soUmaVia) irPara(modos[0]);
    else setPasso("escolha");
    setAberto(true);
  }

  function ajustar(conta: WaContaView) {
    setModo(conta.modo);
    setErro(null);
    setPasso("painel");
    setAberto(true);
  }

  async function confirmarNumero() {
    setErro(null);
    setSalvando(true);
    try {
      if (podeCriarInstancia && onCriarInstancia) {
        const r = await onCriarInstancia(nome.trim() || "Meu número");
        if (!r.ok) {
          setErro(r.error || "Não deu certo criar o número.");
          return;
        }
        // Criou: o próximo passo real é parear — abre o painel da conexão.
        if (paineis?.instancia) {
          setPasso("painel");
          return;
        }
      } else {
        const r = await onSolicitar?.({ label: nome.trim(), phone: apenasDigitos(phone), note: note.trim() });
        if (r && !r.ok) {
          setErro(r.error || "Não deu certo enviar o pedido.");
          return;
        }
      }
      setAberto(false);
      setNome("");
      setPhone("");
      setNote("");
    } finally {
      setSalvando(false);
    }
  }

  async function cancelarPedido() {
    setSalvando(true);
    try {
      const r = await onCancelarPedido?.();
      if (r && !r.ok) setErro(r.error || "Falha ao cancelar o pedido.");
    } finally {
      setSalvando(false);
    }
  }

  const botaoAdicionar = (
    <Button tone="primary" size="sm" onClick={abrir}>
      <Plus size={15} /> Ligar um WhatsApp
    </Button>
  );

  const tituloModal =
    passo === "escolha"
      ? "Ligar um WhatsApp"
      : passo === "pedido"
        ? podeCriarInstancia
          ? "Criar número próprio"
          : "Pedir um número próprio"
        : MODOS[modo].titulo;

  return (
    <Stack gap={4}>
      {contas.length === 0 ? (
        <Card>
          <Stack gap={3} align="flex-start">
            <Text fontWeight="700" color="var(--admin-primary)">Nenhum WhatsApp ligado ainda</Text>
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Ligue um WhatsApp para o painel conversar, disparar campanhas e deixar a IA atender.
              O caminho mais rápido é usar o WhatsApp Web que você já deixa aberto neste navegador.
            </Text>
            {botaoAdicionar}
          </Stack>
        </Card>
      ) : (
        <Stack gap={3}>
          <HStack justify="space-between" flexWrap="wrap" gap={2}>
            <Text fontSize="sm" color="var(--admin-text-soft)">
              {contas.length === 1 ? "1 WhatsApp ligado" : `${contas.length} WhatsApps ligados`}
            </Text>
            {botaoAdicionar}
          </HStack>

          {contas.map((c) => {
            const p = PILL[c.modo];
            const Icone = MODOS[c.modo].icone;
            return (
              <Box
                key={`${c.modo}:${c.id}`}
                borderWidth="1px"
                borderColor="var(--admin-border)"
                borderRadius="14px"
                px={4}
                py={3.5}
                bg="var(--admin-surface)"
              >
                <HStack justify="space-between" gap={3} flexWrap="wrap">
                  <HStack gap={3} minW={0}>
                    <Box
                      minW="34px"
                      h="34px"
                      borderRadius="10px"
                      bg={p.bg}
                      color={p.color}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icone size={17} />
                    </Box>
                    <Stack gap={0.5} minW={0}>
                      <HStack gap={2} flexWrap="wrap">
                        <Text fontWeight="700" color="var(--admin-text)" lineClamp={1}>{c.nome}</Text>
                        <Tag bg={p.bg} color={p.color}>{MODOS[c.modo].curto}</Tag>
                        <Tag
                          bg={c.conectado ? "rgba(34,197,94,0.12)" : "rgba(100,116,139,0.14)"}
                          color={c.conectado ? "#15803d" : "#475569"}
                        >
                          {c.conectado ? "No ar" : "Desligado"}
                        </Tag>
                      </HStack>
                      {c.detalhe ? (
                        <Text fontSize="xs" color="var(--admin-text-soft)">{c.detalhe}</Text>
                      ) : null}
                      {c.aviso ? (
                        <HStack gap={1.5} color="#b45309">
                          <TriangleAlert size={13} />
                          <Text fontSize="xs">{c.aviso}</Text>
                        </HStack>
                      ) : null}
                    </Stack>
                  </HStack>
                  {paineis?.[c.modo] ? (
                    <Button tone="outline" size="sm" onClick={() => ajustar(c)}>Ajustar</Button>
                  ) : null}
                </HStack>
              </Box>
            );
          })}
        </Stack>
      )}

      {pendente ? (
        <Card>
          <HStack justify="space-between" gap={3} flexWrap="wrap">
            <HStack gap={2.5} color="var(--admin-text-soft)" align="flex-start">
              <Clock size={17} />
              <Stack gap={0.5}>
                <Text fontSize="sm" fontWeight="600" color="var(--admin-text)">
                  Pedido de número enviado{pedido?.label ? ` — ${pedido.label}` : ""}
                </Text>
                <Text fontSize="xs">
                  Assim que a gente aprovar, o botão de criar o número aparece aqui. Enquanto isso,
                  o WhatsApp deste navegador já resolve.
                </Text>
              </Stack>
            </HStack>
            {onCancelarPedido ? (
              <Button tone="ghost" size="sm" onClick={cancelarPedido} disabled={salvando}>
                Cancelar pedido
              </Button>
            ) : null}
          </HStack>
        </Card>
      ) : null}

      {recusado && pedido?.motivo ? (
        <Card>
          <HStack gap={2.5} align="flex-start" color="var(--admin-text-soft)">
            <TriangleAlert size={17} />
            <Stack gap={0.5}>
              <Text fontSize="sm" fontWeight="600" color="var(--admin-text)">Pedido de número recusado</Text>
              <Text fontSize="xs">{pedido.motivo}</Text>
            </Stack>
          </HStack>
        </Card>
      ) : null}

      {podeCriarInstancia ? (
        <Card>
          <HStack justify="space-between" gap={3} flexWrap="wrap">
            <HStack gap={2.5}>
              <Check size={17} color="#15803d" />
              <Text fontSize="sm">
                Seu número próprio foi <strong>liberado</strong>. Crie e escaneie quando quiser.
              </Text>
            </HStack>
            <Button tone="primary" size="sm" onClick={() => { irPara("instancia"); setAberto(true); }}>
              Criar número
            </Button>
          </HStack>
        </Card>
      ) : null}

      <Modal
        open={aberto}
        onClose={() => setAberto(false)}
        title={tituloModal}
        size={passo === "painel" ? "xl" : "md"}
        footer={
          passo === "pedido" && !pendente ? (
            <>
              {soUmaVia ? null : (
                <Button tone="ghost" onClick={() => setPasso("escolha")}>Voltar</Button>
              )}
              <Button tone="primary" onClick={confirmarNumero} disabled={salvando}>
                {podeCriarInstancia ? "Criar número" : "Enviar pedido"}
              </Button>
            </>
          ) : undefined
        }
      >
        {passo === "escolha" ? (
          <Stack gap={3}>
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Como você quer que o painel fale no WhatsApp?
            </Text>
            {modos.map((m) => (
              <OpcaoModo key={m} modo={m} onClick={() => irPara(m)} />
            ))}
          </Stack>
        ) : passo === "painel" ? (
          <Stack gap={3}>
            {soUmaVia ? null : (
              <Box>
                <Button tone="ghost" size="sm" onClick={() => setPasso("escolha")}>Voltar</Button>
              </Box>
            )}
            {paineis?.[modo] ?? (
              <Text fontSize="sm" color="var(--admin-text-soft)">
                Esta via ainda não está disponível neste painel.
              </Text>
            )}
          </Stack>
        ) : pendente ? (
          <Stack gap={3}>
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Você já tem um pedido de número esperando aprovação. Assim que a gente liberar, o
              botão de criar aparece aqui — e a gente avisa.
            </Text>
            {onCancelarPedido ? (
              <Box>
                <Button tone="ghost" size="sm" onClick={cancelarPedido} disabled={salvando}>
                  Cancelar pedido
                </Button>
              </Box>
            ) : null}
            {erro ? <Text fontSize="sm" color="#b91c1c">{erro}</Text> : null}
          </Stack>
        ) : podeCriarInstancia ? (
          <Stack gap={3}>
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Dê um apelido para reconhecer este número no painel. No passo seguinte você escaneia o
              QR com o celular.
            </Text>
            <FormInput
              label="Apelido do número"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Comercial, Recepção, Vendas"
              maxLength={60}
            />
            {erro ? <Text fontSize="sm" color="#b91c1c">{erro}</Text> : null}
          </Stack>
        ) : (
          <Stack gap={3}>
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Conte pra gente qual número você quer ligar. A liberação costuma sair no mesmo dia —
              enquanto isso, use o WhatsApp deste navegador.
            </Text>
            <FormInput
              label="Apelido do número"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Comercial, Recepção, Vendas"
              maxLength={60}
            />
            <FormInput
              label="Número (com DDD)"
              help="Só para a gente saber qual aparelho vai ser escaneado."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="5581999990000"
              inputMode="numeric"
              maxLength={20}
            />
            <FormTextarea
              label="Quer contar algo mais? (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Ex.: é o número que já usamos no atendimento da loja."
            />
            {erro ? <Text fontSize="sm" color="#b91c1c">{erro}</Text> : null}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
