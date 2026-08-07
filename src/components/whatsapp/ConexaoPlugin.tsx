"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, HStack, Stack, Text } from "../../primitives";
import { Switch } from "../controls";
import { Button } from "../Button";
import { Card } from "../Card";
import { Tag } from "../Badge";
import { FormGrid, FormInput, FormSelect } from "../form";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  KeyRound,
  Puzzle,
  RefreshCw,
  Trash2,
} from "lucide-react";

/**
 * Painel do **Plugin WhatsApp** — a extensão do Chrome que conduz o WhatsApp Web
 * já logado no navegador da pessoa. Terceiro canal, ao lado do servidor-whats
 * (Baileys) e da Meta (Cloud API).
 *
 * Tudo o que a pessoa precisa numa tela só: baixar, instalar, ligar ao painel
 * pelo código e ver se está mesmo vivo — mais o ritmo com que a fila sai.
 *
 * PURO por contrato: nada de fetch, actions ou router aqui. Quem monta injeta os
 * dados e os callbacks; este arquivo é o mesmo em qualquer app (site, sistema,
 * representantes).
 */

export type PluginDeviceView = {
  id: string;
  label: string;
  phone: string | null;
  status: string;
  online: boolean;
  pluginVersion: string | null;
  lastSeen: string | null;
  pairedAt: string | null;
};

export type PluginFilaView = {
  pendentes: number;
  hoje: number;
  falhas: number;
  proximo: string | null;
};

export type PluginConfigView = {
  enabled: boolean;
  primary: boolean;
  dailyCap: number;
  minGapMs: number;
  maxGapMs: number;
  quietStart: number;
  quietEnd: number;
  tz: string;
  checkExists: boolean;
  composingMs: number;
  ai: boolean;
};

export type PluginCodigo = { code: string; expiresAt: string };

export interface ConexaoPluginProps {
  config: PluginConfigView;
  devices: PluginDeviceView[];
  fila: PluginFilaView;
  /** Teto de envios frios de hoje já resolvido pela rampa (só informativo). */
  capHoje: number;
  /** Onde o .zip da extensão está publicado. */
  downloadUrl: string;
  /** Versão publicada do .zip (aparece ao lado do botão). */
  versao?: string | null;
  /**
   * Mostrar o interruptor da IA. Falso onde este canal não tem IA ligada (o
   * painel do representante, onde o plugin é braço de prospeção): um botão que
   * não faz nada mente para quem o liga.
   */
  mostrarIa?: boolean;
  onSalvar: (config: PluginConfigView) => Promise<void>;
  onGerarCodigo: () => Promise<PluginCodigo>;
  onRevogar: (deviceId: string) => Promise<void>;
  onAtualizar: () => Promise<{ devices: PluginDeviceView[]; fila: PluginFilaView }>;
}

const HORAS = Array.from({ length: 24 }, (_, h) => ({
  value: String(h),
  label: `${String(h).padStart(2, "0")}:00`,
}));
const HORAS_FIM = [...HORAS.slice(1), { value: "24", label: "24:00" }];

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function quando(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

/** Passo numerado do guia de instalação. */
function Passo({ n, titulo, children }: { n: number; titulo: string; children?: React.ReactNode }) {
  return (
    <HStack align="flex-start" gap={3}>
      <Box
        minW="26px"
        h="26px"
        borderRadius="full"
        bg="var(--admin-primary)"
        color="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="xs"
        fontWeight="700"
      >
        {n}
      </Box>
      <Stack gap={2} flex="1" minW={0}>
        <Text fontWeight="600" color="var(--admin-text)">
          {titulo}
        </Text>
        {children}
      </Stack>
    </HStack>
  );
}

/** Texto para copiar (endereço, código) — o clique copia e confirma. */
function Copiavel({ valor, mono = true }: { valor: string; mono?: boolean }) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <HStack gap={2} w="full">
      <Text
        flex={1}
        overflow="auto"
        px={3}
        py={2}
        fontSize="sm"
        fontFamily={mono ? "mono" : undefined}
        bg="var(--admin-surface)"
        borderWidth="1px"
        borderColor="var(--admin-border)"
        borderRadius="8px"
        whiteSpace="nowrap"
      >
        {valor}
      </Text>
      <Button
        size="sm"
        tone="outline"
        onClick={() => {
          void navigator.clipboard?.writeText(valor).catch(() => {});
          setCopiado(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopiado(false), 1500);
        }}
      >
        {copiado ? <Check size={14} /> : <Copy size={14} />}
      </Button>
    </HStack>
  );
}

function Numero({ rotulo, valor, tone }: { rotulo: string; valor: string; tone?: string }) {
  return (
    <Stack gap={0} minW="92px">
      <Text fontSize="xl" fontWeight="700" color={tone ?? "var(--admin-text)"}>
        {valor}
      </Text>
      <Text fontSize="xs" color="var(--admin-text-soft)">
        {rotulo}
      </Text>
    </Stack>
  );
}

export function ConexaoPlugin({
  config,
  devices,
  fila,
  capHoje,
  downloadUrl,
  versao,
  mostrarIa = true,
  onSalvar,
  onGerarCodigo,
  onRevogar,
  onAtualizar,
}: ConexaoPluginProps) {
  const [form, setForm] = useState<PluginConfigView>(config);
  const [lista, setLista] = useState<PluginDeviceView[]>(devices);
  const [resumo, setResumo] = useState<PluginFilaView>(fila);
  const [codigo, setCodigo] = useState<PluginCodigo | null>(null);
  const [restante, setRestante] = useState(0);
  const [gerando, setGerando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const ocupado = useRef(false);

  const set = (patch: Partial<PluginConfigView>) => setForm((c) => ({ ...c, ...patch }));

  // Os dados do servidor mandam: um `router.refresh()` do wrapper reescreve o
  // que está na tela (ex.: o device que acabou de parear). O formulário fica de
  // fora de propósito — um refresh no meio da edição apagaria o que a pessoa
  // estava preenchendo.
  useEffect(() => setLista(devices), [devices]);
  useEffect(() => setResumo(fila), [fila]);

  const atualizar = useCallback(async () => {
    if (ocupado.current) return;
    ocupado.current = true;
    try {
      const r = await onAtualizar();
      setLista(r.devices);
      setResumo(r.fila);
    } catch {
      /* atualização de fundo não incomoda a tela */
    } finally {
      ocupado.current = false;
    }
  }, [onAtualizar]);

  // O pareamento acontece no OUTRO lado (o navegador da pessoa). Sem sondar,
  // ela colaria o código e ficaria olhando para uma tela que não muda.
  useEffect(() => {
    if (!form.enabled) return;
    const id = setInterval(() => void atualizar(), 8000);
    return () => clearInterval(id);
  }, [form.enabled, atualizar]);

  useEffect(() => {
    if (!codigo) return;
    const alvo = new Date(codigo.expiresAt).getTime();
    const tick = () => setRestante(alvo - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [codigo]);

  const expirado = Boolean(codigo) && restante <= 0;
  const online = lista.filter((d) => d.online).length;

  async function gerar() {
    setErr(null);
    setMsg(null);
    setGerando(true);
    try {
      const r = await onGerarCodigo();
      setCodigo(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Não consegui gerar o código.");
    } finally {
      setGerando(false);
    }
  }

  async function salvar() {
    setErr(null);
    setMsg(null);
    setSalvando(true);
    try {
      await onSalvar(form);
      setMsg("Configuração do plugin salva.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function revogar(id: string) {
    setErr(null);
    try {
      await onRevogar(id);
      setLista((c) => c.filter((d) => d.id !== id));
      setMsg("Navegador desligado. Ele perde o acesso na próxima tentativa.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao desligar o navegador.");
    }
  }

  const header = (
    <HStack justify="space-between" gap={3} flexWrap="wrap" w="full">
      <HStack gap={3}>
        <Box
          w="40px"
          h="40px"
          borderRadius="12px"
          bg="rgba(16,185,129,0.12)"
          color="#047857"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Puzzle size={20} />
        </Box>
        <Stack gap={0}>
          <Text fontWeight="700" color="var(--admin-primary)">
            Plugin WhatsApp (extensão do Chrome)
          </Text>
          <HStack gap={1.5} flexWrap="wrap">
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Usa o WhatsApp Web já logado no navegador — sem QR novo, sem aparelho a mais.
            </Text>
            {online > 0 ? (
              <Tag bg="rgba(34,197,94,0.14)" color="#15803d">
                {online} navegador{online > 1 ? "es" : ""} ligado{online > 1 ? "s" : ""}
              </Tag>
            ) : lista.length > 0 ? (
              <Tag bg="rgba(234,179,8,0.16)" color="#a16207">aguardando navegador</Tag>
            ) : null}
          </HStack>
        </Stack>
      </HStack>
      <Switch.Root checked={form.enabled} onCheckedChange={(d) => set({ enabled: Boolean(d.checked) })}>
        <Switch.HiddenInput />
        <Switch.Control />
        <Switch.Label>{form.enabled ? "Ativo" : "Inativo"}</Switch.Label>
      </Switch.Root>
    </HStack>
  );

  return (
    <Card title={header}>
      <Stack gap={5}>
        {/* Não é um detalhe legal escondido no rodapé: automatizar o WhatsApp Web
            é o que mais banimento causa, e quem liga isto tem de saber. */}
        <HStack
          align="flex-start"
          gap={3}
          bg="rgba(234,179,8,0.10)"
          borderWidth="1px"
          borderColor="rgba(234,179,8,0.35)"
          borderRadius="12px"
          p={4}
        >
          <Box color="#a16207" pt="2px">
            <AlertTriangle size={18} />
          </Box>
          <Stack gap={1}>
            <Text fontSize="sm" fontWeight="700" color="#a16207">
              Leia antes de ligar: existe risco de banimento.
            </Text>
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Conduzir o WhatsApp Web por automação contraria os Termos da Meta, e números que
              disparam em massa por aqui são bloqueados com frequência — inclusive de forma
              permanente. As travas abaixo (conferir se o número existe, ritmo sorteado, teto do dia
              com aquecimento e janela de horário) reduzem muito o risco, mas não o eliminam. Use um
              número que você pode perder e mande para quem espera a sua mensagem.
            </Text>
          </Stack>
        </HStack>

        {/* ---------------------------------------------------------- instalar */}
        <Stack gap={4}>
          <Passo n={1} titulo="Baixe o plugin">
            <HStack gap={3} flexWrap="wrap">
              <Button asChild tone="outline" size="sm">
                <a href={downloadUrl} download>
                  <Download size={14} style={{ marginRight: 6 }} /> Baixar plugin (.zip)
                </a>
              </Button>
              {versao ? (
                <Text fontSize="xs" color="var(--admin-text-soft)">
                  versão {versao}
                </Text>
              ) : null}
            </HStack>
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Descompacte o arquivo numa pasta que vá <strong>ficar no computador</strong> (ex.:
              Documentos/plugin-whatsapp). Se apagar a pasta, a extensão some do Chrome.
            </Text>
          </Passo>

          <Passo n={2} titulo="Instale no Chrome">
            <Copiavel valor="chrome://extensions" />
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Cole o endereço acima na barra do Chrome, ligue o <strong>Modo do desenvolvedor</strong>
              {" "}(canto superior direito), clique em <strong>Carregar sem compactação</strong> e
              escolha a pasta que você descompactou. Serve também no Edge, no Brave e no Opera.
            </Text>
          </Passo>

          <Passo n={3} titulo="Ligue a extensão a este painel">
            {!form.enabled ? (
              <Text fontSize="sm" color="#a16207">
                Ative o canal no interruptor acima para gerar o código.
              </Text>
            ) : (
              <Stack gap={2}>
                <HStack gap={3} flexWrap="wrap">
                  <Button size="sm" onClick={gerar} loading={gerando}>
                    <KeyRound size={14} style={{ marginRight: 6 }} /> Gerar código de conexão
                  </Button>
                  <Text fontSize="xs" color="var(--admin-text-soft)">
                    Vale 15 minutos e serve uma vez só.
                  </Text>
                </HStack>
                {codigo ? (
                  <Stack gap={1.5}>
                    <Copiavel valor={codigo.code} />
                    <Text fontSize="xs" color={expirado ? "#b91c1c" : "var(--admin-text-soft)"}>
                      {expirado
                        ? "Código expirado — gere outro."
                        : `Válido por ${mmss(restante)}. Abra o plugin no Chrome, cole no campo “Código de conexão” e clique em Ligar.`}
                    </Text>
                  </Stack>
                ) : null}
              </Stack>
            )}
          </Passo>

          <Passo n={4} titulo="Deixe o WhatsApp Web aberto">
            <Text fontSize="sm" color="var(--admin-text-soft)">
              Abra <strong>web.whatsapp.com</strong> com a conta que vai enviar e deixe a aba aberta.
              O plugin só consegue enviar com essa aba viva — com o navegador fechado, a fila espera
              (não se perde).
            </Text>
          </Passo>
        </Stack>

        {/* ---------------------------------------------------------- devices */}
        <Stack gap={2}>
          <HStack justify="space-between" flexWrap="wrap" gap={2}>
            <Text fontWeight="700" color="var(--admin-text)">
              Navegadores ligados
            </Text>
            <Button
              size="sm"
              tone="ghost"
              loading={atualizando}
              onClick={() => {
                setAtualizando(true);
                void atualizar().finally(() => setAtualizando(false));
              }}
            >
              <RefreshCw size={14} style={{ marginRight: 6 }} /> Verificar conexão
            </Button>
          </HStack>

          {lista.length === 0 ? (
            <Box
              borderWidth="1px"
              borderStyle="dashed"
              borderColor="var(--admin-border)"
              borderRadius="12px"
              px={4}
              py={5}
            >
              <Text fontSize="sm" color="var(--admin-text-soft)">
                Nenhum navegador ligado ainda. Faça os passos acima — assim que o plugin aceitar o
                código, ele aparece aqui sozinho.
              </Text>
            </Box>
          ) : (
            <Stack gap={2}>
              {lista.map((d) => (
                <HStack
                  key={d.id}
                  justify="space-between"
                  flexWrap="wrap"
                  gap={3}
                  borderWidth="1px"
                  borderColor="var(--admin-border)"
                  borderRadius="12px"
                  px={4}
                  py={3}
                >
                  <HStack gap={3} minW={0}>
                    <Box
                      w="10px"
                      h="10px"
                      borderRadius="full"
                      bg={d.online ? "#22c55e" : "#94a3b8"}
                      flexShrink={0}
                    />
                    <Stack gap={0} minW={0}>
                      <HStack gap={2} flexWrap="wrap">
                        <Text fontWeight="700" lineClamp={1}>
                          {d.label}
                        </Text>
                        {d.phone ? (
                          <Tag bg="rgba(34,197,94,0.14)" color="#15803d">+{d.phone}</Tag>
                        ) : (
                          <Tag bg="rgba(100,116,139,0.14)" color="#475569">sem número</Tag>
                        )}
                        {d.pluginVersion ? (
                          <Text fontSize="xs" color="var(--admin-text-soft)">
                            v{d.pluginVersion}
                          </Text>
                        ) : null}
                      </HStack>
                      <Text fontSize="xs" color="var(--admin-text-soft)">
                        {d.online ? "Ligado agora" : `Visto em ${quando(d.lastSeen)}`}
                      </Text>
                    </Stack>
                  </HStack>
                  <Button size="sm" tone="ghost" onClick={() => void revogar(d.id)}>
                    <Trash2 size={14} style={{ marginRight: 6 }} /> Desligar
                  </Button>
                </HStack>
              ))}
            </Stack>
          )}
        </Stack>

        {/* ---------------------------------------------------------- fila */}
        <Box bg="var(--admin-surface-2)" borderRadius="12px" p={4}>
          <HStack gap={8} flexWrap="wrap">
            <Numero rotulo="na fila" valor={String(resumo.pendentes)} />
            <Numero rotulo="enviadas (24h)" valor={String(resumo.hoje)} tone="#15803d" />
            <Numero rotulo="falhas (24h)" valor={String(resumo.falhas)} tone={resumo.falhas ? "#b91c1c" : undefined} />
            <Numero rotulo="teto de hoje" valor={String(capHoje)} />
            <Stack gap={0} minW="150px">
              <Text fontSize="sm" fontWeight="600">
                {resumo.proximo ? quando(resumo.proximo) : "—"}
              </Text>
              <Text fontSize="xs" color="var(--admin-text-soft)">
                próximo disparo
              </Text>
            </Stack>
          </HStack>
        </Box>

        {/* ---------------------------------------------------------- config */}
        <Stack gap={4}>
          <Stack gap={2}>
            <Switch.Root checked={form.primary} onCheckedChange={(d) => set({ primary: Boolean(d.checked) })}>
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>Usar o plugin como canal de saída principal</Switch.Label>
            </Switch.Root>
            <Text fontSize="xs" color="var(--admin-text-soft)">
              Ligado, tudo o que o painel enviar sai por este navegador. Sem navegador vivo, o envio
              volta para o servidor-whats sozinho — é melhor sair pelo outro canal do que não sair.
            </Text>

            {mostrarIa ? (
              <Switch.Root checked={form.ai} onCheckedChange={(d) => set({ ai: Boolean(d.checked) })}>
                <Switch.HiddenInput />
                <Switch.Control />
                <Switch.Label>A IA responde o que chegar por aqui</Switch.Label>
              </Switch.Root>
            ) : null}

            <Switch.Root checked={form.checkExists} onCheckedChange={(d) => set({ checkExists: Boolean(d.checked) })}>
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label>Conferir se o número existe antes de enviar</Switch.Label>
            </Switch.Root>
            <Text fontSize="xs" color="var(--admin-text-soft)">
              Disparar para número que não existe é o caminho mais curto para o banimento. Desligue
              só se souber exatamente por quê.
            </Text>
          </Stack>

          <FormGrid columns={2}>
            <FormInput
              label="Teto de mensagens frias por dia"
              help={`0 = aquecimento automático (hoje: ${capHoje}/dia).`}
              type="number"
              min={0}
              max={5000}
              value={String(form.dailyCap)}
              onChange={(e) => set({ dailyCap: Number(e.target.value) || 0 })}
            />
            <FormInput
              label="Simular digitação (ms)"
              help="0 = automático pelo tamanho do texto."
              type="number"
              min={0}
              max={15000}
              value={String(form.composingMs)}
              onChange={(e) => set({ composingMs: Number(e.target.value) || 0 })}
            />
          </FormGrid>

          <FormGrid columns={2}>
            <FormInput
              label="Intervalo mínimo (segundos)"
              help="Espaçamento entre disparos de campanha — sorteado entre o mínimo e o máximo."
              type="number"
              min={5}
              max={600}
              value={String(Math.round(form.minGapMs / 1000))}
              onChange={(e) => set({ minGapMs: Math.max(5, Number(e.target.value) || 5) * 1000 })}
            />
            <FormInput
              label="Intervalo máximo (segundos)"
              type="number"
              min={5}
              max={900}
              value={String(Math.round(form.maxGapMs / 1000))}
              onChange={(e) => set({ maxGapMs: Math.max(5, Number(e.target.value) || 5) * 1000 })}
            />
          </FormGrid>

          <FormGrid columns={3}>
            <FormSelect
              label="Enviar a partir das"
              options={HORAS}
              value={String(form.quietStart)}
              onChange={(e) => set({ quietStart: Number(e.target.value) })}
            />
            <FormSelect
              label="Parar às"
              options={HORAS_FIM}
              value={String(form.quietEnd)}
              onChange={(e) => set({ quietEnd: Number(e.target.value) })}
            />
            <FormInput
              label="Fuso horário"
              value={form.tz}
              placeholder="America/Sao_Paulo"
              onChange={(e) => set({ tz: e.target.value })}
            />
          </FormGrid>
        </Stack>

        <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
          {err ? (
            <Text color="#b91c1c" fontSize="sm" fontWeight="600">
              {err}
            </Text>
          ) : msg ? (
            <Text color="#15803d" fontSize="sm" fontWeight="600">
              {msg}
            </Text>
          ) : (
            <Box />
          )}
          <Button onClick={salvar} loading={salvando}>
            Salvar plugin
          </Button>
        </HStack>
      </Stack>
    </Card>
  );
}
