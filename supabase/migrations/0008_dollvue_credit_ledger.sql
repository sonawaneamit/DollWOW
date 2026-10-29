-- Preview preparation only. Apply and enable fulfilment only after release review.
create table public.dollvue_credit_orders (
  shop text not null,
  order_id text not null,
  email_hash text not null check (email_hash ~ '^[a-f0-9]{64}$'),
  grant_fingerprint text not null,
  credits integer not null check (credits between 1 and 3000),
  created_at timestamptz not null default now(),
  primary key (shop, order_id)
);
create table public.dollvue_credit_holds (
  shop text not null,
  order_id text not null,
  reason text not null check (reason in ('refund', 'cancelled')),
  created_at timestamptz not null default now(),
  primary key (shop, order_id)
);
create table public.dollvue_credit_reservations (
  id uuid primary key,
  email_hash text not null check (email_hash ~ '^[a-f0-9]{64}$'),
  state text not null default 'reserved' check (state in ('reserved', 'completed', 'released')),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index dollvue_reservations_email_idx on public.dollvue_credit_reservations(email_hash, state);
create index dollvue_orders_email_idx on public.dollvue_credit_orders(email_hash);
create table public.dollvue_credit_receipts (
  shop text not null,
  order_id text not null,
  email text not null,
  credits integer not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'accepted', 'failed', 'review')),
  created_at timestamptz not null default now(),
  primary key (shop, order_id),
  foreign key (shop, order_id) references public.dollvue_credit_orders(shop, order_id)
);

alter table public.dollvue_credit_orders enable row level security;
alter table public.dollvue_credit_holds enable row level security;
alter table public.dollvue_credit_reservations enable row level security;
alter table public.dollvue_credit_receipts enable row level security;
revoke all on public.dollvue_credit_orders, public.dollvue_credit_holds,
  public.dollvue_credit_reservations, public.dollvue_credit_receipts from public, anon, authenticated;
grant select, insert, update on public.dollvue_credit_orders, public.dollvue_credit_holds,
  public.dollvue_credit_reservations, public.dollvue_credit_receipts to service_role;

-- Caller authenticates Shopify signature, canonical shop, topic and exact paid packs.
-- Fingerprint covers normalized grant facts, not volatile delivery headers.
create function public.dollvue_grant_paid_credits(
  p_shop text, p_order_id text, p_email_hash text, p_email text,
  p_credits integer, p_fingerprint text
) returns text language plpgsql set search_path = public, pg_temp as $$
declare previous public.dollvue_credit_orders;
begin
  if p_shop is null or p_order_id is null or p_email_hash is null or p_email is null
    or p_credits is null or p_fingerprint is null or p_shop !~ '^[a-z0-9][a-z0-9-]*\.myshopify\.com$'
    or p_order_id !~ '^[1-9][0-9]{0,18}$' or p_email_hash !~ '^[a-f0-9]{64}$'
    or p_fingerprint !~ '^[a-f0-9]{64}$' or p_credits not between 1 and 3000
    or length(p_email) not between 3 and 180 then raise exception 'Invalid grant'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_shop || ':' || p_order_id, 1));
  if exists (select 1 from dollvue_credit_holds where shop=p_shop and order_id=p_order_id)
    then return 'review'; end if;
  select * into previous from dollvue_credit_orders where shop=p_shop and order_id=p_order_id;
  if found then
    if previous.email_hash <> p_email_hash or previous.credits <> p_credits
      or previous.grant_fingerprint <> p_fingerprint then raise exception 'Conflicting grant'; end if;
    return 'duplicate';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_email_hash, 2));
  insert into dollvue_credit_orders(shop,order_id,email_hash,grant_fingerprint,credits)
    values(p_shop,p_order_id,p_email_hash,p_fingerprint,p_credits);
  insert into dollvue_credit_receipts(shop,order_id,email,credits)
    values(p_shop,p_order_id,p_email,p_credits);
  return 'granted';
end $$;

-- A refund/cancellation freezes spending pending review, never invents refund policy.
-- Persist before paid delivery too, so out-of-order callbacks cannot grant credits.
create function public.dollvue_hold_credit_order(p_shop text,p_order_id text,p_reason text)
returns void language plpgsql set search_path = public, pg_temp as $$
declare account_hash text;
begin
  if p_shop is null or p_order_id is null or p_reason is null
    or p_shop !~ '^[a-z0-9][a-z0-9-]*\.myshopify\.com$'
    or p_order_id !~ '^[1-9][0-9]{0,18}$' or p_reason not in ('refund','cancelled')
    then raise exception 'Invalid hold'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_shop || ':' || p_order_id, 1));
  select email_hash into account_hash from dollvue_credit_orders where shop=p_shop and order_id=p_order_id;
  if found then perform pg_advisory_xact_lock(hashtextextended(account_hash, 2)); end if;
  insert into dollvue_credit_holds(shop,order_id,reason) values(p_shop,p_order_id,p_reason)
    on conflict do nothing;
  update dollvue_credit_receipts set status='review' where shop=p_shop and order_id=p_order_id;
end $$;

create function public.dollvue_reserve_preview(p_email_hash text,p_id uuid)
returns text language plpgsql set search_path = public, pg_temp as $$
declare used bigint; paid bigint; pending bigint; previous public.dollvue_credit_reservations;
begin
  if p_email_hash is null or p_email_hash !~ '^[a-f0-9]{64}$' or p_id is null then raise exception 'Invalid reservation'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_email_hash, 2));
  if exists (select 1 from dollvue_credit_orders o join dollvue_credit_holds h
    on o.shop=h.shop and o.order_id=h.order_id where o.email_hash=p_email_hash) then return 'review'; end if;
  update dollvue_credit_reservations set state='released'
    where email_hash=p_email_hash and state='reserved' and expires_at<=now();
  select * into previous from dollvue_credit_reservations where id=p_id;
  if found then
    if previous.email_hash<>p_email_hash then raise exception 'Reservation identity mismatch'; end if;
    return previous.state;
  end if;
  select count(*) into used from ai_usage_events
    where feature='dollvue-preview' and status='success' and user_email_hash=p_email_hash;
  select coalesce(sum(credits),0) into paid from dollvue_credit_orders where email_hash=p_email_hash;
  select count(*) into pending from dollvue_credit_reservations where email_hash=p_email_hash and state='reserved';
  if used+pending>=5+paid then return 'exhausted'; end if;
  insert into dollvue_credit_reservations(id,email_hash) values(p_id,p_email_hash);
  return 'reserved';
end $$;

create function public.dollvue_finish_preview(
  p_email_hash text,p_id uuid,p_success boolean,p_model text,p_metadata jsonb
) returns text language plpgsql set search_path = public, pg_temp as $$
declare previous public.dollvue_credit_reservations;
begin
  if p_email_hash is null or p_email_hash !~ '^[a-f0-9]{64}$' or p_id is null or p_success is null then raise exception 'Invalid completion'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_email_hash, 2));
  select * into previous from dollvue_credit_reservations where id=p_id;
  if not found or previous.email_hash<>p_email_hash then raise exception 'Unknown reservation'; end if;
  if previous.state<>'reserved' then return previous.state; end if;
  if not p_success or previous.expires_at<=now() then
    update dollvue_credit_reservations set state='released' where id=p_id;
    return 'released';
  end if;
  if exists (select 1 from dollvue_credit_orders o join dollvue_credit_holds h
    on o.shop=h.shop and o.order_id=h.order_id where o.email_hash=p_email_hash) then
    update dollvue_credit_reservations set state='released' where id=p_id;
    return 'review';
  end if;
  insert into ai_usage_events(feature,provider,model,route,status,user_email_hash,metadata)
    values('dollvue-preview','venice',p_model,'/dollvue/generate','success',p_email_hash,p_metadata);
  update dollvue_credit_reservations set state='completed',completed_at=now() where id=p_id;
  return 'completed';
end $$;

revoke all on function public.dollvue_grant_paid_credits(text,text,text,text,integer,text),
  public.dollvue_hold_credit_order(text,text,text),public.dollvue_reserve_preview(text,uuid),
  public.dollvue_finish_preview(text,uuid,boolean,text,jsonb) from public,anon,authenticated;
grant execute on function public.dollvue_grant_paid_credits(text,text,text,text,integer,text),
  public.dollvue_hold_credit_order(text,text,text),public.dollvue_reserve_preview(text,uuid),
  public.dollvue_finish_preview(text,uuid,boolean,text,jsonb) to service_role;
