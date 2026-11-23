// Teste completo do site do açougue: layout, SEO, desempenho, calculadora,
// rastreamento de conversões e cabeçalhos de segurança.
// Uso: node scripts/serve.mjs casa-de-carne-rb/public   (outro terminal, porta 8080)
//      BASE_URL=http://localhost:8080 node casa-de-carne-rb/tests/site.mjs
import { createRequire } from "node:module";
const { chromium, devices } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL || "http://localhost:8080";
const fails = [];
const check = (ok, msg) => { console.log(`${ok ? "✔" : "✘"} ${msg}`); if (!ok) fails.push(msg); };
const browser = await chromium.launch();

/* ---------- Layout em 3 larguras ---------- */
for (const width of [375, 768, 1280]) {
  const p = await browser.newPage({ viewport: { width, height: 900 } });
  const errs = []; p.on("console", m => m.type() === "error" && errs.push(m.text())); p.on("pageerror", e => errs.push(e.message));
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px: sem rolagem horizontal`);
  check(await p.locator(".hero-actions .btn-primary").isVisible(), `${width}px: botão de pedido visível sem rolar`);
  check(errs.length === 0, `${width}px: console sem erros ${errs.length ? JSON.stringify(errs) : ""}`);
  await p.close();
}

/* ---------- SEO, estrutura e desempenho (celular) ---------- */
const ctx = await browser.newContext({ ...devices["Pixel 5"], locale: "pt-BR" });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__lcp = 0; window.__cls = 0;
  new PerformanceObserver(l => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
});
const reqs = []; page.on("request", r => reqs.push(r.url()));
const sizes = []; page.on("response", async r => { try { sizes.push((await r.body()).length); } catch {} });
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.evaluate(() => { window.__ev = []; document.addEventListener("hr:track", e => window.__ev.push(e.detail.event)); });

const title = await page.title(), desc = await page.getAttribute("meta[name=description]", "content");
check(title.length >= 30 && title.length <= 60 && /Açougue/.test(title) && /Jardim das Oliveiras/.test(title), `title (${title.length}): "${title}"`);
check(desc.length >= 70 && desc.length <= 160, `description com ${desc.length} caracteres`);
const heads = await page.$$eval("h1,h2,h3,h4", hs => hs.map(h => +h.tagName[1]));
check(heads.filter(n => n === 1).length === 1, "exatamente um H1");
check(heads.every((n, i) => i === 0 || n - heads[i - 1] <= 1), `títulos sem pular nível (${heads.join("")})`);
for (const tag of ["header", "nav", "main", "footer", "address"]) check(await page.locator(tag).count() > 0, `usa <${tag}>`);

const ld = await page.$$eval('script[type="application/ld+json"]', s => s.map(x => x.textContent));
const graph = JSON.parse(ld[0])["@graph"];
const shop = graph.find(g => g["@type"] === "ButcherShop") || {};
check(ld.length === 1 && ["WebSite", "ButcherShop", "FAQPage"].every(t => graph.some(g => g["@type"] === t)), "JSON-LD com WebSite, ButcherShop e FAQPage");
check(shop.telephone && shop.geo?.latitude && shop.address?.postalCode === "08122-140" && shop.openingHoursSpecification?.length === 2, "ButcherShop com telefone, coordenadas, CEP e horários");
const faqLd = graph.find(g => g["@type"] === "FAQPage").mainEntity.map(q => q.name);
const faqVis = await page.$$eval(".faq summary", s => s.map(x => x.textContent.trim()));
check(JSON.stringify(faqLd) === JSON.stringify(faqVis), "FAQ do JSON-LD idêntico ao da página");

const canonical = await page.getAttribute("link[rel=canonical]", "href");
check(canonical === await page.getAttribute("meta[property='og:url']", "content"), "canonical igual ao og:url");
check(!/noindex/.test(await page.getAttribute("meta[name=robots]", "content")), "meta robots permite indexar");
const robots = await (await page.request.get(BASE + "/robots.txt")).text();
const sitemap = await (await page.request.get(BASE + "/sitemap.xml")).text();
check(/Allow: \//.test(robots) && robots.includes("Sitemap:") && sitemap.includes(`<loc>${canonical}</loc>`), "robots.txt e sitemap.xml coerentes com o canonical");

const lcp = await page.evaluate(() => Math.round(window.__lcp)), cls = await page.evaluate(() => +window.__cls.toFixed(3));
const kb = Math.round(sizes.reduce((a, b) => a + b, 0) / 1024);
check(lcp > 0 && lcp < 2500, `LCP ${lcp} ms`);
check(cls < 0.1, `CLS ${cls}`);
check(kb < 400, `peso total ${kb} KB`);
check(reqs.every(u => u.startsWith(BASE) || u.startsWith("data:")), "nenhuma requisição a terceiros");
check(await page.$$eval("a.btn, button.btn, .tab, .chip span, .price-link", els => els.filter(e => e.offsetParent && e.getBoundingClientRect().height < 44).length) === 0, "alvos de toque com 44px ou mais");

/* ---------- Calculadora ---------- */
check(await page.textContent("[data-calc-total]") === "4,4", "calculadora: 10 adultos + 2 crianças = 4,4 kg");
await page.fill("#c-adultos", "20"); await page.fill("#c-criancas", "0");
check(await page.textContent("[data-calc-total]") === "8,0", "calculadora: 20 adultos = 8,0 kg");
await page.fill("#c-adultos", "-5");
check(await page.textContent("[data-calc-total]") === "0,0", "calculadora: número negativo vira zero");
await page.fill("#c-adultos", "10"); await page.fill("#c-criancas", "2");
for (const c of await page.$$("input[name=tipo]")) await c.uncheck({ force: true });
check(/Marque pelo menos/.test(await page.textContent("[data-calc-list]")), "calculadora: avisa quando nenhuma carne está marcada");
for (const c of await page.$$("input[name=tipo]")) await c.check({ force: true });
check(await page.locator(".price-link").count() === await page.locator("[data-cuts] li").count(), "todo corte tem botão 'Preço de hoje'");

/* ---------- Rastreamento de conversões ---------- */
await page.evaluate(() => { document.addEventListener("click", e => { if (e.target.closest("a[href^='tel:'], a[target=_blank]")) e.preventDefault(); }); });
for (const sel of [".hero-actions a[data-contact]", ".price-link", ".map-card a[href*='/maps/dir/']", ".reviews a", ".topbar-link"]) await page.locator(sel).first().dispatchEvent("click");
await page.locator("#tab-porco").dispatchEvent("click");
await page.fill("#c-adultos", "12");
await page.evaluate(() => { HTMLAnchorElement.prototype.click = function () { window.__opened = this.href; }; });
await page.click("[data-calc] button[type=submit]", { force: true });
const ev = await page.evaluate(() => window.__ev);
for (const e of ["phone_click", "price_request_click", "directions_click", "maps_profile_click", "cut_tab_view", "bbq_calc_used", "generate_lead"]) check(ev.includes(e), `evento "${e}"`);
check(/^tel:\+551125665264$/.test(await page.evaluate(() => window.__opened)), "sem WhatsApp configurado, a lista abre a ligação");

/* ---------- Com WhatsApp configurado ---------- */
const ctx2 = await browser.newContext();
await ctx2.route("**/js/main.js*", async r => { const res = await r.fetch(); r.fulfill({ response: res, body: (await res.text()).replace('whatsapp: "",', 'whatsapp: "5511999998888",') }); });
const p2 = await ctx2.newPage();
await p2.goto(BASE + "/", { waitUntil: "networkidle" });
check(/^https:\/\/wa\.me\/5511999998888\?text=/.test(await p2.getAttribute(".hero-actions a[data-contact]", "href")), "com WhatsApp: botões viram wa.me com mensagem");
check(/picanha/.test(decodeURIComponent(await p2.getAttribute(".price-link", "href"))), "com WhatsApp: 'Preço de hoje' pergunta pelo corte");
await ctx2.close();

/* ---------- Segurança ---------- */
const h = (await page.request.get(BASE + "/")).headers();
for (const k of ["content-security-policy", "strict-transport-security", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy"]) check(Boolean(h[k]), `cabeçalho ${k}`);
check(!/unsafe-inline|unsafe-eval/.test(h["content-security-policy"] || "") && /frame-src 'none'/.test(h["content-security-policy"] || ""), "CSP estrita, sem iframes de terceiros");
check((await page.request.get(BASE + "/nao-existe")).status() === 404, "404 responde com status 404");

await browser.close();
console.log(fails.length ? `\n${fails.length} falha(s).` : "\nTudo certo.");
process.exit(fails.length ? 1 : 0);
