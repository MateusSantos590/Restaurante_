// Gera og-image.png (1200x630) e ícones PNG do açougue com o Chromium do Playwright.
// Uso: node casa-de-carne-rb/scripts-gen-images.mjs
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const out = new URL("./public/img/", import.meta.url);
const slab = "data:font/woff2;base64," + (await readFile(new URL("./public/fonts/zilla-slab-700.woff2", import.meta.url))).toString("base64");
const font = "data:font/woff2;base64," + (await readFile(new URL("./public/fonts/archivo.woff2", import.meta.url))).toString("base64");
const favicon = await readFile(new URL("favicon.svg", out), "utf8");
const html = await readFile(new URL("./public/index.html", import.meta.url), "utf8");
const stamp = html.match(/<svg class="stamp"[\s\S]*?<\/svg>/)[0];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(`<!doctype html><style>
@font-face{font-family:A;src:url(${font});font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:Z;src:url(${slab});font-weight:700}
body{margin:0;width:1200px;height:630px;color:#f6efe3;font-family:A,sans-serif;display:flex;align-items:center;justify-content:center;overflow:hidden;text-align:center;
background:radial-gradient(120% 90% at 50% 115%,#b4321f 0%,#7a1a1c 30%,#6a1220 55%,#4f0d17 100%)}
.f{position:absolute;inset:40px 90px}
.e{font-weight:700;letter-spacing:.18em;color:#e3c47e;font-size:22px;margin:0 0 22px;text-transform:uppercase}
h1{font-family:Z;font-weight:700;font-size:104px;line-height:.95;margin:0 0 26px;text-transform:uppercase}
h1 span{display:block;background:linear-gradient(100deg,#f3dc9e,#c99a45 45%,#f0d48c);-webkit-background-clip:text;color:transparent}
p{font-size:28px;margin:0;color:#e3cfb8}
</style><svg class="f" viewBox="0 0 1000 600" preserveAspectRatio="none"><defs><linearGradient id="o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3dc9e"/><stop offset=".5" stop-color="#c99a45"/><stop offset="1" stop-color="#f0d48c"/></linearGradient></defs><path d="M60 40 H940 L985 120 V430 Q985 470 940 490 L540 585 Q500 596 460 585 L60 490 Q15 470 15 430 V120 Z" fill="none" stroke="url(#o)" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>
<div style="position:relative;margin-top:-30px"><p class="e">★ Açougue no Jardim das Oliveiras ★</p><h1>Casa de Carnes <span>RB</span></h1><p>Aberto todos os dias · Seg a sáb 8h às 20h · Dom 8h às 13h</p></div>`);
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
await p.screenshot({ path: new URL("og-image.png", out).pathname });
for (const [size, name] of [[180, "apple-touch-icon.png"], [512, "icon-512.png"]]) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<body style="margin:0">${favicon.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`);
  await p.screenshot({ path: new URL(name, out).pathname });
}
await b.close();
console.log("ok");
