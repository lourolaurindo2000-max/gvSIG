-- SIG Almadina: tabelas criadas no projeto Supabase "Sistema_integrado_de_gestao" (já aplicado).
-- Guardado aqui como registro. Acesso aberto, sem login, por decisão do responsável.
create table if not exists public.pessoas (
  id text primary key default gen_random_uuid()::text,
  nome text, bairro text,
  dados jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists pessoas_bairro_idx on public.pessoas (bairro);
create table if not exists public.configuracoes (
  chave text primary key,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);
create table if not exists public.auditoria (
  id text primary key default gen_random_uuid()::text,
  quando timestamptz not null default now(),
  dados jsonb not null default '{}'::jsonb
);
create index if not exists auditoria_quando_idx on public.auditoria (quando desc);
create or replace function public.sig_toca_atualizado() returns trigger language plpgsql set search_path = '' as $$
begin new.atualizado_em := now(); return new; end $$;
create trigger pessoas_toca before update on public.pessoas for each row execute function public.sig_toca_atualizado();
create trigger configuracoes_toca before update on public.configuracoes for each row execute function public.sig_toca_atualizado();
alter table public.pessoas enable row level security;
alter table public.configuracoes enable row level security;
alter table public.auditoria enable row level security;
grant select, insert, update, delete on public.pessoas to anon, authenticated;
grant select, insert, update, delete on public.configuracoes to anon, authenticated;
grant select, insert on public.auditoria to anon, authenticated;
create policy "pessoas_ler" on public.pessoas for select to anon, authenticated using (true);
create policy "pessoas_inserir" on public.pessoas for insert to anon, authenticated with check (true);
create policy "pessoas_alterar" on public.pessoas for update to anon, authenticated using (true) with check (true);
create policy "pessoas_excluir" on public.pessoas for delete to anon, authenticated using (true);
create policy "config_ler" on public.configuracoes for select to anon, authenticated using (true);
create policy "config_inserir" on public.configuracoes for insert to anon, authenticated with check (true);
create policy "config_alterar" on public.configuracoes for update to anon, authenticated using (true) with check (true);
create policy "config_excluir" on public.configuracoes for delete to anon, authenticated using (true);
create policy "auditoria_ler" on public.auditoria for select to anon, authenticated using (true);
create policy "auditoria_inserir" on public.auditoria for insert to anon, authenticated with check (true);
alter publication supabase_realtime add table public.pessoas, public.configuracoes, public.auditoria;
