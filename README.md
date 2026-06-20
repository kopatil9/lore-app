# 🎬 Lore — Mission: ATE

> "Every night has lore. Complete your mission. Submit proof. Make it canon."

A mobile-first web app for your birthday party where guests receive secret missions, submit photo/video proof, and the night lives forever as a shared reel.

---

## Tech Stack

- **React + Vite** — fast, lightweight frontend
- **React Router** — client-side routing
- **Supabase** — database, storage, real-time updates
- **Plain CSS** — cinematic dark design, no Tailwind needed

---

## Project Structure

```
lore/
├── index.html
├── vite.config.js
├── package.json
├── .env.example
├── supabase-setup.sql       ← Run this in Supabase SQL editor
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── lib/
    │   └── supabase.js
    ├── styles/
    │   └── global.css
    ├── components/
    │   ├── Layout.jsx
    │   └── EvidenceCard.jsx
    └── pages/
        ├── LandingPage.jsx   → /
        ├── MissionPage.jsx   → /mission
        ├── SubmitPage.jsx    → /submit
        ├── BoardPage.jsx     → /board
        ├── AdminPage.jsx     → /admin
        └── RecapPage.jsx     → /recap
```

---

## Step 1: Supabase Setup

### 1a. Create a project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** — name it `lore`
3. Pick a region close to you, set a DB password (save it)
4. Wait ~2 minutes for it to provision

### 1b. Run the SQL
1. In your project: **SQL Editor → New Query**
2. Paste the entire contents of `supabase-setup.sql`
3. Click **Run**

This creates all 4 tables, RLS policies, seeds the event, and inserts all 15 missions.

### 1c. Create the storage bucket
1. Go to **Storage** in the sidebar
2. Click **New Bucket**
3. Name it exactly: `lore-media`
4. Toggle **Public** to ON
5. Click **Create**

### 1d. Add storage policies
Go to **Storage → Policies** and add:

**Policy 1: Allow uploads**
- Name: `Allow anon uploads`
- Operation: `INSERT`
- Target role: `anon`
- Definition: `true`

**Policy 2: Allow reads**
- Name: `Allow public reads`
- Operation: `SELECT`
- Target role: `anon`
- Definition: `true`

### 1e. Get your API keys
Go to **Project Settings → API** and copy:
- `Project URL` → your `VITE_SUPABASE_URL`
- `anon / public` key → your `VITE_SUPABASE_ANON_KEY`

---

## Step 2: Local Setup

```bash
# Clone / download the project, then:
cd lore

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ADMIN_PASSWORD=makeitsecret
VITE_EVENT_CODE=ATE2024
```

```bash
# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — you're live!

---

## Step 3: Deploy on Vercel (Recommended)

```bash
# Install Vercel CLI (optional)
npm i -g vercel

# Build first to check for errors
npm run build

# Deploy
vercel
```

Or push to GitHub and connect via [vercel.com/new](https://vercel.com/new):

1. Import your repo
2. Framework: **Vite**
3. Add environment variables (same 4 from your `.env`)
4. Click **Deploy**

You'll get a URL like `https://lore-mission-ate.vercel.app`

---

## Step 4: Share with Guests

### Option A: QR Code (Recommended for parties)
1. Get your deployed URL
2. Go to [qr.io](https://qr.io) or [goqr.me](https://goqr.me)
3. Enter your URL and download the QR code
4. Print it out, put it on tables, share in the group chat

### Option B: Direct link
Share `https://your-app.vercel.app` in the party group chat.

Guests just open the link, enter their name, and get their mission automatically.

---

## Pages & Routes

| Route | Who Uses It | What It Does |
|-------|-------------|--------------|
| `/` | Guests | Landing — enter name, get assigned a mission |
| `/mission` | Guests | View your assigned mission |
| `/submit` | Guests | Upload photo/video proof |
| `/board` | Everyone | Live evidence feed with all submissions |
| `/admin` | Host only | Dashboard — view guests, approve, publish |
| `/recap` | Everyone | Final reel page shared at end of night |

---

## Host Instructions (Night-Of)

1. **Before guests arrive:** Open `/admin` on your phone (password = whatever you set in `.env`)
2. **Share the link/QR code** — guests open it and enter their name
3. **Monitor submissions** in the Admin dashboard in real time
4. **At the end of the night:** Hit **"Mission Accomplished"** in Admin → publishes the `/recap` page
5. **Share the `/recap` URL** in the group chat — it's the permanent record

---

## Admin Dashboard Features

- Live stats: total guests / submissions / completed missions
- Per-guest view: who they are, their mission, submission count
- Reassign missions via dropdown (in case someone gets a duplicate or bad one)
- Approve/reject submissions
- Toggle event live/ended
- One-click recap publish

---

## Limitations & What to Build Next

### Current MVP Limitations
- **No true auth** — guests are identified by sessionStorage. If they close the tab, they'd have to re-enter. For the party this is fine.
- **No video export** — the recap is a beautiful web page, not an exportable video.
- **File size** — Supabase free tier allows 50MB per file; large videos may fail. Recommend telling guests to trim clips.
- **No duplicate prevention** — a guest could technically submit multiple times.

### V2 Ideas (Post-Birthday)
- **Export to video** — use `html2canvas` + `ffmpeg.wasm` or a serverless function to stitch the recap into a real MP4
- **Countdown timer** — show a live countdown to midnight
- **Mission categories** — tag missions as solo/group/stealth
- **Reactions** — let guests react/heart other submissions
- **Guest photo strips** — auto-generate a 4-photo collage per guest
- **Confetti on submit** — use `canvas-confetti` for dopamine on submission
- **Push notifications** — Supabase Realtime → notify host when new submission lands

---

## Notes

- The Evidence Board auto-updates in real time using Supabase Realtime subscriptions
- Mission assignment is weighted so popular missions don't get over-assigned
- All media is served from public Supabase Storage URLs (no expiry)
- The recap page is fully shareable via its URL and works without login
# lore-app
