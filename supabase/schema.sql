-- Esquema Supabase para sincronización opcional (NO desplegado ni verificado contra un proyecto real).
create table if not exists public.sync_records (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity text not null check (length(entity) <= 40),
  entity_id text not null check (length(entity_id) <= 80),
  payload jsonb not null check (pg_column_size(payload) < 65536),
  updated_at bigint not null,
  deleted boolean not null default false,
  primary key (user_id, entity, entity_id)
);
create index if not exists sync_records_user_updated on public.sync_records (user_id, updated_at);

alter table public.sync_records enable row level security;
create policy "own rows select" on public.sync_records for select using (auth.uid() = user_id);
create policy "own rows insert" on public.sync_records for insert with check (auth.uid() = user_id);
create policy "own rows update" on public.sync_records for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows delete" on public.sync_records for delete using (auth.uid() = user_id);
-- No se almacena audio. La eliminación de cuenta borra en cascada (on delete cascade).
