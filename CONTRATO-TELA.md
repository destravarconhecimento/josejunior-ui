# Contrato de tela — `@josejunior/ui`

Este arquivo é a doc do desenho das telas logadas. Ele existe porque o código do
pacote não leva comentário narrativo: o *porquê* mora aqui, o *o quê* mora no
código.

Vale para **josejunior** (`apps/site`, `apps/sistema`, `apps/representantes`) e
para **8899br**. Os dois consomem o mesmo pacote; qualquer tela que invente um
topo próprio está fora do contrato, mesmo que fique bonita.

---

## 1. A ordem é fixa

Toda tela logada tem a mesma pilha, sempre nesta ordem:

```
┌──────────────────────────────────────────────────────┐
│ Título (contador)                   [ações · + Novo] │  ← PageHeader
│ subtítulo                                            │
│ [ aba ][ aba ][ aba ]                                │
│ ▪ kpi  ▪ kpi  ▪ kpi  ▪ kpi                           │
├──────────────────────────────────────────────────────┤
│ blocos próprios da tela (raro)                       │  ← PageBody
│ ┌──────────────────────────────────────────────────┐ │
│ │ 🔍 buscar…            [filtros]                  │ │  ← DataTable
│ ├──────────────────────────────────────────────────┤ │
│ │ cabeçalho da tabela                              │ │
│ │ linhas…                                          │ │
│ └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

O que decorre disso, e não é negociável:

- **A busca não fica no cabeçalho da página.** Ela pertence à tabela, porque o
  que ela filtra é a tabela. A `DataTable` recebe `busca` / `filtrosDaTela` e
  desenha a barra colada no topo do card, grudando junto com o `thead`. A prop
  `filters` do `Screen`/`PageHeader` é **legada** — existe só para as telas que
  ainda não migraram, e o docblock antigo que mandava pôr filtro no header
  estava errado.
- **KPI em tela de lista é faixa, não grade.** Uma `KpiRow` por tela, ~40 px,
  no slot `kpis`. Grade de `KpiCard` é coisa de dashboard, onde o indicador *é*
  a tela. KPI solto no corpo é regressão.
- **Um jeito de fazer aba: `Tabs`.** Horizontal, vertical (sidebar sticky) e
  dropdown no mobile, com `useTransition` já embutido. `PanelTabs` sobrevive só
  na exceção declarada do editor de landing (`apps/site/CLAUDE.md` §5).
  `PageTabs` foi removido do pacote (tinha zero uso).
- **O botão "Novo" vive no `actions`**, à direita do título. Nunca no meio do
  corpo, nunca em cima da tabela.
- **`blocos` é a exceção medida, não a válvula de escape.** Das 41 telas que
  tinham algo entre o cabeçalho e a lista, 33 eram lista montada à mão (viram
  tabela) e só 8 eram bloco genuíno: hero da home, wizard de importação,
  kanban, editor de landing, chat. Se o seu "bloco" é uma lista de itens com
  colunas, ele não é um bloco — é uma `DataTable` que você ainda não escreveu.

## 2. Qual componente usar

| A tela é… | Use |
|---|---|
| uma lista (a maioria) | **`TelaDeLista`** |
| um conjunto de painéis num menu lateral | **`TelaDeAbas`** |
| não é nenhum dos dois (dashboard, editor, chat, wizard) | **`Screen`** |
| composição fora do padrão (workspace de 2 painéis) | `PageHeader` + `PageBody` |

`TelaDeLista` monta header + abas + KPIs + `DataTable` a partir de props. O
`page.tsx` carrega e serializa; o wrapper fino liga as actions; a moldura é do
pacote. Ele **não aceita filho solto** entre o cabeçalho e a tabela — quem
precisa disso passa `blocos`, e quem precisa de mais do que `blocos` não é uma
tela de lista.

A busca do `TelaDeLista` é client-side: `buscar` recebe a lista de campos
(`["nome", "email"]`) ou uma função que extrai o texto da linha. A comparação
normaliza acento e caixa. Lista grande que filtra no servidor não usa `buscar`
— usa `Screen` + `DataTable` com a `busca` controlada pela tela.

`acaoNova` com `href` renderiza um `<a>` cru, sem navegação client-side do
Next. Para link de rota com prefetch, passe o seu `<Link>` em `acoes`.

## 3. As armadilhas de CSS (o que custou tempo)

### Sticky morre com `overflow` de ancestral

`position: sticky` só enxerga o **scrollport mais próximo**. Qualquer ancestral
com `overflow: auto | scroll | hidden` vira um scrollport e o sticky passa a
grudar *nele*, não na janela — visualmente, ele simplesmente não gruda. Por isso
o card da tabela usa **`overflow: clip`**, que recorta sem criar scrollport.

**Nunca embrulhe uma tabela em `<Box overflowX="auto">`.** Foi essa a causa do
"sticky que não sobe quando rolo".

### Quem rola é a página

A `DataTable` desenha as linhas em altura natural, sem scroll próprio. O que
gruda na janela é a toolbar, o `thead` e o rodapé, com o offset vindo de
`--admin-sticky-top` / `--admin-sticky-bottom`, publicados pelos shells. Isso
acabou com o scroll-dentro-de-scroll que espremia a lista em tela pequena.

Tabela larga **não** ganha scroll horizontal: ganha o botão **expandir** (tela
cheia). `expansivel={false}` tira o botão.

### `fill`, `--admin-content-h` e o escape por `:has()`

`Screen fill` trava a altura em `var(--admin-content-h, calc(100dvh - 132px))`
para o conteúdo (chat, kanban) rolar por dentro. O `132px` é o fallback de
quando o shell ainda não publicou a variável.

A armadilha: `maxH` **não** é intercambiável com `flex-basis: 0%`. Trocar um
pelo outro faz o filho esticar além do teto em Chromium, porque o flex item
volta a usar a altura de conteúdo como base.

Como o modo página da tabela quer que quem role seja a janela, `fill` e tabela
são incompatíveis. Em vez de mandar 40 telas mudarem, o `Screen` **desarma o
próprio teto** quando descobre uma tabela de página dentro:

```css
&:has([data-jj-table="pagina"]) { height: auto; max-height: none; flex: none; }
```

O `data-jj-table="pagina"` é o marcador que a `DataTable` publica no modo
página. Nenhum call-site precisou mudar.

### `fillHeight={<número>}` é proibido

Era o offset chutado do legado (`calc(100vh - Npx)`), que quebrava em toda tela
com altura de shell diferente. `true` (padrão) = modo página; `false` = mini
embutida, sem sticky e sem expandir, com teto opcional por `alturaMax` — e
`alturaMax` é altura de bloco (`"14rem"`), nunca conta de viewport. O guardrail
reprova número novo.

### `description` é alias legado de `subtitle`

O `PageHeader` aceita os dois e `subtitle` vence. Manter os dois já causou 13
telas com o texto invisível (passavam `description` numa versão que só lia
`subtitle`). Em tela nova, use `subtitle`.

## 4. Como validar

```bash
npx turbo run typecheck               # validação primária
npm run verificar                     # os 4 guardrails (é o que o CI roda)
node scripts/check-topo-tela.mjs      # só o topo da tela
```

O `check-topo-tela` é uma **régua que só encolhe**: ele carrega uma lista
congelada da dívida que existia no dia em que nasceu (93 itens) e reprova os
dois lados — violação nova reprova, e item da lista que você consertou sem
apagar da lista **também** reprova. Migrou uma tela? apague a linha dela do
`DIVIDA` no mesmo commit. `--congelar` reimprime a lista (só para recongelar
depois de uma mudança de regra, nunca para esconder violação nova).

⚠️ O ESLint do josejunior está quebrado (circular `@eslint/eslintrc`) — valide
com typecheck + `next build`, nunca com lint. No 8899br o lint funciona
(`npm run verificar`), e o `src/lib/ui-padrao.test.ts` é quem cobra o padrão.
