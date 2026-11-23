// Gera as imagens PNG (Open Graph 1200x630 e ícones) a partir de HTML/SVG,
// usando o Chromium do Playwright. Rode de novo se mudar a marca.
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");

const out = new URL("../public/img/", import.meta.url);
const favicon = await readFile(new URL("favicon.svg", out), "utf8");
const html = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const plate = html.match(/<svg class="plate"[\s\S]*?<\/svg>/)[0];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(`<!doctype html><html><head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Figtree:wght@600&display=swap">
<style>
 body{margin:0;width:1200px;height:630px;background:#fbf6ee;font-family:Figtree,sans-serif;color:#2a1b12;display:flex;align-items:center;overflow:hidden;position:relative}
 .t{padding-left:80px;width:640px}
 .e{font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#b93a12;font-size:22px;margin:0 0 18px}
 h1{font-family:"DM Serif Display",serif;font-weight:400;font-size:84px;line-height:1;margin:0 0 24px}
 h1 em{color:#b93a12}
 p{font-size:28px;margin:0;color:#5e4a3c}
 .plate{position:absolute;right:-60px;top:50px;width:560px;height:560px}
 .bg{position:absolute;right:-200px;top:-200px;width:900px;height:900px;background:radial-gradient(circle,#fbe3d6 0,transparent 65%)}
</style></head><body><div class="bg"></div>
<div class="t"><p class="e">São Miguel Paulista · SP</p><h1>Hora do <em>Rango</em></h1><p>Comida caseira de verdade.<br>Prato do dia, marmitex e porções.</p></div>
${plate}</body></html>`);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
await page.screenshot({ path: new URL("og-image.png", out).pathname });

for (const size of [180, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0;background:#b93a12">${favicon.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`);
  await page.screenshot({ path: new URL(size === 180 ? "apple-touch-icon.png" : "icon-512.png", out).pathname });
}
await browser.close();
console.log("Imagens geradas em public/img/");
