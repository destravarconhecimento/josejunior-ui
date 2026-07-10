/**
 * Tipos do Gerador de Avatares (puro — sem React, seguro no server e no client).
 *
 * Um avatar é uma imagem QUADRADA (512/1024) montada por camadas: fundo → foto
 * circular (recortada, com pan/zoom) → moldura (anéis procedurais OU PNG da
 * agência) → logo (opcional) → 2 linhas de texto no rodapé (nome + legenda fixa).
 * Toda a composição roda no navegador (canvas) — sem IA, sem custo por geração.
 */

/** Tamanho final do PNG exportado (px, quadrado). */
export type AvatarSize = 1024 | 512;

/** Um anel concêntrico da moldura procedural. `width` = fração do lado (S). */
export type AvatarRing = { color: string; width: number };

/**
 * MOLDURA "preset": anéis concêntricos desenhados no próprio canvas (ex.: o
 * anel rasta verde/amarelo/vermelho das referências). Não precisa de asset — é
 * desenho vetorial, escala perfeito em qualquer tamanho.
 */
export type AvatarFramePreset = {
  id: string;
  label: string;
  rings: AvatarRing[];
};

/** Moldura escolhida num avatar (resolve pra preset, PNG da agência ou nenhuma). */
export type AvatarFrameChoice =
  | { kind: "preset"; presetId: string }
  | { kind: "image"; url: string }
  | { kind: "none" };

/** FUNDO do avatar (atrás da foto), preenche o quadrado inteiro. */
export type AvatarBackground =
  | { kind: "color"; color: string }
  | { kind: "gradient"; from: string; to: string }
  | { kind: "image"; url: string }
  | { kind: "none" };

/** Posição/zoom da foto dentro do círculo. */
export type AvatarPhotoTransform = {
  /** Deslocamento horizontal, fração do raio [-1..1]. */
  offsetX: number;
  /** Deslocamento vertical, fração do raio [-1..1]. */
  offsetY: number;
  /** Multiplicador de zoom (1 = "cover" exato do círculo). */
  zoom: number;
};

/** Canto onde a logo da agência aparece (ou nenhum). */
export type AvatarLogoCorner = "top" | "bottom-left" | "bottom-right" | "none";

/**
 * Config COMPLETA de um avatar — o suficiente pra REABRIR e regenerar idêntico.
 * Guardada em jsonb (`avatars.config`).
 */
export type AvatarConfig = {
  photoUrl: string | null;
  photo: AvatarPhotoTransform;
  frame: AvatarFrameChoice;
  background: AvatarBackground;
  /** Logo sobreposta (null = sem logo). */
  logoUrl: string | null;
  logoCorner: AvatarLogoCorner;
  /** Família da fonte do nome (ver AVATAR_FONTS). */
  font: string;
  titleColor: string;
  subtitleColor: string;
  /** Nome e legenda em CAIXA ALTA (padrão do estilo "cara pintada"). */
  uppercase: boolean;
};

/** Resumo de um avatar já criado (card da galeria). */
export type AvatarSummary = {
  id: number;
  name: string;
  subtitle: string | null;
  resultUrl: string | null;
  thumbnailUrl: string | null;
  size: number;
  /** ISO string (serializável do server → client). */
  updatedAt: string;
};

/**
 * "Padrão da agência" — o que fica DETERMINADO e é reaproveitado em TODO avatar
 * (guardado em ai_config `avatars_settings`). É a memória de marca do gerador: a
 * agência define uma vez (molduras, logo, legenda fixa, fonte, fundo) e todo
 * avatar novo já nasce com esse padrão.
 */
export type AvatarSettings = {
  /** Molduras PNG (centro transparente) que a agência subiu. */
  frames: { id: string; label: string; url: string }[];
  /** Logo padrão da agência (vazio = usa o logo da marca). */
  logoUrl: string;
  /** Fundo padrão (imagem, ex.: respingo de tinta). Vazio = cor sólida. */
  backgroundUrl: string;
  /** 2ª linha fixa embaixo do nome (ex.: "CARA PINTADA"). */
  fixedSubtitle: string;
  /** Fonte padrão do nome. */
  defaultFont: string;
  /** Cor padrão de fundo (quando não há imagem). */
  defaultBackgroundColor: string;
  /** Preset de moldura padrão. */
  defaultFramePresetId: string;
};

/** Marca do tenant (fallback pra logo/cores). */
export type AvatarBrand = {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor?: string;
};

/**
 * Membro da agência oferecido no picker de "novo avatar" (agências de host têm
 * roster com nome + foto). Escolher um pré-preenche o nome e a foto do avatar;
 * a alternativa é o caminho "manual" (campos em branco).
 */
export type AvatarMember = {
  name: string;
  photoUrl: string | null;
  category?: string | null;
};

/** Dados que a tela manda pra salvar (novo se `id` ausente, senão update). */
export type AvatarSaveData = {
  id?: number;
  name: string;
  subtitle: string | null;
  size: number;
  resultUrl: string;
  thumbnailUrl: string | null;
  config: AvatarConfig;
};

/** Resultado padrão das actions (ok/erro) usado pelos callbacks. */
export type AvatarActionResult = { ok: true; id?: number } | { ok: false; error: string };

/**
 * Categoria de imagem enviada ao Blob (define o subcaminho e o cache). O app
 * injeta o uploader via callback (o `@josejunior/ui` não depende de `@vercel/blob`).
 */
export type AvatarUploadKind = "photo" | "frame" | "logo" | "background" | "result";
