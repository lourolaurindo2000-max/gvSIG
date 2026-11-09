// Monta a pasta "public" que o Vercel publica:
// 1. lê NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
//    (das variáveis de ambiente do Vercel ou do arquivo .env);
// 2. coloca esses valores no index.html;
// 3. copia a biblioteca @supabase/supabase-js instalada pelo npm.
const fs = require("fs");
const path = require("path");

const raiz = path.join(__dirname, "..");
const saida = path.join(raiz, "public");
const lib = path.join(raiz, "node_modules", "@supabase", "supabase-js", "dist", "umd", "supabase.js");

// lê o .env (sem dependências extras); variáveis já definidas no Vercel têm prioridade
const arqEnv = path.join(raiz, ".env");
if (fs.existsSync(arqEnv)) {
  for (const linha of fs.readFileSync(arqEnv, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line(m[1])) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
function line(k) { return process.env[k] !== undefined && process.env[k] !== ""; }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !chave) {
  console.warn("Aviso: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não definidas; usando os valores que já estão no index.html.");
}
if (chave && (/^sb_secret_/.test(chave) || /service_role/.test(chave))) {
  console.error("A chave informada é secreta. Use a publishable key (sb_publishable_...).");
  process.exit(1);
}
if (!fs.existsSync(lib)) {
  console.error("Biblioteca do Supabase não encontrada. Rode: npm install");
  process.exit(1);
}

fs.rmSync(saida, { recursive: true, force: true });
fs.mkdirSync(path.join(saida, "vendor"), { recursive: true });

let html = fs.readFileSync(path.join(raiz, "index.html"), "utf8");
if (url) html = html.replace(/const SUPABASE_URL = "[^"]*";/, `const SUPABASE_URL = ${JSON.stringify(url)};`);
if (chave) html = html.replace(/const SUPABASE_KEY = "[^"]*";/, `const SUPABASE_KEY = ${JSON.stringify(chave)};`);
fs.copyFileSync(path.join(raiz, "SIG.ico"), path.join(saida, "SIG.ico"));
// funcionamento sem internet: service worker (com a versão desta publicação), manifesto e ícones do aplicativo
for (const a of ["manifest.webmanifest", "icone-192.png", "icone-512.png"]) fs.copyFileSync(path.join(raiz, a), path.join(saida, a));
const versaoSite = process.env.VERCEL_GIT_COMMIT_SHA ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 12) : Date.now().toString(36);
fs.writeFileSync(path.join(saida, "sw.js"), fs.readFileSync(path.join(raiz, "sw.js"), "utf8").replace("__VERSAO__", versaoSite));

// Smart TVs de qualquer marca com navegador antigo (Hisense/VIDAA, Samsung/LG antigas…):
// gera em public/legacy/ cópias em ES5 do sistema, do Chart.js e do Supabase. O index.html só as carrega
// quando o navegador não entende as versões modernas; computadores e TVs novas continuam iguais.
html = html.replace("legacy/app.js?v=__VERSAO__", "legacy/app.js?v=" + versaoSite);
const pastaLegado = path.join(saida, "legacy");
fs.mkdirSync(pastaLegado, { recursive: true });
const babel = require("@babel/core");
const paraES5 = (codigo, nome) => babel.transformSync(codigo, {
  babelrc: false, configFile: false, filename: nome, sourceType: "script", compact: true, comments: false,
  presets: [[require.resolve("@babel/preset-env"), { targets: "chrome 38, safari 7", modules: false }]]
}).code;
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const app = scripts.find(c => c.includes("window.__SIG_OK=1"));
if (!app) { console.error("Script principal não encontrado no index.html"); process.exit(1); }
fs.writeFileSync(path.join(pastaLegado, "app.js"), paraES5(app, "app.js"));
const nm = p => path.join(raiz, "node_modules", ...p.split("/"));
fs.writeFileSync(path.join(pastaLegado, "chart.js"), paraES5(fs.readFileSync(nm("chart.js/dist/chart.umd.js"), "utf8"), "chart.js"));
fs.writeFileSync(path.join(pastaLegado, "supabase.js"), paraES5(fs.readFileSync(lib, "utf8"), "supabase.js"));
fs.copyFileSync(nm("core-js-bundle/minified.js"), path.join(pastaLegado, "polyfill.js"));
fs.writeFileSync(path.join(saida, "index.html"), html);
fs.copyFileSync(lib, path.join(saida, "vendor", "supabase.js"));

const versao = require(path.join(raiz, "node_modules", "@supabase", "supabase-js", "package.json")).version;
console.log("SIG pronto em public/ · @supabase/supabase-js " + versao + " · " + (url || "valores do index.html"));
