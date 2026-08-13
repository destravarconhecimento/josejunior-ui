/**
 * CATÁLOGO DE VENDA — o view-model dos SEGMENTOS que se manda pro cliente.
 *
 * Existe porque a MESMA lista aparece em dois painéis: o do representante
 * (`/painel/catalogo`) e o do sistema (Comercial → Segmentos → aba "Catálogo"),
 * onde trabalha quem vende direto com o José. Enquanto cada app montava a sua,
 * segmento novo (petshop, restaurante) nascia num e sumia no outro.
 *
 * Vocabulário (custou briga): **segmento** é o que se vende — tem página no ar,
 * endereço próprio e roteiro. **Demo** é outra coisa: o protótipo gerado PARA UMA
 * EMPRESA a partir de um lead. Aqui só há segmento.
 *
 * As regras do link ficam AQUI, num lugar só:
 *  - **com domínio próprio** (representante) → `<segmento>.<domínio dele>`; a
 *    atribuição vem do host, sem `?rep=` na URL;
 *  - **sem domínio** → o host do segmento na plataforma, com `?rep=<slug>`
 *    quando há representante (no sistema não há: o link sai cru).
 *
 * Puro de propósito (sem JSX, sem `use client`): a página server monta os itens
 * e só entrega prontos ao componente.
 */

/** Um segmento como o sistema publica (`GET /api/marketing/vertical`). */
export type CatalogoVertical = {
  slug: string;
  name: string;
  badge: string;
  subtitle: string;
  /** Endereço público do segmento (`logistica.josejunior.dev`). */
  host?: string;
  /** Rótulo do segmento no host (`logistica`) — vira `<sub>.<domínio do rep>`. */
  sub?: string;
  /** Módulos do pacote entregues na hora (rótulos humanos). */
  modulos?: string[];
};

/** Segmento com a página já no ar nas quatro línguas + roteiro de apresentação. */
export type CatalogoSegmentoPronto = {
  /** Rótulo do host (`petshop`) — casa com o `sub` da vertical quando ela existe. */
  sub: string;
  /** Id do roteiro (`/apresentar/<roteiro>`). */
  roteiro: string;
  nome: string;
  cor: string;
  resumo: string;
};

/** Um idioma em que a página abre (o rótulo é o que o cliente vê no seletor). */
export type CatalogoIdioma = { code: string; label: string };

/** Um card do catálogo — o segmento com o SEU link. */
export type CatalogoItem = {
  id: string;
  nome: string;
  badge: string;
  subtitle: string;
  modulos: string[];
  link: string;
  cor?: string;
  idiomas?: { code: string; label: string; url: string }[];
  apresentacao?: string;
};

/**
 * Monta a lista ÚNICA: cada segmento com o seu endereço; os que já têm a página
 * no ar ganham as quatro línguas e o roteiro de apresentação. Segmento pronto que
 * ainda não tem linha em `marketing_verticais` entra na mesma lista, na frente —
 * pra quem vende não existe essa diferença.
 */
export function montarCatalogo({
  verticais,
  prontos,
  idiomas,
  rootDomain,
  repSlug = "",
  customDomain = "",
}: {
  verticais: CatalogoVertical[];
  prontos: CatalogoSegmentoPronto[];
  idiomas: CatalogoIdioma[];
  /** Domínio raiz da plataforma (`josejunior.dev`). */
  rootDomain: string;
  /** Slug do representante — vazio no sistema (link sem atribuição). */
  repSlug?: string;
  /** Domínio próprio do representante (sem `www.`). Vazio = domínio da plataforma. */
  customDomain?: string;
}): CatalogoItem[] {
  const web = `https://${rootDomain}`;
  const q = repSlug ? `?rep=${encodeURIComponent(repSlug)}` : "";
  /** Endereço do segmento: na marca do rep quando tem domínio, senão no do José. */
  const raizDe = (sub: string, host?: string) =>
    customDomain ? `https://${sub}.${customDomain}` : `https://${host || `${sub}.${rootDomain}`}`;
  /** Sem domínio próprio a atribuição vai na query (no sistema, `q` é vazio). */
  const comRep = (url: string) => (customDomain ? url : `${url}${q}`);
  /** Roteiro de apresentação: no domínio do rep quando tem, senão no do José. */
  const apresentacaoDe = (s: CatalogoSegmentoPronto) =>
    customDomain ? `https://${s.sub}.${customDomain}/apresentacao` : `${web}/apresentar/${s.roteiro}${q}`;
  const idiomasDe = (raiz: string) =>
    idiomas.map((i) => ({
      code: i.code,
      label: i.label,
      url: comRep(i.code === "pt" ? raiz : `${raiz}/${i.code}`),
    }));

  const porSub = new Map(prontos.map((s) => [s.sub, s]));
  const usados = new Set<string>();

  const itens: CatalogoItem[] = verticais.map((v) => {
    const sub = v.sub || v.host?.split(".")[0] || v.slug;
    const pronto = porSub.get(sub);
    if (pronto) usados.add(pronto.sub);
    const raiz = raizDe(sub, v.host);
    return {
      id: v.slug,
      nome: pronto?.nome || v.name,
      badge: v.badge,
      subtitle: pronto?.resumo || v.subtitle,
      modulos: v.modulos || [],
      link: comRep(raiz),
      cor: pronto?.cor,
      idiomas: pronto ? idiomasDe(raiz) : undefined,
      apresentacao: pronto ? apresentacaoDe(pronto) : undefined,
    };
  });

  const soltos: CatalogoItem[] = prontos
    .filter((s) => !usados.has(s.sub))
    .map((s) => {
      const raiz = raizDe(s.sub, `${s.sub}.${rootDomain}`);
      return {
        id: s.sub,
        nome: s.nome,
        badge: "Página pronta nas 4 línguas",
        subtitle: s.resumo,
        modulos: [],
        link: comRep(raiz),
        cor: s.cor,
        idiomas: idiomasDe(raiz),
        apresentacao: apresentacaoDe(s),
      };
    });

  return [...soltos, ...itens];
}

/** Os dois endereços do material de vendas (o que ensina a apresentar). */
export function linksDoMaterial(rootDomain: string, repSlug = ""): { material: string; materialLinks: string } {
  const web = `https://${rootDomain}`;
  const q = repSlug ? `?rep=${encodeURIComponent(repSlug)}` : "";
  return { material: `${web}/apresentar${q}`, materialLinks: `${web}/apresentar/links${q}` };
}

/** "a, b e c" — lista em português, sem vírgula antes do "e". */
function listar(xs: string[]): string {
  const l = xs.filter(Boolean);
  if (l.length <= 1) return l[0] ?? "";
  return `${l.slice(0, -1).join(", ")} e ${l[l.length - 1]}`;
}

/** "Petshop (banho, tosa e loja)" → "Petshop": numa lista corrida o parêntese atrapalha. */
function nomeCurto(nome: string): string {
  return nome.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

/** O que a mensagem precisa saber do representante. */
export type MensagemAtivacaoInput = {
  /** Como você o chama (primeiro nome). */
  primeiroNome: string;
  slug: string;
  rootDomain: string;
  /** Domínio próprio, se tiver (sem `www.`) — muda o painel e os links. */
  customDomain?: string;
  email?: string;
  /** Já criou senha? Muda o parágrafo do acesso (o e-mail de senha não sai sozinho). */
  temSenha?: boolean;
  /** Os cards do catálogo DELE (saída de `montarCatalogo` com o slug/domínio dele). */
  itens: CatalogoItem[];
  /** `linksDoMaterial(rootDomain, slug).material`. */
  material: string;
};

/**
 * Texto pronto pra mandar ao representante quando o painel dele entra no ar:
 * onde entrar, como criar a senha, o que tem lá dentro e o link do material que
 * ensina a apresentar. Sai dos MESMOS dados dos cards, então nunca cita segmento
 * que não existe nem link que não bate com o do painel — o José escrevia isso à
 * mão, um por um, e a lista envelhecia a cada segmento novo.
 *
 * Texto puro (sem markdown): vai por WhatsApp ou e-mail.
 */
export function mensagemDeAtivacao({
  primeiroNome,
  slug,
  rootDomain,
  customDomain = "",
  email = "",
  temSenha = false,
  itens,
  material,
}: MensagemAtivacaoInput): string {
  const painel = `https://${customDomain || `${slug}.${rootDomain}`}/painel`;
  const nome = primeiroNome.trim() || "Olá";
  // Com domínio próprio, o material também é na marca dele: `apresentacao.<domínio>`
  // resolve o representante pelo HOST, então nem precisa do `?rep=` no fim.
  const roteiro = customDomain ? `https://apresentacao.${customDomain}` : material;

  // Exemplo de link = os que já têm página no ar (com as línguas); se não houver,
  // qualquer segmento serve pra mostrar o formato.
  const comPagina = itens.filter((i) => i.idiomas?.length);
  const exemplos = (comPagina.length ? comPagina : itens)
    .slice(0, 2)
    .map((i) => i.link.replace(/^https?:\/\//, ""));
  const linguas = listar((comPagina[0]?.idiomas ?? []).map((i) => i.label));
  const lista = listar(itens.map((i) => nomeCurto(i.nome)));

  const acesso = temSenha
    ? `Você entra com o seu e-mail${email ? ` (${email})` : ""} e a senha que já criou. Esqueceu? Me avisa que eu mando o link pra criar outra.`
    : email
      ? `Mandei no seu e-mail (${email}) o link pra você criar a sua senha — é só clicar, escolher a senha e entrar. O link vale 48h; se já tiver expirado, me avisa que eu disparo outro.`
      : `Me confirma o seu melhor e-mail que eu mando o link pra você criar a sua senha.`;

  const links = exemplos.length
    ? `Cada um já tem o SEU link${customDomain ? ", na sua marca" : ""}: ${exemplos.join(" e ")}${
        linguas ? ` — e abrem em ${linguas} no mesmo endereço, o cliente troca a língua no topo` : ""
      }. ${
        customDomain
          ? "Todo cliente que chegar por esses links entra atribuído a você."
          : "Copie sempre do painel: é o ?rep= no fim do link que faz o cliente entrar atribuído a você."
      }`
    : "";

  return [
    `${nome}, seu painel de representante está no ar: ${painel}`,
    acesso,
    lista
      ? `Entrando, vá direto na aba "Segmentos & Catálogo". Lá estão TODOS os segmentos que já entregamos prontos — site + sistema no ar, não é promessa: ${lista}. Você pode levar qualquer um pro seu cliente.`
      : `Entrando, vá direto na aba "Segmentos & Catálogo": é de lá que você copia o que manda pro cliente.`,
    links,
    "No painel você ainda tem os seus leads e o funil, o atendimento (WhatsApp e e-mail), as campanhas e o seu site pra editar.",
    `E aqui é a página que te ensina a apresentar (o roteiro do que falar em cada tela + mensagens prontas pra copiar):\n${roteiro}`,
    "Dá uma olhada e me diz qual cliente você ataca essa semana.",
  ]
    .filter(Boolean)
    .join("\n\n");
}
