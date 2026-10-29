begin;
-- Allowance and submission attribution must not trust anonymous usage writes.
-- Both existing tables are accessed only through the server service-role client.
alter table public.ai_usage_events enable row level security;
revoke all on public.ai_usage_events from public, anon, authenticated;
grant select, insert, update on public.ai_usage_events to service_role;
create table public.dollvue_submissions (
  id uuid primary key,
  email text not null check (length(email) <= 180),
  email_hash text not null,
  product_handle text not null,
  product_name text not null,
  brand text,
  head_code text,
  body_code text,
  submitted_at timestamptz not null default now(),
  delivery_status text not null default 'pending' check (delivery_status in ('pending','accepted','failed')),
  delivery_provider text,
  verified_at timestamptz,
  generated_at timestamptz,
  selected_option_count integer,
  selected_options jsonb,
  usage_event_id uuid unique references public.ai_usage_events(id)
);
alter table public.dollvue_submissions enable row level security;
revoke all on public.dollvue_submissions from public, anon, authenticated;
grant select, insert, update on public.dollvue_submissions to service_role;
create index dollvue_submissions_email_product_idx on public.dollvue_submissions(email_hash, product_handle, submitted_at desc);

-- Existing generation events have no submission ID. Attribute an event only to
-- the latest verified matching email/product submission, never reverse a hash.
create function public.attach_dollvue_submission_usage() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.feature = 'dollvue-preview' and new.status = 'success' then
    update public.dollvue_submissions set generated_at = new.created_at,
      selected_option_count = case when new.metadata->>'selection_count' ~ '^[0-9]{1,2}$'
        then (new.metadata->>'selection_count')::integer else null end,
      selected_options = new.metadata->'selected_options', usage_event_id = new.id
    where id = (select id from public.dollvue_submissions
      where email_hash = new.user_email_hash and product_handle = new.metadata->>'product_handle'
        and verified_at is not null and verified_at <= new.created_at and generated_at is null
      order by verified_at desc limit 1);
  end if;
  return new;
end $$;
revoke all on function public.attach_dollvue_submission_usage() from public, anon, authenticated;
create trigger dollvue_submission_usage after insert on public.ai_usage_events
  for each row execute function public.attach_dollvue_submission_usage();
commit;
