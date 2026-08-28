"use client";

import { useMemo, useState, useTransition } from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { Search, FileText, ExternalLink, ShieldAlert, ShieldCheck, Layers, MessageCircle } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { Tag } from "./Badge";
import { TextoCopiavel } from "./TextoCopiavel";
import { FormColor, FormInput, FormSelect, FormTextarea } from "./form";

/**
 * O GERADOR DE PROPOSTA — a única porta pra criar peça de venda de uma empresa,
 * no painel do José e no do representante.
 *
 * Uma proposta, duas faces, e quem decide é o DADO (nunca quem está gerando):
 *   • o site respondeu  → sai o diagnóstico do que está no ar;
 *   • há protótipo escolhido → sai também `/proposta/<token>/site`, o site que a
 *     empresa passa a ter, com o nome e a cidade dela.
 * Por isso aqui não existe "criar demo" ou "criar proposta": existe **escolher o
 * segmento** — o resto o sistema resolve. Os três modais que faziam isso antes
 * (dois `PropostaModal` e um `DemoModal`) pediam ao operador uma decisão de
 * formato que ele não tem como tomar.
 *
 * ⚠️ SEGMENTO e PROTÓTIPO são coisas diferentes e não se deduzem um do outro. O
 * segmento é o PACOTE que a empresa compra; o protótipo é o RAMO dela. O mapa
 * ramo→pacote é muitos-pra-um, então a lista do segmento nunca teve como dizer
 * qual é o ramo. Esta tela já assumiu que tinha: pré-escolhia `modelos[0]` e
 * rotulava "(do segmento)". No pacote genérico, que começa em "advocacia", isso
 * mandou uma peça de escritório de advocacia pra Clínica Pró Saúde em
 * 17/08/2026. Agora só entra pré-escolhido o que o segmento DECLARA (`padrao`),
 * e a lista oferece os protótipos dos outros segmentos também — porque o ramo
 * da empresa não tem obrigação nenhuma de morar no pacote que ela compra.
 *
 * Componente PURO (molde `MailClient`): dados e callbacks entram por prop, as
 * actions ficam em cada app. Não conhece banco, sessão nem rota.
 */

/** Um segmento como o gerador precisa dele (o app monta a lista do registro). */
export type PropostaSegmentoOpcao = {
  slug: string;
  nome: string;
  /** Protótipos daquele segmento; vazio = a proposta sai só com a leitura. */
  modelos: { id: string; label: string }[];
  /**
   * Protótipo que o segmento assume quando ninguém escolheu — DECLARADO pelo
   * app, nunca deduzido da ordem da lista. Vazio (ou ausente) = o segmento não
   * tem protótipo que sirva pra qualquer empresa dele, e a peça nasce sem face
   * de site até alguém escolher o ramo.
   */
  padrao?: string;
};

/** O que o scan do site devolve pra conferência (tudo serializável). */
export type PropostaDossie = {
  online: boolean;
  url: string;
  httpsOk: boolean;
  servidor: string;
  poweredBy: string;
  plataforma: string;
  cmsVersao: string;
  paginas: number;
  paginasLixo: string[];
  shortcodes: number;
  ingles: number;
  texto: string;
};

/** Os dados que já se sabe da empresa (vêm do lead, quando há lead). */
export type PropostaAlvo = {
  leadId?: string | null;
  empresa?: string | null;
  site?: string | null;
  cidade?: string | null;
  ramo?: string | null;
  whatsapp?: string | null;
  /** Segmento já classificado do lead — chega pré-escolhido. */
  segmento?: string | null;
};

export type PropostaGerarInput = {
  empresa: string;
  site: string;
  cidade: string;
  ramo: string;
  whatsapp: string;
  observacoes: string;
  segmento: string;
  modelo: string;
  accent: string;
  leadId: string;
  /** Representante que assina o link (vazio = o próprio site de quem gera). */
  rep: string;
};

/**
 * Um representante que pode assinar o link. Quem gera escolhe por onde a peça
 * sai: o próprio site ou o domínio de um representante — e aí o link enviado é
 * o do rep, e o orçamento preenchido nela cai no funil dele.
 */
export type PropostaVendedorOpcao = { slug: string; nome: string; dominio: string };

/** Links das duas faces (o de protótipo é null quando não há modelo). */
export type PropostaLinks = { url: string; urlSite: string | null };

type Res<T> = { ok: true; data: T } | { ok: false; error: string };

export type PropostaGeneratorProps = {
  alvo?: PropostaAlvo;
  segmentos: PropostaSegmentoOpcao[];
  /**
   * Representantes que podem assinar o link (só os ativos). Ausente ou vazio =
   * o campo não aparece e a peça sai pelo próprio site (é o caso do painel do
   * rep, onde o dono do link já é ele).
   */
  vendedores?: PropostaVendedorOpcao[];
  /** Entra no site e devolve o que achou (sem gastar IA ainda). */
  onEscanear: (site: string) => Promise<Res<PropostaDossie>>;
  /** Escreve e publica — devolve os links prontos pra mandar. */
  onGerar: (input: PropostaGerarInput) => Promise<Res<PropostaLinks>>;
  /**
   * "Mandar no WhatsApp" na tela dos links prontos. Ausente = o botão não
   * aparece. Quem passa decide o destino (balão do painel ou wa.me) e o texto;
   * aqui só se entrega o link — nada é enviado sem a pessoa apertar enviar.
   */
  onEnviarWhats?: (links: PropostaLinks) => void;
  onClose: () => void;
};

/** O segmento com que a tela abre: o do lead, quando ele já foi classificado. */
function segmentoInicial(segmentos: PropostaSegmentoOpcao[], alvo?: PropostaAlvo): string {
  const s = (alvo?.segmento ?? "").trim().toLowerCase();
  return segmentos.some((x) => x.slug === s) ? s : (segmentos[0]?.slug ?? "");
}

/**
 * O protótipo com que o campo abre, dado o segmento — `"-"` (nenhum) sempre que
 * o segmento não DECLARA um. Nenhum é a resposta honesta: quem gera vê "Não
 * mostrar site de exemplo" e escolhe o ramo se quiser um.
 */
function prototipoPadrao(segmentos: PropostaSegmentoOpcao[], slug: string): string {
  const op = segmentos.find((s) => s.slug === slug);
  const padrao = (op?.padrao ?? "").trim();
  return padrao && op?.modelos.some((m) => m.id === padrao) ? padrao : "-";
}

export function PropostaGenerator({
  alvo,
  segmentos,
  vendedores = [],
  onEscanear,
  onGerar,
  onEnviarWhats,
  onClose,
}: PropostaGeneratorProps) {
  const [empresa, setEmpresa] = useState(alvo?.empresa ?? "");
  const [site, setSite] = useState(alvo?.site ?? "");
  const [cidade, setCidade] = useState(alvo?.cidade ?? "");
  const [ramo, setRamo] = useState(alvo?.ramo ?? "");
  const [whatsapp, setWhatsapp] = useState(alvo?.whatsapp ?? "");
  const [observacoes, setObservacoes] = useState("");
  const [segmento, setSegmento] = useState(() => segmentoInicial(segmentos, alvo));
  // O id do protótipo, ou "-" = proposta sem face de site. Não existe mais o
  // estado "" ("deixa o segmento decidir"): era ele que escondia o chute.
  const [modelo, setModelo] = useState(() =>
    prototipoPadrao(segmentos, segmentoInicial(segmentos, alvo)),
  );
  const [accent, setAccent] = useState("");
  // Quem assina o link: "" = o próprio site; slug = sai no domínio do rep.
  const [vendedor, setVendedor] = useState("");
  const [dossie, setDossie] = useState<PropostaDossie | null>(null);
  const [links, setLinks] = useState<PropostaLinks | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [escaneando, startScan] = useTransition();
  const [gerando, startGerar] = useTransition();

  const atual = useMemo(
    () => segmentos.find((s) => s.slug === segmento),
    [segmentos, segmento],
  );
  const modelos = atual?.modelos ?? [];
  /**
   * Os protótipos dos OUTROS segmentos, oferecidos no mesmo campo. Sem isto,
   * "Clínica de saúde" não existia na tela de quem gerava pelo pacote genérico
   * — a operadora que atendeu a Pró Saúde não tinha como escolher certo nem se
   * quisesse, porque a lista dela era advocacia, contabilidade, terceirização,
   * petshop e restaurante.
   */
  const outros = useMemo(() => {
    const daqui = new Set(modelos.map((m) => m.id));
    const vistos = new Map<string, string>();
    for (const s of segmentos) {
      for (const m of s.modelos) {
        if (!daqui.has(m.id) && !vistos.has(m.id)) vistos.set(m.id, m.label);
      }
    }
    return [...vistos].map(([id, label]) => ({ id, label }));
  }, [segmentos, modelos]);
  // Protótipo que vai sair de fato: o escolhido, e nada além dele.
  const modeloEfetivo = modelo === "-" ? "" : modelo;

  const escanear = () =>
    startScan(async () => {
      setErr(null);
      setDossie(null);
      const r = await onEscanear(site.trim());
      if (r.ok) setDossie(r.data);
      else setErr(r.error);
    });

  const gerar = () =>
    startGerar(async () => {
      setErr(null);
      const r = await onGerar({
        empresa: empresa.trim(),
        site: site.trim(),
        cidade: cidade.trim(),
        ramo: ramo.trim(),
        whatsapp: whatsapp.trim(),
        observacoes: observacoes.trim(),
        segmento,
        modelo: modeloEfetivo,
        accent: /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "",
        leadId: alvo?.leadId ?? "",
        rep: vendedor,
      });
      if (r.ok) setLinks(r.data);
      else setErr(r.error);
    });

  return (
    <Modal open onClose={onClose} size="lg" title={`Proposta — ${empresa || "nova empresa"}`}>
      {links ? (
        <PropostaPronta
          links={links}
          temLead={!!alvo?.leadId}
          onEnviarWhats={onEnviarWhats ? () => onEnviarWhats(links) : undefined}
          onClose={onClose}
        />
      ) : (
        <Stack gap={4}>
          <Text fontSize="sm" color="var(--admin-text-soft)">
            Uma peça por empresa. Escolha o <strong>segmento</strong> que ela compra e o{" "}
            <strong>site de exemplo do ramo dela</strong> — o sistema monta esse site com o nome
            dela e, se ela já tiver site no ar, lê o que está lá e escreve o diagnóstico.{" "}
            <strong>Sem valores</strong>: orçamento é conversa de reunião.
          </Text>

          <FormInput
            label="Nome da empresa"
            required
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            placeholder="Impex Comércio e Representações"
          />

          <HStack gap={3} align="flex-end" flexWrap="wrap">
            <Box flex="1" minW="220px">
              <FormInput
                label="Site que ela já tem (opcional)"
                help="Sem site, a proposta sai só com o que ela passa a ter — sem inventar problema."
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="empresa.com.br"
              />
            </Box>
            <Button
              tone="outline"
              loading={escaneando}
              disabled={site.trim().length < 4}
              onClick={escanear}
            >
              <Search size={15} style={{ marginRight: 6 }} /> Analisar site
            </Button>
          </HStack>

          {dossie ? <DossieCard d={dossie} /> : null}

          {vendedores.length ? (
            <FormSelect
              label="Link sai por"
              help="Escolhendo um representante, o link é do domínio DELE e o orçamento preenchido na peça cai no funil dele."
              value={vendedor}
              onChange={(e) => setVendedor(e.target.value)}
              options={[
                { value: "", label: "Próprio site (padrão)" },
                ...vendedores.map((v) => ({ value: v.slug, label: `${v.nome} — ${v.dominio}` })),
              ]}
            />
          ) : null}

          <HStack gap={3} align="flex-start" flexWrap="wrap">
            <Box flex="1" minW="200px">
              <FormSelect
                label="Segmento"
                help="O produto pronto que este ramo compra."
                value={segmento}
                onChange={(e) => {
                  setSegmento(e.target.value);
                  setModelo(prototipoPadrao(segmentos, e.target.value));
                }}
                options={segmentos.map((s) => ({ value: s.slug, label: s.nome }))}
              />
            </Box>
            <Box flex="1" minW="200px">
              <FormSelect
                label="Site de exemplo"
                help="Escolha pelo RAMO da empresa, não pelo segmento. Sem escolher, a proposta sai só com a leitura."
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                options={[
                  { value: "-", label: "Não mostrar site de exemplo" },
                  ...modelos.map((m) => ({ value: m.id, label: m.label })),
                  ...outros.map((m) => ({ value: m.id, label: `${m.label} (outro segmento)` })),
                ]}
              />
            </Box>
          </HStack>

          <HStack gap={3} align="flex-start" flexWrap="wrap">
            <Box flex="1" minW="180px">
              <FormInput
                label="Cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Novo Hamburgo - RS"
              />
            </Box>
            <Box flex="1" minW="180px">
              <FormInput
                label="Ramo (o que ela faz)"
                value={ramo}
                onChange={(e) => setRamo(e.target.value)}
                placeholder="máquinas industriais de costura"
              />
            </Box>
          </HStack>

          <HStack gap={3} align="flex-start" flexWrap="wrap">
            <Box flex="1" minW="180px">
              <FormInput
                label="WhatsApp do contato (opcional)"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(51) 9…"
              />
            </Box>
            {/* cor só faz sentido quando existe protótipo pra pintar */}
            {modeloEfetivo ? (
              <Box flex="1" minW="180px">
                <FormColor
                  label="Cor do site de exemplo"
                  help="Vazio = a cor do segmento. Use a da marca dela quando souber."
                  value={accent}
                  onChange={setAccent}
                  placeholder="#2563eb"
                />
              </Box>
            ) : (
              <Box flex="1" minW="180px" />
            )}
          </HStack>

          <FormTextarea
            label="O que você já sabe e o site não conta (opcional)"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            placeholder="Indicação do fulano, reclamou que o site não gera contato, tem equipe de 3 vendedores…"
          />

          <HStack gap={3} flexWrap="wrap">
            <Button
              tone="primary"
              loading={gerando}
              disabled={empresa.trim().length < 2}
              onClick={gerar}
            >
              <FileText size={15} style={{ marginRight: 6 }} /> Gerar proposta
            </Button>
            {gerando ? (
              <Text fontSize="sm" color="var(--admin-text-soft)">
                lendo o site e escrevendo… leva alguns segundos
              </Text>
            ) : null}
            {err ? (
              <Text fontSize="sm" fontWeight="600" color="#b91c1c">
                {err}
              </Text>
            ) : null}
          </HStack>
        </Stack>
      )}
    </Modal>
  );
}

/** Os links prontos — um por face, cada um com o seu porquê. */
function PropostaPronta({
  links,
  temLead,
  onEnviarWhats,
  onClose,
}: {
  links: PropostaLinks;
  temLead: boolean;
  onEnviarWhats?: () => void;
  onClose: () => void;
}) {
  return (
    <Stack gap={4}>
      <HStack gap={2} flexWrap="wrap">
        <Tag bg="rgba(34,197,94,0.14)" color="#15803d">Proposta no ar</Tag>
        {temLead ? (
          <Text fontSize="sm" color="var(--admin-text-soft)">Link anotado na ficha do lead.</Text>
        ) : null}
      </HStack>

      <LinkPronto
        titulo="A proposta"
        descricao="É este o link pra mandar. A leitura, o que entregamos e o convite pro site de exemplo."
        url={links.url}
      />
      {links.urlSite ? (
        <LinkPronto
          titulo="Só o site de exemplo"
          descricao="A mesma proposta, entrando direto pelo site. Bom pra WhatsApp, quando a conversa já está quente."
          url={links.urlSite}
        />
      ) : null}

      <Text fontSize="xs" color="var(--admin-text-soft)">
        Dica: mande junto — “Dei uma olhada no site de vocês e montei um resumo do que dá pra
        melhorar: {"{link}"}”.
      </Text>
      <HStack gap={2} flexWrap="wrap">
        <Button tone="ghost" onClick={onClose}>Fechar</Button>
        {onEnviarWhats ? (
          <Button tone="whatsapp" onClick={onEnviarWhats}>
            <MessageCircle size={14} style={{ marginRight: 6 }} /> Mandar no WhatsApp
          </Button>
        ) : null}
      </HStack>
    </Stack>
  );
}

function LinkPronto({ titulo, descricao, url }: { titulo: string; descricao: string; url: string }) {
  return (
    <Box p={3} borderRadius="10px" border="1px solid var(--admin-border)" bg="rgba(15,23,42,0.03)">
      <Stack gap={2}>
        <HStack gap={2} justifyContent="space-between" flexWrap="wrap">
          <Text fontSize="sm" fontWeight="700" color="var(--admin-text)">{titulo}</Text>
          <Button tone="ghost" size="sm" onClick={() => window.open(url, "_blank")}>
            <ExternalLink size={14} style={{ marginRight: 6 }} /> Abrir
          </Button>
        </HStack>
        <Text fontSize="xs" color="var(--admin-text-soft)">{descricao}</Text>
        <TextoCopiavel texto={url} rotulo="Link copiado" fontSize="sm" color="var(--admin-primary)" />
      </Stack>
    </Box>
  );
}

/** O que o scanner achou — quem gera confere ANTES de a IA escrever. */
function DossieCard({ d }: { d: PropostaDossie }) {
  if (!d.online) {
    return (
      <Box p={3} borderRadius="10px" border="1px solid var(--admin-border)" bg="rgba(239,68,68,0.06)">
        <Text fontSize="sm" fontWeight="700" color="#b91c1c">O site não respondeu.</Text>
        <Text fontSize="xs" color="var(--admin-text-soft)">
          Pode estar fora do ar ou bloqueando robô. Dá pra gerar mesmo assim — a proposta sai só com
          o que a empresa passa a ter, sem afirmar nada sobre o site.
        </Text>
      </Box>
    );
  }
  const selos: Array<{ texto: string; ruim: boolean }> = [
    { texto: d.httpsOk ? "HTTPS ok" : "sem HTTPS", ruim: !d.httpsOk },
    ...(d.poweredBy ? [{ texto: d.poweredBy, ruim: /php\/[1-7]\./i.test(d.poweredBy) }] : []),
    ...(d.servidor ? [{ texto: d.servidor, ruim: /IIS\/[1-8]\.|Apache\/2\.[0-2]/i.test(d.servidor) }] : []),
    ...(d.plataforma ? [{ texto: `${d.plataforma}${d.cmsVersao ? ` ${d.cmsVersao}` : ""}`, ruim: false }] : []),
    ...(d.paginas ? [{ texto: `${d.paginas} páginas`, ruim: false }] : []),
    ...(d.paginasLixo.length ? [{ texto: `${d.paginasLixo.length} páginas de demo do tema`, ruim: true }] : []),
    ...(d.shortcodes ? [{ texto: `${d.shortcodes} código(s) vazando no texto`, ruim: true }] : []),
    ...(d.ingles ? [{ texto: `${d.ingles} trecho(s) em inglês`, ruim: true }] : []),
  ];
  return (
    <Box p={3} borderRadius="10px" border="1px solid var(--admin-border)" bg="rgba(15,23,42,0.03)">
      <Stack gap={2}>
        <HStack gap={2}>
          {d.httpsOk ? <ShieldCheck size={15} color="#15803d" /> : <ShieldAlert size={15} color="#b91c1c" />}
          <Text fontSize="sm" fontWeight="700" color="var(--admin-text)" wordBreak="break-all">
            {d.url}
          </Text>
        </HStack>
        <HStack gap={2} flexWrap="wrap">
          {selos.map((s) => (
            <Tag
              key={s.texto}
              bg={s.ruim ? "rgba(239,68,68,0.12)" : "rgba(15,23,42,0.06)"}
              color={s.ruim ? "#b91c1c" : "var(--admin-text-soft)"}
            >
              {s.texto}
            </Tag>
          ))}
        </HStack>
        <Box
          as="pre"
          maxH="180px"
          overflowY="auto"
          fontSize="xs"
          fontFamily="mono"
          whiteSpace="pre-wrap"
          color="var(--admin-text-soft)"
          m={0}
        >
          {d.texto}
        </Box>
      </Stack>
    </Box>
  );
}

/** Rótulo do segmento pra quem só quer mostrar (listas, fichas). */
export function SegmentoTag({ nome }: { nome: string }) {
  return (
    <Tag bg="rgba(15,23,42,0.06)" color="var(--admin-text-soft)">
      <Layers size={11} style={{ marginRight: 4 }} /> {nome}
    </Tag>
  );
}
