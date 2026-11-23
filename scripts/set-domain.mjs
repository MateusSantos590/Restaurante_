// Troca o domínio de exemplo pelo domínio real em todos os arquivos do site.
// Uso: node scripts/set-domain.mjs https://www.meusite.com.br [pasta-do-site]
//   pasta padrão: public (restaurante). Açougue: casa-de-carne-rb/public
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const arg = process.argv[2];
if (!arg || !/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(arg)) {
  console.error("Informe o endereço completo, sem barra no final. Ex.: node scripts/set-domain.mjs https://www.meurestaurante.com.br");
  process.exit(1);
}
import { resolve, sep } from "node:path";
const ROOT = process.argv[3] ? resolve(process.argv[3]) + sep : fileURLToPath(new URL("../public/", import.meta.url));
// Domínio atual: lido do canonical da página inicial
const OLD = (await readFile(join(ROOT, "index.html"), "utf8")).match(/<link rel="canonical" href="(https:\/\/[^/"]+)\//)[1];
async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p); else if (/\.(html|xml|txt|webmanifest|json)$/.test(e.name)) yield p;
  }
}
let total = 0;
for await (const f of walk(ROOT)) {
  const s = await readFile(f, "utf8");
  if (!s.includes(OLD)) continue;
  total += s.split(OLD).length - 1;
  await writeFile(f, s.replaceAll(OLD, arg));
  console.log("atualizado:", f.replace(ROOT, "public/"));
}
console.log(`${total} ocorrência(s) trocada(s). E-mails (contato@, seguranca@) continuam como exemplo: troque à mão.`);
