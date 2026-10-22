-- Kami Sushi: tabela de pedidos e permissões.
-- Cole tudo no Supabase em SQL Editor > New query e clique em Run.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity (start with 1001),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  status text not null default 'novo'
    check (status in ('novo', 'preparo', 'pronto', 'saiu', 'concluido', 'cancelado')),
  type text not null check (type in ('entrega', 'retirada', 'mesa')),
  customer jsonb not null,
  address jsonb,
  table_no int check (table_no between 1 and 50),
  payment text not null check (payment in ('cartao', 'dinheiro', 'pix')),
  change_for numeric(10, 2),
  notes text,
  items jsonb not null
    check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 100),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_fee numeric(10, 2),
  total numeric(10, 2) not null check (total >= 0)
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Ninguém acessa a tabela direto, exceto a equipe logada.
alter table public.orders enable row level security;

drop policy if exists "equipe le pedidos" on public.orders;
create policy "equipe le pedidos" on public.orders
  for select to authenticated using (true);

drop policy if exists "equipe atualiza pedidos" on public.orders;
create policy "equipe atualiza pedidos" on public.orders
  for update to authenticated using (true) with check (true);

-- Cliente cria pedido por esta função (sem poder ler os pedidos dos outros).
create or replace function public.create_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.orders;
begin
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

-- Cliente acompanha só o próprio pedido, pelo código secreto (uuid) do link.
create or replace function public.get_order(order_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select to_jsonb(o) from public.orders o where o.id = order_id;
$$;

revoke all on function public.create_order(jsonb) from public;
revoke all on function public.get_order(uuid) from public;
grant execute on function public.create_order(jsonb) to anon, authenticated;
grant execute on function public.get_order(uuid) to anon, authenticated;

-- Atualização em tempo real no painel da cozinha.
do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null;
end $$;
