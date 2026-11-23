# Hora do Rango Restaurante — site oficial

Landing page do **Hora do Rango Restaurante** (R. Daniel Bernardo, 180 — São Miguel Paulista, São Paulo/SP).

- Site estático em HTML, CSS e JavaScript puros: sem framework, sem build, sem dependências em produção.
- Carrega rápido em 4G, funciona sem JavaScript (o conteúdo continua visível) e é seguro por padrão.
- Objetivo principal da página: **levar o visitante a pedir pelo WhatsApp** ou ir até o restaurante.

---

## ⚠️ Antes de publicar: dados a confirmar

Eu (Claude) encontrei pelo link do Google Maps só o **nome** e o **endereço**. O restante é
conteúdo de exemplo, marcado com `EDITAR` no código. Procure por `EDITAR` e troque:

| O quê | Onde |
|---|---|
| Número do WhatsApp (`5511965666268`) | `public/js/main.js` (CONFIG), `public/index.html` (links `wa.me`, `tel:`, rodapé e JSON-LD) |
| Horário de funcionamento | `public/js/main.js` (CONFIG.hours), tabela em `index.html` e JSON-LD |
| Cardápio e preços | `public/index.html`, seção `#cardapio` |
| Texto "Sobre a casa" | `public/index.html`, seção `#sobre` |
| Domínio (`horadorango.com.br`) | `index.html` (canonical, og:url, og:image, JSON-LD), `sitemap.xml`, `robots.txt`, `security.txt`, `politica-de-privacidade.html` |
| E-mails de contato e segurança | `politica-de-privacidade.html`, `.well-known/security.txt`, `SECURITY.md` |
| Razão social / CNPJ (recomendado) | `politica-de-privacidade.html` |

Dica: `grep -rn "EDITAR\|900000000\|horadorango.com.br" public`

---

## Estrutura do projeto

```
.
├── public/                      ← tudo que vai para o ar (raiz do site)
│   ├── index.html               ← a landing page
│   ├── politica-de-privacidade.html
│   ├── 404.html
│   ├── css/styles.css           ← tokens de design + estilos (mobile-first)
│   ├── js/main.js               ← interações + CONFIG (WhatsApp, horários)
│   ├── img/                     ← favicon, ícones e imagem de compartilhamento
│   ├── _headers                 ← cabeçalhos de segurança (Netlify / Cloudflare Pages)
│   ├── .htaccess                ← mesmos cabeçalhos para Apache (Hostinger etc.)
│   ├── .well-known/security.txt ← contato para pesquisadores de segurança
│   ├── robots.txt, sitemap.xml, site.webmanifest
├── vercel.json                  ← cabeçalhos para Vercel
├── netlify.toml                 ← diz ao Netlify que a raiz é /public
├── scripts/serve.mjs            ← servidor local que aplica os cabeçalhos de produção
├── scripts/gen-images.mjs       ← gera og-image.png e ícones
├── tests/smoke.mjs              ← teste automatizado no navegador
├── .github/workflows/ci.yml     ← roda o teste a cada push
└── SECURITY.md                  ← modelo de ameaças e checklist de segurança
```

### Seções da página (ordem pensada para conversão)
1. **Hero**: promessa + botão de WhatsApp + status "aberto agora/fechado" calculado no fuso de São Paulo + prato do dia.
2. **Diferenciais**: 3 motivos para escolher a casa.
3. **Cardápio**: abas acessíveis por teclado; o prato do dia é destacado automaticamente.
4. **Sobre**: história e números.
5. **Como pedir**: 3 passos.
6. **Avaliações**: leva às avaliações reais do Google (não inventamos depoimentos).
7. **Encomendas**: formulário que monta a mensagem e abre o WhatsApp (sem servidor).
8. **Localização**: endereço, horários com o dia atual destacado, "Como chegar" e mapa sob demanda.
9. **CTA final** e **rodapé**. No celular, botão flutuante de WhatsApp.

### SEO local
- `<title>` e `description` com bairro e cidade.
- Dados estruturados `schema.org/Restaurant` (endereço, horário, cardápio, mapa).
- Open Graph com imagem 1200×630 (fica bonito ao compartilhar no WhatsApp).
- `sitemap.xml` e `robots.txt`.
- **O que mais pesa para restaurante de bairro**: manter o Perfil da Empresa no Google atualizado
  (fotos, horário, link para este site) e responder avaliações.

### Acessibilidade
Contraste mínimo 4,5:1, foco visível, link "Pular para o conteúdo", alvos de toque ≥ 44px,
rótulos visíveis no formulário com erro junto ao campo, abas no padrão WAI-ARIA, e respeito a
`prefers-reduced-motion`.

---

## Rodar no seu computador

Precisa de Node.js 18+.

```bash
npm start            # http://localhost:8080 (com os mesmos cabeçalhos de segurança de produção)
npm test             # em outro terminal; requer Playwright: npm i -D playwright && npx playwright install chromium
```

## Publicar (escolha uma)

| Opção | Custo | Como |
|---|---|---|
| **Cloudflare Pages** (recomendado) | grátis | Conecte o repositório, "Build output directory" = `public`, sem comando de build. `_headers` é aplicado sozinho. |
| Netlify | grátis | Conecte o repositório; `netlify.toml` já aponta para `public`. |
| Vercel | grátis | Importe o repositório; `vercel.json` já configura tudo. |
| Hospedagem Apache (Hostinger, Locaweb…) | pago | Envie o **conteúdo** de `public/` (incluindo `.htaccess` e `.well-known`) para `public_html`. |

Depois: aponte o domínio (Registro.br), ative HTTPS, e confira em https://securityheaders.com.

## Atualizar CSS/JS
Os arquivos ficam em cache por 7 dias. Ao mudar `styles.css` ou `main.js`, aumente a versão
no `index.html` (`?v=1` → `?v=2`) para todo mundo receber a versão nova na hora.
