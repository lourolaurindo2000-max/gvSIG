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
fs.writeFileSync(path.join(saida, "index.html"), html);
fs.copyFileSync(path.join(raiz, "SIG.ico"), path.join(saida, "SIG.ico"));
fs.copyFileSync(lib, path.join(saida, "vendor", "supabase.js"));

const versao = require(path.join(raiz, "node_modules", "@supabase", "supabase-js", "package.json")).version;
console.log("SIG pronto em public/ · @supabase/supabase-js " + versao + " · " + (url || "valores do index.html"));
