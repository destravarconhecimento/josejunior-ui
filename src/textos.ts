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
  tabelaTelaCheia: string;
  telaCheiaDe: string;
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
  // Fora da tabela: peças de formulário e de lista que também falam.
  buscar: string;
  copiar: string;
  copiado: string;
  revelar: string;
  ocultar: string;
  mostrar: string;
  moverAcima: string;
  moverAbaixo: string;
  adicionar: string;
  remover: string;
  salvar: string;
  salvo: string;
  cancelar: string;
  corPadrao: string;
  restaurarPadrao: string;
  fechar: string;
  confirmar: string;
  naoPodeDesfazer: string;
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
  tabelaTelaCheia: "Tabela em tela cheia",
  telaCheiaDe: "{titulo} em tela cheia",
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
  buscar: "Buscar",
  copiar: "Copiar",
  copiado: "Copiado",
  revelar: "Revelar",
  ocultar: "Ocultar",
  mostrar: "Mostrar",
  moverAcima: "Mover para cima",
  moverAbaixo: "Mover para baixo",
  adicionar: "Adicionar",
  remover: "Remover",
  salvar: "Salvar",
  salvo: "Salvo",
  cancelar: "Cancelar",
  corPadrao: "Cor padrão",
  restaurarPadrao: "Restaurar padrão",
  fechar: "Fechar",
  confirmar: "Confirmar",
  naoPodeDesfazer: "Isto não pode ser desfeito.",
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
