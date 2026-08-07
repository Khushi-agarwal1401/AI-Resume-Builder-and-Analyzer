-- Exports table for tracking resume export history
create table if not exists public.exports (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    resume_id uuid not null references public.resumes(id) on delete cascade,
    format text not null, -- pdf, docx, txt, etc.
    template text not null,
    file_size bigint,
    url text, -- signed URL or storage path
    created_at timestamptz default now()
);

-- RLS
alter table public.exports enable row level security;

create policy "Users can view their own exports"
    on public.exports for select
    using (auth.uid() = user_id);

create policy "Users can insert their own exports"
    on public.exports for insert
    with check (auth.uid() = user_id);

create policy "Users can delete their own exports"
    on public.exports for delete
    using (auth.uid() = user_id);

-- Index for resume lookups
create index if not exists idx_exports_resume_id on public.exports(resume_id);
create index if not exists idx_exports_user_id on public.exports(user_id);