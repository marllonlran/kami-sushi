-- Kami Sushi: pausar pedidos e itens esgotados.
-- Cole tudo no Supabase em SQL Editor > New query e clique em Run.
-- (Rodar depois do schema.sql. Pode rodar de novo sem problema.)

-- Uma única linha (id = 1) com o estado da loja.
create table if not exists public.store_settings (
  id int primary key default 1 check (id = 1),
  paused boolean not null default false,
  sold_out text[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

alter table public.store_settings enable row level security;

-- Clientes precisam saber se a loja está pausada e o que está esgotado.
drop policy if exists "todos leem a loja" on public.store_settings;
create policy "todos leem a loja" on public.store_settings
  for select to anon, authenticated using (true);

-- Só a equipe logada muda.
drop policy if exists "equipe altera a loja" on public.store_settings;
create policy "equipe altera a loja" on public.store_settings
  for update to authenticated using (true) with check (true);

-- O servidor também recusa pedidos com a loja pausada ou com item esgotado
-- (assim nada passa, mesmo com o site desatualizado no celular do cliente).
create or replace function public.create_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.orders;
  s public.store_settings;
  blocked text;
begin
  select * into s from public.store_settings where id = 1;

  if s.paused then
    raise exception 'LOJA_PAUSADA';
  end if;

  select string_agg(distinct it->>'name', ', ') into blocked
  from jsonb_array_elements(payload->'items') it
  where it->>'itemId' = any (coalesce(s.sold_out, '{}'));

  if blocked is not null then
    raise exception 'ESGOTADO: %', blocked;
  end if;

  insert into public.orders (
    type, customer, address, table_no, payment, change_for, notes,
    items, subtotal, delivery_fee, total
  ) values (
    payload->>'type',
    payload->'customer',
    case when jsonb_typeof(payload->'address') = 'object' then payload->'address' end,
    (payload->>'table')::int,
    payload->>'payment',
    (payload->>'changeFor')::numeric,
    left(payload->>'notes', 300),
    payload->'items',
    (payload->>'subtotal')::numeric,
    (payload->>'deliveryFee')::numeric,
    (payload->>'total')::numeric
  )
  returning * into r;
  return to_jsonb(r);
end;
$$;

revoke all on function public.create_order(jsonb) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;

-- Atualização em tempo real (site do cliente e painel).
do $$
begin
  alter publication supabase_realtime add table public.store_settings;
exception when duplicate_object then null;
end $$;
