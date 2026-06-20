-- ============================================================
-- LORE — Mission: ATE
-- Supabase SQL Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. EVENTS TABLE
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  is_active boolean default true,
  recap_published boolean default false,
  created_at timestamptz default now()
);

-- 2. MISSIONS TABLE
create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  title text not null,
  description text not null,
  created_at timestamptz default now()
);

-- 3. GUESTS TABLE
create table if not exists guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  name text not null,
  assigned_mission_id uuid references missions(id),
  created_at timestamptz default now()
);

-- 4. SUBMISSIONS TABLE
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  guest_id uuid references guests(id) on delete cascade,
  mission_id uuid references missions(id),
  caption text,
  media_url text,
  media_type text,
  status text default 'approved',
  created_at timestamptz default now()
);

-- ============================================================
-- RLS POLICIES (Row Level Security)
-- ============================================================

alter table events enable row level security;
alter table missions enable row level security;
alter table guests enable row level security;
alter table submissions enable row level security;

-- EVENTS: anyone can read
create policy "Events are public" on events for select using (true);

-- MISSIONS: anyone can read
create policy "Missions are public" on missions for select using (true);

-- GUESTS: anyone can insert and read
create policy "Guests can be created" on guests for insert with check (true);
create policy "Guests are public" on guests for select using (true);
create policy "Guests can be updated" on guests for update using (true);

-- SUBMISSIONS: anyone can insert and read; host can update
create policy "Submissions can be created" on submissions for insert with check (true);
create policy "Submissions are public" on submissions for select using (true);
create policy "Submissions can be updated" on submissions for update using (true);
create policy "Submissions can be deleted" on submissions for delete using (true);

-- ============================================================
-- SEED: CREATE THE EVENT
-- ============================================================

insert into events (name, code, is_active, recap_published)
values ('Mission: ATE', 'ATE2024', true, false);

-- ============================================================
-- SEED: INSERT MISSIONS
-- (Replace the event_id with the UUID from the events table)
-- Run: SELECT id FROM events WHERE code = 'ATE2024';
-- Then replace 'YOUR_EVENT_ID_HERE' below
-- ============================================================

-- HELPER: seed missions using a subquery (run after creating the event)
insert into missions (event_id, title, description)
select
  e.id,
  m.title,
  m.description
from events e,
(values
  ('Main Character Moment', 'Capture someone having their absolute main character moment. You know the look.'),
  ('New Friend Proof', 'Take a selfie with someone you didn''t know before tonight.'),
  ('Toast Starter', 'Get at least three people to do a dramatic, over-the-top toast together.'),
  ('Dance Floor Evidence', 'Film the single best dance move witnessed on the floor tonight.'),
  ('Birthday Hype Squad', 'Get a video of someone fully hyping up the birthday girl.'),
  ('Side Quest Complete', 'Convince someone to complete a mini challenge with you. Document it.'),
  ('Best Dressed Witness', 'Find the person whose outfit deserves its own photo shoot. Take a photo.'),
  ('Party Lore Interview', 'Ask someone: "What''s one piece of lore from tonight?" Record their answer.'),
  ('Candid Canon', 'Capture a candid photo that feels like it belongs in the recap reel.'),
  ('Group Chaos', 'Get a group of at least five people doing the exact same pose in one photo.'),
  ('Signature Move', 'Film someone teaching their signature dance move, start to finish.'),
  ('The Compliment Mission', 'Give three genuine compliments and capture at least one reaction on camera.'),
  ('Find Your Twin', 'Find someone with a similar outfit, vibe, or energy. Take a photo together.'),
  ('Host Appreciation', 'Get someone to say one truly heartfelt thing about the birthday girl on video.'),
  ('Plot Twist', 'Capture the funniest, most unexpected moment of the entire night.')
) as m(title, description)
where e.code = 'ATE2024';

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Go to: Supabase Dashboard → Storage → New Bucket
-- Name: lore-media
-- Public: YES (toggle on)
-- Then add this policy in Storage → Policies:
--
-- Policy name: Allow public uploads
-- Allowed operation: INSERT
-- Target roles: anon, authenticated
-- Policy definition: true
--
-- Policy name: Allow public reads
-- Allowed operation: SELECT
-- Target roles: anon, authenticated
-- Policy definition: true
-- ============================================================
