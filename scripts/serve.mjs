// Servidor local de desenvolvimento, sem dependências.
// Aplica os mesmos cabeçalhos de public/_headers, para você testar a CSP
// em casa exatamente como ela vai funcionar em produção.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, normalize, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Pasta do site: padrão public/ (restaurante). Ex.: node scripts/serve.mjs casa-de-carne-rb/public
import { resolve } from "node:path";
const ROOT = process.argv[2] ? resolve(process.argv[2]) + sep : fileURLToPath(new URL("../public/", import.meta.url));
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json", ".ico": "image/x-icon", ".woff2": "font/woff2"
};

// Lê _headers no formato Netlify/Cloudflare: linha sem indentação = padrão de URL,
// linhas indentadas = "Nome: valor".
async function loadHeaderRules() {
  const raw = await readFile(join(ROOT, "_headers"), "utf8");
  const rules = [];
  let current = null;
  for (const line of raw.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) { current = { pattern: line.trim(), headers: {} }; rules.push(current); continue; }
    const i = line.indexOf(":");
    if (current && i > 0) current.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return rules.map(r => ({
    re: new RegExp("^" + r.pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"),
    headers: r.headers
  }));
}

const rules = await loadHeaderRules();

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    // Proteção contra "path traversal" (ex.: /../../etc/passwd)
    const file = normalize(join(ROOT, pathname));
    if (!file.startsWith(ROOT) || pathname.split("/").some(p => p.startsWith(".") && p !== ".well-known")) {
      res.writeHead(403).end("Proibido"); return;
    }
    for (const r of rules) if (r.re.test(pathname)) for (const [k, v] of Object.entries(r.headers)) res.setHeader(k, v);
    let body, status = 200, type;
    try {
      if (!(await stat(file)).isFile()) throw new Error();
      body = await readFile(file); type = TYPES[extname(file)] || "application/octet-stream";
    } catch {
      body = await readFile(join(ROOT, "404.html")); status = 404; type = TYPES[".html"];
    }
    res.setHeader("Content-Type", type);
    res.writeHead(status).end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(400).end("Requisição inválida");
  }
}).listen(PORT, () => console.log(`Hora do Rango rodando em http://localhost:${PORT}`));
