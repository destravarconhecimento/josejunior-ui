export type UiTextos = {
  selecionarLinha: string;
  selecionarTodos: string;
  selecionarTudo: string;
  acoes: string;
  maisAcoes: string;
  arrasteParaReordenar: string;
  vazioTitulo: string;
  carregando: string;
  filtradoVazioTitulo: string;
  filtradoVazioUma: string;
  filtradoVazioMuitas: string;
  limparFiltros: string;
  limparTudo: string;
  paginaAnterior: string;
  paginaProxima: string;
  irParaPagina: string;
  rodapeFaixa: string;
  rodapeFiltradoDe: string;
  expandir: string;
  recolher: string;
  recolherDica: string;
  fechar: string;
  tabela: string;
  tabelaTelaCheia: string;
  telaCheiaDe: string;
  umItem: string;
  muitosItens: string;
  itensDeTotal: string;
  ordenarPor: string;
  ordenar: string;
  ordemPadrao: string;
  ordemPadraoVoltar: string;
  ordemChip: string;
  filtrar: string;
  filtrarContagem: string;
  filtrarColuna: string;
  tirarFiltroDe: string;
  valoresContagem: string;
  buscarValor: string;
  nenhumValorCom: string;
  valorVazio: string;
  sim: string;
  nao: string;
  semValor: string;
};

export const UI_TEXTOS_PT: UiTextos = {
  selecionarLinha: "Selecionar linha",
  selecionarTodos: "Selecionar todos",
  selecionarTudo: "Selecionar tudo",
  acoes: "Ações",
  maisAcoes: "Mais ações",
  arrasteParaReordenar: "Arraste para reordenar",
  vazioTitulo: "Nada por aqui ainda.",
  carregando: "Carregando…",
  filtradoVazioTitulo: "Nenhuma linha passa nos filtros.",
  filtradoVazioUma: "{n} linha escondida pelos filtros da tabela.",
  filtradoVazioMuitas: "{n} linhas escondidas pelos filtros da tabela.",
  limparFiltros: "Limpar filtros",
  limparTudo: "Limpar tudo",
  paginaAnterior: "Página anterior",
  paginaProxima: "Próxima página",
  irParaPagina: "Ir para a página",
  rodapeFaixa: "{de}–{ate} de {total}",
  rodapeFiltradoDe: " · filtrado de {total}",
  expandir: "Expandir para tela cheia",
  recolher: "Sair da tela cheia",
  recolherDica: "Sair da tela cheia (Esc)",
  fechar: "Fechar (Esc)",
  tabela: "Tabela",
  tabelaTelaCheia: "Tabela em tela cheia",
  telaCheiaDe: "{titulo} em tela cheia",
  umItem: "{n} item",
  muitosItens: "{n} itens",
  itensDeTotal: " (de {total})",
  ordenarPor: "Ordenar por {coluna}",
  ordenar: "Ordenar",
  ordemPadrao: "Ordem padrão",
  ordemPadraoVoltar: "Voltar à ordem padrão",
  ordemChip: "Ordem: {coluna} {seta}",
  filtrar: "Filtrar",
  filtrarContagem: "Filtrar ({n})",
  filtrarColuna: "Filtrar {coluna}",
  tirarFiltroDe: "Tirar filtro de {coluna}",
  valoresContagem: "{n} valores",
  buscarValor: "Buscar valor…",
  nenhumValorCom: 'Nenhum valor com "{busca}".',
  valorVazio: "(Vazio)",
  sim: "Sim",
  nao: "Não",
  semValor: "—",
};

export function fmtTexto(modelo: string, vars: Record<string, string | number>): string {
  return modelo.replace(/\{(\w+)\}/g, (bruto, chave: string) =>
    chave in vars ? String(vars[chave]) : bruto,
  );
}

export function plural(
  n: number,
  um: string,
  muitos: string,
  vars?: Record<string, string | number>,
): string {
  return fmtTexto(n === 1 ? um : muitos, { n, ...(vars ?? {}) });
}
