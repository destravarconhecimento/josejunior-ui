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
