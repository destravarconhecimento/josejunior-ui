import { Box } from "@chakra-ui/react";

/**
 * Visualizador do corpo de um e-mail. Componente ÚNICO usado no cliente de
 * e-mail do SISTEMA e dos TENANTS — corrige num lugar, vale nos dois.
 *
 * Renderiza o HTML num `<iframe>` isolado: scripts DESLIGADOS (segurança) e
 * `<base target="_blank">` + `allow-popups` para que os links abram em NOVA ABA
 * (antes, com `sandbox=""`, clicar num link dava erro). Sem HTML, mostra o texto.
 */
export function EmailHtmlView({
  html,
  text,
  minHeight = 320,
}: {
  html?: string | null;
  text?: string | null;
  minHeight?: number;
}) {
  if (html) {
    return (
      <iframe
        title="conteúdo do e-mail"
        sandbox="allow-popups allow-popups-to-escape-sandbox"
        srcDoc={`<base target="_blank"><meta charset="utf-8">${html}`}
        style={{ width: "100%", minHeight, border: "none", background: "white", borderRadius: 8 }}
      />
    );
  }
  return (
    <Box p={2} whiteSpace="pre-wrap" fontSize="sm">
      {text || "(sem conteúdo)"}
    </Box>
  );
}
