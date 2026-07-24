/**
 * Nomes de ícone válidos pro seletor do editor "Meu site".
 * ESPELHA o registro do web (`apps/web/src/content/icons.ts` → REGISTRY). Nome
 * fora da lista cai no fallback (Sparkles) na hora de renderizar — nunca quebra.
 * Mantenha em sincronia com o REGISTRY do web.
 */
export interface SiteIconOption {
  value: string;
  label: string;
}

export const SITE_ICON_OPTIONS: SiteIconOption[] = [
  { value: "brain", label: "Cérebro (IA)" },
  { value: "trending-up", label: "Crescimento" },
  { value: "layout-dashboard", label: "Painel/Sistema" },
  { value: "zap", label: "Raio (automação)" },
  { value: "globe", label: "Globo (site)" },
  { value: "smartphone", label: "Celular (app)" },
  { value: "message-circle", label: "Balão (WhatsApp)" },
  { value: "plug", label: "Tomada (integração)" },
  { value: "code", label: "Código" },
  { value: "graduation-cap", label: "Formatura" },
  { value: "languages", label: "Idiomas" },
  { value: "map-pin", label: "Localização" },
  { value: "phone", label: "Telefone" },
  { value: "mail", label: "Email" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "sparkles", label: "Brilho" },
  { value: "rocket", label: "Foguete" },
  { value: "shield", label: "Escudo" },
  { value: "clock", label: "Relógio" },
  { value: "users", label: "Pessoas" },
  { value: "bar-chart", label: "Gráfico" },
  { value: "heart", label: "Coração" },
  { value: "check", label: "Check" },
  { value: "star", label: "Estrela" },
  { value: "target", label: "Alvo" },
  { value: "palette", label: "Paleta (design)" },
  { value: "database", label: "Banco de dados" },
  { value: "cpu", label: "Chip/CPU" },
  { value: "bot", label: "Robô/Bot" },
  { value: "workflow", label: "Fluxo" },
  { value: "wrench", label: "Ferramenta" },
  { value: "wallet", label: "Carteira (dinheiro)" },
  { value: "handshake", label: "Aperto de mão (parceria)" },
  { value: "user-plus", label: "Cadastrar pessoa" },
  { value: "coins", label: "Moedas (comissão)" },
  { value: "search", label: "Lupa (busca)" },
  { value: "calendar-check", label: "Agenda (agendamento)" },
  { value: "hammer", label: "Martelo (sob medida)" },
  { value: "badge-check", label: "Selo verificado" },
];

/** Só os valores (para validação leve, se precisar). */
export const SITE_ICON_VALUES = SITE_ICON_OPTIONS.map((o) => o.value);
