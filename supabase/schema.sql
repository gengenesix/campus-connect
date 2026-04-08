-- ============================================================
-- Campus Connect — Supabase Schema (v2 — production)
-- Run this in the Supabase SQL Editor (safe to re-run)
-- ============================================================

-- ============================================================
-- FRESH START — wipe all data before rebuilding
-- Deleting auth.users cascades to profiles → products →
-- services → bookings → messages → reviews automatically.
-- ============================================================
delete from auth.users;
truncate public.reviews   restart identity cascade;
truncate public.messages  restart identity cascade;
truncate public.bookings  restart identity cascade;
truncate public.services  restart identity cascade;
truncate public.products  restart identity cascade;
truncate public.profiles  restart identity cascade;

create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  department text,
  course text,           -- programme / degree e.g. BSc Mining Engineering
  class_year text,       -- Year 1 / Year 2 / ... / Postgraduate / PhD
  hostel text,
  phone text,
  bio text,
  avatar_url text,
  role text default 'buyer' check (role in ('buyer', 'seller', 'provider', 'admin')),
  rating numeric(3,2) default 0.0,
  total_reviews int default 0,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add new columns to existing deployments (safe — ignored if columns already exist)
alter table public.profiles add column if not exists course text;
alter table public.profiles add column if not exists class_year text;
alter table public.profiles add column if not exists is_banned boolean default false;

-- Auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- PRODUCTS (Goods for sale)
-- ============================================================
create table if not exists public.products (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  condition text check (condition in ('New', 'Like New', 'Good', 'Fair')),
  category text check (category in ('Electronics', 'Clothing', 'Books', 'Furniture', 'Sports', 'Other')),
  image_url text,
  whatsapp text,
  status text default 'active' check (status in ('active', 'sold', 'paused', 'deleted')),
  views int default 0,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SERVICES
-- ============================================================
create table if not exists public.services (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  category text check (category in ('Barbing', 'Tutoring', 'Photography', 'Laundry', 'Tech Repair', 'Design', 'Other')),
  rate text,
  availability text,
  response_time text,
  image_url text,
  whatsapp text,
  status text default 'active' check (status in ('active', 'paused', 'deleted')),
  total_bookings int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table if not exists public.bookings (
  id uuid default uuid_generate_v4() primary key,
  service_id uuid references public.services(id) on delete cascade not null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  provider_id uuid references public.profiles(id) not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  scheduled_date date,
  total_price numeric(10,2),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Conversations view — uses security_invoker so it respects the RLS
-- on the underlying messages table (prevents anonymous data access)
create or replace view public.conversations
  with (security_invoker = true)
as
select distinct on (
    least(sender_id, receiver_id),
    greatest(sender_id, receiver_id)
  )
  id,
  sender_id,
  receiver_id,
  product_id,
  service_id,
  content,
  is_read,
  created_at
from public.messages
order by
  least(sender_id, receiver_id),
  greatest(sender_id, receiver_id),
  created_at desc;

-- ============================================================
-- REVIEWS
-- ============================================================
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  target_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique (reviewer_id, target_id, product_id),
  unique (reviewer_id, target_id, service_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- ============================================================
-- HELPER: is_admin()
-- Used in RLS policies so admin can manage all records.
-- security definer + stable avoids RLS recursion.
-- ============================================================
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Returns true if the current user is NOT banned
create or replace function public.is_not_banned()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (is_banned is null or is_banned = false)
  );
$$ language sql security definer stable;

-- ============================================================
-- DROP EXISTING POLICIES (idempotent)
-- ============================================================
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Admins can ban users" on public.profiles;
drop policy if exists "Users can create own profile" on public.profiles;
drop policy if exists "Active products are viewable by everyone" on public.products;
drop policy if exists "Users can insert own products (unbanned)" on public.products;
drop policy if exists "Users can insert own products" on public.products;
drop policy if exists "Sellers can update own products" on public.products;
drop policy if exists "Sellers can delete own products" on public.products;
drop policy if exists "Admins can manage all products" on public.products;
drop policy if exists "Active services are viewable by everyone" on public.services;
drop policy if exists "Providers can insert own services (unbanned)" on public.services;
drop policy if exists "Providers can insert own services" on public.services;
drop policy if exists "Providers can update own services" on public.services;
drop policy if exists "Providers can delete own services" on public.services;
drop policy if exists "Admins can manage all services" on public.services;
drop policy if exists "Users can view own bookings" on public.bookings;
drop policy if exists "Buyers can create bookings" on public.bookings;
drop policy if exists "Participants can update booking status" on public.bookings;
drop policy if exists "Users can view own messages" on public.messages;
drop policy if exists "Authenticated users can send messages" on public.messages;
drop policy if exists "Receiver can mark messages as read" on public.messages;
drop policy if exists "Reviews are public" on public.reviews;
drop policy if exists "Authenticated users can write reviews" on public.reviews;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Users can insert their own profile row (needed when trigger hasn't run yet)
create policy "Users can create own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Admins can update anyone's profile (e.g. set is_verified)
create policy "Admins can update any profile" on public.profiles
  for update using (public.is_admin());

-- ============================================================
-- PRODUCTS POLICIES
-- ============================================================
create policy "Active products are viewable by everyone" on public.products
  for select using (status != 'deleted');

create policy "Users can insert own products" on public.products
  for insert with check (auth.uid() = seller_id and public.is_not_banned());

create policy "Sellers can update own products" on public.products
  for update using (auth.uid() = seller_id);

create policy "Sellers can delete own products" on public.products
  for delete using (auth.uid() = seller_id);

create policy "Admins can manage all products" on public.products
  for all using (public.is_admin());

-- ============================================================
-- SERVICES POLICIES
-- ============================================================
create policy "Active services are viewable by everyone" on public.services
  for select using (status != 'deleted');

create policy "Providers can insert own services" on public.services
  for insert with check (auth.uid() = provider_id and public.is_not_banned());

create policy "Providers can update own services" on public.services
  for update using (auth.uid() = provider_id);

create policy "Providers can delete own services" on public.services
  for delete using (auth.uid() = provider_id);

create policy "Admins can manage all services" on public.services
  for all using (public.is_admin());

-- ============================================================
-- BOOKINGS POLICIES
-- ============================================================
create policy "Users can view own bookings" on public.bookings
  for select using (auth.uid() = buyer_id or auth.uid() = provider_id);

create policy "Buyers can create bookings" on public.bookings
  for insert with check (auth.uid() = buyer_id);

create policy "Participants can update booking status" on public.bookings
  for update using (auth.uid() = buyer_id or auth.uid() = provider_id);

-- ============================================================
-- MESSAGES POLICIES
-- ============================================================
create policy "Users can view own messages" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Authenticated users can send messages" on public.messages
  for insert with check (auth.uid() = sender_id);

create policy "Receiver can mark messages as read" on public.messages
  for update using (auth.uid() = receiver_id);

-- ============================================================
-- REVIEWS POLICIES
-- ============================================================
create policy "Reviews are public" on public.reviews
  for select using (true);

create policy "Authenticated users can write reviews" on public.reviews
  for insert with check (auth.uid() = reviewer_id);

-- ============================================================
-- ADMIN MODERATION POLICIES
-- These give the admin full read/delete access to all content
-- for moderation. Without these, admin can see listings but not
-- messages, bookings, or reviews.
-- ============================================================
drop policy if exists "Admins can read all messages" on public.messages;
create policy "Admins can read all messages" on public.messages
  for select using (public.is_admin());

drop policy if exists "Admins can delete any message" on public.messages;
create policy "Admins can delete any message" on public.messages
  for delete using (public.is_admin());

drop policy if exists "Admins can manage all bookings" on public.bookings;
create policy "Admins can manage all bookings" on public.bookings
  for all using (public.is_admin());

drop policy if exists "Admins can manage all reviews" on public.reviews;
create policy "Admins can manage all reviews" on public.reviews
  for all using (public.is_admin());

-- Lets admin permanently delete a user account (not just ban them)
drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles
  for delete using (public.is_admin());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('service-images', 'service-images', true)
  on conflict (id) do nothing;

-- Storage RLS
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;
drop policy if exists "Product images are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Users can delete own product images" on storage.objects;
drop policy if exists "Service images are publicly accessible" on storage.objects;
drop policy if exists "Authenticated users can upload service images" on storage.objects;
drop policy if exists "Users can delete own service images" on storage.objects;

create policy "Avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');
create policy "Users can upload their own avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Users can update their own avatar" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can delete their own avatar" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Product images are publicly accessible" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "Authenticated users can upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');
create policy "Users can delete own product images" on storage.objects
  for delete using (bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Service images are publicly accessible" on storage.objects
  for select using (bucket_id = 'service-images');
create policy "Authenticated users can upload service images" on storage.objects
  for insert with check (bucket_id = 'service-images' and auth.role() = 'authenticated');
create policy "Users can delete own service images" on storage.objects
  for delete using (bucket_id = 'service-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- REALTIME
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'bookings'
  ) then
    alter publication supabase_realtime add table public.bookings;
  end if;
end $$;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists products_seller_id_idx on public.products(seller_id);
create index if not exists products_category_idx on public.products(category);
create index if not exists products_status_idx on public.products(status);
create index if not exists services_provider_id_idx on public.services(provider_id);
create index if not exists services_category_idx on public.services(category);
create index if not exists messages_sender_id_idx on public.messages(sender_id);
create index if not exists messages_receiver_id_idx on public.messages(receiver_id);
create index if not exists messages_created_at_idx on public.messages(created_at desc);
-- Composite index speeds up the conversation-list query (sender_id OR receiver_id)
create index if not exists messages_conversation_idx on public.messages(sender_id, receiver_id, created_at desc);
create index if not exists bookings_buyer_id_idx on public.bookings(buyer_id);
create index if not exists bookings_provider_id_idx on public.bookings(provider_id);
create index if not exists profiles_is_verified_idx on public.profiles(is_verified);
create index if not exists profiles_role_idx on public.profiles(role);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists handle_updated_at on public.profiles;
drop trigger if exists handle_updated_at on public.products;
drop trigger if exists handle_updated_at on public.services;
drop trigger if exists handle_updated_at on public.bookings;

create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.products
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.services
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.bookings
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- INCREMENT PRODUCT VIEWS
-- ============================================================
create or replace function public.increment_product_views(product_id uuid)
returns void as $$
begin
  update public.products set views = views + 1 where id = product_id;
end;
$$ language plpgsql security definer;
