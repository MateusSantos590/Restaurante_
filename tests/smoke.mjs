// Teste de fumaça: abre o site num Chromium real e verifica o essencial.
// Uso: npm start (em outro terminal) e depois npm test
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // funciona com Playwright local ou global
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:8080";
const SHOTS = process.env.SHOTS_DIR || "screenshots";
const failures = [];
const check = (ok, msg) => { console.log(`${ok ? "✔" : "✘"} ${msg}`); if (!ok) failures.push(msg); };

await mkdir(SHOTS, { recursive: true });
const browser = await chromium.launch();

for (const width of [375, 768, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(e.message));
  const bad = [];
  page.on("response", r => { if (r.status() >= 400 && r.url().startsWith(BASE)) bad.push(`${r.status()} ${r.url()}`); });

  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(overflow <= 0, `${width}px: sem rolagem horizontal (excesso ${overflow}px)`);
  check(await page.locator("h1").count() === 1, `${width}px: exatamente um <h1>`);
  const ctaVisible = await page.locator(".hero-actions .btn-primary").isVisible();
  check(ctaVisible, `${width}px: CTA principal visível sem rolar`);
  const statusText = await page.locator("[data-status-text]").textContent();
  check(/Aberto|Fechado/.test(statusText), `${width}px: status de funcionamento calculado ("${statusText}")`);
  // Rolagem completa (dispara animações) e screenshot
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${SHOTS}/home-${width}.png`, fullPage: true });
  check(errors.length === 0, `${width}px: console sem erros/violação de CSP ${errors.length ? JSON.stringify(errors) : ""}`);
  check(bad.length === 0, `${width}px: nenhum recurso local com erro ${bad.join(", ")}`);
  await page.close();
}

// Interações
const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
await page.goto(BASE + "/");

// Menu mobile + tecla Esc
await page.click("[data-nav-toggle]");
check(await page.locator("[data-nav]").evaluate(n => n.classList.contains("is-open")), "menu mobile abre");
await page.keyboard.press("Escape");
check(await page.getAttribute("[data-nav-toggle]", "aria-expanded") === "false", "menu mobile fecha com Esc");

// Abas com teclado
await page.focus("#tab-dia");
await page.keyboard.press("ArrowRight");
check(await page.locator("#painel-cafe").isVisible(), "abas do cardápio respondem às setas do teclado");

// Formulário: inválido mostra erros
await page.waitForTimeout(2600); // tempo mínimo anti-robô
await page.click("[data-order-form] button[type=submit]");
check((await page.locator("#e-nome").textContent()).length > 0, "formulário vazio mostra erro junto ao campo");

// Formulário válido abre WhatsApp com a mensagem
await page.fill("#f-nome", "Maria Souza");
await page.selectOption("#f-tipo", "Reserva de mesa");
await page.fill("#f-qtd", "8");
const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
await page.fill("#f-data", tomorrow);
await page.fill("#f-obs", "Aniversário <script>alert(1)</script>");
// Não acessamos o WhatsApp de verdade no teste: interceptamos a requisição.
let waUrl = "";
await page.context().route(/wa\.me|whatsapp\.com/, route => { waUrl ||= route.request().url(); route.fulfill({ body: "ok" }); });
const [popup] = await Promise.all([page.waitForEvent("popup"), page.click("[data-order-form] button[type=submit]")]);
await popup.waitForLoadState().catch(() => {});
await popup.close();
if (process.env.DEBUG) console.log(waUrl);
check(/wa\.me|whatsapp\.com/.test(waUrl), "formulário válido abre o WhatsApp");
check(new URL(waUrl).searchParams.get("text")?.includes("Nome: Maria Souza"), "mensagem contém os dados preenchidos");

// Honeypot: robô preenche campo escondido → nada abre
const p2 = await browser.newPage();
await p2.goto(BASE + "/");
await p2.waitForTimeout(2600);
await p2.evaluate(() => { document.querySelector("#f-site").value = "spam"; });
await p2.fill("#f-nome", "Robo"); await p2.selectOption("#f-tipo", "Outro assunto");
await p2.fill("#f-qtd", "1"); await p2.fill("#f-data", tomorrow);
let opened = false; p2.on("popup", () => { opened = true; });
await p2.click("[data-order-form] button[type=submit]");
await p2.waitForTimeout(500);
check(!opened, "honeypot bloqueia envio de robô");

// Cabeçalhos de segurança
const res = await p2.request.get(BASE + "/");
const h = res.headers();
for (const name of ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy", "strict-transport-security"]) {
  check(Boolean(h[name]), `cabeçalho ${name} presente`);
}
check(!/unsafe-inline|unsafe-eval/.test(h["content-security-policy"] || ""), "CSP sem 'unsafe-inline' nem 'unsafe-eval'");
check((await p2.request.get(BASE + "/nao-existe")).status() === 404, "página 404 responde com status 404");

await browser.close();
console.log(failures.length ? `\n${failures.length} falha(s).` : "\nTudo certo.");
process.exit(failures.length ? 1 : 0);
