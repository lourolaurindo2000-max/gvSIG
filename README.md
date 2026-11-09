# SIG — Sistema Integrado de Gestão · Almadina-BA

Mapeamento social dos bairros com cadastro de cidadãos. Banco de dados **Supabase**, com atualização em tempo real entre todos os aparelhos. Publicado no **Vercel**.

Versão 1.0 · © 2026 Todos os direitos reservados a André Almeida, desenvolvedor do sistema.

## Arquivos

| Arquivo | Para que serve |
| --- | --- |
| `index.html` | O sistema completo |
| `SIG.ico` | Ícone da aba do navegador |
| `package.json` / `package-lock.json` | Bibliotecas: `@supabase/supabase-js` 2.57.4 e `@supabase/ssr` 0.7.0 (versões fixas) |
| `scripts/copiar-supabase.js` | Monta a pasta `public/` que o Vercel publica |
| `sw.js` | Service worker: guarda o site no aparelho para abrir sem internet |
| `manifest.webmanifest`, `icone-192.png`, `icone-512.png` | Permitem instalar o SIG como aplicativo no computador |
| `vercel.json` | Configuração do Vercel (instalação, build e cabeçalhos) |
| `.env` | `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `.env.example` | Modelo do `.env` |
| `supabase/migrations/` | Registro das tabelas criadas no Supabase |

## Banco de dados (Supabase)

Projeto: **Sistema_integrado_de_gestao** (`elqxgsfgovuktwgoituv`).

| Tabela | Conteúdo | Acesso público |
| --- | --- | --- |
| `pessoas` | Cadastros (nome, bairro e a ficha completa em `dados`) | Ler, cadastrar, editar, excluir |
| `configuracoes` | Bairros (`publico/bairros`) e resumo do painel (`publico/resumo`) | Ler e gravar |
| `auditoria` | Histórico de ações | Ler e registrar; ninguém altera nem apaga |

O acesso é aberto, sem login: qualquer pessoa com o endereço do site pode cadastrar, editar e excluir.

## Com e sem internet

- **Com internet:** tudo é lido e gravado no Supabase, em tempo real.
- **Sem internet:** o site abre pela cópia guardada no aparelho (precisa ter sido aberto uma vez com internet). O painel mostra os últimos números recebidos. No computador do administrador, os cadastros ficam salvos no navegador (IndexedDB); cadastrar, editar e excluir continuam funcionando e as alterações entram numa fila.
- **Quando a internet volta:** a fila é enviada sozinha, na ordem, e o resumo do painel/TV é republicado.
- **Login sem internet:** funciona se o administrador já entrou com internet naquele computador (a senha é conferida por um código guardado, nunca a senha em si).
- Precisam de internet: carregar/remover exemplos e o primeiro acesso em um aparelho novo.
- No Chrome/Edge, o ícone de instalar na barra de endereço cria um atalho do SIG na área de trabalho.

## Publicar

1. Envie todos estes arquivos para o repositório do GitHub ligado ao Vercel (sem `node_modules/` e sem `public/`).
2. O Vercel roda `npm ci` (instala as bibliotecas) e `npm run build`, e publica a pasta `public/`.

Para trocar de projeto Supabase, altere as variáveis no `.env` ou em **Vercel > Settings > Environment Variables**. Use sempre a **publishable key** (`sb_publishable_...`), nunca a secret key.

## Testar no computador

```bash
npm install
npm run build
npx serve public
```
