alter table approved_vendors
  add column if not exists market text,
  add column if not exists trust_tier text not null default 'manual_review',
  add column if not exists doll_forum_vendor boolean not null default false,
  add column if not exists auto_match_enabled boolean not null default false,
  add column if not exists promo_parsing_mode text not null default 'manual_review',
  add column if not exists last_reviewed_at timestamptz;

update approved_vendors
set market = coalesce(market, region)
where market is null and region is not null;

update approved_vendors
set
  trust_tier = case
    when trust_status = 'owned' then 'owned'
    when trust_status = 'trusted' then 'trusted'
    else trust_tier
  end,
  auto_match_enabled = case
    when trust_status = 'owned' and allowed_for_price_match then true
    else auto_match_enabled
  end,
  promo_parsing_mode = case
    when trust_status = 'owned' then 'owned_site_review'
    else promo_parsing_mode
  end;

insert into approved_vendors (
  domain,
  display_name,
  market,
  trust_status,
  trust_tier,
  allowed_for_price_match,
  auto_match_enabled,
  promo_parsing_mode,
  notes,
  last_reviewed_at
)
values
  (
    'rosemarydoll.com',
    'RosemaryDoll',
    'US/EU',
    'owned',
    'owned',
    true,
    true,
    'owned_site_review',
    'Owned/approved source. Promo-heavy or configured-cart quotes still require team review until option-level verification is stronger.',
    now()
  ),
  (
    'joylovedolls.com',
    'Joy Love Dolls',
    'US/EU',
    'owned',
    'owned',
    true,
    true,
    'owned_site_review',
    'Owned/approved source. Promo-heavy or configured-cart quotes still require team review until option-level verification is stronger.',
    now()
  )
on conflict (domain) do update
set
  display_name = excluded.display_name,
  market = coalesce(approved_vendors.market, excluded.market),
  trust_status = excluded.trust_status,
  trust_tier = excluded.trust_tier,
  allowed_for_price_match = excluded.allowed_for_price_match,
  auto_match_enabled = excluded.auto_match_enabled,
  promo_parsing_mode = excluded.promo_parsing_mode,
  notes = coalesce(approved_vendors.notes, excluded.notes),
  last_reviewed_at = coalesce(approved_vendors.last_reviewed_at, excluded.last_reviewed_at);

create index if not exists approved_vendors_auto_match_idx
  on approved_vendors (auto_match_enabled, domain);
