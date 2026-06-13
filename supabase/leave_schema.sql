-- 연차관리 테이블 (Supabase SQL Editor에서 customer_notes 다음에 실행)

create table if not exists public.employees (
  id text primary key,
  name text not null,
  role text not null default '직원',
  pin text not null default '',
  is_japanese_available boolean not null default false,
  is_active boolean not null default true,
  annual_days numeric(5, 1) not null default 0
);

create table if not exists public.leave_requests (
  id text primary key,
  employee_id text not null references public.employees(id) on delete cascade,
  date date not null,
  type text not null,
  start_time text not null default '',
  end_time text not null default '',
  reason text not null default '',
  status text not null default 'requested',
  manager_memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leave_requests_employee_id_idx
  on public.leave_requests (employee_id);

create index if not exists leave_requests_date_idx
  on public.leave_requests (date);

alter table public.employees enable row level security;
alter table public.leave_requests enable row level security;

drop policy if exists "employees_anon_all" on public.employees;
create policy "employees_anon_all"
  on public.employees for all to anon, authenticated
  using (true) with check (true);

drop policy if exists "leave_requests_anon_all" on public.leave_requests;
create policy "leave_requests_anon_all"
  on public.leave_requests for all to anon, authenticated
  using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.employees to anon, authenticated;
grant select, insert, update, delete on public.leave_requests to anon, authenticated;
