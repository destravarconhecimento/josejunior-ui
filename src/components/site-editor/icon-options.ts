/**
 * Nomes de ícone válidos pro seletor do editor "Meu site".
 *
 * A FONTE é o registry do design-system (`sitekit/icons.ts`) — o mesmo que o
 * `apps/web` usa pra renderizar. A lista curada abaixo só dá RÓTULO em pt-BR e
 * ordem aos nomes mais usados; todo nome do registry que não estiver nela entra
 * no fim, com o próprio nome como rótulo. Assim é impossível o editor oferecer
 * um ícone que o site não sabe desenhar — ou esconder um que ele sabe.
 */
import { SITE_ICON_NAMES } from "../../sitekit/icons";

export interface SiteIconOption {
  value: string;
  label: string;
}

/** Rótulos pt-BR dos ícones mais usados (define também a ordem no seletor). */
const CURATED: SiteIconOption[] = [
  { value: "sparkles", label: "Brilho (padrão)" },
  { value: "brain", label: "Cérebro (IA)" },
  { value: "trending-up", label: "Crescimento" },
  { value: "layout-dashboard", label: "Painel/Sistema" },
  { value: "zap", label: "Raio (automação)" },
  { value: "globe", label: "Globo (site)" },
  { value: "smartphone", label: "Celular (app)" },
  { value: "message-circle", label: "Balão (WhatsApp)" },
  { value: "message-square", label: "Balão (mensagem)" },
  { value: "plug", label: "Tomada (integração)" },
  { value: "code", label: "Código" },
  { value: "graduation-cap", label: "Formatura" },
  { value: "languages", label: "Idiomas" },
  { value: "map-pin", label: "Localização" },
  { value: "phone", label: "Telefone" },
  { value: "mail", label: "Email" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "rocket", label: "Foguete" },
  { value: "shield", label: "Escudo" },
  { value: "clock", label: "Relógio" },
  { value: "users", label: "Pessoas" },
  { value: "user-plus", label: "Cadastrar pessoa" },
  { value: "bar-chart", label: "Gráfico" },
  { value: "pie-chart", label: "Gráfico (pizza)" },
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
  { value: "coins", label: "Moedas (comissão)" },
  { value: "handshake", label: "Aperto de mão (parceria)" },
  { value: "search", label: "Lupa (busca)" },
  { value: "calendar-check", label: "Agenda (agendamento)" },
  { value: "calendar", label: "Calendário" },
  { value: "hammer", label: "Martelo (sob medida)" },
  { value: "badge-check", label: "Selo verificado" },
  // — vocabulário dos segmentos (portas da home, fluxo da operação) —
  { value: "stethoscope", label: "Estetoscópio (clínica)" },
  { value: "dumbbell", label: "Halter (treino)" },
  { value: "file-text", label: "Documento (cartório)" },
  { value: "scale", label: "Balança (jurídico)" },
  { value: "home", label: "Casa (imóveis)" },
  { value: "building", label: "Prédio (empresa)" },
  { value: "store", label: "Loja (comércio)" },
  { value: "truck", label: "Caminhão (logística)" },
  { value: "car", label: "Carro (frota)" },
  { value: "utensils", label: "Talheres (restaurante)" },
  { value: "scissors", label: "Tesoura (salão)" },
  { value: "pill", label: "Remédio (farmácia)" },
  { value: "baby", label: "Bebê (pediatria)" },
  { value: "clipboard", label: "Prancheta (ficha)" },
  { value: "folder", label: "Pasta (arquivos)" },
  { value: "receipt", label: "Recibo (cobrança)" },
  { value: "credit-card", label: "Cartão (pagamento)" },
  { value: "lock", label: "Cadeado (segurança)" },
  { value: "headphones", label: "Headset (suporte)" },
  { value: "timer", label: "Cronômetro (tempo)" },
  { value: "bell", label: "Sino (lembrete)" },
  { value: "send", label: "Enviar" },
];

const CURATED_VALUES = new Set(CURATED.map((o) => o.value));

/**
 * Todas as opções do seletor: as curadas (com rótulo pt-BR) primeiro, depois o
 * resto do registry em ordem alfabética — nenhum ícone do site fica de fora.
 */
export const SITE_ICON_OPTIONS: SiteIconOption[] = [
  ...CURATED.filter((o) => SITE_ICON_NAMES.includes(o.value)),
  ...SITE_ICON_NAMES.filter((n) => !CURATED_VALUES.has(n))
    .sort()
    .map((n) => ({ value: n, label: n })),
];

/** Só os valores (para validação leve, se precisar). */
export const SITE_ICON_VALUES = SITE_ICON_OPTIONS.map((o) => o.value);
