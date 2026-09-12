// Primitivos de layout (re-export fino do Chakra — apps importam daqui, nunca do Chakra)
export * from "./primitives";
// Controles DO design-system (componentes do ui, estilo --admin embutido)
export {
  Input, Textarea, IconButton, Field, NativeSelect, Switch, Badge,
  type InputProps, type TextareaProps, type IconButtonProps, type BadgeProps,
} from "./components/controls";
// Escape hatches do Chakra — SÓ para telas PÚBLICAS; proibido em painel (app)
export * from "./chakra-controls";

// Provider único de UI (next-themes + Chakra) + fábrica de system (cor do chamador)
export { UiProvider } from "./provider/UiProvider";
export {
  createUiSystem,
  createPainelSystem,
  getUiSystem,
  PAINEL_CONFIG,
  type UiSystem,
} from "./provider/system";
export {
  ColorModeProvider,
  ColorModeButton,
  useColorMode,
  useColorModeSwitchable,
  type ColorMode,
} from "./provider/color-mode";

// Tema / shell visual
export {
  AdminThemeShell,
  AdminCrest,
  AdminBrandLogo,
  initialsFrom,
} from "./theme/AdminThemeShell";
export { buildAdminTokensCss, type AdminPalette } from "./theme/tokens";
export { ADMIN_STRUCTURAL_CSS } from "./theme/structural-css";

// Shell — `AppShell` (sidebar escura) ou `TopBarShell` (header horizontal)
export { AppShell } from "./shell/AppShell";
export { TopBarShell } from "./shell/TopBarShell";
export { TopNav } from "./shell/TopNav";
export { GroupRail } from "./shell/GroupRail";
export { NavSearch } from "./shell/NavSearch";
export { NavBadgeLink } from "./shell/NavBadgeLink";
export {
  NotificationBell,
  type NotificationItem,
  type NotificationTone,
} from "./shell/NotificationBell";
export { UserMenu } from "./shell/UserMenu";
export { MobileNav } from "./shell/MobileNav";
export { BottomNav } from "./shell/BottomNav";
export { ActiveLink, isActiveHref } from "./shell/ActiveLink";
export type { NavItem, NavSection, Brand, AppUser } from "./shell/types";

// Primitivos
// `Screen` = moldura única da tela (header + corpo). É o que as telas devem usar;
// `PageHeader`/`PageBody` seguem exportados pra composição fora do padrão (workspace).
export { Screen } from "./components/Screen";
export { PageHeader } from "./components/PageHeader";
export { PageBody } from "./components/PageBody";
export { ScrollArea } from "./components/ScrollArea";
export { Card } from "./components/Card";
export { Button, type ButtonTone } from "./components/Button";
// Botão de ícone COM significado (a cor diz o que a ação faz) — listas de trabalho
export { AcaoIcone, type AcaoTone } from "./components/AcaoIcone";
// Dado que se copia no próprio clique (e-mail, telefone) — poupa botão na linha
export { TextoCopiavel } from "./components/TextoCopiavel";
// Telefone de linha de lista: selo "tem WhatsApp?" + o número clicável pra copiar
export { NumeroWhats, type SituacaoWhats } from "./components/NumeroWhats";
export { Tag, StatusBadge, DeliveryBadge, estiloDeStatus } from "./components/Badge";
// A ficha do lead — a MESMA nos dois painéis (José e representante)
export {
  FichaLead,
  type FichaLeadDados,
  type FichaEtapaOpcao,
  type FichaEmail,
  type FichaPeca,
} from "./components/FichaLead";
export { LeadKindBadge, classifyLead, LEAD_KIND_META, type LeadKindKey } from "./components/LeadKind";
// Atendimento — quem procurou você (site ou orçamento da proposta), a MESMA tela nos dois painéis.
// A tela é client; as regras (canal, carimbo de contato, "procurou você") são puras e o SERVIDOR
// dos dois painéis chama — por isso moram em ./atendimento, fora do componente.
export { Atendimentos, type AtendimentoItem } from "./components/Atendimentos";
export {
  type AtendimentoCanal,
  type ContatoCarimbado,
  carimbosDeContato,
  ultimoContato,
  ultimoContatoDeFormulario,
  procurouVoce,
  canalDoContato,
  origemDoContato,
  tokenDaProposta,
  ORIGEM_PROPOSTA,
  PROPOSTA_BASE_URL,
} from "./atendimento";
export { EmptyState } from "./components/EmptyState";
// Tempo real por INJEÇÃO (o ui não conhece transporte — ver components/realtime.ts)
export type { UiRealtimeEvent, UiRealtimeSubscribe } from "./components/realtime";
export { EmailHtmlView } from "./components/EmailHtmlView";
export {
  MailClient,
  DEFAULT_MAIL_CATEGORIES,
  type MailResult,
  type MailProvider,
  type MailConnEditor,
  type MailConnectionRow,
  type MailDnsRecord,
  type MailDomain,
  type MailDomainOption,
  type MailUserOption,
  type MailAccountRow,
  type MailInboxAccount,
  type MailAttachment,
  type MailMessage,
  type MailFolder,
  type MailAiSettings,
  type MailCallbacks,
} from "./components/email/MailClient";
export type { MailAiChatConfig } from "./components/email/MailAiPanel";
export {
  WhatsAppInbox,
  type WaInboxApi,
  type WaInboxResult,
  type WaChat,
  type WaMessage,
  type WaMediaKind,
} from "./components/whatsapp/WhatsAppInbox";
export {
  WhatsAppClient,
  type WhatsAppClientProps,
  type WhatsAppResult,
  type WhatsAppSentBy,
  type WhatsAppVinculo,
  type WhatsAppVinculoLead,
  type WhatsAppVinculoTenant,
  type WhatsAppVinculoOption,
  type WhatsAppChat,
  type WhatsAppMessage,
  type WhatsAppStats,
  type WhatsAppConfigSlot,
  type WhatsAppCallbacks,
} from "./components/whatsapp/WhatsAppClient";
export {
  WhatsAppFab,
  abrirWhatsAppFab,
  WA_FAB_OPEN_CHAT_EVENT,
  WA_FAB_SENT_EVENT,
  type WhatsAppFabOpenChat,
  type WhatsAppFabSent,
  type WhatsAppFabProps,
  type WhatsAppFabCallbacks,
  type WhatsAppFabIa,
  type WhatsAppFabIaEstado,
} from "./components/whatsapp/WhatsAppFab";
export {
  ConexaoWhatsApp,
  type ConexaoWhatsAppProps,
  type ConexaoWhatsAppPairResult,
  type ConexaoWhatsAppModo,
} from "./components/whatsapp/ConexaoWhatsApp";
export {
  ConexaoPlugin,
  type ConexaoPluginProps,
  type PluginConfigView,
  type PluginDeviceView,
  type PluginFilaView,
  type PluginCodigo,
} from "./components/whatsapp/ConexaoPlugin";
export {
  ContasWhatsApp,
  type ContasWhatsAppProps,
  type WaContaModo,
  type WaContaView,
  type WaContaAcao,
  type WaPedidoStatus,
  type WaPedidoView,
} from "./components/whatsapp/ContasWhatsApp";
export {
  GoogleCredentialForm,
  type GoogleCredentialSaveResult,
  type GoogleRedirectUri,
} from "./components/GoogleCredentialForm";
export { FormField, FormGrid, FormActions, FormColor, FormInput, FormSelect, FormTextarea } from "./components/form";
export { DataTable, TableCard, type Column, type Selection } from "./components/DataTable";
export { type SortState, type SortDir, type ValorCelula, proximoSort, ordenarLinhas, compararValores } from "./components/table/sort";
export {
  type FiltroColuna,
  type ValorFaceta,
  chaveDoValor,
  rotuloDoValor,
  aplicarFiltros,
  valoresDistintos,
} from "./components/table/filtros";
export { type PresetTabela, lerPresets, gravarPresets } from "./components/table/presets";
export { AcoesLinha, type AcaoLinha } from "./components/table/AcoesLinha";
export { ChipFiltro } from "./components/table/BarraTabela";
export {
  type KindCelula,
  type ColunaCelula,
  type PaletaEnum,
  type CatalogoEnumsUi,
  CORES_ENUM,
  EnumTag,
  humanizarEnum,
  chavePaletaEnum,
  rotuloEnum,
  paletaEnum,
  renderCelulaDeclarativa,
} from "./components/table/celula-declarativa";
export { type UiTextos, UI_TEXTOS_PT, fmtTexto, plural } from "./textos";
export {
  type FormatoUi,
  FORMATO_PT,
  FUSO_OPERACAO,
  localeIntl,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  formatarData,
  formatarDataHora,
} from "./format";
export { UiTextosProvider, useUiTextos, useUiFormato, useUiEnums } from "./provider/textos";
export { FunilLeadsTable } from "./components/funil/FunilLeadsTable";
export {
  CONTATO_META,
  type LinhaFunil,
  type EtapaFunilOpcao,
  type FunilCallbacks,
  type EstadoContatoFunil,
  type EnvioFunil,
  type HandoffFunil,
  type PropostaResumo,
  type OrcamentoResumo,
} from "./components/funil/types";
export {
  BLOCO_META,
  BLOCOS_DIA,
  type BlocoDia,
  type SinalFunil,
  noBloco,
  sinalDe,
  ordemDoDia,
  encerraDe,
  diaLocal,
  fimDeHoje,
  fmtDia,
  fmtData,
} from "./components/funil/blocos";
export {
  PassoModal,
  ContatoModal,
  NotaModal,
  ChamarJoseModal,
  CANAIS_CONTATO,
  MOTIVOS_CONTATO,
} from "./components/funil/modais";
export { Pagination } from "./components/Pagination";
export { Modal } from "./components/Modal";
export { ImageCropper } from "./components/ImageCropper";
export { CrudManager } from "./components/CrudManager";
export {
  EvolucoesManager,
  type EvolucoesManagerProps,
  type EvolucaoItem,
  type EvolucaoSaveData,
} from "./components/EvolucoesManager";
export {
  type EvolucaoFoto,
  MAX_EVOLUCAO_FOTOS,
  legendaPadraoEvolucao,
  legendaDaFoto,
  normalizeEvolucaoFotos,
  linhasDaEvolucao,
} from "./evolucao/types";
export {
  alinharEvolucao,
  normalizeFoco,
  type FocoFoto,
  type CaixaFoco,
  type JanelaFoto,
  type AlinhamentoEvolucao,
} from "./evolucao/alinhamento";
export {
  arteEvolucaoTree,
  arteDimensoes,
  ARTE_DIMENSOES,
  ARTE_FORMATO_PADRAO,
  ARTE_W,
  ARTE_H,
  ARTE_DOURADO,
  ARTE_FUNDO,
  ARTE_ASSINATURA,
  ARTE_DESTAQUES,
  type ArteFormato,
  type ArteEvolucaoInput,
} from "./evolucao/arte";
export {
  ArteEvolucaoModal,
  type ArteEvolucaoModalProps,
  type ArteEvolucaoConfig,
  type ArteEvolucaoAlvo,
  type ArteEvolucaoTextos,
} from "./evolucao/ArteEvolucaoModal";
export { Toaster, toaster, toast, type ToastOpts } from "./components/Toast";
export { Accordion, type AccordionItemDef } from "./components/Accordion";
export { SidePanel } from "./components/SidePanel";
export { ConfirmDialog } from "./components/ConfirmDialog";
export { useConfirm } from "./components/useConfirm";
export { FilterBar, type SelectFilter } from "./components/FilterBar";
export { rowMatchesQuery } from "./search";
export { InlineSelect, type InlineSelectOption } from "./components/InlineSelect";
export { SearchSelect, type SearchSelectOption } from "./components/SearchSelect";
export { MonthPicker } from "./components/MonthPicker";
export { AccountSelector, type AccountSelectorOption } from "./components/AccountSelector";
export { ActionMenu, type ActionMenuItem } from "./components/ActionMenu";
export { LocaleSelector, type LocaleOption } from "./components/LocaleSelector";
export { FlagIcon } from "./components/FlagIcon";
export {
  TranslationsSection,
  type TranslationsSectionProps,
  type TranslationsPayload,
  type TranslationsLocale,
  type TranslationsField,
  type TranslationsEntry,
  type TranslationsActionResult,
} from "./components/TranslationsSection";
export { RepSiteSectionsEditor, REPSITE_I18N_LABELS, type RepSiteSectionsEditorProps } from "./components/RepSiteSectionsEditor";
// Editor "Meu site" (josejunior.dev) — componente PURO (molde MailClient): todas
// as seções + o módulo de rastreamento vivem aqui; o app injeta actions e o slot
// de upload. Ver components/site-editor/.
export {
  SiteIdentityEditor,
  type SiteIdentityEditorProps,
  type SiteIdentityCallbacks,
} from "./components/site-editor/SiteIdentityEditor";
export {
  type SiteIdentityContent,
  type SiteMarketing,
  type SiteSaveResult,
  type SiteImageUploadSlot,
  type SiteProjectStatus,
  type SiteSocialKind,
  type SiteIconItem,
  type SiteStepItem,
  type SiteProjectItem,
  type SiteTimelineItem,
  type SiteTestimonialItem,
  type SiteHighlightItem,
  type SiteContactInfoItem,
  type SiteSkillItem,
  type SiteSocialItem,
  type SiteStatItem,
  type SiteThemeContent,
} from "./components/site-editor/types";
export { SITE_ICON_OPTIONS, SITE_ICON_VALUES, type SiteIconOption } from "./components/site-editor/icon-options";
// Ícone de MARCA do WhatsApp (o lucide só tem `MessageCircle` genérico). Vem do
// pacote `react-icons` (Font Awesome 6) — nada de SVG à mão. Fonte única: os
// FABs e os botões flutuantes importam ESTE, não o react-icons direto.
export { FaWhatsapp as WhatsAppIcon } from "react-icons/fa6";
export { ColorPicker, type ColorScheme } from "./components/ColorPicker";
export { Tabs, type TabDef } from "./components/Tabs";
export { PanelTabs } from "./components/PanelTabs";
export { PageTabs } from "./components/PageTabs";
export { ChatMarkdown } from "./components/ChatMarkdown";
export { AiAssistantFab } from "./components/AiAssistantFab";
// Console do assistente (chat em tela cheia) — divide o miolo com o FAB.
export { AiAssistantConsole, type AiConsoleSuggestion } from "./components/ai/AiAssistantConsole";
export { useAiChat, type AiChatMsg } from "./components/ai/useAiChat";
export { TETO_CORPO, erroDaResposta, lerJson, mb, reduzirImagem } from "./components/ai/envio";

// Primitivos premium (KPIs, avatar, IA, timeline, ações rápidas)
export { KpiCard, KpiRow, type KpiRowItem, type KpiTone, type KpiTrendTone } from "./components/KpiCard";
export { ProgressBar, type ProgressTone } from "./components/ProgressBar";
export {
  EntityAvatar,
  type EntityAvatarSize,
  type EntityAvatarStatus,
} from "./components/EntityAvatar";
export { UserAvatar } from "./components/UserAvatar";
export {
  AVATAR_SCHEMES,
  type AvatarScheme,
  resolveAvatarScheme,
  isAvatarSchemeId,
} from "./components/avatarSchemes";
export { InsightCard, type InsightTone } from "./components/InsightCard";
export { Timeline, type TimelineItem, type TimelineTone } from "./components/Timeline";
export {
  QuickActionGrid,
  type QuickAction,
  type QuickActionTone,
} from "./components/QuickActionGrid";
export { DonutChart, type DonutItem } from "./components/DonutChart";
export { LineChart, type LineSeries } from "./components/LineChart";

// Catálogo de venda (mesma lista no painel do representante e no do sistema)
export { CatalogoVenda, LinkDeVenda, AcessoDemo } from "./components/CatalogoVenda";
export {
  montarCatalogo,
  linksDoMaterial,
  mensagemDeAtivacao,
  type MensagemAtivacaoInput,
  type CatalogoItem,
  type CatalogoVertical,
  type CatalogoDemo,
  type CatalogoSegmentoPronto,
  type CatalogoIdioma,
} from "./catalogo";

// Proposta: a peça por EMPRESA (o catálogo acima é o que se vende, isto é o
// que se manda pra uma empresa). Mesmo gerador no sistema e no representante.
export {
  PropostaGenerator,
  SegmentoTag,
  type PropostaGeneratorProps,
  type PropostaSegmentoOpcao,
  type PropostaVendedorOpcao,
  type PropostaDossie,
  type PropostaAlvo,
  type PropostaGerarInput,
  type PropostaLinks,
} from "./components/PropostaGenerator";

// Central Operacional (status, fila, funil, atendimento, ações)
export {
  IntegrationStatusRow,
  IntegrationStatusCard,
  type IntegrationStatusItem,
  type IntegrationTone,
} from "./components/IntegrationStatusRow";
export {
  OperationalQueue,
  type OperationalQueueItem,
  type QueuePriority,
} from "./components/OperationalQueue";
export { ProcessFunnelCard, type FunnelStage } from "./components/ProcessFunnelCard";
export { FunnelStagesBar, type FunnelBarStage } from "./components/FunnelStagesBar";
export {
  ConversationSnapshotList,
  type ConversationSnapshotItem,
  type ConversationStatusTone,
} from "./components/ConversationSnapshotCard";
export { ActionListCard, type ActionListItem, type ActionTone } from "./components/ActionListCard";
export { RecentSalesList, type RecentSaleItem, type CoinSaleStatus } from "./components/RecentSalesList";

// sitekit — motor visual dos SITES PÚBLICOS (segmento, representante, meu site):
// tema por `vibe`, ícone por NOME, mockup de produto em CSS, faixa de confiança.
// Tudo dado → CSS, RSC-safe. Ver packages/ui/src/sitekit/index.ts.
export {
  resolveSiteIcon,
  SITE_ICON_NAMES,
  SITE_VIBES,
  SITE_VIBE_NAMES,
  resolveSiteTheme,
  brandGradient,
  darken,
  tint,
  DeviceMock,
  MOCK_KINDS,
  TrustStrip,
  DEFAULT_TRUST_SELF_SERVE,
  DEFAULT_TRUST_ATENDIMENTO,
  type LucideIcon,
  type SiteVibe,
  type SiteTheme,
  type ResolvedSiteTheme,
  type MockSpec,
  type MockDevice,
  type MockKind,
  type MockRow,
  type MockKpi,
  type MockTranslate,
  type TrustItem,
} from "./sitekit";

// Editor de Flyers (canvas puro + editor client + galeria) — apps/site
export { SlidePage, type SlidePageProps, type SlideMode } from "./flyer/SlidePage";
export { FlyerEditor, type FlyerEditorProps, type FlyerSaveData } from "./flyer/FlyerEditor";
export type { FlyerComparison } from "./flyer/types";
export { FlyersGallery, type FlyersGalleryProps } from "./flyer/FlyersGallery";
export { FlyerPublicView, type FlyerPublicViewProps } from "./flyer/FlyerPublicView";
export {
  CANVAS_W as FLYER_CANVAS_W,
  CANVAS_H as FLYER_CANVAS_H,
  GOLD_GRADIENT,
  GOLD_SOLID,
  FLYER_FONTS,
  FONT_WEIGHTS,
  FLYER_DOC_VERSION,
} from "./flyer/constants";
export {
  flyerId,
  createTextElement,
  createImageElement,
  createShapeElement,
  blankPage,
  seedFlyerDocument,
  cloneElementShifted,
} from "./flyer/seed";
export type {
  FlyerBackground,
  FlyerTextElement,
  FlyerImageElement,
  FlyerShapeElement,
  FlyerElement,
  FlyerPage,
  FlyerDocument,
  FlyerBrand,
  FlyerSummary,
} from "./flyer/types";

// Gerador de Avatares (canvas puro + estúdio + galeria + padrão da agência) — apps/site
export { AvatarStudio, type AvatarStudioProps, type AvatarEditData } from "./avatar/AvatarStudio";
export { AvatarGallery, type AvatarGalleryProps } from "./avatar/AvatarGallery";
export { AvatarStudioPanel, type AvatarStudioPanelProps } from "./avatar/AvatarStudioPanel";
export { AvatarSettingsPanel, type AvatarSettingsPanelProps } from "./avatar/AvatarSettingsPanel";
export { AvatarCanvas, type AvatarCanvasProps } from "./avatar/AvatarCanvas";
export {
  composeAvatar,
  drawAvatarScene,
  ensureAvatarFont,
  loadAvatarImage,
  type AvatarScene,
} from "./avatar/compose";
export {
  AVATAR_SIZES,
  AVATAR_RENDER_SIZE,
  AVATAR_FONTS,
  AVATAR_FRAME_PRESETS,
  AVATAR_LAYOUT,
  AVATAR_COLORS,
  DEFAULT_AVATAR_SETTINGS,
  avatarFontWeight,
  avatarFontsHref,
  defaultAvatarConfig,
  avatarPresets,
  recipeOf,
  resolveAvatarPreset,
  bgSpreadOf,
  withBgSpread,
  type AvatarFont,
} from "./avatar/constants";
export type {
  AvatarSize,
  AvatarRing,
  AvatarFramePreset,
  AvatarFrameChoice,
  AvatarBackground,
  AvatarBackgroundSpread,
  AvatarPhotoTransform,
  AvatarLogoCorner,
  AvatarConfig,
  AvatarSummary,
  AvatarRecipe,
  AvatarPreset,
  AvatarSettings,
  AvatarBrand,
  AvatarMember,
  AvatarSaveData,
  AvatarActionResult,
  AvatarUploadKind,
} from "./avatar/types";

// Vertical clínica (agenda por vagas) — primitivo puro, sem servidor.
export {
  AgendaGrade,
  AgendaGradeLegenda,
  AGENDA_STATUS_LABELS,
  AGENDA_STATUS_STYLES,
  type AgendaGradeSlot,
  type AgendaGradeDay,
  type AgendaGradeStatus,
} from "./clinica/AgendaGrade";
export { PdvBalcao, fmtBRL as fmtBRLCents, type PdvProduto, type PdvCategoria, type PdvItemCarrinho } from "./components/PdvBalcao";
