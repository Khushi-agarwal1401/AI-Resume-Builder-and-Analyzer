-- References table for Reference Manager feature
create table if not exists public.references (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    title text not null,
    company text not null,
    email text not null,
    phone text,
    relationship text,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS
alter table public.references enable row level security;

create policy "Users can view their own references"
    on public.references for select
    using (auth.uid() = user_id);

create policy "Users can insert their own references"
    on public.references for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own references"
    on public.references for update
    using (auth.uid() = user_id);

create policy "Users can delete their own references"
    on public.references for delete
    using (auth.uid() = user_id);

-- Index for user lookups
create index if not exists idx_references_user_id on public.references(user_id);

-- Updated_at trigger
create trigger update_references_updated_at
    before update on public.references
    for each row
    execute function update_updated_at_column();