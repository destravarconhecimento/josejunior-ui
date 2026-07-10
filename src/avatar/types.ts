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

/**
 * Um anel concêntrico da moldura procedural. `width` = fração do lado (S).
 * `colors` (opcional) pinta o anel com um gradiente cônico (efeito "rajado" que dá
 * a volta na moldura); quando ausente usa a cor sólida `color`.
 */
export type AvatarRing = { color: string; width: number; colors?: string[] };

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

/**
 * COBERTURA do fundo: só o CÍRCULO (atrás da foto — padrão, avatar redondo limpo
 * com cantos transparentes) ou o QUADRADO INTEIRO ("pega tudo", cantos preenchidos
 * → visual de "card"/selo). Ausente = "circle" (compat com configs já salvas).
 */
export type AvatarBackgroundSpread = "circle" | "full";

/**
 * FUNDO do avatar (atrás da foto). Por padrão preenche só o círculo; com
 * `spread: "full"` cobre o quadrado inteiro (cantos inclusos).
 */
export type AvatarBackground =
  | { kind: "color"; color: string; spread?: AvatarBackgroundSpread }
  | { kind: "gradient"; from: string; to: string; spread?: AvatarBackgroundSpread }
  | {
      kind: "image";
      url: string;
      spread?: AvatarBackgroundSpread;
      /**
       * Cor pintada ATRÁS da imagem — garante que uma PNG com transparência (ex.:
       * respingo de tinta) nunca deixe o fundo vazio. Ausente = neutro (#0b1220).
       */
      baseColor?: string;
    }
  | { kind: "none" };

/** Posição/zoom da foto dentro do círculo. */
export type AvatarPhotoTransform = {
  /** Deslocamento horizontal, fração do raio [-1..1]. */
  offsetX: number;
  /** Deslocamento vertical, fração do raio [-1..1]. */
  offsetY: number;
  /** Multiplicador de zoom (1 = "cover" exato do círculo). */
  zoom: number;
  /** Espelha a foto na horizontal (efeito "selfie"). Ausente/false = normal. */
  flipH?: boolean;
  /**
   * Rotação da foto em graus, QUALQUER ângulo (slider livre −180..180; o botão
   * "Girar 90°" só dá saltos rápidos). O canvas aplica via `ctx.rotate`. Ausente = 0.
   */
  rotate?: number;
};

/**
 * Onde a logo da agência aparece (ou nenhum). `top`/`bottom` = centralizada em cima/
 * embaixo; os `*-left`/`*-right` ficam nos cantos do círculo. Tudo posicionado
 * DENTRO do círculo (a moldura preenche o quadrado, então canto = arco do círculo).
 */
export type AvatarLogoCorner =
  | "top"
  | "top-left"
  | "top-right"
  | "bottom"
  | "bottom-left"
  | "bottom-right"
  | "none";

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
  /**
   * Posição LIVRE da logo (centro, fração do lado 0..1), quando a pessoa arrasta a
   * logo na prévia. Sobrepõe `logoCorner`. Ausente/null = usa o canto. Opcional.
   */
  logoPos?: { x: number; y: number } | null;
  /** Família da fonte do nome (ver AVATAR_FONTS). */
  font: string;
  titleColor: string;
  subtitleColor: string;
  /** Nome e legenda em CAIXA ALTA (padrão do estilo "cara pintada"). */
  uppercase: boolean;
  /**
   * Não escreve o NOME no avatar (só foto + moldura + logo + legenda). Para um
   * visual mais limpo/profissional sem texto grande. Ausente/false = escreve o nome.
   */
  hideTitle?: boolean;
  /**
   * Legenda fixa desenhada CURVADA (acompanhando o redondo da moldura) em vez de
   * reta no rodapé. Ausente/false = reta. Opcional pra não quebrar configs antigas.
   */
  subtitleCurved?: boolean;
  /**
   * Ajuste fino da altura do NOME (fração do lado, somada à baseline padrão).
   * Negativo sobe, positivo desce. Ausente = 0. Opcional (configs antigas).
   */
  titleOffsetY?: number;
  /**
   * Ajuste horizontal do NOME (fração do lado, somada ao centro). Negativo p/
   * esquerda, positivo p/ direita. Setado ao arrastar o nome. Ausente = 0. Opcional.
   */
  titleOffsetX?: number;
  /**
   * Multiplicador do tamanho do NOME (1 = padrão). Ausente = 1. Opcional (configs
   * antigas). Deixa a agência aumentar/diminuir o nome sem depender do comprimento.
   */
  titleScale?: number;
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
 * A RECEITA de um padrão — o conjunto de escolhas (moldura, fundo, logo, legenda
 * fixa, fonte, cores, posições) que um avatar novo HERDA por inteiro. É o miolo
 * reaproveitado tanto pelo "padrão da agência" (`AvatarSettings`) quanto por cada
 * padrão nomeado (`AvatarPreset`). NÃO inclui a biblioteca de molduras enviadas
 * (`frames`), que é compartilhada por todos os padrões (referenciada por URL).
 */
export type AvatarRecipe = {
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
  /** Cobertura padrão do fundo (círculo = só atrás da foto; tudo = quadrado inteiro). Ausente = círculo. */
  defaultBackgroundSpread?: AvatarBackgroundSpread;
  /** Preset de moldura padrão. */
  defaultFramePresetId: string;
  /**
   * Moldura PNG da agência usada como padrão (URL de um item de `frames`). Quando
   * preenchida, todo avatar novo já nasce com ESSA moldura enviada em vez do preset.
   * Vazio/ausente = usa `defaultFramePresetId`.
   */
  defaultFrameUrl?: string;
  /** Posição padrão da logo nos avatares novos (ausente = topo, ou nenhuma sem logo). */
  defaultLogoCorner?: AvatarLogoCorner;
  /** Posição LIVRE padrão da logo (arrastada na prévia do padrão). Sobrepõe o canto. */
  defaultLogoPos?: { x: number; y: number } | null;
  /** Cor padrão do NOME (todo avatar novo começa assim). */
  defaultTitleColor?: string;
  /** Cor padrão da LEGENDA fixa. */
  defaultSubtitleColor?: string;
  /** Texto em CAIXA ALTA por padrão (ausente = true). */
  defaultUppercase?: boolean;
  /** Legenda curvada por padrão (ausente = false). */
  defaultSubtitleCurved?: boolean;
  /** Tamanho padrão do nome (multiplicador; ausente = 1). */
  defaultTitleScale?: number;
  /** Posição vertical padrão do nome (fração; ausente = 0). */
  defaultTitleOffsetY?: number;
  /** Posição horizontal padrão do nome (fração; ausente = 0). */
  defaultTitleOffsetX?: number;
};

/**
 * Um PADRÃO NOMEADO do gerador (ex.: "Padrão 1", "Padrão 2"). A agência mantém
 * VÁRIOS e escolhe qual usar na hora de criar um avatar. É uma `AvatarRecipe`
 * completa + `id`/`name`. As molduras enviadas ficam na biblioteca compartilhada
 * (`AvatarSettings.frames`); cada padrão só referencia uma por URL.
 */
export type AvatarPreset = AvatarRecipe & {
  id: string;
  name: string;
};

/**
 * "Padrão da agência" — o que fica DETERMINADO e é reaproveitado em TODO avatar
 * (guardado em ai_config `avatars_settings`). É a memória de marca do gerador.
 *
 * Os campos de receita no topo (`AvatarRecipe`) espelham o PADRÃO INICIAL (compat:
 * dados antigos de padrão único continuam válidos). `presets` guarda os padrões
 * nomeados; `defaultPresetId` diz qual vem pré-selecionado ao criar. A agência
 * define uma vez (ou vários) e todo avatar novo já nasce com o padrão escolhido.
 */
export type AvatarSettings = AvatarRecipe & {
  /** Molduras PNG (centro transparente) que a agência subiu — biblioteca COMPARTILHADA por todos os padrões. */
  frames: { id: string; label: string; url: string }[];
  /**
   * Padrões nomeados. Vazio/ausente = padrão único legado (a própria receita do
   * topo vira "Padrão 1"). Ver `avatarPresets`.
   */
  presets?: AvatarPreset[];
  /** id do padrão pré-selecionado ao criar um avatar (ausente = o primeiro/legado). */
  defaultPresetId?: string;
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
