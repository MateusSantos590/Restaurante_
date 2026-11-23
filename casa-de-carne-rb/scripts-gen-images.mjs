// Gera og-image.png (1200x630) e ícones PNG do açougue com o Chromium do Playwright.
// Uso: node casa-de-carne-rb/scripts-gen-images.mjs
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const out = new URL("./public/img/", import.meta.url);
const font = "data:font/woff2;base64," + (await readFile(new URL("./public/fonts/archivo.woff2", import.meta.url))).toString("base64");
const favicon = await readFile(new URL("favicon.svg", out), "utf8");
const html = await readFile(new URL("./public/index.html", import.meta.url), "utf8");
const stamp = html.match(/<svg class="stamp"[\s\S]*?<\/svg>/)[0];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(`<!doctype html><style>
@font-face{font-family:A;src:url(${font});font-weight:100 900;font-stretch:62% 125%}
body{margin:0;width:1200px;height:630px;background:#161312;color:#f4efe6;font-family:A,sans-serif;display:flex;align-items:center;overflow:hidden}
.t{padding-left:80px;width:760px}
.e{font-weight:700;letter-spacing:.16em;color:#c9a878;font-size:22px;margin:0 0 20px;text-transform:uppercase}
h1{font-weight:900;font-stretch:62%;font-size:120px;line-height:.88;margin:0 0 26px;text-transform:uppercase}
h1 span{color:#b4161d;display:block}
p{font-size:28px;margin:0;color:#c8beb4}
svg{position:absolute;right:70px;top:155px;width:320px;height:320px;color:#c9a878}
.stamp text{font-size:19px;font-weight:800;letter-spacing:.14em;fill:currentColor;font-family:A}
.stamp-hole{fill:#161312}.stamp-handle{fill:#b4161d}
</style><div class="t"><p class="e">Jardim das Oliveiras · São Paulo</p><h1>Casa de Carne <span>RB</span></h1><p>Açougue aberto todos os dias.<br>Seg a sáb 8h às 20h · Dom 8h às 14h</p></div>${stamp}`);
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
await p.screenshot({ path: new URL("og-image.png", out).pathname });
for (const [size, name] of [[180, "apple-touch-icon.png"], [512, "icon-512.png"]]) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<body style="margin:0">${favicon.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body>`);
  await p.screenshot({ path: new URL(name, out).pathname });
}
await b.close();
console.log("ok");
