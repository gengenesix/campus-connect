-- ============================================================
-- Campus Connect — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  department text,
  hostel text,
  phone text,
  bio text,
  avatar_url text,
  role text default 'buyer' check (role in ('buyer', 'seller', 'provider', 'admin')),
  rating numeric(3,2) default 5.0,
  total_reviews int default 0,
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on user signup
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- PRODUCTS (Goods for sale)
-- ============================================================
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  condition text check (condition in ('New', 'Like New', 'Good', 'Fair')),
  category text check (category in ('Electronics', 'Clothing', 'Books', 'Furniture', 'Sports', 'Other')),
  images text[] default '{}',
  status text default 'active' check (status in ('active', 'sold', 'paused', 'deleted')),
  views int default 0,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- SERVICES
-- ============================================================
create table public.services (
  id uuid default uuid_generate_v4() primary key,
  provider_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  category text check (category in ('Barbing', 'Tutoring', 'Photography', 'Laundry', 'Tech Repair', 'Design', 'Other')),
  rate_min numeric(10,2),
  rate_max numeric(10,2),
  rate_label text,
  availability text,
  response_time text,
  images text[] default '{}',
  status text default 'active' check (status in ('active', 'paused', 'deleted')),
  total_bookings int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- BOOKINGS
-- ============================================================
create table public.bookings (
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
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Conversation view (latest message per pair)
create or replace view public.conversations as
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
create table public.reviews (
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
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;

-- PROFILES: anyone can read, only owner can update
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- PRODUCTS: anyone can read active listings
create policy "Active products are viewable by everyone" on public.products
  for select using (status != 'deleted');

create policy "Users can insert own products" on public.products
  for insert with check (auth.uid() = seller_id);

create policy "Sellers can update own products" on public.products
  for update using (auth.uid() = seller_id);

-- SERVICES: anyone can read active services
create policy "Active services are viewable by everyone" on public.services
  for select using (status != 'deleted');

create policy "Providers can insert own services" on public.services
  for insert with check (auth.uid() = provider_id);

create policy "Providers can update own services" on public.services
  for update using (auth.uid() = provider_id);

-- BOOKINGS: buyer and provider can see their bookings
create policy "Users can view own bookings" on public.bookings
  for select using (auth.uid() = buyer_id or auth.uid() = provider_id);

create policy "Buyers can create bookings" on public.bookings
  for insert with check (auth.uid() = buyer_id);

create policy "Participants can update booking status" on public.bookings
  for update using (auth.uid() = buyer_id or auth.uid() = provider_id);

-- MESSAGES: only sender and receiver can see
create policy "Users can view own messages" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Authenticated users can send messages" on public.messages
  for insert with check (auth.uid() = sender_id);

create policy "Receiver can mark messages as read" on public.messages
  for update using (auth.uid() = receiver_id);

-- REVIEWS: anyone can read, authenticated users can write
create policy "Reviews are public" on public.reviews
  for select using (true);

create policy "Authenticated users can write reviews" on public.reviews
  for insert with check (auth.uid() = reviewer_id);

-- ============================================================
-- STORAGE BUCKETS (run separately in Supabase dashboard or via CLI)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true);
-- insert into storage.buckets (id, name, public) values ('service-images', 'service-images', true);

-- Storage RLS
-- create policy "Avatar images are publicly accessible" on storage.objects for select using (bucket_id = 'avatars');
-- create policy "Anyone can upload an avatar" on storage.objects for insert with check (bucket_id = 'avatars');
-- create policy "Product images are publicly accessible" on storage.objects for select using (bucket_id = 'product-images');
-- create policy "Authenticated users can upload product images" on storage.objects for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- ============================================================
-- REALTIME (run these in the Supabase SQL Editor)
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.bookings;

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index products_seller_id_idx on public.products(seller_id);
create index products_category_idx on public.products(category);
create index products_status_idx on public.products(status);
create index services_provider_id_idx on public.services(provider_id);
create index services_category_idx on public.services(category);
create index messages_sender_id_idx on public.messages(sender_id);
create index messages_receiver_id_idx on public.messages(receiver_id);
create index messages_created_at_idx on public.messages(created_at desc);
create index bookings_buyer_id_idx on public.bookings(buyer_id);
create index bookings_provider_id_idx on public.bookings(provider_id);

-- ============================================================
-- UPDATED_AT trigger function
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.products
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.services
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at before update on public.bookings
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- UPDATE PRODUCT VIEWS (increment safely)
-- ============================================================
create or replace function public.increment_product_views(product_id uuid)
returns void as $$
begin
  update public.products set views = views + 1 where id = product_id;
end;
$$ language plpgsql security definer;
