// Mede a fluidez: rola a página inteira e registra o tempo de cada quadro.
// Meta: 60 fps = 16,7 ms por quadro. Em Chromium sem GPU (CI/servidor) os números
// são mais pessimistas que num celular real, serve para comparar antes/depois.
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const BASE = process.env.BASE_URL || "http://localhost:8080";
const browser = await chromium.launch();
for (const [name, vp] of [["celular 375px", { width: 375, height: 800 }], ["desktop 1280px", { width: 1280, height: 800 }]]) {
  const page = await browser.newPage({ viewport: vp });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(process.env.THROTTLE) || 1 });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const r = await page.evaluate(async () => {
    const dts = []; let last = performance.now();
    let longTasks = 0;
    try { new PerformanceObserver(l => { longTasks += l.getEntries().length; }).observe({ entryTypes: ["longtask"] }); } catch {}
    const total = document.documentElement.scrollHeight - innerHeight;
    const start = performance.now(), dur = 5000;
    await new Promise(res => {
      (function tick(now) {
        dts.push(now - last); last = now;
        const t = Math.min(1, (now - start) / dur);
        scrollTo(0, total * t);
        t < 1 ? requestAnimationFrame(tick) : res();
      })(performance.now());
    });
    dts.shift(); dts.sort((a, b) => a - b);
    const avg = dts.reduce((a, b) => a + b, 0) / dts.length;
    return { frames: dts.length, fps: Math.round(1000 / avg), p95: +dts[Math.floor(dts.length * .95)].toFixed(1), worst: +dts.at(-1).toFixed(1),
             dropped: dts.filter(d => d > 20).length, longTasks };
  });
  console.log(`${name}: ${r.fps} fps médio | p95 ${r.p95} ms | pior ${r.worst} ms | quadros >20ms: ${r.dropped}/${r.frames} | tarefas longas: ${r.longTasks}`);
  await page.close();
}
await browser.close();
