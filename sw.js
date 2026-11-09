/* SIG Almadina · service worker: guarda o site neste aparelho para abrir mesmo sem internet.
   - página (index.html): busca na internet primeiro (sempre a versão nova); sem internet, usa a cópia guardada;
   - bibliotecas (Chart.js, ExcelJS, Supabase, fontes, ícones): usa a cópia guardada e atualiza quando possível;
   - dados do Supabase: nunca passam por aqui (o próprio SIG guarda a cópia dos dados). */
const VERSAO = "__VERSAO__";
const CACHE = "sig-" + VERSAO;
const BASE = ["./", "SIG.ico", "vendor/supabase.js", "manifest.webmanifest", "icone-192.png", "icone-512.png"];
const EXTERNOS = [
  "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js",
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
];
const HOSTS_CACHE = ["cdnjs.cloudflare.com", "cdn.jsdelivr.net", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", ev => {
  ev.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(BASE);
    await Promise.all(EXTERNOS.map(u => c.add(new Request(u, { mode: "cors" })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", ev => {
  ev.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("sig-") && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

function comPrazo(p, ms) { return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("prazo")), ms))]); }

self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.protocol !== "https:" && url.protocol !== "http:") return;
  const mesmo = url.origin === self.location.origin;

  // página: internet primeiro, cópia guardada se não houver conexão
  if (req.mode === "navigate" || (mesmo && (url.pathname === "/" || url.pathname.endsWith("/index.html")))) {
    ev.respondWith((async () => {
      const c = await caches.open(CACHE);
      try {
        const r = await comPrazo(fetch(req, { cache: "no-store" }), 8000);
        if (r && r.ok) c.put("./", r.clone());
        return r;
      } catch (e) {
        return (await c.match("./")) || (await c.match(req)) || Response.error();
      }
    })());
    return;
  }

  // arquivos do site e bibliotecas: cópia guardada na hora, atualiza em segundo plano
  if (mesmo || HOSTS_CACHE.includes(url.hostname)) {
    ev.respondWith((async () => {
      const c = await caches.open(CACHE);
      const guardado = await c.match(req, { ignoreVary: true });
      const rede = fetch(req).then(r => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; });
      if (guardado) { ev.waitUntil(rede.catch(() => {})); return guardado; }
      try { return await rede; } catch (e) { return Response.error(); }
    })());
  }
});
