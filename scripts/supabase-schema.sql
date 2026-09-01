-- ============================================
-- 屿航 - Supabase 数据表（在 Supabase 后台 SQL Editor 运行一次）
-- 隐私设计：所有个人表启用 RLS 行级权限，每行绑定 user_id，
--           只有本人能读/写；官方（网站所有者）通过 API 也看不到个人数据。
-- ============================================

-- 1) 收藏表（个人专属）
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id text not null,
  created_at timestamptz default now(),
  unique (user_id, site_id)
);
alter table public.favorites enable row level security;
create policy "收藏仅本人可见可增删" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) 点击统计表（个人专属）
create table if not exists public.clicks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id text not null,
  count integer not null default 1,
  updated_at timestamptz default now(),
  unique (user_id, site_id)
);
alter table public.clicks enable row level security;
create policy "点击仅本人可见" on public.clicks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) 个人网站表（个人专属）
create table if not exists public.personal_sites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  url text not null,
  brief text default '',
  tags text[] default '{}',
  created_at timestamptz default now()
);
alter table public.personal_sites enable row level security;
create policy "个人网站仅本人可见" on public.personal_sites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4) 全站统计函数：只返回聚合数字（收藏数/点击总数），不暴露任何个人数据
create or replace function public.get_site_stats()
returns table (site_id text, favorite_count bigint, click_total bigint)
language sql security definer stable as $$
  select f.site_id, count(f.id)::bigint as favorite_count, 0::bigint as click_total
  from public.favorites f group by f.site_id
  union all
  select c.site_id, 0::bigint, sum(c.count)::bigint
  from public.clicks c group by c.site_id
$$;

-- 5) 官方网站反馈表
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id text not null,
  message text not null,
  created_at timestamptz default now()
);
alter table public.feedback enable row level security;
create policy "反馈可提交本人记录" on public.feedback
  for insert with check (auth.uid() = user_id);
create policy "反馈本人可见" on public.feedback
  for select using (auth.uid() = user_id);

-- 6) 站长反馈接口（后台管理页查看/删除反馈用）
--    ★ 站长邮箱：改成你自己的账号邮箱（与 web/admin/admin.js 里的 ADMIN_EMAIL 保持一致）
--    SECURITY DEFINER 让函数可以读取 auth.users 关联提交者邮箱；
--    函数内部校验当前登录人 JWT 邮箱是否为站长，非站长调用返回空 / false。
create or replace function public.get_all_feedback()
returns table (id uuid, site_id text, message text, created_at timestamptz, user_email text)
language sql security definer stable
set search_path = public as $$
  select f.id, f.site_id, f.message, f.created_at,
         (select u.email from auth.users u where u.id = f.user_id) as user_email
  from public.feedback f
  where (auth.jwt() ->> 'email') = 'xvwang99@126.com'   -- ← 站长邮箱，按需修改
  order by f.created_at desc
$$;

create or replace function public.delete_feedback(fid uuid)
returns boolean
language plpgsql security definer
set search_path = public as $$
begin
  if (auth.jwt() ->> 'email') <> 'xvwang99@126.com' then -- ← 站长邮箱，按需修改
    return false;
  end if;
  delete from public.feedback where id = fid;
  return found;
end;
$$;
