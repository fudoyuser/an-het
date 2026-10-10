-- =====================================================================
-- ĂN HẾT — cấu trúc database (chạy 1 lần trong Supabase > SQL Editor)
-- Trình duyệt KHÔNG được đọc/ghi bảng trực tiếp; mọi thao tác đi qua
-- các hàm bên dưới. Mã quản lý chỉ lưu dạng băm (sha256).
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

-- ---------- Bảng tin đăng ----------
create table if not exists public.listings (
  id               uuid primary key default gen_random_uuid(),
  shop_name        text not null check (char_length(shop_name) between 2 and 80),
  dish_name        text not null check (char_length(dish_name) between 2 and 100),
  quantity         int  not null check (quantity between 0 and 999),
  original_price   int  not null check (original_price between 1000 and 10000000),
  discount_price   int  not null check (discount_price >= 0 and discount_price < original_price),
  area             text not null check (char_length(area) between 1 and 60),
  address          text not null check (char_length(address) between 3 and 200),
  contact_phone    text not null check (contact_phone ~ '^0[0-9]{9}$'),
  expires_at       timestamptz not null,
  manage_code_hash text not null unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists listings_expires_at_idx on public.listings (expires_at);

alter table public.listings enable row level security;
revoke all on public.listings from anon, authenticated;

-- ---------- Cấu hình admin (không lộ ra API) ----------
create table if not exists private.admin_settings (
  id       int primary key default 1 check (id = 1),
  key_hash text not null
);

-- ---------- Hàm nội bộ ----------
create or replace function private.hash_code(p_code text)
returns text language sql immutable as $$
  select encode(extensions.digest(upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g')), 'sha256'), 'hex');
$$;

create or replace function private.gen_manage_code()
returns text language plpgsql volatile as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- bỏ I, O, 0, 1 cho dễ đọc
  b bytea := extensions.gen_random_bytes(8);
  result text := '';
begin
  for i in 0..7 loop
    result := result || substr(alphabet, (get_byte(b, i) % 32) + 1, 1);
  end loop;
  return result;
end $$;

create or replace function private.check_expiry(p_expires_at timestamptz)
returns void language plpgsql as $$
begin
  if p_expires_at < now() + interval '10 minutes' then
    raise exception 'EXPIRES_TOO_SOON';
  end if;
  if p_expires_at > now() + interval '24 hours' then
    raise exception 'EXPIRES_TOO_LATE';
  end if;
end $$;

create or replace function private.check_admin(p_key text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from private.admin_settings
    where key_hash = encode(extensions.digest(coalesce(p_key, ''), 'sha256'), 'hex')
  ) then
    raise exception 'NOT_ADMIN';
  end if;
end $$;

-- ---------- API công khai ----------

-- Danh sách tin còn hiệu lực (còn hạn và còn hàng)
create or replace function public.get_active_listings()
returns table (
  id uuid, shop_name text, dish_name text, quantity int,
  original_price int, discount_price int, area text, address text,
  contact_phone text, expires_at timestamptz, created_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select l.id, l.shop_name, l.dish_name, l.quantity, l.original_price, l.discount_price,
         l.area, l.address, l.contact_phone, l.expires_at, l.created_at
  from public.listings l
  where l.expires_at > now() and l.quantity > 0
  order by l.expires_at asc
  limit 500;
$$;

-- Đăng tin mới, trả về id + mã quản lý (mã chỉ hiển thị 1 lần)
create or replace function public.create_listing(
  p_shop_name text, p_dish_name text, p_quantity int,
  p_original_price int, p_discount_price int,
  p_area text, p_address text, p_contact_phone text, p_expires_at timestamptz
)
returns table (id uuid, manage_code text)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_code text := private.gen_manage_code();
  v_id uuid;
begin
  perform private.check_expiry(p_expires_at);
  insert into public.listings (
    shop_name, dish_name, quantity, original_price, discount_price,
    area, address, contact_phone, expires_at, manage_code_hash
  ) values (
    trim(p_shop_name), trim(p_dish_name), p_quantity, p_original_price, p_discount_price,
    trim(p_area), trim(p_address), trim(p_contact_phone), p_expires_at, private.hash_code(v_code)
  ) returning listings.id into v_id;
  return query select v_id, v_code;
end $$;

-- Xem tin của mình bằng mã quản lý (kể cả tin đã hết hạn)
create or replace function public.get_my_listing(p_code text)
returns table (
  id uuid, shop_name text, dish_name text, quantity int,
  original_price int, discount_price int, area text, address text,
  contact_phone text, expires_at timestamptz, created_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select l.id, l.shop_name, l.dish_name, l.quantity, l.original_price, l.discount_price,
         l.area, l.address, l.contact_phone, l.expires_at, l.created_at
  from public.listings l
  where l.manage_code_hash = private.hash_code(p_code);
$$;

-- Sửa tin (dùng cả cho "Đã bán hết": quantity = 0)
create or replace function public.update_my_listing(
  p_code text, p_shop_name text, p_dish_name text, p_quantity int,
  p_original_price int, p_discount_price int,
  p_area text, p_address text, p_contact_phone text, p_expires_at timestamptz
)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_old_expires timestamptz;
begin
  select expires_at into v_old_expires from public.listings
  where manage_code_hash = private.hash_code(p_code);
  if not found then
    raise exception 'CODE_NOT_FOUND';
  end if;
  -- Chỉ kiểm tra thời hạn khi chủ quán đổi giờ hết hiệu lực
  if p_expires_at is distinct from v_old_expires then
    perform private.check_expiry(p_expires_at);
  end if;
  update public.listings set
    shop_name = trim(p_shop_name), dish_name = trim(p_dish_name), quantity = p_quantity,
    original_price = p_original_price, discount_price = p_discount_price,
    area = trim(p_area), address = trim(p_address), contact_phone = trim(p_contact_phone),
    expires_at = p_expires_at, updated_at = now()
  where manage_code_hash = private.hash_code(p_code);
end $$;

-- Xóa tin
create or replace function public.delete_my_listing(p_code text)
returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  delete from public.listings where manage_code_hash = private.hash_code(p_code);
  if not found then
    raise exception 'CODE_NOT_FOUND';
  end if;
end $$;

-- ---------- API admin ----------
create or replace function public.admin_list_listings(p_key text)
returns table (
  id uuid, shop_name text, dish_name text, quantity int,
  original_price int, discount_price int, area text, address text,
  contact_phone text, expires_at timestamptz, created_at timestamptz
)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.check_admin(p_key);
  return query
    select l.id, l.shop_name, l.dish_name, l.quantity, l.original_price, l.discount_price,
           l.area, l.address, l.contact_phone, l.expires_at, l.created_at
    from public.listings l
    where l.created_at > now() - interval '7 days'
    order by l.created_at desc;
end $$;

create or replace function public.admin_delete_listing(p_key text, p_id uuid)
returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform private.check_admin(p_key);
  delete from public.listings where id = p_id;
end $$;

-- Đặt mật khẩu admin — CHỈ chạy được trong SQL Editor, không gọi được từ web
create or replace function public.set_admin_key(p_key text)
returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if char_length(coalesce(p_key, '')) < 12 then
    raise exception 'Mật khẩu admin cần ít nhất 12 ký tự';
  end if;
  insert into private.admin_settings (id, key_hash)
  values (1, encode(extensions.digest(p_key, 'sha256'), 'hex'))
  on conflict (id) do update set key_hash = excluded.key_hash;
end $$;

-- ---------- Phân quyền ----------
revoke all on schema private from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

revoke execute on function
  public.get_active_listings(),
  public.create_listing(text, text, int, int, int, text, text, text, timestamptz),
  public.get_my_listing(text),
  public.update_my_listing(text, text, text, int, int, int, text, text, text, timestamptz),
  public.delete_my_listing(text),
  public.admin_list_listings(text),
  public.admin_delete_listing(text, uuid),
  public.set_admin_key(text)
from public, anon, authenticated;

grant execute on function
  public.get_active_listings(),
  public.create_listing(text, text, int, int, int, text, text, text, timestamptz),
  public.get_my_listing(text),
  public.update_my_listing(text, text, text, int, int, int, text, text, text, timestamptz),
  public.delete_my_listing(text),
  public.admin_list_listings(text),
  public.admin_delete_listing(text, uuid)
to anon, authenticated;
-- set_admin_key cố ý KHÔNG được grant cho anon/authenticated.
