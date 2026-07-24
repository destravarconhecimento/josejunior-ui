import { Inbox, Sparkles, Radar, UserPlus, FileSpreadsheet } from "lucide-react";
import { Tag } from "./Badge";

/**
 * Tipo de um lead pelo ângulo que interessa no atendimento: **quem procurou você**
 * (contato/orçamento) vs **quem você foi atrás** (prospectado). É o que separa
 * "cliente querendo algo" de "empresa que a gente raspou" — a confusão que o painel
 * de Atendimentos precisa desfazer.
 */
export type LeadKindKey = "contato" | "orcamento" | "prospectado" | "adicionado" | "importado";

/** Classifica um lead pelo par (source, origin). Ordem = da pista mais forte pra mais fraca. */
export function classifyLead(input: { source?: string | null; origin?: string | null }): LeadKindKey {
  const source = (input.source || "").toLowerCase();
  const origin = (input.origin || "").toLowerCase();
  // Prospecção: NÓS (ou o representante) fomos atrás — Google Places, raspagem.
  // Vale pro `source = 'prospeccao'` do sistema e pro `rep:<slug>` com origin "Prospecção…".
  if (source === "prospeccao" || origin.startsWith("prospec")) return "prospectado";
  // Cadastro à mão (no sistema `source=manual`; no rep origin "Cadastro manual").
  if (source === "manual" || origin.startsWith("cadastro manual")) return "adicionado";
  // Base importada (planilha/CSV/CRM de tenant).
  if (source === "import") return "importado";
  // Landing de IA de cotação: a pessoa PEDIU um orçamento.
  if (source === "site_cotacao") return "orcamento";
  // Formulário do site (nosso ou do rep) e o resto: a pessoa ENTROU EM CONTATO.
  return "contato";
}

export const LEAD_KIND_META: Record<LeadKindKey, { label: string; hint: string; bg: string; color: string }> = {
  contato: { label: "Entrou em contato", hint: "Te procurou — preencheu um formulário do site.", bg: "rgba(16,185,129,0.14)", color: "#047857" },
  orcamento: { label: "Pediu orçamento", hint: "Pediu um orçamento pela landing de IA.", bg: "rgba(59,130,246,0.14)", color: "#1d4ed8" },
  prospectado: { label: "Prospectado", hint: "Você foi atrás — esta pessoa não pediu contato.", bg: "rgba(234,179,8,0.18)", color: "#b45309" },
  adicionado: { label: "Adicionado", hint: "Cadastrado manualmente.", bg: "rgba(100,116,139,0.14)", color: "#475569" },
  importado: { label: "Importado", hint: "Veio de uma planilha ou importação de base.", bg: "rgba(148,163,184,0.16)", color: "#64748b" },
};

const KIND_ICON = { contato: Inbox, orcamento: Sparkles, prospectado: Radar, adicionado: UserPlus, importado: FileSpreadsheet } as const;

/** Badge do tipo do lead — o "o que é isto" logo no topo da linha/ficha. */
export function LeadKindBadge({ source, origin, iconSize = 12 }: { source?: string | null; origin?: string | null; iconSize?: number }) {
  const kind = classifyLead({ source, origin });
  const m = LEAD_KIND_META[kind];
  const Icon = KIND_ICON[kind];
  return (
    <Tag bg={m.bg} color={m.color} title={m.hint}>
      <Icon size={iconSize} />
      {m.label}
    </Tag>
  );
}
