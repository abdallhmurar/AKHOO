-- SANAD V2: Jerusalem-first civic assistance platform.
-- Additive only: V1 help_requests, profiles, volunteer logic, businesses,
-- offers, memberships and point history remain the source of truth while
-- V2 missions and safety/reward records are layered alongside them.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- V1 request expansion (no existing row is rewritten or removed)
-- ---------------------------------------------------------------------

alter table public.help_requests
  add column if not exists category_id text,
  add column if not exists scenario_id text,
  add column if not exists urgency text not null default 'standard',
  add column if not exists location_accuracy double precision,
  add column if not exists location_label text;

alter table public.help_requests drop constraint if exists help_requests_urgency_check;
alter table public.help_requests add constraint help_requests_urgency_check
  check (urgency in ('standard', 'urgent', 'emergency_redirected'));

-- ---------------------------------------------------------------------
-- Request taxonomy
-- ---------------------------------------------------------------------

create table if not exists public.categories (
  id text primary key,
  slug text not null unique,
  name_ar text not null,
  name_he text not null,
  name_en text not null,
  description_ar text,
  description_he text,
  description_en text,
  icon text,
  color text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scenarios (
  id text primary key,
  category_id text not null references public.categories(id) on delete restrict,
  slug text not null unique,
  name_ar text not null,
  name_he text not null,
  name_en text not null,
  description_ar text,
  description_he text,
  description_en text,
  emergency_level text not null default 'none' check (emergency_level in ('none', 'screen', 'redirect')),
  requires_details boolean not null default true,
  allows_media boolean not null default true,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.categories (id, slug, name_ar, name_he, name_en, description_ar, description_he, description_en, icon, color, sort_order)
values
  ('mobility', 'mobility', 'التنقل', 'ניידות', 'Mobility', 'مساندة للوصول أو الحركة بأمان', 'סיוע בתנועה ובהגעה בטוחה', 'Help moving or getting somewhere safely', 'wheelchair', '#1768E5', 10),
  ('errands', 'errands', 'المهمات اليومية', 'סידורים', 'Errands', 'دواء، مشتريات أو استلام غرض', 'תרופות, קניות או איסוף', 'Medicine, groceries, or a pickup', 'basket', '#147D62', 20),
  ('home_support', 'home-support', 'مساندة منزلية', 'עזרה בבית', 'Home support', 'مهمة منزلية بسيطة وآمنة', 'משימה ביתית פשוטה ובטוחה', 'A simple, safe task at home', 'house', '#1768E5', 30),
  ('accessibility', 'accessibility', 'إتاحة ووصول', 'נגישות', 'Accessibility', 'مساعدة مرتبطة بالإعاقة أو الوصول', 'סיוע הקשור לנגישות או מוגבלות', 'Disability or access-related assistance', 'accessibility', '#147D62', 40),
  ('accompaniment', 'accompaniment', 'مرافقة', 'ליווי', 'Accompaniment', 'مرافقة لموعد أو مكان عام', 'ליווי לתור או למקום ציבורי', 'Company for an appointment or public place', 'users', '#1768E5', 50),
  ('language_help', 'language-help', 'مساعدة لغوية', 'עזרה בשפה', 'Language help', 'ترجمة أو فهم معلومة', 'תרגום או הבנת מידע', 'Translation or understanding information', 'translate', '#147D62', 60),
  ('digital_help', 'digital-help', 'مساعدة رقمية', 'עזרה דיגיטלית', 'Digital help', 'هاتف، نموذج أو خدمة إلكترونية', 'טלפון, טופס או שירות מקוון', 'Phone, form, or online-service support', 'device', '#1768E5', 70),
  ('community_response', 'community-response', 'استجابة مجتمعية', 'מענה קהילתי', 'Community response', 'احتياج محلي يؤثر على أكثر من شخص', 'צורך מקומי שמשפיע על כמה אנשים', 'A local need affecting more than one person', 'community', '#147D62', 80),
  ('other', 'other', 'أخرى', 'אחר', 'Other', 'اشرح ما تحتاجه وسنوجّه الطلب', 'ספרו מה נדרש ונכוון את הבקשה', 'Tell us what is needed and we will route it', 'dots', '#52657A', 90)
on conflict (id) do update set
  slug = excluded.slug,
  name_ar = excluded.name_ar,
  name_he = excluded.name_he,
  name_en = excluded.name_en,
  description_ar = excluded.description_ar,
  description_he = excluded.description_he,
  description_en = excluded.description_en,
  icon = excluded.icon,
  color = excluded.color,
  sort_order = excluded.sort_order;

insert into public.scenarios (id, category_id, slug, name_ar, name_he, name_en, description_ar, description_he, description_en, emergency_level, sort_order)
values
  ('ride_appointment', 'mobility', 'ride-appointment', 'الوصول إلى موعد', 'הגעה לתור', 'Get to an appointment', 'مرافقة أو توصيلة غير طبية', 'ליווי או הסעה לא רפואית', 'Non-medical accompaniment or ride', 'none', 10),
  ('mobility_obstacle', 'mobility', 'mobility-obstacle', 'عائق في الطريق', 'מכשול בדרך', 'Mobility obstacle', 'مساعدة لعبور عائق أو درج', 'עזרה במעבר מכשול או מדרגות', 'Help with a barrier or stairs', 'screen', 20),
  ('medicine_pickup', 'errands', 'medicine-pickup', 'استلام دواء', 'איסוף תרופות', 'Medicine pickup', 'استلام وصفة جاهزة دون نصيحة طبية', 'איסוף מרשם מוכן ללא ייעוץ רפואי', 'Collect a prepared prescription without medical advice', 'screen', 30),
  ('groceries', 'errands', 'groceries', 'مشتريات أساسية', 'קניות חיוניות', 'Essential groceries', 'قائمة قصيرة من متجر قريب', 'רשימה קצרה מחנות קרובה', 'A short list from a nearby shop', 'none', 40),
  ('simple_home_task', 'home_support', 'simple-home-task', 'مهمة منزلية بسيطة', 'משימה ביתית פשוטה', 'Simple home task', 'تبديل مصباح أو تحريك غرض خفيف', 'החלפת נורה או הזזת חפץ קל', 'Change a bulb or move a light item', 'screen', 50),
  ('accessible_entry', 'accessibility', 'accessible-entry', 'دخول أو خروج آمن', 'כניסה או יציאה בטוחה', 'Safe entry or exit', 'مساندة عند مدخل غير مهيأ', 'סיוע בכניסה שאינה נגישה', 'Help at an inaccessible entrance', 'screen', 60),
  ('appointment_companion', 'accompaniment', 'appointment-companion', 'مرافقة إلى موعد', 'ליווי לתור', 'Appointment companion', 'وجود شخص موثوق أثناء الموعد', 'נוכחות אדם מהימן במהלך התור', 'A trusted person to accompany you', 'none', 70),
  ('translate_document', 'language_help', 'translate-document', 'فهم رسالة أو مستند', 'הבנת הודעה או מסמך', 'Understand a message or document', 'شرح عام وليس استشارة قانونية', 'הסבר כללי, לא ייעוץ משפטי', 'General explanation, not legal advice', 'none', 80),
  ('online_form', 'digital_help', 'online-form', 'تعبئة نموذج إلكتروني', 'מילוי טופס מקוון', 'Complete an online form', 'مساندة تقنية مع حماية بياناتك', 'סיוע טכני תוך הגנה על המידע', 'Technical help while protecting your data', 'none', 90),
  ('neighborhood_need', 'community_response', 'neighborhood-need', 'احتياج في الحي', 'צורך שכונתי', 'Neighborhood need', 'تنسيق مساندة محلية غير طارئة', 'תיאום סיוע מקומי שאינו חירום', 'Coordinate a non-emergency local response', 'screen', 100),
  ('other', 'other', 'other-request', 'طلب مختلف', 'בקשה אחרת', 'Something else', 'صف الطلب بوضوح ومن دون معلومات حساسة', 'תארו בבירור בלי מידע רגיש', 'Describe the request without sensitive information', 'screen', 110)
on conflict (id) do update set
  category_id = excluded.category_id,
  name_ar = excluded.name_ar,
  name_he = excluded.name_he,
  name_en = excluded.name_en,
  description_ar = excluded.description_ar,
  description_he = excluded.description_he,
  description_en = excluded.description_en,
  emergency_level = excluded.emergency_level,
  sort_order = excluded.sort_order;

alter table public.help_requests drop constraint if exists help_requests_category_id_fkey;
alter table public.help_requests add constraint help_requests_category_id_fkey foreign key (category_id) references public.categories(id) on delete restrict;
alter table public.help_requests drop constraint if exists help_requests_scenario_id_fkey;
alter table public.help_requests add constraint help_requests_scenario_id_fkey foreign key (scenario_id) references public.scenarios(id) on delete restrict;

-- ---------------------------------------------------------------------
-- Missions, events, messages and private request media
-- ---------------------------------------------------------------------

create table if not exists public.missions (
  id uuid primary key,
  request_id uuid not null unique references public.help_requests(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  helper_id uuid references auth.users(id) on delete set null,
  status text not null default 'matching' check (status in ('matching','assigned','on_the_way','arrived','in_progress','awaiting_confirmation','completed','cancelled','disputed')),
  accepted_at timestamptz,
  started_at timestamptz,
  arrived_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists missions_requester_status_idx on public.missions(requester_id, status, created_at desc);
create index if not exists missions_helper_status_idx on public.missions(helper_id, status, created_at desc);

create table if not exists public.mission_events (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists mission_events_mission_created_idx on public.mission_events(mission_id, created_at);

create table if not exists public.mission_messages (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists mission_messages_mission_created_idx on public.mission_messages(mission_id, created_at);

create table if not exists public.request_media (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.help_requests(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  media_type text not null default 'image' check (media_type in ('image','video','audio')),
  created_at timestamptz not null default now()
);
create index if not exists request_media_request_idx on public.request_media(request_id);

-- Keep a V2 mission shadow for every legacy and future request. Mission ids
-- deliberately equal request ids, preserving existing deep links and RPCs.
create or replace function public.sync_help_request_to_mission()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status text;
begin
  v_status := case new.status
    when 'open' then 'matching'
    when 'accepted' then 'assigned'
    when 'on_the_way' then 'on_the_way'
    when 'arrived' then 'arrived'
    when 'awaiting_confirmation' then 'awaiting_confirmation'
    when 'completed' then 'completed'
    when 'cancelled' then 'cancelled'
    else 'matching'
  end;

  insert into public.missions (
    id, request_id, requester_id, helper_id, status, accepted_at,
    arrived_at, completed_at, cancelled_at, created_at, updated_at
  ) values (
    new.id, new.id, new.requester_id, new.volunteer_id, v_status, new.accepted_at,
    case when new.status in ('arrived','awaiting_confirmation','completed') then coalesce(new.accepted_at, now()) end,
    new.completed_at,
    case when new.status = 'cancelled' then now() end,
    new.created_at, now()
  )
  on conflict (request_id) do update set
    requester_id = excluded.requester_id,
    helper_id = excluded.helper_id,
    status = excluded.status,
    accepted_at = coalesce(public.missions.accepted_at, excluded.accepted_at),
    arrived_at = coalesce(public.missions.arrived_at, excluded.arrived_at),
    completed_at = coalesce(public.missions.completed_at, excluded.completed_at),
    cancelled_at = coalesce(public.missions.cancelled_at, excluded.cancelled_at),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists help_requests_sync_v2_mission on public.help_requests;
create trigger help_requests_sync_v2_mission
after insert or update of status, volunteer_id on public.help_requests
for each row execute procedure public.sync_help_request_to_mission();

insert into public.missions (id, request_id, requester_id, helper_id, status, accepted_at, arrived_at, completed_at, cancelled_at, created_at, updated_at)
select
  hr.id, hr.id, hr.requester_id, hr.volunteer_id,
  case hr.status when 'open' then 'matching' when 'accepted' then 'assigned' else hr.status end,
  hr.accepted_at,
  case when hr.status in ('arrived','awaiting_confirmation','completed') then coalesce(hr.accepted_at, hr.created_at) end,
  hr.completed_at,
  case when hr.status = 'cancelled' then coalesce(hr.completed_at, hr.created_at) end,
  hr.created_at,
  coalesce(hr.completed_at, hr.accepted_at, hr.created_at)
from public.help_requests hr
on conflict (request_id) do nothing;

create or replace function public.record_mission_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event text;
begin
  if tg_op = 'INSERT' then
    v_event := 'created';
  elsif old.status is not distinct from new.status then
    return new;
  else
    v_event := case new.status
      when 'matching' then 'matching_started'
      when 'assigned' then 'assigned'
      when 'on_the_way' then 'on_the_way'
      when 'arrived' then 'arrived'
      when 'in_progress' then 'started'
      when 'awaiting_confirmation' then 'completion_requested'
      when 'completed' then 'completed'
      when 'cancelled' then 'cancelled'
      when 'disputed' then 'disputed'
      else 'updated'
    end;
  end if;
  insert into public.mission_events (mission_id, actor_id, event_type, from_status, to_status)
  values (new.id, auth.uid(), v_event, case when tg_op = 'UPDATE' then old.status end, new.status);
  return new;
end;
$$;

drop trigger if exists missions_record_event on public.missions;
create trigger missions_record_event after insert or update of status on public.missions
for each row execute procedure public.record_mission_event();

-- Record a baseline event for backfilled missions (the trigger was created
-- after the backfill intentionally, avoiding duplicate synthetic events).
insert into public.mission_events (mission_id, event_type, to_status, created_at)
select m.id, 'created', m.status, m.created_at
from public.missions m
where not exists (select 1 from public.mission_events e where e.mission_id = m.id);

-- ---------------------------------------------------------------------
-- Helper capabilities and languages
-- ---------------------------------------------------------------------

create table if not exists public.helper_skills (
  id uuid primary key default gen_random_uuid(),
  helper_id uuid not null references auth.users(id) on delete cascade,
  category_id text not null references public.categories(id) on delete restrict,
  scenario_id text references public.scenarios(id) on delete restrict,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists helper_skills_unique_idx on public.helper_skills(helper_id, category_id, coalesce(scenario_id, ''));
create index if not exists helper_skills_category_idx on public.helper_skills(category_id, helper_id);

create table if not exists public.helper_languages (
  helper_id uuid not null references auth.users(id) on delete cascade,
  language text not null check (language in ('ar','he','en')),
  created_at timestamptz not null default now(),
  primary key (helper_id, language)
);

-- ---------------------------------------------------------------------
-- Devices and in-app notifications
-- ---------------------------------------------------------------------

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null,
  locale text not null default 'ar' check (locale in ('ar','he','en')),
  notifications_enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists devices_user_idx on public.devices(user_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

create or replace function public.notify_mission_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and old.status is not distinct from new.status then return new; end if;
  insert into public.notifications (user_id, type, title, body, data)
  select recipient, 'mission_status', 'SANAD mission update', 'Mission status: ' || new.status,
         jsonb_build_object('missionId', new.id, 'status', new.status)
  from (values (new.requester_id), (new.helper_id)) as recipients(recipient)
  where recipient is not null and recipient <> auth.uid();
  return new;
end;
$$;

drop trigger if exists missions_create_notifications on public.missions;
create trigger missions_create_notifications after insert or update of status on public.missions
for each row execute procedure public.notify_mission_status_change();

-- ---------------------------------------------------------------------
-- Trust and safety
-- ---------------------------------------------------------------------

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (mission_id, author_id)
);
create index if not exists ratings_subject_idx on public.ratings(subject_id, created_at desc);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  mission_id uuid references public.missions(id) on delete set null,
  category text not null check (category in ('safety_concern','harassment','fraud','completion_dispute','other')),
  details text check (details is null or char_length(details) <= 2000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reports_reporter_idx on public.reports(reporter_id, created_at desc);
create index if not exists reports_status_idx on public.reports(status, created_at desc);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  reason text check (reason is null or char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_user_id),
  check (blocker_id <> blocked_user_id)
);
create index if not exists blocks_blocked_idx on public.blocks(blocked_user_id);

-- ---------------------------------------------------------------------
-- Rewards catalog and points redemptions
-- ---------------------------------------------------------------------

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_he text not null,
  title_en text not null,
  description_ar text,
  description_he text,
  description_en text,
  points_cost integer not null check (points_cost > 0),
  image_url text,
  stock integer check (stock is null or stock >= 0),
  market text not null default 'IL' check (market in ('IL','JO')),
  is_active boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists rewards_market_active_idx on public.rewards(market, is_active, points_cost);

create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  points_spent integer not null check (points_spent > 0),
  code text unique,
  status text not null default 'pending' check (status in ('pending','approved','redeemed','cancelled','expired')),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz
);
create index if not exists redemptions_user_created_idx on public.redemptions(user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Server-side access helpers (security-definer, narrow boolean/location)
-- ---------------------------------------------------------------------

create or replace function public.is_mission_participant(p_mission_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.missions m
    where m.id = p_mission_id and auth.uid() in (m.requester_id, m.helper_id)
  )
$$;

create or replace function public.can_read_request_media(p_storage_path text)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.request_media rm
    join public.missions m on m.request_id = rm.request_id
    where rm.storage_path = p_storage_path
      and (rm.owner_id = auth.uid() or m.helper_id = auth.uid() or public.is_admin())
  )
$$;

revoke all on function public.is_mission_participant(uuid) from public;
revoke all on function public.can_read_request_media(text) from public;
grant execute on function public.is_mission_participant(uuid) to authenticated;
grant execute on function public.can_read_request_media(text) to authenticated;

-- ---------------------------------------------------------------------
-- V2 write APIs. Clients cannot directly mutate mission/trust ledgers.
-- ---------------------------------------------------------------------

create or replace function public.create_civic_request(
  p_category_id text,
  p_scenario_id text,
  p_details text,
  p_urgency text,
  p_latitude double precision,
  p_longitude double precision,
  p_location_accuracy double precision default null,
  p_location_label text default null,
  p_media_paths text[] default '{}'
)
returns setof public.help_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_request public.help_requests;
  v_path text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if public.is_banned() then raise exception 'Account is restricted'; end if;
  if p_urgency not in ('standard','urgent') then raise exception 'Emergency requests must use emergency services'; end if;
  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'Invalid location'; end if;
  if coalesce(char_length(trim(p_details)), 0) < 10 or char_length(p_details) > 800 then raise exception 'Request details must contain 10 to 800 characters'; end if;
  if not exists (select 1 from public.categories where id = p_category_id and is_active) then raise exception 'Invalid category'; end if;
  if p_scenario_id is not null and not exists (select 1 from public.scenarios where id = p_scenario_id and category_id = p_category_id and is_active) then raise exception 'Invalid scenario'; end if;
  if cardinality(coalesce(p_media_paths, '{}'::text[])) > 4 then raise exception 'Too many media items'; end if;

  insert into public.help_requests (
    requester_id, service_type, note, latitude, longitude, status,
    category_id, scenario_id, urgency, location_accuracy, location_label
  ) values (
    auth.uid(), 'other', trim(p_details), p_latitude, p_longitude, 'open',
    p_category_id, p_scenario_id, p_urgency, p_location_accuracy,
    nullif(left(trim(coalesce(p_location_label, '')), 200), '')
  ) returning * into v_request;

  foreach v_path in array coalesce(p_media_paths, '{}'::text[]) loop
    if split_part(v_path, '/', 1) <> auth.uid()::text then raise exception 'Invalid media owner'; end if;
    insert into public.request_media (request_id, owner_id, storage_path)
    values (v_request.id, auth.uid(), v_path);
  end loop;
  return next v_request;
end;
$$;

create or replace function public.save_helper_setup(p_skills jsonb, p_languages text[])
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item jsonb;
  v_language text;
  v_category text;
  v_scenario text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if public.is_banned() then raise exception 'Account is restricted'; end if;
  if jsonb_array_length(coalesce(p_skills, '[]'::jsonb)) < 1 then raise exception 'Select at least one skill'; end if;
  if cardinality(coalesce(p_languages, '{}'::text[])) < 1 then raise exception 'Select at least one language'; end if;

  delete from public.helper_skills where helper_id = auth.uid();
  for v_item in select * from jsonb_array_elements(p_skills) loop
    v_category := v_item->>'category_id';
    v_scenario := nullif(v_item->>'scenario_id', '');
    if not exists (select 1 from public.categories where id = v_category and is_active) then raise exception 'Invalid helper skill'; end if;
    if v_scenario is not null and not exists (select 1 from public.scenarios where id = v_scenario and category_id = v_category and is_active) then raise exception 'Invalid helper scenario'; end if;
    insert into public.helper_skills (helper_id, category_id, scenario_id) values (auth.uid(), v_category, v_scenario) on conflict do nothing;
  end loop;

  delete from public.helper_languages where helper_id = auth.uid();
  foreach v_language in array coalesce(p_languages, '{}'::text[]) loop
    if v_language not in ('ar','he','en') then raise exception 'Invalid language'; end if;
    insert into public.helper_languages (helper_id, language) values (auth.uid(), v_language) on conflict do nothing;
  end loop;
  insert into public.volunteer_profiles (user_id, services) values (auth.uid(), array['other']::text[])
  on conflict (user_id) do update set services = array['other']::text[];
end;
$$;

create or replace function public.accept_mission(p_mission_id uuid)
returns setof public.missions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_mission public.missions;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if public.is_banned() then raise exception 'Account is restricted'; end if;
  if not exists (select 1 from public.volunteer_profiles where user_id = auth.uid() and is_available and updated_at > now() - interval '20 minutes') then raise exception 'Helper is not available'; end if;
  if exists (select 1 from public.missions where helper_id = auth.uid() and status not in ('completed','cancelled','disputed')) then raise exception 'Complete your active mission first'; end if;

  select * into v_mission from public.missions where id = p_mission_id for update;
  if v_mission.id is null or v_mission.status <> 'matching' or v_mission.helper_id is not null then raise exception 'Mission is no longer available'; end if;
  if v_mission.requester_id = auth.uid() then raise exception 'Cannot accept your own request'; end if;
  if exists (select 1 from public.blocks b where (b.blocker_id = auth.uid() and b.blocked_user_id = v_mission.requester_id) or (b.blocker_id = v_mission.requester_id and b.blocked_user_id = auth.uid())) then raise exception 'Mission is not available'; end if;
  if not exists (
    select 1
    from public.help_requests hr
    join public.volunteer_profiles vp on vp.user_id = auth.uid()
    where hr.id = v_mission.request_id
      and 2 * 6371 * asin(sqrt(
        sin(radians((hr.latitude - vp.latitude) / 2)) ^ 2
        + cos(radians(vp.latitude)) * cos(radians(hr.latitude))
          * sin(radians((hr.longitude - vp.longitude) / 2)) ^ 2
      )) <= 20
      and (hr.category_id is null or exists (
        select 1 from public.helper_skills hs
        where hs.helper_id = auth.uid() and hs.category_id = hr.category_id
      ))
  ) then raise exception 'Mission does not match helper location or skills'; end if;

  update public.help_requests set volunteer_id = auth.uid(), status = 'accepted', accepted_at = now()
  where id = v_mission.request_id and status = 'open';
  if not found then raise exception 'Mission is no longer available'; end if;
  return query select * from public.missions where id = p_mission_id;
end;
$$;

create or replace function public.advance_mission(p_mission_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_mission public.missions;
begin
  select * into v_mission from public.missions where id = p_mission_id and helper_id = auth.uid() for update;
  if v_mission.id is null then raise exception 'Mission not found'; end if;
  if public.is_banned() then raise exception 'Account is restricted'; end if;
  if not ((v_mission.status = 'assigned' and p_status = 'on_the_way') or
          (v_mission.status = 'on_the_way' and p_status = 'arrived') or
          (v_mission.status = 'arrived' and p_status = 'in_progress') or
          (v_mission.status = 'in_progress' and p_status = 'awaiting_confirmation')) then
    raise exception 'Invalid mission transition';
  end if;

  if p_status = 'in_progress' then
    update public.missions set status = p_status, started_at = now(), updated_at = now() where id = p_mission_id;
  else
    update public.help_requests set status = p_status,
      awaiting_confirmation_at = case when p_status = 'awaiting_confirmation' then now() else awaiting_confirmation_at end
    where id = v_mission.request_id;
    update public.missions set
      status = p_status,
      arrived_at = case when p_status = 'arrived' then now() else arrived_at end,
      updated_at = now()
    where id = p_mission_id;
  end if;
end;
$$;

create or replace function public.confirm_mission_completion(p_mission_id uuid, p_confirmed boolean)
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_mission public.missions;
  v_points integer;
begin
  if public.is_banned() then raise exception 'Account is restricted'; end if;
  select * into v_mission from public.missions where id = p_mission_id and requester_id = auth.uid() for update;
  if v_mission.id is null or v_mission.status <> 'awaiting_confirmation' then raise exception 'Mission is not awaiting confirmation'; end if;
  if p_confirmed then
    update public.help_requests set status = 'completed', completed_at = now() where id = v_mission.request_id;
    select coalesce((select value::integer from private.app_settings where key = 'points_per_mission'), 10) into v_points;
    if v_mission.helper_id is not null then
      insert into public.volunteer_point_transactions (volunteer_id, request_id, points, reason)
      values (v_mission.helper_id, v_mission.request_id, v_points, 'completed_verified_mission')
      on conflict (request_id, reason) do nothing;
    end if;
  else
    update public.help_requests set status = 'arrived', confirmation_rejected_at = now() where id = v_mission.request_id;
    update public.missions set status = 'in_progress', updated_at = now() where id = p_mission_id;
  end if;
end;
$$;

create or replace function public.cancel_mission(p_mission_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_mission public.missions;
begin
  if public.is_banned() then raise exception 'Account is restricted'; end if;
  select * into v_mission from public.missions where id = p_mission_id for update;
  if v_mission.id is null or v_mission.requester_id <> auth.uid() then raise exception 'Mission not found'; end if;
  if v_mission.status not in ('matching','assigned','on_the_way') then raise exception 'Mission can no longer be cancelled here'; end if;
  update public.help_requests set status = 'cancelled' where id = v_mission.request_id;
  insert into public.mission_events (mission_id, actor_id, event_type, metadata)
  values (p_mission_id, auth.uid(), 'cancel_reason', jsonb_build_object('reason', left(coalesce(p_reason, ''), 500)));
end;
$$;

create or replace function public.send_mission_message(p_mission_id uuid, p_body text)
returns setof public.mission_messages
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.is_banned() then raise exception 'Account is restricted'; end if;
  if not public.is_mission_participant(p_mission_id) then raise exception 'Not a mission participant'; end if;
  if coalesce(char_length(trim(p_body)), 0) < 1 or char_length(p_body) > 1000 then raise exception 'Message must contain 1 to 1000 characters'; end if;
  return query insert into public.mission_messages (mission_id, sender_id, body)
    values (p_mission_id, auth.uid(), trim(p_body)) returning *;
end;
$$;

create or replace function public.get_mission_helper_location(p_mission_id uuid)
returns table (latitude double precision, longitude double precision, updated_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
stable
as $$
begin
  if not public.is_mission_participant(p_mission_id) then raise exception 'Not a mission participant'; end if;
  return query select vp.latitude, vp.longitude, vp.updated_at
  from public.missions m join public.volunteer_profiles vp on vp.user_id = m.helper_id
  where m.id = p_mission_id;
end;
$$;

create or replace function public.submit_mission_rating(p_mission_id uuid, p_subject_id uuid, p_score integer, p_comment text default null, p_tags text[] default '{}')
returns setof public.ratings
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.is_banned() then raise exception 'Account is restricted'; end if;
  if p_score not between 1 and 5 then raise exception 'Rating must be between 1 and 5'; end if;
  if not exists (select 1 from public.missions m where m.id = p_mission_id and m.status = 'completed' and auth.uid() in (m.requester_id, m.helper_id) and p_subject_id in (m.requester_id, m.helper_id) and p_subject_id <> auth.uid()) then raise exception 'Invalid mission rating'; end if;
  return query insert into public.ratings (mission_id, author_id, subject_id, score, comment, tags)
    values (p_mission_id, auth.uid(), p_subject_id, p_score, nullif(left(trim(coalesce(p_comment, '')), 1000), ''), p_tags)
    on conflict (mission_id, author_id) do update set score = excluded.score, comment = excluded.comment, tags = excluded.tags
    returning *;
end;
$$;

create or replace function public.submit_safety_report(p_mission_id uuid default null, p_reported_user_id uuid default null, p_category text default 'safety_concern', p_details text default null)
returns setof public.reports
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if p_category not in ('safety_concern','harassment','fraud','completion_dispute','other') then raise exception 'Invalid report category'; end if;
  if p_mission_id is not null and not public.is_mission_participant(p_mission_id) then raise exception 'Not a mission participant'; end if;
  return query insert into public.reports (reporter_id, reported_user_id, mission_id, category, details)
    values (auth.uid(), p_reported_user_id, p_mission_id, p_category, nullif(left(trim(coalesce(p_details, '')), 2000), '')) returning *;
end;
$$;

create or replace function public.dispute_mission(p_mission_id uuid, p_details text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_other uuid;
begin
  if public.is_banned() then raise exception 'Account is restricted'; end if;
  if not exists (select 1 from public.missions where id = p_mission_id and status = 'awaiting_confirmation' and auth.uid() in (requester_id, helper_id)) then raise exception 'Mission cannot be disputed'; end if;
  select case when requester_id = auth.uid() then helper_id else requester_id end into v_other from public.missions where id = p_mission_id;
  update public.missions set status = 'disputed', updated_at = now() where id = p_mission_id;
  insert into public.reports (reporter_id, reported_user_id, mission_id, category, details)
  values (auth.uid(), v_other, p_mission_id, 'completion_dispute', nullif(left(trim(coalesce(p_details, '')), 2000), ''));
end;
$$;

create or replace function public.block_user(p_blocked_user_id uuid, p_reason text default null)
returns setof public.blocks
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or p_blocked_user_id = auth.uid() then raise exception 'Invalid blocked user'; end if;
  return query insert into public.blocks (blocker_id, blocked_user_id, reason)
    values (auth.uid(), p_blocked_user_id, nullif(left(trim(coalesce(p_reason, '')), 500), ''))
    on conflict (blocker_id, blocked_user_id) do update set reason = excluded.reason
    returning *;
end;
$$;

create or replace function public.redeem_reward(p_reward_id uuid)
returns setof public.redemptions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reward public.rewards;
  v_earned integer;
  v_spent integer;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if public.is_banned() then raise exception 'Account is restricted'; end if;
  select * into v_reward from public.rewards where id = p_reward_id and is_active and (valid_from is null or valid_from <= now()) and (valid_until is null or valid_until >= now()) for update;
  if v_reward.id is null or v_reward.stock = 0 then raise exception 'Reward is unavailable'; end if;
  select coalesce(sum(points), 0) into v_earned from public.volunteer_point_transactions where volunteer_id = auth.uid();
  select coalesce(sum(points_spent), 0) into v_spent from public.redemptions where user_id = auth.uid() and status not in ('cancelled','expired');
  if v_earned - v_spent < v_reward.points_cost then raise exception 'Not enough points'; end if;
  if v_reward.stock is not null then update public.rewards set stock = stock - 1 where id = v_reward.id; end if;
  return query insert into public.redemptions (reward_id, user_id, points_spent, code, status)
    values (v_reward.id, auth.uid(), v_reward.points_cost, upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)), 'approved') returning *;
end;
$$;

create or replace function public.redeem_offer(p_offer_id uuid)
returns setof public.offer_redemptions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_offer public.partner_offers;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if public.is_banned() then raise exception 'Account is restricted'; end if;
  select po.* into v_offer from public.partner_offers po join public.partners p on p.id = po.partner_id
  where po.id = p_offer_id and po.status = 'approved' and p.status = 'verified' and p.is_active
    and (po.valid_from is null or po.valid_from <= now()) and (po.valid_until is null or po.valid_until >= now());
  if v_offer.id is null then raise exception 'Offer is unavailable'; end if;
  if v_offer.member_only and not exists (select 1 from public.memberships where user_id = auth.uid() and plan = 'sanad_plus' and status = 'active' and (expires_at is null or expires_at > now())) then raise exception 'SANAD+ membership required'; end if;
  if exists (select 1 from public.offer_redemptions where user_id = auth.uid() and offer_id = p_offer_id and status in ('active','redeemed')) then raise exception 'Offer already redeemed'; end if;
  return query insert into public.offer_redemptions (offer_id, partner_id, user_id, code, status, expires_at)
    values (v_offer.id, v_offer.partner_id, auth.uid(), upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)), 'active', least(coalesce(v_offer.valid_until, now() + interval '30 days'), now() + interval '30 days')) returning *;
end;
$$;

create or replace function public.request_sanad_plus_membership(p_market text default 'IL')
returns setof public.memberships
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if public.is_banned() then raise exception 'Account is restricted'; end if;
  if p_market not in ('IL','JO','jerusalem') then raise exception 'Unsupported market'; end if;
  if exists (select 1 from public.memberships where user_id = auth.uid() and plan = 'sanad_plus' and status in ('pending','active')) then
    return query select * from public.memberships where user_id = auth.uid() and plan = 'sanad_plus' and status in ('pending','active') order by created_at desc limit 1;
    return;
  end if;
  return query insert into public.memberships (user_id, plan, market, currency, amount, status, auto_renew)
    values (auth.uid(), 'sanad_plus', case when p_market = 'JO' then 'JO' else 'IL' end, case when p_market = 'JO' then 'JOD' else 'ILS' end, case when p_market = 'JO' then 4.000 else 19.000 end, 'pending', false)
    returning *;
end;
$$;

-- Lock down function execution. Only signed-in clients receive access.
revoke all on function public.create_civic_request(text,text,text,text,double precision,double precision,double precision,text,text[]) from public;
revoke all on function public.save_helper_setup(jsonb,text[]) from public;
revoke all on function public.accept_mission(uuid) from public;
revoke all on function public.advance_mission(uuid,text) from public;
revoke all on function public.confirm_mission_completion(uuid,boolean) from public;
revoke all on function public.cancel_mission(uuid,text) from public;
revoke all on function public.send_mission_message(uuid,text) from public;
revoke all on function public.get_mission_helper_location(uuid) from public;
revoke all on function public.submit_mission_rating(uuid,uuid,integer,text,text[]) from public;
revoke all on function public.submit_safety_report(uuid,uuid,text,text) from public;
revoke all on function public.dispute_mission(uuid,text) from public;
revoke all on function public.block_user(uuid,text) from public;
revoke all on function public.redeem_reward(uuid) from public;
revoke all on function public.redeem_offer(uuid) from public;
revoke all on function public.request_sanad_plus_membership(text) from public;

grant execute on function public.create_civic_request(text,text,text,text,double precision,double precision,double precision,text,text[]) to authenticated;
grant execute on function public.save_helper_setup(jsonb,text[]) to authenticated;
grant execute on function public.accept_mission(uuid) to authenticated;
grant execute on function public.advance_mission(uuid,text) to authenticated;
grant execute on function public.confirm_mission_completion(uuid,boolean) to authenticated;
grant execute on function public.cancel_mission(uuid,text) to authenticated;
grant execute on function public.send_mission_message(uuid,text) to authenticated;
grant execute on function public.get_mission_helper_location(uuid) to authenticated;
grant execute on function public.submit_mission_rating(uuid,uuid,integer,text,text[]) to authenticated;
grant execute on function public.submit_safety_report(uuid,uuid,text,text) to authenticated;
grant execute on function public.dispute_mission(uuid,text) to authenticated;
grant execute on function public.block_user(uuid,text) to authenticated;
grant execute on function public.redeem_reward(uuid) to authenticated;
grant execute on function public.redeem_offer(uuid) to authenticated;
grant execute on function public.request_sanad_plus_membership(text) to authenticated;

-- ---------------------------------------------------------------------
-- RLS and direct grants
-- ---------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.scenarios enable row level security;
alter table public.missions enable row level security;
alter table public.mission_events enable row level security;
alter table public.mission_messages enable row level security;
alter table public.request_media enable row level security;
alter table public.helper_skills enable row level security;
alter table public.helper_languages enable row level security;
alter table public.devices enable row level security;
alter table public.notifications enable row level security;
alter table public.ratings enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.rewards enable row level security;
alter table public.redemptions enable row level security;

-- Extend V1 request visibility with V2 skills and mutual blocking while
-- preserving the same strict distance/availability boundary.
drop policy if exists "request read relevant" on public.help_requests;
create policy "request read relevant" on public.help_requests for select to authenticated using (
  requester_id = auth.uid()
  or volunteer_id = auth.uid()
  or (
    status = 'open'
    and not public.is_banned()
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_user_id = help_requests.requester_id)
         or (b.blocker_id = help_requests.requester_id and b.blocked_user_id = auth.uid())
    )
    and not exists (
      select 1 from public.help_request_releases r
      where r.request_id = help_requests.id and r.volunteer_id = auth.uid()
    )
    and exists (
      select 1 from public.volunteer_profiles vp
      where vp.user_id = auth.uid()
        and vp.is_available
        and vp.updated_at > now() - interval '20 minutes'
        and vp.latitude is not null and vp.longitude is not null
        and 2 * 6371 * asin(sqrt(
          sin(radians((help_requests.latitude - vp.latitude) / 2)) ^ 2
          + cos(radians(vp.latitude)) * cos(radians(help_requests.latitude))
            * sin(radians((help_requests.longitude - vp.longitude) / 2)) ^ 2
        )) <= 20
    )
    and (
      help_requests.category_id is null
      or exists (
        select 1 from public.helper_skills hs
        where hs.helper_id = auth.uid() and hs.category_id = help_requests.category_id
      )
    )
  )
);

drop policy if exists "categories read active" on public.categories;
drop policy if exists "scenarios read active" on public.scenarios;
drop policy if exists "missions read relevant" on public.missions;
drop policy if exists "mission events read participants" on public.mission_events;
drop policy if exists "mission messages read participants" on public.mission_messages;
drop policy if exists "request media read participants" on public.request_media;
drop policy if exists "helper skills read self" on public.helper_skills;
drop policy if exists "helper languages read self" on public.helper_languages;
drop policy if exists "devices manage self" on public.devices;
drop policy if exists "notifications read self" on public.notifications;
drop policy if exists "notifications update self" on public.notifications;
drop policy if exists "ratings read involved" on public.ratings;
drop policy if exists "reports read reporter" on public.reports;
drop policy if exists "blocks read self" on public.blocks;
drop policy if exists "blocks delete self" on public.blocks;
drop policy if exists "rewards read active" on public.rewards;
drop policy if exists "redemptions read self" on public.redemptions;

create policy "categories read active" on public.categories for select to authenticated using (is_active or public.is_admin());
create policy "scenarios read active" on public.scenarios for select to authenticated using (is_active or public.is_admin());

create policy "missions read relevant" on public.missions for select to authenticated using (
  requester_id = auth.uid() or helper_id = auth.uid() or public.is_admin()
  or (
    status = 'matching'
    and exists (
      select 1
      from public.volunteer_profiles vp
      join public.help_requests hr on hr.id = missions.request_id
      where vp.user_id = auth.uid()
        and vp.is_available
        and vp.updated_at > now() - interval '20 minutes'
        and vp.latitude is not null and vp.longitude is not null
        and 2 * 6371 * asin(sqrt(
          sin(radians((hr.latitude - vp.latitude) / 2)) ^ 2
          + cos(radians(vp.latitude)) * cos(radians(hr.latitude))
            * sin(radians((hr.longitude - vp.longitude) / 2)) ^ 2
        )) <= 20
        and (hr.category_id is null or exists (
          select 1 from public.helper_skills hs
          where hs.helper_id = auth.uid() and hs.category_id = hr.category_id
        ))
    )
    and not exists (select 1 from public.blocks b where (b.blocker_id = auth.uid() and b.blocked_user_id = missions.requester_id) or (b.blocker_id = missions.requester_id and b.blocked_user_id = auth.uid()))
  )
);
create policy "mission events read participants" on public.mission_events for select to authenticated using (public.is_mission_participant(mission_id) or public.is_admin());
create policy "mission messages read participants" on public.mission_messages for select to authenticated using (public.is_mission_participant(mission_id) or public.is_admin());
create policy "request media read participants" on public.request_media for select to authenticated using (owner_id = auth.uid() or public.is_mission_participant(request_id) or public.is_admin());

create policy "helper skills read self" on public.helper_skills for select to authenticated using (helper_id = auth.uid() or public.is_admin());
create policy "helper languages read self" on public.helper_languages for select to authenticated using (helper_id = auth.uid() or public.is_admin());
create policy "devices manage self" on public.devices for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications read self" on public.notifications for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "notifications update self" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ratings read involved" on public.ratings for select to authenticated using (author_id = auth.uid() or subject_id = auth.uid() or public.is_admin());
create policy "reports read reporter" on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_admin());
create policy "blocks read self" on public.blocks for select to authenticated using (blocker_id = auth.uid() or public.is_admin());
create policy "blocks delete self" on public.blocks for delete to authenticated using (blocker_id = auth.uid());
create policy "rewards read active" on public.rewards for select to authenticated using (is_active or public.is_admin());
create policy "redemptions read self" on public.redemptions for select to authenticated using (user_id = auth.uid() or public.is_admin());

grant select on public.categories, public.scenarios, public.missions, public.mission_events, public.mission_messages, public.request_media,
  public.helper_skills, public.helper_languages, public.notifications, public.ratings, public.reports, public.blocks, public.rewards, public.redemptions to authenticated;
grant insert, update on public.devices to authenticated;
grant select on public.devices to authenticated;
grant update on public.notifications to authenticated;
grant delete on public.blocks to authenticated;

-- Private request media. Existing public request-photos data remains
-- untouched for V1, while every V2 upload uses this private bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-media',
  'request-media',
  false,
  10485760,
  array['image/jpeg','image/png','image/webp','video/mp4','audio/m4a','audio/mp4','audio/mpeg']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "request media storage owner insert" on storage.objects;
drop policy if exists "request media storage participant read" on storage.objects;
drop policy if exists "request media storage owner delete" on storage.objects;

create policy "request media storage owner insert" on storage.objects for insert to authenticated with check (
  bucket_id = 'request-media' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "request media storage participant read" on storage.objects for select to authenticated using (
  bucket_id = 'request-media' and (auth.uid()::text = (storage.foldername(name))[1] or public.can_read_request_media(name))
);
create policy "request media storage owner delete" on storage.objects for delete to authenticated using (
  bucket_id = 'request-media' and auth.uid()::text = (storage.foldername(name))[1]
);

-- Realtime is additive and idempotent.
do $$
declare
  v_table text;
begin
  foreach v_table in array array['missions','mission_events','mission_messages','notifications'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = v_table) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end $$;

-- Standard updated_at triggers reuse the existing safe helper from 0008.
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories for each row execute procedure public.set_updated_at();
drop trigger if exists scenarios_set_updated_at on public.scenarios;
create trigger scenarios_set_updated_at before update on public.scenarios for each row execute procedure public.set_updated_at();
drop trigger if exists missions_set_updated_at on public.missions;
create trigger missions_set_updated_at before update on public.missions for each row execute procedure public.set_updated_at();
drop trigger if exists devices_set_updated_at on public.devices;
create trigger devices_set_updated_at before update on public.devices for each row execute procedure public.set_updated_at();
drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at before update on public.reports for each row execute procedure public.set_updated_at();
drop trigger if exists rewards_set_updated_at on public.rewards;
create trigger rewards_set_updated_at before update on public.rewards for each row execute procedure public.set_updated_at();
