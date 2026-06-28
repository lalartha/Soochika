alter type request_type add value if not exists 'death_report';

alter table beneficiaries
  add column if not exists data_collected_at date not null default current_date,
  add column if not exists is_deceased boolean not null default false,
  add column if not exists death_date date,
  add column if not exists death_approved_by uuid references users(id) on delete set null,
  add column if not exists death_approved_at timestamptz;

create index if not exists idx_beneficiaries_collection_date on beneficiaries(data_collected_at);
create index if not exists idx_beneficiaries_deceased on beneficiaries(is_deceased);
