# Casa de Carne RB — site

Landing page do açougue **Casa de Carne RB** (R. Manuel Lemes da Silva, 426, Jardim das Oliveiras, São Paulo/SP).
Mesma base técnica do site do restaurante (HTML, CSS e JS puros, sem dependências), com identidade, layout e estratégia próprios.

## Dados usados
| Dado | Origem |
|---|---|
| Nome, endereço, CEP, telefone (11) 2566-5264 | Google Maps (print enviado) |
| Horário: seg a sáb 8h às 20h, dom 8h às 14h | Google Maps (print enviado) |
| Coordenadas e link oficial da ficha (`maps?cid=...`) | Google Maps |

## Antes de publicar: confirmar com o cliente
Procure por `EDITAR` no código.
- **WhatsApp**: em `public/js/main.js`, campo `whatsapp`. Enquanto estiver vazio, todos os botões de pedido **ligam** para (11) 2566-5264. Preenchido, viram WhatsApp com mensagem pronta (inclusive "Preço de hoje" de cada corte e a lista da calculadora).
- **Cortes vendidos**: a lista em `#cortes` é a de um açougue comum. Ajuste ao que a loja tem.
- **Entrega e formas de pagamento** (hoje o site diz que entrega "a gente confirma no atendimento").
- **CNPJ e e-mail** na política de privacidade e em `.well-known/security.txt`.
- **Domínio**: `node scripts/set-domain.mjs https://www.dominio.com.br casa-de-carne-rb/public`.

O site **não mostra preços** de propósito: preço de carne muda toda semana e preço errado no site vira problema no balcão. Cada corte tem o botão "Preço de hoje".

## Estrutura
```
casa-de-carne-rb/
├── public/                    ← raiz do site (é isso que vai para o ar)
│   ├── index.html, 404.html, politica-de-privacidade.html
│   ├── css/styles.css         ← tokens: carvão, vermelho açougue, kraft
│   ├── js/main.js             ← CONFIG (WhatsApp, horários, regra do churrasco)
│   ├── js/analytics.js        ← eventos de conversão + GA4 opcional com consentimento
│   ├── fonts/archivo.woff2    ← fonte variável (largura e peso), hospedada no site
│   ├── img/                   ← favicon, ícones, og-image
│   ├── _headers, .htaccess    ← cabeçalhos de segurança (Cloudflare/Netlify e Apache)
│   └── robots.txt, sitemap.xml, site.webmanifest, .well-known/security.txt
├── tests/site.mjs             ← teste completo (layout, SEO, calculadora, eventos, segurança)
├── scripts-gen-images.mjs     ← gera og-image e ícones
└── docs/MARKETING.md          ← plano de marketing local
```

## Rodar e testar
```bash
node scripts/serve.mjs casa-de-carne-rb/public          # http://localhost:8080
BASE_URL=http://localhost:8080 node casa-de-carne-rb/tests/site.mjs
BASE_URL=http://localhost:8080 THROTTLE=4 node tests/fps.mjs
```

## Publicar no Cloudflare Pages
Crie um **projeto separado** do restaurante, conectado ao mesmo repositório:
- Production branch: `main`
- Build command: vazio
- Build output directory: `casa-de-carne-rb/public`

## Eventos de conversão
`phone_click`, `whatsapp_click`, `price_request_click` (com o corte), `directions_click`, `maps_profile_click`, `cut_tab_view`, `bbq_calc_used` e `generate_lead` (lista da calculadora enviada). Para medir no GA4, siga `docs/MARKETING.md`.
