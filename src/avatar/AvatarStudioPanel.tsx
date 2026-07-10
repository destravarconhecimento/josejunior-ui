"use client";
/**
 * Estúdio de geração do avatar (drawer). Sobe a foto da pessoa (com ou sem fundo),
 * opcionalmente remove o fundo por ferramenta local grátis (callback), posiciona no
 * círculo (arraste/zoom), escolhe moldura/fundo/logo, escreve o nome na fonte
 * escolhida (+ legenda fixa da agência) e GERA o PNG 1024/512. Depois: baixar e
 * copiar URL. Tudo no navegador (canvas) — sem IA na composição, sem custo.
 */
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  FlipHorizontal2,
  ImageOff,
  RotateCcw,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { Box, Flex, HStack, Stack, Text } from "../primitives";
import { Button } from "../components/Button";
import { Accordion } from "../components/Accordion";
import { FormInput, FormSelect } from "../components/form";
import { ColorPicker } from "../components/ColorPicker";
import { SidePanel } from "../components/SidePanel";
import { toaster } from "../components/Toast";
import { AvatarCanvas } from "./AvatarCanvas";
import { composeAvatar } from "./compose";
import { AVATAR_COLORS, AVATAR_FONTS, AVATAR_SIZES } from "./constants";
import type {
  AvatarBackground,
  AvatarBrand,
  AvatarConfig,
  AvatarFrameChoice,
  AvatarFramePreset,
  AvatarLogoCorner,
  AvatarSaveData,
  AvatarSettings,
  AvatarUploadKind,
} from "./types";

export type AvatarStudioPanelProps = {
  open: boolean;
  onClose: () => void;
  initialConfig: AvatarConfig;
  initialName?: string;
  initialSubtitle?: string;
  initialSize?: number;
  avatarId?: number;
  settings: AvatarSettings;
  brand: AvatarBrand;
  presets: readonly AvatarFramePreset[];
  onUpload: (file: File | Blob, kind: AvatarUploadKind, filename: string) => Promise<string>;
  /** Remove o fundo da foto (ferramenta local). Ausente = só caminho manual. */
  onRemoveBackground?: (blob: Blob) => Promise<Blob>;
  onSave: (data: AvatarSaveData) => Promise<{ ok: true; id?: number } | { ok: false; error: string }>;
  onSaved?: () => void;
};


/** Grupo de botões tipo "segmented" (uma opção ativa). */
function SegButtons<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <HStack gap={1} flexWrap="wrap">
      {options.map((o) => (
        <Button
          key={o.value}
          type="button"
          size="xs"
          tone={value === o.value ? "primary" : "outline"}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </HStack>
  );
}

/** input[type=range] estilizado (dentro do ui — Chakra Slider não é necessário). */
function Range({
  value,
  min,
  max,
  step,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: "var(--admin-primary)", cursor: "pointer" }}
    />
  );
}

const frameChoiceValue = (f: AvatarFrameChoice): string =>
  f.kind === "preset" ? `preset:${f.presetId}` : f.kind === "image" ? `image:${f.url}` : "none";

export function AvatarStudioPanel(props: AvatarStudioPanelProps) {
  const { settings, brand, presets, onUpload, onRemoveBackground, onSave } = props;

  const [config, setConfig] = useState<AvatarConfig>(props.initialConfig);
  const [name, setName] = useState(props.initialName ?? "");
  const [subtitle, setSubtitle] = useState(props.initialSubtitle ?? settings.fixedSubtitle ?? "");
  const [size, setSize] = useState<number>(props.initialSize ?? AVATAR_SIZES[0]);
  const [avatarId, setAvatarId] = useState<number | undefined>(props.avatarId);

  const [rawPhotoUrl, setRawPhotoUrl] = useState<string | null>(props.initialConfig.photoUrl);
  const photoFileRef = useRef<File | Blob | null>(null);

  const [uploading, setUploading] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  // Auto-remover o fundo da foto quando há um fundo montado (a foto entra "limpa"
  // sobre o fundo da agência). Liga sozinho quando o padrão já tem fundo.
  const [autoRemoveBg, setAutoRemoveBg] = useState(
    props.initialConfig.background.kind !== "none",
  );
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ url: string; blobUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingUpload = useRef<AvatarUploadKind>("photo");

  // Reinicia o estado quando reabre com outro avatar/config.
  useEffect(() => {
    if (!props.open) return;
    setConfig(props.initialConfig);
    setName(props.initialName ?? "");
    setSubtitle(props.initialSubtitle ?? settings.fixedSubtitle ?? "");
    setSize(props.initialSize ?? AVATAR_SIZES[0]);
    setAvatarId(props.avatarId);
    setRawPhotoUrl(props.initialConfig.photoUrl);
    setAutoRemoveBg(props.initialConfig.background.kind !== "none");
    photoFileRef.current = null;
    setResult(null);
    setCopied(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, props.avatarId]);

  const patch = (p: Partial<AvatarConfig>) => {
    setConfig((c) => ({ ...c, ...p }));
    setResult(null); // qualquer mudança invalida o resultado gerado
  };

  const pickFile = (kind: AvatarUploadKind) => {
    pendingUpload.current = kind;
    fileInputRef.current?.click();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite reenviar o mesmo arquivo
    if (!file) return;
    const kind = pendingUpload.current;
    setUploading(true);
    try {
      const url = await onUpload(file, kind, file.name);
      if (kind === "photo") {
        photoFileRef.current = file;
        setRawPhotoUrl(url);
        patch({ photoUrl: url, photo: { offsetX: 0, offsetY: 0, zoom: 1 } });
        // Fundo montado + auto ligado → já tira o fundo da foto (fica profissional).
        if (autoRemoveBg && onRemoveBackground) void removeBg();
      } else if (kind === "frame") {
        patch({ frame: { kind: "image", url } });
      } else if (kind === "logo") {
        patch({ logoUrl: url, logoCorner: config.logoCorner === "none" ? "top" : config.logoCorner });
      } else if (kind === "background") {
        patch({ background: { kind: "image", url } });
      }
    } catch (err) {
      toaster.create({ title: "Falha no upload", description: String(err), type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const removeBg = async () => {
    if (!onRemoveBackground) return;
    setRemovingBg(true);
    try {
      // Fonte = arquivo local (se houver) ou a foto atual baixada do Blob.
      let src: Blob | null = photoFileRef.current;
      if (!src && rawPhotoUrl) src = await (await fetch(rawPhotoUrl)).blob();
      if (!src) {
        toaster.create({ title: "Envie uma foto primeiro", type: "warning" });
        return;
      }
      const cut = await onRemoveBackground(src);
      const url = await onUpload(cut, "photo", "sem-fundo.png");
      patch({ photoUrl: url });
    } catch (err) {
      toaster.create({
        title: "Não foi possível remover o fundo",
        description: String(err),
        type: "error",
      });
    } finally {
      setRemovingBg(false);
    }
  };

  const restoreBg = () => {
    if (rawPhotoUrl) patch({ photoUrl: rawPhotoUrl });
  };

  const generate = async () => {
    const hideTitle = Boolean(config.hideTitle);
    if (!hideTitle && !name.trim()) {
      toaster.create({ title: "Dê um nome para o avatar", type: "warning" });
      return;
    }
    if (!config.photoUrl) {
      toaster.create({ title: "Envie a foto da pessoa", type: "warning" });
      return;
    }
    // "Sem nome": não escreve o nome no avatar, mas o card ainda precisa de um rótulo.
    const recordName = name.trim() || "Avatar sem nome";
    setGenerating(true);
    try {
      const { blob, objectUrl } = await composeAvatar({
        size,
        config,
        presets,
        title: hideTitle ? "" : name.trim(),
        subtitle: subtitle.trim(),
      });
      const url = await onUpload(blob, "result", `${slug(recordName)}-${size}.png`);
      const saved = await onSave({
        id: avatarId,
        name: recordName,
        subtitle: subtitle.trim() || null,
        size,
        resultUrl: url,
        thumbnailUrl: url,
        config,
      });
      if (!saved.ok) throw new Error(saved.error);
      if (saved.id) setAvatarId(saved.id);
      setResult({ url, blobUrl: objectUrl });
      toaster.create({ title: "Avatar gerado!", type: "success" });
      props.onSaved?.();
    } catch (err) {
      toaster.create({ title: "Falha ao gerar", description: String(err), type: "error" });
    } finally {
      setGenerating(false);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.blobUrl;
    a.download = `${slug(name)}-${size}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copyUrl = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toaster.create({ title: "Copie manualmente", description: result.url, type: "info" });
    }
  };

  const busy = uploading || removingBg || generating;
  const hasLogo = Boolean(config.logoUrl || settings.logoUrl || brand.logoUrl);

  const frameOptions = [
    { value: "none", label: "Nenhuma" },
    ...presets.map((p) => ({ value: `preset:${p.id}`, label: p.label })),
    ...settings.frames.map((f) => ({ value: `image:${f.url}`, label: `${f.label} (agência)` })),
  ];

  const bgMode: "color" | "gradient" | "image" | "none" = config.background.kind;

  return (
    <SidePanel
      open={props.open}
      onClose={props.onClose}
      title={avatarId ? "Editar avatar" : "Gerar avatar"}
      size="full"
      footer={
        <Stack gap={3} w="100%">
          {result ? (
            <HStack gap={2} flexWrap="wrap">
              <Button tone="outline" onClick={download}>
                <Download size={16} /> Baixar PNG
              </Button>
              <Button tone="outline" onClick={copyUrl}>
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copiado!" : "Copiar URL"}
              </Button>
              <Box flex="1" />
              <Button tone="ghost" onClick={props.onClose}>
                Concluir
              </Button>
            </HStack>
          ) : null}
          <Button
            tone="primary"
            onClick={generate}
            loading={generating}
            disabled={busy || (!config.hideTitle && !name.trim()) || !config.photoUrl}
            w="100%"
          >
            <Sparkles size={18} /> {avatarId && !result ? "Regerar avatar" : "Gerar avatar"}
          </Button>
        </Stack>
      }
    >
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onFile} />

      <Flex gap={6} direction={{ base: "column", lg: "row" }} align="flex-start">
        {/* Preview ao vivo — ocupa todo o espaço disponível */}
        <Box
          order={{ base: -1, lg: 0 }}
          flex="1"
          minW={0}
          w="100%"
          position={{ lg: "sticky" }}
          top={{ lg: "0" }}
          alignSelf={{ lg: "flex-start" }}
        >
          <Stack gap={3} align="center">
            <AvatarCanvas
              config={config}
              title={config.hideTitle ? "" : name || "Nome"}
              subtitle={subtitle}
              presets={presets}
              interactive
              onPhotoChange={(photo) => patch({ photo })}
              onTitleMove={(o) => patch({ titleOffsetX: o.x, titleOffsetY: o.y })}
              onLogoMove={(pos) => patch({ logoPos: pos })}
              maxSize={520}
            />
            <Text fontSize="xs" color="var(--admin-text-soft)" textAlign="center">
              Dica: arraste a <b>foto</b>, o <b>nome</b> e a <b>logo</b> direto na prévia.
              Zoom e ajustes ficam nas seções ao lado.
            </Text>
            {!config.photoUrl ? (
              <Text fontSize="xs" color="var(--admin-text-soft)" textAlign="center">
                Envie a foto da pessoa (seção “Foto da pessoa”) para começar.
              </Text>
            ) : null}
          </Stack>
        </Box>

        {/* Controles — organizados por categoria (acordeão) */}
        <Box w={{ base: "100%", lg: "400px" }} flexShrink={0}>
          <Accordion
            multiple
            defaultValue={["foto", "nome"]}
            items={[
              {
                value: "foto",
                title: "Foto da pessoa",
                content: (
                  <Stack gap={3}>
                    <HStack gap={2} flexWrap="wrap">
                      <Button tone="outline" size="sm" onClick={() => pickFile("photo")} loading={uploading}>
                        <Upload size={15} /> {config.photoUrl ? "Trocar foto" : "Enviar foto"}
                      </Button>
                      {config.photoUrl && onRemoveBackground ? (
                        <Button tone="outline" size="sm" onClick={removeBg} loading={removingBg}>
                          <Wand2 size={15} /> Tirar fundo
                        </Button>
                      ) : null}
                      {config.photoUrl && rawPhotoUrl && config.photoUrl !== rawPhotoUrl ? (
                        <Button tone="ghost" size="sm" onClick={restoreBg}>
                          <ImageOff size={15} /> Restaurar fundo
                        </Button>
                      ) : null}
                    </HStack>
                    {config.photoUrl ? (
                      <>
                        <HStack gap={2} flexWrap="wrap">
                          <Button
                            tone={config.photo.flipH ? "primary" : "outline"}
                            size="sm"
                            onClick={() => patch({ photo: { ...config.photo, flipH: !config.photo.flipH } })}
                          >
                            <FlipHorizontal2 size={15} /> Espelhar
                          </Button>
                          <Button
                            tone="ghost"
                            size="sm"
                            onClick={() => patch({ photo: { offsetX: 0, offsetY: 0, zoom: 1, flipH: config.photo.flipH } })}
                          >
                            <RotateCcw size={14} /> Centralizar
                          </Button>
                        </HStack>
                        <Stack gap={1}>
                          <Text fontSize="xs" color="var(--admin-text-soft)">
                            Zoom / enquadramento — arraste a foto na prévia para posicionar
                          </Text>
                          <Range
                            value={config.photo.zoom}
                            min={0.5}
                            max={4}
                            step={0.02}
                            onChange={(zoom) => patch({ photo: { ...config.photo, zoom } })}
                          />
                        </Stack>
                      </>
                    ) : null}
                    {onRemoveBackground ? (
                      <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                        <input
                          type="checkbox"
                          checked={autoRemoveBg}
                          onChange={(e) => setAutoRemoveBg(e.target.checked)}
                          style={{ width: 16, height: 16, accentColor: "var(--admin-primary)" }}
                        />
                        Tirar o fundo automaticamente ao enviar
                      </label>
                    ) : null}
                    <Text fontSize="xs" color="var(--admin-text-soft)">
                      Com um fundo montado, a foto fica mais profissional sem o fundo original.
                      Pode subir já sem fundo ou usar “Tirar fundo” (grátis, no navegador).
                    </Text>
                  </Stack>
                ),
              },
              {
                value: "nome",
                title: "Nome",
                content: (
                  <Stack gap={3}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(config.hideTitle)}
                        onChange={(e) => patch({ hideTitle: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: "var(--admin-primary)" }}
                      />
                      Sem nome (não escrever o nome no avatar)
                    </label>
                    <FormInput
                      label="Nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex.: João Silva"
                      disabled={Boolean(config.hideTitle)}
                      help={config.hideTitle ? "Desmarque “Sem nome” para escrever o nome." : undefined}
                    />
                    {!config.hideTitle ? (
                      <>
                        <FormSelect
                          label="Fonte do nome"
                          value={config.font}
                          onChange={(e) => patch({ font: e.target.value })}
                          options={AVATAR_FONTS.map((f) => ({ value: f.family, label: f.label }))}
                        />
                        <Stack gap={1}>
                          <Text fontSize="xs" color="var(--admin-text-soft)">Cor do nome</Text>
                          <ColorPicker
                            value={config.titleColor}
                            onChange={(c) => patch({ titleColor: c })}
                            colors={AVATAR_COLORS}
                            columns={9}
                            allowCustom
                          />
                        </Stack>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                          <input
                            type="checkbox"
                            checked={config.uppercase}
                            onChange={(e) => patch({ uppercase: e.target.checked })}
                            style={{ width: 16, height: 16, accentColor: "var(--admin-primary)" }}
                          />
                          Texto em CAIXA ALTA
                        </label>
                        <Stack gap={1}>
                          <HStack justify="space-between">
                            <Text fontSize="xs" color="var(--admin-text-soft)">Altura do nome (ou arraste na prévia)</Text>
                            <Button size="xs" tone="ghost" onClick={() => patch({ titleOffsetX: 0, titleOffsetY: 0 })}>
                              <RotateCcw size={12} /> Padrão
                            </Button>
                          </HStack>
                          <Range
                            value={config.titleOffsetY ?? 0}
                            min={-0.15}
                            max={0.15}
                            step={0.005}
                            onChange={(v) => patch({ titleOffsetY: v })}
                          />
                        </Stack>
                        <Stack gap={1}>
                          <HStack justify="space-between">
                            <Text fontSize="xs" color="var(--admin-text-soft)">Tamanho do nome</Text>
                            <Button size="xs" tone="ghost" onClick={() => patch({ titleScale: 1 })}>
                              <RotateCcw size={12} /> Padrão
                            </Button>
                          </HStack>
                          <Range
                            value={config.titleScale ?? 1}
                            min={0.6}
                            max={1.6}
                            step={0.02}
                            onChange={(v) => patch({ titleScale: v })}
                          />
                        </Stack>
                      </>
                    ) : null}
                  </Stack>
                ),
              },
              {
                value: "legenda",
                title: "Legenda",
                content: (
                  <Stack gap={3}>
                    <FormInput
                      label="Legenda fixa (linha de baixo)"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder={settings.fixedSubtitle || "Ex.: CARA PINTADA"}
                      help="Padrão da agência — igual em todos os avatares. Vazio = sem legenda."
                    />
                    <Stack gap={1}>
                      <Text fontSize="xs" color="var(--admin-text-soft)">Cor da legenda</Text>
                      <ColorPicker
                        value={config.subtitleColor}
                        onChange={(c) => patch({ subtitleColor: c })}
                        colors={AVATAR_COLORS}
                        columns={9}
                        allowCustom
                      />
                    </Stack>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(config.subtitleCurved)}
                        onChange={(e) => patch({ subtitleCurved: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: "var(--admin-primary)" }}
                      />
                      Legenda curvada (acompanha a moldura)
                    </label>
                  </Stack>
                ),
              },
              {
                value: "logo",
                title: "Logo",
                content: (
                  <Stack gap={3}>
                    {hasLogo ? (
                      <>
                        <SegButtons<AvatarLogoCorner>
                          value={config.logoCorner}
                          onChange={(v) => patch({ logoCorner: v, logoPos: null })}
                          options={[
                            { value: "top", label: "Topo" },
                            { value: "top-left", label: "Sup. esq." },
                            { value: "top-right", label: "Sup. dir." },
                            { value: "bottom", label: "Rodapé" },
                            { value: "bottom-left", label: "Inf. esq." },
                            { value: "bottom-right", label: "Inf. dir." },
                            { value: "none", label: "Sem logo" },
                          ]}
                        />
                        {config.logoPos ? (
                          <Button size="xs" tone="ghost" onClick={() => patch({ logoPos: null })} alignSelf="flex-start">
                            <RotateCcw size={12} /> Voltar a logo pro canto
                          </Button>
                        ) : (
                          <Text fontSize="xs" color="var(--admin-text-soft)">
                            Dica: arraste a logo na prévia para posicioná-la livremente.
                          </Text>
                        )}
                        <Button tone="ghost" size="xs" onClick={() => pickFile("logo")} loading={uploading} alignSelf="flex-start">
                          <Upload size={13} /> Trocar logo
                        </Button>
                      </>
                    ) : (
                      <Button tone="outline" size="sm" onClick={() => pickFile("logo")} loading={uploading} alignSelf="flex-start">
                        <Upload size={13} /> Adicionar logo da agência
                      </Button>
                    )}
                  </Stack>
                ),
              },
              {
                value: "moldura",
                title: "Moldura",
                content: (
                  <Stack gap={3}>
                    <FormSelect
                      label=""
                      value={frameChoiceValue(config.frame)}
                      onChange={(e) => patch({ frame: parseFrame(e.target.value) })}
                      options={frameOptions}
                    />
                    <Button tone="ghost" size="xs" onClick={() => pickFile("frame")} loading={uploading} alignSelf="flex-start">
                      <Upload size={13} /> Enviar moldura própria (PNG com centro vazado)
                    </Button>
                    <Text fontSize="xs" color="var(--admin-text-soft)">
                      A moldura é a borda em volta da foto. Escolha “Nenhuma” para foto sem borda,
                      ou estilos prontos (fina, dupla, sólida, rajada…).
                    </Text>
                  </Stack>
                ),
              },
              {
                value: "fundo",
                title: "Fundo",
                content: (
                  <Stack gap={3}>
                    <SegButtons
                      value={bgMode}
                      onChange={(v) => patch({ background: switchBg(v, config.background, settings) })}
                      options={[
                        { value: "color", label: "Cor" },
                        { value: "gradient", label: "Gradiente" },
                        { value: "image", label: "Imagem" },
                        { value: "none", label: "Transparente" },
                      ]}
                    />
                    {config.background.kind === "color" ? (
                      <ColorPicker
                        value={config.background.color}
                        onChange={(c) => patch({ background: { kind: "color", color: c } })}
                        colors={AVATAR_COLORS}
                        columns={9}
                      />
                    ) : null}
                    {config.background.kind === "gradient" ? (
                      <HStack gap={4} align="flex-start" flexWrap="wrap">
                        <Stack gap={1}>
                          <Text fontSize="xs" color="var(--admin-text-soft)">De</Text>
                          <ColorPicker
                            value={config.background.from}
                            onChange={(c) =>
                              patch({ background: { kind: "gradient", from: c, to: (config.background as { to: string }).to } })
                            }
                            colors={AVATAR_COLORS}
                            columns={9}
                            allowCustom={false}
                          />
                        </Stack>
                        <Stack gap={1}>
                          <Text fontSize="xs" color="var(--admin-text-soft)">Para</Text>
                          <ColorPicker
                            value={config.background.to}
                            onChange={(c) =>
                              patch({ background: { kind: "gradient", from: (config.background as { from: string }).from, to: c } })
                            }
                            colors={AVATAR_COLORS}
                            columns={9}
                            allowCustom={false}
                          />
                        </Stack>
                      </HStack>
                    ) : null}
                    {config.background.kind === "image" ? (
                      <HStack gap={2} flexWrap="wrap">
                        <Button tone="outline" size="xs" onClick={() => pickFile("background")} loading={uploading}>
                          <Upload size={13} /> Enviar fundo
                        </Button>
                        {settings.backgroundUrl ? (
                          <Button
                            tone="ghost"
                            size="xs"
                            onClick={() => patch({ background: { kind: "image", url: settings.backgroundUrl } })}
                          >
                            Usar fundo da agência
                          </Button>
                        ) : null}
                      </HStack>
                    ) : null}
                  </Stack>
                ),
              },
              {
                value: "tamanho",
                title: "Tamanho do arquivo",
                content: (
                  <SegButtons
                    value={String(size)}
                    onChange={(v) => setSize(Number(v))}
                    options={AVATAR_SIZES.map((s) => ({ value: String(s), label: `${s}×${s}` }))}
                  />
                ),
              },
            ]}
          />
        </Box>
      </Flex>

      {result ? (
        <Flex mt={4} p={3} borderRadius="12px" bg="var(--admin-nav-active)" gap={2} align="center" flexWrap="wrap">
          <Check size={16} color="var(--admin-primary)" />
          <Text fontSize="sm" color="var(--admin-primary)" fontWeight="600">
            Pronto! Baixe o PNG ou copie a URL pública no rodapé.
          </Text>
          <Text fontSize="xs" color="var(--admin-text-soft)" fontFamily="mono" lineClamp={1} flex="1" minW="200px">
            {result.url}
          </Text>
        </Flex>
      ) : null}
    </SidePanel>
  );
}

// ---- helpers puros ----

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "avatar"
  );
}

function parseFrame(v: string): AvatarFrameChoice {
  if (v === "none") return { kind: "none" };
  if (v.startsWith("preset:")) return { kind: "preset", presetId: v.slice(7) };
  if (v.startsWith("image:")) return { kind: "image", url: v.slice(6) };
  return { kind: "none" };
}

function switchBg(
  mode: "color" | "gradient" | "image" | "none",
  current: AvatarBackground,
  settings: AvatarSettings,
): AvatarBackground {
  if (mode === "color") return { kind: "color", color: settings.defaultBackgroundColor || "#0b1220" };
  if (mode === "gradient") return { kind: "gradient", from: "#0b1220", to: "#1f2937" };
  if (mode === "image")
    return { kind: "image", url: current.kind === "image" ? current.url : settings.backgroundUrl || "" };
  return { kind: "none" };
}
