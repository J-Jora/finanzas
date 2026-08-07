-- 1. Tabla de Perfiles (Se autogenera al registrar un usuario)
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id)
);

-- Habilitar Row Level Security para Perfiles
alter table public.profiles enable row level security;
create policy "Usuarios pueden ver su propio perfil" on profiles for select using ( auth.uid() = id );
create policy "Usuarios pueden actualizar su perfil" on profiles for update using ( auth.uid() = id );

-- Trigger para crear perfil automáticamente
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Tabla de Categorías
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('INCOME', 'EXPENSE')),
  icon text,
  is_system boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;
create policy "Usuarios ven sus categorías" on categories for select using ( auth.uid() = user_id );
create policy "Usuarios insertan sus categorías" on categories for insert with check ( auth.uid() = user_id );
create policy "Usuarios actualizan sus categorías" on categories for update using ( auth.uid() = user_id );
create policy "Usuarios eliminan sus categorías" on categories for delete using ( auth.uid() = user_id );


-- 3. Tabla de Transacciones
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete restrict,
  amount numeric(12,2) not null check (amount >= 0),
  date timestamp with time zone not null,
  description text,
  type text not null check (type in ('INCOME', 'EXPENSE')),
  is_synced boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;
create policy "Usuarios ven sus transacciones" on transactions for select using ( auth.uid() = user_id );
create policy "Usuarios insertan sus transacciones" on transactions for insert with check ( auth.uid() = user_id );
create policy "Usuarios actualizan sus transacciones" on transactions for update using ( auth.uid() = user_id );
create policy "Usuarios eliminan sus transacciones" on transactions for delete using ( auth.uid() = user_id );
