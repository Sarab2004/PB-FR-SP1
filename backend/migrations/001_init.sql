-- فعال‌سازی افزونه‌های ضروری (اگر قبلاً فعال هستند، خطایی نمی‌دهد)
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- نقش‌ها
do $$
begin
  if not exists (select 1 from pg_type where typname = 'role') then
    create type role as enum ('REQUESTER','MANAGER');
  end if;
end$$;

-- وضعیت‌های فرم درخواست کالا از انبار
do $$
begin
  if not exists (select 1 from pg_type where typname = 'wrequest_status') then
    create type wrequest_status as enum ('SUBMITTED','APPROVED','REJECTED','CONVERTED');
  end if;
end$$;

-- وضعیت‌های فرم درخواست خرید
do $$
begin
  if not exists (select 1 from pg_type where typname = 'purchase_status') then
    create type purchase_status as enum ('DRAFT','SUBMITTED','APPROVED','REJECTED');
  end if;
end$$;

-- جدول کاربران داخلی سامانه (مجزا از auth.users)
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique,
  phone         text unique,
  national_id   text unique,
  role          role not null,
  passcode      text not null,      -- برای MVP (در آینده بهتره از Supabase Auth استفاده بشه)
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- جدول درخواست کالا از انبار
create table if not exists public.warehouse_requests (
  id             uuid primary key default gen_random_uuid(),
  requester_id   uuid references public.users(id) on delete set null,
  title          text not null,
  description    text,
  item_code      text,              -- کد کالا
  specs          text,              -- مشخصات فنی
  usage_location text,              -- مکان مصرف
  priority       text,              -- اولویت (مثلاً LOW/MEDIUM/HIGH)
  items          jsonb not null,    -- آرایه‌ای از آیتم‌ها: [{ sku, name, qty, unit }, ...]
  required_date  date,
  status         wrequest_status default 'SUBMITTED',
  locked_at      timestamptz,
  created_at     timestamptz default now()
);

-- جدول درخواست خرید (توسط انباردار)
create table if not exists public.purchase_requests (
  id                  uuid primary key default gen_random_uuid(),
  source_wrequest_id  uuid unique references public.warehouse_requests(id) on delete set null,
  manager_id          uuid references public.users(id) on delete set null,
  items               jsonb not null,  -- از روی WR پر می‌شود، انباردار می‌تواند تکمیل/اصلاح کند
  vendor              text,
  total               numeric,
  usage_location      text,
  priority            text,
  status              purchase_status default 'DRAFT',
  created_at          timestamptz default now()
);

-- جدول لاگ عملیات (برای ردیابی اتفاقات مهم)
create table if not exists public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references public.users(id) on delete set null,
  entity     text not null,   -- 'WarehouseRequest' | 'PurchaseRequest' | ...
  entity_id  uuid not null,
  action     text not null,   -- 'CREATE' | 'APPROVE' | 'REJECT' | 'CONVERT' | ...
  payload    jsonb,
  at         timestamptz default now()
);

-- ایندکس‌های کاربردی
create index if not exists idx_users_role           on public.users(role);
create index if not exists idx_wreq_status          on public.warehouse_requests(status);
create index if not exists idx_wreq_created_at      on public.warehouse_requests(created_at);
create index if not exists idx_preq_status          on public.purchase_requests(status);
create index if not exists idx_preq_created_at      on public.purchase_requests(created_at);
