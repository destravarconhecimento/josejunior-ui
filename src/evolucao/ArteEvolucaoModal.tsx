"use client";
/**
 * "Baixar arte" da evolução: prévia ao vivo + os poucos campos que mudam
 * (formato, chamada, rodapé e o FUNDO). O desenho é o mesmo `arteEvolucaoTree`
 * que o servidor rasteriza — a prévia aqui é o PNG que vai sair, reduzido.
 *
 * O componente não conhece rota nem action: quem chama monta o link do PNG
 * (`buildDownloadHref`) e persiste a configuração (`onSaveConfig`).
 */
import { useRef, useState } from "react";
import { Download, ImagePlus, Loader2 } from "lucide-react";
import { Box, HStack, Stack, Text } from "../primitives";
import { Button } from "../components/Button";
import { Modal } from "../components/Modal";
import { FormInput } from "../components/form";
import { toaster } from "../components/Toast";
import { arteDimensoes, arteEvolucaoTree, ARTE_ASSINATURA, ARTE_FORMATO_PADRAO, type ArteFormato } from "./arte";
import type { EvolucaoFoto } from "./types";

export type ArteEvolucaoConfig = {
  /** Chamada do topo (ex.: "Transformação real"). */
  chamada: string;
  /** Linha do rodapé (site, @perfil, telefone). */
  rodape: string;
  /** Fundo próprio; null = fundo sólido da marca. */
  fundoUrl: string | null;
  /** Feed 4:5 (padrão, o que rende no Instagram) ou story 9:16. */
  formato: ArteFormato;
};

export type ArteEvolucaoAlvo = {
  id: number;
  title: string;
  subtitle: string | null;
  photos: EvolucaoFoto[];
};

export type ArteEvolucaoModalProps = {
  open: boolean;
  onClose: () => void;
  alvo: ArteEvolucaoAlvo | null;
  brand?: { logoUrl?: string | null; cor?: string | null; fundoCor?: string | null };
  config: ArteEvolucaoConfig;
  /** Sobe o fundo pro Blob e devolve a URL pública. */
  onUpload: (file: File) => Promise<string>;
  /** Guarda a configuração para a próxima arte (opcional). */
  onSaveConfig?: (cfg: ArteEvolucaoConfig) => Promise<void> | void;
  /** Link do PNG (o servidor rasteriza com a mesma configuração). */
  buildDownloadHref: (id: number, cfg: ArteEvolucaoConfig) => string;
  /** Fundos já disponíveis (ex.: os do editor de flyer) para escolher num clique. */
  fundosSugeridos?: { url: string; label: string }[];
};

const PREVIEW_W = 320;

const FORMATOS: { id: ArteFormato; label: string }[] = [
  { id: "feed", label: "Feed 4:5" },
  { id: "story", label: "Story 9:16" },
];

export function ArteEvolucaoModal({
  open,
  onClose,
  alvo,
  brand,
  config,
  onUpload,
  onSaveConfig,
  buildDownloadHref,
  fundosSugeridos = [],
}: ArteEvolucaoModalProps) {
  const [cfg, setCfg] = useState<ArteEvolucaoConfig>(config);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reabrir com outro item mantém a configuração da sessão anterior — só
  // ressincroniza quando o modal está fechado (evita pisar no que ele digitou).
  if (
    !open &&
    (cfg.chamada !== config.chamada ||
      cfg.rodape !== config.rodape ||
      cfg.fundoUrl !== config.fundoUrl ||
      cfg.formato !== config.formato)
  ) {
    setCfg(config);
  }

  const escolherFundo = async (file: File) => {
    setEnviando(true);
    try {
      const url = await onUpload(file);
      setCfg((c) => ({ ...c, fundoUrl: url }));
    } catch (err) {
      toaster.create({ title: "Falha no envio do fundo", description: String(err), type: "error" });
    } finally {
      setEnviando(false);
    }
  };

  const baixar = () => {
    if (!alvo) return;
    void onSaveConfig?.(cfg);
    // `content-disposition: attachment` no servidor → o navegador baixa sem sair da tela.
    window.location.href = buildDownloadHref(alvo.id, cfg);
  };

  const formato = cfg.formato ?? ARTE_FORMATO_PADRAO;
  const dim = arteDimensoes(formato);
  const escala = PREVIEW_W / dim.w;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Baixar arte para o Instagram"
      size="xl"
      footer={
        <>
          <Button tone="ghost" onClick={onClose}>
            Fechar
          </Button>
          <Button tone="primary" onClick={baixar} disabled={!alvo || alvo.photos.length === 0}>
            <Download size={16} /> Baixar PNG
          </Button>
        </>
      }
    >
      <Stack direction={{ base: "column", md: "row" }} gap={6} align="flex-start">
        {/* Prévia: o desenho real, reduzido. */}
        <Box
          flexShrink={0}
          mx="auto"
          width={`${PREVIEW_W}px`}
          height={`${Math.round(dim.h * escala)}px`}
          borderRadius="12px"
          overflow="hidden"
          borderWidth="1px"
          borderColor="var(--admin-border)"
          bg="#0b1220"
        >
          <Box
            style={{
              width: dim.w,
              height: dim.h,
              transform: `scale(${escala})`,
              transformOrigin: "top left",
            }}
          >
            {alvo
              ? arteEvolucaoTree({
                  chamada: cfg.chamada,
                  titulo: alvo.title,
                  subtitulo: alvo.subtitle,
                  fotos: alvo.photos,
                  fundoUrl: cfg.fundoUrl,
                  logoUrl: brand?.logoUrl ?? null,
                  rodape: cfg.rodape,
                  cor: brand?.cor ?? null,
                  fundoCor: brand?.fundoCor ?? null,
                  formato,
                })
              : null}
          </Box>
        </Box>

        <Stack gap={4} flex="1" minW="0" w="100%">
          <Stack gap={2}>
            <Text fontSize="sm" fontWeight="600">
              Formato
            </Text>
            <HStack gap={2} flexWrap="wrap">
              {FORMATOS.map((f) => (
                <Button
                  key={f.id}
                  tone={formato === f.id ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setCfg((c) => ({ ...c, formato: f.id }))}
                >
                  {f.label}
                </Button>
              ))}
            </HStack>
          </Stack>

          <FormInput
            label="Chamada (topo)"
            value={cfg.chamada}
            onChange={(e) => setCfg((c) => ({ ...c, chamada: e.target.value }))}
            placeholder="Transformação real"
          />
          <FormInput
            label="Rodapé (frase, site ou @perfil)"
            value={cfg.rodape}
            onChange={(e) => setCfg((c) => ({ ...c, rodape: e.target.value }))}
            placeholder={ARTE_ASSINATURA}
          />

          <Stack gap={2}>
            <Text fontSize="sm" fontWeight="600">
              Fundo
            </Text>
            <HStack gap={2} flexWrap="wrap">
              <Button
                tone={cfg.fundoUrl ? "outline" : "primary"}
                size="sm"
                onClick={() => setCfg((c) => ({ ...c, fundoUrl: null }))}
              >
                Padrão da marca
              </Button>
              <Button
                tone="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={enviando}
              >
                {enviando ? <Loader2 size={14} /> : <ImagePlus size={14} />} Enviar imagem
              </Button>
            </HStack>
            {fundosSugeridos.length ? (
              <HStack gap={2} flexWrap="wrap">
                {fundosSugeridos.map((f) => (
                  <Box
                    key={f.url}
                    as="button"
                    onClick={() => setCfg((c) => ({ ...c, fundoUrl: f.url }))}
                    title={f.label}
                    w="54px"
                    h={`${Math.round((54 * dim.h) / dim.w)}px`}
                    borderRadius="8px"
                    overflow="hidden"
                    borderWidth="2px"
                    borderColor={cfg.fundoUrl === f.url ? "var(--admin-primary)" : "var(--admin-border)"}
                    backgroundImage={`url(${f.url})`}
                    backgroundSize="cover"
                    backgroundPosition="center"
                  />
                ))}
              </HStack>
            ) : null}
            <Text fontSize="xs" color="var(--admin-text-soft)">
              Sem imagem, a arte usa o fundo sólido da sua marca. A logo e as cores vêm do site.
            </Text>
          </Stack>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void escolherFundo(f);
              e.target.value = "";
            }}
          />
        </Stack>
      </Stack>
    </Modal>
  );
}
