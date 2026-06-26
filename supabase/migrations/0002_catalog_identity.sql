alter table products_extended
  add column if not exists catalog_identity_key text,
  add column if not exists catalog_body_identity_key text,
  add column if not exists head_model text,
  add column if not exists body_type text,
  add column if not exists shopify_handle text,
  add column if not exists title text,
  add column if not exists product_type text,
  add column if not exists price numeric,
  add column if not exists currency text default 'USD',
  add column if not exists stock_status text,
  add column if not exists delivery_estimate text,
  add column if not exists primary_image_url text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists last_synced_from_shopify_at timestamptz;

create index if not exists products_extended_catalog_identity_key_idx
  on products_extended (catalog_identity_key);

create index if not exists products_extended_catalog_body_identity_key_idx
  on products_extended (catalog_body_identity_key);

create index if not exists products_extended_head_model_idx
  on products_extended (head_model);

create index if not exists products_extended_shopify_handle_idx
  on products_extended (shopify_handle);

create index if not exists products_extended_brand_idx
  on products_extended (brand);

create index if not exists products_extended_specs_idx
  on products_extended (height_cm, cup_size, material);

alter table product_aliases
  add column if not exists catalog_identity_key text,
  add column if not exists catalog_body_identity_key text,
  add column if not exists head_model text,
  add column if not exists alias_type text default 'source',
  add column if not exists source_domain text,
  add column if not exists source_url text,
  add column if not exists confidence text default 'review';

create index if not exists product_aliases_catalog_identity_key_idx
  on product_aliases (catalog_identity_key);

create index if not exists product_aliases_source_domain_idx
  on product_aliases (source_domain);

create table if not exists visual_search_requests (
  id uuid primary key default gen_random_uuid(),
  customer_email_optional text,
  submitted_url text,
  uploaded_asset_key text,
  status text not null default 'new',
  matched_shopify_product_id text,
  matched_catalog_identity_key text,
  confidence text not null default 'low',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists visual_search_results (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references visual_search_requests(id) on delete cascade,
  provider text not null default 'apify_google_lens',
  rank integer,
  result_url text,
  result_domain text,
  title text,
  snippet text,
  image_url text,
  matched_shopify_product_id text,
  matched_catalog_identity_key text,
  confidence numeric,
  raw_result jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists visual_search_requests_status_idx
  on visual_search_requests (status);

create index if not exists visual_search_requests_identity_idx
  on visual_search_requests (matched_catalog_identity_key);

create index if not exists visual_search_results_request_idx
  on visual_search_results (request_id);

create index if not exists visual_search_results_domain_idx
  on visual_search_results (result_domain);
