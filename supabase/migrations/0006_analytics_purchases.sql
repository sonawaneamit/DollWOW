-- Server-side purchase records from the Shopify orders/paid webhook.
-- Privacy-safe by design: no customer names, emails, or addresses are stored.

create table if not exists public.analytics_purchases (
  id uuid primary key default gen_random_uuid(),
  shopify_order_id text not null unique,
  order_number text,
  currency text not null default 'USD',
  total_price numeric(12, 2) not null default 0,
  line_count integer not null default 0,
  items jsonb not null default '[]'::jsonb,
  ordered_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists analytics_purchases_ordered_at_idx on public.analytics_purchases (ordered_at desc);

alter table public.analytics_purchases enable row level security;

-- Server-side inserts use the service role key, which bypasses RLS.
-- No public read/write policies: purchase data is internal analytics only.
