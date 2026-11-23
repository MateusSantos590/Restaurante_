// Verifica SEO técnico, estrutura, desempenho e rastreamento de conversões.
// Uso: npm start (outro terminal) e depois npm run test:seo
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const { chromium, devices } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL || "http://localhost:8080";
const fails = [];
const check = (ok, msg) => { console.log(`${ok ? "✔" : "✘"} ${msg}`); if (!ok) fails.push(msg); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["Pixel 5"], locale: "pt-BR" });
const page = await ctx.newPage();

/* Observadores de LCP e CLS precisam existir ANTES da página carregar */
await page.addInitScript(() => {
  window.__lcp = 0; window.__cls = 0;
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
});
const requests = [];
page.on("request", r => requests.push(r.url()));
const sizes = [];
page.on("response", async r => { try { const b = await r.body(); sizes.push(b.length); } catch {} });

await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

/* 1. Title e meta description */
const title = await page.title();
const desc = await page.getAttribute("meta[name=description]", "content");
check(title.length >= 30 && title.length <= 60, `title com ${title.length} caracteres (30 a 60): "${title}"`);
check(/São Miguel Paulista/.test(title) && /restaurante/i.test(title), "title cita a intenção de busca (restaurante + bairro)");
check(desc.length >= 70 && desc.length <= 160, `description com ${desc.length} caracteres (70 a 160)`);

/* 2. Estrutura semântica */
const heads = await page.$$eval("h1,h2,h3,h4,h5,h6", hs => hs.map(h => +h.tagName[1]));
check(heads.filter(n => n === 1).length === 1, "exatamente um H1");
let skip = false; for (let i = 1; i < heads.length; i++) if (heads[i] - heads[i - 1] > 1) skip = true;
check(!skip, `sem pulo de nível nos títulos (${heads.join("")})`);
for (const tag of ["header", "nav", "main", "footer", "section", "address"]) check(await page.locator(tag).count() > 0, `usa <${tag}>`);
check(await page.getAttribute("html", "lang") === "pt-BR", 'html lang="pt-BR"');
check(await page.$$eval("img", is => is.every(i => i.hasAttribute("alt") && i.width > 0 && i.height > 0)), "imagens com alt, largura e altura");

/* 3. JSON-LD */
const ld = await page.$$eval('script[type="application/ld+json"]', ss => ss.map(s => s.textContent));
let graph = [];
try { graph = JSON.parse(ld[0])["@graph"]; check(ld.length === 1, "um único bloco JSON-LD válido"); } catch (e) { check(false, "JSON-LD inválido: " + e.message); }
const types = graph.map(g => g["@type"]);
for (const t of ["WebSite", "Restaurant", "FAQPage"]) check(types.includes(t), `JSON-LD tem ${t}`);
const rest = graph.find(g => g["@type"] === "Restaurant") || {};
check(rest.address?.streetAddress && rest.address?.postalCode && rest.telephone && rest.geo?.latitude && rest.openingHoursSpecification?.length, "Restaurant com endereço, telefone, coordenadas e horário");
check(!("priceRange" in rest) && !("acceptsReservations" in rest), "sem dados não confirmados (faixa de preço, reservas)");
const faqQs = (graph.find(g => g["@type"] === "FAQPage")?.mainEntity || []).map(q => q.name);
const visibleFaq = await page.$$eval(".faq summary", ss => ss.map(s => s.textContent.trim()));
check(faqQs.length > 0 && faqQs.every(q => visibleFaq.includes(q)), "perguntas do FAQ no JSON-LD aparecem na página");

/* 4. Canonical e indexação */
const canonical = await page.getAttribute("link[rel=canonical]", "href");
const ogUrl = await page.getAttribute("meta[property='og:url']", "content");
const robotsMeta = await page.getAttribute("meta[name=robots]", "content");
check(canonical === ogUrl && /^https:\/\/.+\/$/.test(canonical), `canonical igual ao og:url e em HTTPS (${canonical})`);
check(/index/.test(robotsMeta) && !/noindex|nofollow/.test(robotsMeta), "meta robots permite indexar");
const robots = await (await page.request.get(BASE + "/robots.txt")).text();
check(/Allow: \//.test(robots) && !/Disallow: \/\s*$/m.test(robots) && /Sitemap: https:\/\//.test(robots), "robots.txt permite rastrear e aponta o sitemap");
const sitemap = await (await page.request.get(BASE + "/sitemap.xml")).text();
check(sitemap.includes(`<loc>${canonical}</loc>`), "sitemap.xml lista a URL canonical");
const xrobots = (await page.request.get(BASE + "/")).headers()["x-robots-tag"] || "";
check(!/noindex/.test(xrobots), "cabeçalho X-Robots-Tag não bloqueia");
const notFound = await (await page.request.get(BASE + "/nao-existe")).text();
check(/noindex/.test(notFound), "página 404 com noindex");

/* 5. Desempenho e estabilidade */
const lcp = await page.evaluate(() => Math.round(window.__lcp));
const cls = await page.evaluate(() => +window.__cls.toFixed(3));
const kb = Math.round(sizes.reduce((a, b) => a + b, 0) / 1024);
const external = requests.filter(u => !u.startsWith(BASE) && !u.startsWith("data:"));
check(lcp > 0 && lcp < 2500, `LCP ${lcp} ms (meta: abaixo de 2500)`);
check(cls < 0.1, `CLS ${cls} (meta: abaixo de 0,1)`);
check(kb < 400, `página inteira com ${kb} KB (meta: abaixo de 400)`);
check(external.length === 0, `nenhuma requisição a terceiros (${external.length})`);
check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "sem rolagem horizontal no celular");
const small = await page.$$eval("a.btn, button.btn, .tab, .nav-toggle", els => els.filter(e => e.offsetParent && (e.getBoundingClientRect().height < 44)).length);
check(small === 0, "botões com no mínimo 44px de altura (toque)");

/* 6. Rastreamento de conversões */
await page.evaluate(() => { window.__ev = []; document.addEventListener("hr:track", e => window.__ev.push(e.detail.event)); });
// impede abrir sites externos nos cliques de teste
await page.evaluate(() => document.addEventListener("click", e => { if (e.target.closest("a[target=_blank], a[href^='tel:']")) e.preventDefault(); }));
const clicks = [
  ["whatsapp_click", ".hero-actions a[data-wa]"],
  ["directions_click", ".location-actions a[href*='/maps/dir/']"],
  ["maps_profile_click", ".reviews a"],
  ["phone_click", ".location-actions a[href^='tel:']"],
  ["share_click", "[data-share]"],
];
for (const [ev, sel] of clicks) {
  await page.locator(sel).first().scrollIntoViewIfNeeded();
  await page.locator(sel).first().dispatchEvent("click"); // dispara no próprio elemento, sem depender de o botão flutuante cobrir
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.locator("#tab-cafe").dispatchEvent("click");
await page.focus("#f-nome");
await page.waitForTimeout(2600);
await page.fill("#f-nome", "Maria Souza"); await page.selectOption("#f-tipo", "Reserva de mesa"); await page.fill("#f-qtd", "4");
await page.fill("#f-data", new Date(Date.now() + 864e5).toISOString().slice(0, 10));
await ctx.route(/wa\.me|whatsapp\.com/, r => r.fulfill({ body: "ok" }));
await page.click("[data-order-form] button[type=submit]");
await page.waitForTimeout(500);
const got = await page.evaluate(() => window.__ev);
for (const ev of ["whatsapp_click", "directions_click", "maps_profile_click", "phone_click", "share_click", "menu_tab_view", "form_start", "generate_lead"]) {
  check(got.includes(ev), `evento "${ev}" registrado`);
}
check(await page.evaluate(() => Array.isArray(window.dataLayer) && window.dataLayer.some(d => d.event === "generate_lead")), "dataLayer recebe os eventos (compatível com Tag Manager)");

await browser.close();
console.log(fails.length ? `\n${fails.length} falha(s).` : "\nTudo certo.");
process.exit(fails.length ? 1 : 0);
