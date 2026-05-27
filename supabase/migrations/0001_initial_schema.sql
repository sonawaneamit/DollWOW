create extension if not exists "pgcrypto";

create table if not exists products_extended (
  shopify_product_id text primary key,
  brand text,
  supplier text,
  material text,
  height_cm numeric,
  weight_lb numeric,
  cup_size text,
  warehouse_country text,
  stock_last_checked_at timestamptz,
  custom_available boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists product_aliases (
  id uuid primary key default gen_random_uuid(),
  product_id text references products_extended(shopify_product_id) on delete cascade,
  alias_name text,
  supplier_sku text,
  old_site_name text,
  competitor_title text,
  image_hash_optional text,
  created_at timestamptz default now()
);

create table if not exists guided_sessions (
  id uuid primary key default gen_random_uuid(),
  answers_json jsonb not null,
  recommended_product_ids text[] default '{}',
  email_optional text,
  consent_flags jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists approved_vendors (
  id uuid primary key default gen_random_uuid(),
  domain text unique not null,
  display_name text not null,
  region text,
  trust_status text not null default 'review',
  allowed_for_price_match boolean not null default false,
  notes text,
  created_at timestamptz default now()
);

create table if not exists comparison_requests (
  id uuid primary key default gen_random_uuid(),
  input_url text not null,
  customer_email_optional text,
  parsed_title text,
  parsed_price numeric,
  parsed_vendor text,
  status text not null default 'pending',
  confidence text not null default 'low',
  result_json jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists comparison_sources (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references comparison_requests(id) on delete cascade,
  source_url text not null,
  title text,
  price numeric,
  vendor text,
  delivery_claim text,
  match_notes text,
  created_at timestamptz default now()
);

create table if not exists competitor_products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references approved_vendors(id) on delete cascade,
  source_url text unique not null,
  title text,
  price numeric,
  shipping_price numeric,
  currency text default 'USD',
  images text[] default '{}',
  specs_json jsonb default '{}',
  last_checked_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists product_matches (
  id uuid primary key default gen_random_uuid(),
  shopify_product_id text not null,
  competitor_product_id uuid references competitor_products(id) on delete cascade,
  confidence text not null default 'low',
  match_reason text,
  approved boolean default false,
  created_at timestamptz default now()
);

create table if not exists price_match_rules (
  id uuid primary key default gen_random_uuid(),
  min_gross_margin numeric not null default 0.35,
  max_discount_percent numeric not null default 15,
  price_freshness_hours integer not null default 72,
  code_expiry_hours integer not null default 48,
  enabled boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists price_match_codes (
  id uuid primary key default gen_random_uuid(),
  comparison_request_id uuid references comparison_requests(id) on delete set null,
  shopify_product_id text,
  shopify_variant_id text,
  code text unique not null,
  amount numeric,
  percent numeric,
  expires_at timestamptz,
  status text not null default 'created',
  created_at timestamptz default now()
);

create table if not exists stock_snapshots (
  id uuid primary key default gen_random_uuid(),
  product_id text,
  warehouse_country text,
  supplier text,
  quantity_or_status text,
  last_checked_at timestamptz,
  source text,
  created_at timestamptz default now()
);

create table if not exists support_leads (
  id uuid primary key default gen_random_uuid(),
  source_flow text not null,
  name_optional text,
  email text not null,
  question text,
  product_ids text[] default '{}',
  status text not null default 'new',
  owner text,
  created_at timestamptz default now()
);

create table if not exists supplier_profiles (
  id uuid primary key default gen_random_uuid(),
  supplier text unique not null,
  contact text,
  authorization_status text,
  price_list_status text,
  asset_status text,
  stock_feed_status text,
  notes text,
  created_at timestamptz default now()
);

insert into price_match_rules (id)
values ('00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;
