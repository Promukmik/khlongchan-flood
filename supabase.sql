-- =====================================================================
--  น้ำท่วมแฟลตคลองจั่น — ฐานข้อมูล Supabase
--  วิธีใช้: Supabase > SQL Editor > New query > วางทั้งไฟล์นี้ > Run
--  รันซ้ำได้ (จะไม่ลบข้อมูลรายงานที่มีอยู่)
-- =====================================================================

-- ---------- ตาราง ----------
create table if not exists public.buildings (
  id          text primary key,
  name        text not null,
  lat         double precision,
  lng         double precision,
  px          integer,             -- ตำแหน่งบนภาพหน้าจอเดิม ใช้ตอนปรับตำแหน่ง 2 จุด
  py          integer,
  contacts    text[] not null default '{}',
  updated_at  timestamptz not null default now()
);

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in ('sos','flood','closed','util','point')),
  building_id  text references public.buildings(id) on delete set null,
  building     text,
  room         text,
  detail       text,
  people       integer check (people is null or (people >= 0 and people <= 2000)),
  phone        text,
  water        integer check (water is null or (water >= 0 and water <= 400)),
  observed_at  timestamptz,
  readings     jsonb not null default '[]',
  lat          double precision,
  lng          double precision,
  service      text,
  status       text not null default 'waiting',
  link         text,
  helpers      jsonb not null default '[]',
  updates      jsonb not null default '[]',
  done_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.reports add column if not exists photos text[] not null default '{}';
create index if not exists reports_created_idx on public.reports (created_at desc);

-- กุญแจลับของผู้แจ้ง/ผู้รับเรื่อง (เก็บแบบแฮช อ่านจากหน้าเว็บไม่ได้)
create table if not exists public.report_keys (
  report_id  uuid not null references public.reports(id) on delete cascade,
  key_hash   text not null,
  role       text not null check (role in ('owner','helper')),
  created_at timestamptz not null default now()
);
create index if not exists report_keys_idx on public.report_keys (report_id);

create table if not exists public.news (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 600),
  url         text,
  source      text,
  building_id text references public.buildings(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- ---------- ฟังก์ชันช่วย ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public._hash(k text) returns text
language sql immutable set search_path = public as $$
  select encode(sha256(convert_to(k, 'UTF8')), 'hex');
$$;

create or replace function public._new_key() returns text
language sql volatile set search_path = public as $$
  select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
$$;

create or replace function public._has_key(p_id uuid, p_key text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(p_key, '') <> '' and exists (
    select 1 from public.report_keys where report_id = p_id and key_hash = public._hash(p_key));
$$;

create or replace function public._log(u jsonb, t text) returns jsonb
language sql immutable as $$
  select coalesce((
    select jsonb_agg(e order by ord) from (
      select e, ord from jsonb_array_elements(coalesce(u,'[]'::jsonb) || jsonb_build_array(jsonb_build_object('t', (extract(epoch from now())*1000)::bigint, 'text', left(t, 300))))
        with ordinality as a(e, ord)
      order by ord desc limit 30) s), '[]'::jsonb);
$$;

-- รับเฉพาะลิงก์รูปที่อยู่ในที่เก็บรูปของเว็บนี้ สูงสุด 4 รูป
create or replace function public._photos(j jsonb) returns text[]
language sql immutable as $$
  select coalesce(array_agg(u), '{}') from (
    select left(u, 500) as u from jsonb_array_elements_text(case when jsonb_typeof(j) = 'array' then j else '[]'::jsonb end) as t(u)
    where u ~ '^https://[^/]+/storage/v1/object/public/photos/' limit 4) s;
$$;

-- ---------- การทำงานของหน้าเว็บ (เรียกผ่าน RPC) ----------

-- แจ้งเหตุใหม่ คืนค่า id และกุญแจของผู้แจ้ง
create or replace function public.create_report(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid; v_key text; v_type text := p->>'type'; v_water int; v_obs timestamptz; v_status text; v_photos text[];
begin
  if v_type not in ('sos','flood','closed','util','point') then raise exception 'ประเภทไม่ถูกต้อง'; end if;
  if v_type = 'flood' then
    v_water := (p->>'water')::int;
    v_obs := coalesce((p->>'observed_at')::timestamptz, now());
    if v_water is null then raise exception 'ต้องระบุระดับน้ำ'; end if;
    if v_obs > now() + interval '10 minutes' then raise exception 'เวลาที่พบอยู่ในอนาคต'; end if;
    if (p->>'lat') is null then raise exception 'ต้องปักหมุดตำแหน่ง'; end if;
  end if;
  v_photos := public._photos(p->'photos');
  v_status := case when v_type = 'point' then coalesce(nullif(p->>'status',''),'open') else 'waiting' end;
  if v_status not in ('waiting','open','paused','out') then v_status := 'waiting'; end if;

  insert into public.reports (type, building_id, building, room, detail, people, phone, water, observed_at, readings, lat, lng, service, status, link, photos)
  values (
    v_type,
    nullif(p->>'building_id',''),
    left(p->>'building', 80),
    left(p->>'room', 30),
    left(p->>'detail', 1500),
    nullif(p->>'people','')::int,
    left(p->>'phone', 30),
    v_water,
    case when v_type = 'flood' then v_obs end,
    case when v_type = 'flood' then jsonb_build_array(jsonb_build_object('cm', v_water, 'at', (extract(epoch from v_obs)*1000)::bigint)) else '[]'::jsonb end,
    nullif(p->>'lat','')::double precision,
    nullif(p->>'lng','')::double precision,
    left(p->>'service', 20),
    v_status,
    left(p->>'link', 400),
    v_photos)
  returning id into v_id;

  v_key := public._new_key();
  insert into public.report_keys (report_id, key_hash, role) values (v_id, public._hash(v_key), 'owner');
  return jsonb_build_object('id', v_id, 'key', v_key);
end $$;

-- รับเรื่อง / ร่วมช่วยเหลือ คืนกุญแจของผู้ช่วยเหลือ
create or replace function public.take_case(p_id uuid, p_name text, p_phone text) returns text
language plpgsql security definer set search_path = public as $$
declare r public.reports; v_key text;
begin
  select * into r from public.reports where id = p_id for update;
  if not found then raise exception 'ไม่พบรายการ'; end if;
  if r.status not in ('waiting','inprogress') then raise exception 'เคสนี้ปิดแล้ว'; end if;
  if coalesce(trim(p_name),'') = '' then raise exception 'ต้องใส่ชื่อผู้ช่วยเหลือ'; end if;
  update public.reports set
    status = 'inprogress',
    helpers = (helpers || jsonb_build_array(jsonb_build_object('name', left(p_name,80), 'phone', left(coalesce(p_phone,''),30), 't', (extract(epoch from now())*1000)::bigint))),
    updates = public._log(updates, left(p_name,80) || ' รับเรื่อง กำลังไปช่วยเหลือ'),
    updated_at = now()
  where id = p_id;
  v_key := public._new_key();
  insert into public.report_keys (report_id, key_hash, role) values (p_id, public._hash(v_key), 'helper');
  return v_key;
end $$;

-- ปิดเคส: เฉพาะผู้แจ้ง ผู้ที่รับเรื่อง หรือผู้ดูแลระบบ
create or replace function public.finish_case(p_id uuid, p_key text) returns void
language plpgsql security definer set search_path = public as $$
declare r public.reports; v_who text;
begin
  select * into r from public.reports where id = p_id for update;
  if not found then raise exception 'ไม่พบรายการ'; end if;
  if not (public._has_key(p_id, p_key) or public.is_admin()) then raise exception 'ปิดเคสได้เฉพาะผู้แจ้งหรือผู้ที่รับเรื่อง'; end if;
  select case role when 'owner' then 'ผู้แจ้ง' else 'ผู้ช่วยเหลือ' end into v_who
    from public.report_keys where report_id = p_id and key_hash = public._hash(coalesce(p_key,'')) limit 1;
  update public.reports set status = 'helped', done_at = now(), updated_at = now(),
    updates = public._log(updates, coalesce(v_who,'ผู้ดูแลระบบ') || 'ยืนยัน: ' || case r.type when 'sos' then 'ช่วยเหลือสำเร็จ' when 'flood' then 'น้ำลดแล้ว' else 'คลี่คลายแล้ว' end)
  where id = p_id;
end $$;

-- เพิ่มข้อความอัปเดต (ทุกคน)
create or replace function public.add_update(p_id uuid, p_text text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(trim(p_text),'') = '' then return; end if;
  update public.reports set updates = public._log(updates, p_text), updated_at = now() where id = p_id;
end $$;

-- เพิ่มค่าระดับน้ำใหม่ที่จุดเดิม (ทุกคน)
create or replace function public.add_reading(p_id uuid, p_cm int, p_at timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare r public.reports; v_readings jsonb; v_last jsonb;
begin
  select * into r from public.reports where id = p_id for update;
  if not found or r.type <> 'flood' then raise exception 'ไม่พบรายงานน้ำท่วม'; end if;
  if r.status not in ('waiting','inprogress') then raise exception 'รายงานนี้ปิดแล้ว'; end if;
  if p_cm is null or p_cm < 0 or p_cm > 400 then raise exception 'ระดับน้ำไม่ถูกต้อง'; end if;
  if p_at is null or p_at > now() + interval '10 minutes' then raise exception 'เวลาที่พบไม่ถูกต้อง'; end if;
  select coalesce(jsonb_agg(e order by (e->>'at')::bigint), '[]'::jsonb) into v_readings from (
    select e from jsonb_array_elements(r.readings || jsonb_build_array(jsonb_build_object('cm', p_cm, 'at', (extract(epoch from p_at)*1000)::bigint))) e
    order by (e->>'at')::bigint desc limit 40) s;
  v_last := v_readings -> (jsonb_array_length(v_readings) - 1);
  update public.reports set readings = v_readings,
    water = (v_last->>'cm')::int,
    observed_at = to_timestamp((v_last->>'at')::bigint / 1000.0),
    updates = public._log(updates, 'ระดับน้ำ ' || p_cm || ' ซม. เมื่อ ' || to_char(p_at at time zone 'Asia/Bangkok', 'DD/MM HH24:MI') || ' น.'),
    updated_at = now()
  where id = p_id;
end $$;

-- เปลี่ยนสถานะจุดช่วยเหลือ (ผู้แจ้งหรือผู้ดูแล)
create or replace function public.set_point_status(p_id uuid, p_key text, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('open','paused','out','closed') then raise exception 'สถานะไม่ถูกต้อง'; end if;
  if not (public._has_key(p_id, p_key) or public.is_admin()) then raise exception 'แก้ได้เฉพาะผู้แจ้งหรือผู้ดูแลระบบ'; end if;
  update public.reports set status = p_status, updated_at = now(),
    updates = public._log(updates, 'สถานะจุดช่วยเหลือ: ' || p_status) where id = p_id and type = 'point';
end $$;

-- เพิ่มรูปภายหลัง (ทุกคน รวมไม่เกิน 12 รูปต่อรายการ)
create or replace function public.add_photos(p_id uuid, p_urls jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare v text[] := public._photos(p_urls);
begin
  if coalesce(array_length(v,1),0) = 0 then return; end if;
  update public.reports set photos = (photos || v)[1:12],
    updates = public._log(updates, 'เพิ่มรูป ' || array_length(v,1) || ' รูป'), updated_at = now()
  where id = p_id;
end $$;

-- ลบรายการ (ผู้แจ้งหรือผู้ดูแล)
create or replace function public.delete_report(p_id uuid, p_key text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_admin() or exists (select 1 from public.report_keys where report_id = p_id and role = 'owner' and key_hash = public._hash(coalesce(p_key,'')))) then
    raise exception 'ลบได้เฉพาะผู้แจ้งหรือผู้ดูแลระบบ';
  end if;
  delete from public.reports where id = p_id;
end $$;

-- ---------- สิทธิ์ (Row Level Security) ----------
alter table public.buildings   enable row level security;
alter table public.reports     enable row level security;
alter table public.report_keys enable row level security;
alter table public.news        enable row level security;
alter table public.admins      enable row level security;

drop policy if exists "อ่านอาคาร" on public.buildings;
create policy "อ่านอาคาร" on public.buildings for select using (true);
drop policy if exists "ผู้ดูแลแก้อาคาร" on public.buildings;
create policy "ผู้ดูแลแก้อาคาร" on public.buildings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "อ่านรายงาน" on public.reports;
create policy "อ่านรายงาน" on public.reports for select using (true);
-- การเพิ่ม/แก้รายงานทำผ่านฟังก์ชันด้านบนเท่านั้น

drop policy if exists "อ่านข่าว" on public.news;
create policy "อ่านข่าว" on public.news for select using (true);
drop policy if exists "ทุกคนโพสต์ข่าว" on public.news;
create policy "ทุกคนโพสต์ข่าว" on public.news for insert with check (char_length(title) between 1 and 600);
drop policy if exists "ผู้ดูแลลบข่าว" on public.news;
create policy "ผู้ดูแลลบข่าว" on public.news for delete to authenticated using (public.is_admin());

drop policy if exists "ดูสิทธิ์ตัวเอง" on public.admins;
create policy "ดูสิทธิ์ตัวเอง" on public.admins for select to authenticated using (user_id = auth.uid());
-- report_keys: ไม่มี policy = หน้าเว็บอ่านไม่ได้เลย

grant usage on schema public to anon, authenticated;
grant select on public.buildings, public.reports, public.news to anon, authenticated;
grant insert on public.news to anon, authenticated;
grant all on public.buildings to authenticated;
grant delete on public.news to authenticated;
grant select on public.admins to authenticated;
revoke all on public.report_keys from anon, authenticated;
grant execute on function public.create_report(jsonb), public.take_case(uuid,text,text), public.finish_case(uuid,text),
  public.add_update(uuid,text), public.add_reading(uuid,int,timestamptz), public.set_point_status(uuid,text,text),
  public.delete_report(uuid,text), public.add_photos(uuid,jsonb), public.is_admin() to anon, authenticated;

-- ---------- ที่เก็บรูป (Storage) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
drop policy if exists "ทุกคนอัปโหลดรูป" on storage.objects;
create policy "ทุกคนอัปโหลดรูป" on storage.objects for insert to anon, authenticated with check (bucket_id = 'photos');
drop policy if exists "ผู้ดูแลลบรูป" on storage.objects;
create policy "ผู้ดูแลลบรูป" on storage.objects for delete to authenticated using (bucket_id = 'photos' and public.is_admin());

-- ---------- อัปเดตสด (Realtime) ----------
do $$ begin
  begin alter publication supabase_realtime add table public.reports; exception when others then null; end;
  begin alter publication supabase_realtime add table public.buildings; exception when others then null; end;
  begin alter publication supabase_realtime add table public.news; exception when others then null; end;
end $$;

-- ---------- อาคารเริ่มต้น 29 ตึก (ตำแหน่งโดยประมาณ ปรับด้วยเครื่องมือ "ปรับตำแหน่ง 2 จุด") ----------
insert into public.buildings (id, name, lat, lng, px, py) values
  ('1', 'อาคาร 1', 13.772189, 100.655118, 1098, 448),
  ('2', 'อาคาร 2', 13.772917, 100.654501, 1040, 378),
  ('3', 'อาคาร 3', 13.773707, 100.654033, 996, 302),
  ('4', 'อาคาร 4', 13.774872, 100.653884, 982, 190),
  ('5', 'อาคาร 5', 13.775808, 100.652927, 892, 100),
  ('7', 'อาคาร 7', 13.774872, 100.650545, 668, 190),
  ('8', 'อาคาร 8', 13.773967, 100.651236, 733, 277),
  ('9', 'อาคาร 9', 13.773395, 100.652225, 826, 332),
  ('10', 'อาคาร 10', 13.772459, 100.652480, 850, 422),
  ('11', 'อาคาร 11', 13.771336, 100.652629, 864, 530),
  ('12', 'อาคาร 12', 13.770670, 100.653310, 928, 594),
  ('13', 'อาคาร 13', 13.772002, 100.650204, 636, 466),
  ('14', 'อาคาร 14', 13.773021, 100.649460, 566, 368),
  ('15', 'อาคาร 15', 13.773458, 100.648970, 520, 326),
  ('16', 'อาคาร 16', 13.774789, 100.647396, 372, 198),
  ('17', 'อาคาร 17', 13.773187, 100.645354, 180, 352),
  ('18', 'อาคาร 18', 13.772199, 100.646014, 242, 447),
  ('19', 'อาคาร 19', 13.771419, 100.646407, 279, 522),
  ('20', 'อาคาร 20', 13.770275, 100.646269, 266, 632),
  ('21', 'อาคาร 21', 13.769620, 100.646747, 311, 695),
  ('22', 'อาคาร 22', 13.768642, 100.648609, 486, 789),
  ('23', 'อาคาร 23', 13.768195, 100.646950, 330, 832),
  ('24', 'อาคาร 24', 13.767831, 100.649151, 537, 867),
  ('25', 'อาคาร 25', 13.767342, 100.648098, 438, 914),
  ('26', 'อาคาร 26', 13.766905, 100.650268, 642, 956),
  ('27', 'อาคาร 27', 13.766843, 100.648609, 486, 962),
  ('28', 'อาคาร 28', 13.766177, 100.650885, 700, 1026),
  ('29', 'อาคาร 29', 13.765761, 100.648928, 516, 1066),
  ('30', 'อาคาร 30', 13.765033, 100.649353, 556, 1136)
on conflict (id) do nothing;
