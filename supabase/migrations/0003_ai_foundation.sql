create table if not exists ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  feature text not null,
  provider text not null,
  model text,
  route text,
  status text not null default 'success',
  input_tokens integer,
  output_tokens integer,
  estimated_cost_usd numeric,
  session_id text,
  user_email_hash text,
  ip_hash text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists ai_usage_events_feature_created_at_idx
  on ai_usage_events (feature, created_at desc);

create index if not exists ai_usage_events_route_created_at_idx
  on ai_usage_events (route, created_at desc);

create index if not exists ai_usage_events_ip_hash_created_at_idx
  on ai_usage_events (ip_hash, created_at desc);

create table if not exists rate_limits (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  identifier_hash text not null,
  window_start timestamptz not null,
  window_seconds integer not null,
  request_count integer not null default 1,
  max_requests integer not null,
  last_seen_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (scope, identifier_hash, window_start, window_seconds)
);

create index if not exists rate_limits_lookup_idx
  on rate_limits (scope, identifier_hash, window_start desc);

create index if not exists rate_limits_last_seen_at_idx
  on rate_limits (last_seen_at desc);
