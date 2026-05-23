# Architecture

## One-line summary

Static HTML/CSS/JS hosted on Railway, talking to Supabase for auth + database, calling OpenAI from a tiny server-side endpoint for the Polish-for-me feature.

## The pieces

```
┌─────────────────────┐         ┌──────────────────┐
│  Member's phone     │         │  Mosh's laptop   │
│  (mobile browser)   │         │  (desktop)       │
└──────────┬──────────┘         └─────────┬────────┘
           │                              │
           │  app.subdomain.com           │  admin.subdomain.com
           │                              │
           ▼                              ▼
┌─────────────────────────────────────────────────┐
│  Railway — serves static HTML/CSS/JS files       │
│  + tiny /api/polish endpoint (proxies OpenAI)    │
└──────────┬──────────────────────────────┬───────┘
           │                              │
           │  Supabase JS SDK             │
           ▼                              │
┌──────────────────────────┐              │
│  Supabase                │              │
│  - Auth (email/password) │              │
│  - Postgres tables       │              │
│  - Row Level Security    │              │
└──────────────────────────┘              │
                                          ▼
                              ┌─────────────────────┐
                              │  OpenAI API         │
                              │  (gpt-4o-mini)      │
                              └─────────────────────┘
```

## Why this stack

- **Vanilla HTML/JS, no React** — zero build step, deploys in seconds, easy to debug on a phone.
- **Supabase, not Railway Postgres** — Supabase ships with auth + Row Level Security. Saves 2-3 weeks of building login from scratch.
- **Railway, not Vercel** — Mosh already has Railway. One bill, one dashboard, fine for static hosting.
- **OpenAI proxied through Railway** — never expose the OpenAI key in client code. The /api/polish endpoint hides the key.

## Data flow examples

**Member completes Day 3:**
1. Member taps "Another win for a creator" in member app.
2. Supabase JS SDK inserts a row into `completions` table.
3. Updates `profiles` row: bronze_day = 4, streak += 1, last_win_date = today.
4. If badge earned (Day 3 = First Wave), inserts into `badges` table.
5. Admin dashboard auto-refreshes via Supabase realtime subscription.

**Member uses Polish for me:**
1. Member pastes a YouTube transcript line into the text box.
2. Member taps "Polish for me."
3. Member app POSTs to `/api/polish` on Railway with `{ text: "..." }`.
4. Railway endpoint calls OpenAI with the system prompt.
5. Railway returns polished text to member app.
6. Member sees rewritten post, copies it, posts to Facebook.

The OpenAI key never touches the member's browser.
