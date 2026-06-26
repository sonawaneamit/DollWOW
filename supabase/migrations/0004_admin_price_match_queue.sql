alter table comparison_requests
  add column if not exists admin_status text not null default 'new',
  add column if not exists admin_notes text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text;

create index if not exists comparison_requests_admin_status_idx
  on comparison_requests (admin_status, created_at desc);
